'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/permissions'
import { TEAM } from '@/lib/onboarding-config'

interface UserState {
  email: string | null
  name: string | null
  role: Role | null
  avatarUrl: string | null
  /** Popula o usuário logado (email do Google) e resolve o papel pela TEAM. */
  setUser: (email: string, avatarUrl?: string | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      email: null,
      name: null,
      role: null,
      avatarUrl: null,
      setUser: (email, avatarUrl) => {
        const mail = email.toLowerCase()
        const member = TEAM.find((m) => m.email.toLowerCase() === mail)
        set({
          email,
          name: member?.name ?? email.split('@')[0],
          // Sem mapeamento explícito → 'admin' (fallback igual ao roleForEmail).
          role: member?.role ?? 'admin',
          avatarUrl: avatarUrl ?? null,
        })
      },
      clearUser: () => set({ email: null, name: null, role: null, avatarUrl: null }),
    }),
    { name: 'flux-user' }
  )
)
