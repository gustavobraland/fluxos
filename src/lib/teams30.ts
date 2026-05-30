// ─── 30 Priority Teams ────────────────────────────────────────────────────────
// API-Football numeric IDs — ALL verified against the live API on 2026-05-29.
// (The original spec IDs were incorrect; these are the confirmed values.)

import type { MatchCategory } from '@/types/fixtures'

export interface PriorityTeam {
  id: number
  name: string
  category: MatchCategory
}

// 🇧🇷 Brazilian clubs (10) — verified
const BR_TEAMS: PriorityTeam[] = [
  { id: 127,  name: 'Flamengo',      category: 'BR' },
  { id: 121,  name: 'Palmeiras',     category: 'BR' },
  { id: 128,  name: 'Santos',        category: 'BR' },
  { id: 126,  name: 'São Paulo',     category: 'BR' },
  { id: 131,  name: 'Corinthians',   category: 'BR' },
  { id: 130,  name: 'Grêmio',        category: 'BR' },
  { id: 119,  name: 'Internacional', category: 'BR' },
  { id: 124,  name: 'Fluminense',    category: 'BR' },
  { id: 133,  name: 'Vasco',         category: 'BR' },
  { id: 1062, name: 'Atlético-MG',   category: 'BR' },
]

// 🌍 European clubs (10) — verified
const EU_TEAMS: PriorityTeam[] = [
  { id: 529, name: 'Barcelona',        category: 'EU' },
  { id: 541, name: 'Real Madrid',      category: 'EU' },
  { id: 50,  name: 'Manchester City',  category: 'EU' },
  { id: 40,  name: 'Liverpool',        category: 'EU' },
  { id: 85,  name: 'PSG',              category: 'EU' },
  { id: 157, name: 'Bayern Munich',    category: 'EU' },
  { id: 505, name: 'Inter Milan',      category: 'EU' },
  { id: 496, name: 'Juventus',         category: 'EU' },
  { id: 42,  name: 'Arsenal',          category: 'EU' },
  { id: 33,  name: 'Manchester Utd',   category: 'EU' },
]

// 🏳 National teams (10) — verified
const NT_TEAMS: PriorityTeam[] = [
  { id: 6,   name: 'Brasil',     category: 'NT' },
  { id: 26,  name: 'Argentina',  category: 'NT' },
  { id: 9,   name: 'Espanha',    category: 'NT' },
  { id: 27,  name: 'Portugal',   category: 'NT' },
  { id: 2,   name: 'França',     category: 'NT' },
  { id: 25,  name: 'Alemanha',   category: 'NT' },
  { id: 768, name: 'Itália',     category: 'NT' },
  { id: 10,  name: 'Inglaterra', category: 'NT' },
  { id: 7,   name: 'Uruguai',    category: 'NT' },
  { id: 8,   name: 'Colômbia',   category: 'NT' },
]

export const ALL_TEAMS: PriorityTeam[] = [...BR_TEAMS, ...EU_TEAMS, ...NT_TEAMS]

/** Map team API ID → category, for tagging fixtures after fetch. */
export const TEAM_CATEGORY: Record<number, MatchCategory> = Object.fromEntries(
  ALL_TEAMS.map(t => [t.id, t.category])
)
