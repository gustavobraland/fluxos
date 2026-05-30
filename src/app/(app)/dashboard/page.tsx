'use client'

import { usePipelineStore } from '@/store/usePipelineStore'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { PIPELINE_COLUMNS } from '@/lib/constants'
import { Plus, Zap, Radio, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'

const mono = 'JetBrains Mono, monospace'
const card: React.CSSProperties = {
  background: 'var(--s2)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 10,
  padding: '10px 12px',
}
const sectionLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.07em',
  color: 'var(--txt3)',
  textTransform: 'uppercase',
  marginBottom: 7,
}

const statusColors: Record<string, string> = {
  backlog: 'var(--txt3)',
  production: 'var(--blue)',
  review: 'var(--yellow)',
  ready: 'var(--green)',
  published: 'var(--txt2)',
}
// statusLabels are resolved dynamically via t() in the component

const SOCIAL_IDS = ['instagram', 'twitter', 'tiktok', 'youtube', 'facebook', 'linkedin']

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function DashboardPage() {
  const { tasks } = usePipelineStore()
  const { integrations } = useIntegrationsStore()
  const { t, locale } = useTranslation()
  const router = useRouter()

  const today = new Date().toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
  const workspaceName = process.env.NEXT_PUBLIC_WORKSPACE_NAME || 'Flux OS'

  // Metrics
  const countByStatus = (status: string) => tasks.filter(tk => tk.status === status).length
  const metrics = [
    { value: countByStatus('production'), label: t('dashboard.metrics.inProduction') },
    { value: countByStatus('review'),     label: t('dashboard.metrics.inReview')     },
    { value: countByStatus('ready'),      label: t('dashboard.metrics.ready')        },
    { value: countByStatus('published'),  label: t('dashboard.metrics.published')    },
  ]

  // Recent activity: 5 most recently created tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Pipeline bar chart
  const pipelineCounts = PIPELINE_COLUMNS.map(col => ({
    ...col,
    count: tasks.filter(t => t.status === col.id).length,
  }))
  const pipelineMax = Math.max(...pipelineCounts.map(s => s.count), 1)
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b.count, 0)

  // Deadlines: tasks with dueDate, sorted asc, max 5
  const deadlineTasks = [...tasks]
    .filter(t => !!t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  // Platforms: social media integrations only
  const socialIntegrations = integrations.filter(i => SOCIAL_IDS.includes(i.id))

  // Is a deadline urgent? (today or earlier)
  const todayStr = new Date().toISOString().slice(0, 10)
  const isUrgent = (dueDate: string) => dueDate <= todayStr

  // Format deadline date
  const formatDue = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <div style={{
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
      color: 'var(--txt)',
    }}>

      {/* ─ HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{workspaceName}</span>
        <span style={{ color: 'var(--txt3)', fontSize: 12 }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: mono }}>{today}</span>
        <div style={{ flex: 1 }} />
        {[
          { icon: <Plus size={10} />, label: t('dashboard.newTask'), color: 'var(--txt)', border: 'var(--border-subtle)', to: '/pipeline' },
          { icon: <Zap size={10} />,  label: t('dashboard.multipost'), color: 'var(--txt)', border: 'var(--border-subtle)', to: '/multipost' },
        ].map(b => (
          <button key={b.label} onClick={() => router.push(b.to)} style={{
            height: 26,
            padding: '0 10px',
            fontSize: 10,
            borderRadius: 6,
            border: `1px solid ${b.border}`,
            background: 'transparent',
            color: b.color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
          }}>
            {b.icon} {b.label}
          </button>
        ))}
        <button onClick={() => router.push('/warroom')} style={{
          height: 26,
          padding: '0 10px',
          fontSize: 10,
          borderRadius: 6,
          border: '1px solid rgba(240,123,84,.4)',
          background: 'transparent',
          color: 'var(--coral)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'inherit',
        }}>
          <Radio size={10} /> {t('dashboard.warRoom')}
        </button>
      </div>

      {/* ─ METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label} style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{
                fontSize: 20,
                fontWeight: 700,
                fontFamily: mono,
                color: 'var(--txt)',
                lineHeight: 1,
              }}>
                {m.value}
              </span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--txt2)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* ─ BODY GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: 10,
        flex: 1,
        minHeight: 0,
      }}>

        {/* LEFT — Atividade Recente */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <div style={sectionLabel}>{t('dashboard.recentActivity')}</div>
          {recentTasks.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '12px 0', textAlign: 'center' }}>
              {t('dashboard.noActivity')}
            </div>
          ) : recentTasks.map((task, i) => (
            <div key={task.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: `${statusColors[task.status] || 'var(--txt3)'}28`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 700,
                color: statusColors[task.status] || 'var(--txt3)',
                flexShrink: 0,
              }}>
                {task.type.slice(0, 2).toUpperCase()}
              </div>
              <span style={{
                flex: 1,
                fontSize: 11,
                color: 'var(--txt)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {task.title}
              </span>
              <span style={{
                fontSize: 8,
                padding: '1px 5px',
                borderRadius: 99,
                background: `${statusColors[task.status] || 'var(--txt3)'}22`,
                color: statusColors[task.status] || 'var(--txt3)',
                flexShrink: 0,
              }}>
                {t(`dashboard.status.${task.status}`) || task.status}
              </span>
              <span style={{
                fontSize: 9,
                color: 'var(--txt3)',
                fontFamily: mono,
                flexShrink: 0,
              }}>
                {relativeTime(task.createdAt)}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT — Pipeline + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Pipeline */}
          <div style={card}>
            <div style={sectionLabel}>{t('dashboard.pipeline')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {pipelineCounts.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 9, color: 'var(--txt2)', width: 58, flexShrink: 0 }}>
                    {s.label}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: 'var(--s4)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 4,
                      width: `${Math.round((s.count / pipelineMax) * 100)}%`,
                      background: s.color,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontFamily: mono,
                    color: 'var(--txt)',
                    width: 14,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 8,
              paddingTop: 6,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 9,
              fontFamily: mono,
              color: 'var(--txt3)',
            }}>
              {pipelineTotal} total
            </div>
          </div>

          {/* Quick Actions */}
          <div style={card}>
            <div style={sectionLabel}>{t('dashboard.quickActions')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { icon: <Zap size={10} />,       label: t('dashboard.multipostNow'), color: 'var(--coral)', to: '/multipost' },
                { icon: <Plus size={10} />,       label: t('dashboard.newTask'),      color: 'var(--txt)',   to: '/pipeline'  },
                { icon: <Radio size={10} />,      label: t('dashboard.warRoom'),      color: 'var(--coral)', to: '/warroom'   },
                { icon: <BarChart3 size={10} />,  label: t('dashboard.analytics'),    color: 'var(--blue)',  to: '/analytics' },
              ].map(b => (
                <button key={b.label} onClick={() => router.push(b.to)} style={{
                  height: 28,
                  width: '100%',
                  borderRadius: 7,
                  fontSize: 11,
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: b.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  fontFamily: 'inherit',
                }}>
                  {b.icon} {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─ BOTTOM ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 10 }}>

        {/* Deadlines */}
        <div style={card}>
          <div style={sectionLabel}>{t('dashboard.deadlines')}</div>
          {deadlineTasks.length === 0 ? (
            <div style={{
              fontSize: 11,
              color: 'var(--txt3)',
              padding: '10px 0',
              textAlign: 'center',
            }}>
              {t('dashboard.noDeadlines')}
            </div>
          ) : deadlineTasks.map((d, i) => (
            <div key={d.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '6px 0',
              borderBottom: i < deadlineTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{
                fontSize: 9,
                fontFamily: mono,
                color: isUrgent(d.dueDate!) ? 'var(--red)' : 'var(--blue)',
                fontWeight: 600,
                flexShrink: 0,
                width: 44,
              }}>
                {formatDue(d.dueDate!)}
              </span>
              <span style={{
                flex: 1,
                fontSize: 11,
                color: 'var(--txt)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {d.title}
              </span>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {d.platforms.slice(0, 2).map(p => (
                  <span key={p} style={{
                    fontSize: 8,
                    padding: '1px 4px',
                    borderRadius: 99,
                    background: 'var(--s4)',
                    color: 'var(--txt3)',
                    textTransform: 'capitalize',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Plataformas */}
        <div style={card}>
          <div style={sectionLabel}>{t('dashboard.platforms')}</div>
          {socialIntegrations.map((pl, i) => (
            <div key={pl.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 0',
              borderBottom: i < socialIntegrations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{pl.icon}</span>
              <span style={{ flex: 1, fontSize: 10, color: 'var(--txt)' }}>{pl.name}</span>
              {pl.connected ? (
                <span style={{
                  fontSize: 8,
                  padding: '1px 5px',
                  borderRadius: 99,
                  background: 'rgba(62,207,142,.15)',
                  color: 'var(--green)',
                  flexShrink: 0,
                  fontWeight: 600,
                }}>
                  {t('common.connected')}
                </span>
              ) : (
                <span style={{
                  fontSize: 8,
                  padding: '1px 5px',
                  borderRadius: 99,
                  background: 'var(--s4)',
                  color: 'var(--txt3)',
                  flexShrink: 0,
                }}>
                  {t('common.connect')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
