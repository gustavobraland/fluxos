'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { useFootballStore, selectWarRoomMatch } from '@/store/useFootballStore'
import { useAppStore } from '@/store/useAppStore'
import { useShallow } from 'zustand/shallow'
import { useTimelineStore } from '@/store/useTimelineStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import type { ContentQueueItem } from '@/lib/football'
import type { GoalEvent, MatchEntry } from '@/lib/timeline'

// ─── Goal workflow stages ─────────────────────────────────────────────────────

type GoalStage = 'waiting' | 'assigned' | 'in_progress' | 'published'

const STAGE_LABELS: Record<GoalStage, string> = {
  waiting:     'Aguardando',
  assigned:    'Designer atribuído',
  in_progress: 'Criando arte',
  published:   'Publicado',
}

const STAGE_COLORS: Record<GoalStage, string> = {
  waiting:     'var(--txt3)',
  assigned:    'var(--yellow)',
  in_progress: 'var(--blue)',
  published:   'var(--green)',
}

const NEXT_STAGE: Record<GoalStage, GoalStage | null> = {
  waiting:     'assigned',
  assigned:    'in_progress',
  in_progress: 'published',
  published:   null,
}

const NEXT_LABEL: Record<GoalStage, string> = {
  waiting:     'Atribuir',
  assigned:    'Iniciar arte',
  in_progress: 'Publicar',
  published:   '',
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function nowTs() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function PulsingDot({ color = 'var(--red)' }: { color?: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, animation: 'pulseDot 1.4s ease-in-out infinite', flexShrink: 0,
    }} />
  )
}

// ─── Resolve active match ─────────────────────────────────────────────────────
// Football store match (real API) takes priority, then timeline store selection.

function useActiveMatch(): (MatchEntry & { aiRecommendation?: string }) | null {
  const storeMatch = useFootballStore(selectWarRoomMatch)
  const timelineMatch = useTimelineStore(s => s.activeMatch)
  if (storeMatch) return storeMatch
  return timelineMatch
}

// ─── Match Banner ─────────────────────────────────────────────────────────────

