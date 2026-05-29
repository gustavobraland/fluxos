// ─── Mock Sports Provider ─────────────────────────────────────────────────────
// Emits realistic GOAL events only. No corners, yellow cards, or noise.

import type { SportsProvider, GoalEvent } from '../timeline'
import { MOCK_MATCHES } from '../timeline'
import type { FootballTeam, FootballCompetition } from '../football'

// ─── Player pools ─────────────────────────────────────────────────────────────

const PLAYERS: Record<string, { home: string[]; away: string[] }> = {
  'mock-1': {
    home: ['Vinicius Jr.', 'Rodrygo', 'Raphinha', 'Paquetá', 'Endrick'],
    away: ['Messi', 'Lautaro', 'De Paul', 'Álvarez', 'Mac Allister'],
  },
  'mock-2': {
    home: ['Bellingham', 'Mbappé', 'Vinícius Jr.', 'Rodrygo', 'Modric'],
    away: ['Yamal', 'Lewandowski', 'Raphinha', 'Pedri', 'Gavi'],
  },
  'mock-3': {
    home: ['Gerson', 'Arrascaeta', 'Pedro', 'Bruno Henrique', 'De La Cruz'],
    away: ['Estêvão', 'Raphael Veiga', 'Flaco López', 'Gustavo Gómez'],
  },
  'mock-4': {
    home: ['Salah', 'Diaz', 'Núñez', 'Mac Allister', 'Szoboszlai'],
    away: ['Haaland', 'De Bruyne', 'Bernardo', 'Foden', 'Doku'],
  },
  'mock-5': {
    home: ['Kane', 'Musiala', 'Sané', 'Kimmich', 'Gnabry'],
    away: ['Dembélé', 'Neto', 'Hakimi', 'Vitinha', 'Ruiz'],
  },
  'mock-6': {
    home: ['Gerson', 'Arrascaeta', 'Pedro', 'Pulgar'],
    away: ['Thuram', 'Lautaro', 'Calhanoglu', 'Barella'],
  },
  'mock-7': {
    home: ['Saka', 'Martinelli', 'Ødegaard', 'Havertz', 'Rice'],
    away: ['Rashford', 'Højlund', 'Fernandes', 'Eriksen'],
  },
}

function pickPlayer(matchId: string, side: 'home' | 'away'): string {
  const pool = PLAYERS[matchId]?.[side] ?? ['Jogador']
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Mock state ───────────────────────────────────────────────────────────────

interface MockState {
  matchId: string
  homeTeam: FootballTeam
  awayTeam: FootballTeam
  competition: FootballCompetition
  score: { home: number; away: number }
  minute: number
  status: string
  timer?: ReturnType<typeof setTimeout>
}

let _states: MockState[] = []
let _subscribers: Array<(g: GoalEvent) => void> = []
let _counter = 0

function emitGoal(state: MockState): void {
  const side: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away'
  const scorer = pickPlayer(state.matchId, side)
  const minute = Math.min(90, state.minute + Math.floor(Math.random() * 8) + 3)
  state.minute = minute

  if (side === 'home') state.score.home++
  else state.score.away++

  const goal: GoalEvent = {
    id: `mock-${Date.now()}-${++_counter}`,
    matchId: state.matchId,
    team: side,
    scorer,
    minute,
    score: { ...state.score },
    scoreStr: `${state.score.home}-${state.score.away}`,
    homeTeam: { id: state.homeTeam.id, name: state.homeTeam.name, shortName: state.homeTeam.shortName, emoji: state.homeTeam.emoji },
    awayTeam: { id: state.awayTeam.id, name: state.awayTeam.name, shortName: state.awayTeam.shortName, emoji: state.awayTeam.emoji },
    competition: { id: state.competition.id, name: state.competition.name, shortName: state.competition.shortName, emoji: state.competition.emoji },
    timestamp: Date.now(),
  }

  _subscribers.forEach(cb => { try { cb(goal) } catch { /* ignore */ } })
}

function scheduleNext(state: MockState): void {
  if (state.status !== 'live') return
  const delay = 25_000 + Math.random() * 20_000  // 25–45s between goals
  state.timer = setTimeout(() => {
    emitGoal(state)
    scheduleNext(state)
  }, delay)
}

function stopAll(): void {
  _states.forEach(s => { if (s.timer) clearTimeout(s.timer) })
  _states = []
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const mockProvider: SportsProvider = {
  name: 'mock',
  isAvailable: () => true,

  startStreaming: (onGoal) => {
    _subscribers.push(onGoal)

    if (_states.length === 0) {
      _states = MOCK_MATCHES.map(m => ({
        matchId: m.matchId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        competition: m.competition,
        score: { ...m.score },
        minute: m.minute,
        status: m.status,
      }))
      // Live matches: emit first goal quickly (3–6s) for immediate feedback
      _states
        .filter(s => s.status === 'live')
        .forEach((state, i) => {
          setTimeout(() => {
            emitGoal(state)
            scheduleNext(state)
          }, 3000 + i * 1500)
        })
    }

    return () => {
      _subscribers = _subscribers.filter(cb => cb !== onGoal)
      if (_subscribers.length === 0) stopAll()
    }
  },
}
