// ─── SSE Goal Stream Route ────────────────────────────────────────────────────
// Streams GoalEvent objects to the browser via Server-Sent Events.
// Goals only — no noise. Provider: Upstash → API-Football → Mock (default).

export const dynamic = 'force-dynamic'

import type { GoalEvent } from '@/lib/timeline'
import { mockProvider } from '@/lib/providers/mock-provider'
import { apiFootballProvider } from '@/lib/providers/api-football-provider'
import { upstashProvider } from '@/lib/providers/upstash-provider'
import { replayEvents, publishEvent } from '@/lib/redis'
import type { SportsProvider } from '@/lib/timeline'

function resolveProvider(): SportsProvider {
  if (upstashProvider.isAvailable()) return upstashProvider
  if (apiFootballProvider.isAvailable()) return apiFootballProvider
  return mockProvider
}

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder()
  let cleanupProvider: (() => void) | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  // Replay historical goals from Redis (if configured)
  const history = await replayEvents(50)

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // Controller closed — ignore
        }
      }

      // Replay historical goals immediately on connect
      for (const goal of history) {
        enqueue(`data: ${JSON.stringify(goal)}\n\n`)
      }

      const provider = resolveProvider()

      const onGoal = async (goal: GoalEvent) => {
        enqueue(`data: ${JSON.stringify(goal)}\n\n`)
        // Persist to Redis in the background (non-blocking)
        publishEvent(goal).catch(() => {})
      }

      cleanupProvider = provider.startStreaming(onGoal)

      // Send provider info as SSE comment
      enqueue(`: provider=${provider.name}\n\n`)

      // Heartbeat every 20s to keep connection alive through proxies
      heartbeatTimer = setInterval(() => {
        enqueue(': heartbeat\n\n')
      }, 20_000)
    },

    cancel() {
      cleanupProvider?.()
      if (heartbeatTimer) clearInterval(heartbeatTimer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
