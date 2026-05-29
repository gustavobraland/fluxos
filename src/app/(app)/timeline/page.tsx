'use client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/shallow'
import { useTimelineStore } from '@/store/useTimelineStore'
import { useFootballStore } from '@/store/useFootballStore'
import { useRouter } from 'next/navigation'
import { buildMatchList } from '@/lib/timeline'
import type { MatchEntry } from '@/lib/timeline'

// ─── Static mock list (built once) ───────────────────────────────────────────

const MOCK_LIST = buildMatchList()

// ─── Live score from goals ────────────────────────────────────────────────────

function useLiveScore(matchId: string, base: { home: number; away: number }) {
  const latest = useTimelineStore(
    useShallow(s => s.goals.find(g => g.matchId === matchId) ?? null)
  )
  return latest?.score ?? base
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  isActive,
  onSend,
}: {
  match: MatchEntry
  isActive: boolean
  onSend: (match: MatchEntry) => void
}) {
  const isLive = match.status === 'live' || match.status === 'halftime'
  const score = useLiveScore(match.id, match.score)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        background: isActive ? 'var(--s2)' : 'var(--s1)',
        border: `1px solid ${isActive ? 'rgba(91,184,232,0.35)' : 'var(--border-subtle)'}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Competition row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>{match.competition.emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {match.competition.shortName}
          </span>
        </div>

        {isLive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--red)', flexShrink: 0,
              animation: 'pulseDot 1.2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9, fontWeight: 700, color: 'var(--red)',
            }}>
              AO VIVO
            </span>
          </div>
        ) : (
          <span style={{
            fontSize: 10, color: 'var(--txt3)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {match.kickoffLabel}
          </span>
        )}
      </div>

      {/* Teams row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 14px',
        gap: 8,
      }}>
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{match.homeTeam.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score / vs */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {isLive ? (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 20, fontWeight: 800, color: 'var(--txt)',
              letterSpacing: 2,
            }}>
              {score.home} — {score.away}
            </div>
          ) : (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, color: 'var(--txt3)', fontWeight: 500,
            }}>
              ×
            </span>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
            {match.awayTeam.name}
          </span>
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{match.awayTeam.emoji}</span>
        </div>
      </div>

      {/* Actions row */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        padding: '0 14px 10px',
      }}>
        <button
          onClick={() => onSend(match)}
          disabled={isActive}
          style={{
            height: 28, padding: '0 14px', borderRadius: 6,
            background: isActive ? 'var(--s3)' : 'rgba(91,184,232,0.12)',
            border: `1px solid ${isActive ? 'var(--border-subtle)' : 'rgba(91,184,232,0.3)'}`,
            color: isActive ? 'var(--txt3)' : 'var(--blue)',
            cursor: isActive ? 'default' : 'pointer',
            fontSize: 11, fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          {isActive ? '✓ No War Room' : '→ Enviar ao War Room'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const connect = useTimelineStore(s => s.connect)
  const activeMatch = useTimelineStore(s => s.activeMatch)
  const setActiveMatch = useTimelineStore(s => s.setActiveMatch)
  const router = useRouter()

  const [tab, setTab] = useState<'all' | 'live'>('all')

  useEffect(() => { connect() }, [connect])

  // Use football store matches when available (real API), else mock list
  const { storeMatches, apiConnected } = useFootballStore(
    useShallow(s => ({
      apiConnected: s.apiConnected,
      storeMatches: s.matches.map<MatchEntry>(m => ({
        id: m.id,
        homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName, emoji: m.homeTeam.emoji },
        awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName, emoji: m.awayTeam.emoji },
        competition: { id: m.competition.id, name: m.competition.name, shortName: m.competition.shortName, emoji: m.competition.emoji },
        status: m.status,
        minute: m.minute,
        score: m.score,
        kickoffLabel: m.kickoffLabel,
      })),
    }))
  )

  // In production (apiConnected=true), never show mock matches.
  // In dev without API key, fall back to mock for demo purposes.
  const allMatches = storeMatches.length > 0 ? storeMatches : (apiConnected ? [] : MOCK_LIST)

  const matches = useMemo(() => {
    if (tab === 'live') return allMatches.filter(m => m.status === 'live' || m.status === 'halftime')
    return allMatches
  }, [allMatches, tab])

  const handleSend = (match: MatchEntry) => {
    setActiveMatch(match)
    router.push('/warroom')
  }

  const liveCount = allMatches.filter(m => m.status === 'live' || m.status === 'halftime').length

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
          Partidas
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>
          Envie uma partida ao War Room para monitorar ao vivo
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        background: 'var(--s1)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        {([
          { id: 'all',  label: 'Todas' },
          { id: 'live', label: `Ao Vivo${liveCount > 0 ? ` · ${liveCount}` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              height: 36, padding: '0 14px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--txt)' : 'var(--txt3)',
              borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <AnimatePresence initial={false}>
          {matches.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 200, gap: 8,
            }}>
              <span style={{ fontSize: 28, opacity: 0.25 }}>🏟</span>
              <span style={{ fontSize: 12, color: 'var(--txt3)' }}>
                Nenhuma partida ao vivo agora
              </span>
            </div>
          ) : (
            matches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                isActive={activeMatch?.id === m.id}
                onSend={handleSend}
              />
            ))
          )}
        </AnimatePresence>

        <div style={{ height: 12 }} />
      </div>
    </div>
  )
}
