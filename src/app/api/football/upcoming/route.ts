import { NextResponse } from 'next/server'

const BASE = 'https://v3.football.api-sports.io'
const SEASON = new Date().getFullYear()

// Top-priority leagues only (to conserve API calls)
const PRIORITY_LEAGUES = [71, 73, 13, 2, 39, 11, 1]

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY

  if (!apiKey) {
    return NextResponse.json({ fixtures: [], error: 'NO_API_KEY', connected: false })
  }

  const today = new Date().toISOString().split('T')[0]
  const in2days = new Date(Date.now() + 2 * 86_400_000).toISOString().split('T')[0]

  try {
    // Fetch top leagues in parallel (2-day window)
    const results = await Promise.allSettled(
      PRIORITY_LEAGUES.map(leagueId =>
        fetch(
          `${BASE}/fixtures?league=${leagueId}&season=${SEASON}&from=${today}&to=${in2days}&status=NS-PST`,
          {
            headers: {
              'x-apisports-key': apiKey,
              'x-rapidapi-host': 'v3.football.api-sports.io',
            },
            next: { revalidate: 300 }, // cache upcoming for 5 min
          }
        )
          .then(r => r.json())
          .then(d => (d.response ?? []) as unknown[])
          .catch(() => [] as unknown[])
      )
    )

    const fixtures = results
      .flatMap(r => (r.status === 'fulfilled' ? r.value : []))

    return NextResponse.json({ fixtures, error: null, connected: true })
  } catch {
    return NextResponse.json({ fixtures: [], error: 'NETWORK_ERROR', connected: true })
  }
}
