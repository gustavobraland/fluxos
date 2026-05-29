'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Hash, CheckCircle2, Loader2, Zap, Radio, Laugh, Camera, Lock } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { FootballContextBanner } from '@/components/multipost/FootballContextBanner'
import { toast } from 'sonner'
import { useFootballStore } from '@/store/useFootballStore'
import { useAppStore } from '@/store/useAppStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import type { PlatformId } from '@/types'

const PLATFORM_DEFS = [
  { id: 'instagram', name: 'IG',        icon: '📸', color: '#E1306C', limit: 2200  },
  { id: 'twitter',   name: 'X',         icon: '𝕏',  color: '#000000', limit: 280   },
  { id: 'tiktok',    name: 'TT',        icon: '🎵', color: '#010101', limit: 2200  },
  { id: 'linkedin',  name: 'LI',        icon: '💼', color: '#0077B5', limit: 3000  },
  { id: 'facebook',  name: 'FB',        icon: '📘', color: '#1877F2', limit: 63206 },
  { id: 'telegram',  name: 'TG',        icon: '✈️', color: '#229ED9', limit: 4096  },
]

// Populated when AI integration is connected
const AI_SUGGESTIONS: string[] = []

const DISTRIBUTION_PRESETS = [
  {
    id: 'breaking',
    iconId: 'radio' as const,
    label: 'Breaking',
    desc: 'Máximo alcance',
    platforms: ['instagram', 'twitter', 'linkedin', 'telegram'],
    captionHint: '[URGENTE] ',
    gradient: 'linear-gradient(135deg,rgba(240,123,84,.18),rgba(245,100,66,.08))',
    border: 'rgba(240,123,84,.4)',
    color: '#F07B54',
  },
  {
    id: 'meme',
    iconId: 'laugh' as const,
    label: 'Meme Push',
    desc: 'Virais rápidos',
    platforms: ['instagram', 'twitter', 'tiktok'],
    captionHint: '',
    gradient: 'linear-gradient(135deg,rgba(167,139,250,.18),rgba(91,184,232,.08))',
    border: 'rgba(167,139,250,.4)',
    color: '#A78BFA',
  },
  {
    id: 'twitter',
    iconId: 'x' as const,
    label: 'Heavy X',
    desc: '280 chars',
    platforms: ['twitter'],
    captionHint: '',
    gradient: 'linear-gradient(135deg,rgba(91,184,232,.18),rgba(62,207,142,.08))',
    border: 'rgba(91,184,232,.4)',
    color: '#5BB8E8',
  },
  {
    id: 'ig',
    iconId: 'camera' as const,
    label: 'IG First',
    desc: 'Instagram first',
    platforms: ['instagram'],
    captionHint: '',
    gradient: 'linear-gradient(135deg,rgba(224,48,108,.18),rgba(245,160,64,.08))',
    border: 'rgba(224,48,108,.4)',
    color: '#E1306C',
  },
]

function PresetIcon({ id, size = 13 }: { id: string; size?: number }) {
  switch (id) {
    case 'radio':  return <Radio size={size} />
    case 'laugh':  return <Laugh size={size} />
    case 'x':      return <PlatformIcon id="twitter" size={size} />
    case 'camera': return <Camera size={size} />
    default:       return <Zap size={size} />
  }
}

