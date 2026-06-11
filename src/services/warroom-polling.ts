// ─── War Room adaptive polling ────────────────────────────────────────────────
// Polls a single fixture through our server proxy and feeds the LINHA DO TEMPO
// de eventos (store.events). NÃO gera conteúdo automaticamente — cada lance vira
// um item da timeline e o usuário escolhe quais postar via "Deploy".
// Built to conserve the API-Football free tier (REGRA DE OURO — ECONOMIA):
//
//   • Eventos (gol, cartão, sub, VAR) vêm na MESMA resposta (/fixtures?id=),
//     sem nenhum request extra. Sincronizamos a timeline a cada poll.
//   • Marcos de fase (intervalo, prorrogação, intervalo da prorrogação, pênaltis,
//     fim de jogo) são detectados pelo status e adicionados à timeline uma vez.
//   • Cadência normal 3 min; aperta para 1 min na reta final (≥80') e na
//     prorrogação/pênaltis. Pausa 5 min no intervalo. Para de vez no fim.
//   • Nunca consome a reserva de emergência (requestsUsed ≥ 95).

import { useWarRoomStore, type MatchEvent, type MatchEventKind } from '@/store/useWarRoomStore'
import type { Fixture, FixtureStatus } from '@/types/fixtures'

const POLL_NORMAL = 3 * 60_000          // 3 min
const POLL_FINAL = 60_000               // 1 min (reta final / prorrogação)
const POLL_HALFTIME_PAUSE = 5 * 60_000  // 5 min durante o intervalo
const QUOTA_RESERVE = 95                // mantém 5 requests de emergência

const FINISHED = new Set<FixtureStatus>(['FT', 'AET', 'PEN'])
const FINISHED_EXTRA = new Set<string>(['AWD', 'WO'])

let timer: ReturnType<typeof setTimeout> | null = null
let stopped = true

type Goals = { home: number; away: number }

interface ApiEvent {
  time?: { elapsed?: number | null }
  team?: { id?: number }
  player?: { name?: string | null }
  assist?: { name?: string | null }
  type?: string   // 'Goal' | 'Card' | 'subst' | 'Var'
  detail?: string // 'Yellow Card' | 'Red Card' | 'Substitution N' | detalhe do VAR
}

// Mapeia os eventos da API em MatchEvent[], calculando o placar corrente em
// cada lance (gols incrementam o placar na ordem cronológica).
function mapApiEvents(fx: Fixture): MatchEvent[] {
  const raw = (fx as unknown as { events?: ApiEvent[] }).events
  if (!Array.isArray(raw)) return []
  const out: MatchEvent[] = []
  let h = 0
  let a = 0
  raw.forEach((ev, i) => {
    const type = (ev.type ?? '').toLowerCase()
    const side: 'home' | 'away' = ev.team?.id === fx.teams.away.id ? 'away' : 'home'
    const teamName = fx.teams[side].name
    const minute = ev.time?.elapsed ?? null
    const player = ev.player?.name ?? null
    const assist = ev.assist?.name ?? null
    const detail = ev.detail ?? null

    if (type === 'goal') {
      if (side === 'home') h += 1; else a += 1
    }
    const score = { home: h, away: a }
    const sortKey = (minute ?? 0) * 100 + i
    const base = { source: 'api' as const, minute, sortKey, side, teamName, score, deployed: false }

    if (type === 'goal') {
      out.push({ ...base, id: `goal-${minute}-${side}-${player ?? i}`, kind: 'goal', player, assist, detail })
    } else if (type === 'card') {
      const red = /red/i.test(detail ?? '')
      out.push({ ...base, id: `card-${minute}-${side}-${player ?? i}`, kind: red ? 'red' : 'yellow', player, assist: null, detail })
    } else if (type === 'subst') {
      out.push({ ...base, id: `subst-${minute}-${side}-${player ?? i}`, kind: 'subst', player, assist, detail })
    } else if (type === 'var') {
      out.push({ ...base, id: `var-${minute}-${i}`, kind: 'var', player, assist: null, detail })
    }
  })
  return out
}

// Constrói um marco de fase (intervalo / prorrogação / pênaltis / fim).
function phaseEvent(kind: MatchEventKind, sortKey: number, goals: Goals): MatchEvent {
  return {
    id: `phase-${kind}`,
    kind,
    source: 'phase',
    minute: null,
    sortKey,
    side: null,
    teamName: null,
    player: null,
    assist: null,
    detail: null,
    score: { ...goals },
    deployed: false,
  }
}

