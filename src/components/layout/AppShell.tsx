'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster } from 'sonner'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { BottomNav } from './BottomNav'
import { CommandPalette } from '@/components/overlays/CommandPalette'
import { AIBar } from '@/components/overlays/AIBar'
import { QuickDock } from '@/components/overlays/QuickDock'
import { NotifPanel } from '@/components/overlays/NotifPanel'
import { useAppStore } from '@/store/useAppStore'
import type { ViewId } from '@/types'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, setView, cmdOpen, aiBarOpen, closeCmd, closeAiBar, closeNotif, toggleCmd, toggleAiBar } = useAppStore()
  const pathname = usePathname()
  const router = useRouter()

  // Sync theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('flux-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  // Sync theme attr
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Sync activeView store from URL
  useEffect(() => {
    const view = pathname.replace('/', '') as ViewId
    if (view) setView(view)
  }, [pathname])

  // Global keyboard shortcuts
  useEffect(() => {
    let g = false
    let n = false
    let timer: NodeJS.Timeout

    const reset = () => { g = false; n = false }
    const startTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(reset, 600)
    }

    const go = (path: string) => { router.push(path); reset() }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const isInput = ['input', 'textarea', 'select'].includes(tag) ||
        (e.target as HTMLElement).contentEditable === 'true'

      // ESC — close overlays
      if (e.key === 'Escape') {
        if (cmdOpen) closeCmd()
        else if (aiBarOpen) closeAiBar()
        else closeNotif()
        reset()
        return
      }

      // ⌘K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); toggleCmd(); return
      }
      // ⌘I
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault(); toggleAiBar(); return
      }

      if (isInput) return

      // G chord
      if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'g') {
        g = true; n = false; startTimer(); return
      }
      if (g) {
        const map: Record<string, string> = {
          d: '/dashboard', t: '/timeline', w: '/warroom',
          p: '/pipeline',  c: '/calendar', m: '/multipost', a: '/assets',
        }
        if (map[e.key.toLowerCase()]) { go(map[e.key.toLowerCase()]); return }
        reset()
      }

      // N chord
      if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'n') {
        n = true; g = false; startTimer(); return
      }
      if (n) {
        if (e.key.toLowerCase() === 't') {
          router.push('/pipeline')
          setTimeout(() => window.dispatchEvent(new CustomEvent('flux:newTask')), 200)
        }
        if (e.key.toLowerCase() === 'p') {
          router.push('/multipost')
        }
        reset()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer) }
  }, [cmdOpen, aiBarOpen, router, closeCmd, closeAiBar, closeNotif, toggleCmd, toggleAiBar])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--txt)' }}
    >
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          key={pathname}
          className="app-main flex-1 overflow-hidden flex flex-col animate-view-enter"
          style={{ background: 'var(--bg)' }}
        >
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      <div className="desktop-only">
        <StatusBar />
      </div>
      <BottomNav />

      <CommandPalette />
      <AIBar />
      <QuickDock />
      <NotifPanel />

      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          style: {
            background: 'var(--s2)',
            border: '1px solid var(--border-mid)',
            color: 'var(--txt)',
            fontFamily: 'Sora, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
