// ─── Cron: Refresh Live Matches ───────────────────────────────────────────────
// Runs every 60s via Vercel Cron (or external ping service).
// 1. Fetches all currently-live fixtures from API-Football in ONE call.
// 2. Filters to priority teams.
// 3. Diffs score vs cached version → detects new goals.
// 4. Updates Redis cache entries.
// 5. Publishes new GoalEvents to SSE stream.

import { NextRequest, NextResponse } from 'next/server'
import {
  TEAMS,
  mapAPIFixture,
} from '@/lib/football'
import type { LiveMatch } from '@/lib/football'
import type { CachedFixture } from '@/lib/fixtures-cache'
import {
  readFixtures,
  updateLiveFixture,
  getLiveIds,
} from '@/lib/fixtures-cache'
import { publishEvent } from '@/lib/redis'
import type { GoalEvent } from '@/lib/timeline'

export const dynamic = 'force-dynamic'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// ─── API-Football ─────────────────────────────────────────────────────────────

const BASE = 'https://v3.football.api-sports.io'

async function fetchLiveFixtures(): Promise<unknown[]> {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`${BASE}/fixtures?live=all`, {
      headers: { 'x-apisports-key': key },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json() as { response?: unknown[] }
    return json.response ?? []
  } catch {
    return []
  }
}

// ─── Priority team IDs set ────────────────────────────────────────────────────

const PRIORITY_API_IDS = new Set(
  Object.values(TEAMS)
    .filter(t => t.apiId !== undefined)
    .map(t => t.apiId!)
)

function involvesPriorityTeam(raw: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams = (raw as any)?.teams
  if (!teams) return false
  const h = teams.home?.id as number | undefined
  const a = teams.away?.id as number | undefined
  return !!(h && PRIORITY_API_IDS.has(h)) || !!(a && PRIORITY_API_IDS.has(a))
}

// ─── Goal detection ───────────────────────────────────────────────────────────

function makeKickoffLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)
    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    })
    if (diffDays <= 0) return `Hoje ${timeStr}`
    if (diffDays === 1) return `Amanhã ${timeStr}`
    return `${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} ${timeStr}`
  } catch {
    return 'Ao Vivo'
  }
}

function matchToCachedFixture(match: LiveMatch, raw: unknown): CachedFixture {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = (raw as any)?.fixture
  const kickoffTs = f?.date ? new Date(f.date as string).getTime() : Date.now()
  return {
    id: match.id,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      emoji: match.homeTeam.emoji,
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      emoji: match.awayTeam.emoji,
    },
    competition: {
      id: match.competition.id,
      name: match.competition.name,
      shortName: match.competition.shortName,
      emoji: match.competition.emoji,
    },
    status: match.status,
    minute: match.minute,
    score: { ...match.score },
    kickoffLabel: makeKickoffLabel(f?.date ?? ''),
    kickoffTs,
    updatedAt: Date.now(),
  }
}

let _goalCounter = 0

function buildGoalEvent(
  match: LiveMatch,
  side: 'home' | 'away',
  cached: CachedFixture,
): GoalEvent {
  // Extract scorer from match events (last goal event on that side)
  const scorer = match.events
    .filter(e => (e.type === 'goal' || e.type === 'penalty') && e.team === side)
    .at(-1)?.player ?? 'Jogador'

  return {
    id: `rf-${match.id}-${Date.now()}-${++_goalCounter}`,
    matchId: match.id,
    team: side,
    scorer,
    minute: match.minute,
    score: { ...match.score },
    scoreStr: `${match.score.home}-${match.score.away}`,
    homeTeam: {
      id: cached.homeTeam.id,
      name: cached.homeTeam.name,
      shortName: cached.homeTeam.shortName,
      emoji: cached.homeTeam.emoji,
    },
    awayTeam: {
      id: cached.awayTeam.id,
      name: cached.awayTeam.name,
      shortName: cached.awayTeam.shortName,
      emoji: cached.awayTeam.emoji,
    },
    competition: {
      id: cached.competition.id,
      name: cached.competition.name,
      shortName: cached.competition.shortName,
      emoji: cached.competition.emoji,
    },
    timestamp: Date.now(),
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.FOOTBALL_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'no API key' })
  }

  const t0 = Date.now()

  // Fetch all live fixtures in one API call
  const liveRaw = await fetchLiveFixtures()
  const priorityLive = liveRaw.filter(involvesPriorityTeam)

  if (priorityLive.length === 0) {
    return NextResponse.json({ live: 0, goals: 0, duration: Date.now() - t0 })
  }

  // Load current cache to diff scores
  const [cached, liveIdSet] = await Promise.all([readFixtures(), getLiveIds()])
  const cacheMap = new Map<string, CachedFixture>(cached.map(f => [f.id, f]))

  let goalsDetected = 0
  let fixturesUpdated = 0

  for (const raw of priorityLive) {
    const match = mapAPIFixture(raw)
    if (!match) continue

    const prev = cacheMap.get(match.id)
    const updated = matchToCachedFixture(match, raw)

    // Detect new goals by comparing score
    if (prev) {
      const homeDiff = match.score.home - prev.score.home
      const awayDiff = match.score.away - prev.score.away

      if (homeDiff > 0) {
        for (let i = 0; i < homeDiff; i++) {
          const goal = buildGoalEvent(match, 'home', updated)
          await publishEvent(goal)
          goalsDetected++
        }
      }
      if (awayDiff > 0) {
        for (let i = 0; i < awayDiff; i++) {
          const goal = buildGoalEvent(match, 'away', updated)
          await publishEvent(goal)
          goalsDetected++
        }
      }
    }

    await updateLiveFixture(updated)
    fixturesUpdated++

    // Remove from liveIdSet tracking (remainder = matches that ended)
    liveIdSet.delete(match.id)
  }

  return NextResponse.json({
    live: priorityLive.length,
    updated: fixturesUpdated,
    goals: goalsDetected,
    duration: Date.now() - t0,
  })
}

export { GET as POST }
