'use client'
// ─── Fila de conteúdo do War Room ─────────────────────────────────────────────
// Enquanto o Multipost não está aprovado nas APIs das redes sociais,
// o fluxo de aprovação exibe a arte + copy prontos para baixar/copiar
// manualmente. Um clique em "Aprovar" abre o painel de postagem manual.

import { useState } from 'react'
import { Loader2, Pencil, CheckCircle2, Radio, Download, Copy, X, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWarRoomStore, type QueueStatus } from '@/store/useWarRoomStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useTranslation } from '@/hooks/useTranslation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SwipeableCard } from '@/components/mobile/SwipeableCard'

const STATUS_META: Record<QueueStatus, { color: string; bg: string; label: string }> = {
  generating: { color: 'var(--txt3)',   bg: 'var(--s3)',                    label: 'Gerando…' },
  ready:      { color: 'var(--green)',  bg: 'rgba(62,207,142,0.12)',        label: 'Pronto' },
  review:     { color: 'var(--yellow)', bg: 'rgba(245,200,66,0.12)',        label: 'Revisar' },
  deploy:     { color: 'var(--blue)',   bg: 'rgba(37,99,235,0.12)',         label: 'Enviado' },
  published:  { color: '#A78BFA',       bg: 'rgba(167,139,250,0.12)',       label: 'Publicado' },
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  twitter:   'X / Twitter',
  facebook:  'Facebook',
  tiktok:    'TikTok',
  youtube:   'YouTube',
  telegram:  'Telegram',
}

