// ─── War Room adaptive polling ────────────────────────────────────────────────
// Polls a single fixture through our server proxy and feeds the store. Built to
// conserve the API-Football free tier (REGRA DE OURO — ECONOMIA DE CRÉDITOS):
//
//   • Goal / halftime / fulltime drive content. Cards / subs / VAR também viram
//     conteúdo, detectados pelo DIFF dos eventos que já vêm na MESMA resposta
//     (/fixtures?id=) — sem nenhum request extra (mantém a economia de créditos).
//   • Normal cadence is 3 min; tighten to 1 min in the final stretch (elapsed≥80).
//   • Pause to 5 min while at halftime.
//   • Stop completely at fulltime.
//   • Never poll once the match ended, the War Room is inactive, or we are within
//     the 5-request emergency reserve (requestsUsed ≥ 95).
//
// Budget per game ≈ 1 lineup + ~30 normal + ~8 final ≈ 40 requests → ~2 games/day.

import { useWarRoomStore } from '@/store/useWarRoomStore'
import type { Fixture, FixtureStatus } from '@/types/fixtures'
import {
  triggerGoalContent,
  triggerHalftimeContent,
  triggerMatchEndContent,
  triggerCardContent,
  triggerSubContent,
  triggerVarContent,
} from './warroom-content'

const POLL_NORMAL = 3 * 60_000          // 3 min
const POLL_FINAL = 60_000               // 1 min (elapsed ≥ 80')
const POLL_HALFTIME_PAUSE = 5 * 60_000  // 5 min during the interval
const QUOTA_RESERVE = 95                // keep 5 emergency requests

const FINISHED = new Set<FixtureStatus>(['FT', 'AET', 'PEN'])
const FINISHED_EXTRA = new Set<string>(['AWD', 'WO'])

let timer: ReturnType<typeof setTimeout> | null = null
let halftimeFired = false
let stopped = true
// Diff incremental de eventos (sem custo). `baselined` evita reprocessar o
// histórico no 1º poll (ex.: ao entrar com o jogo já em andamento).
let seenEvents = 0
let baselined = false

interface ApiEvent {
  time?: { elapsed?: number | null }
  team?: { id?: number }
  player?: { name?: string | null }
  assist?: { name?: string | null }
  type?: string   // 'Goal' | 'Card' | 'subst' | 'Var'
  detail?: string // 'Yellow Card' | 'Red Card' | 'Substitution N' | detalhe do VAR
}

// Dispara conteúdo para os eventos NOVOS (cartão/sub/VAR) que apareceram desde
// o último poll. Gols são tratados pelo diff de placar (ignorados aqui).
function processNewEvents(fx: Fixture, goals: { home: number; away: number }) {
  const events = (fx as unknown as { events?: ApiEvent[] }).events
  if (!Array.isArray(events)) return
  // 1º poll: estabelece a baseline sem disparar o histórico já ocorrido.
  if (!baselined) {
    seenEvents = events.length
    baselined = true
    return
  }
  for (let i = seenEvents; i < events.length; i++) {
    const ev = events[i]
    const side: 'home' | 'away' = ev.team?.id === fx.teams.away.id ? 'away' : 'home'
    const minute = ev.time?.elapsed ?? null
    const type = (ev.type ?? '').toLowerCase()
    if (type === 'card') {
      triggerCardContent(fx, goals, {
        side, player: ev.player?.name ?? null,
        cardType: /red/i.test(ev.detail ?? '') ? 'red' : 'yellow', minute,
      })
    } else if (type === 'subst') {
      triggerSubContent(fx, goals, {
        side, playerIn: ev.player?.name ?? null, playerOut: ev.assist?.name ?? null, minute,
      })
    } else if (type === 'var') {
      triggerVarContent(fx, goals, ev.detail ?? null)
    }
    // 'goal' é coberto pelo diff de placar — não duplicar aqui.
  }
  seenEvents = events.length
}

function schedule(fixtureId: number, ms: number) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { void pollFixture(fixtureId) }, ms)
}

function isFinished(status: string): boolean {
  return FINISHED.has(status as FixtureStatus) || FINISHED_EXTRA.has(status)
}

async function pollFixture(fixtureId: number): Promise<void> {
  if (stopped) return
  const store = useWarRoomStore.getState()

  // Guard rails — never burn the emergency reserve or poll a dead session
  if (store.matchEnded || !store.activeFixture) { stopPolling(); return }
  if (store.requestsUsed >= QUOTA_RESERVE) {
    store.setPolling(false)
    return
  }

  let data: { fixture: Fixture | null; requestsUsed?: number; error?: string | null }
  try {
    const res = await fetch(`/api/football/fixture?id=${fixtureId}`, { cache: 'no-store' })
    data = await res.json()
  } catch {
    // transient network blip — retry on the normal cadence
    schedule(fixtureId, POLL_NORMAL)
    return
  }

  // A tab switch (or dismiss) may have happened during the await — bail before
  // writing so we never leak one fixture's data into another's session.
  if (stopped || useWarRoomStore.getState().selectedFixtureId !== fixtureId) return

  if (typeof data.requestsUsed === 'number' && data.requestsUsed > 0) {
    store.setRequestsUsed(data.requestsUsed)
  }

  const fx = data.fixture
  if (!fx) { schedule(fixtureId, POLL_NORMAL); return }

  const status = fx.fixture.status.short
  const elapsed = fx.fixture.status.elapsed
  const goals = { home: fx.goals.home ?? 0, away: fx.goals.away ?? 0 }
  const prev = store.liveData

  store.setLiveData({ status, elapsed, goals })

  // Goal detection — only when the score actually increased vs the prior poll
  if (prev) {
    if (goals.home > prev.goals.home) triggerGoalContent('home', fx, goals)
    if (goals.away > prev.goals.away) triggerGoalContent('away', fx, goals)
  }

  // Cartão / substituição / VAR — diff dos eventos da MESMA resposta (custo zero)
  processNewEvents(fx, goals)

  // Halftime — fire once, then back off to the 5 min interval cadence
  if (status === 'HT') {
    if (!halftimeFired) {
      halftimeFired = true
      triggerHalftimeContent(fx, goals)
    }
    schedule(fixtureId, POLL_HALFTIME_PAUSE)
    return
  }

  // Fulltime — produce the end-of-match pack and stop entirely
  if (isFinished(status)) {
    triggerMatchEndContent(fx, goals)
    store.setMatchEnded(true)
    stopPolling()
    return
  }

  // In play — tighten cadence in the closing minutes
  const interval = (elapsed ?? 0) >= 80 ? POLL_FINAL : POLL_NORMAL
  schedule(fixtureId, interval)
}

export function startPolling(fixtureId: number): void {
  stopPolling()
  stopped = false
  halftimeFired = false
  seenEvents = 0
  baselined = false
  useWarRoomStore.getState().setPolling(true)
  void pollFixture(fixtureId)
}

export function stopPolling(): void {
  stopped = true
  if (timer) { clearTimeout(timer); timer = null }
  const store = useWarRoomStore.getState()
  if (store.isPolling) store.setPolling(false)
}
