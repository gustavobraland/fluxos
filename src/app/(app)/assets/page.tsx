'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Image, Video, FileText, Sliders,
  X, Copy, Tag, ExternalLink, Check, Zap,
  ChevronDown,
} from 'lucide-react'
import type { Asset } from '@/types'

type FilterType = 'Todos' | 'Imagens' | 'Vídeos' | 'Templates' | 'LUTs'
type TierFilter = 'all' | 'hot' | 'cold' | 'external'

const PROJECTS = [
  { id: 'todos',        label: 'Todos',           emoji: '📁', count: 12 },
  { id: 'flamengo',    label: 'Flamengo',         emoji: '🔴', count: 3  },
  { id: 'botafogo',    label: 'Botafogo',         emoji: '⚫', count: 1  },
  { id: 'libertadores',label: 'Libertadores',     emoji: '🏆', count: 2  },
  { id: 'copabrasil',  label: 'Copa do Brasil',   emoji: '🥇', count: 1  },
  { id: 'odds',        label: 'Odds Templates',   emoji: '💰', count: 2  },
  { id: 'motion',      label: 'Motion Graphics',  emoji: '🎬', count: 3  },
]

const mockAssets: Asset[] = [
  {
    id: '1',  name: 'Flamengo Escudo HD',       type: 'image',    tags: ['escudo', 'png', 'hd'],       folder: 'flamengo',
    emoji: '🔴', color: '#E8231D', createdAt: '2026-05-10',
    externalRef: 'gdrive://flamengo/escudo-hd.png', storageTier: 'hot',      creator: 'MR', mimeType: 'image/png',     project: 'Flamengo 2026',
  },
  {
    id: '2',  name: 'Uniforme 2026 Render',     type: 'image',    tags: ['uniforme', 'render', '3d'],  folder: 'flamengo',
    emoji: '🎽', color: '#B71C1C', createdAt: '2026-05-12',
    externalRef: 'gdrive://flamengo/uniforme-2026.png', storageTier: 'hot', creator: 'JP', mimeType: 'image/png',     project: 'Flamengo 2026',
  },
  {
    id: '3',  name: 'Gol Animado Template',     type: 'video',    tags: ['gol', 'motion', 'reel'],     folder: 'motion',
    emoji: '⚽', color: '#1A237E', createdAt: '2026-05-14',
    externalRef: 'dropbox://motion/gol-animado.mp4',    storageTier: 'cold', creator: 'LS', mimeType: 'video/mp4',     project: 'Motion Library',
  },
  {
    id: '4',  name: 'Odds Card v3',             type: 'template', tags: ['odds', 'card', 'igaming'],   folder: 'odds',
    emoji: '💰', color: '#1B5E20', createdAt: '2026-05-15',
    externalRef: 'gdrive://templates/odds-card-v3.psd', storageTier: 'hot',  creator: 'MR', mimeType: 'image/vnd.adobe.photoshop', project: 'iGaming Templates',
  },
  {
    id: '5',  name: 'Libertadores Trophy',      type: 'image',    tags: ['trophy', 'copa', 'png'],     folder: 'libertadores',
    emoji: '🏆', color: '#F57F17', createdAt: '2026-05-11',
    externalRef: 'nas://assets/libertadores/trophy.png', storageTier: 'external', creator: 'JP', mimeType: 'image/png', project: 'Libertadores',
  },
  {
    id: '6',  name: 'Botafogo Star Pack',       type: 'image',    tags: ['botafogo', 'estrela'],       folder: 'botafogo',
    emoji: '⭐', color: '#212121', createdAt: '2026-05-13',
    externalRef: 'gdrive://botafogo/star-pack.zip',     storageTier: 'cold', creator: 'AL', mimeType: 'application/zip', project: 'Botafogo 2026',
  },
  {
    id: '7',  name: 'Intro Logo Flamengo',      type: 'video',    tags: ['intro', 'logo', 'animado'],  folder: 'flamengo',
    emoji: '🎬', color: '#C62828', createdAt: '2026-05-16',
    externalRef: 'nas://motion/intro-flamengo.mov',     storageTier: 'external', creator: 'LS', mimeType: 'video/quicktime', project: 'Flamengo 2026',
  },
  {
    id: '8',  name: 'Copa do Brasil Badge',     type: 'image',    tags: ['copa', 'badge', 'vector'],   folder: 'copabrasil',
    emoji: '🥇', color: '#1565C0', createdAt: '2026-05-09',
    externalRef: 'gdrive://copabrasil/badge.svg',       storageTier: 'hot',  creator: 'MR', mimeType: 'image/svg+xml', project: 'Copa do Brasil',
  },
  {
    id: '9',  name: 'Story Odds Template',      type: 'template', tags: ['story', 'odds', 'vertical'], folder: 'odds',
    emoji: '📊', color: '#004D40', createdAt: '2026-05-17',
    externalRef: 'gdrive://templates/story-odds.psd',   storageTier: 'hot',  creator: 'JP', mimeType: 'image/vnd.adobe.photoshop', project: 'iGaming Templates',
  },
  {
    id: '10', name: 'Cinematic LUT Pack',       type: 'lut',      tags: ['lut', 'cinema', 'grade'],    folder: 'motion',
    emoji: '🎞️', color: '#37474F', createdAt: '2026-05-08',
    externalRef: 'nas://luts/cinematic-pack.zip',       storageTier: 'external', creator: 'AL', mimeType: 'application/zip', project: 'Motion Library',
  },
  {
    id: '11', name: 'Campeonato Frame',         type: 'template', tags: ['frame', 'campeonato'],       folder: 'libertadores',
    emoji: '🏅', color: '#4A148C', createdAt: '2026-05-18',
    externalRef: 'gdrive://libertadores/frame.psd',     storageTier: 'cold', creator: 'MR', mimeType: 'image/vnd.adobe.photoshop', project: 'Libertadores',
  },
  {
    id: '12', name: 'Transition Pack v2',       type: 'video',    tags: ['transition', 'motion'],      folder: 'motion',
    emoji: '✨', color: '#006064', createdAt: '2026-05-19',
    externalRef: 'nas://motion/transitions-v2.prproj',  storageTier: 'external', creator: 'LS', mimeType: 'application/octet-stream', project: 'Motion Library',
  },
]

