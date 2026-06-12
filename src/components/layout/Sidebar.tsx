'use client'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Activity, Zap, KanbanSquare, CalendarDays,
  Send, FolderOpen, CheckSquare, BarChart3, Plug, ChevronRight,
  Settings, HelpCircle, ClipboardList, Sparkles, Scissors, LogOut,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { NAV_ITEMS } from '@/lib/constants'
import { ROLE_LABELS } from '@/lib/onboarding-config'
import { roleCan } from '@/lib/permissions'
import { useTranslation } from '@/hooks/useTranslation'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Activity, Zap, KanbanSquare, CalendarDays,
  Send, FolderOpen, CheckSquare, BarChart3, Plug, ClipboardList, Scissors, Sparkles,
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { closeCmd, mobileNavOpen, closeMobileNav } = useAppStore()
  const { name, role } = useUserStore()
  const { t } = useTranslation()

  const navigate = (id: string) => {
    closeCmd()
    closeMobileNav()
    router.push('/' + id)
  }

  const goSys = (path: string) => {
    closeMobileNav()
    router.push(path)
  }

  const handleLogout = async () => {
    closeMobileNav()
    await createClient().auth.signOut()
    useUserStore.getState().clearUser()
    router.push('/login')
  }

  // Mostra só os itens que o papel do usuário pode acessar (permission null = todos).
  // Enquanto o papel não carrega (role === null), mostramos tudo para evitar flash vazio.
  const visibleSections = NAV_ITEMS
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !role || item.permission == null || roleCan(role, item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0)

  // Conteúdo compartilhado entre a sidebar fixa (desktop) e o drawer (mobile).
  // `variant` separa o layoutId para não conflitar entre as duas instâncias no DOM.
  const panelContent = (variant: 'desktop' | 'mobile') => (
    <>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 no-scrollbar">
        {visibleSections.map((section) => (
          <div key={section.section} className="mb-1">
            <div
              className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[1px]"
              style={{ color: 'var(--txt3)' }}
            >
              {t(`nav.sections.${section.section}`) || section.section}
            </div>

            {section.items.map((item) => {
              const Icon = ICON_MAP[item.icon]
              const isActive = pathname === '/' + item.id

              return (
                <div key={item.id} className="relative px-2">
                  {isActive && (
                    <motion.div
                      layoutId={`sidebar-active-${variant}`}
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'var(--s2)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        exit={{ scaleY: 0 }}
                        className="absolute left-2 top-1 bottom-1 w-[3px] rounded-full"
                        style={{ background: 'var(--grad)' }}
                      />
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => navigate(item.id)}
                    className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group"
                    style={{ color: isActive ? 'var(--txt)' : 'var(--txt2)' }}
                  >
                    {Icon && (
                      <Icon
                        size={14}
                        style={{ color: isActive ? 'var(--blue)' : 'var(--txt2)' }}
                        className="shrink-0"
                      />
                    )}
                    <span className="text-[13px] font-medium flex-1">{t(`nav.${item.id}`) || item.label}</span>

                    {item.badge && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.5px]"
                        style={{ background: '#E0201A22', color: 'var(--coral)' }}
                      >
                        <span className="animate-pulse-dot inline-block mr-0.5">●</span>
                        {item.badge}
                      </span>
                    )}

                    {item.kbd && (
                      <kbd
                        className="text-[9px] px-1 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--s3)', color: 'var(--txt3)', border: '1px solid var(--border-subtle)' }}
                      >
                        {item.kbd}
                      </kbd>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t px-2 py-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <SysBtn icon={<Settings size={13} />} label={t('nav.settings')} onClick={() => goSys('/settings')} />
        <SysBtn icon={<HelpCircle size={13} />} label={t('nav.help')} onClick={() => goSys('/help')} />
        <div className="mobile-only">
          <SysBtn icon={<LogOut size={13} />} label={t('topbar.logout')} onClick={handleLogout} />
        </div>
      </div>

      <div
        className="mx-2 mb-2 px-3 py-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--s2)]"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: 'var(--grad)' }}
        >
          {(name || process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'FX').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--txt)' }}>
            {name || process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'Meu Workspace'}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--txt3)' }}>
            {role ? ROLE_LABELS[role] : '—'}
          </div>
        </div>
        <ChevronRight size={12} style={{ color: 'var(--txt3)' }} />
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: sidebar fixa (escondida no mobile via CSS) */}
      <div
        className="desktop-only flex flex-col shrink-0 border-r h-full overflow-hidden"
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--s1)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {panelContent('desktop')}
      </div>

      {/* Mobile: drawer com overlay (só renderiza quando aberto) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileNav}
              className="mobile-only fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="mobile-only fixed left-0 top-0 bottom-0 z-[70] flex flex-col border-r overflow-hidden"
              style={{
                width: 280,
                background: 'var(--s1)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {panelContent('mobile')}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SysBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors hover:bg-[var(--s2)]"
      style={{ color: 'var(--txt2)' }}
    >
      <span style={{ color: 'var(--txt3)' }}>{icon}</span>
      <span className="text-[12px]">{label}</span>
    </button>
  )
}
