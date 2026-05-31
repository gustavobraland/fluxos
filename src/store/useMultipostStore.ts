'use client'
import { create } from 'zustand'

// ─── Multipost draft bridge ───────────────────────────────────────────────────
// Session-only handoff used when the War Room deploys content to Multipost.
// The Multipost page reads `draft` on mount, applies it, then clears it.

export interface MultipostDraft {
  caption: string
  platforms: string[]
  scheduledAt: number | null
  source: 'warroom' | 'manual' | 'prompt' | 'clipador'
}

interface MultipostState {
  draft: MultipostDraft | null
  setDraft: (draft: MultipostDraft) => void
  clearDraft: () => void
}

export const useMultipostStore = create<MultipostState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}))
