'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Prompt } from '@/types/prompts'
import { DEFAULT_PROMPTS } from '@/lib/default-prompts'

interface PromptsState {
  prompts: Prompt[]
  addPrompt: (data: Omit<Prompt, 'id' | 'createdAt' | 'usageCount'>) => Prompt
  updatePrompt: (id: string, patch: Partial<Prompt>) => void
  deletePrompt: (id: string) => void
  incrementUsage: (id: string) => void
  usePrompt: (id: string) => string
}

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set, get) => ({
      prompts: DEFAULT_PROMPTS,

      addPrompt: (data) => {
        const prompt: Prompt = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          usageCount: 0,
        }
        set((s) => ({ prompts: [prompt, ...s.prompts] }))
        return prompt
      },

      updatePrompt: (id, patch) =>
        set((s) => ({
          prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deletePrompt: (id) =>
        set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),

      incrementUsage: (id) =>
        set((s) => ({
          prompts: s.prompts.map((p) =>
            p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p
          ),
        })),

      usePrompt: (id) => {
        const prompt = get().prompts.find((p) => p.id === id)
        if (!prompt) return ''
        get().incrementUsage(id)
        return prompt.template
      },
    }),
    { name: 'flux-prompts' }
  )
)
