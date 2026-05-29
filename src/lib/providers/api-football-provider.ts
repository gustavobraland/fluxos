// ─── API Football Provider ────────────────────────────────────────────────────
// Polls /api/football/live, emits GOAL events only.

import type { SportsProvider, GoalEvent } from '../timeline'
import { mapAPIFixture } from '../football'
import type { LiveMatch } from '../football'

const POLL_INTERVAL = parseInt(process.env.FOOTBALL_POLL_INTERVAL ?? '60000', 10)

export const apiFootballProvider: SportsProvider = {
  name: 'api-football',
  isAvailable: () => !!process.env.FOOTBALL_API_KEY,

  startStreaming: (onGoal) => {
    const seenEventIds = new Set<string>()
    let timer: ReturnType<typeof setTimeout> | null = null
    let active = true

    const poll = async () => {
      if (!active) return
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/football/live`,
          { cache: 'no-store' },
        )
        if (!res.ok) return
        const data = await res.json() as { fixtures: unknown[]; connected: boolean }
        if (!data.connected) return

        const matches = (data.fixtures ?? [])
          .map(mapAPIFixture)
          .filter((m): m is LiveMatch => m !== null)

        for (const match of matches) {
          for (const event of match.events) {
            if (event.type !== 'goal' && event.type !== 'penalty') continue
            const key = `${match.id}-${event.id}`
            if (seenEventIds.has(key)) continue
            seenEventIds.add(key)

            const side = event.team
            const goal: GoalEvent = {
              id: key,
              matchId: match.id,
              team: side,
              scorer: event.player,
              minute: event.minute,
              score: { ...match.score },
              scoreStr: `${match.score.home}-${match.score.away}`,
              homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName, emoji: match.homeTeam.emoji },
              awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName, emoji: match.awayTeam.emoji },
              competition: { id: match.competition.id, name: match.competition.name, shortName: match.competition.shortName, emoji: match.competition.emoji },
              timestamp: Date.now(),
            }
            try { onGoal(goal) } catch { /* ignore */ }
          }
        }
      } catch {
        // Retry next tick
      } finally {
        if (active) timer = setTimeout(poll, POLL_INTERVAL)
      }
    }

    poll()
    return () => { active = false; if (timer) clearTimeout(timer) }
  },
}
