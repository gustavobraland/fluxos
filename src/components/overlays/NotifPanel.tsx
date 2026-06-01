'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

type Notif = { id: string; icon: typeof Bell; color: string; title: string; desc: string; time: string }

// Inicia sem notificações — preenchido por eventos reais do sistema.
const NOTIFS: Notif[] = []

export function NotifPanel() {
  const { notifOpen, closeNotif } = useAppStore()

  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={closeNotif}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed top-14 right-4 z-50 w-80 rounded-xl overflow-hidden shadow-2xl"
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--border-mid)',
              boxShadow: '0 16px 48px rgba(0,0,0,.5)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>Notificações</span>
              <div className="flex items-center gap-2">
                <button className="text-[11px]" style={{ color: 'var(--blue)' }}>Marcar lidas</button>
                <button onClick={closeNotif} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--s2)]" style={{ color: 'var(--txt3)' }}>
                  <X size={12} />
                </button>
              </div>
            </div>

            {NOTIFS.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell size={18} style={{ color: 'var(--txt3)', opacity: 0.5 }} />
                <span className="text-[12px] mt-2" style={{ color: 'var(--txt3)' }}>Nenhuma notificação</span>
              </div>
            )}

            <div className="divide-y" style={{ '--tw-divide-color': 'var(--border-subtle)' } as React.CSSProperties}>
              {NOTIFS.map((n, i) => {
                const Icon = n.icon
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--s2)] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: n.color + '22' }}>
                      <Icon size={13} style={{ color: n.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium" style={{ color: 'var(--txt)' }}>{n.title}</div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--txt2)' }}>{n.desc}</div>
                    </div>
                    <span className="text-[10px] shrink-0 mt-0.5" style={{ color: 'var(--txt3)' }}>{n.time}</span>
                  </motion.div>
                )
              })}
            </div>

            <div className="px-4 py-2.5 text-center border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button className="text-[11px]" style={{ color: 'var(--blue)' }}>Ver todas as notificações</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
