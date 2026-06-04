'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Scissors, Upload, Loader2, Check, X, Send, KanbanSquare, Download, SlidersHorizontal, Play, Paperclip, Info } from 'lucide-react'
import { useClipadorStore } from '@/store/useClipadorStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useTranslation } from '@/hooks/useTranslation'
import {
  generateDemoClips, buildExportBundle, CLIP_TYPE_COLOR, fmtClock,
  type Clip, type ClipType, type ClipPlatform,
} from '@/lib/clipador'

const mono = 'JetBrains Mono, monospace'
const PLATFORMS: ClipPlatform[] = ['reels', 'tiktok', 'shorts']
const PLATFORM_LABEL: Record<ClipPlatform, string> = { reels: 'Reels', tiktok: 'TikTok', shorts: 'Shorts' }
// Clipador platform → Multipost platform id
const TO_MULTIPOST: Record<ClipPlatform, string> = { reels: 'instagram', tiktok: 'tiktok', shorts: 'youtube_shorts' }

let timers: ReturnType<typeof setTimeout>[] = []

export default function ClipadorPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    status, progressLabel, clips, selectedPlatforms,
    setStatus, setSource, setClips, updateClip, togglePlatform, reset,
  } = useClipadorStore()
  const setDraft = useMultipostStore(s => s.setDraft)
  const addTask = usePipelineStore(s => s.addTask)

  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [adjusting, setAdjusting] = useState<string | null>(null)

  const processing = status === 'downloading' || status === 'transcribing' || status === 'analyzing'

  function runDemo() {
    if (!url.trim() && !fileName) { toast.error(t('clipador.toast.needInput')); return }
    timers.forEach(clearTimeout); timers = []
    setSource(fileName || url.trim())
    setClips([])
    const steps: [number, typeof status, string][] = [
      [0,    'downloading',  t('clipador.status.downloading')],
      [1200, 'transcribing', t('clipador.status.transcribing')],
      [3000, 'analyzing',    t('clipador.status.analyzing')],
    ]
    steps.forEach(([d, s, label]) => timers.push(setTimeout(() => setStatus(s, label), d)))
    timers.push(setTimeout(() => { setClips(generateDemoClips()); setStatus('ready', t('clipador.status.ready')) }, 4600))
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 500 * 1024 * 1024) { toast.error(t('clipador.toast.fileTooLarge')); return }
    setFileName(f.name); setUrl('')
  }

  const nudge = (clip: Clip, field: 'start_ms' | 'end_ms', deltaSec: number) => {
    const next = Math.max(0, clip[field] + deltaSec * 1000)
    const patch: Partial<Clip> = { [field]: next }
    patch.duration_seconds = Math.round(((field === 'end_ms' ? next : clip.end_ms) - (field === 'start_ms' ? next : clip.start_ms)) / 1000)
    updateClip(clip.id, patch)
  }

  const sendToMultipost = (clip: Clip) => {
    const platforms = (selectedPlatforms.length ? selectedPlatforms : PLATFORMS).map(p => TO_MULTIPOST[p])
    setDraft({ caption: `${clip.title}\n\n${clip.transcript_text}`, platforms, scheduledAt: null, source: 'clipador' })
    router.push('/multipost')
  }

  const addToPipeline = (clip: Clip) => {
    addTask({
      title: `Editar clip: ${clip.title}`,
      type: 'Motion',
      status: 'production',
      platforms: [],
      tags: ['clipador', `${fmtClock(clip.start_ms)}–${fmtClock(clip.end_ms)}`],
      priority: false,
    })
    toast.success(t('clipador.toast.pipelineCreated'))
  }

  const approved = clips.filter(c => c.status === 'approved')
  const visible = clips.filter(c => c.status !== 'discarded').sort((a, b) => b.score - a.score)
  const avg = visible.length ? Math.round(visible.reduce((s, c) => s + c.score, 0) / visible.length) : 0

  function exportZip() {
    if (approved.length === 0) { toast.error(t('clipador.toast.noApproved')); return }
    if (selectedPlatforms.length === 0) { toast.error(t('clipador.toast.noPlatform')); return }
    const bundle = buildExportBundle(approved, selectedPlatforms)
    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href; a.download = 'clipador-export.txt'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(href)
    toast.success(t('clipador.toast.exported'))
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', color: 'var(--txt)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Scissors size={20} style={{ color: 'var(--red)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t('clipador.title')}</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 18 }}>{t('clipador.subtitle')}</p>

        {/* Input card */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); if (e.target.value) setFileName('') }}
              placeholder={t('clipador.ytPlaceholder')}
              style={{
                flex: 1, minWidth: 220, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13,
                background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)', outline: 'none',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{t('clipador.or')}</span>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                height: 40, padding: '0 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: 'var(--s2)', color: 'var(--txt2)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Upload size={14} /> {t('clipador.upload')}
            </button>
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/*" style={{ display: 'none' }} onChange={onFile} />
            <button
              onClick={runDemo}
              disabled={processing}
              style={{
                height: 40, padding: '0 20px', borderRadius: 10, cursor: processing ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 700, background: 'var(--red)', color: '#fff', border: 'none',
                opacity: processing ? 0.7 : 1,
              }}
            >
              {t('clipador.process')}
            </button>
          </div>
          {fileName && (
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Paperclip size={11} /> {fileName} · {t('clipador.fileHint')}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 10, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Info size={11} /> {t('clipador.demoNote')}
          </div>
        </div>

        {/* Loading */}
        {processing && (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 14,
            padding: '20px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Loader2 size={18} style={{ color: 'var(--red)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--txt)' }}>{progressLabel}</span>
          </div>
        )}

        {/* Clips */}
        {status === 'ready' && visible.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{t('clipador.clipsFound', { count: visible.length })}</span>
              <span style={{ fontSize: 12, color: 'var(--txt2)', fontFamily: mono }}>{t('clipador.avgScore', { score: avg })}</span>
              <button onClick={() => { reset(); setUrl(''); setFileName('') }} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--txt3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>↺</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence initial={false}>
                {visible.map(clip => (
                  <ClipCard
                    key={clip.id} clip={clip} t={t}
                    adjusting={adjusting === clip.id}
                    onToggleAdjust={() => setAdjusting(a => a === clip.id ? null : clip.id)}
                    onApprove={() => { updateClip(clip.id, { status: 'approved' }); toast.success(t('clipador.toast.approved')) }}
                    onDiscard={() => { updateClip(clip.id, { status: 'discarded' }); toast(t('clipador.toast.discarded')) }}
                    onNudge={(f, d) => nudge(clip, f, d)}
                    onMultipost={() => sendToMultipost(clip)}
                    onPipeline={() => addToPipeline(clip)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Export */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                {t('clipador.exportTitle')}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {PLATFORMS.map(p => {
                  const on = selectedPlatforms.includes(p)
                  return (
                    <button key={p} onClick={() => togglePlatform(p)} style={{
                      height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: on ? 'var(--red-s)' : 'var(--s2)',
                      color: on ? 'var(--red)' : 'var(--txt2)',
                      border: `1px solid ${on ? 'var(--red)' : 'var(--border-subtle)'}`,
                    }}>
                      {on ? <Check size={12} /> : null} {PLATFORM_LABEL[p]}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={exportZip}
                style={{
                  height: 38, padding: '0 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: 'var(--red)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Download size={15} /> {t('clipador.exportBtn')} ({approved.length})
              </button>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8 }}>{t('clipador.exportHint')}</div>
            </div>
          </>
        )}

        {/* Empty */}
        {status === 'idle' && (
          <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 13, padding: '40px 0' }}>
            {t('clipador.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({
  clip, t, adjusting, onToggleAdjust, onApprove, onDiscard, onNudge, onMultipost, onPipeline,
}: {
  clip: Clip
  t: (k: string, p?: Record<string, string | number>) => string
  adjusting: boolean
  onToggleAdjust: () => void
  onApprove: () => void
  onDiscard: () => void
  onNudge: (field: 'start_ms' | 'end_ms', deltaSec: number) => void
  onMultipost: () => void
  onPipeline: () => void
}) {
  const color = CLIP_TYPE_COLOR[clip.clip_type as ClipType]
  const isApproved = clip.status === 'approved'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: 'var(--s1)', border: `1px solid ${isApproved ? 'var(--green)' : 'var(--border-subtle)'}`,
        borderLeft: `3px solid ${color}`, borderRadius: 12, padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 5, padding: '2px 7px' }}>
          {t(`clipador.types.${clip.clip_type}`)}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: mono }}>{t('clipador.score')}: {clip.score}</span>
        <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--s3)', overflow: 'hidden', maxWidth: 160 }}>
          <div style={{ height: '100%', width: `${clip.score}%`, background: color, borderRadius: 4 }} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--txt3)', fontFamily: mono }}>
          {fmtClock(clip.start_ms)} → {fmtClock(clip.end_ms)} · {clip.duration_seconds}s
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{clip.title}</div>
      <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, marginBottom: 10 }}>{clip.score_reason}</div>

      {adjusting && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '8px 10px', marginBottom: 10, background: 'var(--s2)', borderRadius: 8 }}>
          {(['start_ms', 'end_ms'] as const).map(field => (
            <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{field === 'start_ms' ? t('clipador.startLabel') : t('clipador.endLabel')}</span>
              <button onClick={() => onNudge(field, -1)} style={nudgeBtn}>−1s</button>
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, minWidth: 42, textAlign: 'center' }}>{fmtClock(clip[field])}</span>
              <button onClick={() => onNudge(field, 1)} style={nudgeBtn}>+1s</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={ghost} title={t('clipador.preview')}><Play size={11} /> {t('clipador.preview')}</button>
        <button onClick={onToggleAdjust} style={ghost}><SlidersHorizontal size={11} /> {t('clipador.adjust')}</button>
        {isApproved ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} /> {t('clipador.approved')}
          </span>
        ) : (
          <button onClick={onApprove} style={{ ...ghost, color: 'var(--green)', borderColor: 'rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.08)' }}>
            <Check size={11} /> {t('clipador.approve')}
          </button>
        )}
        <button onClick={onDiscard} style={ghost}><X size={11} /> {t('clipador.discard')}</button>

        {isApproved && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button onClick={onPipeline} style={ghost}><KanbanSquare size={11} /> {t('clipador.addPipeline')}</button>
            <button onClick={onMultipost} style={{ ...ghost, color: 'var(--red)', borderColor: 'var(--red)', background: 'var(--red-s)' }}>
              <Send size={11} /> {t('clipador.sendMultipost')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const ghost: React.CSSProperties = {
  height: 28, padding: '0 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
  background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--border-subtle)',
  display: 'flex', alignItems: 'center', gap: 4,
}
const nudgeBtn: React.CSSProperties = {
  height: 22, width: 30, borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: mono,
  background: 'var(--s3)', color: 'var(--txt2)', border: '1px solid var(--border-subtle)',
}
