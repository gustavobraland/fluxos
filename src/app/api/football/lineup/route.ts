// ─── Lineup Endpoint ──────────────────────────────────────────────────────────
// Server-side proxy to API-Football's /fixtures/lineups. Fetched once per match
// (the War Room caches it in Zustand). The API key never leaves the server.
//
// GET /api/football/lineup?fixture=12345
//   → { available: boolean, home: TeamLineup | null, away: TeamLineup | null,
//       requestsUsed: number, connected: boolean, error: string | null }
//
// available=false means the official lineup is not published yet (response empty).

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://v3.football.api-sports.io'

export const dynamic = 'force-dynamic'

interface ApiPlayer {
  player?: { name?: string; number?: number | null; pos?: string | null }
}

interface ApiLineupTeam {
  team?: { name?: string }
  formation?: string | null
  startXI?: ApiPlayer[]
}

function normalize(team: ApiLineupTeam | undefined) {
  if (!team) return null
  return {
    teamName: team.team?.name ?? '',
    formation: team.formation ?? null,
    players: (team.startXI ?? []).map((p) => ({
      number: p.player?.number ?? null,
      name: p.player?.name ?? '',
      pos: p.player?.pos ?? null,
    })),
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ available: false, home: null, away: null, requestsUsed: 0, connected: false, error: 'NO_API_KEY' })
  }

  const fixture = req.nextUrl.searchParams.get('fixture')
  if (!fixture) {
    return NextResponse.json({ available: false, home: null, away: null, requestsUsed: 0, connected: true, error: 'MISSING_FIXTURE' })
  }

  try {
    const res = await fetch(`${BASE}/fixtures/lineups?fixture=${fixture}`, {
      headers: { 'x-apisports-key': apiKey },
      cache: 'no-store',
    })

    const requestsUsed = Number(res.headers.get('x-ratelimit-requests-current') ?? 0)

    if (!res.ok) {
      return NextResponse.json({ available: false, home: null, away: null, requestsUsed, connected: true, error: `API_HTTP_${res.status}` })
    }

    const json = (await res.json()) as { response?: ApiLineupTeam[]; errors?: Record<string, string> | unknown[] }

    if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
      return NextResponse.json({
        available: false, home: null, away: null, requestsUsed,
        connected: false, error: Object.values(json.errors).join('; '),
      })
    }

    const rows = json.response ?? []
    const home = normalize(rows[0])
    const away = normalize(rows[1])
    const available = (home?.players.length ?? 0) > 0 || (away?.players.length ?? 0) > 0

    return NextResponse.json({ available, home, away, requestsUsed, connected: true, error: null })
  } catch {
    return NextResponse.json({ available: false, home: null, away: null, requestsUsed: 0, connected: true, error: 'NETWORK_ERROR' })
  }
}
