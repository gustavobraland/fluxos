'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Calendar events ──────────────────────────────────────────────────────────
// War Room matches sync into here automatically (source: 'warroom'). Multipost
// and manual entries can also live here. Dedup is by `id`, so re-adding the same
// match (same fixtureId) is idempotent.

export interface CalendarEvent {
  id: string
  type: 'match' | 'content' | 'deadline' | 'campaign'
  title: string
  subtitle: string
  date: string        // YYYY-MM-DD (BRT calendar day)
  time: string        // HH:MM BRT
  timestamp: number   // Unix seconds, UTC
  platforms?: string[]
  source: 'warroom' | 'manual' | 'multipost'
  fixtureId?: number
  result?: 'win' | 'draw' | 'loss' | null
  leagueLogo?: string
  homeLogo?: string
  awayLogo?: string
}

interface CalendarState {
  events: CalendarEvent[]
  addEvent: (e: CalendarEvent) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  removeEvent: (id: string) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (e) =>
        set((s) => {
          // idempotent on id — replace if it already exists
          const rest = s.events.filter((ev) => ev.id !== e.id)
          return { events: [...rest, e] }
        }),

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)),
        })),

      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((ev) => ev.id !== id) })),
    }),
    { name: 'flux-calendar' }
  )
)
