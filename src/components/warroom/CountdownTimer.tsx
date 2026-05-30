'use client'
import { useEffect, useState } from 'react'

// Counts down to a fixture kickoff (Unix seconds). Renders "AO VIVO EM BREVE"
// once the kickoff time has passed but live data hasn't arrived yet.
export function CountdownTimer({ kickoffTs }: { kickoffTs: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  const diff = kickoffTs * 1000 - now

  if (diff <= 0) {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
        color: 'var(--yellow)', letterSpacing: '0.04em',
      }}>
        AO VIVO EM BREVE
      </span>
    )
  }

  const totalSec = Math.floor(diff / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  const label = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800,
      color: 'var(--txt)', letterSpacing: 1,
    }}>
      {label}
    </span>
  )
}
