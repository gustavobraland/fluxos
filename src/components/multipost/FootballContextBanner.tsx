'use client'
import { X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useFootballStore } from '@/store/useFootballStore'

export function FootballContextBanner() {
  const { activeQueueItem, clearActiveQueueItem } = useAppStore()
  const matches = useFootballStore(s => s.matches)

  if (!activeQueueItem) return null

  // Try to find the source match for live score display
  const match = matches.find(m => m.id === activeQueueItem.matchId)
  const scoreStr = match
    ? `${match.homeTeam.emoji} ${match.score.home}–${match.score.away} ${match.awayTeam.emoji}`
    : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        background: 'rgba(240,123,84,.08)',
        border: '1px solid rgba(240,123,84,.22)',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>📡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#F07B54' }}>
          {activeQueueItem.triggeredBy}
        </span>
        {scoreStr && (
          <span style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 8 }}>
            · {scoreStr}
          </span>
        )}
        {match && (
          <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 6 }}>
            · {match.competition.emoji} {match.competition.shortName}
          </span>
        )}
      </div>
      <button
        onClick={clearActiveQueueItem}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(240,123,84,.15)',
          border: '1px solid rgba(240,123,84,.25)',
          color: '#F07B54', cursor: 'pointer', flexShrink: 0,
        }}
        title="Dispensar origem"
      >
        <X size={10} />
      </button>
    </div>
  )
}
