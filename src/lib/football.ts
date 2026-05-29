// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'pre' | 'live' | 'halftime' | 'finished'
export type FootballEventType =
  | 'goal' | 'yellowcard' | 'redcard' | 'penalty' | 'var'
  | 'sub' | 'halftime' | 'fulltime' | 'corner' | 'offside'

export interface FootballTeam {
  id: string
  name: string
  shortName: string
  emoji: string
  country: string
  tier: 1 | 2 | 3
  isBrazilNationalTeam?: boolean
  isNationalTeam?: boolean
  basePriority: number
  apiId?: number   // API-Football numeric team ID
}

export interface FootballCompetition {
  id: string
  name: string
  shortName: string
  emoji: string
  country: string
  tier: 1 | 2
  isWorldCup?: boolean
  isWorldCupQualifier?: boolean
  isCopaAmerica?: boolean
  basePriority: number
}

export interface MatchEvent {
  id: string
  minute: number
  type: FootballEventType
  team: 'home' | 'away'
  player: string
  description: string
}

export interface AISignal {
  id: string
  icon: string
  title: string
  subtitle: string
  confidence: number
  color: string
  urgency: 'go' | 'watch' | 'urgent'
}

export interface ContentQueueItem {
  id: string
  matchId: string
  title: string
  caption: string
  hashtags: string[]
  platforms: string[]
  status: 'generating' | 'ready' | 'reviewing' | 'published'
  triggeredBy: string
  createdAt: number
}

export interface LiveMatch {
  id: string
  homeTeam: FootballTeam
  awayTeam: FootballTeam
  competition: FootballCompetition
  status: MatchStatus
  score: { home: number; away: number }
  minute: number
  events: MatchEvent[]
  priorityScore: number
  trendScore: number
  audienceScore: number
  rivalryScore: number
  aiRecommendation: string
  aiSignals: AISignal[]
  inWarRoom: boolean
  kickoffLabel: string
  isBrazilNationalTeam: boolean
  isWorldCup: boolean
  isWorldCupQualifier: boolean
}

// ─── Team Registry ────────────────────────────────────────────────────────────

