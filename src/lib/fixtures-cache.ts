// ─── Fixtures Cache (Upstash Redis) ───────────────────────────────────────────
// Server-side only. Never import from client components.
//
// Key structure:
//   flux:sports:fixtures           Hash  field=fixtureId value=JSON CachedFixture
//   flux:sports:fixtures:index     Sorted Set  score=kickoffTs  member=fixtureId
//   flux:sports:live:ids           Set  of currently-live fixtureIds  (TTL 5 min)
//   flux:sports:sync:lock          String mutex (EX 55s)
//   flux:sports:sync:last          String ISO timestamp

import type { MatchStatus } from './football'
import type { FootballTeam, FootballCompetition } from './football'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedFixture {
  id: string
  homeTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  awayTeam: Pick<FootballTeam, 'id' | 'name' | 'shortName' | 'emoji'>
  competition: Pick<FootballCompetition, 'id' | 'name' | 'shortName' | 'emoji'>
  status: MatchStatus
  minute: number
  score: { home: number; away: number }
  kickoffLabel: string
  kickoffTs: number   // Unix ms, used as ZADD score
  updatedAt: number
}

// ─── Redis keys ───────────────────────────────────────────────────────────────

const K_HASH   = 'flux:sports:fixtures'
const K_INDEX  = 'flux:sports:fixtures:index'
const K_LIVE   = 'flux:sports:live:ids'
const K_LOCK   = 'flux:sports:sync:lock'
const K_LAST   = 'flux:sports:sync:last'

const TTL_AFTER_KICKOFF_MS = 48 * 60 * 60 * 1000  // 48h

// ─── Redis singleton ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _r: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getR(): any | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (_r) return _r
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis')
    _r = new Redis({ url, token })
    return _r
  } catch {
    return null
  }
}

// ─── Mutex helpers ────────────────────────────────────────────────────────────

/** Returns true if lock was acquired (i.e. no other sync is running). */
export async function acquireSyncLock(): Promise<boolean> {
  const r = getR()
  if (!r) return true   // no Redis → allow (dev mode)
  try {
    const result = await r.set(K_LOCK, '1', { nx: true, ex: 55 })
    return result === 'OK'
  } catch {
    return true
  }
}

export async function releaseSyncLock(): Promise<void> {
  const r = getR()
  if (!r) return
  try { await r.del(K_LOCK) } catch { /* ignore */ }
}

export async function getLastSync(): Promise<string | null> {
  const r = getR()
  if (!r) return null
  try { return await r.get(K_LAST) } catch { return null }
}

export async function setLastSync(iso: string): Promise<void> {
  const r = getR()
  if (!r) return
  try { await r.set(K_LAST, iso) } catch { /* ignore */ }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Upsert fixtures into the cache. Idempotent — safe to call multiple times. */
export async function writeFixtures(fixtures: CachedFixture[]): Promise<void> {
  const r = getR()
  if (!r || fixtures.length === 0) return

  try {
    // Pipeline all writes
    const pl = r.pipeline()

    for (const f of fixtures) {
      pl.hset(K_HASH, { [f.id]: JSON.stringify(f) })
      pl.zadd(K_INDEX, { score: f.kickoffTs, member: f.id })
      // Auto-expire 48h after kickoff
      const expireAt = Math.floor((f.kickoffTs + TTL_AFTER_KICKOFF_MS) / 1000)
      // Upstash doesn't support EXPIREAT per hash field, so we track via the sorted set.
      // The index TTL is handled by cleanupExpired().
      void expireAt  // suppress unused var warning
    }

    await pl.exec()
  } catch {
    // Redis failure is non-fatal; in-memory fallback handled by caller
  }
}

/** Update a single live fixture in-place (called every 60s during live matches). */
export async function updateLiveFixture(f: CachedFixture): Promise<void> {
  const r = getR()
  if (!r) return
  try {
    await r.hset(K_HASH, { [f.id]: JSON.stringify(f) })
    await r.sadd(K_LIVE, f.id)
    await r.expire(K_LIVE, 300)  // 5 min TTL — refreshed each tick
  } catch { /* ignore */ }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Read fixtures from Redis in the range [now - 2h, now + windowHours].
 * Returns sorted by kickoffTs ascending.
 */
export async function readFixtures(windowHours = 168): Promise<CachedFixture[]> {
  const r = getR()
  if (!r) return []
  try {
    const now = Date.now()
    const min = now - 2 * 60 * 60 * 1000          // 2h ago (for live matches)
    const max = now + windowHours * 60 * 60 * 1000 // 7 days ahead

    const ids: string[] = await r.zrangebyscore(K_INDEX, min, max)
    if (!ids || ids.length === 0) return []

    const raw: (string | null)[] = await r.hmget(K_HASH, ...ids)
    const fixtures: CachedFixture[] = raw
      .map(v => {
        if (!v) return null
        try { return JSON.parse(v) as CachedFixture } catch { return null }
      })
      .filter((f): f is CachedFixture => f !== null)

    return fixtures.sort((a, b) => a.kickoffTs - b.kickoffTs)
  } catch {
    return []
  }
}

/** Returns the set of currently-live fixture IDs. */
export async function getLiveIds(): Promise<Set<string>> {
  const r = getR()
  if (!r) return new Set()
  try {
    const ids: string[] = await r.smembers(K_LIVE)
    return new Set(ids ?? [])
  } catch {
    return new Set()
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

/** Remove fixtures whose kickoffTs + 48h is in the past. Belt + suspenders over no-key TTL. */
export async function cleanupExpired(): Promise<number> {
  const r = getR()
  if (!r) return 0
  try {
    const cutoff = Date.now() - TTL_AFTER_KICKOFF_MS
    const staleIds: string[] = await r.zrangebyscore(K_INDEX, '-inf', cutoff)
    if (!staleIds || staleIds.length === 0) return 0

    const pl = r.pipeline()
    for (const id of staleIds) {
      pl.hdel(K_HASH, id)
      pl.zrem(K_INDEX, id)
    }
    await pl.exec()
    return staleIds.length
  } catch {
    return 0
  }
}

export function isCacheAvailable(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
