'use client'
import { create } from 'zustand'
import type { Clip, ClipPlatform } from '@/lib/clipador'

export type ClipadorStatus = 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'ready' | 'error'

interface ClipadorState {
  status: ClipadorStatus
  progressLabel: string
  sourceLabel: string          // YouTube URL or file name being processed
  clips: Clip[]
  selectedPlatforms: ClipPlatform[]

  setStatus: (status: ClipadorStatus, progressLabel?: string) => void
  setSource: (label: string) => void
  setClips: (clips: Clip[]) => void
  updateClip: (id: string, patch: Partial<Clip>) => void
  togglePlatform: (p: ClipPlatform) => void
  reset: () => void
}

export const useClipadorStore = create<ClipadorState>((set) => ({
  status: 'idle',
  progressLabel: '',
  sourceLabel: '',
  clips: [],
  selectedPlatforms: ['reels', 'tiktok', 'shorts'],

  setStatus: (status, progressLabel = '') => set({ status, progressLabel }),
  setSource: (sourceLabel) => set({ sourceLabel }),
  setClips: (clips) => set({ clips }),
  updateClip: (id, patch) => set((s) => ({ clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  togglePlatform: (p) => set((s) => ({
    selectedPlatforms: s.selectedPlatforms.includes(p)
      ? s.selectedPlatforms.filter((x) => x !== p)
      : [...s.selectedPlatforms, p],
  })),
  reset: () => set({ status: 'idle', progressLabel: '', sourceLabel: '', clips: [] }),
}))
