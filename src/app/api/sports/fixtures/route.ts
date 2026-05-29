// ─── Sports Fixtures Endpoint ─────────────────────────────────────────────────
// GET → returns CachedFixture[] from Redis.
// The browser reads this instead of hitting API-Football directly.
// Falls back gracefully to empty array when cache is unavailable.

import { NextResponse } from 'next/server'
import { readFixtures } from '@/lib/fixtures-cache'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const fixtures = await readFixtures()
  return NextResponse.json(fixtures)
}
