import { create } from 'zustand'
import {
  LiveMatch,
  ContentQueueItem,
  mapAPIFixture,
  shouldAutoPromote,
  generateGoalCaption,
} from '@/lib/football'

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

// ─── Fetch helper ─────────────────────────────────────────────────────────────

/** Read live + upcoming fixtures directly from API-Football via our server routes. */
async function fetchFixtures(): Promise<{ fixtures: unknown[]; connected: boolean; error: string | null }> {
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

    // Refresh live + upcoming fixtures every 60s from API-Football.
    const pollInterval = 60_000

    const tick = async () => {
      try {
        const data = await fetchFixtures()

        if (!data.connected) {
          set({ apiConnected: false, loading: false, error: data.error })
          return
        }

        const allMatches = (data.fixtures ?? [])
          .map(item => mapAPIFixture(item))
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
