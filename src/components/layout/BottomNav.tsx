'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Send, KanbanSquare, Activity, Zap, Plus, Upload, ClipboardList, FilePlus } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { roleCan, type Permission } from '@/lib/permissions'
import { useTranslation } from '@/hooks/useTranslation'
import { BottomSheet } from '@/components/mobile/BottomSheet'

interface Item { id: string; icon: React.ElementType; permission: Permission | null }

// Ordem por frequência de uso, com o botão + no centro.
// Calendar/Dashboard/etc. ficam só no drawer lateral.
const LEFT: Item[] = [
  { id: 'pipeline', icon: KanbanSquare, permission: 'pipeline.view' },
  { id: 'timeline', icon: Activity,     permission: 'warroom.open' },
]
const RIGHT: Item[] = [
  { id: 'warroom',   icon: Zap,  permission: 'warroom.open' },
  { id: 'multipost', icon: Send, permission: 'multipost.upload' },
]

// Barra de navegação fixa no rodapé — só mobile (escondida no desktop via CSS).
export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const role = useUserStore((s) => s.role)
  const liveCount = useWarRoomStore((s) => s.activeFixtures.length)
  const isPolling = useWarRoomStore((s) => s.isPolling)
  const hasLiveGame = liveCount > 0 && isPolling
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)

  const can = (p: Permission | null) => !role || p == null || roleCan(role, p)
  const runAction = (fn: () => void) => { setSheetOpen(false); fn() }

  const actions = [
    { label: 'Nova Task', icon: <KanbanSquare size={18} />, perm: 'pipeline.view' as Permission,
      run: () => { router.push('/pipeline'); setTimeout(() => window.dispatchEvent(new CustomEvent('flux:newTask')), 250) } },
    { label: 'Upload de arte', icon: <Upload size={18} />, perm: 'multipost.upload' as Permission,
      run: () => router.push('/multipost') },
    { label: 'Relatório diário', icon: <ClipboardList size={18} />, perm: null,
      run: () => router.push('/reports') },
    { label: 'Novo briefing', icon: <FilePlus size={18} />, perm: 'briefing.create' as Permission,
      run: () => { router.push('/pipeline'); setTimeout(() => window.dispatchEvent(new CustomEvent('flux:newTask')), 250) } },
  ].filter((a) => can(a.perm))

  const Tab = ({ item }: { item: Item }) => {
    const Icon = item.icon
    const active = pathname === '/' + item.id
    // War Room só fica vermelho pulsando quando há jogo AO VIVO (independe de seleção).
    const live = item.id === 'warroom' && hasLiveGame
    const iconColor = live ? 'var(--red)' : active ? 'var(--red)' : 'var(--txt2)'
    return (
      <button
        onClick={() => router.push('/' + item.id)}
        className="flex-1 flex flex-col items-center justify-center gap-1"
        style={{ color: active || live ? 'var(--red)' : 'var(--txt3)' }}
      >
        <span className={live ? 'animate-pulse' : ''} style={{ display: 'flex' }}>
          <Icon size={20} style={{ color: iconColor }} />
        </span>
        <span className="text-[10px] font-medium">{t(`nav.${item.id}`)}</span>
      </button>
    )
  }

  return (
    <>
      <nav
        className="mobile-only fixed left-0 right-0 bottom-0 z-50 flex items-stretch border-t"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--s1)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {LEFT.filter((i) => can(i.permission)).map((i) => <Tab key={i.id} item={i} />)}

        {/* Botão central de ação rápida */}
        <div className="flex-1 flex items-start justify-center" style={{ position: 'relative' }}>
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Ações rápidas"
            style={{
              position: 'absolute', top: -18, width: 56, height: 56, borderRadius: '50%',
              background: '#E0201A', color: '#fff', border: '4px solid var(--bg)',
              boxShadow: '0 6px 18px rgba(224,32,26,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={26} />
          </button>
        </div>

        {RIGHT.filter((i) => can(i.permission)).map((i) => <Tab key={i.id} item={i} />)}
      </nav>

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Ações rápidas">
        <div className="flex flex-col gap-2 pb-3">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => runAction(a.run)}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left"
              style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
            >
              <span style={{ color: 'var(--red)' }}>{a.icon}</span>
              <span className="text-[14px] font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
