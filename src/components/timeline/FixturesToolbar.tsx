'use client'
import { RefreshCw } from 'lucide-react'
import type { MatchCategory } from '@/types/fixtures'

export type FixtureFilter = 'ALL' | MatchCategory

const FILTERS: { id: FixtureFilter; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'BR',  label: '🇧🇷 Brasil' },
  { id: 'EU',  label: '🌍 Europa' },
  { id: 'NT',  label: '🏳 Seleções' },
]

export function FixturesToolbar({
  filter,
  onFilter,
  liveCount,
  requestsUsed,
  loading,
  lastFetched,
  onRefresh,
}: {
  filter: FixtureFilter
  onFilter: (f: FixtureFilter) => void
  liveCount: number
  requestsUsed: number
  loading: boolean
  lastFetched: number | null
  onRefresh: () => void
}) {
  const updatedLabel = lastFetched
    ? new Date(lastFetched).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '12px 16px',
      background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {FILTERS.map(f => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => onFilter(f.id)}
              style={{
                height: 30, padding: '0 12px', borderRadius: 99,
                background: active ? 'var(--s3)' : 'transparent',
                border: `1px solid ${active ? 'rgba(91,184,232,0.4)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--txt)' : 'var(--txt3)',
                cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Live badge */}
      {liveCount > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
            animation: 'pulseDot 1.2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
            {liveCount} AO VIVO
          </span>
        </span>
      )}

      {/* Right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {updatedLabel && (
          <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>
            Atualizado às {updatedLabel}
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--txt3)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--s2)', border: '1px solid var(--border-subtle)',
          borderRadius: 99, padding: '2px 9px',
        }}>
          {requestsUsed}/100 req hoje
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            height: 30, padding: '0 12px', borderRadius: 8,
            background: 'rgba(91,184,232,0.12)', border: '1px solid rgba(91,184,232,0.3)',
            color: 'var(--blue)', cursor: loading ? 'default' : 'pointer',
            fontSize: 11, fontWeight: 600, opacity: loading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          Atualizar
        </button>
      </div>
    </div>
  )
}
