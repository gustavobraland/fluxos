'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Zap, CheckCircle2, CalendarClock, Trash2 } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { YoutubeGlyph } from '@/components/multipost/YoutubeGlyph'
import { MediaUpload, type MediaState } from '@/components/multipost/MediaUpload'
import { PlatformCopies } from '@/components/multipost/PlatformCopies'
import { PlatformPreview } from '@/components/multipost/PlatformPreview'
import { PLATFORM_ORDER, PLATFORM_META, PLATFORM_LIMITS, type PlatformId } from '@/lib/platform-limits'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useWorkspaceStore, brandVoiceToString } from '@/store/useWorkspaceStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useShallow } from 'zustand/shallow'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import { usePermission } from '@/hooks/usePermission'
import { fetchSocialConnections, type SocialConnection } from '@/lib/social'
import { createClient } from '@/lib/supabase/client'
import type { PlatformId as TaskPlatformId } from '@/types'

// Plataforma do Multipost → plataforma salva em social_connections.
const CONN_PLATFORM: Partial<Record<PlatformId, string>> = {
  instagram: 'instagram',
  youtube_shorts: 'youtube',
  tiktok: 'tiktok',
}

const TZ = 'America/Sao_Paulo'

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
  const { t } = useTranslation()
  // Permissões de publicação: influencer publica direto; demais enviam para aprovação.
  const canPublish = usePermission('content.publish')
  const canPublishDirect = usePermission('content.publish_without_approval')
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

  // Contas sociais conectadas (OAuth) — para escolher onde publicar.
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  useEffect(() => {
    let on = true
    void fetchSocialConnections().then((c) => {
      if (!on) return
      setConnections(c)
      setSelectedAccountId((prev) => prev ?? c[0]?.account_id ?? null)
    })
    return () => { on = false }
  }, [])
  const connectedSet = useMemo(() => new Set(connections.map((c) => c.platform)), [connections])
  const isPlatformConnected = useCallback(
    (id: PlatformId) => { const cp = CONN_PLATFORM[id]; return !!cp && connectedSet.has(cp) },
    [connectedSet],
  )

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
  const scheduledPosts = useScheduleStore(useShallow(s => s.scheduled))
  const schedule = useScheduleStore(s => s.schedule)
  const removeScheduled = useScheduleStore(s => s.removeScheduled)

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
        toast.error(t('multipost.toastApi.baseCopyRequired'))
        return
      }
      if (platforms.length === 0) {
        toast.error(t('multipost.toastApi.platformRequired'))
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
          toast.success(t('multipost.toastApi.refinedAi'))
        } else {
          toast(t('multipost.toastApi.refinedLocal'))
        }
      } catch {
        toast.error(t('multipost.toastApi.refineFailed'))
      } finally {
        setRefining(false)
      }
    },
    [media, brandVoice, t]
  )

  // ─── War Room draft auto-load + auto-refine on mount ──────────────────────────
  const refineRef = useRef(refine)
  useEffect(() => {
    refineRef.current = refine
  }, [refine])

  useEffect(() => {
    if (!draft) return
    if (draft.source !== 'warroom' && draft.source !== 'prompt' && draft.source !== 'clipador') return

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
      toast.success(t('multipost.toastApi.warroomLoaded'))
      clearDraft()
      // Auto-refine — War Room content is already final copy.
      void refineRef.current(draft.caption, platforms)
    } else if (draft.source === 'clipador') {
      toast.success(t('multipost.toastApi.clipadorLoaded'))
      clearDraft()
    } else {
      // Prompt template: fill the {{variáveis}} first, then refine manually.
      setVarValues({})
      toast.success(t('multipost.toastApi.promptLoaded'))
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
      toast.error(t('multipost.toastApi.platformRequired'))
      return false
    }
    const hasCopy = selected.some((p) => (copies[p] || '').trim()) || baseCopy.trim()
    if (!hasCopy) {
      toast.error(t('multipost.toastApi.copyRequired'))
      return false
    }
    return true
  }

  const saveDraft = () => {
    if (!guard()) return
    trackTask('backlog')
    toast.success(t('multipost.toastApi.draftSaved'))
  }

  const sendToApproval = () => {
    if (!guard()) return
    trackTask('review')
    toast.success(t('multipost.toastApi.sentToApproval'))
  }

  // Publica de verdade nas contas conectadas (TikTok/YouTube): hospeda o vídeo
  // no Supabase Storage e chama as rotas /api/publish/*. Retorna nº de sucessos.
  const publishToConnected = useCallback(async (): Promise<number> => {
    const targets = selected.filter(
      (id) => (id === 'tiktok' || id === 'youtube_shorts') && isPlatformConnected(id),
    )
    if (targets.length === 0) return 0
    if (!media || media.type !== 'video') {
      toast.error(t('multipost.toastApi.videoRequiredPublish'))
      return 0
    }

    // 1. Hospeda o vídeo numa URL pública.
    let videoUrl: string
    try {
      const supabase = createClient()
      const safe = media.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `pub/${Date.now()}-${safe}`
      const up = await supabase.storage.from('media').upload(path, media.file, {
        upsert: true,
        contentType: media.file.type,
      })
      if (up.error) throw up.error
      videoUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
    } catch {
      toast.error(t('multipost.toastApi.uploadFailed'))
      return 0
    }

    // 2. Publica em cada plataforma conectada.
    let ok = 0
    for (const id of targets) {
      const platform = CONN_PLATFORM[id]! // 'tiktok' | 'youtube'
      const label = platform === 'tiktok' ? 'TikTok' : 'YouTube'
      const caption = (copies[id]?.trim() || baseCopy).trim()
      try {
        const res = await fetch(`/api/publish/${platform}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(
            platform === 'tiktok'
              ? { videoUrl, caption }
              : { videoUrl, title: caption.split('\n')[0].slice(0, 100) || 'Flux OS', description: caption },
          ),
        })
        const json = await res.json()
        if (json.success) { ok++; toast.success(t('multipost.toastApi.publishedTo', { platform: label })) }
        else toast.error(`${label}: ${json.error ?? t('multipost.toastApi.publishFailed')}`)
      } catch {
        toast.error(`${label}: ${t('multipost.toastApi.networkError')}`)
      }
    }
    return ok
  }, [selected, isPlatformConnected, media, copies, baseCopy, t])

  const publishNow = useCallback(async () => {
    if (!guard()) return
    setPublishing(true)
    const realCount = await publishToConnected()
    setPublishing(false)
    setPublished(true)
    trackTask('published')
    // Resumo: se publicou em conta conectada, os toasts por plataforma já saíram;
    // senão (plataformas sem OAuth), mostra o resumo padrão.
    if (realCount === 0) {
      toast.success(
        scheduledAt
          ? t('multipost.toastApi.scheduledAt', { date: new Date(scheduledAt).toLocaleString('pt-BR') })
          : t('multipost.toastApi.publishedCount', { count: selected.length })
      )
    }
    setTimeout(() => setPublished(false), 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, copies, baseCopy, scheduledAt, trackTask, publishToConnected])

  // Real scheduling: persist the post + mirror it onto the Calendar as a content event
  const schedulePost = () => {
    if (!guard()) return
    if (!scheduledAt) { toast.error(t('multipost.toastApi.chooseDateTime')); return }
    const ts = new Date(scheduledAt).getTime()
    if (isNaN(ts)) { toast.error(t('multipost.toastApi.invalidDate')); return }
    const caption = (applyVars(baseCopy).trim() || applyVars(copies[selected[0]] || '').trim())
    schedule({ caption, platforms: selected, scheduledAt: ts })
    useCalendarStore.getState().addEvent({
      id: `content-${ts}-${selected.join('')}`,
      type: 'content',
      title: caption.split('\n')[0].slice(0, 50) || t('multipost.scheduledTitle'),
      subtitle: selected.map(p => PLATFORM_META[p].short).join(' · '),
      date: new Date(ts).toLocaleDateString('en-CA', { timeZone: TZ }),
      time: new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
      timestamp: Math.floor(ts / 1000),
      source: 'multipost',
      platforms: selected,
    })
    trackTask('backlog')
    toast.success(t('multipost.toastApi.scheduledCalendar', { date: new Date(ts).toLocaleString('pt-BR') }))
    setScheduledAt('')
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* LEFT COLUMN (editor) — largura total no mobile */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto w-full md:w-[460px]"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{ padding: '10px 16px', borderColor: 'var(--border-subtle)' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('multipost.title')}</span>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Media */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              {t('multipost.mediaLabel')}
            </p>
            <MediaUpload media={media} onChange={setMedia} />
          </section>

          {/* Platform chips */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              {t('multipost.platformsLabel')}
            </p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {PLATFORM_ORDER.map((id) => {
                const isSelected = selected.includes(id)
                const connected = isPlatformConnected(id)
                return (
                  <button
                    key={id}
                    onClick={() => togglePlatform(id)}
                    title={connected ? 'Conta conectada' : undefined}
                    className="inline-flex items-center transition-all"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      gap: 6,
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'rgba(37,99,235,.45)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(37,99,235,.12)' : 'var(--s2)',
                      color: isSelected ? 'var(--txt)' : 'var(--txt2)',
                      cursor: 'pointer',
                    }}
                  >
                    <PlatformGlyph id={id} size={13} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{PLATFORM_META[id].short}</span>
                    {connected && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} title="Conectado" />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Contas conectadas (OAuth) — escolha onde publicar */}
          {connections.length > 0 && (
            <section>
              <p
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
              >
                {t('multipost.accountLabel')}
              </p>
              <div className="flex flex-wrap" style={{ gap: 6 }}>
                {connections.map((c) => {
                  const active = selectedAccountId === c.account_id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedAccountId(c.account_id)}
                      className="inline-flex items-center transition-all"
                      style={{
                        height: 36, padding: '0 12px 0 6px', gap: 8, borderRadius: 999,
                        border: `1px solid ${active ? 'rgba(37,99,235,.45)' : 'var(--border-subtle)'}`,
                        background: active ? 'rgba(37,99,235,.12)' : 'var(--s2)',
                        color: active ? 'var(--txt)' : 'var(--txt2)', cursor: 'pointer',
                      }}
                    >
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar_url} alt={c.account_name ?? ''} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--s3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PlatformIcon id={c.platform} size={13} />
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.account_name ?? c.platform}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Base copy */}
          <section>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <p
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em' }}
              >
                {t('multipost.baseCopyLabel')}
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
                {refining ? t('multipost.refining') : t('multipost.refineAi')}
              </button>
            </div>
            <textarea
              value={baseCopy}
              onChange={(e) => setBaseCopy(e.target.value)}
              placeholder={t('multipost.baseCopyPlaceholder')}
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
                {t('multipost.fillVariables')}
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
                {t('multipost.variablesHint')}
              </p>
            </section>
          )}

          {/* Per-platform copies */}
          <section>
            <p
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8, letterSpacing: '0.08em' }}
            >
              {t('multipost.platformCopiesLabel')}
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
              {t('multipost.saveDraftBtn')}
            </button>
            {!canPublishDirect && (
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
                  border: '1px solid rgba(37,99,235,.3)',
                  cursor: 'pointer',
                }}
              >
                {t('multipost.sendToApprovalBtn')}
              </button>
            )}
            {(canPublish || canPublishDirect) && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={scheduledAt ? schedulePost : publishNow}
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
                {publishing ? t('multipost.publishingBtn') : published ? t('multipost.publishedBtn') : scheduledAt ? t('multipost.scheduleBtn') : t('multipost.publishNowBtn')}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — PREVIEW (só desktop; escondido no mobile) */}
      <div className="desktop-only flex-1 flex flex-col overflow-hidden">
        {/* Preview tabs */}
        <div
          className="flex items-center border-b"
          style={{ padding: '8px 16px', gap: 6, borderColor: 'var(--border-subtle)', minHeight: 44, flexWrap: 'wrap' }}
        >
          {selected.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('multipost.noPlatformSelected')}</span>
          ) : (
            selected.map((id) => {
              const active = previewTab === id
              const lim = PLATFORM_LIMITS[id]
              const count = applyVars(copies[id] || baseCopy).length
              const countColor = count > lim.caption ? 'var(--red)' : count > lim.recommended ? 'var(--yellow)' : 'var(--txt3)'
              return (
                <button
                  key={id}
                  onClick={() => setPreviewTab(id)}
                  className="inline-flex items-center transition-all"
                  style={{
                    height: 28,
                    padding: '0 8px 0 10px',
                    gap: 5,
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active ? 'rgba(37,99,235,.45)' : 'var(--border-subtle)'}`,
                    background: active ? 'rgba(37,99,235,.12)' : 'var(--s2)',
                    color: active ? 'var(--txt)' : 'var(--txt2)',
                    cursor: 'pointer',
                  }}
                >
                  <PlatformGlyph id={id} size={12} />
                  {PLATFORM_META[id].short}
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
                    color: countColor, background: 'var(--s3)', borderRadius: 5, padding: '1px 4px',
                  }}>
                    {count}/{lim.caption}
                  </span>
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
              {t('multipost.previewHint')}
            </p>
          ) : (
            <PlatformPreview
              platform={previewTab}
              media={media}
              caption={applyVars(copies[previewTab] || baseCopy)}
            />
          )}
        </div>

        {/* Agendados */}
        {scheduledPosts.length > 0 && (
          <div className="border-t" style={{ borderColor: 'var(--border-subtle)', flexShrink: 0, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
              <CalendarClock size={12} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{t('multipost.scheduled')}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: 'var(--blue)', background: 'rgba(37,99,235,.12)', borderRadius: 99, padding: '1px 7px' }}>
                {scheduledPosts.length}
              </span>
            </div>
            {scheduledPosts.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--blue)', flexShrink: 0, width: 96 }}>
                  {new Date(p.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.caption.split('\n')[0] || t('multipost.noText')}
                </span>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {p.platforms.slice(0, 5).map((pid) => (
                    <span key={pid} style={{ color: 'var(--txt3)' }}>
                      <PlatformGlyph id={pid as PlatformId} size={11} />
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => { removeScheduled(p.id); toast.success(t('multipost.scheduleRemoved')) }}
                  title={t('multipost.removeSchedule')}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
