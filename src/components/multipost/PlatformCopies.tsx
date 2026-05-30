'use client'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { CharCounter } from './CharCounter'
import { YoutubeGlyph } from './YoutubeGlyph'
import { PLATFORM_LIMITS, PLATFORM_META, type PlatformId } from '@/lib/platform-limits'

interface PlatformCopiesProps {
  copies: Record<PlatformId, string>
  selected: PlatformId[]
  loading: boolean
  onEdit: (id: PlatformId, text: string) => void
  onFocus?: (id: PlatformId) => void
}

// Maps our platform-limits ids to PlatformIcon ids (no youtube id supported).
function PlatformGlyph({ id, size = 14 }: { id: PlatformId; size?: number }) {
  if (id === 'youtube_shorts') return <YoutubeGlyph size={size} />
  const iconId = id === 'twitter' ? 'twitter' : id
  return <PlatformIcon id={iconId} size={size} />
}

export function PlatformCopies({ copies, selected, loading, onEdit, onFocus }: PlatformCopiesProps) {
  if (selected.length === 0) {
    return (
      <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: '16px 0' }}>
        Selecione ao menos uma plataforma para gerar as copies.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected.map((id) => {
        const meta = PLATFORM_META[id]
        const limit = PLATFORM_LIMITS[id]
        const text = copies[id] ?? ''
        return (
          <div
            key={id}
            style={{
              background: 'var(--s2)',
              borderRadius: 10,
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <PlatformGlyph id={id} size={14} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', flex: 1 }}>
                {meta.label}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{limit.note}</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[100, 92, 70].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      height: 12,
                      width: `${w}%`,
                      borderRadius: 4,
                      background: 'var(--s3)',
                      animation: 'pulse 1.4s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => onEdit(id, e.target.value)}
                  onFocus={() => onFocus?.(id)}
                  className="w-full resize-none outline-none leading-relaxed"
                  style={{
                    width: '100%',
                    minHeight: 64,
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 12.5,
                    background: 'var(--s3)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--txt)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    marginBottom: 8,
                  }}
                />
                <CharCounter count={text.length} recommended={limit.recommended} limit={limit.caption} />
              </>
            )}
          </div>
        )
      })}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
    </div>
  )
}
