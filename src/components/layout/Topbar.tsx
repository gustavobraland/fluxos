'use client'
import { useState } from 'react'
import { Search, Bell, Sun, Moon, Command, LogOut, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'
import { PresenceAvatars } from './PresenceAvatars'
import { FluxLogo } from './FluxLogo'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { useTranslation } from '@/hooks/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/onboarding-config'

export function Topbar() {
  const { theme, setTheme, toggleCmd, toggleNotif, toggleMobileNav } = useAppStore()
  const { name, email, role, avatarUrl } = useUserStore()
  const { t } = useTranslation()
  const router = useRouter()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const handleLogout = async () => {
    await createClient().auth.signOut()
    useUserStore.getState().clearUser()
    router.push('/login')
  }

  const initials = (name || email || 'FX').slice(0, 2).toUpperCase()

  return (
    <div
      className="topbar-root flex items-center gap-3 px-4 border-b shrink-0"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderColor: 'var(--topbar-border)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Mobile: menu (3 barras) no canto esquerdo → abre o drawer */}
      <button
        onClick={toggleMobileNav}
        aria-label="Menu"
        className="mobile-only shrink-0 flex items-center justify-center"
        style={{ width: 36, height: 36, marginLeft: -6, color: 'var(--txt2)' }}
      >
        <Menu size={20} />
      </button>

      {/* Logo — desktop: wordmark à esquerda */}
      <div className="shrink-0 desktop-only">
        <FluxLogo size="sm" showWordmark />
      </div>

      {/* Mobile: "FLUX os" centralizado (vertical+horizontal) → Pipeline */}
      <button
        onClick={() => router.push('/pipeline')}
        aria-label="Flux OS — Pipeline"
        className="mobile-only"
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          display: 'inline-flex', alignItems: 'baseline', gap: 2,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--txt)', lineHeight: 1 }}>FLUX</span>
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', color: '#E0201A', lineHeight: 1 }}>os</span>
      </button>

      {/* Spacer (mobile) — empurra ações p/ direita */}
      <div className="mobile-only flex-1" />

      {/* Search — center (desktop) */}
      <div className="desktop-only flex-1 flex justify-center px-4">
        <motion.div
          animate={{ width: searchFocused ? 420 : 340 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--txt3)' }}
          />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t('topbar.searchPlaceholder')}
            className="w-full h-8 pl-8 pr-16 rounded-lg text-[12.5px] outline-none transition-all"
            style={{
              background: 'var(--s2)',
              border: `1px solid ${searchFocused ? 'rgba(37,99,235,.3)' : 'var(--border-subtle)'}`,
              color: 'var(--txt)',
            }}
          />
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--s3)', color: 'var(--txt3)', border: '1px solid var(--border-subtle)' }}
          >
            ⌘K
          </kbd>
        </motion.div>
      </div>

      {/* Presence (desktop) */}
      <div className="desktop-only">
        <PresenceAvatars />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Language selector (bandeira BR/CN) — desktop e mobile */}
        <LanguageSelector />

        {/* Command (desktop) */}
        <TopBtn onClick={toggleCmd} title={t('topbar.cmdPalette')} className="desktop-only">
          <Command size={14} />
        </TopBtn>

        {/* Theme toggle */}
        <TopBtn onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={t('topbar.toggleTheme')}>
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div key="moon" initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon size={14} />
              </motion.div>
            ) : (
              <motion.div key="sun" initial={{ rotate: 20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -20, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun size={14} />
              </motion.div>
            )}
          </AnimatePresence>
        </TopBtn>

        {/* Notifications */}
        <TopBtn onClick={toggleNotif} title={t('topbar.notifications')} className="relative">
          <Bell size={14} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--coral)' }}
          />
        </TopBtn>

        {/* Divider (desktop) */}
        <div className="desktop-only w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

        {/* User (desktop — no mobile o perfil sai; logout fica no drawer) */}
        <div className="desktop-only flex items-center gap-2 h-8 px-2.5 rounded-lg" style={{ color: 'var(--txt)' }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name ?? ''} className="w-6 h-6 rounded-full" style={{ objectFit: 'cover' }} />
          ) : (
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'var(--red)' }}
            >
              {initials}
            </div>
          )}
          <div className="desktop-only flex flex-col items-start leading-none max-w-[160px]">
            <span className="text-[12px] font-medium truncate" style={{ maxWidth: 160 }}>
              {name || (process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'Flux OS')}
            </span>
            <span className="text-[9px] truncate" style={{ color: 'var(--txt3)', maxWidth: 160 }}>
              {email || 'Pro'}
            </span>
          </div>
          {role && (
            <span
              className="desktop-only text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.5px] shrink-0"
              style={{ background: 'var(--red-s)', color: 'var(--red)' }}
            >
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>

        {/* Logout (desktop — no mobile fica no drawer) */}
        <TopBtn onClick={handleLogout} title={t('topbar.logout')} className="desktop-only">
          <LogOut size={14} />
        </TopBtn>
      </div>
    </div>
  )
}

function TopBtn({
  children, onClick, title, className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--s2)] ${className}`}
      style={{ color: 'var(--txt2)' }}
    >
      {children}
    </button>
  )
}
