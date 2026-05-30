'use client'

// ─── Flux OS logo ─────────────────────────────────────────────────────────────
// Matches the official mark: "F" as 3 rounded blocks (top wide → middle red →
// bottom short), and the wordmark "FLUX" (geometric bold, wide tracking) + "os"
// (smaller, brand red). Top/bottom blocks use currentColor (var(--txt)) so they
// flip black↔white with the theme; the middle block is always brand red.

const RED = '#E0201A'
const FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif"

const ICON_W: Record<'sm' | 'md' | 'lg', number> = { sm: 19, md: 30, lg: 48 }
const WORD: Record<'sm' | 'md' | 'lg', { flux: number; os: number }> = {
  sm: { flux: 15, os: 9 },
  md: { flux: 21, os: 12 },
  lg: { flux: 32, os: 18 },
}

export interface FluxLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function FluxLogo({ size = 'md', showWordmark = false, className }: FluxLogoProps) {
  const w = ICON_W[size]

  const icon = (
    <svg width={w} height={w} viewBox="0 0 56 56" fill="none" aria-label="Flux OS" style={{ color: 'var(--txt)', flexShrink: 0 }}>
      {/* top — wide */}
      <rect x="0" y="0"    width="56" height="15" rx="5" fill="currentColor" />
      {/* middle — brand red */}
      <rect x="0" y="20.5" width="42" height="15" rx="5" fill={RED} />
      {/* bottom — short */}
      <rect x="0" y="41"   width="26" height="15" rx="5" fill="currentColor" />
    </svg>
  )

  if (!showWordmark) {
    return <span className={className} style={{ display: 'inline-flex' }}>{icon}</span>
  }

  const { flux, os } = WORD[size]
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: w * 0.55 }}>
      {icon}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: flux * 0.42 }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: flux, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--txt)', lineHeight: 1 }}>
          FLUX
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: os, letterSpacing: '0.04em', color: RED, lineHeight: 1 }}>
          os
        </span>
      </span>
    </span>
  )
}
