'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Zap, CheckCircle2, CalendarClock } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { YoutubeGlyph } from '@/components/multipost/YoutubeGlyph'
import { MediaUpload, type MediaState } from '@/components/multipost/MediaUpload'
import { PlatformCopies } from '@/components/multipost/PlatformCopies'
import { PlatformPreview } from '@/components/multipost/PlatformPreview'
import { PLATFORM_ORDER, PLATFORM_META, type PlatformId } from '@/lib/platform-limits'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useWorkspaceStore, brandVoiceToString } from '@/store/useWorkspaceStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { toast } from 'sonner'
import type { PlatformId as TaskPlatformId } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Maps War Room / legacy platform ids into the multipost PlatformId space.
function normalizePlatform(id: string): PlatformId | null {
  const map: Record<string, PlatformId> = {
    instagram: 'instagram',
    twitter: 'twitter',
    x: 'twitter',
    tiktok: 'tiktok',
    facebook: 'facebook',
    youtube: 'youtube_shorts',
    youtube_shorts: 'youtube_shorts',
    shorts: 'youtube_shorts',
  }
  return map[id.toLowerCase()] ?? null
}

// Maps multipost PlatformId → pipeline Task PlatformId (for tracking).
function toTaskPlatform(id: PlatformId): TaskPlatformId {
  return id === 'youtube_shorts' ? 'youtube' : (id as TaskPlatformId)
}

function PlatformGlyph({ id, size = 13 }: { id: PlatformId; size?: number }) {
  if (id === 'youtube_shorts') return <YoutubeGlyph size={size} />
  return <PlatformIcon id={id === 'twitter' ? 'twitter' : id} size={size} />
}

