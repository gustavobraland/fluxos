// ─── Fixtures Endpoint ────────────────────────────────────────────────────────
// Server-side proxy to API-Football. Fetches all fixtures for the next 7 days
// (1 request per day = 7 requests), filters to our 30 priority teams, dedups by
// fixture ID, and tags each with its category. The API key never leaves the server.
//
// GET /api/fixtures
//   → { fixtures: Fixture[], connected: boolean, error: string | null, requestsUsed: number }
//
// Strategy: /fixtures?date=YYYY-MM-DD (7 calls) instead of /fixtures?team=ID (30
// calls). Cheaper by 23 requests/refresh. requestsUsed reflects the real daily
// quota read from /status.

import { NextResponse } from 'next/server'
import { ALL_TEAMS, TEAM_CATEGORY } from '@/lib/teams30'
import type { Fixture, MatchCategory } from '@/types/fixtures'

const BASE = 'https://v3.football.api-sports.io'

export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// The 30 priority team IDs we care about (verified against the live API).
const WATCHED_TEAM_IDS = new Set<number>(ALL_TEAMS.map(t => t.id))

/** Next 7 calendar dates as YYYY-MM-DD (UTC). */
function getNext7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

interface ApiEnvelope {
  response?: unknown[]
  errors?: Record<string, string> | unknown[]
}

/** Fetch every fixture scheduled for a single date. */
async function fetchFixturesByDate(date: string, apiKey: string): Promise<unknown[]> {
  const res = await fetch(`${BASE}/fixtures?date=${date}`, {
    headers: { 'x-apisports-key': apiKey },
    // Cache each date query for 5 min so reloads don't re-spend quota
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const json = (await res.json()) as ApiEnvelope
  // API-Football returns 200 with an `errors` object on auth/quota problems
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors))
  }
  return json.response ?? []
}

/** Read the real daily quota usage from /status. */
async function fetchQuotaUsed(apiKey: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/status`, {
      headers: { 'x-apisports-key': apiKey },
      next: { revalidate: 120 },
    })
    if (!res.ok) return 0
    const json = (await res.json()) as { response?: { requests?: { current?: number } } }
    return json.response?.requests?.current ?? 0
  } catch {
    return 0
  }
}

// Category for a fixture: prefer whichever side is a priority team.
function categoryFor(homeId: number, awayId: number): MatchCategory {
  return TEAM_CATEGORY[homeId] ?? TEAM_CATEGORY[awayId] ?? 'EU'
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fixtures: [], connected: false, error: 'NO_API_KEY', requestsUsed: 0 })
  }

  const seen = new Set<number>()
  const collected: Fixture[] = []

  try {
    for (const date of getNext7Days()) {
      let rows: unknown[]
      try {
        rows = await fetchFixturesByDate(date, apiKey)
      } catch (e) {
        // Auth/quota errors should surface; per-date network blips are skipped
        const msg = e instanceof Error ? e.message : 'FETCH_ERROR'
        if (msg.includes('token') || msg.includes('Missing') || msg.includes('requests')) {
          return NextResponse.json({ fixtures: [], connected: false, error: msg, requestsUsed: 0 })
        }
        continue
      }

      for (const row of rows as Fixture[]) {
        const homeId = row?.teams?.home?.id
        const awayId = row?.teams?.away?.id
        // Only keep matches involving at least one priority team
        if (!WATCHED_TEAM_IDS.has(homeId) && !WATCHED_TEAM_IDS.has(awayId)) continue

        const fid = row?.fixture?.id
        if (typeof fid !== 'number' || seen.has(fid)) continue
        seen.add(fid)

        row._category = categoryFor(homeId, awayId)
        collected.push(row)
      }

      await sleep(200)
    }

    const fixtures = collected.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
    const requestsUsed = await fetchQuotaUsed(apiKey)

    return NextResponse.json({ fixtures, connected: true, error: null, requestsUsed })
  } catch {
    const requestsUsed = await fetchQuotaUsed(apiKey)
    return NextResponse.json({
      fixtures: collected.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp),
      connected: true, error: 'PARTIAL_FETCH', requestsUsed,
    })
  }
}
