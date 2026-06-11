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
import { useWorkspaceStore, brandVoiceToString } from '@/store/useWorkspaceStore'
import { ALL_TEAMS } from '@/lib/teams30'
import { generateCopy, buildTemplate, type CopyEvent, type CopyFacts } from '@/lib/copy-engine'
import type { Fixture } from '@/types/fixtures'
import type { ArtEventBody } from '@/app/api/art/generate/route'
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

/**
 * Gera arte com DALL-E 3 em paralelo e atualiza o item da fila com a URL.
 * Não bloqueia — a arte aparece na fila quando pronta (15-30s).
 */
function generateArt(id: string, artBody: ArtEventBody) {
  void fetch('/api/art/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artBody),
  })
    .then(async (res) => {
      if (!res.ok) return
      const data = (await res.json()) as { artUrl?: string | null }
      if (data.artUrl) {
        useWarRoomStore.getState().updateQueueItem(id, { artUrl: data.artUrl })
      }
    })
    .catch((e) => console.warn('[art] generateArt:', e))
}

function brandVoice(): string {
  return brandVoiceToString(useWorkspaceStore.getState().brandVoice)
}

function facts(fx: Fixture, goals: Goals, extra: Partial<CopyFacts> = {}): CopyFacts {
  return {
    homeTeam: fx.teams.home.name,
    awayTeam: fx.teams.away.name,
    scoreHome: goals.home,
    scoreAway: goals.away,
    minute: fx.fixture.status.elapsed ?? null,
    league: fx.league?.name ?? null,
    ...extra,
  }
}

