'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Scheduled posts (Multipost) ──────────────────────────────────────────────
// Persisted so scheduled posts survive reload; also mirrored onto the Calendar
// as `content` events by the Multipost page.

export interface ScheduledPost {
  id: string
  caption: string
  platforms: string[]
  scheduledAt: number  // Unix ms
  createdAt: number
}

interface ScheduleState {
  scheduled: ScheduledPost[]
  schedule: (post: Omit<ScheduledPost, 'id' | 'createdAt'>) => ScheduledPost
  removeScheduled: (id: string) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      scheduled: [],
      schedule: (post) => {
        const full: ScheduledPost = { ...post, id: crypto.randomUUID(), createdAt: Date.now() }
        set((s) => ({ scheduled: [...s.scheduled, full].sort((a, b) => a.scheduledAt - b.scheduledAt) }))
        return full
      },
      removeScheduled: (id) => set((s) => ({ scheduled: s.scheduled.filter((p) => p.id !== id) })),
    }),
    { name: 'flux-schedule' }
  )
)
