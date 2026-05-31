'use client'
import { Activity, PauseCircle } from 'lucide-react'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { useTranslation } from '@/hooks/useTranslation'

// Live API-Football quota meter. Yellow at 70+, red at 90+. Also surfaces whether
// the adaptive poller is currently running or paused.
export function QuotaDisplay() {
  const requestsUsed = useWarRoomStore(s => s.requestsUsed)
  const isPolling = useWarRoomStore(s => s.isPolling)
  const matchEnded = useWarRoomStore(s => s.matchEnded)
  const { t } = useTranslation()

  const color =
    requestsUsed >= 90 ? 'var(--red)' :
    requestsUsed >= 70 ? 'var(--yellow)' :
    'var(--green)'

  const pct = Math.min((requestsUsed / 100) * 100, 100)

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {isPolling ? (
          <Activity size={13} style={{ color: 'var(--green)' }} />
        ) : (
          <PauseCircle size={13} style={{ color: 'var(--txt3)' }} />
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>
          {t('warroom.apiCredits')}
        </span>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)',
          fontSize: 12, fontWeight: 700, color,
        }}>
          {requestsUsed}/100
        </span>
      </div>

      <div style={{ height: 4, borderRadius: 99, background: 'var(--s3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
      </div>

      <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 6 }}>
        {matchEnded
          ? t('warroom.quotaEnded')
          : isPolling
            ? t('warroom.quotaPolling')
            : t('warroom.quotaIdle')}
      </div>
    </div>
  )
}