/** Gera a copy via IA (copy-engine) e atualiza o item da fila quando pronta. */
function enrichWithAI(id: string, event: CopyEvent, onReady?: (text: string) => void) {
  void generateCopy(event, { brandVoice: brandVoice() }).then(({ text }) => {
    const { queue, updateQueueItem } = useWarRoomStore.getState()
    if (!queue.find((q) => q.id === id)) return
    updateQueueItem(id, { caption: text, status: 'ready' })
    onReady?.(text)
  })
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

// Pull the latest goal scorer for a side from the fixture's events (when the
// API returns them on /fixtures?id=). Returns null when unavailable.
function extractScorer(fx: Fixture, side: 'home' | 'away'): string | null {
  const events = (fx as unknown as { events?: { type?: string; team?: { id?: number }; player?: { name?: string } }[] }).events
  if (!Array.isArray(events)) return null
  const teamId = fx.teams[side].id
  const goalEvents = events.filter(e => e.type === 'Goal' && e.team?.id === teamId)
  return goalEvents[goalEvents.length - 1]?.player?.name ?? null
}

export function triggerGoalContent(side: 'home' | 'away', fx: Fixture, goals: Goals, scorer?: string | null, minuteOverride?: number | null) {
  const scorerTeam = side === 'home' ? fx.teams.home.name : fx.teams.away.name
  const minute = minuteOverride ?? fx.fixture.status.elapsed
  const who = scorer ?? extractScorer(fx, side)
  const caption =
    `⚽ GOL DO ${scorerTeam.toUpperCase()}!` +
    (who ? ` ${who}` : '') +
    `\n${scoreLine(fx, goals)}` +
    (minute ? ` · ${minute}'` : '')

  // Log the goal (scorer/minute/score) for the War Room footer
  useWarRoomStore.getState().addGoal({
    id: `g-${Date.now()}-${side}`,
    side,
    team: scorerTeam,
    scorer: who ?? null,
    minute: minute ?? null,
    score: { home: goals.home, away: goals.away },
  })

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
  // Gera arte em paralelo (DALL-E 3) — aparece quando pronta
  generateArt(id, {
    type: 'goal',
    homeTeam: fx.teams.home.name,
    awayTeam: fx.teams.away.name,
    scoreHome: goals.home,
    scoreAway: goals.away,
    scorer: who,
    minute: minute ?? fx.fixture.status.elapsed,
    league: fx.league?.name ?? null,
  })
}

// ─── Halftime ─────────────────────────────────────────────────────────────────

export function triggerHalftimeContent(fx: Fixture, goals: Goals) {
  const event: CopyEvent = { type: 'halftime', facts: facts(fx, goals) }
  const id = nextId('ht')
  useWarRoomStore.getState().addQueueItem({
    id,
    trigger: 'halftime',
    status: 'generating',
    caption: buildTemplate(event), // base instantânea; a IA substitui ao ficar pronta
    platforms: ['instagram', 'twitter'],
    createdAt: Date.now(),
  })
  enrichWithAI(id, event) // Gemini Flash
  // Gera arte em paralelo
  generateArt(id, {
    type: 'halftime',
    homeTeam: fx.teams.home.name,
    awayTeam: fx.teams.away.name,
    scoreHome: goals.home,
    scoreAway: goals.away,
    league: fx.league?.name ?? null,
  })
}

// ─── Fulltime ─────────────────────────────────────────────────────────────────

export function triggerMatchEndContent(fx: Fixture, goals: Goals) {
  const store = useWarRoomStore.getState()
  const result = resultFor(fx, goals)
  const event: CopyEvent = { type: 'fulltime', facts: facts(fx, goals, { result }) }
  const base = buildTemplate(event)
  const platforms = ['instagram', 'twitter', 'facebook']

  const id = nextId('ft')
  store.addQueueItem({
    id,
    trigger: 'fulltime',
    status: 'generating',
    caption: base, // base instantânea; a IA (Gemini→Sonnet) substitui ao ficar pronta
    platforms,
    createdAt: Date.now(),
    result,
  })

  // Reflect the final result on the Calendar match event
  useCalendarStore.getState().updateEvent(`match-${fx.fixture.id}`, {
    result,
    subtitle: `${fx.league.name} · FT ${goals.home}×${goals.away}`,
  })

  // Deploy the matching pre-pack and hand the draft to Multipost (texto base já;
  // troca pela copy da IA quando pronta).
  store.activatePrePack(result)
  const setDraft = (caption: string) =>
    useMultipostStore.getState().setDraft({ caption, platforms, scheduledAt: null, source: 'warroom' })
  setDraft(base)
  enrichWithAI(id, event, setDraft) // Gemini Flash → Claude Sonnet
  // Gera arte em paralelo
  generateArt(id, {
    type: 'fulltime',
    homeTeam: fx.teams.home.name,
    awayTeam: fx.teams.away.name,
    scoreHome: goals.home,
    scoreAway: goals.away,
    league: fx.league?.name ?? null,
    result,
  })

  const label = result === 'win' ? 'Vitória' : result === 'loss' ? 'Derrota' : 'Empate'
  toast.success(`Pacote de fim de jogo (${label}) enviado para o Multipost`)
}

// ─── Fases especiais: prorrogação / pênaltis / intervalo da prorrogação ───────
// Template puro (instantâneo, sem custo de API). Dispara uma vez por fase.

export function triggerPhaseContent(
  fx: Fixture,
  goals: Goals,
  phase: 'extratime' | 'penalties' | 'break',
) {
  const score = scoreLine(fx, goals)
  const caption =
    phase === 'extratime'
      ? `⏱️ PRORROGAÇÃO!\nVamos pra mais 30 minutos!\n${score}`
      : phase === 'penalties'
        ? `🥅 PÊNALTIS!\nDecisão nas penalidades!\n${score}`
        : `⏸️ INTERVALO DA PRORROGAÇÃO\n${score}`
  const id = nextId(phase)
  useWarRoomStore.getState().addQueueItem({
    id,
    trigger: 'breaking',
    status: 'generating',
    caption,
    platforms: ['instagram', 'twitter'],
    createdAt: Date.now(),
  })
  settleReady(id)
}

// ─── Demais gatilhos (template: card/sub/VAR · IA: breaking/preview/classification)

/** Cartão (template puro). side = time do jogador. */
export function triggerCardContent(
  fx: Fixture, goals: Goals,
  opts: { side?: 'home' | 'away'; player?: string | null; cardType?: 'yellow' | 'red'; minute?: number | null } = {},
) {
  const teamName = opts.side ? fx.teams[opts.side].name : null
  const event: CopyEvent = { type: 'card', facts: facts(fx, goals, { teamName, player: opts.player ?? null, cardType: opts.cardType ?? 'yellow', minute: opts.minute ?? fx.fixture.status.elapsed }) }
  const id = nextId('card')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'card', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  settleReady(id)
}

/** Substituição (template puro). */
export function triggerSubContent(
  fx: Fixture, goals: Goals,
  opts: { side?: 'home' | 'away'; playerOut?: string | null; playerIn?: string | null; minute?: number | null } = {},
) {
  const teamName = opts.side ? fx.teams[opts.side].name : null
  const event: CopyEvent = { type: 'substitution', facts: facts(fx, goals, { teamName, playerOut: opts.playerOut ?? null, playerIn: opts.playerIn ?? null, minute: opts.minute ?? fx.fixture.status.elapsed }) }
  const id = nextId('sub')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'substitution', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  settleReady(id)
}

/** VAR (template puro). */
export function triggerVarContent(fx: Fixture, goals: Goals, note?: string | null) {
  const event: CopyEvent = { type: 'var', facts: facts(fx, goals, { note: note ?? null }) }
  const id = nextId('var')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'var', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  settleReady(id)
}

/** Notícia urgente (IA: Claude Sonnet direto). */
export function triggerBreakingContent(fx: Fixture, goals: Goals, note: string) {
  const event: CopyEvent = { type: 'breaking', facts: facts(fx, goals, { note }) }
  const id = nextId('brk')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'breaking', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  enrichWithAI(id, event)
}

/** Pré-jogo (IA: Gemini→Sonnet). */
export function triggerPreviewContent(fx: Fixture, note?: string | null) {
  const goals = { home: fx.goals.home ?? 0, away: fx.goals.away ?? 0 }
  const event: CopyEvent = { type: 'preview', facts: facts(fx, goals, { note: note ?? null }) }
  const id = nextId('prev')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'preview', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  enrichWithAI(id, event)
}

/** Classificação / contexto de tabela (IA: Gemini→Sonnet). */
export function triggerClassificationContent(fx: Fixture, note: string) {
  const goals = { home: fx.goals.home ?? 0, away: fx.goals.away ?? 0 }
  const event: CopyEvent = { type: 'classification', facts: facts(fx, goals, { note }) }
  const id = nextId('class')
  useWarRoomStore.getState().addQueueItem({ id, trigger: 'classification', status: 'generating', caption: buildTemplate(event), platforms: ['instagram', 'twitter'], createdAt: Date.now() })
  enrichWithAI(id, event)
}
