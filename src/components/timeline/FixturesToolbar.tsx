'use client'
import { RefreshCw } from 'lucide-react'
import type { MatchCategory } from '@/types/fixtures'
import { useTranslation } from '@/hooks/useTranslation'

export type FixtureFilter = 'ALL' | MatchCategory

const FILTER_IDS: FixtureFilter[] = ['ALL', 'BR', 'EU', 'NT']

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
  const { t } = useTranslation()
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
        {FILTER_IDS.map(id => {
          const active = filter === id
          return (
            <button
              key={id}
              onClick={() => onFilter(id)}
              style={{
                height: 30, padding: '0 12px', borderRadius: 99,
                background: active ? 'var(--s3)' : 'transparent',
                border: `1px solid ${active ? 'rgba(37,99,235,0.4)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--txt)' : 'var(--txt3)',
                cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              {t(`timeline.filters.${id}`)}
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
            {t('timeline.liveCount', { count: liveCount })}
          </span>
        </span>
      )}

      {/* Right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {updatedLabel && (
          <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>
            {t('timeline.updatedAt', { time: updatedLabel })}
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--txt3)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--s2)', border: '1px solid var(--border-subtle)',
          borderRadius: 99, padding: '2px 9px',
        }}>
          {t('timeline.requestsToday', { count: requestsUsed })}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            height: 30, padding: '0 12px', borderRadius: 8,
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)',
            color: 'var(--blue)', cursor: loading ? 'default' : 'pointer',
            fontSize: 11, fontWeight: 600, opacity: loading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          {t('timeline.refresh')}
        </button>
      </div>
    </div>
  )
}
