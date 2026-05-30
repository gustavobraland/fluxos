// ─── War Room lineup fetch ────────────────────────────────────────────────────
// Fetches the official lineup once per match via our server proxy and caches it
// in the store. If the official XI is not published yet, `available` is false and
// the UI shows the "provável" state. Never refetches once cached.

import { useWarRoomStore, type Lineup } from '@/store/useWarRoomStore'

export async function fetchLineup(fixtureId: number): Promise<void> {
  const store = useWarRoomStore.getState()

  // Already cached with a published lineup → don't spend another request
  if (store.lineup?.available) return

  try {
    const res = await fetch(`/api/football/lineup?fixture=${fixtureId}`, { cache: 'no-store' })
    const data = (await res.json()) as Lineup & { requestsUsed?: number }

    if (typeof data.requestsUsed === 'number' && data.requestsUsed > 0) {
      store.setRequestsUsed(data.requestsUsed)
    }

    store.setLineup({
      available: !!data.available,
      home: data.home ?? null,
      away: data.away ?? null,
    })
  } catch {
    store.setLineup({ available: false, home: null, away: null })
  }
}
