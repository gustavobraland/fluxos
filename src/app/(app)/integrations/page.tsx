'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Plug } from 'lucide-react'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { INTEGRATION_CATEGORIES, INTEGRATIONS } from '@/lib/constants'
import { IntegrationIcon } from '@/components/ui/PlatformIcon'
import type { IntegrationCategory } from '@/types'

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 13,
        height: 13,
        border: '2px solid var(--border-mid)',
        borderTopColor: 'var(--blue)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Integration Card ─────────────────────────────────────────────────────────

interface CardProps {
  id: string
  name: string
  desc: string
  icon: string
  bg: string
  connected: boolean
  handle: string
  isConnecting: boolean
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

function IntegrationCard({
  id, name, desc, icon, bg, connected, handle, isConnecting, onConnect, onDisconnect,
}: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      style={{
        background: 'var(--s1)',
        border: `1px solid ${connected ? 'rgba(62,207,142,0.2)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: connected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
        }}
      >
        <IntegrationIcon id={id} size={20} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--txt2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {desc}
        </div>
        {connected && handle && (
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>{handle}</div>
        )}
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {isConnecting ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--blue)',
            }}
          >
            <Spinner />
            <span>Conectando…</span>
          </div>
        ) : connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Conectado</span>
            </div>
            <button
              onClick={() => onDisconnect(id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--red)',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'Sora, sans-serif',
                padding: '2px 4px',
                textDecoration: 'underline',
              }}
            >
              Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={() => onConnect(id)}
            style={{
              background: 'transparent',
              border: '1px solid var(--blue)',
              color: 'var(--blue)',
              borderRadius: 7,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Sora, sans-serif',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91,184,232,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Conectar
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type CategoryFilter = 'Todos' | IntegrationCategory

export default function IntegrationsPage() {
  const { integrations, connecting, connectInt, disconnectInt } = useIntegrationsStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Todos')

  const connectedCount = integrations.filter((i) => i.connected).length

  const filtered = useMemo(() => {
    return integrations.filter((int) => {
      const matchCategory = activeCategory === 'Todos' || int.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch = !q || int.name.toLowerCase().includes(q) || int.desc.toLowerCase().includes(q)
      return matchCategory && matchSearch
    })
  }, [integrations, activeCategory, search])

  async function handleConnect(id: string) {
    await connectInt(id)
    const int = integrations.find((i) => i.id === id)
    toast.success(`${int?.name ?? id} conectado com sucesso!`)
  }

  function handleDisconnect(id: string) {
    disconnectInt(id)
    const int = integrations.find((i) => i.id === id)
    toast(`${int?.name ?? id} desconectado.`)
  }

  const categories: CategoryFilter[] = ['Todos', ...INTEGRATION_CATEGORIES]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          background: 'var(--s1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plug size={16} style={{ color: 'var(--txt2)' }} />
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
            Integrações
          </h1>
          <span
            style={{
              background: connectedCount > 0 ? 'rgba(62,207,142,0.15)' : 'var(--s3)',
              color: connectedCount > 0 ? 'var(--green)' : 'var(--txt2)',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 99,
            }}
          >
            {connectedCount} conectadas
          </span>
        </div>

        {/* Search */}
        <div
          style={{
            marginLeft: 'auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              color: 'var(--txt3)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar integração…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--s3)',
              border: '1px solid var(--border-mid)',
              borderRadius: 8,
              padding: '6px 12px 6px 30px',
              fontSize: 12,
              color: 'var(--txt)',
              fontFamily: 'Sora, sans-serif',
              outline: 'none',
              width: 220,
            }}
          />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div
        style={{
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          flexShrink: 0,
          background: 'var(--s1)',
        }}
        className="no-scrollbar"
      >
        {categories.map((cat) => {
          const active = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: active ? 'var(--blue)' : 'var(--s3)',
                color: active ? '#000' : 'var(--txt2)',
                border: active ? 'none' : '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Sora, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--txt2)',
              padding: '60px 0',
              fontSize: 14,
            }}
          >
            Nenhuma integração encontrada para "{search}"
          </div>
        ) : (
          <motion.div
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((int) => (
                <IntegrationCard
                  key={int.id}
                  id={int.id}
                  name={int.name}
                  desc={int.desc}
                  icon={int.icon}
                  bg={int.bg}
                  connected={int.connected}
                  handle={int.handle}
                  isConnecting={connecting === int.id}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
