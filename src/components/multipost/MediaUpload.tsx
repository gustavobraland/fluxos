'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { UploadCloud, X, RefreshCw, ImageIcon, Film, Clock, Crop } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

export interface MediaState {
  file: File
  type: 'image' | 'video'
  previewUrl: string
  duration?: number
  aspectRatio?: string
  width?: number
  height?: number
}

interface MediaUploadProps {
  media: MediaState | null
  onChange: (media: MediaState | null) => void
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE = 30 * 1024 * 1024
const MAX_VIDEO = 500 * 1024 * 1024

function aspectLabel(w: number, h: number): string {
  if (!w || !h) return ''
  const ratio = w / h
  const candidates: { label: string; value: number }[] = [
    { label: '1:1', value: 1 },
    { label: '9:16', value: 9 / 16 },
    { label: '16:9', value: 16 / 9 },
    { label: '4:5', value: 4 / 5 },
  ]
  let best = candidates[0]
  let bestDiff = Infinity
  for (const c of candidates) {
    const diff = Math.abs(c.value - ratio)
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best.label
}

function formatDuration(sec: number): string {
  if (!isFinite(sec)) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MediaUpload({ media, onChange }: MediaUploadProps) {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastUrl = useRef<string | null>(null)

  // Revoke previous object URL whenever it changes / on unmount.
  useEffect(() => {
    if (media?.previewUrl && media.previewUrl !== lastUrl.current) {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
      lastUrl.current = media.previewUrl
    }
    if (!media && lastUrl.current) {
      URL.revokeObjectURL(lastUrl.current)
      lastUrl.current = null
    }
  }, [media])

  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
    }
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)

      if (!isImage && !isVideo) {
        toast.error(t('multipost.mediaError.unsupported'))
        return
      }
      if (isImage && file.size > MAX_IMAGE) {
        toast.error(t('multipost.mediaError.imageTooLarge'))
        return
      }
      if (isVideo && file.size > MAX_VIDEO) {
        toast.error(t('multipost.mediaError.videoTooLarge'))
        return
      }

      const previewUrl = URL.createObjectURL(file)
      const type: 'image' | 'video' = isImage ? 'image' : 'video'

      if (type === 'image') {
        const img = new Image()
        img.onload = () => {
          onChange({
            file,
            type,
            previewUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: aspectLabel(img.naturalWidth, img.naturalHeight),
          })
        }
        img.onerror = () => onChange({ file, type, previewUrl })
        img.src = previewUrl
      } else {
        const vid = document.createElement('video')
        vid.preload = 'metadata'
        vid.onloadedmetadata = () => {
          onChange({
            file,
            type,
            previewUrl,
            width: vid.videoWidth,
            height: vid.videoHeight,
            duration: vid.duration,
            aspectRatio: aspectLabel(vid.videoWidth, vid.videoHeight),
          })
        }
        vid.onerror = () => onChange({ file, type, previewUrl })
        vid.src = previewUrl
      }
    },
    [onChange, t]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  // ─── Preview state ──────────────────────────────────────────────────────────
  if (media) {
    return (
      <div
        style={{
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          background: 'var(--s2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
          }}
        >
          {media.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.previewUrl}
              alt={t('multipost.media.previewAlt')}
              style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
            />
          ) : (
            <video
              src={media.previewUrl}
              muted
              preload="metadata"
              playsInline
              style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {media.type === 'image' ? (
            <ImageIcon size={13} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
          ) : (
            <Film size={13} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
          )}
          <span
            style={{
              fontSize: 11,
              color: 'var(--txt2)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={media.file.name}
          >
            {media.file.name}
          </span>

          {media.aspectRatio && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--txt3)',
                flexShrink: 0,
              }}
            >
              <Crop size={10} />
              {media.aspectRatio}
            </span>
          )}
          {media.type === 'video' && media.duration != null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--txt3)',
                flexShrink: 0,
              }}
            >
              <Clock size={10} />
              {formatDuration(media.duration)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '0 12px 10px' }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              flex: 1,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              background: 'var(--s2)',
              color: 'var(--txt2)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} />
            {t('multipost.media.swap')}
          </button>
          <button
            onClick={() => onChange(null)}
            style={{
              flex: 1,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(232,90,90,.1)',
              color: 'var(--red)',
              border: '1px solid rgba(232,90,90,.25)',
              cursor: 'pointer',
            }}
          >
            <X size={11} />
            {t('multipost.media.remove')}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')}
          style={{ display: 'none' }}
          onChange={onSelect}
        />
      </div>
    )
  }

  // ─── Empty drop zone ──────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '24px 16px',
        borderRadius: 10,
        border: `1.5px dashed ${dragging ? 'var(--blue)' : 'var(--border-subtle)'}`,
        background: dragging ? 'rgba(37,99,235,.06)' : 'var(--s2)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'center',
      }}
    >
      <UploadCloud size={24} style={{ color: dragging ? 'var(--blue)' : 'var(--txt3)' }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>
        {t('multipost.media.dropHint')}
      </div>
      <div style={{ fontSize: 10, color: 'var(--txt3)', lineHeight: 1.5 }}>
        {t('multipost.media.imageHint')}
        <br />
        {t('multipost.media.videoHint')}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')}
        style={{ display: 'none' }}
        onChange={onSelect}
      />
    </div>
  )
}
