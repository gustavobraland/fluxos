'use client'
import { useTranslation } from '@/hooks/useTranslation'

interface CharCounterProps {
  count: number
  recommended: number
  limit: number
}

export function CharCounter({ count, recommended, limit }: CharCounterProps) {
  const { t } = useTranslation()
  const over = count > limit
  const warn = count > recommended && count <= limit
  const ideal = count <= recommended

  const color = over ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--green)'
  const pct = Math.min((count / limit) * 100, 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: 'var(--s3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            background: color,
            transition: 'width 0.2s, background 0.2s',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {ideal && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--green)',
              background: 'rgba(62,207,142,.12)',
              border: '1px solid rgba(62,207,142,.25)',
              borderRadius: 99,
              padding: '1px 7px',
            }}
          >
            {t('multipost.charIdeal')}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color,
          }}
        >
          {count} / {limit}
        </span>
      </div>
    </div>
  )
}
