// ─── Fixtures client helpers ──────────────────────────────────────────────────
// Browser-side: fetch from our own server route (never API-Football directly).
// Plus date/grouping utilities for the timeline UI.

import type { Fixture } from '@/types/fixtures'
import { isLiveStatus } from '@/types/fixtures'

export interface FixturesResponse {
  fixtures: Fixture[]
  connected: boolean
  error: string | null
  requestsUsed: number
}

/** Fetch all priority-team fixtures via the server proxy. */
export async function fetchAllFixtures(): Promise<FixturesResponse> {
  const res = await fetch('/api/fixtures', { cache: 'no-store' })
  if (!res.ok) {
    return { fixtures: [], connected: false, error: `HTTP_${res.status}`, requestsUsed: 0 }
  }
  return res.json() as Promise<FixturesResponse>
}

// ─── Date / time (America/Sao_Paulo, BRT = UTC-3) ─────────────────────────────

const TZ = 'America/Sao_Paulo'

/** "16:00" — kickoff time in BRT */
export function formatTimeBRT(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ,
  })
}

/** "24/05" — short date in BRT */
export function formatDateShortBRT(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', timeZone: TZ,
  })
}

/** YYYY-MM-DD key in BRT for grouping fixtures by calendar day */
export function dayKeyBRT(timestamp: number): string {
  // en-CA gives ISO-like YYYY-MM-DD
  return new Date(timestamp * 1000).toLocaleDateString('en-CA', { timeZone: TZ })
}

/** "HOJE" / "AMANHÃ" / "SEG, 27 MAI" for a day group */
export function dayLabelBRT(timestamp: number): string {
  const key = dayKeyBRT(timestamp)
  const todayKey = dayKeyBRT(Math.floor(Date.now() / 1000))
  const tomorrowKey = dayKeyBRT(Math.floor(Date.now() / 1000) + 24 * 3600)

  if (key === todayKey) return 'HOJE'
  if (key === tomorrowKey) return 'AMANHÃ'

  return new Date(timestamp * 1000)
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: TZ })
    .replace('.', '')
    .toUpperCase()
}

export function isToday(timestamp: number): boolean {
  return dayKeyBRT(timestamp) === dayKeyBRT(Math.floor(Date.now() / 1000))
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

export interface DayGroup {
  key: string
  label: string
  isToday: boolean
  timestamp: number   // representative timestamp (first fixture of the day)
  fixtures: Fixture[]
}

/** Group fixtures by BRT calendar day, preserving chronological order. */
export function groupByDay(fixtures: Fixture[]): DayGroup[] {
  const map = new Map<string, Fixture[]>()
  for (const f of fixtures) {
    const key = dayKeyBRT(f.fixture.timestamp)
    const arr = map.get(key)
    if (arr) arr.push(f)
    else map.set(key, [f])
  }

  return Array.from(map.entries())
    .map(([key, fxs]) => {
      const ts = fxs[0].fixture.timestamp
      return { key, label: dayLabelBRT(ts), isToday: isToday(ts), timestamp: ts, fixtures: fxs }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function hasLiveFixture(fixtures: Fixture[]): boolean {
  return fixtures.some(f => isLiveStatus(f.fixture.status.short))
}
