'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Download, Send, Zap, MousePointerClick } from 'lucide-react'
import { TeamLogo } from '@/components/timeline/TeamLogo'

export interface AssetCardItem {
  name: string
  logo: string
  sub?: string   // league / shortName line
}

interface TeamAssetCardProps {
  item: AssetCardItem
  warRoomActive: boolean
  onInsertMultipost: () => void
  onInsertWarRoom: () => void
  onCopy: () => void
  onDownload: () => void
}

export function TeamAssetCard({
  item, warRoomActive, onInsertMultipost, onInsertWarRoom, onCopy, onDownload,
}: TeamAssetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const act = (fn: () => void) => { fn(); setMenuOpen(false) }

  return (
    <div
      onMouseLeave={() => setMenuOpen(false)}
      style={{
        position: 'relative',
        background: 'var(--s1)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '14px 10px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        minHeight: 128,
      }}
      className="group"
    >
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TeamLogo src={item.logo} alt={item.name} size={48} />
      </div>

      <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--txt)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {item.sub && (
          <div style={{
            fontSize: 10, color: 'var(--txt3)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.sub}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{ display: 'flex', gap: 4, transition: 'opacity 0.15s', width: '100%' }}
      >
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            flex: 1, height: 24, borderRadius: 6, cursor: 'pointer',
            fontSize: 10, fontWeight: 600, color: 'var(--blue)',
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <MousePointerClick size={10} /> Usar
        </button>
        <button
          onClick={onCopy}
          title="Copiar URL"
          style={{
            width: 28, height: 24, borderRadius: 6, cursor: 'pointer',
            color: 'var(--txt2)', background: 'var(--s2)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Copy size={11} />
        </button>
      </div>

      {/* Destination popover */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 10,
              background: 'var(--s3)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <MenuRow icon={<Send size={11} />} label="Inserir no Multipost" onClick={() => act(onInsertMultipost)} />
            <MenuRow
              icon={<Zap size={11} />}
              label="Inserir no War Room"
              disabled={!warRoomActive}
              onClick={() => act(onInsertWarRoom)}
            />
            <MenuRow icon={<Copy size={11} />} label="Copiar URL" onClick={() => act(onCopy)} />
            <MenuRow icon={<Download size={11} />} label="Download" onClick={() => act(onDownload)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuRow({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', fontSize: 11, fontWeight: 500,
        color: disabled ? 'var(--txt3)' : 'var(--txt)',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, textAlign: 'left',
      }}
    >
      <span style={{ color: 'var(--txt2)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  )
}
