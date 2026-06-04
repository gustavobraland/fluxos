'use client'
import { useState, useEffect } from 'react'

/**
 * Reage a uma media query. SSR-safe: começa `false` e sincroniza no client
 * após a montagem (evita mismatch de hidratação).
 *
 * Uso: const isMobile = useMediaQuery('(max-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
