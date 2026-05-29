'use client'
import { create } from 'zustand'
import { INTEGRATIONS } from '@/lib/constants'
import type { Integration } from '@/types'

interface IntegrationsState {
  integrations: Integration[]
  connecting: string | null
  connectInt: (id: string) => Promise<void>
  disconnectInt: (id: string) => void
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  integrations: INTEGRATIONS as unknown as Integration[],
  connecting: null,

  connectInt: async (id) => {
    set({ connecting: id })
    // Simulated OAuth delay
    await new Promise(r => setTimeout(r, 1500))
    set((s) => ({
      connecting: null,
      integrations: s.integrations.map(i =>
        i.id === id ? { ...i, connected: true, handle: '' } : i
      )
    }))
  },

  disconnectInt: (id) => set((s) => ({
    integrations: s.integrations.map(i =>
      i.id === id ? { ...i, connected: false, handle: '' } : i
    )
  })),
}))