const TYPE_FILTER_MAP: Record<FilterType, string[]> = {
  'Todos':     ['image', 'video', 'template', 'lut', 'font'],
  'Imagens':   ['image'],
  'Vídeos':    ['video'],
  'Templates': ['template'],
  'LUTs':      ['lut'],
}

const TYPE_COLORS: Record<string, string> = {
  image:    'var(--blue)',
  video:    'var(--coral)',
  template: 'var(--green)',
  lut:      'var(--orange)',
  font:     'var(--yellow)',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  image:    Image,
  video:    Video,
  template: FileText,
  lut:      Sliders,
}

const TYPE_LABELS: Record<string, string> = {
  image: 'IMG', video: 'VID', template: 'TPL', lut: 'LUT', font: 'FNT',
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hot:      { label: 'Hot',      color: 'var(--coral)',  bg: 'rgba(240,123,84,0.12)'  },
  cold:     { label: 'Cold',     color: 'var(--blue)',   bg: 'rgba(91,184,232,0.12)'  },
  external: { label: 'Ext',      color: 'var(--txt3)',   bg: 'rgba(120,120,160,0.12)' },
}

const mono = 'JetBrains Mono, monospace'

export default function AssetsPage() {
  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos')
  const [activeFolder, setActiveFolder] = useState('todos')
  const [tierFilter, setTierFilter]     = useState<TierFilter>('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [copiedId, setCopiedId]         = useState<string | null>(null)

  const filters: FilterType[] = ['Todos', 'Imagens', 'Vídeos', 'Templates', 'LUTs']

  const visible = mockAssets.filter((a) => {
    const matchFolder = activeFolder === 'todos' || a.folder === activeFolder
    const matchType   = TYPE_FILTER_MAP[activeFilter].includes(a.type)
    const matchTier   = tierFilter === 'all' || a.storageTier === tierFilter
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.includes(search.toLowerCase())) ||
      (a.project || '').toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchType && matchTier && matchSearch
  })

  const handleCopyRef = (asset: Asset, e?: React.MouseEvent) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(asset.externalRef || asset.id).catch(() => {})
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <div style={{ display: 'flex', height: '100%', color: 'var(--txt)', overflow: 'hidden' }}>

      {/* ─ SIDEBAR ──────────────────────────────────────────── */}
      <div style={{
        width: 188,
        flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        background: 'var(--s1)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 8 }}>
          Projetos
        </div>
        {PROJECTS.map((f) => {
          const active = activeFolder === f.id
          return (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 6,
                border: 'none',
                background: active ? 'var(--s3)' : 'transparent',
                color: active ? 'var(--txt)' : 'var(--txt2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 11, fontWeight: active ? 600 : 400,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 12 }}>{f.emoji}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
              <span style={{ fontSize: 9, fontFamily: mono, color: 'var(--txt3)', flexShrink: 0 }}>{f.count}</span>
            </button>
          )
        })}

        {/* Storage tier filter */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 8 }}>
            Storage Tier
          </div>
          {(['all', 'hot', 'cold', 'external'] as TierFilter[]).map(t => {
            const active = tierFilter === t
            const cfg = t === 'all' ? { label: 'Todos', color: 'var(--txt2)', bg: '' } : TIER_CONFIG[t]
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  width: '100%', padding: '4px 8px', borderRadius: 6,
                  border: 'none',
                  background: active ? 'var(--s3)' : 'transparent',
                  color: active ? (t === 'all' ? 'var(--txt)' : cfg.color) : 'var(--txt2)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: t === 'all' ? 'var(--txt3)' : cfg.color,
                }} />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─ MAIN ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          background: 'var(--s1)',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--s3)', border: '1px solid var(--border-subtle)',
            borderRadius: 7, padding: '5px 9px', flex: 1, maxWidth: 280,
          }}>
            <Search size={11} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, tag, projeto..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 11, color: 'var(--txt)', width: '100%',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={11} />
              </button>
            )}
          </div>

          {/* Type filters */}
          <div style={{ display: 'flex', gap: 4 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  height: 26, padding: '0 10px', borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  background: activeFilter === f ? 'var(--s4)' : 'transparent',
                  color: activeFilter === f ? 'var(--txt)' : 'var(--txt2)',
                  cursor: 'pointer', fontSize: 10, fontWeight: activeFilter === f ? 600 : 400,
                  fontFamily: 'inherit',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Stats */}
          <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: mono }}>
            {visible.length}/{mockAssets.length} assets
          </span>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 130px 50px 60px 160px 120px',
          padding: '4px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          background: 'var(--bg)',
        }}>
          {['', 'Nome', 'Projeto', 'Criador', 'Tier', 'Tags', 'Ações'].map((col, i) => (
            <div key={col + i} style={{
              fontSize: 9, fontWeight: 700, color: 'var(--txt3)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {col}{col === 'Nome' && <ChevronDown size={8} />}
            </div>
          ))}
        </div>

        {/* Asset rows + detail panel */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {visible.length === 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 120, fontSize: 12, color: 'var(--txt3)',
              }}>
                Nenhum asset encontrado
              </div>
            ) : visible.map((asset, i) => {
              const TypeIcon = TYPE_ICONS[asset.type] || FileText
              const typeColor = TYPE_COLORS[asset.type]
              const tier = asset.storageTier ? TIER_CONFIG[asset.storageTier] : TIER_CONFIG.hot
              const isSelected = selectedAsset?.id === asset.id
              const isCopied = copiedId === asset.id

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(isSelected ? null : asset)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 130px 50px 60px 160px 120px',
                    padding: '0 12px',
                    height: 36,
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--s3)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: `${typeColor}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TypeIcon size={10} style={{ color: typeColor }} />
                  </div>

                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', paddingRight: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{asset.emoji}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 11, fontWeight: 500, color: 'var(--txt)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {asset.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: mono }}>
                        {TYPE_LABELS[asset.type]} · {asset.mimeType?.split('/')[1]?.toUpperCase() ?? '—'}
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <span style={{
                    fontSize: 10, color: 'var(--txt2)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {asset.project ?? asset.folder}
                  </span>

                  {/* Creator */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `${asset.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: asset.color,
                  }}>
                    {asset.creator ?? '—'}
                  </div>

                  {/* Storage Tier */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 6px', borderRadius: 99,
                    background: tier.bg, color: tier.color,
                    fontSize: 9, fontWeight: 700, width: 'fit-content',
                  }}>
                    {tier.label}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 3, overflow: 'hidden' }}>
                    {asset.tags.slice(0, 3).map(t => (
                      <span key={t} style={{
                        fontSize: 8, padding: '1px 5px', borderRadius: 99,
                        background: 'var(--s4)', color: 'var(--txt3)',
                        whiteSpace: 'nowrap',
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', gap: 5, alignItems: 'center' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={e => handleCopyRef(asset, e)}
                      title={asset.externalRef}
                      style={{
                        height: 22, padding: '0 8px', borderRadius: 5,
                        border: '1px solid var(--border-subtle)',
                        background: isCopied ? 'rgba(62,207,142,0.12)' : 'transparent',
                        color: isCopied ? 'var(--green)' : 'var(--txt2)',
                        cursor: 'pointer', fontSize: 9,
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'inherit', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isCopied ? <Check size={9} /> : <Copy size={9} />}
                      {isCopied ? 'Copiado' : 'Copy Ref'}
                    </button>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        height: 22, padding: '0 8px', borderRadius: 5,
                        border: 'none',
                        background: 'rgba(91,184,232,0.12)',
                        color: 'var(--blue)',
                        cursor: 'pointer', fontSize: 9,
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'inherit', flexShrink: 0,
                      }}
                    >
                      <Zap size={9} /> Usar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ─ DETAIL PANEL ─────────────────────────────────── */}
          <AnimatePresence>
            {selectedAsset && (
              <motion.div
                key={selectedAsset.id}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                style={{
                  width: 292,
                  flexShrink: 0,
                  borderLeft: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--s1)',
                  overflowY: 'auto',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Referência</span>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      border: 'none', background: 'var(--s3)',
                      color: 'var(--txt2)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>

                {/* Preview thumbnail area */}
                <div style={{
                  height: 140,
                  background: `linear-gradient(135deg, ${selectedAsset.color}33 0%, ${selectedAsset.color}11 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 56 }}>{selectedAsset.emoji}</span>
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px', flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--txt)' }}>
                    {selectedAsset.name}
                  </div>

                  {/* External Ref — primary field */}
                  <div style={{
                    background: 'var(--s3)', borderRadius: 7,
                    padding: '8px 10px', marginBottom: 12,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                      External Ref
                    </div>
                    <div style={{
                      fontSize: 10, fontFamily: mono, color: 'var(--txt2)',
                      wordBreak: 'break-all', lineHeight: 1.5,
                    }}>
                      {selectedAsset.externalRef ?? '—'}
                    </div>
                    <button
                      onClick={() => handleCopyRef(selectedAsset)}
                      style={{
                        marginTop: 8, height: 24, width: '100%',
                        borderRadius: 5, border: '1px solid var(--border-subtle)',
                        background: copiedId === selectedAsset.id ? 'rgba(62,207,142,0.12)' : 'transparent',
                        color: copiedId === selectedAsset.id ? 'var(--green)' : 'var(--txt2)',
                        cursor: 'pointer', fontSize: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {copiedId === selectedAsset.id ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === selectedAsset.id ? 'Referência copiada!' : 'Copiar referência'}
                    </button>
                  </div>

                  {/* Meta rows */}
                  {[
                    { label: 'Projeto',   value: selectedAsset.project ?? selectedAsset.folder },
                    { label: 'Criador',   value: selectedAsset.creator ?? '—' },
                    { label: 'Tipo',      value: TYPE_LABELS[selectedAsset.type] },
                    { label: 'MIME',      value: selectedAsset.mimeType ?? '—' },
                    { label: 'Adicionado',value: selectedAsset.createdAt },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '5px 0', borderBottom: '1px solid var(--border-subtle)',
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{label}</span>
                      <span style={{ fontSize: 10, fontFamily: mono, color: 'var(--txt2)' }}>{value}</span>
                    </div>
                  ))}

                  {/* Storage tier badge */}
                  {selectedAsset.storageTier && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--txt3)' }}>Storage</span>
                      <div style={{ marginLeft: 'auto' }}>
                        <span style={{
                          fontSize: 9, padding: '2px 8px', borderRadius: 99,
                          background: TIER_CONFIG[selectedAsset.storageTier].bg,
                          color: TIER_CONFIG[selectedAsset.storageTier].color,
                          fontWeight: 700,
                        }}>
                          {TIER_CONFIG[selectedAsset.storageTier].label} Cache
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: 'var(--txt3)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6,
                    }}>
                      <Tag size={9} /> Tags
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedAsset.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99,
                          background: 'var(--s4)', color: 'var(--txt2)',
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div style={{
                  padding: '10px 14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex', gap: 7,
                }}>
                  <button style={{
                    flex: 1, height: 30, borderRadius: 7,
                    border: 'none', background: 'var(--blue)',
                    color: '#fff', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontFamily: 'inherit',
                  }}>
                    <Zap size={11} /> Usar no Multipost
                  </button>
                  <a
                    href={selectedAsset.externalRef}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 30, height: 30, borderRadius: 7,
                      border: '1px solid var(--border-mid)',
                      background: 'var(--s3)', color: 'var(--txt2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    title="Abrir no storage externo"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