function MatchBanner() {
  const match = useActiveMatch()
  const storeMatch = useFootballStore(selectWarRoomMatch)
  const { dismissFromWarRoom } = useFootballStore()
  const setActiveMatch = useTimelineStore(s => s.setActiveMatch)
  const router = useRouter()

  // Live score: latest goal for this match overrides base score
  const latestGoal = useTimelineStore(
    useShallow(s => match ? (s.goals.find(g => g.matchId === match.id) ?? null) : null)
  )
  const score = latestGoal?.score ?? match?.score

  if (!match) {
    return (
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, opacity: 0.3 }}>🏟</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--txt2)' }}>Nenhuma partida no War Room</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
            Vá para a aba Partidas e envie uma ao vivo
          </div>
        </div>
        <button
          onClick={() => router.push('/timeline')}
          style={{
            height: 30, padding: '0 14px', borderRadius: 6,
            background: 'rgba(91,184,232,0.12)', border: '1px solid rgba(91,184,232,0.3)',
            color: 'var(--blue)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}
        >
          ← Selecionar partida
        </button>
      </div>
    )
  }

  const isLive = match.status === 'live' || match.status === 'halftime'

  const handleDismiss = () => {
    if (storeMatch) dismissFromWarRoom(storeMatch.id)
    setActiveMatch(null)
  }

  return (
    <div style={{
      background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 16px', flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Competition */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 16 }}>{match.competition.emoji}</div>
        <div style={{
          fontSize: 8, fontWeight: 700, color: 'var(--txt3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1,
        }}>
          {match.competition.shortName}
        </div>
      </div>

      {/* Home */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{match.homeTeam.emoji}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginTop: 2 }}>{match.homeTeam.name}</div>
      </div>

      {/* Score / kickoff */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        {isLive && score ? (
          <>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 26, fontWeight: 800, color: 'var(--txt)', letterSpacing: 3, lineHeight: 1,
            }}>
              {score.home} — {score.away}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 4 }}>
              <PulsingDot />
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--red)' }}>
                AO VIVO
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'JetBrains Mono, monospace' }}>
            {match.kickoffLabel}
          </div>
        )}
      </div>

      {/* Away */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{match.awayTeam.emoji}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginTop: 2 }}>{match.awayTeam.name}</div>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        title="Remover do War Room"
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--s2)', border: '1px solid var(--border-subtle)',
          color: 'var(--txt3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  stage,
  onAdvance,
}: {
  goal: GoalEvent
  stage: GoalStage
  onAdvance: () => void
}) {
  const isHome = goal.team === 'home'
  const scorerTeam = isHome ? goal.homeTeam : goal.awayTeam
  const nextStage = NEXT_STAGE[stage]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--s1)', border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${STAGE_COLORS[stage]}`,
        borderRadius: 10, overflow: 'hidden',
      }}
    >
      {/* Goal info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚽</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>
            {goal.scorer}
            <span style={{
              marginLeft: 8, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, fontWeight: 500, color: 'var(--txt3)',
            }}>
              {goal.minute}&apos;
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 1 }}>
            {scorerTeam.emoji} {scorerTeam.name}
          </div>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20, fontWeight: 800,
          color: STAGE_COLORS[stage],
        }}>
          {goal.scoreStr}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.15)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: STAGE_COLORS[stage],
            animation: stage !== 'published' ? 'pulseDot 2s ease-in-out infinite' : undefined,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: STAGE_COLORS[stage] }}>
            {STAGE_LABELS[stage]}
          </span>
        </div>

        {nextStage && (
          <button
            onClick={onAdvance}
            style={{
              height: 24, padding: '0 10px', borderRadius: 5,
              background: `${STAGE_COLORS[nextStage]}18`,
              border: `1px solid ${STAGE_COLORS[nextStage]}40`,
              color: STAGE_COLORS[nextStage],
              cursor: 'pointer', fontSize: 10, fontWeight: 700,
            }}
          >
            {NEXT_LABEL[stage]} →
          </button>
        )}

        {stage === 'published' && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--green)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ✓ Publicado · {nowTs()}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Goal Feed ────────────────────────────────────────────────────────────────

function GoalFeed() {
  const match = useActiveMatch()
  const matchId = match?.id ?? null
  const goals = useTimelineStore(
    useShallow(s => matchId ? s.goals.filter(g => g.matchId === matchId) : [])
  )

  // Per-goal workflow stage (local session state)
  const [stages, setStages] = useState<Record<string, GoalStage>>({})

  const advance = (goalId: string) => {
    setStages(prev => {
      const current = prev[goalId] ?? 'waiting'
      const next = NEXT_STAGE[current]
      if (!next) return prev
      return { ...prev, [goalId]: next }
    })
  }

  if (!match) return null

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <PulsingDot color="var(--green)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
          Gols
        </span>
        {goals.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
            color: 'var(--green)', background: 'rgba(62,207,142,0.1)',
            border: '1px solid rgba(62,207,142,0.2)', borderRadius: 99, padding: '1px 8px',
          }}>
            {goals.length}
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {goals.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 28, opacity: 0.2 }}>⚽</span>
            <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
              Aguardando gols…
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                stage={stages[goal.id] ?? 'waiting'}
                onAdvance={() => advance(goal.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

// ─── Content Queue ────────────────────────────────────────────────────────────

type QStatus = ContentQueueItem['status']

function StatusBadge({ status }: { status: QStatus }) {
  const { t } = useTranslation()
  const map: Record<QStatus, { bg: string; color: string; label: string }> = {
    generating: { bg: 'rgba(91,184,232,0.15)', color: 'var(--blue)',   label: t('warroom.statusBadge.generating') },
    ready:      { bg: 'rgba(62,207,142,0.15)', color: 'var(--green)',  label: t('warroom.statusBadge.ready')      },
    reviewing:  { bg: 'rgba(245,200,66,0.15)', color: 'var(--yellow)', label: t('warroom.statusBadge.reviewing')  },
    published:  { bg: 'rgba(167,139,250,0.15)', color: '#A78BFA',     label: t('warroom.statusBadge.published')  },
  }
  const { bg, color, label } = map[status]
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
      {label}
    </span>
  )
}

function ContentQueue() {
  const { contentQueue } = useFootballStore()
  const { setActiveQueueItem } = useAppStore()
  const { t } = useTranslation()
  const router = useRouter()

  if (contentQueue.length === 0) return null

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('warroom.contentQueue')}</span>
        <span style={{
          background: 'rgba(91,184,232,0.15)', color: 'var(--blue)',
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
        }}>
          {contentQueue.length}
        </span>
      </div>
      <div>
        {contentQueue.slice(0, 5).map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'var(--txt)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginBottom: 1,
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{item.triggeredBy}</div>
            </div>
            <StatusBadge status={item.status} />
            {item.status === 'generating' && (
              <Loader2 size={12} style={{ color: 'var(--txt3)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            )}
            {item.status === 'ready' && (
              <button
                onClick={() => { setActiveQueueItem(item); router.push('/multipost') }}
                style={{
                  height: 26, padding: '0 8px', borderRadius: 5,
                  background: 'rgba(91,184,232,.15)', color: 'var(--blue)',
                  border: '1px solid rgba(91,184,232,.3)',
                  cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                }}
              >
                <ExternalLink size={9} /> Abrir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity log ─────────────────────────────────────────────────────────────

interface LogEntry { id: string; ts: string; text: string }

function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
      }}>
        <PulsingDot color="var(--blue)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Atividade</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {entries.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: 24,
          }}>
            <span style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', lineHeight: 1.6 }}>
              Monitorando partida.<br />Atividades aparecerão aqui.
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  padding: '7px 14px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: 'var(--txt3)', flexShrink: 0, marginTop: 1,
                }}>
                  {e.ts}
                </span>
                <span style={{ fontSize: 11, color: 'var(--txt)', lineHeight: 1.4 }}>{e.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarRoomPage() {
  const { init, contentQueue } = useFootballStore()
  const connect = useTimelineStore(s => s.connect)
  const match = useActiveMatch()
  const matchId = match?.id ?? null
  const goals = useTimelineStore(
    useShallow(s => matchId ? s.goals.filter(g => g.matchId === matchId) : [])
  )

  const [log, setLog] = useState<LogEntry[]>([])
  const prevGoalCount = useRef(goals.length)
  const prevQueueLen = useRef(contentQueue.length)

  useEffect(() => { init() }, [init])
  useEffect(() => { connect() }, [connect])

  // Append goal events to activity log
  useEffect(() => {
    if (goals.length > prevGoalCount.current) {
      const g = goals[0]
      if (g) {
        setLog(prev => [{
          id: `g-${g.id}`,
          ts: nowTs(),
          text: `⚽ Gol de ${g.scorer} (${g.minute}') · ${g.scoreStr}`,
        }, ...prev.slice(0, 29)])
      }
    }
    prevGoalCount.current = goals.length
  }, [goals])

  // Append content queue events to activity log
  useEffect(() => {
    if (contentQueue.length > prevQueueLen.current) {
      const item = contentQueue[0]
      if (item) {
        setLog(prev => [{
          id: `q-${item.id}`,
          ts: nowTs(),
          text: `📋 Conteúdo gerado: ${item.title}`,
        }, ...prev.slice(0, 29)])
      }
    }
    prevQueueLen.current = contentQueue.length
  }, [contentQueue])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', background: 'var(--bg)',
    }}>
      {/* Match Banner */}
      <MatchBanner />

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left — Goal feed */}
        <div style={{
          flex: '0 0 58%', display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 8px 10px 12px', overflowY: 'auto',
        }}>
          <GoalFeed />
          <ContentQueue />
        </div>

        {/* Right — Activity log */}
        <div style={{
          flex: '0 0 42%', display: 'flex', flexDirection: 'column',
          padding: '10px 12px 10px 4px', overflow: 'hidden',
        }}>
          <ActivityLog entries={log} />
        </div>
      </div>
    </div>
  )
}