export const TEAMS: Record<string, FootballTeam> = {
  // ── National Teams ─────────────────────────────────────────────────────────
  brazil:    { id: 'brazil',    name: 'Brasil',     shortName: 'BRA', emoji: '🇧🇷', country: 'BR', tier: 1, isBrazilNationalTeam: true, isNationalTeam: true, basePriority: 100, apiId: 6   },
  argentina: { id: 'argentina', name: 'Argentina',  shortName: 'ARG', emoji: '🇦🇷', country: 'AR', tier: 1, isNationalTeam: true, basePriority: 90,  apiId: 26  },
  france:    { id: 'france',    name: 'França',     shortName: 'FRA', emoji: '🇫🇷', country: 'FR', tier: 1, isNationalTeam: true, basePriority: 85,  apiId: 2   },
  england:   { id: 'england',   name: 'Inglaterra', shortName: 'ENG', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'EN', tier: 1, isNationalTeam: true, basePriority: 84,  apiId: 10  },
  germany:   { id: 'germany',   name: 'Alemanha',   shortName: 'GER', emoji: '🇩🇪', country: 'DE', tier: 1, isNationalTeam: true, basePriority: 83,  apiId: 25  },
  // ── Brazilian Clubs ─────────────────────────────────────────────────────────
  flamengo:      { id: 'flamengo',      name: 'Flamengo',      shortName: 'FLA', emoji: '🔴⚫',   country: 'BR', tier: 1, basePriority: 95, apiId: 127  },
  corinthians:   { id: 'corinthians',   name: 'Corinthians',   shortName: 'COR', emoji: '⚫⚪',   country: 'BR', tier: 1, basePriority: 90, apiId: 131  },
  palmeiras:     { id: 'palmeiras',     name: 'Palmeiras',     shortName: 'PAL', emoji: '💚',     country: 'BR', tier: 1, basePriority: 92, apiId: 121  },
  sao_paulo:     { id: 'sao_paulo',     name: 'São Paulo',     shortName: 'SPF', emoji: '🔴⚫⚪', country: 'BR', tier: 1, basePriority: 88, apiId: 126  },
  botafogo:      { id: 'botafogo',      name: 'Botafogo',      shortName: 'BOT', emoji: '⚫⭐',   country: 'BR', tier: 2, basePriority: 80, apiId: 130  },
  fluminense:    { id: 'fluminense',    name: 'Fluminense',    shortName: 'FLU', emoji: '🟢🔴⚪', country: 'BR', tier: 2, basePriority: 78, apiId: 124  },
  vasco:         { id: 'vasco',         name: 'Vasco',         shortName: 'VAS', emoji: '⚫⚪',   country: 'BR', tier: 2, basePriority: 78, apiId: 128  },
  gremio:        { id: 'gremio',        name: 'Grêmio',        shortName: 'GRE', emoji: '🔵⚫',   country: 'BR', tier: 2, basePriority: 78, apiId: 119  },
  internacional: { id: 'internacional', name: 'Internacional', shortName: 'INT', emoji: '🔴⚪',   country: 'BR', tier: 2, basePriority: 78, apiId: 120  },
  atletico_mg:   { id: 'atletico_mg',   name: 'Atlético-MG',  shortName: 'CAM', emoji: '⚫⚪',   country: 'BR', tier: 2, basePriority: 80, apiId: 1062 },
  cruzeiro:      { id: 'cruzeiro',      name: 'Cruzeiro',     shortName: 'CRU', emoji: '🔵⚪',   country: 'BR', tier: 2, basePriority: 76, apiId: 123  },
  santos:        { id: 'santos',        name: 'Santos',        shortName: 'SAN', emoji: '⚪⚫',   country: 'BR', tier: 2, basePriority: 76, apiId: 122  },
  // ── European Clubs ──────────────────────────────────────────────────────────
  real_madrid: { id: 'real_madrid', name: 'Real Madrid', shortName: 'RMA', emoji: '⚪👑', country: 'ES', tier: 1, basePriority: 90, apiId: 541 },
  barcelona:   { id: 'barcelona',   name: 'Barcelona',   shortName: 'BAR', emoji: '🔵🔴', country: 'ES', tier: 1, basePriority: 88, apiId: 529 },
  liverpool:   { id: 'liverpool',   name: 'Liverpool',   shortName: 'LIV', emoji: '🔴🦅', country: 'EN', tier: 1, basePriority: 86, apiId: 40  },
  man_city:    { id: 'man_city',    name: 'Man. City',   shortName: 'MCI', emoji: '🔵⚡', country: 'EN', tier: 1, basePriority: 86, apiId: 50  },
  man_united:  { id: 'man_united',  name: 'Man. United', shortName: 'MNU', emoji: '🔴😈', country: 'EN', tier: 1, basePriority: 84, apiId: 33  },
  arsenal:     { id: 'arsenal',     name: 'Arsenal',     shortName: 'ARS', emoji: '🔴⚪', country: 'EN', tier: 1, basePriority: 83, apiId: 42  },
  chelsea:     { id: 'chelsea',     name: 'Chelsea',     shortName: 'CHE', emoji: '🔵⚪', country: 'EN', tier: 1, basePriority: 82, apiId: 49  },
  psg:         { id: 'psg',         name: 'PSG',         shortName: 'PSG', emoji: '🔵🔴', country: 'FR', tier: 1, basePriority: 86, apiId: 85  },
  bayern:      { id: 'bayern',      name: 'Bayern',      shortName: 'BAY', emoji: '🔴⚪', country: 'DE', tier: 1, basePriority: 87, apiId: 157 },
  juventus:    { id: 'juventus',    name: 'Juventus',    shortName: 'JUV', emoji: '⚫⚪', country: 'IT', tier: 1, basePriority: 82, apiId: 496 },
  inter_milan: { id: 'inter_milan', name: 'Inter Milan', shortName: 'INT', emoji: '🔵⚫', country: 'IT', tier: 1, basePriority: 84, apiId: 505 },
  ac_milan:    { id: 'ac_milan',    name: 'AC Milan',    shortName: 'MIL', emoji: '🔴⚫', country: 'IT', tier: 1, basePriority: 83, apiId: 489 },
}

