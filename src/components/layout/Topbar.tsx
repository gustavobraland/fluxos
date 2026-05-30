'use client'
import { useState } from 'react'
import { Search, Bell, Sun, Moon, Command, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { PresenceAvatars } from './PresenceAvatars'
import { FluxLogo } from './FluxLogo'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { useTranslation } from '@/hooks/useTranslation'

export function Topbar() {
  const { theme, setTheme, toggleCmd, toggleNotif } = useAppStore()
  const { t } = useTranslation()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  return (
    <div
      className="flex items-center gap-3 px-4 border-b shrink-0"
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
      {/* Logo */}
      <div className="shrink-0">
        <FluxLogo size="sm" showWordmark />
      </div>

      {/* Search — center */}
      <div className="flex-1 flex justify-center px-4">
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

      {/* Presence */}
      <PresenceAvatars />

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Language selector */}
        <LanguageSelector />

        {/* Command */}
        <TopBtn onClick={toggleCmd} title={t('topbar.cmdPalette')}>
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

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

        {/* Workspace selector */}
        <button
          className="flex items-center gap-2 h-8 px-2.5 rounded-lg transition-colors hover:bg-[var(--s2)]"
          style={{ color: 'var(--txt)' }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: 'var(--grad)' }}
          >
            {(process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'FX').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[12px] font-medium">
              {process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'Flux OS'}
            </span>
            <span className="text-[9px]" style={{ color: 'var(--txt3)' }}>Pro</span>
          </div>
          <ChevronDown size={12} style={{ color: 'var(--txt3)' }} />
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white cursor-pointer ml-1"
          style={{ background: 'linear-gradient(135deg, #2563EB, #A78BFA)' }}
          title="Meu perfil"
        >
          G
        </div>
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
