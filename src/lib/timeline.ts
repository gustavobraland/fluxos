// ─── Sports Module — Core Types ───────────────────────────────────────────────
// Lightweight: only what's needed to show matches and track goals.

import type { FootballTeam, FootballCompetition, MatchStatus } from './football'
import { TEAMS, COMPETITIONS } from './football'

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface SportsProvider {
  name: string
  isAvailable: () => boolean
  startStreaming: (onGoal: (g: GoalEvent) => void) => () => void
}

// ─── Goal Event ───────────────────────────────────────────────────────────────
// The only realtime event that triggers an editorial workflow.

export interface GoalEvent {
  id: string
  matchId: string
  team: 'home' | 'away'
  scorer: string
  minute: number
  score: { home: number; away: number }
  scoreStr: string                        // "1-0"
  homeTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  awayTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  competition: Pick<FootballCompetition, 'id' | 'name' | 'shortName' | 'emoji'>
  timestamp: number
}

// ─── Match (for Timeline display) ────────────────────────────────────────────

export interface MatchEntry {
  id: string
  homeTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  awayTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  competition: Pick<FootballCompetition, 'id' | 'name' | 'shortName' | 'emoji'>
  status: MatchStatus
  minute: number
  score: { home: number; away: number }
  kickoffLabel: string                   // "21:00", "Hoje · 16:30"
}

// ─── Mock Match Pool ──────────────────────────────────────────────────────────

interface MockMatchConfig {
  matchId: string
  homeTeam: FootballTeam
  awayTeam: FootballTeam
  competition: FootballCompetition
  status: 'live' | 'scheduled' | 'halftime'
  score: { home: number; away: number }
  minute: number
  kickoffLabel: string
}

export const MOCK_MATCHES: MockMatchConfig[] = [
  {
    matchId: 'mock-1',
    homeTeam: TEAMS.brazil,
    awayTeam: TEAMS.argentina,
    competition: COMPETITIONS.copa_america,
    status: 'live',
    score: { home: 0, away: 0 },
    minute: 1,
    kickoffLabel: "1'",
  },
  {
    matchId: 'mock-2',
    homeTeam: TEAMS.real_madrid,
    awayTeam: TEAMS.barcelona,
    competition: COMPETITIONS.la_liga,
    status: 'live',
    score: { home: 0, away: 0 },
    minute: 1,
    kickoffLabel: "1'",
  },
  {
    matchId: 'mock-3',
    homeTeam: TEAMS.flamengo,
    awayTeam: TEAMS.palmeiras,
    competition: COMPETITIONS.brasileirao,
    status: 'live',
    score: { home: 0, away: 0 },
    minute: 1,
    kickoffLabel: "1'",
  },
  {
    matchId: 'mock-4',
    homeTeam: TEAMS.liverpool,
    awayTeam: TEAMS.man_city,
    competition: COMPETITIONS.premier,
    status: 'scheduled',
    score: { home: 0, away: 0 },
    minute: 0,
    kickoffLabel: 'Hoje · 16:30',
  },
  {
    matchId: 'mock-5',
    homeTeam: TEAMS.bayern,
    awayTeam: TEAMS.psg,
    competition: COMPETITIONS.champions,
    status: 'scheduled',
    score: { home: 0, away: 0 },
    minute: 0,
    kickoffLabel: 'Hoje · 21:00',
  },
  {
    matchId: 'mock-6',
    homeTeam: TEAMS.flamengo,
    awayTeam: TEAMS.inter_milan,
    competition: COMPETITIONS.libertadores,
    status: 'scheduled',
    score: { home: 0, away: 0 },
    minute: 0,
    kickoffLabel: 'Amanhã · 20:00',
  },
  {
    matchId: 'mock-7',
    homeTeam: TEAMS.arsenal,
    awayTeam: TEAMS.man_united,
    competition: COMPETITIONS.premier,
    status: 'scheduled',
    score: { home: 0, away: 0 },
    minute: 0,
    kickoffLabel: 'Amanhã · 14:00',
  },
]

export function buildMatchList(): MatchEntry[] {
  return MOCK_MATCHES.map(m => ({
    id: m.matchId,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName, emoji: m.homeTeam.emoji },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName, emoji: m.awayTeam.emoji },
    competition: { id: m.competition.id, name: m.competition.name, shortName: m.competition.shortName, emoji: m.competition.emoji },
    status: m.status,
    minute: m.minute,
    score: { ...m.score },
    kickoffLabel: m.kickoffLabel,
  }))
}

/** Compute importance for a goal (used by mock provider for ordering). */
export function computeGoalImportance(
  homeTeam: Pick<FootballTeam, 'isBrazilNationalTeam' | 'isNationalTeam'>,
  awayTeam: Pick<FootballTeam, 'isBrazilNationalTeam' | 'isNationalTeam'>,
  competition: Pick<FootballCompetition, 'isWorldCup' | 'isCopaAmerica'>,
): number {
  let score = 70
  if (homeTeam.isBrazilNationalTeam || awayTeam.isBrazilNationalTeam) score += 25
  else if (homeTeam.isNationalTeam || awayTeam.isNationalTeam) score += 12
  if (competition.isWorldCup) score += 30
  if (competition.isCopaAmerica) score += 15
  return Math.min(100, score)
}