// ─── Competition Registry ─────────────────────────────────────────────────────

export const COMPETITIONS: Record<string, FootballCompetition> = {
  world_cup:    { id: 'world_cup',    name: 'Copa do Mundo FIFA',         shortName: 'MUNDIAL',      emoji: '🏆', country: 'INT', tier: 1, isWorldCup: true,          basePriority: 100 },
  wcq_sa:       { id: 'wcq_sa',       name: 'Eliminatórias Copa do Mundo', shortName: 'ELIMINATÓRIAS',emoji: '🌎', country: 'SA',  tier: 1, isWorldCupQualifier: true, basePriority: 92  },
  copa_america: { id: 'copa_america', name: 'Copa América',                shortName: 'COPA AM.',     emoji: '🌎', country: 'SA',  tier: 1, isCopaAmerica: true,       basePriority: 90  },
  brasileirao:  { id: 'brasileirao',  name: 'Brasileirão Série A',         shortName: 'BRASILEIRÃO',  emoji: '🇧🇷', country: 'BR', tier: 1,                           basePriority: 85  },
  copa_brasil:  { id: 'copa_brasil',  name: 'Copa do Brasil',              shortName: 'COPA BR.',     emoji: '🇧🇷', country: 'BR', tier: 1,                           basePriority: 82  },
  libertadores: { id: 'libertadores', name: 'CONMEBOL Libertadores',       shortName: 'LIBERTADORES', emoji: '🏆', country: 'SA',  tier: 1,                           basePriority: 88  },
  sul_americana:{ id: 'sul_americana',name: 'CONMEBOL Sul-Americana',      shortName: 'SUL-AM.',      emoji: '🌎', country: 'SA',  tier: 2,                           basePriority: 74  },
  champions:    { id: 'champions',    name: 'UEFA Champions League',       shortName: 'UCL',          emoji: '⭐', country: 'EU',  tier: 1,                           basePriority: 90  },
  europa:       { id: 'europa',       name: 'UEFA Europa League',          shortName: 'UEL',          emoji: '🟠', country: 'EU',  tier: 2,                           basePriority: 76  },
  premier:      { id: 'premier',      name: 'Premier League',              shortName: 'PREMIER',      emoji: '🦁', country: 'EN',  tier: 1,                           basePriority: 82  },
  la_liga:      { id: 'la_liga',      name: 'La Liga',                     shortName: 'LA LIGA',      emoji: '🇪🇸', country: 'ES', tier: 1,                           basePriority: 80  },
  serie_a:      { id: 'serie_a',      name: 'Serie A',                     shortName: 'SERIE A',      emoji: '🇮🇹', country: 'IT', tier: 1,                           basePriority: 78  },
  bundesliga:   { id: 'bundesliga',   name: 'Bundesliga',                  shortName: 'BUNDESLIGA',   emoji: '🇩🇪', country: 'DE', tier: 1,                           basePriority: 78  },
  ligue_1:      { id: 'ligue_1',      name: 'Ligue 1',                     shortName: 'LIGUE 1',      emoji: '🇫🇷', country: 'FR', tier: 1,                           basePriority: 75  },
}

// ─── Competition → API-Football League ID ────────────────────────────────────

/** Maps internal competition key → API-Football league ID for fixture queries */
export const COMPETITION_LEAGUE_IDS: Record<string, number> = {
  world_cup:    1,
  copa_america: 9,
  wcq_sa:       34,
  champions:    2,
  europa:       3,
  premier:      39,
  la_liga:      140,
  bundesliga:   78,
  serie_a:      135,
  ligue_1:      61,
  brasileirao:  71,
  copa_brasil:  73,
  libertadores: 13,
  sul_americana:11,
  club_world_cup: 1,
}

// ─── Priority API IDs (numeric, for cron fixture queries) ────────────────────

/** All priority team API-Football numeric IDs — used by cron sync */
export const PRIORITY_TEAM_API_IDS: number[] = Object.values(TEAMS)
  .filter(t => t.apiId !== undefined)
  .map(t => t.apiId!)

