// ─── Upstash Redis Provider ───────────────────────────────────────────────────
// When Redis is configured: replays recent events from stream, then polls for new ones.
// Used by the SSE route as an alternative to the mock provider.

import type { SportsProvider } from '../timeline'
import { replayEvents, readNewEvents, isRedisAvailable } from '../redis'

export const upstashProvider: SportsProvider = {
  name: 'upstash',

  isAvailable: isRedisAvailable,

  startStreaming: (onEvent) => {
    let active = true
    let lastId = '0-0'
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const start = async () => {
      // Replay historical events first
      const history = await replayEvents(50)
      for (const event of history) {
        if (!active) return
        try { onEvent(event) } catch { /* ignore */ }
      }

      // Poll for new events every 1s (Upstash HTTP limitation — no long-lived SUBSCRIBE)
      const poll = async () => {
        if (!active) return
        try {
          const { events, lastId: newId } = await readNewEvents(lastId)
          lastId = newId
          for (const event of events) {
            try { onEvent(event) } catch { /* ignore */ }
          }
        } catch {
          // Redis error — non-fatal, retry
        } finally {
          if (active) {
            pollTimer = setTimeout(poll, 1000)
          }
        }
      }

      poll()
    }

    start()

    return () => {
      active = false
      if (pollTimer) clearTimeout(pollTimer)
    }
  },
}
