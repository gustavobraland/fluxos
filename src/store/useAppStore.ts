'use client'
import { create } from 'zustand'
import type { Theme, ViewId } from '@/types'
import type { ContentQueueItem } from '@/lib/football'

interface AppState {
  theme: Theme
  activeView: ViewId
  cmdOpen: boolean
  aiBarOpen: boolean
  notifOpen: boolean

  // Football → Multipost bridge (session-only, no persist)
  activeQueueItem: ContentQueueItem | null
  setActiveQueueItem: (item: ContentQueueItem) => void
  clearActiveQueueItem: () => void

  setTheme: (t: Theme) => void
  setView: (v: ViewId) => void
  toggleCmd: () => void
  closeCmd: () => void
  toggleAiBar: () => void
  closeAiBar: () => void
  toggleNotif: () => void
  closeNotif: () => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  activeView: 'pipeline',
  cmdOpen: false,
  aiBarOpen: false,
  notifOpen: false,

  activeQueueItem: null,
  setActiveQueueItem: (activeQueueItem) => set({ activeQueueItem }),
  clearActiveQueueItem: () => set({ activeQueueItem: null }),

  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('flux-theme', theme)
    }
  },
  setView:    (activeView) => set({ activeView, cmdOpen: false }),
  toggleCmd:  () => set((s) => ({ cmdOpen: !s.cmdOpen, aiBarOpen: false, notifOpen: false })),
  closeCmd:   () => set({ cmdOpen: false }),
  toggleAiBar:() => set((s) => ({ aiBarOpen: !s.aiBarOpen, cmdOpen: false })),
  closeAiBar: () => set({ aiBarOpen: false }),
  toggleNotif:() => set((s) => ({ notifOpen: !s.notifOpen })),
  closeNotif: () => set({ notifOpen: false }),
}))
