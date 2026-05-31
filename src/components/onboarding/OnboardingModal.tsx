'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FluxLogo } from '@/components/layout/FluxLogo'
import { createClient } from '@/lib/supabase/client'
import { ONBOARDING_CONTENT, roleForEmail, type OnboardingContent } from '@/lib/onboarding-config'

// First-login welcome, per role. Shows once per user, then never again.
// Resilient: gated by localStorage (instant/offline) AND Supabase user_onboarding
// (cross-device). Works even if the SQL table doesn't exist yet (degrades to
// localStorage-only) so it never spams.
export function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [content, setContent] = useState<OnboardingContent | null>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const mail = user?.email
      if (!mail) return

      const key = `flux-onboarded-${mail.toLowerCase()}`
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) return

      // Cross-device check (ignored if the table doesn't exist yet)
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
      } catch { /* table missing → fall back to localStorage gating */ }

      if (cancelled) return
      setEmail(mail)
      setContent(ONBOARDING_CONTENT[roleForEmail(mail)])
      setShow(true)
    }
    void check()
    return () => { cancelled = true }
  }, [])

  async function handleComplete() {
    setShow(false)
    if (email) {
      try { localStorage.setItem(`flux-onboarded-${email.toLowerCase()}`, '1') } catch {}
      try {
        const supabase = createClient()
        await supabase.from('user_onboarding').insert({ user_email: email, role: roleForEmail(email) })
      } catch { /* table missing — localStorage already gates it */ }
    }
  }

  if (!content) return null

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

            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt)', margin: 0, marginBottom: 8 }}>
              {content.greeting}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--txt2)', margin: 0, marginBottom: 32 }}>
              {content.subtitle}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {content.modules.map((mod, i) => (
                <div key={i} style={{
                  background: 'var(--s2)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, padding: 16, textAlign: 'left',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8, color: 'var(--red)' }}>{mod.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{mod.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>{mod.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              style={{
                background: '#E0201A', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
              }}
            >
              Começar a usar →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
