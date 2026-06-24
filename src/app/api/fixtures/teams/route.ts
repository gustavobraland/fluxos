// ─── Team Fixtures Endpoint ───────────────────────────────────────────────────
// Próximos jogos de cada CLUBE monitorado (10 BR + 15 EU) via `?team=ID&next=N`.
// Essa query não sofre a restrição de "season" do plano free (é por time, futuro),
// então cobre o calendário inteiro dos clubes — não só a janela de 7 dias.
//
// Economia: cache server-side de 6h por time (next.revalidate) → chamadas
// repetidas não gastam créditos. ~25 requests por refresh de 6h.
//
// GET /api/fixtures/teams
//   → { fixtures: Fixture[], connected: boolean, error: string | null, requestsUsed: number }

import { NextResponse } from 'next/server'
import { ALL_TEAMS, TEAM_CATEGORY } from '@/lib/teams30'
import type { Fixture } from '@/types/fixtures'

const BASE = 'https://v3.football.api-sports.io'
export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// Só clubes (BR + EU) — seleções (NT) e Copa vêm do /api/fixtures (janela de dias).
const CLUB_TEAMS = ALL_TEAMS.filter(t => t.category === 'BR' || t.category === 'EU')
const NEXT_PER_TEAM = 12        // próximos 12 jogos de cada clube
const REVALIDATE = 6 * 60 * 60  // 6h de cache por time

interface ApiEnvelope { response?: unknown[]; errors?: Record<string, string> | unknown[] }

async function fetchTeamNext(teamId: number, apiKey: string): Promise<unknown[]> {
  const res = await fetch(`${BASE}/fixtures?team=${teamId}&next=${NEXT_PER_TEAM}`, {
    headers: { 'x-apisports-key': apiKey },
    next: { revalidate: REVALIDATE },
  })
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const json = (await res.json()) as ApiEnvelope
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors))
  }
  return json.response ?? []
}

async function fetchQuotaUsed(apiKey: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/status`, { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 120 } })
    if (!res.ok) return 0
    const json = (await res.json()) as { response?: { requests?: { current?: number } } }
    return json.response?.requests?.current ?? 0
  } catch {
    return 0
  }
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fixtures: [], connected: false, error: 'NO_API_KEY', requestsUsed: 0 })
  }

  const seen = new Set<number>()
  const collected: Fixture[] = []
  let suspended: string | null = null

  for (const team of CLUB_TEAMS) {
    let rows: unknown[]
    try {
      rows = await fetchTeamNext(team.id, apiKey)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'FETCH_ERROR'
      // Conta suspensa / sem token / sem créditos → para e reporta (sem martelar a API)
      if (msg.includes('suspended') || msg.includes('token') || msg.includes('Missing') || msg.includes('requests')) {
        suspended = msg
        break
      }
      continue
    }

    for (const row of rows as Fixture[]) {
      const fid = row?.fixture?.id
      if (typeof fid !== 'number' || seen.has(fid)) continue
      seen.add(fid)
      const homeId = row?.teams?.home?.id
      const awayId = row?.teams?.away?.id
      row._category = TEAM_CATEGORY[homeId] ?? TEAM_CATEGORY[awayId] ?? team.category
      collected.push(row)
    }
    await sleep(120)
  }

  const fixtures = collected.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
  const requestsUsed = await fetchQuotaUsed(apiKey)
  return NextResponse.json({
    fixtures,
    connected: !suspended,
    error: suspended,
    requestsUsed,
  })
}
