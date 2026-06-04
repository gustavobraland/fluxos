'use client'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Zap, Activity, KanbanSquare } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { roleCan, type Permission } from '@/lib/permissions'
import { useTranslation } from '@/hooks/useTranslation'

interface NavItem { id: string; icon: React.ElementType; permission: Permission | null }

const ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, permission: null },
  { id: 'warroom',   icon: Zap,             permission: 'warroom.open' },
  { id: 'timeline',  icon: Activity,        permission: 'warroom.open' },
  { id: 'pipeline',  icon: KanbanSquare,    permission: 'pipeline.view' },
]

// Barra de navegação fixa no rodapé — só mobile (escondida no desktop via CSS).
export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const role = useUserStore((s) => s.role)
  const { t } = useTranslation()

  const items = ITEMS.filter((i) => !role || i.permission == null || roleCan(role, i.permission))

  return (
    <nav
      className="mobile-only fixed left-0 right-0 bottom-0 z-50 flex items-stretch border-t pb-safe"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom))',
        background: 'var(--s1)',
        borderColor: 'var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === '/' + item.id
        const isWarRoom = item.id === 'warroom'
        return (
          <button
            key={item.id}
            onClick={() => router.push('/' + item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{ color: active ? 'var(--red)' : 'var(--txt3)' }}
          >
            <Icon size={20} style={{ color: active ? 'var(--red)' : (isWarRoom ? 'var(--red)' : 'var(--txt2)') }} />
            <span className="text-[10px] font-medium">{t(`nav.${item.id}`)}</span>
          </button>
        )
      })}
    </nav>
  )
}
