'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, LayoutDashboard, Zap, KanbanSquare, ClipboardList, Send,
  Sparkles, CheckSquare, FolderOpen, CalendarDays, Scissors, Plug, BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { FluxLogo } from '@/components/layout/FluxLogo'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import {
  ONBOARDING_CONTENT, ROLE_LABELS, ROLE_ORDER, onboardingRoleForEmail, type Role,
} from '@/lib/onboarding-config'

// Mapeia os símbolos usados no ONBOARDING_CONTENT para ícones da identidade.
const MODULE_ICONS: Record<string, LucideIcon> = {
  '◎': BarChart3, '⚡': Zap, '◫': KanbanSquare, '📋': ClipboardList, '📤': Send,
  '✦': Sparkles, '✅': CheckSquare, '🗂': FolderOpen, '📅': CalendarDays,
  '✂': Scissors, '⬡': Plug, '◉': LayoutDashboard,
}

// First-login onboarding. Shows once per user, then never again.
// Fluxo: (1) a pessoa escolhe o próprio papel; (2) vê as boas-vindas e os
// módulos daquele papel. O papel ESCOLHIDO é salvo no Supabase (coluna role) —
// não é mais detectado pelo email.
// Resiliente: gated por localStorage (instantâneo/offline) e Supabase
// (cross-device). Funciona mesmo se a tabela ainda não existir.
export function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'role' | 'welcome'>('role')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  // Papel travado: só liderança (CEO/Admin/PM) escolhe; os demais já vêm definidos.
  const [locked, setLocked] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const mail = user?.email
      if (!mail) return

      const key = `flux-onboarded-${mail.toLowerCase()}`
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) return

      // Cross-device check (ignorado se a tabela não existir ainda)
      try {
        const { data } = await supabase
          .from('user_onboarding')
          .select('id')
          .eq('user_email', mail)
          .maybeSingle()
        if (data) {
          try { localStorage.setItem(key, '1') } catch {}
          return
        }
      } catch { /* tabela ausente → cai no gating por localStorage */ }

      if (cancelled) return
      const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string }
      const fullName = meta.full_name || meta.name || mail.split('@')[0]
      setFirstName(fullName.split(' ')[0])
      setEmail(mail)

      // Liderança escolhe (com o papel pré-selecionado); demais já vêm travados
      // e pulam direto para as boas-vindas com o papel correto.
      const { role: initialRole, locked: isLocked } = onboardingRoleForEmail(mail)
      setLocked(isLocked)
      if (initialRole) setSelectedRole(initialRole)
      setStep(isLocked ? 'welcome' : 'role')
      setShow(true)
    }
    void check()
    return () => { cancelled = true }
  }, [])

  async function handleComplete() {
    if (!selectedRole) return
    setShow(false)
    // Aplica o papel escolhido no app imediatamente (sidebar/permissões).
    useUserStore.getState().setRole(selectedRole)
    if (email) {
      try { localStorage.setItem(`flux-onboarded-${email.toLowerCase()}`, '1') } catch {}
      try {
        const supabase = createClient()
        await supabase.from('user_onboarding').insert({ user_email: email, role: selectedRole })
      } catch { /* tabela ausente — localStorage já faz o gating */ }
    }
  }

  const content = selectedRole ? ONBOARDING_CONTENT[selectedRole] : null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              background: 'var(--s1)', border: '1px solid var(--border-mid)', borderRadius: 16,
              padding: 40, maxWidth: 600, width: '100%', textAlign: 'center',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <FluxLogo size="md" showWordmark />
            </div>

            <AnimatePresence mode="wait">
              {step === 'role' ? (
                // ─── Tela 1: seleção de papel ─────────────────────────────────
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt)', margin: 0, marginBottom: 8 }}>
                    Olá{firstName ? `, ${firstName}` : ''}! 👋
                  </h1>
                  <p style={{ fontSize: 15, color: 'var(--txt2)', margin: 0, marginBottom: 28 }}>
                    Qual é o seu papel na BraLand?
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
                    {ROLE_ORDER.map((role) => {
                      const selected = selectedRole === role
                      return (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          style={{
                            padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                            textAlign: 'left', fontSize: 14, fontWeight: 600,
                            background: selected ? 'var(--red-s)' : 'var(--s2)',
                            color: selected ? 'var(--red)' : 'var(--txt)',
                            border: `1.5px solid ${selected ? '#E0201A' : 'var(--border-subtle)'}`,
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}
                        >
                          <span
                            style={{
                              width: 16, height: 16, borderRadius: 99, flexShrink: 0,
                              border: `2px solid ${selected ? '#E0201A' : 'var(--border-mid)'}`,
                              background: selected ? '#E0201A' : 'transparent',
                              boxShadow: selected ? 'inset 0 0 0 3px var(--s1)' : 'none',
                            }}
                          />
                          {ROLE_LABELS[role]}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => selectedRole && setStep('welcome')}
                    disabled={!selectedRole}
                    style={{
                      background: '#E0201A', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '12px 32px', fontSize: 14, fontWeight: 600, width: '100%',
                      cursor: selectedRole ? 'pointer' : 'not-allowed',
                      opacity: selectedRole ? 1 : 0.45, transition: 'opacity 0.15s',
                    }}
                  >
                    Continuar →
                  </button>
                </motion.div>
              ) : (
                // ─── Tela 2: boas-vindas + módulos do papel ───────────────────
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                >
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt)', margin: 0, marginBottom: 8 }}>
                    {content?.greeting}
                  </h1>
                  <p style={{ fontSize: 15, color: 'var(--txt2)', margin: 0, marginBottom: 32 }}>
                    {content?.subtitle}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                    {content?.modules.map((mod, i) => {
                      const Icon = MODULE_ICONS[mod.icon] ?? Sparkles
                      return (
                        <div key={i} style={{
                          background: 'var(--s2)', border: '1px solid var(--border-subtle)',
                          borderRadius: 10, padding: 16, textAlign: 'left',
                        }}>
                          <Icon size={22} style={{ marginBottom: 8, color: 'var(--red)' }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{mod.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>{mod.desc}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!locked && (
                      <button
                        onClick={() => setStep('role')}
                        style={{
                          background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--border-subtle)',
                          borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        }}
                      >
                        <ChevronLeft size={16} /> Trocar papel
                      </button>
                    )}
                    <button
                      onClick={handleComplete}
                      style={{
                        background: '#E0201A', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1,
                      }}
                    >
                      Começar a usar →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