const emptyCopies = (): Record<PlatformId, string> => ({
  instagram: '',
  youtube_shorts: '',
  tiktok: '',
  facebook: '',
  twitter: '',
})

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MultipostPage() {
  const [media, setMedia] = useState<MediaState | null>(null)
  const [selected, setSelected] = useState<PlatformId[]>(['instagram', 'twitter'])
  const [baseCopy, setBaseCopy] = useState('')
  const [copies, setCopies] = useState<Record<PlatformId, string>>(emptyCopies())
  const [refining, setRefining] = useState(false)
  const [previewTab, setPreviewTab] = useState<PlatformId>('instagram')
  const [scheduledAt, setScheduledAt] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  // Dynamic {{variavel}} placeholders detected in the base copy (from a prompt)
  const vars = useMemo(() => {
    const found = baseCopy.match(/\{\{(\w+)\}\}/g) ?? []
    return Array.from(new Set(found.map((m) => m.slice(2, -2))))
  }, [baseCopy])

  // Substitute filled values; unfilled placeholders are left intact
  const applyVars = useCallback(
    (text: string) => text.replace(/\{\{(\w+)\}\}/g, (m, n) => varValues[n]?.trim() || m),
    [varValues]
  )

  const { draft, clearDraft } = useMultipostStore()
  const { brandVoice } = useWorkspaceStore()
  const { addTask } = usePipelineStore()

  // Keep preview tab valid as selection changes.
  useEffect(() => {
    if (selected.length === 0) return
    if (!selected.includes(previewTab)) setPreviewTab(selected[0])
  }, [selected, previewTab])

  // ─── AI refine ────────────────────────────────────────────────────────────────
  const refine = useCallback(
    async (draftText: string, platforms: PlatformId[]) => {
      const text = draftText.trim()
      if (!text) {
        toast.error('Digite uma copy base primeiro')
        return
      }
      if (platforms.length === 0) {
        toast.error('Selecione ao menos uma plataforma')
        return
      }
      setRefining(true)
      try {
        const res = await fetch('/api/ai/refine-copy', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            draft: text,
            platforms,
            mediaType: media?.type ?? null,
            brandVoice: brandVoiceToString(brandVoice),
          }),
        })
        const data = (await res.json()) as {
          copies: Record<string, string>
          refinedBy: 'ai' | 'fallback'
        }
        setCopies((prev) => {
          const next = { ...prev }
          for (const p of platforms) {
            if (typeof data.copies[p] === 'string') next[p] = data.copies[p]
          }
          return next
        })
        if (data.refinedBy === 'ai') {
          toast.success('Copies refinadas com IA ✦')
        } else {
          toast('Copies adaptadas localmente (IA não configurada)')
        }
      } catch {
        toast.error('Falha ao refinar copies')
      } finally {
        setRefining(false)
      }
    },
    [media, brandVoice]
  )

  // ─── War Room draft auto-load + auto-refine on mount ──────────────────────────
  const refineRef = useRef(refine)
  useEffect(() => {
    refineRef.current = refine
  }, [refine])

  useEffect(() => {
    if (!draft) return
    if (draft.source !== 'warroom' && draft.source !== 'prompt') return

    const valid = draft.platforms
      .map(normalizePlatform)
      .filter((p): p is PlatformId => p !== null)
    const platforms = valid.length > 0 ? Array.from(new Set(valid)) : selected
    setBaseCopy(draft.caption)
    if (valid.length > 0) {
      setSelected(platforms)
      setPreviewTab(platforms[0])
    }

    if (draft.source === 'warroom') {
      toast.success('Conteúdo do War Room carregado ✓')
      clearDraft()
      // Auto-refine — War Room content is already final copy.
      void refineRef.current(draft.caption, platforms)
    } else {
      // Prompt template: fill the {{variáveis}} first, then refine manually.
      setVarValues({})
      toast.success('Prompt carregado — preencha as variáveis')
      clearDraft()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const togglePlatform = (id: PlatformId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
    if (!selected.includes(id)) setPreviewTab(id)
  }

  const editCopy = useCallback((id: PlatformId, text: string) => {
    setCopies((prev) => ({ ...prev, [id]: text }))
  }, [])

  // ─── Action handlers ──────────────────────────────────────────────────────────
  const trackTask = useCallback(
    (status: 'backlog' | 'review' | 'published') => {
      const title = baseCopy.split('\n')[0].slice(0, 60) || 'Multipost'
      addTask({
        title,
        type: 'Copy + Design',
        status,
        platforms: selected.map(toTaskPlatform),
        tags: brandVoice.hashtags,
        priority: false,
      })
    },
    [baseCopy, selected, addTask, brandVoice.hashtags]
  )

  const guard = () => {
    if (selected.length === 0) {
      toast.error('Selecione ao menos uma plataforma')
      return false
    }
    const hasCopy = selected.some((p) => (copies[p] || '').trim()) || baseCopy.trim()
    if (!hasCopy) {
      toast.error('Escreva ou refine uma copy primeiro')
      return false
    }
    return true
  }

  const saveDraft = () => {
    if (!guard()) return
    trackTask('backlog')
    toast.success('Rascunho salvo')
  }

  const sendToApproval = () => {
    if (!guard()) return
    trackTask('review')
    toast.success('Enviado para aprovação')
  }

  const publishNow = useCallback(async () => {
    if (!guard()) return
    setPublishing(true)
    await new Promise((r) => setTimeout(r, 1400))
    setPublishing(false)
    setPublished(true)
    trackTask('published')
    toast.success(
      scheduledAt
        ? `Agendado para ${new Date(scheduledAt).toLocaleString('pt-BR')}`
        : `Publicado em ${selected.length} plataforma(s)`
    )
    setTimeout(() => setPublished(false), 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, copies, baseCopy, scheduledAt, trackTask])

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* LEFT COLUMN */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto"
        style={{ width: 460, borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{ padding: '10px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Multipost</span>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Media */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              Mídia
            </p>
            <MediaUpload media={media} onChange={setMedia} />
          </section>

          {/* Platform chips */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              Plataformas
            </p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {PLATFORM_ORDER.map((id) => {
                const isSelected = selected.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => togglePlatform(id)}
                    className="inline-flex items-center transition-all"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      gap: 6,
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'rgba(91,184,232,.45)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(91,184,232,.12)' : 'var(--s2)',
                      color: isSelected ? 'var(--txt)' : 'var(--txt2)',
                      cursor: 'pointer',
                    }}
                  >
                    <PlatformGlyph id={id} size={13} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{PLATFORM_META[id].short}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Base copy */}
          <section>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <p
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em' }}
              >
                Copy base
              </p>
              <button
                onClick={() => refine(applyVars(baseCopy), selected)}
                disabled={refining}
                className="flex items-center transition-all"
                style={{
                  height: 26,
                  padding: '0 10px',
                  gap: 5,
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(167,139,250,.12)',
                  color: '#A78BFA',
                  border: '1px solid rgba(167,139,250,.3)',
                  cursor: refining ? 'default' : 'pointer',
                  opacity: refining ? 0.7 : 1,
                }}
              >
                {refining ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {refining ? 'Refinando…' : '✦ Refinar com IA'}
              </button>
            </div>
            <textarea
              value={baseCopy}
              onChange={(e) => setBaseCopy(e.target.value)}
              placeholder="Digite sua copy..."
              className="w-full resize-none outline-none leading-relaxed"
              style={{
                width: '100%',
                minHeight: 96,
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                background: 'var(--s2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--txt)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </section>

          {/* Dynamic variables (from a loaded prompt template) */}
          {vars.length > 0 && (
            <section
              style={{
                background: 'rgba(167,139,250,.06)',
                border: '1px solid rgba(167,139,250,.25)',
                borderRadius: 10, padding: 12,
              }}
            >
              <p
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 600, color: '#A78BFA', marginBottom: 8, letterSpacing: '0.08em' }}
              >
                Preencher variáveis
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vars.map((name) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label
                      style={{
                        width: 96, flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      title={name}
                    >
                      {name}
                    </label>
                    <input
                      value={varValues[name] ?? ''}
                      onChange={(e) => setVarValues((prev) => ({ ...prev, [name]: e.target.value }))}
                      placeholder={`{{${name}}}`}
                      style={{
                        flex: 1, height: 30, padding: '0 10px', borderRadius: 7, fontSize: 12,
                        background: 'var(--s2)', border: '1px solid var(--border-subtle)',
                        color: 'var(--txt)', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 8 }}>
                Substituído ao vivo no preview e no refino com IA.
              </p>
            </section>
          )}

          {/* Per-platform copies */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              Copies por plataforma
            </p>
            <PlatformCopies
              copies={copies}
              selected={selected}
              loading={refining}
              onEdit={editCopy}
              onFocus={(id) => setPreviewTab(id)}
            />
          </section>
        </div>

        {/* Action bar */}
        <div
          className="border-t"
          style={{ padding: '12px 16px', borderColor: 'var(--border-subtle)', marginTop: 'auto' }}
        >
          <div
            className="flex items-center"
            style={{ gap: 8, marginBottom: 10 }}
          >
            <CalendarClock size={14} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                flex: 1,
                height: 32,
                padding: '0 10px',
                borderRadius: 8,
                fontSize: 12,
                background: 'var(--s2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--txt)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={saveDraft}
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
              Salvar Rascunho
            </button>
            <button
              onClick={sendToApproval}
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
              Enviar p/ aprovação
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publishNow}
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
              {publishing ? 'Publicando…' : published ? 'Publicado' : scheduledAt ? 'Agendar' : 'Publicar Agora'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — PREVIEW */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview tabs */}
        <div
          className="flex items-center border-b"
          style={{ padding: '8px 16px', gap: 6, borderColor: 'var(--border-subtle)', minHeight: 44, flexWrap: 'wrap' }}
        >
          {selected.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--txt3)' }}>Nenhuma plataforma selecionada</span>
          ) : (
            selected.map((id) => {
              const active = previewTab === id
              return (
                <button
                  key={id}
                  onClick={() => setPreviewTab(id)}
                  className="inline-flex items-center transition-all"
                  style={{
                    height: 28,
                    padding: '0 10px',
                    gap: 5,
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active ? 'rgba(91,184,232,.45)' : 'var(--border-subtle)'}`,
                    background: active ? 'rgba(91,184,232,.12)' : 'var(--s2)',
                    color: active ? 'var(--txt)' : 'var(--txt2)',
                    cursor: 'pointer',
                  }}
                >
                  <PlatformGlyph id={id} size={12} />
                  {PLATFORM_META[id].short}
                </button>
              )
            })
          )}
        </div>

        {/* Preview canvas */}
        <div
          className="flex-1 overflow-auto"
          style={{
            padding: 32,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {selected.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--txt3)', paddingTop: 40 }}>
              Selecione uma plataforma para visualizar o preview.
            </p>
          ) : (
            <PlatformPreview
              platform={previewTab}
              media={media}
              caption={applyVars(copies[previewTab] || baseCopy)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