/** Set of all priority team API-Football IDs for O(1) lookup */
export const PRIORITY_TEAM_API_ID_SET: Set<number> = new Set(PRIORITY_TEAM_API_IDS)

/** League IDs fetched by league (not by team) — covers all BR club matches */
export const LEAGUE_FETCH_IDS: number[] = [71, 73, 13, 11, 34, 9, 2, 3, 1]

// ─── Rivalry Registry ─────────────────────────────────────────────────────────

const RIVALRIES: Array<[string, string, number]> = [
  ['flamengo',    'botafogo',     90],
  ['flamengo',    'fluminense',   88],
  ['flamengo',    'vasco',        92],
  ['corinthians', 'palmeiras',    96],
  ['corinthians', 'sao_paulo',    90],
  ['palmeiras',   'sao_paulo',    88],
  ['gremio',      'internacional',92],
  ['real_madrid', 'barcelona',   100],
  ['liverpool',   'man_united',   96],
  ['man_city',    'man_united',   90],
  ['inter_milan', 'ac_milan',     94],
  ['brazil',      'argentina',   100],
  ['psg',         'bayern',       82],
]

export function getRivalryScore(a: string, b: string): number {
  const found = RIVALRIES.find(([x, y]) => (x === a && y === b) || (x === b && y === a))
  return found ? found[2] : 50
}

// ─── Priority Engine ──────────────────────────────────────────────────────────

export function calculatePriority(
  home: FootballTeam,
  away: FootballTeam,
  comp: FootballCompetition,
  status: MatchStatus,
  trendBoost = 0,
): number {
  let score = 0
  const clubBase = Math.max(home.basePriority, away.basePriority)
  score += clubBase * 0.42
  if (home.isBrazilNationalTeam || away.isBrazilNationalTeam) score += 32
  else if (home.isNationalTeam && away.isNationalTeam) score += 16
  score += comp.basePriority * 0.32
  if (comp.isWorldCup) score += 28
  if (comp.isWorldCupQualifier) score += 16
  if (comp.isCopaAmerica) score += 10
  if (status === 'live') score += 12
  else if (status === 'halftime') score += 6
  const rivalry = getRivalryScore(home.id, away.id)
  score += rivalry * 0.14
  score += trendBoost * 0.08
  return Math.min(100, Math.round(score))
}

// ─── Auto-Promotion Logic ─────────────────────────────────────────────────────

export function shouldAutoPromote(match: LiveMatch): boolean {
  if (match.homeTeam.isBrazilNationalTeam || match.awayTeam.isBrazilNationalTeam) return true
  if (match.isWorldCup) return true
  if (match.isWorldCupQualifier && match.status === 'live') return true
  if (match.status === 'live' && match.priorityScore >= 88) return true
  return false
}

// ─── AI Recommendation Engine ─────────────────────────────────────────────────

const RECS_BRAZIL_NT = [
  'Seleção ao vivo — máxima prioridade operacional',
  'Deploy imediato — audiência global 7× acima da média',
  'Todos os pré-packs do Brasil prontos para deploy',
]
const RECS_LIVE_HIGH = [
  'Momento de pico — deploy agora, janela: 8 min',
  'Audiência em máximo — conteúdo viral agora',
  'Trending — capitalize neste instante',
]
const RECS_LIVE_MED = [
  'Potencial crescendo — monitore próximos 10 min',
  'Engajamento acima da média — prepare conteúdo',
  'Janela detectada — aguarde próximo evento',
]
const RECS_UPCOMING = [
  'Alta expectativa — prepare pré-packs agora',
  'Rivalidade histórica — maximize cobertura',
  'Audiência prevista: pico máximo esperado',
]