export default function MultipostPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'twitter'])
  const [caption, setCaption] = useState('')
  const [previewPlatform, setPreviewPlatform] = useState('instagram')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const { contentQueue, updateQueueItemStatus } = useFootballStore()
  const { activeQueueItem, clearActiveQueueItem } = useAppStore()
  const { addTask } = usePipelineStore()
  const { integrations } = useIntegrationsStore()

  // Pre-fill caption + platforms when navigated from War Room queue
  useEffect(() => {
    if (!activeQueueItem) return
    setCaption(activeQueueItem.caption + '\n\n' + activeQueueItem.hashtags.join(' '))
    const validPlatforms = activeQueueItem.platforms.filter(id =>
      PLATFORM_DEFS.find(p => p.id === id)
    )
    if (validPlatforms.length > 0) {
      setSelectedPlatforms(validPlatforms)
      setPreviewPlatform(validPlatforms[0])
    }
    setActivePreset(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQueueItem?.id])

  // Compute connected state from real integration store
  const PLATFORMS = PLATFORM_DEFS.map(p => ({
    ...p,
    connected: integrations.find(i => i.id === p.id)?.connected ?? false,
  }))

  const activePlatform = PLATFORMS.find(p => p.id === previewPlatform)
  const charLimit = activePlatform?.limit || 2200
  const charCount = caption.length
  const charOver = charCount > charLimit

  const applyPreset = (preset: typeof DISTRIBUTION_PRESETS[number]) => {
    if (activePreset === preset.id) {
      setActivePreset(null)
      return
    }
    setActivePreset(preset.id)
    const connected = preset.platforms.filter(id =>
      PLATFORMS.find(p => p.id === id && p.connected)
    )
    setSelectedPlatforms(connected)
    if (connected.length > 0) setPreviewPlatform(connected[0])
    if (preset.captionHint && !caption.startsWith(preset.captionHint)) {
      setCaption(preset.captionHint + caption)
    }
    toast.success(t('multipost.toast.presetApplied', { name: preset.label }))
  }

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
    if (!selectedPlatforms.includes(id)) setPreviewPlatform(id)
  }

  const generateAI = async () => {
    // Check if an AI integration is connected
    const aiConnected = integrations.some(
      i => (i.id === 'openai' || i.id === 'claude') && i.connected
    )
    if (!aiConnected) {
      toast.error(t('multipost.toast.aiConnectRequired'))
      return
    }
    setAiLoading(true)
    await new Promise(r => setTimeout(r, 1100))
    // Real caption generation is future work — placeholder
    setCaption('')
    setAiLoading(false)
    toast.success(t('multipost.toast.aiReady'))
  }

  const handlePublishRef = useRef<() => Promise<void>>(async () => {})

  const handlePublish = useCallback(async () => {
    if (!caption.trim()) { toast.error(t('multipost.toast.captionRequired')); return }
    if (selectedPlatforms.length === 0) { toast.error(t('multipost.toast.platformRequired')); return }

    // Check that at least one selected platform is connected
    const hasConnected = selectedPlatforms.some(id =>
      PLATFORMS.find(p => p.id === id)?.connected
    )
    if (!hasConnected) {
      toast.error(t('multipost.toast.connectPlatform'))
      return
    }

    setPublishing(true)
    await new Promise(r => setTimeout(r, 2000))
    setPublishing(false)
    setPublished(true)
    toast.success(t('multipost.toast.publishedCount', { count: selectedPlatforms.length }))
    setTimeout(() => setPublished(false), 3000)

    // Track in pipeline
    const taskTitle = activeQueueItem?.title || caption.split('\n')[0].slice(0, 60)
    addTask({
      title: taskTitle,
      type: 'Copy + Design',
      status: 'published',
      platforms: selectedPlatforms as PlatformId[],
      tags: activeQueueItem?.hashtags ?? [],
      priority: false,
    })

    // Update queue status + clear bridge
    if (activeQueueItem) {
      updateQueueItemStatus(activeQueueItem.id, 'published')
      clearActiveQueueItem()
    }
  }, [caption, selectedPlatforms, PLATFORMS, activeQueueItem, addTask, updateQueueItemStatus, clearActiveQueueItem])

  useEffect(() => {
    handlePublishRef.current = handlePublish
  }, [handlePublish])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handlePublishRef.current()
      }
      if (e.key === 'Escape') {
        setCaption('')
        setActivePreset(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const statusColor: Record<string, string> = {
    generating: 'var(--txt3)',
    ready: 'var(--green)',
    reviewing: '#F07B54',
    published: 'var(--blue)',
  }

  const statusLabel: Record<string, string> = {
    generating: 'Gerando',
    ready: 'Pronto',
    reviewing: 'Review',
    published: 'Publicado',
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>

      {/* LEFT PANEL */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto"
        style={{ width: 420, borderColor: 'var(--border-subtle)' }}
      >

        {/* 1. TOOLBAR */}
        <div
          className="flex items-center justify-between border-b"
          style={{ padding: '10px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('multipost.title')}</span>
          <div className="flex items-center gap-1" style={{ color: 'var(--txt3)', fontSize: 11 }}>
            <kbd style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--s3)', border: '1px solid var(--border-subtle)', color: 'var(--txt3)', margin: '0 2px' }}>⌘↵</kbd>
            <span style={{ marginRight: 6 }}>{t('multipost.publishShortcut')}</span>
            <kbd style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--s3)', border: '1px solid var(--border-subtle)', color: 'var(--txt3)', margin: '0 2px' }}>⇧↵</kbd>
            <span>{t('multipost.scheduleShortcut')}</span>
          </div>
        </div>

        {/* 2. PRESET STRIP */}
        <div
          className="flex border-b"
          style={{ padding: '8px 16px', gap: 6, borderColor: 'var(--border-subtle)' }}
        >
          {DISTRIBUTION_PRESETS.map(preset => {
            const isActive = activePreset === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="flex items-center shrink-0 transition-all"
                style={{
                  height: 28,
                  padding: '0 12px',
                  gap: 5,
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  border: `1px solid ${isActive ? preset.border : 'var(--border-subtle)'}`,
                  background: isActive ? preset.gradient : 'var(--s2)',
                  color: isActive ? preset.color : 'var(--txt2)',
                  cursor: 'pointer',
                }}
              >
                <PresetIcon id={preset.iconId} size={12} />
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>

        {/* 3. PLATFORM TOGGLES */}
        <div
          className="border-b"
          style={{ padding: '10px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <p
            className="uppercase tracking-widest"
            style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
          >
            Plataformas
          </p>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {PLATFORMS.map(p => {
              const isSelected = selectedPlatforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => p.connected && togglePlatform(p.id)}
                  className="inline-flex items-center transition-all"
                  style={{
                    height: 32,
                    padding: '0 12px',
                    gap: 6,
                    borderRadius: 8,
                    border: `1px solid ${isSelected && p.connected ? p.color + '55' : 'var(--border-subtle)'}`,
                    background: isSelected && p.connected ? p.color + '20' : 'var(--s2)',
                    color: isSelected ? 'var(--txt)' : 'var(--txt2)',
                    opacity: p.connected ? 1 : 0.35,
                    cursor: p.connected ? 'pointer' : 'not-allowed',
                  }}
                >
                  <PlatformIcon id={p.id} size={13} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. CAPTION AREA */}
        <div className="flex-1" style={{ padding: '12px 16px 8px' }}>
          {/* Football context banner — only shown when coming from War Room queue */}
          <FootballContextBanner />

          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em' }}
            >
              Caption
            </p>
            <div className="flex items-center" style={{ gap: 4 }}>
              <button
                onClick={generateAI}
                disabled={aiLoading}
                className="flex items-center transition-all"
                style={{
                  height: 24,
                  padding: '0 8px',
                  gap: 4,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(91,184,232,.1)',
                  color: 'var(--blue)',
                  border: '1px solid rgba(91,184,232,.2)',
                  cursor: 'pointer',
                }}
              >
                {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading ? t('multipost.aiGenerating') : t('multipost.aiBtn')}
              </button>
              <button
                onClick={() => setCaption(c => c + ' #')}
                className="flex items-center transition-all"
                style={{
                  height: 24,
                  padding: '0 8px',
                  gap: 4,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'var(--s2)',
                  color: 'var(--txt3)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <Hash size={10} />
                Hash
              </button>
              <button
                onClick={generateAI}
                className="flex items-center transition-all"
                style={{
                  height: 24,
                  padding: '0 8px',
                  gap: 4,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'var(--s2)',
                  color: 'var(--txt3)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                ↺ Rewrite
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={t('multipost.captionPlaceholder')}
              className="w-full resize-none outline-none leading-relaxed"
              style={{
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                background: 'var(--s2)',
                border: `1px solid ${charOver ? 'var(--red)' : 'var(--border-subtle)'}`,
                color: 'var(--txt)',
              }}
            />
            {aiLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(0,0,0,0.5)', fontSize: 12, color: 'var(--txt2)' }}
              >
                Gerando IA...
              </div>
            )}
          </div>

          <div className="flex justify-end" style={{ marginTop: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: charOver ? 'var(--red)' : 'var(--txt3)',
              }}
            >
              {charCount}/{charLimit}
            </span>
          </div>
        </div>

        {/* 5. QUEUE SECTION */}
        <div
          className="border-t"
          style={{ padding: '10px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em' }}
            >
              {t('multipost.queueLabel')}
            </p>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--blue)',
                background: 'rgba(91,184,232,.12)',
                border: '1px solid rgba(91,184,232,.2)',
                borderRadius: 99,
                padding: '1px 7px',
              }}
            >
              {contentQueue.length}
            </span>
          </div>

          {contentQueue.length === 0 ? (
            <p
              className="text-center"
              style={{ fontSize: 11, color: 'var(--txt3)', padding: '12px 0' }}
            >
              Nenhum item na fila
            </p>
          ) : (
            <div>
              {contentQueue.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  className="flex items-center"
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: 8,
                  }}
                >
                  <span
                    className="flex-1 truncate"
                    style={{ fontSize: 11, color: 'var(--txt)' }}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--txt3)', flexShrink: 0 }}>
                    {item.platforms.slice(0, 3).join(', ')}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: statusColor[item.status] || 'var(--txt3)',
                      flexShrink: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {statusLabel[item.status] || item.status}
                  </span>
                  <button
                    onClick={() => {
                      updateQueueItemStatus(item.id, 'published')
                      toast.success(`"${item.title}" publicado!`)
                    }}
                    style={{
                      height: 24,
                      padding: '0 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 6,
                      background: 'rgba(91,184,232,.1)',
                      color: 'var(--blue)',
                      border: '1px solid rgba(91,184,232,.2)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Deploy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. ACTION BAR */}
        <div
          className="flex border-t"
          style={{ padding: '12px 16px', gap: 8, borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => {
              if (!caption.trim()) { toast.error(t('multipost.toast.captionRequired')); return }
              addTask({
                title: activeQueueItem?.title || caption.split('\n')[0].slice(0, 60) || 'Rascunho',
                type: 'Copy + Design',
                status: 'backlog',
                platforms: selectedPlatforms as PlatformId[],
                tags: activeQueueItem?.hashtags ?? [],
                priority: false,
              })
              toast.success(t('multipost.toast.draftSaved'))
            }}
            className="flex items-center justify-center transition-all"
            style={{
              height: 32,
              flex: 1,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--txt2)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            {t('multipost.saveDraft')}
          </button>
          <button
            onClick={() => {
              if (!caption.trim()) { toast.error(t('multipost.toast.captionRequired')); return }
              if (activeQueueItem) {
                updateQueueItemStatus(activeQueueItem.id, 'reviewing')
              }
              addTask({
                title: activeQueueItem?.title || caption.split('\n')[0].slice(0, 60) || 'Para Aprovação',
                type: 'Copy + Design',
                status: 'review',
                platforms: selectedPlatforms as PlatformId[],
                tags: activeQueueItem?.hashtags ?? [],
                priority: false,
              })
              toast.success(t('multipost.toast.sentToApproval'))
            }}
            className="flex items-center justify-center transition-all"
            style={{
              height: 32,
              flex: 1,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--blue)',
              border: '1px solid rgba(91,184,232,.3)',
              cursor: 'pointer',
            }}
          >
            {t('multipost.toApproval')}
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePublish}
            disabled={publishing || published}
            className="flex items-center justify-center shrink-0 transition-all"
            style={{
              height: 32,
              padding: '0 16px',
              gap: 6,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: published ? 'var(--green)' : 'var(--grad)',
              color: '#fff',
              border: 'none',
              cursor: publishing || published ? 'default' : 'pointer',
              opacity: publishing ? 0.8 : 1,
            }}
          >
            {publishing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : published ? (
              <CheckCircle2 size={13} />
            ) : (
              <Zap size={13} />
            )}
            {publishing ? t('common.publishing') : published ? t('common.published') : t('multipost.publishBtn')}
            {!publishing && !published && (
              <kbd
                style={{
                  fontSize: 9,
                  padding: '1px 4px',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,.15)',
                  border: '1px solid rgba(255,255,255,.2)',
                  color: 'rgba(255,255,255,.8)',
                  marginLeft: 2,
                }}
              >
                ⌘↵
              </kbd>
            )}
          </motion.button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <div
          className="flex items-center border-b"
          style={{ padding: '8px 16px', gap: 6, borderColor: 'var(--border-subtle)', minHeight: 44 }}
        >
          <span
            className="uppercase"
            style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em' }}
          >
            {t('multipost.resumeLabel')}
          </span>
        </div>

        {/* PUBLICATION SUMMARY */}
        <div className="flex-1 overflow-auto" style={{ padding: 20 }}>
          {selectedPlatforms.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', paddingTop: 40 }}>
              {t('multipost.selectPlatformHint')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => {
                const count = caption.length
                const over = count > p.limit
                const pct = Math.min((count / p.limit) * 100, 100)
                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--s2)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Row: icon + name + status badge + char count */}
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 7 }}>
                      <PlatformIcon id={p.id} size={13} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', flex: 1 }}>
                        {p.name}
                      </span>
                      {p.connected ? (
                        <span
                          style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            color: 'var(--green)', background: 'rgba(62,207,142,.12)',
                            border: '1px solid rgba(62,207,142,.25)', borderRadius: 99,
                            padding: '1px 7px', letterSpacing: '0.04em',
                          }}
                        >
                          {t('common.connected')}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            color: 'var(--txt3)', background: 'var(--s3)',
                            border: '1px solid var(--border-subtle)', borderRadius: 99,
                            padding: '1px 7px', letterSpacing: '0.04em',
                          }}
                        >
                          {t('common.offline')}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10, fontFamily: 'monospace',
                          color: over ? 'var(--red)' : 'var(--txt3)',
                        }}
                      >
                        {count}/{p.limit}
                      </span>
                    </div>
                    {/* Char progress bar */}
                    <div
                      style={{
                        height: 3, borderRadius: 99,
                        background: 'var(--s3)', overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%', borderRadius: 99,
                          width: `${pct}%`,
                          background: over ? 'var(--red)' : p.color,
                          transition: 'width 0.2s',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI SUGGESTIONS */}
        <div
          className="border-t"
          style={{ padding: '12px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="flex items-center"
            style={{ marginBottom: 10, gap: 6 }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)' }}>
              {t('multipost.aiSuggestions')}
            </span>
            <Sparkles size={11} style={{ color: '#F97316' }} />
          </div>

          {AI_SUGGESTIONS.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '12px 0',
              textAlign: 'center',
            }}>
              <Lock size={18} style={{ opacity: 0.4, color: 'var(--txt3)' }} />
              <p style={{ fontSize: 11, color: 'var(--txt3)', margin: 0, lineHeight: 1.5 }}>
                {t('multipost.connectAiHint')}
              </p>
              <button
                onClick={() => router.push('/integrations')}
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: 'var(--blue)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {t('multipost.goToIntegrations')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {AI_SUGGESTIONS.map((suggestion, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{
                    background: 'var(--s2)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    gap: 8,
                  }}
                >
                  <span
                    className="flex-1 truncate"
                    style={{ fontSize: 11, color: 'var(--txt2)' }}
                    title={suggestion}
                  >
                    {suggestion}
                  </span>
                  <button
                    onClick={() => {
                      setCaption(suggestion)
                      toast.success('Sugestão aplicada')
                    }}
                    style={{
                      height: 24,
                      padding: '0 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 6,
                      background: 'rgba(91,184,232,.1)',
                      color: 'var(--blue)',
                      border: '1px solid rgba(91,184,232,.2)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    ↑ Usar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
