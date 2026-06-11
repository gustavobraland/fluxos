import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Fixture, FixtureStatus } from '@/types/fixtures'
import { useCalendarStore, type CalendarEvent } from '@/store/useCalendarStore'

// ─── Setup (chosen in the timeline launch modal) ──────────────────────────────

export interface WarRoomSetup {
  liveWarRoom: boolean
  prePacks: boolean
  preMatchHype: boolean
  iGaming: boolean
  realtimeAnalytics: boolean
}

export const DEFAULT_SETUP: WarRoomSetup = {
  liveWarRoom: true,
  prePacks: false,
  preMatchHype: true,
  iGaming: false,
  realtimeAnalytics: true,
}

// ─── Lineup (from /fixtures/lineups) ──────────────────────────────────────────

export interface LineupPlayer {
  number: number | null
  name: string
  pos: string | null   // 'G' | 'D' | 'M' | 'F' | null
}

export interface TeamLineup {
  teamName: string
  formation: string | null
  players: LineupPlayer[]
}

export interface Lineup {
  available: boolean
  home: TeamLineup | null
  away: TeamLineup | null
}

// ─── Live snapshot (from adaptive polling) ────────────────────────────────────

export interface LiveData {
  status: FixtureStatus
  elapsed: number | null
  goals: { home: number; away: number }
}

// ─── Content queue ────────────────────────────────────────────────────────────

export type QueueTrigger =
  | 'goal' | 'card' | 'substitution' | 'var'
  | 'halftime' | 'fulltime' | 'preview' | 'classification' | 'breaking'
  | 'manual'
export type QueueStatus = 'generating' | 'ready' | 'review' | 'published' | 'deploy'

export interface QueueItem {
  id: string
  trigger: QueueTrigger
  status: QueueStatus
  caption: string
  platforms: string[]
  createdAt: number
  result?: PrePackScenario
  /** URL pública da arte gerada pelo DALL-E 3 (undefined enquanto gerando) */
  artUrl?: string
}

// ─── Match event timeline (linha do tempo do jogo) ───────────────────────────
// Cada lance da partida vira um item da timeline, alimentado DIRETO da resposta
// da API (events) + transições de status (intervalo, prorrogação, pênaltis, fim).
// Custo zero de API. O usuário escolhe qual lance vira post via "Deploy".

export type MatchEventKind =
  | 'goal' | 'yellow' | 'red' | 'subst' | 'var'
  | 'halftime' | 'fulltime' | 'extratime' | 'penalties' | 'break'

export interface MatchEvent {
  id: string                       // estável (dedupe entre polls): kind-minute-side-player
  kind: MatchEventKind
  source: 'api' | 'phase'          // 'api' = events[] da API · 'phase' = transição de status
  minute: number | null
  sortKey: number                  // ordenação cronológica
  side: 'home' | 'away' | null
  teamName: string | null
  player: string | null            // autor do gol / cartão / quem entrou
  assist: string | null            // assistência / quem saiu
  detail: string | null
  score: { home: number; away: number }
  deployed: boolean                // já gerou conteúdo para a fila
}

// ─── Pre-packs ──────────────────────────────────────────────────────────────

export type PrePackScenario = 'win' | 'draw' | 'loss'

export interface PrePack {
  scenario: PrePackScenario
  label: string
  assetCount: number
  platformCount: number
  status: 'ready' | 'deployed'
}

function defaultPrePacks(): PrePack[] {
  return [
    { scenario: 'win',  label: 'Vitória', assetCount: 4, platformCount: 3, status: 'ready' },
    { scenario: 'draw', label: 'Empate',  assetCount: 3, platformCount: 3, status: 'ready' },
    { scenario: 'loss', label: 'Derrota', assetCount: 3, platformCount: 3, status: 'ready' },
  ]
}

// ─── Goal log (scorer / minute / score) ──────────────────────────────────────

export interface GoalLog {
  id: string
  side: 'home' | 'away'
  team: string
  scorer: string | null
  minute: number | null
  score: { home: number; away: number }
}

// ─── Per-fixture live session ─────────────────────────────────────────────────

interface Session {
  lineup: Lineup | null
  liveData: LiveData | null
  queue: QueueItem[]
  prePacks: PrePack[]
  matchEnded: boolean
  goals: GoalLog[]
  events: MatchEvent[]
}

function freshSession(): Session {
  return { lineup: null, liveData: null, queue: [], prePacks: defaultPrePacks(), matchEnded: false, goals: [], events: [] }
}

// ─── Calendar sync helper ─────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo'

