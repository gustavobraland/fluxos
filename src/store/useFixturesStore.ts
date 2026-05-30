import { create } from 'zustand'
import type { Fixture } from '@/types/fixtures'
import { fetchAllFixtures } from '@/lib/fixtures-client'

interface FixturesState {
  fixtures: Fixture[]
  loading: boolean
  error: string | null
  selectedFixture: Fixture | null
  lastFetched: number | null
  requestsUsed: number
  connected: boolean

  fetchAll: () => Promise<void>
  selectFixture: (f: Fixture | null) => void
}

// Refetch only if cache is older than this (protects the 100/day free tier)
const CACHE_TTL = 10 * 60_000 // 10 min

export const useFixturesStore = create<FixturesState>((set, get) => ({
  fixtures: [],
  loading: false,
  error: null,
  selectedFixture: null,
  lastFetched: null,
  requestsUsed: 0,
  connected: false,

  fetchAll: async () => {
    const { loading, lastFetched } = get()
    if (loading) return
    // Skip if cache is still fresh
    if (lastFetched && Date.now() - lastFetched < CACHE_TTL && get().fixtures.length > 0) {
      return
    }

    set({ loading: true, error: null })
    try {
      const res = await fetchAllFixtures()
      set({
        fixtures: res.fixtures,
        connected: res.connected,
        error: res.error,
        requestsUsed: res.requestsUsed,
        loading: false,
        lastFetched: Date.now(),
      })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'FETCH_ERROR',
        connected: false,
      })
    }
  },

  selectFixture: (selectedFixture) => set({ selectedFixture }),
}))
