'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { usePipelineStore } from '@/store/usePipelineStore'

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', timeline: 'Timeline', warroom: 'War Room',
  pipeline: 'Pipeline', calendar: 'Calendar', multipost: 'Multipost',
  assets: 'Assets', approvals: 'Aprovações', analytics: 'Analytics',
  integrations: 'Integrações',
}

export function StatusBar() {
  const pathname = usePathname()
  const activeView = pathname.replace('/', '')
  const { tasks } = usePipelineStore()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const inProgress = tasks.filter(t => !['published', 'backlog'].includes(t.status)).length
  const published = tasks.filter(t => t.status === 'published').length

  return (
    <div
      className="flex items-center px-4 gap-4 shrink-0 border-t select-none"
      style={{
        height: 'var(--statusbar-h)',
        background: 'var(--s1)',
        borderColor: 'var(--border-subtle)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10.5px',
        color: 'var(--txt3)',
      }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="animate-pulse-dot" style={{ color: 'var(--coral)' }}>●</span>
        <span style={{ color: 'var(--coral)', fontWeight: 500 }}>AO VIVO</span>
      </div>

      <Sep />

      {/* Workspace */}
      <span>{process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'Flux OS'}</span>

      <Sep />

      {/* Active view */}
      <span style={{ color: 'var(--txt2)' }}>{VIEW_LABELS[activeView] || activeView}</span>

      <Sep />

      {/* Tasks */}
      <span>{inProgress} em produção</span>

      <Sep />

      <span>{published} publicados hoje</span>

      {/* Push right */}
      <div className="flex-1" />

      {/* Clock */}
      <span style={{ color: 'var(--txt2)' }}>{time}</span>

      <Sep />

      <span>Flux OS v0.1</span>
    </div>
  )
}

function Sep() {
  return <span style={{ color: 'var(--txt3)', opacity: 0.4 }}>·</span>
}
