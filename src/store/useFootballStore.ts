import { create } from 'zustand'
import {
  LiveMatch,
  ContentQueueItem,
  mapAPIFixture,
  shouldAutoPromote,
  generateGoalCaption,
  TEAMS,
  COMPETITIONS,
  calculatePriority,
  getRivalryScore,
  getAIRecommendation,
  generateAISignals,
} from '@/lib/football'
import type { CachedFixture } from '@/lib/fixtures-cache'

// ─── CachedFixture → LiveMatch mapper ────────────────────────────────────────
// The Redis cache stores minimal CachedFixture objects; this converts them to
// LiveMatch so the rest of the codebase works unchanged.

function cachedToLiveMatch(f: CachedFixture): LiveMatch {
  // Resolve full team objects from registry (fallback to minimal if unknown)
  const homeTeam = TEAMS[f.homeTeam.id] ?? {
    id: f.homeTeam.id, name: f.homeTeam.name, shortName: f.homeTeam.shortName,
    emoji: f.homeTeam.emoji, country: 'INT', tier: 3 as const, basePriority: 50,
  }
  const awayTeam = TEAMS[f.awayTeam.id] ?? {
    id: f.awayTeam.id, name: f.awayTeam.name, shortName: f.awayTeam.shortName,
    emoji: f.awayTeam.emoji, country: 'INT', tier: 3 as const, basePriority: 50,
  }
  const competition = COMPETITIONS[f.competition.id] ?? {
    id: f.competition.id, name: f.competition.name, shortName: f.competition.shortName,
    emoji: f.competition.emoji, country: 'INT', tier: 2 as const, basePriority: 60,
  }

  const isBrazilNT = !!(homeTeam.isBrazilNationalTeam || awayTeam.isBrazilNationalTeam)
  const isWorldCup = !!(competition.isWorldCup)
  const isWCQ = !!(competition.isWorldCupQualifier)
  const rivalryScore = getRivalryScore(homeTeam.id, awayTeam.id)
  const trendScore = isBrazilNT ? 95 : isWorldCup ? 90 : rivalryScore >= 90 ? 80 : 60
  const priorityScore = calculatePriority(homeTeam, awayTeam, competition, f.status, trendScore)

  const partial: LiveMatch = {
    id: f.id,
    homeTeam, awayTeam, competition,
    status: f.status,
    score: { ...f.score },
    minute: f.minute,
    events: [],   // events are delivered via SSE GoalEvents, not stored in cache
    priorityScore, trendScore,
    audienceScore: Math.min(100, Math.round(priorityScore * 0.95)),
    rivalryScore,
    aiRecommendation: '',
    aiSignals: [],
    inWarRoom: false,
    kickoffLabel: f.kickoffLabel,
    isBrazilNationalTeam: isBrazilNT,
    isWorldCup,
    isWorldCupQualifier: isWCQ,
  }
  partial.aiRecommendation = getAIRecommendation(partial)
  partial.aiSignals = generateAISignals(partial)
  return partial
}

function isCachedFixture(item: unknown): item is CachedFixture {
  const f = item as Record<string, unknown>
  return typeof f?.kickoffTs === 'number' && typeof f?.updatedAt === 'number'
}

// ─── Module-level ticker (survives StrictMode double-mount) ───────────────────

