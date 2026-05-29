import { NextResponse } from 'next/server'

const BASE = 'https://v3.football.api-sports.io'

// Only leagues we care about
const ALLOWED_LEAGUES = new Set([
  1,   // FIFA World Cup
  11,  // WCQ – South America
  9,   // Copa América
  71,  // Brasileirão Série A
  73,  // Copa do Brasil
  13,  // CONMEBOL Libertadores
  14,  // CONMEBOL Sul-Americana
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
])

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      fixtures: [],
      error: 'NO_API_KEY',
      connected: false,
    })
  }

  try {
    const res = await fetch(`${BASE}/fixtures?live=all`, {
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({
        fixtures: [],
        error: `API_HTTP_${res.status}`,
        connected: true,
      })
    }

    const data = await res.json()

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join('; ')
      return NextResponse.json({ fixtures: [], error: errMsg, connected: true })
    }

    const fixtures = (data.response ?? []).filter(
      (f: { league?: { id?: number } }) => ALLOWED_LEAGUES.has(f.league?.id ?? -1)
    )

    return NextResponse.json({ fixtures, error: null, connected: true })
  } catch (err) {
    return NextResponse.json({
      fixtures: [],
      error: 'NETWORK_ERROR',
      connected: true,
    })
  }
}
