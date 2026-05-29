// ─── Cron: Sync Fixtures ──────────────────────────────────────────────────────
// Runs 2× per day (08:00 + 20:00 UTC via vercel.json cron).
// Fetches next 7 days of fixtures for all priority teams and writes to Redis.
//
// Strategy:
//   A) Leagues (Brasileirão, Copa do Brasil, Libertadores, WCQ, UCL, etc.)
//      → 1 request per league, returns all matches in the competition
//   B) National teams not covered by league strategy
//      → 1 request per team
//   Total: ~15-20 API requests per sync, << 7500/day Pro limit.

import { NextRequest, NextResponse } from 'next/server'
import {
  TEAMS,
  COMPETITIONS,
  mapAPIFixture,
} from '@/lib/football'
import type { CachedFixture } from '@/lib/fixtures-cache'
import {
  writeFixtures,
  acquireSyncLock,
  releaseSyncLock,
  setLastSync,
  cleanupExpired,
} from '@/lib/fixtures-cache'
import type { LiveMatch } from '@/lib/football'

export const dynamic = 'force-dynamic'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true   // dev mode: allow all
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// ─── API-Football fetch ───────────────────────────────────────────────────────

const BASE = 'https://v3.football.api-sports.io'

async function apiFetch(path: string): Promise<unknown[]> {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`${BASE}${path}`, {
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

// ─── Fixture → CachedFixture ──────────────────────────────────────────────────

function toCachedFixture(raw: unknown): CachedFixture | null {
  const match: LiveMatch | null = mapAPIFixture(raw)
  if (!match) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = (raw as any).fixture
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
    kickoffLabel: match.kickoffLabel,
    kickoffTs,
    updatedAt: Date.now(),
  }
}

// ─── Filter: only keep fixtures involving a priority team ─────────────────────

const PRIORITY_TEAM_IDS = new Set(
  Object.values(TEAMS)
    .filter(t => t.apiId !== undefined)
    .map(t => t.apiId!)
)

function involvesPriorityTeam(raw: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams = (raw as any)?.teams
  if (!teams) return false
  const homeId = teams.home?.id as number | undefined
  const awayId = teams.away?.id as number | undefined
  // Also accept if either team maps to our registry via name
  if (homeId && PRIORITY_TEAM_IDS.has(homeId)) return true
  if (awayId && PRIORITY_TEAM_IDS.has(awayId)) return true
  return false
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.FOOTBALL_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'no API key' })
  }

  const locked = !(await acquireSyncLock())
  if (locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  const t0 = Date.now()
  const seen = new Set<string>()
  const fixtures: CachedFixture[] = []
  let apiCalls = 0

  try {
    // ── Strategy A: fetch by league (covers all Brazilian + European competitions) ──
    // These leagues cover all Brazilian club matches + key European competitions
    const leagueIds = [
      71,  // Brasileirão Série A
      73,  // Copa do Brasil
      13,  // Libertadores
      11,  // Sul-Americana
      34,  // WCQ CONMEBOL (Eliminatórias)
      9,   // Copa América
      2,   // UCL
      3,   // Europa League
      1,   // Club World Cup / World Cup
      39,  // Premier League
      140, // La Liga
      78,  // Bundesliga
      135, // Serie A (IT)
      61,  // Ligue 1
    ]

    for (const leagueId of leagueIds) {
      const rows = await apiFetch(`/fixtures?league=${leagueId}&next=30`)
      apiCalls++
      for (const row of rows) {
        const cached = toCachedFixture(row)
        if (!cached || seen.has(cached.id)) continue
        // For non-Brazilian leagues filter to priority teams only to reduce noise
        if (leagueId >= 39 && !involvesPriorityTeam(row)) continue
        seen.add(cached.id)
        fixtures.push(cached)
      }
    }

    // ── Strategy B: national teams not covered by league strategy ──
    const nationalApiIds = Object.values(TEAMS)
      .filter(t => t.isNationalTeam && t.apiId)
      .map(t => t.apiId!)

    for (const teamId of nationalApiIds) {
      const rows = await apiFetch(`/fixtures?team=${teamId}&next=10`)
      apiCalls++
      for (const row of rows) {
        const cached = toCachedFixture(row)
        if (!cached || seen.has(cached.id)) continue
        seen.add(cached.id)
        fixtures.push(cached)
      }
    }

    // Write to Redis cache
    await writeFixtures(fixtures)
    await setLastSync(new Date().toISOString())

    // Housekeeping: remove stale entries
    const cleaned = await cleanupExpired()

    return NextResponse.json({
      synced: fixtures.length,
      apiCalls,
      cleaned,
      duration: Date.now() - t0,
    })
  } finally {
    await releaseSyncLock()
  }
}

// Also accept POST (Vercel sometimes sends POST for crons)
export { GET as POST }

// ─── Competition registry used for unknown competitions ───────────────────────
// (keeps the import used — competitions are resolved inside mapAPIFixture)
void COMPETITIONS