export function getAIRecommendation(match: LiveMatch): string {
  const pool =
    (match.homeTeam.isBrazilNationalTeam || match.awayTeam.isBrazilNationalTeam) ? RECS_BRAZIL_NT :
    (match.status === 'live' && match.priorityScore >= 88) ? RECS_LIVE_HIGH :
    match.status === 'live' ? RECS_LIVE_MED :
    RECS_UPCOMING
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── AI Signal Generator ──────────────────────────────────────────────────────

const SIGNAL_TEMPLATES = {
  trending_brazil: { icon: '🇧🇷', title: 'Brasil trending globalmente',   subtitle: 'Deploy máxima cobertura agora',  color: '#3ECF8E', urgency: 'urgent' as const, baseConf: 96 },
  goal_window:     { icon: '⚽', title: 'Janela pós-gol ativa',           subtitle: 'CTR +340% nos próximos 6 min',   color: '#F07B54', urgency: 'urgent' as const, baseConf: 94 },
  audience_spike:  { icon: '📈', title: 'Pico de audiência detectado',    subtitle: 'Tráfego social acima da média',  color: '#5BB8E8', urgency: 'go'     as const, baseConf: 87 },
  meme_window:     { icon: '😂', title: 'Janela de viralização',          subtitle: 'Alta probabilidade de viral',    color: '#A78BFA', urgency: 'go'     as const, baseConf: 82 },
  rivalry_heat:    { icon: '🔥', title: 'Rivalidade em máxima tensão',    subtitle: 'Deploy conteúdo de clássico',    color: '#F5A040', urgency: 'watch'  as const, baseConf: 79 },
  best_timing:     { icon: '🎯', title: 'Melhor slot de publicação',      subtitle: 'Baseado no histórico de CTR',    color: '#3ECF8E', urgency: 'watch'  as const, baseConf: 74 },
  twitter_spike:   { icon: '𝕏',  title: 'Velocidade no X acelerando',    subtitle: 'Volume de menções 3× esperado',  color: '#5BB8E8', urgency: 'go'     as const, baseConf: 81 },
}

export function generateAISignals(match: LiveMatch): AISignal[] {
  const signals: AISignal[] = []
  const t = SIGNAL_TEMPLATES
  if ((match.homeTeam.isBrazilNationalTeam || match.awayTeam.isBrazilNationalTeam) && match.status === 'live') {
    signals.push({ id: 's1', ...t.trending_brazil, confidence: t.trending_brazil.baseConf + Math.floor(Math.random() * 4) })
  }
  if (match.status === 'live') {
    signals.push({ id: 's2', ...t.audience_spike, confidence: t.audience_spike.baseConf + Math.floor(Math.random() * 6) })
    signals.push({ id: 's3', ...t.twitter_spike,  confidence: t.twitter_spike.baseConf  + Math.floor(Math.random() * 6) })
  }
  if (match.rivalryScore >= 88) {
    signals.push({ id: 's4', ...t.rivalry_heat, confidence: t.rivalry_heat.baseConf + Math.floor(Math.random() * 8) })
  }
  signals.push({ id: 's5', ...t.best_timing, confidence: t.best_timing.baseConf + Math.floor(Math.random() * 8) })
  return signals.slice(0, 4)
}

// ─── Goal Caption Generator ───────────────────────────────────────────────────

export function generateGoalCaption(
  match: LiveMatch,
  scoringTeam: 'home' | 'away',
  player: string,
): ContentQueueItem {
  const team = scoringTeam === 'home' ? match.homeTeam : match.awayTeam
  const score = `${match.score.home}–${match.score.away}`
  const competitor = scoringTeam === 'home' ? match.awayTeam : match.homeTeam

  let caption = ''
  let hashtags: string[] = []
  let platforms = ['instagram', 'twitter']

  if (team.isBrazilNationalTeam) {
    caption = `GOOOL DO BRASIL! 🇧🇷 ${player} coloca a Seleção na frente! ${score} #VaiBrasil #Seleção`
    hashtags = ['#Brasil', '#Seleção', '#VaiBrasil', `#${competitor.shortName}`]
    platforms = ['instagram', 'twitter', 'telegram', 'linkedin']
  } else {
    caption = `GOOOOL do ${team.name}! ⚽ ${player} balança as redes! ${score} vs ${competitor.name} ${team.emoji}`
    hashtags = [`#${team.shortName}`, `#${team.name.replace(/\s/g, '')}`, `#${match.competition.shortName.replace(/[^a-zA-Z0-9]/g, '')}`, '#Gol']
  }

  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matchId: match.id,
    title: `⚽ Gol — ${team.name} (${score})`,
    caption,
    hashtags,
    platforms,
    status: 'generating',
    triggeredBy: `Gol de ${player} aos ${match.minute}'`,
    createdAt: Date.now(),
  }
}

