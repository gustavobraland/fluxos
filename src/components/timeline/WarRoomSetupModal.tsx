'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'
import type { Fixture } from '@/types/fixtures'
import { type WarRoomSetup, DEFAULT_SETUP } from '@/store/useWarRoomStore'
import { formatDateShortBRT, formatTimeBRT } from '@/lib/fixtures-client'
import { TeamLogo } from './TeamLogo'

const OPTIONS: { key: keyof WarRoomSetup; label: string; desc: string }[] = [
  { key: 'liveWarRoom',       label: 'War Room ao vivo',     desc: 'Acompanhar gols e lances em tempo real' },
  { key: 'prePacks',          label: 'Pacotes pré-jogo',     desc: 'Gerar artes de escalação e antevisão' },
  { key: 'preMatchHype',      label: 'Hype pré-partida',     desc: 'Conteúdo de aquecimento para redes' },
  { key: 'iGaming',           label: 'iGaming / Odds',       desc: 'Integração de cotações e apostas' },
  { key: 'realtimeAnalytics', label: 'Analytics em tempo real', desc: 'Estatísticas e métricas durante o jogo' },
]

export function WarRoomSetupModal({
  fixture,
  onClose,
  onLaunch,
}: {
  fixture: Fixture
  onClose: () => void
  onLaunch: (setup: WarRoomSetup) => void
}) {
  const [setup, setSetup] = useState<WarRoomSetup>(DEFAULT_SETUP)
  const { teams, fixture: f, league } = fixture

  const toggle = (key: keyof WarRoomSetup) =>
    setSetup(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--s1)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: 'var(--grad)' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '16px 18px 0',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)' }}>
              Configurar War Room
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
              Escolha os módulos para esta partida
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--s2)', border: '1px solid var(--border-subtle)',
              color: 'var(--txt3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Matchup summary */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '14px 18px', padding: '12px 14px',
          background: 'var(--s2)', borderRadius: 10,
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <TeamLogo src={teams.home.logo} alt={teams.home.name} size={26} />
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--txt)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {teams.home.name}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>×</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--txt)', textAlign: 'right',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {teams.away.name}
            </span>
            <TeamLogo src={teams.away.logo} alt={teams.away.name} size={26} />
          </div>
        </div>
        <div style={{
          margin: '-6px 18px 0', fontSize: 10, color: 'var(--txt3)',
          fontFamily: 'var(--font-mono)', textAlign: 'center',
        }}>
          {league.name} · {formatDateShortBRT(f.timestamp)} · {formatTimeBRT(f.timestamp)} BRT
        </div>

        {/* Options */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPTIONS.map(opt => {
            const on = setup[opt.key]
            return (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left',
                  padding: '10px 12px', borderRadius: 9, width: '100%',
                  background: on ? 'rgba(91,184,232,0.08)' : 'var(--s2)',
                  border: `1px solid ${on ? 'rgba(91,184,232,0.4)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {/* Checkbox */}
                <span style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: on ? 'var(--blue)' : 'transparent',
                  border: `1.5px solid ${on ? 'var(--blue)' : 'var(--border-strong, var(--txt3))'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                }}>
                  {on ? '✓' : ''}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>
                    {opt.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>
                    {opt.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Launch */}
        <div style={{ padding: '0 18px 18px' }}>
          <button
            onClick={() => onLaunch(setup)}
            style={{
              width: '100%', height: 42, borderRadius: 10,
              background: 'var(--grad)', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <Zap size={15} /> Lançar War Room
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
