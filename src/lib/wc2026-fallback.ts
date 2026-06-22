// ─── Fallback de fixtures — Copa do Mundo 2026 ────────────────────────────────
// Usado quando a API-Football não devolve jogos (conta suspensa / fora do plano /
// quota). Mantém a Timeline útil para abrir War Room e testar a geração de arte.
// Quando a API voltar, os jogos reais têm prioridade e este fallback é ignorado.
//
// NÃO são resultados oficiais — é um conjunto representativo de confrontos da Copa
// com horários plausíveis a partir de "hoje", para o time conseguir trabalhar.

import type { Fixture } from '@/types/fixtures'
import { countryCode, flagUrl } from '@/lib/country-flags'

const WC_LOGO = 'https://media.api-sports.io/football/leagues/1.png'

// IDs estáveis por seleção (aproximados; servem só para dedup/seleção no War Room).
const TEAM_ID: Record<string, number> = {
  Brazil: 6, Argentina: 26, Portugal: 27, France: 2, Spain: 9, Germany: 25,
  England: 10, Netherlands: 1118, Croatia: 3, Morocco: 31, Mexico: 16, USA: 22,
  Uruguay: 7, Colombia: 8, Japan: 12, 'South Korea': 17, Italy: 768, Belgium: 1,
  'Congo DR': 999,
}

function team(name: string) {
  const code = countryCode(name)
  return { id: TEAM_ID[name] ?? 900000 + name.length, name, logo: code ? flagUrl(code) : '' }
}

interface Match { home: string; away: string; day: number; hour: number } // hour em BRT

// Confrontos espalhados pelos próximos dias (a partir de hoje).
const SCHEDULE: Match[] = [
  { home: 'Brazil', away: 'Portugal', day: 0, hour: 16 },
  { home: 'Argentina', away: 'Croatia', day: 0, hour: 13 },
  { home: 'France', away: 'Morocco', day: 0, hour: 19 },
  { home: 'Spain', away: 'Germany', day: 1, hour: 13 },
  { home: 'England', away: 'Netherlands', day: 1, hour: 16 },
  { home: 'Mexico', away: 'USA', day: 1, hour: 21 },
  { home: 'Brazil', away: 'France', day: 2, hour: 16 },
  { home: 'Argentina', away: 'Spain', day: 2, hour: 20 },
  { home: 'Portugal', away: 'England', day: 3, hour: 13 },
  { home: 'Germany', away: 'Netherlands', day: 3, hour: 16 },
  { home: 'Uruguay', away: 'Colombia', day: 4, hour: 17 },
  { home: 'Japan', away: 'South Korea', day: 4, hour: 9 },
  { home: 'Italy', away: 'Belgium', day: 5, hour: 16 },
  { home: 'Brazil', away: 'Argentina', day: 6, hour: 16 },
]

/** Gera os fixtures de fallback relativos ao instante `now` (ms). */
export function wc2026Fallback(now: number): Fixture[] {
  const base = new Date(now)
  base.setUTCHours(0, 0, 0, 0) // meia-noite UTC de hoje
  const baseMs = base.getTime()
  const DAY = 86400000

  return SCHEDULE.map((m, i): Fixture => {
    // hora em BRT (UTC-3) → UTC = hour + 3
    const ts = Math.floor((baseMs + m.day * DAY + (m.hour + 3) * 3600 * 1000) / 1000)
    return {
      fixture: {
        id: 9_000_000 + i,
        timestamp: ts,
        status: { short: 'NS', elapsed: null },
        venue: { name: null, city: null },
      },
      league: { id: 1, name: 'World Cup', logo: WC_LOGO },
      teams: { home: team(m.home), away: team(m.away) },
      goals: { home: null, away: null },
      _category: 'CUP',
    } as Fixture
  })
}