export function ContentQueue() {
  const queue          = useWarRoomStore(s => s.queue)
  const updateQueueItem = useWarRoomStore(s => s.updateQueueItem)
  const setDraft        = useMultipostStore(s => s.setDraft)
  const router          = useRouter()
  const { t }           = useTranslation()
  const isMobile        = useMediaQuery('(max-width: 768px)')

  // ID do item atualmente expandido (painel de postagem manual)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (queue.length === 0) return null

  const sendToMultipost = (id: string, caption: string, platforms: string[]) => {
    setDraft({ caption, platforms, scheduledAt: null, source: 'warroom' })
    updateQueueItem(id, { status: 'deploy' })
    router.push('/multipost')
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copy ${label} copiada! ✓`)
    } catch {
      toast.error('Não foi possível copiar — tente manualmente')
    }
  }

  const markPublished = (id: string) => {
    updateQueueItem(id, { status: 'published' })
    setExpandedId(null)
    toast.success('Marcado como publicado ✓')
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Radio size={13} style={{ color: 'var(--green)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('warroom.contentQueue')}</span>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          color: 'var(--green)', background: 'rgba(62,207,142,0.1)',
          border: '1px solid rgba(62,207,142,0.2)', borderRadius: 99, padding: '1px 8px',
        }}>
          {queue.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {queue.map(item => {
          const meta      = STATUS_META[item.status]
          const actionable = item.status === 'ready' || item.status === 'review'
          const isExpanded = expandedId === item.id
          const hasArt     = !!item.artUrl

          const approve = () => {
            // Abre o painel de postagem manual
            setExpandedId(isExpanded ? null : item.id)
            if (item.status === 'ready') updateQueueItem(item.id, { status: 'review' })
          }

          const row = (
            <div style={{
              borderBottom: '1px solid var(--border-subtle)',
              background: isExpanded ? 'var(--s2)' : 'var(--s1)',
              transition: 'background 0.15s',
            }}>
              {/* ── Linha principal ───────────────────────────────────────── */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {/* Trigger badge */}
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: 'var(--txt3)', background: 'var(--s3)', borderRadius: 4,
                    padding: '2px 6px', flexShrink: 0, marginTop: 1,
                  }}>
                    {t(`warroom.trigger.${item.trigger}`)}
                  </span>

                  {/* Caption preview */}
                  <span style={{
                    flex: 1, fontSize: 12, color: 'var(--txt)', lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    display: '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 2,
                    WebkitBoxOrient: 'vertical', overflow: isExpanded ? undefined : 'hidden',
                  }}>
                    {item.caption}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: meta.color, background: meta.bg, borderRadius: 99,
                    padding: '2px 8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {item.status === 'generating' && (
                      <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {meta.label}
                  </span>
                </div>

                {/* Arte pendente: ícone pequeno */}
                {actionable && !hasArt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.5 }}>
                    <Loader2 size={10} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--txt3)' }} />
                    <span style={{ fontSize: 10, color: 'var(--txt3)' }}>Arte gerando…</span>
                  </div>
                )}

                {/* Arte pronta: indicador */}
                {actionable && hasArt && !isExpanded && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ImageIcon size={10} style={{ color: 'var(--green)' }} />
                    <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Arte pronta</span>
                  </div>
                )}

                {/* Botões de ação */}
                {actionable && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                    {/* Editar no Multipost */}
                    <button
                      onClick={() => sendToMultipost(item.id, item.caption, item.platforms)}
                      title="Editar no Multipost"
                      style={btn('var(--txt2)', 'var(--border-subtle)', 'transparent', isMobile)}
                    >
                      <Pencil size={isMobile ? 14 : 10} /> Editar
                    </button>

                    {/* Aprovar → abre painel manual */}
                    <button
                      onClick={approve}
                      style={isExpanded
                        ? btn('var(--txt3)', 'var(--border-subtle)', 'var(--s3)', isMobile)
                        : isMobile
                          ? btn('#fff', '#3ECF8E', '#3ECF8E', true)
                          : btn('var(--green)', 'rgba(62,207,142,0.3)', 'rgba(62,207,142,0.1)')
                      }
                    >
                      {isExpanded
                        ? <><X size={isMobile ? 14 : 10} /> Fechar</>
                        : <><CheckCircle2 size={isMobile ? 14 : 10} /> Aprovar</>
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* ── Painel de postagem manual (expandido) ─────────────────── */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '14px 14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  background: 'var(--s1)',
                }}>
                  {/* Arte */}
                  {hasArt ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)' }}>🖼 Arte gerada</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.artUrl}
                        alt="Arte gerada pelo DALL-E 3"
                        style={{
                          width: '100%', maxWidth: 340, borderRadius: 10,
                          border: '1px solid var(--border-subtle)',
                          display: 'block',
                        }}
                      />
                      <a
                        href={item.artUrl}
                        download={`braland-art-${item.trigger}-${item.id}.png`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          height: 32, padding: '0 14px', borderRadius: 8,
                          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
                          color: 'var(--blue)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                          width: 'fit-content',
                        }}
                      >
                        <Download size={12} /> Baixar arte
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 8,
                      background: 'var(--s3)', border: '1px solid var(--border-subtle)',
                    }}>
                      <Loader2 size={14} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--txt3)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--txt2)' }}>Arte sendo gerada pelo DALL-E 3… (15-30s)</span>
                    </div>
                  )}

                  {/* Copy por plataforma */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)' }}>📋 Copy para postar</span>
                    {/* Caption completo */}
                    <div style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--s3)', border: '1px solid var(--border-subtle)',
                      fontSize: 12, color: 'var(--txt)', lineHeight: 1.5, whiteSpace: 'pre-line',
                    }}>
                      {item.caption}
                    </div>
                    {/* Botões de copiar por plataforma */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {item.platforms.map(platform => (
                        <button
                          key={platform}
                          onClick={() => void copyText(item.caption, PLATFORM_LABELS[platform] ?? platform)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            height: 28, padding: '0 10px', borderRadius: 6,
                            background: 'var(--s3)', border: '1px solid var(--border-subtle)',
                            color: 'var(--txt2)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <Copy size={10} />
                          Copiar {PLATFORM_LABELS[platform] ?? platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instruções + Marcar publicado */}
                  <div style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.2)',
                    fontSize: 11, color: 'var(--txt2)', lineHeight: 1.6,
                  }}>
                    ① Baixe a arte · ② Copie a copy · ③ Poste manualmente nas redes · ④ Clique em &ldquo;Marcar publicado&rdquo;
                  </div>

                  <button
                    onClick={() => markPublished(item.id)}
                    style={{
                      height: 40, borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(62,207,142,0.15)', border: '1px solid rgba(62,207,142,0.4)',
                      color: 'var(--green)', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    <CheckCircle2 size={14} /> Marcar como publicado
                  </button>
                </div>
              )}
            </div>
          )

          // Mobile + acionável: swipe para a direita abre o painel manual
          return isMobile && actionable ? (
            <SwipeableCard
              key={item.id}
              rightAction={{ label: 'Aprovar', color: '#3ECF8E', onAction: approve }}
            >
              {row}
            </SwipeableCard>
          ) : (
            <div key={item.id}>{row}</div>
          )
        })}
      </div>
    </div>
  )
}

function btn(color: string, border: string, bg = 'transparent', big = false): React.CSSProperties {
  return {
    height: big ? 48 : 26,
    flex: big ? 1 : undefined,
    justifyContent: big ? 'center' : undefined,
    padding: big ? '0 14px' : '0 10px',
    borderRadius: big ? 10 : 6,
    background: bg, color, border: `1px solid ${border}`,
    cursor: 'pointer', fontSize: big ? 14 : 10, fontWeight: big ? 700 : 600,
    display: 'flex', alignItems: 'center', gap: big ? 6 : 4,
  }
}
