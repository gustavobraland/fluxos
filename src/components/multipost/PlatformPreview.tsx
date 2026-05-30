'use client'
import { Heart, MessageCircle, Send, Bookmark, Music2, Share2, MoreHorizontal, ThumbsUp, Repeat2 } from 'lucide-react'
import type { PlatformId } from '@/lib/platform-limits'
import type { MediaState } from './MediaUpload'

interface PlatformPreviewProps {
  platform: PlatformId
  media: MediaState | null
  caption: string
}

// ─── Shared media frame ───────────────────────────────────────────────────────

function MediaFrame({
  media,
  aspect,
  radius = 0,
}: {
  media: MediaState | null
  aspect: number // width / height
  radius?: number
}) {
  const common: React.CSSProperties = {
    width: '100%',
    aspectRatio: `${aspect}`,
    objectFit: 'cover',
    display: 'block',
    borderRadius: radius,
  }
  if (!media) {
    return (
      <>
        <div
          style={{
            ...common,
            background: 'linear-gradient(135deg, var(--s2), var(--s3))',
            backgroundSize: '200% 200%',
            animation: 'mpShimmer 2.4s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes mpShimmer { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }`}</style>
      </>
    )
  }
  if (media.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.previewUrl} alt="" style={common} />
  }
  return <video src={media.previewUrl} muted preload="metadata" playsInline style={common} />
}

const CARD: React.CSSProperties = {
  width: 320,
  maxWidth: '100%',
  background: 'var(--s1)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 14,
  overflow: 'hidden',
  fontFamily: 'inherit',
}

const AVATAR = (
  <div
    style={{
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'var(--grad)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700,
      color: '#fff',
    }}
  >
    BL
  </div>
)

export function PlatformPreview({ platform, media, caption }: PlatformPreviewProps) {
  const text = caption.trim()

  // ─── Instagram ──────────────────────────────────────────────────────────────
  if (platform === 'instagram') {
    return (
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          {AVATAR}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>braland</span>
          <MoreHorizontal size={16} style={{ marginLeft: 'auto', color: 'var(--txt3)' }} />
        </div>
        <MediaFrame media={media} aspect={1} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px 4px' }}>
          <Heart size={20} style={{ color: 'var(--txt)' }} />
          <MessageCircle size={20} style={{ color: 'var(--txt)' }} />
          <Send size={20} style={{ color: 'var(--txt)' }} />
          <Bookmark size={20} style={{ marginLeft: 'auto', color: 'var(--txt)' }} />
        </div>
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
            1.248 curtidas
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--txt2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--txt)' }}>braland </span>
            {text || 'Sua legenda aparece aqui…'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 6 }}>Ver todos os 84 comentários</div>
        </div>
      </div>
    )
  }

  // ─── YouTube Shorts ───────────────────────────────────────────────────────────
  if (platform === 'youtube_shorts') {
    return (
      <div style={{ ...CARD, width: 200 }}>
        <div style={{ position: 'relative' }}>
          <MediaFrame media={media} aspect={9 / 16} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '12px 12px 24px',
              background: 'linear-gradient(180deg, rgba(0,0,0,.55), transparent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.3,
              textShadow: '0 1px 3px rgba(0,0,0,.6)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {text || 'Título do Short aparece aqui'}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,.6)',
            }}
          >
            {AVATAR}
            @braland
          </div>
        </div>
      </div>
    )
  }

  // ─── TikTok ─────────────────────────────────────────────────────────────────
  if (platform === 'tiktok') {
    return (
      <div style={{ ...CARD, width: 200 }}>
        <div style={{ position: 'relative' }}>
          <MediaFrame media={media} aspect={9 / 16} />
          {/* Action rail */}
          <div
            style={{
              position: 'absolute',
              right: 8,
              bottom: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              color: '#fff',
            }}
          >
            <Heart size={22} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
            <MessageCircle size={22} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
            <Bookmark size={22} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
            <Share2 size={22} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
          </div>
          {/* Bottom-left caption */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              right: 44,
              bottom: 10,
              color: '#fff',
              textShadow: '0 1px 3px rgba(0,0,0,.7)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>@braland</div>
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {text || 'Legenda do TikTok…'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginTop: 6 }}>
              <Music2 size={11} />
              som original - braland
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Facebook ───────────────────────────────────────────────────────────────
  if (platform === 'facebook') {
    return (
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          {AVATAR}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>BraLand</div>
            <div style={{ fontSize: 10, color: 'var(--txt3)' }}>Agora · 🌎</div>
          </div>
          <MoreHorizontal size={16} style={{ marginLeft: 'auto', color: 'var(--txt3)' }} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--txt2)', lineHeight: 1.5, padding: '0 12px 10px', whiteSpace: 'pre-wrap' }}>
          {text || 'Texto da publicação no Facebook…'}
        </div>
        <MediaFrame media={media} aspect={16 / 9} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 12px',
            borderTop: '1px solid var(--border-subtle)',
            color: 'var(--txt3)',
            fontSize: 11,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ThumbsUp size={14} /> Curtir
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MessageCircle size={14} /> Comentar
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Share2 size={14} /> Compartilhar
          </span>
        </div>
      </div>
    )
  }

  // ─── X / Twitter ──────────────────────────────────────────────────────────────
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', gap: 10, padding: 12 }}>
        {AVATAR}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--txt)' }}>BraLand</span>
            <span style={{ color: 'var(--txt3)' }}>@braland · 1m</span>
            <MoreHorizontal size={14} style={{ marginLeft: 'auto', color: 'var(--txt3)' }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.45, margin: '4px 0 8px', whiteSpace: 'pre-wrap' }}>
            {text || 'O que está acontecendo?'}
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <MediaFrame media={media} aspect={16 / 9} />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              color: 'var(--txt3)',
              fontSize: 11,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} /> 12</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Repeat2 size={14} /> 34</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14} /> 280</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bookmark size={14} /></span>
          </div>
        </div>
      </div>
    </div>
  )
}
