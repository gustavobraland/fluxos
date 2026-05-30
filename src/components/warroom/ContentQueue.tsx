'use client'
import { Loader2, Pencil, Send, CheckCircle2, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWarRoomStore, type QueueStatus, type QueueTrigger } from '@/store/useWarRoomStore'
import { useMultipostStore } from '@/store/useMultipostStore'

const STATUS_META: Record<QueueStatus, { label: string; color: string; bg: string }> = {
  generating: { label: 'Gerando',   color: 'var(--txt3)',  bg: 'var(--s3)' },
  ready:      { label: 'Pronto',    color: 'var(--green)', bg: 'rgba(62,207,142,0.12)' },
  review:     { label: 'Review',    color: 'var(--yellow)', bg: 'rgba(245,200,66,0.12)' },
  deploy:     { label: 'Deploy',    color: 'var(--blue)',  bg: 'rgba(91,184,232,0.12)' },
  published:  { label: 'Publicado', color: '#A78BFA',      bg: 'rgba(167,139,250,0.12)' },
}

const TRIGGER_LABEL: Record<QueueTrigger, string> = {
  goal: 'Gol', halftime: 'Intervalo', fulltime: 'Fim de jogo', manual: 'Manual',
}

export function ContentQueue() {
  const queue = useWarRoomStore(s => s.queue)
  const updateQueueItem = useWarRoomStore(s => s.updateQueueItem)
  const setDraft = useMultipostStore(s => s.setDraft)
  const router = useRouter()

  if (queue.length === 0) return null

  const sendToMultipost = (id: string, caption: string, platforms: string[]) => {
    setDraft({ caption, platforms, scheduledAt: null, source: 'warroom' })
    updateQueueItem(id, { status: 'deploy' })
    router.push('/multipost')
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Radio size={13} style={{ color: 'var(--green)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Fila de Conteúdo</span>
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
          const meta = STATUS_META[item.status]
          const actionable = item.status === 'ready' || item.status === 'review'
          return (
            <div key={item.id} style={{
              padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: 'var(--txt3)', background: 'var(--s3)', borderRadius: 4,
                  padding: '2px 6px', flexShrink: 0, marginTop: 1,
                }}>
                  {TRIGGER_LABEL[item.trigger]}
                </span>
                <span style={{
                  flex: 1, fontSize: 12, color: 'var(--txt)', lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}>
                  {item.caption}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: meta.color, background: meta.bg, borderRadius: 99,
                  padding: '2px 8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {item.status === 'generating' && <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />}
                  {meta.label}
                </span>
              </div>

              {actionable && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => sendToMultipost(item.id, item.caption, item.platforms)}
                    title="Editar no Multipost"
                    style={btn('var(--txt2)', 'var(--border-subtle)')}
                  >
                    <Pencil size={10} /> Editar
                  </button>
                  <button
                    onClick={() => sendToMultipost(item.id, item.caption, item.platforms)}
                    style={btn('var(--blue)', 'rgba(91,184,232,0.3)', 'rgba(91,184,232,0.1)')}
                  >
                    <Send size={10} /> Multipost
                  </button>
                  <button
                    onClick={() => {
                      updateQueueItem(item.id, { status: 'published' })
                      toast.success('Conteúdo publicado')
                    }}
                    style={btn('var(--green)', 'rgba(62,207,142,0.3)', 'rgba(62,207,142,0.1)')}
                  >
                    <CheckCircle2 size={10} /> Publicar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function btn(color: string, border: string, bg = 'transparent'): React.CSSProperties {
  return {
    height: 26, padding: '0 10px', borderRadius: 6,
    background: bg, color, border: `1px solid ${border}`,
    cursor: 'pointer', fontSize: 10, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
  }
}
