// ─── Live Fixtures Types ──────────────────────────────────────────────────────
// Mirrors the API-Football /fixtures response, plus a Flux OS `_category` tag.

export type MatchCategory = 'BR' | 'EU' | 'NT' | 'CUP'

export type FixtureStatus =
  | 'NS'   // not started
  | '1H' | 'HT' | '2H' | 'ET' | 'P' | 'BT' | 'LIVE'  // in play
  | 'FT' | 'AET' | 'PEN'  // finished
  | 'SUSP' | 'PST' | 'CANC' | 'ABD' | 'TBD'  // irregular

export interface Fixture {
  fixture: {
    id: number
    timestamp: number   // Unix seconds, UTC
    status: {
      short: FixtureStatus
      elapsed: number | null
    }
    venue: {
      name: string | null
      city: string | null
    } | null
  }
  league: {
    id: number
    name: string
    logo: string
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: {
    home: number | null
    away: number | null
  }
  // Added by Flux OS after fetch
  _category: MatchCategory
}

// ─── Status helpers ─────────────────────────────────────────────────────────────

const LIVE_STATUSES = new Set<FixtureStatus>(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'])
const FINISHED_STATUSES = new Set<FixtureStatus>(['FT', 'AET', 'PEN'])

export function isLiveStatus(s: FixtureStatus): boolean {
  return LIVE_STATUSES.has(s)
}

export function isFinishedStatus(s: FixtureStatus): boolean {
  return FINISHED_STATUSES.has(s)
}

export function isScheduledStatus(s: FixtureStatus): boolean {
  return !isLiveStatus(s) && !isFinishedStatus(s)
}
