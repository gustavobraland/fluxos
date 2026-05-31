'use client'
import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'
import type { Fixture } from '@/types/fixtures'
import { formatDateShortBRT, formatTimeBRT } from '@/lib/fixtures-client'
import { TeamLogo } from './TeamLogo'
import { useTranslation } from '@/hooks/useTranslation'

export function FixtureSelectedBar({
  fixture,
  onOpenWarRoom,
  onClear,
}: {
  fixture: Fixture
  onOpenWarRoom: () => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const { fixture: f, teams } = fixture

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
        background: 'var(--s2)', borderTop: '1px solid rgba(37,99,235,0.35)',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.28)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      {/* Matchup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <TeamLogo src={teams.home.logo} alt={teams.home.name} size={24} />
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--txt)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {teams.home.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>×</span>
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--txt)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {teams.away.name}
        </span>
        <TeamLogo src={teams.away.logo} alt={teams.away.name} size={24} />
        <span style={{
          marginLeft: 4, fontSize: 10, color: 'var(--txt3)', fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
        }}>
          {formatDateShortBRT(f.timestamp)} · {formatTimeBRT(f.timestamp)} BRT
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={onOpenWarRoom}
        style={{
          height: 38, padding: '0 18px', borderRadius: 8,
          background: 'var(--grad)', border: 'none', color: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        <Zap size={14} /> {t('timeline.openWarRoom')}
      </button>
      <button
        onClick={onClear}
        title={t('timeline.deselect')}
        style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'var(--s1)', border: '1px solid var(--border-subtle)',
          color: 'var(--txt3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
