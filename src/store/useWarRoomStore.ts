import { create } from 'zustand'
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

export type QueueTrigger = 'goal' | 'halftime' | 'fulltime' | 'manual'
export type QueueStatus = 'generating' | 'ready' | 'review' | 'published' | 'deploy'

export interface QueueItem {
  id: string
  trigger: QueueTrigger
  status: QueueStatus
  caption: string
  platforms: string[]
  createdAt: number
  result?: PrePackScenario
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

// ─── Per-fixture live session ─────────────────────────────────────────────────

interface Session {
  lineup: Lineup | null
  liveData: LiveData | null
  queue: QueueItem[]
  prePacks: PrePack[]
  matchEnded: boolean
}

function freshSession(): Session {
  return { lineup: null, liveData: null, queue: [], prePacks: defaultPrePacks(), matchEnded: false }
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
  }
}

export const useWarRoomStore = create<WarRoomState>((set, get) => {
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
    updateQueueItem: (id, patch) => patchSelected(s => ({
      ...s, queue: s.queue.map(q => (q.id === id ? { ...q, ...patch } : q)),
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
})