function fixtureToEvent(fixture: Fixture): CalendarEvent {
  const ms = fixture.fixture.timestamp * 1000
  return {
    id: `match-${fixture.fixture.id}`,
    type: 'match',
    title: `${fixture.teams.home.name} × ${fixture.teams.away.name}`,
    subtitle: fixture.league.name,
    date: new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ }), // YYYY-MM-DD (BRT)
    time: new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
    timestamp: fixture.fixture.timestamp,
    source: 'warroom',
    fixtureId: fixture.fixture.id,
    result: null,
    leagueLogo: fixture.league.logo,
    homeLogo: fixture.teams.home.logo,
    awayLogo: fixture.teams.away.logo,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface WarRoomState {
  // Multi-fixture
  activeFixtures: Fixture[]
  selectedFixtureId: number | null
  sessions: Record<number, Session>

  // Global
  setup: WarRoomSetup
  isPolling: boolean
  requestsUsed: number

  // Mirror of the SELECTED fixture's session (keeps component selectors reactive)
  activeFixture: Fixture | null
  lineup: Lineup | null
  liveData: LiveData | null
  queue: QueueItem[]
  prePacks: PrePack[]
  matchEnded: boolean
  goals: GoalLog[]
  events: MatchEvent[]

  // Fixture management
  addFixture: (f: Fixture) => void
  removeFixture: (id: number) => void
  selectFixture: (id: number) => void
  setActiveFixture: (f: Fixture | null, setup?: WarRoomSetup) => void // legacy/timeline entry
  clearActiveFixture: () => void

  // Selected-session mutations
  setLineup: (l: Lineup) => void
  setLiveData: (d: LiveData) => void
  addQueueItem: (item: QueueItem) => void
  updateQueueItem: (id: string, patch: Partial<QueueItem>) => void
  addGoal: (g: GoalLog) => void
  syncMatchEvents: (events: MatchEvent[]) => void   // substitui os eventos da API (preserva deployed/phase)
  addPhaseEvent: (ev: MatchEvent) => void           // adiciona marco de fase (dedupe por id)
  markEventDeployed: (id: string) => void
  activatePrePack: (scenario: PrePackScenario) => void
  setMatchEnded: (v: boolean) => void
  reset: () => void

  // Global mutations
  setPolling: (v: boolean) => void
  setRequestsUsed: (n: number) => void
}

// Recompute the mirror fields from a (next) state slice.
function mirror(activeFixtures: Fixture[], selectedFixtureId: number | null, sessions: Record<number, Session>) {
  const fx = selectedFixtureId != null ? (activeFixtures.find(f => f.fixture.id === selectedFixtureId) ?? null) : null
  const sess = selectedFixtureId != null ? sessions[selectedFixtureId] : undefined
  return {
    activeFixture: fx,
    lineup: sess?.lineup ?? null,
    liveData: sess?.liveData ?? null,
    queue: sess?.queue ?? [],
    prePacks: sess?.prePacks ?? defaultPrePacks(),
    matchEnded: sess?.matchEnded ?? false,
    goals: sess?.goals ?? [],
    events: sess?.events ?? [],
  }
}