// ─── API Response Mapper ──────────────────────────────────────────────────────

// API-Football team name → our registry key
const TEAM_NAME_MAP: Record<string, string> = {
  // Brazilian clubs
  'Flamengo': 'flamengo',
  'Flamengo RJ': 'flamengo',
  'Corinthians': 'corinthians',
  'Sport Club Corinthians Paulista': 'corinthians',
  'Palmeiras': 'palmeiras',
  'SE Palmeiras': 'palmeiras',
  'São Paulo': 'sao_paulo',
  'Sao Paulo': 'sao_paulo',
  'Botafogo': 'botafogo',
  'Botafogo RJ': 'botafogo',
  'Fluminense': 'fluminense',
  'Fluminense FC': 'fluminense',
  'Vasco': 'vasco',
  'Vasco da Gama': 'vasco',
  'CR Vasco da Gama': 'vasco',
  'Grêmio': 'gremio',
  'Gremio': 'gremio',
  'Grêmio FB Porto Alegrense': 'gremio',
  'Internacional': 'internacional',
  'SC Internacional': 'internacional',
  'Atlético Mineiro': 'atletico_mg',
  'Atletico MG': 'atletico_mg',
  'Atlético-MG': 'atletico_mg',
  'Club Atlético Mineiro': 'atletico_mg',
  'Cruzeiro': 'cruzeiro',
  'Cruzeiro EC': 'cruzeiro',
  'Santos': 'santos',
  'Santos FC': 'santos',
  // National teams
  'Brazil': 'brazil',
  'Brasil': 'brazil',
  'Argentina': 'argentina',
  'France': 'france',
  'England': 'england',
  'Germany': 'germany',
  // European clubs
  'Real Madrid': 'real_madrid',
  'Barcelona': 'barcelona',
  'Liverpool': 'liverpool',
  'Manchester City': 'man_city',
  'Man City': 'man_city',
  'Manchester United': 'man_united',
  'Man United': 'man_united',
  'Arsenal': 'arsenal',
  'Chelsea': 'chelsea',
  'Paris Saint Germain': 'psg',
  'PSG': 'psg',
  'Paris SG': 'psg',
  'Bayern Munich': 'bayern',
  'FC Bayern München': 'bayern',
  'Juventus': 'juventus',
  'Inter': 'inter_milan',
  'Internazionale': 'inter_milan',
  'Inter Milan': 'inter_milan',
  'AC Milan': 'ac_milan',
  'Milan': 'ac_milan',
}

// API-Football league ID → our competition key
const LEAGUE_ID_MAP: Record<number, string> = {
  1:   'world_cup',
  11:  'wcq_sa',
  9:   'copa_america',
  71:  'brasileirao',
  73:  'copa_brasil',
  13:  'libertadores',
  14:  'sul_americana',
  2:   'champions',
  3:   'europa',
  39:  'premier',
  140: 'la_liga',
  135: 'serie_a',
  78:  'bundesliga',
  61:  'ligue_1',
}

function mapAPIStatus(short: string): MatchStatus {
  switch (short) {
    case '1H': case '2H': case 'ET': case 'PEN': case 'BT': return 'live'
    case 'HT': return 'halftime'
    case 'FT': case 'AET': case 'PEN_WL': return 'finished'
    case 'NS': return 'scheduled'
    case 'PST': case 'SUSP': case 'INT': return 'scheduled'
    default: return 'scheduled'
  }
}

function mapAPIEventType(type: string, detail: string): FootballEventType | null {
  if (type === 'Goal') return detail === 'Penalty' ? 'penalty' : 'goal'
  if (type === 'Card' && detail === 'Yellow Card') return 'yellowcard'
  if (type === 'Card' && (detail === 'Red Card' || detail === 'Second Yellow card')) return 'redcard'
  if (type === 'subst') return 'sub'
  if (type === 'Var') return 'var'
  return null
}

