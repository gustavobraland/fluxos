'use client'
import { Loader2, Pencil, Send, CheckCircle2, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWarRoomStore, type QueueStatus } from '@/store/useWarRoomStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useTranslation } from '@/hooks/useTranslation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SwipeableCard } from '@/components/mobile/SwipeableCard'

const STATUS_META: Record<QueueStatus, { color: string; bg: string }> = {
  generating: { color: 'var(--txt3)',  bg: 'var(--s3)' },
  ready:      { color: 'var(--green)', bg: 'rgba(62,207,142,0.12)' },
  review:     { color: 'var(--yellow)', bg: 'rgba(245,200,66,0.12)' },
  deploy:     { color: 'var(--blue)',  bg: 'rgba(37,99,235,0.12)' },
  published:  { color: '#A78BFA',      bg: 'rgba(167,139,250,0.12)' },
}

export function ContentQueue() {
  const queue = useWarRoomStore(s => s.queue)
  const updateQueueItem = useWarRoomStore(s => s.updateQueueItem)
  const setDraft = useMultipostStore(s => s.setDraft)
  const router = useRouter()
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')

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
          const meta = STATUS_META[item.status]
          const actionable = item.status === 'ready' || item.status === 'review'
          const publish = () => {
            updateQueueItem(item.id, { status: 'published' })
            toast.success(t('warroom.contentPublished'))
          }

          const row = (
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--s1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: 'var(--txt3)', background: 'var(--s3)', borderRadius: 4,
                  padding: '2px 6px', flexShrink: 0, marginTop: 1,
                }}>
                  {t(`warroom.trigger.${item.trigger}`)}
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
                  {t(`warroom.queueStatus.${item.status}`)}
                </span>
              </div>

              {actionable && (
                <div style={{ display: 'flex', gap: 6, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                  <button
                    onClick={() => sendToMultipost(item.id, item.caption, item.platforms)}
                    title={t('warroom.editInMultipost')}
                    style={btn('var(--txt2)', 'var(--border-subtle)', 'transparent', isMobile)}
                  >
                    <Pencil size={isMobile ? 14 : 10} /> {t('warroom.edit')}
                  </button>
                  {!isMobile && (
                    <button
                      onClick={() => sendToMultipost(item.id, item.caption, item.platforms)}
                      style={btn('var(--blue)', 'rgba(37,99,235,0.3)', 'rgba(37,99,235,0.1)')}
                    >
                      <Send size={10} /> {t('warroom.multipost')}
                    </button>
                  )}
                  <button
                    onClick={publish}
                    style={isMobile
                      ? btn('#fff', '#E0201A', '#E0201A', true)
                      : btn('var(--green)', 'rgba(62,207,142,0.3)', 'rgba(62,207,142,0.1)')}
                  >
                    <CheckCircle2 size={isMobile ? 14 : 10} /> {t('warroom.publish')}
                  </button>
                </div>
              )}
            </div>
          )

          // Mobile + acionável: swipe para a direita publica direto.
          return isMobile && actionable ? (
            <SwipeableCard
              key={item.id}
              rightAction={{ label: t('warroom.publish'), color: '#3ECF8E', onAction: publish }}
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
