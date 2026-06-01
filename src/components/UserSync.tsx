'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'

// Bump quando precisar invalidar dados locais antigos de todos os clientes.
const CURRENT_VERSION = '2.0.0'

// Chaves de dados (não de configuração) que podem conter mock/demo de testes.
// NÃO inclui flux-i18n (idioma), flux-workspace (brand voice) nem as chaves de
// onboarding (flux-onboarded-*), que devem sobreviver.
const DATA_KEYS = ['flux-approvals', 'flux-calendar', 'flux-schedule', 'flux-reports', 'flux-prompts']

/**
 * Roda no boot da área autenticada:
 *  1. Limpeza versionada do localStorage (remove dados mock/demo persistidos).
 *  2. Popula o useUserStore (papel resolvido pela TEAM) a partir do login Google.
 */
export function UserSync() {
  useEffect(() => {
    try {
      if (localStorage.getItem('flux-version') !== CURRENT_VERSION) {
        const hadData = DATA_KEYS.some((k) => localStorage.getItem(k) !== null)
        DATA_KEYS.forEach((k) => localStorage.removeItem(k))
        localStorage.setItem('flux-version', CURRENT_VERSION)
        // Stores persistidos já hidrataram do localStorage antigo; recarrega uma
        // única vez para reidratar limpo. A flag de versão evita loop, e só
        // recarregamos se realmente havia dados antigos (novos usuários não veem reload).
        if (hadData) {
          window.location.reload()
          return
        }
      }
    } catch { /* localStorage indisponível — segue sem limpeza */ }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u?.email) return
      const meta = (u.user_metadata ?? {}) as { avatar_url?: string; picture?: string }
      useUserStore.getState().setUser(u.email, meta.avatar_url || meta.picture || null)
    })
  }, [])

  return null
}
