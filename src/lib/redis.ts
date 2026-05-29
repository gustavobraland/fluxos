// ─── Upstash Redis wrapper ────────────────────────────────────────────────────
// Graceful no-op if @upstash/redis not configured or package absent.
// Uses dynamic require so build succeeds without the package or env vars.

import type { GoalEvent } from './timeline'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redis: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRedis(): any | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (_redis) return _redis
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis')
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    return null
  }
}

const STREAM_KEY = 'flux:timeline:goals'
const CHANNEL_KEY = 'flux:goals'

/** Append goal event to Redis stream AND publish to channel. No-op if no Redis. */
export async function publishEvent(goal: GoalEvent): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.xadd(STREAM_KEY, '*', { event: JSON.stringify(goal) })
    await r.publish(CHANNEL_KEY, JSON.stringify(goal))
  } catch {
    // Redis failure is non-fatal
  }
}

/**
 * Replay recent goal events from the Redis stream.
 * Returns empty array if Redis not configured or on error.
 */
export async function replayEvents(count = 50): Promise<GoalEvent[]> {
  const r = getRedis()
  if (!r) return []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: any[] = await r.xrange(STREAM_KEY, '-', '+', { count })
    return entries
      .map((entry: [string, Record<string, string>]) => {
        try {
          return JSON.parse(entry[1].event) as GoalEvent
        } catch {
          return null
        }
      })
      .filter((e): e is GoalEvent => e !== null)
      .slice(-count)
  } catch {
    return []
  }
}

/** Read new goal events since a given stream ID. Used for SSE polling mode. */
export async function readNewEvents(lastId: string): Promise<{ events: GoalEvent[]; lastId: string }> {
  const r = getRedis()
  if (!r) return { events: [], lastId }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: any[] = await r.xrange(STREAM_KEY, `(${lastId}`, '+')
    if (!entries || entries.length === 0) return { events: [], lastId }
    const events = entries
      .map((entry: [string, Record<string, string>]) => {
        try { return JSON.parse(entry[1].event) as GoalEvent } catch { return null }
      })
      .filter((e): e is GoalEvent => e !== null)
    const newLastId = entries[entries.length - 1][0] as string
    return { events, lastId: newLastId }
  } catch {
    return { events: [], lastId }
  }
}

export function isRedisAvailable(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
