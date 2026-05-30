// ─── War Room content triggers ────────────────────────────────────────────────
// Three editorial triggers fired by the polling service: goal, halftime, fulltime.
// Each builds a caption from REAL fixture data (never invented), enqueues a
// QueueItem, and simulates the generating→ready transition. Fulltime additionally
// activates the matching pre-pack and hands a draft to Multipost.
//
// REGRA DE OURO: only goal / HT / FT produce content. Cards, subs and VAR are
// intentionally ignored to conserve the API quota and the editorial queue.

import { useWarRoomStore, type PrePackScenario } from '@/store/useWarRoomStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { ALL_TEAMS } from '@/lib/teams30'
import type { Fixture } from '@/types/fixtures'
import { toast } from 'sonner'

const WATCHED = new Set<number>(ALL_TEAMS.map((t) => t.id))

type Goals = { home: number; away: number }

let seq = 0
function nextId(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now()}-${seq}`
}

/** Mark a queue item ready a moment after it is enqueued (asset render sim). */
function settleReady(id: string) {
  const delay = 2500 + Math.random() * 2000
  setTimeout(() => {
    const { queue, updateQueueItem } = useWarRoomStore.getState()
    const item = queue.find((q) => q.id === id)
    if (item && item.status === 'generating') updateQueueItem(id, { status: 'ready' })
  }, delay)
}

/** Result from the perspective of whichever side is a priority team. */
function resultFor(fx: Fixture, goals: Goals): PrePackScenario {
  const homeWatched = WATCHED.has(fx.teams.home.id)
  const awayWatched = WATCHED.has(fx.teams.away.id)
  const perspectiveHome = homeWatched || !awayWatched
  const our = perspectiveHome ? goals.home : goals.away
  const their = perspectiveHome ? goals.away : goals.home
  if (our > their) return 'win'
  if (our < their) return 'loss'
  return 'draw'
}

function scoreLine(fx: Fixture, goals: Goals): string {
  return `${fx.teams.home.name} ${goals.home} x ${goals.away} ${fx.teams.away.name}`
}

// ─── Goal ───────────────────────────────────────────────────────────────────

export function triggerGoalContent(side: 'home' | 'away', fx: Fixture, goals: Goals) {
  const scorerTeam = side === 'home' ? fx.teams.home.name : fx.teams.away.name
  const minute = fx.fixture.status.elapsed
  const caption =
    `⚽ GOL DO ${scorerTeam.toUpperCase()}!\n${scoreLine(fx, goals)}` +
    (minute ? ` · ${minute}'` : '')

  const id = nextId('goal')
  useWarRoomStore.getState().addQueueItem({
    id,
    trigger: 'goal',
    status: 'generating',
    caption,
    platforms: ['instagram', 'twitter'],
    createdAt: Date.now(),
  })
  settleReady(id)
}

// ─── Halftime ─────────────────────────────────────────────────────────────────

export function triggerHalftimeContent(fx: Fixture, goals: Goals) {
  const caption = `⏸️ INTERVALO\n${scoreLine(fx, goals)}`
  const id = nextId('ht')
  useWarRoomStore.getState().addQueueItem({
    id,
    trigger: 'halftime',
    status: 'generating',
    caption,
    platforms: ['instagram', 'twitter'],
    createdAt: Date.now(),
  })
  settleReady(id)
}

// ─── Fulltime ─────────────────────────────────────────────────────────────────

export function triggerMatchEndContent(fx: Fixture, goals: Goals) {
  const store = useWarRoomStore.getState()
  const result = resultFor(fx, goals)
  const caption = `🏁 FIM DE JOGO\n${scoreLine(fx, goals)}`

  const id = nextId('ft')
  store.addQueueItem({
    id,
    trigger: 'fulltime',
    status: 'ready',
    caption,
    platforms: ['instagram', 'twitter', 'facebook'],
    createdAt: Date.now(),
    result,
  })

  // Reflect the final result on the Calendar match event
  useCalendarStore.getState().updateEvent(`match-${fx.fixture.id}`, {
    result,
    subtitle: `${fx.league.name} · FT ${goals.home}×${goals.away}`,
  })

  // Deploy the matching pre-pack and hand the draft to Multipost
  store.activatePrePack(result)
  useMultipostStore.getState().setDraft({
    caption,
    platforms: ['instagram', 'twitter', 'facebook'],
    scheduledAt: null,
    source: 'warroom',
  })

  const label = result === 'win' ? 'Vitória' : result === 'loss' ? 'Derrota' : 'Empate'
  toast.success(`Pacote de fim de jogo (${label}) enviado para o Multipost`)
}