function schedule(fixtureId: number, ms: number) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { void pollFixture(fixtureId) }, ms)
}

function isFinished(status: string): boolean {
  return FINISHED.has(status as FixtureStatus) || FINISHED_EXTRA.has(status)
}

// Aplica a resposta da API ao store: placar ao vivo + linha do tempo completa
// (todos os lances) + marcos de fase + flag matchEnded. Usado pelo poll E pelo
// backfill de abertura. NÃO agenda nem para o polling (quem chama decide).
function applyFixtureData(fx: Fixture): { status: FixtureStatus; elapsed: number | null; finished: boolean } {
  const store = useWarRoomStore.getState()
  const status = fx.fixture.status.short
  const elapsed = fx.fixture.status.elapsed
  const goals = { home: fx.goals.home ?? 0, away: fx.goals.away ?? 0 }

  store.setLiveData({ status, elapsed, goals })
  // Linha do tempo — sincroniza TODOS os lances da resposta (custo zero),
  // inclusive os que ocorreram antes da War Room abrir.
  store.syncMatchEvents(mapApiEvents(fx))

  // Marcos de fase (uma vez cada, via dedupe no store)
  if (status === 'HT') store.addPhaseEvent(phaseEvent('halftime', 45_00, goals))
  if (status === 'BT') store.addPhaseEvent(phaseEvent('break', 105_00, goals))
  if (status === 'ET') store.addPhaseEvent(phaseEvent('extratime', 91_00, goals))
  if (status === 'P') store.addPhaseEvent(phaseEvent('penalties', 121_00, goals))

  const finished = isFinished(status)
  if (finished) store.addPhaseEvent(phaseEvent('fulltime', 200_00, goals))

  // Mantém matchEnded coerente com o status real (recupera sessões persistidas
  // que ficaram com matchEnded=true de um jogo anterior).
  if (finished && !store.matchEnded) store.setMatchEnded(true)
  else if (!finished && store.matchEnded) store.setMatchEnded(false)

  return { status, elapsed, finished }
}

// Backfill de abertura: 1 request imediato para popular a linha do tempo assim
// que a War Room abre (mostra os lances anteriores em ordem). Não agenda polls —
// o ciclo de polling ao vivo continua separadamente.
export async function refreshFixtureOnce(fixtureId: number): Promise<void> {
  const store = useWarRoomStore.getState()
  if (store.requestsUsed >= QUOTA_RESERVE) return
  let data: { fixture: Fixture | null; requestsUsed?: number }
  try {
    const res = await fetch(`/api/football/fixture?id=${fixtureId}`, { cache: 'no-store' })
    data = await res.json()
  } catch {
    return
  }
  if (useWarRoomStore.getState().selectedFixtureId !== fixtureId) return
  if (typeof data.requestsUsed === 'number' && data.requestsUsed > 0) store.setRequestsUsed(data.requestsUsed)
  if (data.fixture) applyFixtureData(data.fixture)
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
    schedule(fixtureId, POLL_NORMAL)
    return
  }

  // Bail before writing if the user switched/dismissed the fixture during await.
  if (stopped || useWarRoomStore.getState().selectedFixtureId !== fixtureId) return

  if (typeof data.requestsUsed === 'number' && data.requestsUsed > 0) {
    store.setRequestsUsed(data.requestsUsed)
  }

  const fx = data.fixture
  if (!fx) { schedule(fixtureId, POLL_NORMAL); return }

  const { status, elapsed, finished } = applyFixtureData(fx)

  // Intervalo / intervalo da prorrogação — relaxa a cadência (5 min)
  if (status === 'HT' || status === 'BT') {
    schedule(fixtureId, POLL_HALFTIME_PAUSE)
    return
  }

  // Fim de jogo — encerra a sessão e para de vez
  if (finished) {
    stopPolling()
    return
  }

  // Em jogo — aperta a cadência na reta final e durante ET/P
  const lateStretch = (elapsed ?? 0) >= 80 || status === 'ET' || status === 'P'
  schedule(fixtureId, lateStretch ? POLL_FINAL : POLL_NORMAL)
}

export function startPolling(fixtureId: number): void {
  stopPolling()
  stopped = false
  useWarRoomStore.getState().setPolling(true)
  void pollFixture(fixtureId)
}

export function stopPolling(): void {
  stopped = true
  if (timer) { clearTimeout(timer); timer = null }
  const store = useWarRoomStore.getState()
  if (store.isPolling) store.setPolling(false)
}
