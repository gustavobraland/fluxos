'use client'

// ─── Flux OS logo ─────────────────────────────────────────────────────────────
// Icon: the letter "F" as 3 rounded blocks, top→bottom decreasing width.
// The middle block is the brand red (#E0201A), always — independent of theme.
// Top/bottom blocks use currentColor (black on light, white on dark via --txt).

const RED = '#E0201A'

const ICON_W: Record<'sm' | 'md' | 'lg', number> = { sm: 18, md: 28, lg: 46 }
const WORD: Record<'sm' | 'md' | 'lg', { flux: number; os: number }> = {
  sm: { flux: 16, os: 11 },
  md: { flux: 22, os: 14 },
  lg: { flux: 34, os: 20 },
}

export interface FluxLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function FluxLogo({ size = 'md', showWordmark = false, className }: FluxLogoProps) {
  const w = ICON_W[size]
  const h = Math.round((w * 52) / 56)

  const icon = (
    <svg width={w} height={h} viewBox="0 0 56 52" fill="none" aria-label="Flux OS" style={{ color: 'var(--txt)', flexShrink: 0 }}>
      {/* top — wide */}
      <rect x="0" y="0" width="56" height="14" rx="4" fill="currentColor" />
      {/* middle — brand red */}
      <rect x="0" y="20" width="44" height="14" rx="4" fill={RED} />
      {/* bottom — small */}
      <rect x="0" y="40" width="26" height="12" rx="4" fill="currentColor" />
    </svg>
  )

  if (!showWordmark) {
    return <span className={className} style={{ display: 'inline-flex' }}>{icon}</span>
  }

  const { flux, os } = WORD[size]
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {icon}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif", fontWeight: 900, fontSize: flux, letterSpacing: '-0.5px', textTransform: 'uppercase', color: 'var(--txt)', lineHeight: 1 }}>
          FLUX
        </span>
        <span style={{ fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif", fontWeight: 900, fontSize: os, letterSpacing: '-0.3px', textTransform: 'uppercase', color: RED, lineHeight: 1 }}>
          OS
        </span>
      </span>
    </span>
  )
}
