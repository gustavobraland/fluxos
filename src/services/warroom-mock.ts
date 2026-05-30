// ─── War Room mock match (development only) ───────────────────────────────────
// Drives the store through a scripted game progression in accelerated time so the
// full flow — content queue, pre-packs, deploy to Multipost — can be validated
// WITHOUT spending API-Football quota.
//
// It deliberately reuses the REAL trigger functions and the SAME store mutations
// the live poller performs (setLiveData + goal-diff detection), so what you see
// here is exactly what a live match would produce.
//
// Guarded by NODE_ENV === 'development'. No-ops in production.

import { useWarRoomStore } from '@/store/useWarRoomStore'
import { stopPolling } from './warroom-polling'
import {
  triggerGoalContent,
  triggerHalftimeContent,
  triggerMatchEndContent,
} from './warroom-content'
import type { FixtureStatus } from '@/types/fixtures'
import { toast } from 'sonner'

interface MockStep {
  status: FixtureStatus
  elapsed: number | null
  goals: { home: number; away: number }
}

// 7 states, 3 s apart. Final placar 1–1 → pré-pack Empate.
const SEQUENCE: MockStep[] = [
  { status: 'NS', elapsed: null, goals: { home: 0, away: 0 } }, // 1. não iniciado
  { status: '1H', elapsed: 20,   goals: { home: 0, away: 0 } }, // 2. em jogo, sem gols
  { status: '1H', elapsed: 35,   goals: { home: 1, away: 0 } }, // 3. gol home → goal trigger
  { status: 'HT', elapsed: 45,   goals: { home: 1, away: 0 } }, // 4. intervalo → halftime trigger + pausa
  { status: '2H', elapsed: 65,   goals: { home: 1, away: 0 } }, // 5. 2º tempo
  { status: '2H', elapsed: 82,   goals: { home: 1, away: 1 } }, // 6. gol away → goal trigger
  { status: 'FT', elapsed: 90,   goals: { home: 1, away: 1 } }, // 7. fim → match-end + pré-pack Empate + Multipost
]

const STEP_MS = 3000

const isDev = process.env.NODE_ENV === 'development'

let timers: ReturnType<typeof setTimeout>[] = []
let running = false

/** Lets the page suppress the live poller while a simulation is active. */
export function isMockRunning(): boolean {
  return running
}

function applyStep(step: MockStep): void {
  const store = useWarRoomStore.getState()
  const fx = store.activeFixture
  if (!fx || !running) return

  const prev = store.liveData
  const goals = step.goals

  // Same snapshot the live poller writes
  store.setLiveData({ status: step.status, elapsed: step.elapsed, goals })

  // Goal detection by score increase vs the previous state (identical to polling)
  if (prev) {
    if (goals.home > prev.goals.home) triggerGoalContent('home', fx, goals)
    if (goals.away > prev.goals.away) triggerGoalContent('away', fx, goals)
  }

  if (step.status === 'HT') {
    triggerHalftimeContent(fx, goals)
    store.setPolling(false) // pausa no intervalo
    toast.message('⏸️ Intervalo — monitoramento pausado')
    return
  }

  if (step.status === '2H' && !store.isPolling) {
    store.setPolling(true) // retoma no 2º tempo
  }

  if (step.status === 'FT') {
    triggerMatchEndContent(fx, goals) // ativa pré-pack + popula Multipost
    store.setMatchEnded(true)
    store.setPolling(false)
    running = false
    toast.success('🏁 Simulação concluída — pré-pack Empate enviado ao Multipost')
  }
}

export function startMockMatch(): void {
  if (!isDev) return

  const store = useWarRoomStore.getState()
  if (!store.activeFixture) {
    toast.error('Selecione uma partida antes de simular')
    return
  }

  stopMockMatch()  // clear any prior run
  stopPolling()    // take over from the real poller (no API calls during the sim)

  running = true
  store.reset()              // fresh session: queue, pré-packs, liveData, matchEnded
  store.setPolling(true)
  toast.message('▶ Simulação iniciada — jogo em tempo acelerado')

  SEQUENCE.forEach((step, i) => {
    timers.push(setTimeout(() => applyStep(step), i * STEP_MS))
  })
}

export function stopMockMatch(): void {
  timers.forEach(clearTimeout)
  timers = []
  running = false
}