export const useWarRoomStore = create<WarRoomState>()(
  persist(
  (set, get) => {
  // Mutate the selected fixture's session, then refresh the mirror.
  const patchSelected = (fn: (s: Session) => Session) => {
    const { selectedFixtureId, sessions, activeFixtures } = get()
    if (selectedFixtureId == null) return
    const current = sessions[selectedFixtureId] ?? freshSession()
    const nextSessions = { ...sessions, [selectedFixtureId]: fn(current) }
    set({ sessions: nextSessions, ...mirror(activeFixtures, selectedFixtureId, nextSessions) })
  }

  return {
    activeFixtures: [],
    selectedFixtureId: null,
    sessions: {},
    setup: DEFAULT_SETUP,
    isPolling: false,
    requestsUsed: 0,
    activeFixture: null,
    lineup: null,
    liveData: null,
    queue: [],
    prePacks: defaultPrePacks(),
    matchEnded: false,
    goals: [],
    events: [],

    addFixture: (f) => {
      const id = f.fixture.id
      const { activeFixtures, sessions } = get()
      const exists = activeFixtures.some(x => x.fixture.id === id)
      const nextFixtures = exists ? activeFixtures : [...activeFixtures, f]
      const nextSessions = sessions[id] ? sessions : { ...sessions, [id]: freshSession() }
      set({
        activeFixtures: nextFixtures,
        sessions: nextSessions,
        selectedFixtureId: id,
        isPolling: false,
        ...mirror(nextFixtures, id, nextSessions),
      })
      // Auto-sync to the Calendar
      useCalendarStore.getState().addEvent(fixtureToEvent(f))
    },

    removeFixture: (id) => {
      const { activeFixtures, sessions, selectedFixtureId } = get()
      const nextFixtures = activeFixtures.filter(f => f.fixture.id !== id)
      const nextSessions = { ...sessions }
      delete nextSessions[id]
      const nextSelected = selectedFixtureId === id
        ? (nextFixtures[0]?.fixture.id ?? null)
        : selectedFixtureId
      set({
        activeFixtures: nextFixtures,
        sessions: nextSessions,
        selectedFixtureId: nextSelected,
        isPolling: false,
        ...mirror(nextFixtures, nextSelected, nextSessions),
      })
    },

    selectFixture: (id) => {
      const { activeFixtures, sessions } = get()
      set({ selectedFixtureId: id, isPolling: false, ...mirror(activeFixtures, id, sessions) })
    },

    // Timeline launch: open (add) this fixture and focus it.
    setActiveFixture: (f, setup) => {
      if (!f) { get().clearActiveFixture(); return }
      if (setup) set({ setup })
      get().addFixture(f)
    },

    // Dismiss the currently selected fixture from the War Room (keeps the Calendar event).
    clearActiveFixture: () => {
      const { selectedFixtureId } = get()
      if (selectedFixtureId != null) { get().removeFixture(selectedFixtureId); return }
      set({ activeFixtures: [], sessions: {}, selectedFixtureId: null, isPolling: false, ...mirror([], null, {}) })
    },

    setLineup: (lineup) => patchSelected(s => ({ ...s, lineup })),
    setLiveData: (liveData) => patchSelected(s => ({ ...s, liveData })),
    addQueueItem: (item) => patchSelected(s => ({ ...s, queue: [item, ...s.queue].slice(0, 40) })),
    addGoal: (g) => patchSelected(s => ({ ...s, goals: [...s.goals, g] })),
    updateQueueItem: (id, patch) => patchSelected(s => ({
      ...s, queue: s.queue.map(q => (q.id === id ? { ...q, ...patch } : q)),
    })),

    // Substitui os eventos vindos da API a cada poll, preservando: (a) os marcos
    // de fase (source==='phase') e (b) o flag `deployed` de eventos já existentes.
    syncMatchEvents: (incoming) => patchSelected(s => {
      const prevById = new Map(s.events.map(e => [e.id, e]))
      const phase = s.events.filter(e => e.source === 'phase')
      const api = incoming.map(e => ({ ...e, deployed: prevById.get(e.id)?.deployed ?? false }))
      const events = [...phase, ...api].sort((a, b) => b.sortKey - a.sortKey)
      return { ...s, events }
    }),

    // Adiciona um marco de fase (intervalo, prorrogação, pênaltis, fim) uma única vez.
    addPhaseEvent: (ev) => patchSelected(s => {
      if (s.events.some(e => e.id === ev.id)) return s
      const events = [...s.events, ev].sort((a, b) => b.sortKey - a.sortKey)
      return { ...s, events }
    }),

    markEventDeployed: (id) => patchSelected(s => ({
      ...s, events: s.events.map(e => (e.id === id ? { ...e, deployed: true } : e)),
    })),
    activatePrePack: (scenario) => patchSelected(s => ({
      ...s, prePacks: s.prePacks.map(p => (p.scenario === scenario ? { ...p, status: 'deployed' } : p)),
    })),
    setMatchEnded: (matchEnded) => patchSelected(s => ({ ...s, matchEnded })),

    // Reset only the selected fixture's session (used by the dev mock to re-run).
    reset: () => patchSelected(() => freshSession()),

    setPolling: (isPolling) => set({ isPolling }),
    setRequestsUsed: (requestsUsed) => set({ requestsUsed }),
  }
  },
  {
    name: 'flux-warroom',
    storage: createJSONStorage(() => localStorage),
    // Persist the fixtures AND their full sessions (queue, goals, prePacks,
    // matchEnded, liveData) so generated content NEVER disappears on refresh.
    // Persisting liveData also keeps the goal-diff baseline alive across a
    // refresh — a goal scored while the page was reloading is still detected
    // on the next poll (and already-counted goals are not re-announced).
    partialize: (state) => ({
      activeFixtures: state.activeFixtures,
      selectedFixtureId: state.selectedFixtureId,
      sessions: state.sessions,
      setup: state.setup,
    }),
    onRehydrateStorage: () => (state) => {
      if (!state) return
      // Recompute mirror fields from the rehydrated sessions so components see
      // the correct selected fixture's queue/goals/liveData immediately.
      const m = mirror(
        state.activeFixtures ?? [],
        state.selectedFixtureId ?? null,
        state.sessions ?? {},
      )
      Object.assign(state, m)
    },
  }
  )
)
