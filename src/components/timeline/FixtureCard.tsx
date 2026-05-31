'use client'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { Fixture, MatchCategory } from '@/types/fixtures'
import { isLiveStatus, isFinishedStatus } from '@/types/fixtures'
import { formatTimeBRT, formatDateShortBRT } from '@/lib/fixtures-client'
import { TeamLogo } from './TeamLogo'
import { useTranslation } from '@/hooks/useTranslation'

const CATEGORY_META: Record<MatchCategory, { emoji: string; color: string }> = {
  BR: { emoji: '🇧🇷', color: 'var(--green)' },
  EU: { emoji: '🌍', color: 'var(--blue)' },
  NT: { emoji: '🏳', color: 'var(--orange)' },
}

export function FixtureCard({
  fixture,
  selected,
  onSelect,
  onOpenWarRoom,
}: {
  fixture: Fixture
  selected: boolean
  onSelect: () => void
  onOpenWarRoom: () => void
}) {
  const { t } = useTranslation()
  const { fixture: f, league, teams, goals } = fixture
  const status = f.status.short
  const live = isLiveStatus(status)
  const finished = isFinishedStatus(status)
  const cat = CATEGORY_META[fixture._category]

  // Accent: live → green, selected → blue, else subtle
  const accent = live ? 'var(--green)' : selected ? 'var(--blue)' : 'var(--border-subtle)'
  const showScore = live || finished

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: finished ? 0.62 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      style={{
        position: 'relative',
        background: selected ? 'var(--s2)' : 'var(--s1)',
        border: `1px solid ${selected ? 'rgba(37,99,235,0.4)' : live ? 'rgba(62,207,142,0.35)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selected ? '0 4px 20px rgba(37,99,235,0.12)' : undefined,
      }}
    >
      {/* Top accent band (selected or live) */}
      {(selected || live) && (
        <div style={{
          height: 3,
          background: live ? 'var(--green)' : 'var(--grad)',
        }} />
      )}

      {/* Header: league + category + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 0', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <TeamLogo src={league.logo} alt={league.name} size={14} />
          <span style={{
            fontSize: 10, fontWeight: 600, color: 'var(--txt3)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {league.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: cat.color,
            background: `${cat.color}1a`, border: `1px solid ${cat.color}33`,
            borderRadius: 99, padding: '1px 7px', letterSpacing: '0.04em',
          }}>
            {cat.emoji} {t(`timeline.category.${fixture._category}`)}
          </span>
          {live ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--green)',
                animation: 'pulseDot 1.2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                {status === 'HT' ? t('timeline.halftime') : `${f.status.elapsed ?? ''}'`}
              </span>
            </span>
          ) : finished ? (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>
              {t('timeline.finished')}
            </span>
          ) : null}
        </div>
      </div>

      {/* Teams + score */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10,
      }}>
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <TeamLogo src={teams.home.logo} alt={teams.home.name} size={28} />
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--txt)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {teams.home.name}
          </span>
        </div>

        {/* Center: score or × */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
          {showScore ? (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800,
              color: live ? 'var(--green)' : 'var(--txt)', letterSpacing: 1, lineHeight: 1,
            }}>
              {goals.home ?? 0}<span style={{ color: 'var(--txt3)', margin: '0 2px' }}>–</span>{goals.away ?? 0}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>×</span>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--txt)', textAlign: 'right',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {teams.away.name}
          </span>
          <TeamLogo src={teams.away.logo} alt={teams.away.name} size={28} />
        </div>
      </div>

      {/* Meta: date + venue */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 14px 10px', fontSize: 10, color: 'var(--txt3)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
          📅 {formatDateShortBRT(f.timestamp)} · {formatTimeBRT(f.timestamp)} BRT
        </span>
        {f.venue?.name && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            📍 {f.venue.name}
          </span>
        )}
      </div>

      {/* War Room button (only when selected) */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ padding: '0 14px 12px' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onOpenWarRoom() }}
            style={{
              width: '100%', height: 36, borderRadius: 8,
              background: 'var(--grad)', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Zap size={13} /> {t('timeline.openWarRoomForMatch')}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
