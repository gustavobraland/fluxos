'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'pt-BR' | 'zh-CN'

export const SUPPORTED_LOCALES: { id: Locale; label: string; flag: string; nativeLabel: string }[] = [
  { id: 'pt-BR', label: 'Português', flag: '🇧🇷', nativeLabel: 'Português' },
  { id: 'zh-CN', label: '中文',       flag: '🇨🇳', nativeLabel: '中文（简体）' },
]

interface I18nState {
  locale: Locale
  directorMode: boolean   // forces zh-CN when true
  setLocale: (locale: Locale) => void
  toggleDirectorMode: () => void
  setDirectorMode: (on: boolean) => void
  /** Resolved locale, respecting directorMode */
  resolvedLocale: () => Locale
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'pt-BR',
      directorMode: false,

      resolvedLocale: () => {
        const { locale, directorMode } = get()
        return directorMode ? 'zh-CN' : locale
      },

      setLocale: (locale) => set({ locale }),

      toggleDirectorMode: () =>
        set(s => ({ directorMode: !s.directorMode })),

      setDirectorMode: (on) => set({ directorMode: on }),
    }),
    { name: 'flux-i18n' }
  )
)
