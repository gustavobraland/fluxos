// ─── Team & brand emblem catalog ──────────────────────────────────────────────
// Zero storage — every crest is served straight from the API-Football CDN.
// IMPORTANT: these IDs were verified against the live API (see teams30.ts). The
// original spec IDs for BR/NT were wrong (they pointed at other clubs/teams), so
// using them would render the WRONG crest. We keep the verified IDs here.

export type TeamCategory = 'BR' | 'EU' | 'NT'

export interface Team {
  id: number
  name: string
  shortName: string
  logo: string
  category: TeamCategory
  league: string
  leagueLogo: string
}

const CDN = 'https://media.api-sports.io/football'
const teamLogo = (id: number) => `${CDN}/teams/${id}.png`
const leagueLogo = (id: number) => `${CDN}/leagues/${id}.png`

// League logos used below
const BRASILEIRAO = leagueLogo(71)
const LALIGA = leagueLogo(140)
const PREMIER = leagueLogo(39)
const LIGUE1 = leagueLogo(61)
const BUNDESLIGA = leagueLogo(78)
const SERIEA = leagueLogo(135)

export const TEAMS: Team[] = [
  // ── 🇧🇷 Brasil (Brasileirão) ──
  { id: 127,  name: 'Flamengo',        shortName: 'FLA', logo: teamLogo(127),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 121,  name: 'Palmeiras',       shortName: 'PAL', logo: teamLogo(121),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 128,  name: 'Santos',          shortName: 'SAN', logo: teamLogo(128),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 126,  name: 'São Paulo',       shortName: 'SAO', logo: teamLogo(126),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 131,  name: 'Corinthians',     shortName: 'COR', logo: teamLogo(131),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 130,  name: 'Grêmio',          shortName: 'GRE', logo: teamLogo(130),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 119,  name: 'Internacional',   shortName: 'INT', logo: teamLogo(119),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 124,  name: 'Fluminense',      shortName: 'FLU', logo: teamLogo(124),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 133,  name: 'Vasco',           shortName: 'VAS', logo: teamLogo(133),  category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },
  { id: 1062, name: 'Atlético-MG',     shortName: 'CAM', logo: teamLogo(1062), category: 'BR', league: 'Brasileirão',     leagueLogo: BRASILEIRAO },

  // ── 🌍 Europa ──
  { id: 529, name: 'Barcelona',        shortName: 'BAR', logo: teamLogo(529),  category: 'EU', league: 'La Liga',         leagueLogo: LALIGA },
  { id: 541, name: 'Real Madrid',      shortName: 'RMA', logo: teamLogo(541),  category: 'EU', league: 'La Liga',         leagueLogo: LALIGA },
  { id: 50,  name: 'Manchester City',  shortName: 'MCI', logo: teamLogo(50),   category: 'EU', league: 'Premier League',  leagueLogo: PREMIER },
  { id: 40,  name: 'Liverpool',        shortName: 'LIV', logo: teamLogo(40),   category: 'EU', league: 'Premier League',  leagueLogo: PREMIER },
  { id: 85,  name: 'PSG',              shortName: 'PSG', logo: teamLogo(85),   category: 'EU', league: 'Ligue 1',         leagueLogo: LIGUE1 },
  { id: 157, name: 'Bayern Munich',    shortName: 'BAY', logo: teamLogo(157),  category: 'EU', league: 'Bundesliga',      leagueLogo: BUNDESLIGA },
  { id: 505, name: 'Inter Milan',      shortName: 'INT', logo: teamLogo(505),  category: 'EU', league: 'Serie A',         leagueLogo: SERIEA },
  { id: 496, name: 'Juventus',         shortName: 'JUV', logo: teamLogo(496),  category: 'EU', league: 'Serie A',         leagueLogo: SERIEA },
  { id: 42,  name: 'Arsenal',          shortName: 'ARS', logo: teamLogo(42),   category: 'EU', league: 'Premier League',  leagueLogo: PREMIER },
  { id: 33,  name: 'Manchester Utd',   shortName: 'MUN', logo: teamLogo(33),   category: 'EU', league: 'Premier League',  leagueLogo: PREMIER },

  // ── 🏳 Seleções ──
  { id: 6,   name: 'Brasil',     shortName: 'BRA', logo: teamLogo(6),   category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 26,  name: 'Argentina',  shortName: 'ARG', logo: teamLogo(26),  category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 9,   name: 'Espanha',    shortName: 'ESP', logo: teamLogo(9),   category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 27,  name: 'Portugal',   shortName: 'POR', logo: teamLogo(27),  category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 2,   name: 'França',     shortName: 'FRA', logo: teamLogo(2),   category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 25,  name: 'Alemanha',   shortName: 'ALE', logo: teamLogo(25),  category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 768, name: 'Itália',     shortName: 'ITA', logo: teamLogo(768), category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 10,  name: 'Inglaterra', shortName: 'ING', logo: teamLogo(10),  category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 7,   name: 'Uruguai',    shortName: 'URU', logo: teamLogo(7),   category: 'NT', league: 'Seleções', leagueLogo: '' },
  { id: 8,   name: 'Colômbia',   shortName: 'COL', logo: teamLogo(8),   category: 'NT', league: 'Seleções', leagueLogo: '' },
]

// Brand emblems — drop the PNGs into /public/assets/brand/ (served locally).
export interface BrandAsset {
  id: string
  name: string
  logo: string
  category: 'brand'
}

export const BRAND_ASSETS: BrandAsset[] = [
  { id: 'braland-logo', name: 'BraLand Logo',   logo: '/assets/brand/braland-logo.png', category: 'brand' },
  { id: 'brabet-logo',  name: 'BraBet Logo',    logo: '/assets/brand/brabet-logo.png',  category: 'brand' },
  { id: 'canal-bra',    name: 'Canal BRA Logo', logo: '/assets/brand/canal-bra.png',    category: 'brand' },
]

export const TEAM_CATEGORY_META: Record<TeamCategory, { label: string; emoji: string }> = {
  BR: { label: 'Times Brasileiros', emoji: '🇧🇷' },
  EU: { label: 'Europa',            emoji: '🌍' },
  NT: { label: 'Seleções',          emoji: '🏳' },
}
