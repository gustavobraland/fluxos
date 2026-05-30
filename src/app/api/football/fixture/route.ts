// ─── Single Fixture Endpoint ──────────────────────────────────────────────────
// Server-side proxy to API-Football for one fixture, used by the War Room's
// adaptive polling service. The API key never leaves the server.
//
// GET /api/football/fixture?id=12345
//   → { fixture: Fixture | null, requestsUsed: number, connected: boolean, error: string | null }
//
// requestsUsed is read from the live `x-ratelimit-requests-current` response
// header so the War Room can throttle itself before hitting the daily cap.

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://v3.football.api-sports.io'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fixture: null, requestsUsed: 0, connected: false, error: 'NO_API_KEY' })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ fixture: null, requestsUsed: 0, connected: true, error: 'MISSING_ID' })
  }

  try {
    const res = await fetch(`${BASE}/fixtures?id=${id}`, {
      headers: { 'x-apisports-key': apiKey },
      cache: 'no-store',
    })

    // Real daily usage straight from the response headers
    const requestsUsed = Number(res.headers.get('x-ratelimit-requests-current') ?? 0)

    if (!res.ok) {
      return NextResponse.json({ fixture: null, requestsUsed, connected: true, error: `API_HTTP_${res.status}` })
    }

    const json = (await res.json()) as { response?: unknown[]; errors?: Record<string, string> | unknown[] }

    if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
      return NextResponse.json({
        fixture: null,
        requestsUsed,
        connected: false,
        error: Object.values(json.errors).join('; '),
      })
    }

    const fixture = json.response?.[0] ?? null
    return NextResponse.json({ fixture, requestsUsed, connected: true, error: null })
  } catch {
    return NextResponse.json({ fixture: null, requestsUsed: 0, connected: true, error: 'NETWORK_ERROR' })
  }
}
