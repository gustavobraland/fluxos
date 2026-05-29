'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckSquare, Zap, Send } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const NOTIFS = [
  { id: '1', icon: CheckSquare, color: '#3ECF8E', title: 'Post aprovado', desc: 'Highlights rodada 8 foi aprovado por Carlos', time: '2min' },
  { id: '2', icon: Zap, color: '#F07B54', title: 'War Room ativo', desc: 'Flamengo x Botafogo — Minuto 34', time: '5min' },
  { id: '3', icon: Send, color: '#5BB8E8', title: 'Post publicado', desc: 'Carrossel de odds publicado no Instagram', time: '12min' },
  { id: '4', icon: Bell, color: '#F5C842', title: 'Revisão pendente', desc: 'Motion reel Copa do Brasil aguarda revisão', time: '1h' },
]

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
