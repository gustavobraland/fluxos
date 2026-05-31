'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Activity, Zap, KanbanSquare, CalendarDays, Send,
  FolderOpen, CheckSquare, BarChart3, Plug, Plus, CalendarPlus,
  Sparkles, Clock, Sun, Search, Scissors,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CMD_ACTIONS } from '@/lib/constants'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Activity, Zap, KanbanSquare, CalendarDays, Send,
  FolderOpen, CheckSquare, BarChart3, Plug, Plus, CalendarPlus,
  Sparkles, Clock, Sun, Search, Scissors,
}

export function CommandPalette() {
  const { cmdOpen, closeCmd, toggleAiBar, setTheme, theme } = useAppStore()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = CMD_ACTIONS.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  )
  const sections = [...new Set(filtered.map(a => a.section))]

  useEffect(() => {
    if (cmdOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [cmdOpen])

  useEffect(() => { setSelected(0) }, [query])

  const execute = (action: typeof CMD_ACTIONS[number]) => {
    if (action.view) {
      router.push('/' + action.view)
    } else if (action.action === 'toggleTheme') {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    } else if (action.action === 'newTask') {
      router.push('/pipeline')
      setTimeout(() => window.dispatchEvent(new CustomEvent('flux:newTask')), 200)
    } else if (action.action === 'aiCaption') {
      toggleAiBar()
    }
    closeCmd()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { if (filtered[selected]) execute(filtered[selected]) }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <AnimatePresence>
      {cmdOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeCmd}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--s1)', border: '1px solid var(--border-mid)', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}
          >
            <div className="flex items-center gap-3 px-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Search size={14} style={{ color: 'var(--txt3)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Buscar ação, view ou atalho…"
                className="flex-1 py-4 bg-transparent outline-none text-[14px]"
                style={{ color: 'var(--txt)' }}
              />
              <kbd className="text-[10px] px-2 py-1 rounded font-mono" style={{ background: 'var(--s2)', color: 'var(--txt3)', border: '1px solid var(--border-subtle)' }}>ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[13px]" style={{ color: 'var(--txt3)' }}>
                  Nenhum resultado para "{query}"
                </div>
              ) : (
                sections.map(section => {
                  const items = filtered.filter(a => a.section === section)
                  return (
                    <div key={section}>
                      <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: 'var(--txt3)' }}>
                        {section}
                      </div>
                      {items.map((action) => {
                        const globalIdx = filtered.indexOf(action)
                        const Icon = ICON_MAP[action.icon]
                        const isSelected = globalIdx === selected
                        return (
                          <button
                            key={action.name}
                            data-idx={globalIdx}
                            onClick={() => execute(action)}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                            style={{ background: isSelected ? 'var(--s2)' : 'transparent' }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: isSelected ? 'var(--b1)' : 'var(--s2)' }}>
                              {Icon
                                ? <Icon size={13} style={{ color: isSelected ? 'var(--blue)' : 'var(--txt2)' }} />
                                : <span className="text-[13px]">{action.icon}</span>}
                            </div>
                            <span className="flex-1 text-[13px] font-medium" style={{ color: isSelected ? 'var(--txt)' : 'var(--txt2)' }}>
                              {action.name}
                            </span>
                            {action.kbd && (
                              <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0" style={{ background: 'var(--s3)', color: 'var(--txt3)', border: '1px solid var(--border-subtle)' }}>
                                {action.kbd}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--txt3)' }}>
              <span>↑↓ navegar</span>
              <span>↵ executar</span>
              <span>ESC fechar</span>
              <div className="flex-1" />
              <span style={{ opacity: 0.5 }}>Flux OS</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
