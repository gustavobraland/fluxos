'use client'

// lucide-react v1.16 ships no `Youtube` icon, so we provide a compact inline
// YouTube glyph for the YouTube Shorts platform across the Multipost UI.
export function YoutubeGlyph({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || 'currentColor',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <polygon points="10,9 10,15 16,12" fill="currentColor" />
      </svg>
    </span>
  )
}
