'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Lock, Workflow, CheckSquare, Sparkles, Trophy } from 'lucide-react'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import { usePromptsStore } from '@/store/usePromptsStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { computeInsights } from '@/lib/insights'
import { PlatformIcon, IntegrationIcon } from '@/components/ui/PlatformIcon'
import { useTranslation } from '@/hooks/useTranslation'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const SOCIAL_IDS = ['instagram', 'twitter', 'tiktok', 'youtube', 'facebook', 'linkedin']

const DATE_RANGE_IDS = ['7d', '30d', '90d'] as const

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const router = useRouter()
  const { integrations, connectInt, connecting } = useIntegrationsStore()
  const tasks = usePipelineStore((s) => s.tasks)
  const approvals = useApprovalsStore((s) => s.items)
  const prompts = usePromptsStore((s) => s.prompts)
  const events = useCalendarStore((s) => s.events)

  const ins = useMemo(
    () => computeInsights({ tasks, approvals, prompts, events }),
    [tasks, approvals, prompts, events]
  )

  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState('30d')

  const socialIntegrations = integrations.filter(i => SOCIAL_IDS.includes(i.id))
  const filteredIntegrations = platformFilter === 'all'
    ? socialIntegrations
    : socialIntegrations.filter(i => i.id === platformFilter)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        background: 'var(--s1)',
      }}>
        <BarChart3 size={16} style={{ color: 'var(--txt2)' }} />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
          {t('analytics.title')}
        </h1>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Date range filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {DATE_RANGE_IDS.map(id => (
            <button
              key={id}
              onClick={() => setDateRange(id)}
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 500,
                background: dateRange === id ? 'var(--blue)' : 'var(--s3)',
                color: dateRange === id ? '#000' : 'var(--txt2)',
                border: dateRange === id ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {t(`analytics.dateRanges.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Platform filter strip ── */}
      <div style={{
        padding: '8px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        background: 'var(--s1)',
        overflowX: 'auto',
      }}
        className="no-scrollbar"
      >
        <button
          onClick={() => setPlatformFilter('all')}
          style={{
            height: 28,
            padding: '0 14px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: platformFilter === 'all' ? 700 : 500,
            background: platformFilter === 'all' ? 'var(--blue)' : 'var(--s3)',
            color: platformFilter === 'all' ? '#000' : 'var(--txt2)',
            border: platformFilter === 'all' ? 'none' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {t('analytics.all')}
        </button>

        {SOCIAL_IDS.map(id => {
          const int = integrations.find(i => i.id === id)
          const active = platformFilter === id
          return (
            <button
              key={id}
              onClick={() => setPlatformFilter(active ? 'all' : id)}
              style={{
                height: 28,
                padding: '0 12px 0 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--s3)' : 'var(--s2)',
                color: active ? 'var(--txt)' : 'var(--txt2)',
                border: active ? '1px solid var(--border-mid)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
                flexShrink: 0,
                opacity: int?.connected ? 1 : 0.5,
              }}
            >
              <PlatformIcon id={id} size={12} />
              <span>{int?.name ?? id}</span>
              {int?.connected && (
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '40px 24px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}>

        {/* ── Produção interna — dados reais do app ── */}
        <div style={{ width: '100%', maxWidth: 960 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{t('analytics.internalProduction')}</h2>
            <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('analytics.realDataSub')}</span>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { icon: <Workflow size={14} />, label: t('analytics.inPipeline'), value: ins.pipelineTotal, sub: t('analytics.createdToday', { count: ins.createdToday }), color: 'var(--blue)' },
              { icon: <CheckSquare size={14} />, label: t('analytics.approvalsPending'), value: ins.approvals.pending, sub: t('analytics.approvalsApproved', { count: ins.approvals.approved }), color: 'var(--yellow)' },
              { icon: <Sparkles size={14} />, label: t('analytics.promptsUsed'), value: ins.prompts.uses, sub: t('analytics.promptsSaved', { count: ins.prompts.total }), color: '#A78BFA' },
              { icon: <Trophy size={14} />, label: t('analytics.matchesInCalendar'), value: ins.matches.total, sub: t('analytics.matchesUpcoming', { count: ins.matches.upcoming }), color: 'var(--green)' },
            ].map((c) => (
              <div key={c.label} style={{ background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.color, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--txt)', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 4 }}>{c.label}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* 7-day created + top prompts */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 10 }}>
            {/* 7-day bar chart */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                {t('analytics.tasksCreated7d')}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
                {ins.last7.map((d) => {
                  const max = Math.max(...ins.last7.map(x => x.count), 1)
                  const h = Math.round((d.count / max) * 88)
                  return (
                    <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--txt3)' }}>{d.count || ''}</span>
                      <div style={{
                        width: '70%', height: Math.max(h, 3), borderRadius: 6,
                        background: d.count ? 'var(--blue)' : 'var(--s3)', transition: 'height .2s',
                      }} />
                      <span style={{ fontSize: 9, color: 'var(--txt3)' }}>{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top prompts */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                {t('analytics.topPrompts')}
              </div>
              {ins.prompts.top.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '8px 0' }}>{t('analytics.noPromptsUsed')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ins.prompts.top.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--txt)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#A78BFA', background: 'rgba(167,139,250,.12)', borderRadius: 99, padding: '1px 8px', flexShrink: 0 }}>
                        {p.usageCount}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Divider into external metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('analytics.platformMetricsDivider')}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
        </div>

        {/* Hero empty state */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          maxWidth: 420,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--s2)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
          }}>
            <BarChart3 size={28} style={{ color: 'var(--txt3)' }} />
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>
            {t('analytics.awaitingData')}
          </div>

          <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
            {t('analytics.awaitingDataDesc')}
          </div>

          <button
            onClick={() => router.push('/integrations')}
            style={{
              marginTop: 4,
              height: 36,
              padding: '0 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--grad)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('analytics.connectPlatforms')}
          </button>
        </div>

        {/* Platform cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 200px)',
          gap: 12,
        }}>
          {filteredIntegrations.map(int => {
            const isConnecting = connecting === int.id
            return (
              <div
                key={int.id}
                style={{
                  background: 'var(--s1)',
                  border: int.connected
                    ? '1px solid rgba(62,207,142,.35)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  position: 'relative',
                  boxShadow: int.connected
                    ? '0 0 12px rgba(62,207,142,.08)'
                    : 'none',
                }}
              >
                {/* Lock icon on unconnected */}
                {!int.connected && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    opacity: 0.3,
                  }}>
                    <Lock size={13} />
                  </div>
                )}

                {/* Platform icon */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: int.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.85)',
                }}>
                  <IntegrationIcon id={int.id} size={22} />
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', textAlign: 'center' }}>
                  {int.name}
                </div>

                {int.connected ? (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--green)',
                    background: 'rgba(62,207,142,.12)',
                    padding: '3px 10px',
                    borderRadius: 99,
                  }}>
                    {t('analytics.connected')}
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      {t('analytics.awaitingConnection')}
                    </span>
                    <button
                      onClick={() => connectInt(int.id)}
                      disabled={isConnecting}
                      style={{
                        height: 28,
                        padding: '0 14px',
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'transparent',
                        color: 'var(--txt2)',
                        border: '1px solid var(--border-mid)',
                        cursor: isConnecting ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: isConnecting ? 0.6 : 1,
                      }}
                    >
                      {isConnecting ? t('analytics.connecting') : t('analytics.connect')}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
