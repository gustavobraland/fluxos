'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Lock } from 'lucide-react'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { PlatformIcon, IntegrationIcon } from '@/components/ui/PlatformIcon'

const SOCIAL_IDS = ['instagram', 'twitter', 'tiktok', 'youtube', 'facebook', 'linkedin']

const DATE_RANGES = [
  { id: '7d',  label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const { integrations, connectInt, connecting } = useIntegrationsStore()

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
          Analytics
        </h1>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Date range filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {DATE_RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 500,
                background: dateRange === r.id ? 'var(--blue)' : 'var(--s3)',
                color: dateRange === r.id ? '#000' : 'var(--txt2)',
                border: dateRange === r.id ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
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
          Todos
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
            Aguardando dados de plataformas
          </div>

          <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
            Conecte suas plataformas de publicação para ver métricas reais de alcance,
            engajamento e crescimento.
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
            Conectar Plataformas →
          </button>
        </div>

        {/* Platform cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 200px)',
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
                    Conectado
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      Aguardando conexão
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
                      {isConnecting ? 'Conectando…' : 'Conectar'}
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
