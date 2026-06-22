// ─── Fixtures Endpoint ────────────────────────────────────────────────────────
// Server-side proxy to API-Football. Fetches all fixtures for the next 7 days
// (1 request per day = 7 requests), filters, and tags each with its category.
//
// Categorias:
//   CUP — Copa do Mundo 2026 / Copa América (TODOS os jogos, independente de times)
//   NT  — Outras partidas de seleções (times monitorados × outros)
//   BR  — Clubes brasileiros monitorados
//   EU  — Clubes europeus monitorados
//
// Ordenação dentro de cada dia:
//   1. 🇧🇷 Brasil na Copa
//   2. Copa com seleções tier-1 (Argentina, França, Alemanha…)
//   3. Outros jogos da Copa
//   4. Partidas NT (amistosos/qualifs com times monitorados)
//   5. Clubes BR/EU
//
// GET /api/fixtures
//   → { fixtures: Fixture[], connected: boolean, error: string | null, requestsUsed: number }

import { NextResponse } from 'next/server'
import { ALL_TEAMS, TEAM_CATEGORY } from '@/lib/teams30'
import type { Fixture, MatchCategory } from '@/types/fixtures'
import { wc2026Fallback } from '@/lib/wc2026-fallback'

const BASE = 'https://v3.football.api-sports.io'

export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// The 30 priority team IDs (for non-Cup matches)
const WATCHED_TEAM_IDS = new Set<number>(ALL_TEAMS.map(t => t.id))

// Competições de seleções que mostramos integralmente (sem filtro de time)
// 1 = FIFA World Cup · 9 = Copa América
const WORLD_CUP_LEAGUE_IDS = new Set([1, 9])

// IDs das nossas seleções tier-1 (para ordenação de prioridade)
const BRAZIL_ID = 6
const TIER1_NATION_IDS = new Set([6, 26, 9, 27, 2, 25, 768, 10, 7, 8])

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
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const json = (await res.json()) as ApiEnvelope
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

/** Category for a fixture. Copa do Mundo / Copa América → 'CUP' sempre. */
function categoryFor(leagueId: number, homeId: number, awayId: number): MatchCategory {
  if (WORLD_CUP_LEAGUE_IDS.has(leagueId)) return 'CUP'
  return TEAM_CATEGORY[homeId] ?? TEAM_CATEGORY[awayId] ?? 'EU'
}

/**
 * Priority score within a day (lower = shown first).
 * 0: Brasil na Copa
 * 1: Copa com seleção tier-1
 * 2: Qualquer outro jogo da Copa
 * 3: Partida NT fora da Copa (amistosos, qualifs)
 * 4: Clubes BR/EU
 */
function matchPriority(homeId: number, awayId: number, category: MatchCategory): number {
  if (category === 'CUP') {
    if (homeId === BRAZIL_ID || awayId === BRAZIL_ID) return 0
    if (TIER1_NATION_IDS.has(homeId) || TIER1_NATION_IDS.has(awayId)) return 1
    return 2
  }
  if (category === 'NT') return 3
  return 4
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fixtures: wc2026Fallback(Date.now()), connected: true, error: null, requestsUsed: 0, source: 'fallback' })
  }

  const seen = new Set<number>()
  const collected: Fixture[] = []

  try {
    for (const date of getNext7Days()) {
      let rows: unknown[]
      try {
        rows = await fetchFixturesByDate(date, apiKey)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'FETCH_ERROR'
        if (msg.includes('token') || msg.includes('Missing') || msg.includes('requests')) {
          return NextResponse.json({ fixtures: wc2026Fallback(Date.now()), connected: true, error: null, requestsUsed: 0, source: 'fallback' })
        }
        continue
      }

      for (const row of rows as Fixture[]) {
        const homeId   = row?.teams?.home?.id
        const awayId   = row?.teams?.away?.id
        const leagueId = row?.league?.id
        const fid      = row?.fixture?.id

        // ── Filtro: Copa do Mundo → sempre inclui.
        //           Outros → só se envolver um dos 30 times monitorados.
        const isWorldCup = WORLD_CUP_LEAGUE_IDS.has(leagueId)
        if (!isWorldCup && !WATCHED_TEAM_IDS.has(homeId) && !WATCHED_TEAM_IDS.has(awayId)) continue

        if (typeof fid !== 'number' || seen.has(fid)) continue
        seen.add(fid)

        row._category = categoryFor(leagueId, homeId, awayId)
        collected.push(row)
      }

      await sleep(200)
    }

    // Ordenação: por dia → prioridade Copa → cronológico dentro do mesmo nível
    const fixtures = collected.sort((a, b) => {
      const dayA = Math.floor(a.fixture.timestamp / 86400)
      const dayB = Math.floor(b.fixture.timestamp / 86400)
      if (dayA !== dayB) return dayA - dayB
      const pa = matchPriority(a.teams.home.id, a.teams.away.id, a._category)
      const pb = matchPriority(b.teams.home.id, b.teams.away.id, b._category)
      if (pa !== pb) return pa - pb
      return a.fixture.timestamp - b.fixture.timestamp
    })

    const requestsUsed = await fetchQuotaUsed(apiKey)
    // API indisponível (conta suspensa / sem plano / sem jogos no período) →
    // fallback com a Copa do Mundo 2026 para a Timeline continuar útil.
    if (fixtures.length === 0) {
      return NextResponse.json({
        fixtures: wc2026Fallback(Date.now()), connected: true, error: null,
        requestsUsed, source: 'fallback',
      })
    }
    return NextResponse.json({ fixtures, connected: true, error: null, requestsUsed, source: 'live' })
  } catch {
    const requestsUsed = await fetchQuotaUsed(apiKey)
    const fixtures = collected.length > 0
      ? collected.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
      : wc2026Fallback(Date.now())
    return NextResponse.json({
      fixtures, connected: true,
      error: collected.length > 0 ? 'PARTIAL_FETCH' : null,
      requestsUsed, source: collected.length > 0 ? 'live' : 'fallback',
    })
  }
}
