'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Brand Voice / Workspace settings ─────────────────────────────────────────
// Drives AI copy refinement. Editable from Settings → Brand Voice.

export interface BrandVoice {
  tone: string
  avoid: string
  hashtags: string[]
  emojis: boolean
  language: 'pt-BR' | 'en' | 'es' | 'hybrid'
}

const DEFAULT_BRAND_VOICE: BrandVoice = {
  tone: 'Energético, direto, apaixonado por esporte',
  avoid: 'Linguagem corporativa, clichês',
  hashtags: [],
  emojis: true,
  language: 'pt-BR',
}

interface WorkspaceState {
  brandVoice: BrandVoice
  setBrandVoice: (patch: Partial<BrandVoice>) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      brandVoice: DEFAULT_BRAND_VOICE,
      setBrandVoice: (patch) =>
        set((s) => ({ brandVoice: { ...s.brandVoice, ...patch } })),
    }),
    { name: 'flux-workspace' }
  )
)

const LANGUAGE_LABEL: Record<BrandVoice['language'], string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'Inglês',
  es: 'Espanhol',
  hybrid: 'Híbrido (PT + EN)',
}

/** Compose a single brand-voice description string for the AI prompt. */
export function brandVoiceToString(bv: BrandVoice): string {
  const parts: string[] = []
  parts.push(`Idioma: ${LANGUAGE_LABEL[bv.language]}`)
  if (bv.tone.trim()) parts.push(`Tom de voz: ${bv.tone.trim()}`)
  if (bv.avoid.trim()) parts.push(`Evitar: ${bv.avoid.trim()}`)
  parts.push(`Uso de emojis: ${bv.emojis ? 'permitido, com moderação' : 'não usar emojis'}`)
  const tags = bv.hashtags.filter(Boolean)
  if (tags.length) {
    parts.push(`Hashtags padrão da marca: ${tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')}`)
  }
  return parts.join('\n')
}