function makeKickoffLabel(dateStr: string, status: MatchStatus, minute: number, elapsed?: string): string {
  if (status === 'live') return `Ao Vivo · ${minute}'`
  if (status === 'halftime') return 'Intervalo'
  if (status === 'finished') return 'Encerrado'

  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

    if (diffDays <= 0) return `Hoje ${timeStr}`
    if (diffDays === 1) return `Amanhã ${timeStr}`
    const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    return `${dayStr} ${timeStr}`
  } catch {
    return status
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAPIFixture(fixture: any): LiveMatch | null {
  try {
    const f = fixture.fixture
    const league = fixture.league
    const teams = fixture.teams
    const goals = fixture.goals
    const events = fixture.events ?? []

    // Map teams
    const homeKey = TEAM_NAME_MAP[teams.home.name]
    const awayKey = TEAM_NAME_MAP[teams.away.name]
    const homeTeam: FootballTeam = homeKey
      ? TEAMS[homeKey]
      : { id: String(teams.home.id), name: teams.home.name, shortName: teams.home.name.slice(0, 3).toUpperCase(), emoji: '⚽', country: league.country?.slice(0, 2).toUpperCase() ?? 'INT', tier: 3, basePriority: 50 }
    const awayTeam: FootballTeam = awayKey
      ? TEAMS[awayKey]
      : { id: String(teams.away.id), name: teams.away.name, shortName: teams.away.name.slice(0, 3).toUpperCase(), emoji: '⚽', country: league.country?.slice(0, 2).toUpperCase() ?? 'INT', tier: 3, basePriority: 50 }

    // Map competition
    const compKey = LEAGUE_ID_MAP[league.id]
    const competition: FootballCompetition = compKey
      ? COMPETITIONS[compKey]
      : { id: String(league.id), name: league.name, shortName: league.name.slice(0, 10).toUpperCase(), emoji: '🏆', country: league.country?.slice(0, 2).toUpperCase() ?? 'INT', tier: 2, basePriority: 60 }

    // Map status and minute
    const status = mapAPIStatus(f.status.short)
    const minute = f.status.elapsed ?? 0

    // Map events
    const matchEvents: MatchEvent[] = events
      .map((e: { time: { elapsed: number }; team: { id: number; name: string }; player: { name: string }; type: string; detail: string }) => {
        const evType = mapAPIEventType(e.type, e.detail)
        if (!evType) return null
        const teamSide: 'home' | 'away' = e.team.id === teams.home.id ? 'home' : 'away'
        return {
          id: `${f.id}-${e.time.elapsed}-${e.type}-${e.player?.name ?? 'u'}`,
          minute: e.time.elapsed,
          type: evType,
          team: teamSide,
          player: e.player?.name ?? '',
          description: `${e.detail} — ${e.player?.name ?? ''}`,
        } satisfies MatchEvent
      })
      .filter(Boolean)

    const score = { home: goals.home ?? 0, away: goals.away ?? 0 }
    const kickoffLabel = makeKickoffLabel(f.date, status, minute)

    const isBrazilNT = !!(homeTeam.isBrazilNationalTeam || awayTeam.isBrazilNationalTeam)
    const isWorldCup = !!(competition.isWorldCup)
    const isWCQ = !!(competition.isWorldCupQualifier)
    const rivalryScore = getRivalryScore(homeTeam.id, awayTeam.id)
    const trendScore = isBrazilNT ? 95 : isWorldCup ? 90 : rivalryScore >= 90 ? 80 : 60
    const priorityScore = calculatePriority(homeTeam, awayTeam, competition, status, trendScore)

    const partial: LiveMatch = {
      id: String(f.id),
      homeTeam, awayTeam, competition,
      status, score, minute,
      events: matchEvents,
      priorityScore, trendScore,
      audienceScore: Math.min(100, Math.round(priorityScore * 0.95)),
      rivalryScore,
      aiRecommendation: '',
      aiSignals: [],
      inWarRoom: false,
      kickoffLabel,
      isBrazilNationalTeam: isBrazilNT,
      isWorldCup,
      isWorldCupQualifier: isWCQ,
    }
    partial.aiRecommendation = getAIRecommendation(partial)
    partial.aiSignals = generateAISignals(partial)

    return partial
  } catch {
    return null
  }
}
