'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, Zap, Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const DOCK_ITEMS = [
  { icon: Command, label: 'Command Palette (⌘K)', action: 'cmd' },
  { icon: null,    label: 'AI Flux (⌘I)',          action: 'ai', isAI: true },
  { icon: Zap,     label: 'War Room',              action: 'warroom' },
]

export function QuickDock() {
  const { toggleCmd, toggleAiBar } = useAppStore()
  const router = useRouter()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const handleAction = (action: string) => {
    if (action === 'cmd') toggleCmd()
    else if (action === 'ai') toggleAiBar()
    else if (action === 'warroom') router.push('/warroom')
    else if (action === 'newTask') {
      router.push('/pipeline')
      setTimeout(() => window.dispatchEvent(new CustomEvent('flux:newTask')), 200)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {DOCK_ITEMS.map((item, idx) => {
        const Icon = item.icon
        return (
          <div key={item.action} className="relative flex items-center gap-2">
            <AnimatePresence>
              {hoveredIdx === idx && (
                <motion.div
                  initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none"
                  style={{ background: 'var(--s2)', color: 'var(--txt)', border: '1px solid var(--border-subtle)' }}
                >
                  {item.label}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => handleAction(item.action)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--s2)', border: '1px solid var(--border-mid)', color: 'var(--txt2)' }}
            >
              {item.isAI
                ? <span className="text-[14px] font-bold grad-text">✦</span>
                : Icon ? <Icon size={14} /> : null}
            </button>
          </div>
        )
      })}

      {/* Primary — Nova Task */}
      <div className="relative flex items-center gap-2">
        <AnimatePresence>
          {hoveredIdx === 99 && (
            <motion.div
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.12 }}
              className="absolute right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none"
              style={{ background: 'var(--s2)', color: 'var(--txt)', border: '1px solid var(--border-subtle)' }}
            >
              Nova Task (N T)
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => handleAction('newTask')}
          onMouseEnter={() => setHoveredIdx(99)}
          onMouseLeave={() => setHoveredIdx(null)}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg"
          style={{ background: 'var(--grad)', boxShadow: '0 8px 24px rgba(37,99,235,.3)' }}
        >
          <Plus size={18} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  )
}
