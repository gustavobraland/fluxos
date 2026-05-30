'use client'
import { useState } from 'react'

// Renders a team / national-side / league emblem from API-Football.
// On load failure the image is hidden silently — no emoji fallback. A sized,
// empty placeholder keeps the surrounding layout from shifting.
export function TeamLogo({ src, alt, size = 28 }: { src: string; alt: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <span
        aria-label={alt}
        style={{ width: size, height: size, flexShrink: 0, display: 'inline-block' }}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}