let _tickerId: ReturnType<typeof setInterval> | null = null

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface FootballState {
  matches: LiveMatch[]
  contentQueue: ContentQueueItem[]
  initialized: boolean
  apiConnected: boolean   // false = no API key configured
  loading: boolean
  error: string | null
  lastUpdated: number | null

  // Lifecycle
  init: () => void
  destroy: () => void

  // Match control
  promoteToWarRoom: (id: string) => void
  dismissFromWarRoom: (id: string) => void

  // Queue control
  addQueueItem: (item: ContentQueueItem) => void
  updateQueueItemStatus: (id: string, status: ContentQueueItem['status']) => void
  removeQueueItem: (id: string) => void
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * Primary: read from Redis-backed cache (server-side cron populates this).
 * Returns normalized CachedFixture[] that can be mapped to LiveMatch.
 */
async function fetchFromCache(): Promise<{ fixtures: unknown[]; connected: boolean; error: string | null }> {
  try {
    const res = await fetch('/api/sports/fixtures', { cache: 'no-store' })
    if (!res.ok) return { fixtures: [], connected: false, error: 'CACHE_ERROR' }
    const fixtures = await res.json() as unknown[]
    return { fixtures, connected: true, error: null }
  } catch {
    return { fixtures: [], connected: false, error: 'NETWORK_ERROR' }
  }
}

/**
 * Fallback: read directly from API-Football via existing route.
 * Used only when cache returns 0 fixtures (e.g. first deploy before cron runs).
 */
async function fetchLiveFallback(): Promise<{ fixtures: unknown[]; connected: boolean; error: string | null }> {
  try {
    const [liveRes, upcomingRes] = await Promise.all([
      fetch('/api/football/live', { cache: 'no-store' }),
      fetch('/api/football/upcoming', { cache: 'no-store' }),
    ])
    const [liveData, upcomingData] = await Promise.all([
      liveRes.json() as Promise<{ fixtures: unknown[]; connected: boolean; error: string | null }>,
      upcomingRes.json() as Promise<{ fixtures: unknown[]; connected: boolean; error: string | null }>,
    ])
    const all = [...(liveData.fixtures ?? []), ...(upcomingData.fixtures ?? [])]
    return { fixtures: all, connected: liveData.connected, error: liveData.error }
  } catch {
    return { fixtures: [], connected: false, error: 'NETWORK_ERROR' }
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFootballStore = create<FootballState>((set, get) => ({
  matches: [],
  contentQueue: [],
  initialized: false,
  apiConnected: false,
  loading: false,
  error: null,
  lastUpdated: null,

  init() {
    if (_tickerId !== null) return
    set({ loading: true, initialized: true })

    // Poll cache every 5 min — data is kept fresh server-side by Vercel Cron.
    // Much cheaper than the old 60s browser polling: 1 Redis read vs 2 API-Football calls.
    const pollInterval = 5 * 60_000

    const tick = async () => {
      try {
        // Try Redis cache first; fall back to direct API if cache is empty
        let data = await fetchFromCache()
        if (data.connected && data.fixtures.length === 0) {
          data = await fetchLiveFallback()
        }

        if (!data.connected) {
          set({ apiConnected: false, loading: false, error: data.error })
          return
        }

        // Route through the appropriate mapper:
        // - CachedFixture (from /api/sports/fixtures) → cachedToLiveMatch
        // - Raw API-Football response (from fallback) → mapAPIFixture
        const allMatches = (data.fixtures ?? [])
          .map(item => isCachedFixture(item) ? cachedToLiveMatch(item) : mapAPIFixture(item))
          .filter((m): m is LiveMatch => m !== null)

        // Dedup by fixture ID
        const seen = new Set<string>()
        const deduped = allMatches.filter(m => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })

        // Preserve War Room state + detect new goals for caption queue
        const { matches: current } = get()
        const newItems: ContentQueueItem[] = []

        const updated = deduped.map(m => {
          const existing = current.find(e => e.id === m.id)
          const inWarRoom = existing?.inWarRoom ?? shouldAutoPromote(m)

          if (existing) {
            const prevGoalIds = new Set(
              existing.events.filter(e => e.type === 'goal').map(e => e.id)
            )
            m.events
              .filter(e => e.type === 'goal' && !prevGoalIds.has(e.id))
              .forEach(goal => {
                newItems.push(generateGoalCaption(m, goal.team, goal.player))
              })
          }

          return { ...m, inWarRoom }
        })

        set(state => ({
          matches: updated,
          apiConnected: true,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          contentQueue: newItems.length > 0
            ? [...newItems, ...state.contentQueue].slice(0, 30)
            : state.contentQueue,
        }))

        newItems.forEach(item => {
          const delay = 3000 + Math.random() * 2000
          setTimeout(() => {
            set(s => ({
              contentQueue: s.contentQueue.map(q =>
                q.id === item.id && q.status === 'generating'
                  ? { ...q, status: 'ready' }
                  : q
              ),
            }))
          }, delay)
        })
      } catch {
        set(s => ({
          loading: false,
          error: 'FETCH_ERROR',
          initialized: s.initialized,
        }))
      }
    }

    tick()
    _tickerId = setInterval(tick, pollInterval)
  },

  destroy() {
    if (_tickerId !== null) {
      clearInterval(_tickerId)
      _tickerId = null
    }
    set({ initialized: false })
  },

  promoteToWarRoom(id) {
    set(state => ({
      matches: state.matches.map(m => m.id === id ? { ...m, inWarRoom: true } : m),
    }))
  },

  dismissFromWarRoom(id) {
    const match = get().matches.find(m => m.id === id)
    if (!match) return
    if (match.isBrazilNationalTeam || match.isWorldCup) return
    set(state => ({
      matches: state.matches.map(m => m.id === id ? { ...m, inWarRoom: false } : m),
    }))
  },

  addQueueItem(item) {
    set(state => ({
      contentQueue: [item, ...state.contentQueue].slice(0, 30),
    }))
    const delay = 3000 + Math.random() * 2000
    setTimeout(() => {
      set(s => ({
        contentQueue: s.contentQueue.map(q =>
          q.id === item.id && q.status === 'generating'
            ? { ...q, status: 'ready' }
            : q
        ),
      }))
    }, delay)
  },

  updateQueueItemStatus(id, status) {
    set(state => ({
      contentQueue: state.contentQueue.map(item =>
        item.id === id ? { ...item, status } : item
      ),
    }))
  },

  removeQueueItem(id) {
    set(state => ({
      contentQueue: state.contentQueue.filter(item => item.id !== id),
    }))
  },
}))

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectWarRoomMatch(state: FootballState): LiveMatch | null {
  const promoted = state.matches.filter(m => m.inWarRoom)
  if (promoted.length === 0) return null
  return promoted.reduce((best, m) => m.priorityScore > best.priorityScore ? m : best)
}

export function selectLiveMatches(state: FootballState): LiveMatch[] {
  return state.matches
    .filter(m => m.status === 'live' || m.status === 'halftime')
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

export function selectUpcomingMatches(state: FootballState): LiveMatch[] {
  return state.matches
    .filter(m => m.status === 'scheduled' || m.status === 'pre')
    .sort((a, b) => b.priorityScore - a.priorityScore)
}
