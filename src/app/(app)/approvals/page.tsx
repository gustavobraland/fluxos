'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, RotateCcw, Film, Trophy, BarChart2, Laugh,
  MessageSquare, MapPin, CheckCheck, CornerDownLeft, ImageIcon, X,
} from 'lucide-react'
import type { ApprovalItem, Comment } from '@/types'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import { useTranslation } from '@/hooks/useTranslation'
import { usePermission } from '@/hooks/usePermission'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SwipeableCard } from '@/components/mobile/SwipeableCard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes'

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending:  'var(--yellow)',
  approved: 'var(--green)',
  rejected: 'var(--red)',
  changes:  '#E0201A',
}

const STATUS_BG: Record<ApprovalStatus, string> = {
  pending:  'rgba(245,200,66,0.15)',
  approved: 'rgba(62,207,142,0.15)',
  rejected: 'rgba(248,113,113,0.15)',
  changes:  'rgba(224,32,26,0.15)',
}

function getItemIcon(emoji: string) {
  switch (emoji) {
    case 'trophy':   return <Trophy size={14} />
    case 'laugh':    return <Laugh size={14} />
    case 'film':     return <Film size={14} />
    case 'barchart': return <BarChart2 size={14} />
    default:         return <CheckCircle2 size={14} />
  }
}

function getItemIconLarge(emoji: string) {
  switch (emoji) {
    case 'trophy':   return <Trophy size={44} />
    case 'laugh':    return <Laugh size={44} />
    case 'film':     return <Film size={44} />
    case 'barchart': return <BarChart2 size={44} />
    default:         return <ImageIcon size={44} />
  }
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation()
  return (
    <span style={{
      background: STATUS_BG[status], color: STATUS_COLOR[status],
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      {t(`approvals.statusLabel.${status}`)}
    </span>
  )
}

// ─── Left Panel — list with hover quick actions (Melhoria 5) ──────────────────

function ItemList({
  items, selectedId, onSelect, onQuickApprove, onQuickReject,
}: {
  items: ApprovalItem[]
  selectedId: string
  onSelect: (id: string) => void
  onQuickApprove: (id: string) => void
  onQuickReject: (id: string) => void
}) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const { t } = useTranslation()
  const canApprove = usePermission('content.approve')
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      width: isMobile ? '100%' : 220, flexShrink: 0,
      maxHeight: isMobile ? '38vh' : undefined,
      borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
      borderBottom: isMobile ? '1px solid var(--border-subtle)' : undefined,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t('approvals.title')}</span>
        <span style={{ background: 'var(--s3)', color: 'var(--txt2)', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99 }}>
          {items.length}
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {items.map((item) => {
          const active = item.id === selectedId
          const status = item.status as ApprovalStatus
          const pendingComments = item.comments.filter(c => !c.resolved).length
          const showQuick = hoverId === item.id && status === 'pending' && canApprove
          const swipeable = isMobile && canApprove && status === 'pending'
          const row = (
            <div
              onMouseEnter={() => setHoverId(item.id)}
              onMouseLeave={() => setHoverId((h) => (h === item.id ? null : h))}
              onClick={() => onSelect(item.id)}
              style={{
                position: 'relative',
                background: active ? 'var(--s2)' : 'var(--s1)',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
                padding: '12px 16px', cursor: 'pointer',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: active ? 'var(--s3)' : 'var(--s2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: STATUS_COLOR[status],
              }}>
                {getItemIcon(item.emoji)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: active ? 'var(--txt)' : 'var(--txt2)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 5 }}>{item.subtitle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge status={status} />
                  {pendingComments > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MessageSquare size={9} />
                      {pendingComments}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick actions on hover — pending only (Melhoria 5) */}
              {showQuick && (
                <div style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--s2)', border: '1px solid var(--border-mid)',
                  borderRadius: 8, padding: '4px 6px', boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickReject(item.id) }}
                    title={t('approvals.reject')}
                    style={{
                      width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(248,113,113,0.10)', color: 'var(--red)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickApprove(item.id) }}
                    title={t('approvals.approve')}
                    style={{
                      height: 24, padding: '0 8px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 11, fontWeight: 700,
                      background: 'rgba(62,207,142,0.12)', color: 'var(--green)',
                      border: '1px solid rgba(62,207,142,0.25)',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    <CheckCircle2 size={11} /> {t('approvals.approve')}
                  </button>
                </div>
              )}
            </div>
          )

          // Mobile: swipe → = aprovar, swipe ← = rejeitar (sem abrir o item)
          return swipeable ? (
            <SwipeableCard
              key={item.id}
              rightAction={{ label: t('approvals.approve'), color: '#3ECF8E', onAction: () => onQuickApprove(item.id) }}
              leftAction={{ label: t('approvals.reject'), color: '#E0201A', onAction: () => onQuickReject(item.id) }}
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

// ─── Center Panel — media viewer + pins (Melhorias 1 & 2) ─────────────────────

function MediaViewer({
  item, comments, pendingPin, onImageClick, onPinClick, onClearPin,
}: {
  item: ApprovalItem
  comments: Comment[]
  pendingPin: { x: number; y: number } | null
  onImageClick: (x: number, y: number) => void
  onPinClick: (id: string) => void
  onClearPin: () => void
}) {
  const { t } = useTranslation()
  const status = item.status as ApprovalStatus
  const pinned = comments.filter(c => c.pin && !c.resolved)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onImageClick(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)))
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative', width: '100%', flex: 1, minHeight: 0, borderRadius: 12, overflow: 'hidden',
        background: 'var(--s2)', border: '1px solid var(--border-subtle)',
        cursor: 'crosshair',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {item.mediaUrl && item.type === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.mediaUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      )}
      {item.mediaUrl && item.type === 'video' && (
        <video src={item.mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      )}
      {!item.mediaUrl && (
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${STATUS_BG[status]}, var(--s3))`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          color: STATUS_COLOR[status],
        }}>
          <div style={{ transform: 'scale(1.6)' }}>{getItemIconLarge(item.emoji)}</div>
          <span style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 8 }}>
            {t('approvals.previewHint')}
          </span>
        </div>
      )}

      {/* Existing comment pins */}
      {pinned.map((c, idx) => (
        <button
          key={c.id}
          onClick={(e) => { e.stopPropagation(); onPinClick(c.id) }}
          title={c.text}
          style={{
            position: 'absolute', left: `${c.pin!.x}%`, top: `${c.pin!.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24, borderRadius: '50%', zIndex: 10, cursor: 'pointer',
            background: c.color, color: '#fff', border: '2px solid #fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {idx + 1}
        </button>
      ))}

      {/* Pending (unsent) pin — dashed */}
      {pendingPin && (
        <button
          onClick={(e) => { e.stopPropagation(); onClearPin() }}
          title={t('approvals.pendingPinHint')}
          style={{
            position: 'absolute', left: `${pendingPin.x}%`, top: `${pendingPin.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24, borderRadius: '50%', zIndex: 11, cursor: 'pointer',
            background: 'rgba(37,99,235,0.25)', color: '#fff',
            border: '2px dashed #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MapPin size={11} />
        </button>
      )}
    </div>
  )
}

function DetailPanel({
  item, comments, pendingPin, onImageClick, onPinClick, onClearPin,
  onApprove, onReject, onRequestAdjust,
}: {
  item: ApprovalItem
  comments: Comment[]
  pendingPin: { x: number; y: number } | null
  onImageClick: (x: number, y: number) => void
  onPinClick: (id: string) => void
  onClearPin: () => void
  onApprove: () => void
  onReject: () => void
  onRequestAdjust: () => void
}) {
  const { t } = useTranslation()
  const canApprove = usePermission('content.approve')
  const status = item.status as ApprovalStatus
  const channel = item.subtitle.split('·')[0].trim()
  const format = item.subtitle.split('·')[1]?.trim() ?? t('approvals.noFormat')
  const decided = item.status !== 'pending'
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined,
      minWidth: 0, minHeight: isMobile ? '70vh' : undefined,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: STATUS_BG[status],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: STATUS_COLOR[status], flexShrink: 0,
        }}>
          {getItemIcon(item.emoji)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{item.subtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Hero — art fills the space (Melhorias 1 & 2) */}
      <div style={{ flex: 1, minHeight: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MediaViewer
          item={item}
          comments={comments}
          pendingPin={pendingPin}
          onImageClick={onImageClick}
          onPinClick={onPinClick}
          onClearPin={onClearPin}
        />

        {/* Compact metadata line */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          fontSize: 12, color: 'var(--txt2)', flexShrink: 0,
        }}>
          {[item.type === 'video' ? t('approvals.typeVideo') : t('approvals.typeImage'), channel, format, t(`approvals.statusLabel.${status}`)].map((v, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: i === arr.length - 1 ? 700 : 500, color: i === arr.length - 1 ? STATUS_COLOR[status] : 'var(--txt2)' }}>{v}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--txt3)' }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Action bar — directly under the art (wraps instead of clipping) */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0,
        background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {canApprove ? (
          <>
            <button
              onClick={onReject}
              disabled={decided}
              title={t('approvals.reject')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
                background: 'rgba(248,113,113,0.10)', color: 'var(--red)',
                border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8,
                padding: '8px 14px', fontSize: 13, fontWeight: 600,
                cursor: decided ? 'not-allowed' : 'pointer', opacity: decided ? 0.5 : 1,
              }}
            >
              <XCircle size={14} /> {t('approvals.reject')}
            </button>
            <button
              onClick={onRequestAdjust}
              disabled={decided}
              title={t('approvals.requestAdjust')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap',
                background: 'var(--s3)', color: 'var(--txt)', border: '1px solid var(--border-mid)',
                borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                cursor: decided ? 'not-allowed' : 'pointer', opacity: decided ? 0.5 : 1,
              }}
            >
              <RotateCcw size={14} /> {t('approvals.requestAdjust')}
            </button>
            <button
              onClick={onApprove}
              disabled={decided}
              style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 13, fontWeight: 700,
                cursor: decided ? 'not-allowed' : 'pointer', opacity: decided ? 0.5 : 1,
              }}
            >
              <CheckCircle2 size={14} /> {t('approvals.approve')}
            </button>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, color: 'var(--txt3)', padding: '6px 0',
          }}>
            <CheckCircle2 size={13} /> {t('approvals.noApprovePermission')}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Right Panel — comments + unified input & actions (Melhoria 3) ────────────

function CommentPanel({
  comments, commentText, pendingPin, flashId, inputRef, commentRefs,
  onChangeText, onSubmitComment, onResolve, onClearPin,
}: {
  comments: Comment[]
  commentText: string
  pendingPin: { x: number; y: number } | null
  flashId: string | null
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  commentRefs: React.RefObject<Record<string, HTMLDivElement | null>>
  onChangeText: (v: string) => void
  onSubmitComment: () => void
  onResolve: (id: string) => void
  onClearPin: () => void
}) {
  const { t } = useTranslation()
  const open = comments.filter(c => !c.resolved)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      width: isMobile ? '100%' : 280, flexShrink: 0,
      maxHeight: isMobile ? '50vh' : undefined,
      borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
      borderTop: isMobile ? '1px solid var(--border-subtle)' : undefined,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <MessageSquare size={14} style={{ color: 'var(--txt2)' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t('approvals.comments')}</span>
        <span style={{
          background: open.length > 0 ? 'rgba(245,200,66,.18)' : 'var(--s3)',
          color: open.length > 0 ? 'var(--yellow)' : 'var(--txt2)',
          fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
        }}>
          {t('approvals.openCount', { count: open.length })}
        </span>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <AnimatePresence>
          {comments.map((c) => {
            const pinIdx = comments.filter(x => x.pin && !x.resolved).findIndex(x => x.id === c.id)
            return (
              <motion.div
                key={c.id}
                ref={(el) => { if (commentRefs.current) commentRefs.current[c.id] = el }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
                  opacity: c.resolved ? 0.45 : 1,
                  background: flashId === c.id ? 'rgba(37,99,235,0.16)' : 'transparent',
                  transition: 'background 0.4s',
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: c.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#000', flexShrink: 0,
                  }}>
                    {c.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{c.author}</span>
                      <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{c.createdAt}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, margin: '0 0 8px 0' }}>{c.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.pin && !c.resolved && (
                    <span style={{
                      fontSize: 10, color: '#fff', background: c.color,
                      borderRadius: 99, padding: '1px 7px',
                      display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700,
                    }}>
                      <MapPin size={9} /> #{pinIdx + 1}
                    </span>
                  )}
                  {!c.resolved ? (
                    <button
                      onClick={() => onResolve(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'transparent', border: '1px solid var(--border-mid)',
                        borderRadius: 4, color: 'var(--txt2)', fontSize: 10, padding: '2px 8px',
                        cursor: 'pointer', marginLeft: 'auto',
                      }}
                    >
                      <CheckCheck size={9} /> {t('approvals.resolve')}
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--green)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={9} /> {t('approvals.resolved')}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Unified footer — input + actions (Melhoria 3) */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)', flexShrink: 0, background: 'var(--s1)',
        padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Pin indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pendingPin ? (
            <button
              onClick={onClearPin}
              title={t('approvals.removePin')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                fontSize: 10, fontWeight: 700, color: 'var(--blue)',
                background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: 99, padding: '2px 8px',
              }}
            >
              <MapPin size={10} /> {pendingPin.x}%, {pendingPin.y}% <X size={9} />
            </button>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={10} /> {t('approvals.noPinHint')}
            </span>
          )}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={t('approvals.addComment')}
            rows={2}
            style={{
              flex: 1, background: 'var(--s3)', border: '1px solid var(--border-mid)',
              borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--txt)',
              resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitComment() }
            }}
          />
          <button
            onClick={onSubmitComment}
            title={t('approvals.sendEnter')}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
              background: 'var(--blue)', color: '#000', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textAlign: 'center', letterSpacing: '0.03em' }}>
          {t('approvals.shortcuts')}
        </div>
      </div>
    </div>
  )
}

// ─── Reason modal — required text (Melhoria 4 / quick reject) ─────────────────

function ReasonModal({
  mode, itemName, onClose, onConfirm,
}: {
  mode: 'adjust' | 'reject'
  itemName: string
  onClose: () => void
  onConfirm: (text: string) => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const cfg = mode === 'adjust'
    ? { title: t('approvals.modal.adjustTitle'), label: t('approvals.modal.adjustLabel'), color: '#E0201A', cta: t('approvals.modal.adjustCta') }
    : { title: t('approvals.modal.rejectTitle'), label: t('approvals.modal.rejectLabel'), color: 'var(--red)', cta: t('approvals.modal.rejectCta') }
  const valid = text.trim().length > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: 440, maxWidth: '100%', background: 'var(--s1)',
          border: '1px solid var(--border-mid)', borderRadius: 14, padding: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{cfg.title}</div>
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 14 }}>{itemName}</div>

        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 6 }}>
          {cfg.label} <span style={{ color: cfg.color }}>*</span>
        </label>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t('approvals.modal.required')}
          style={{
            width: '100%', background: 'var(--s3)', border: '1px solid var(--border-mid)',
            borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--txt)',
            resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && valid) onConfirm(text.trim()) }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--border-mid)',
            }}
          >
            {t('approvals.modal.cancel')}
          </button>
          <button
            onClick={() => valid && onConfirm(text.trim())}
            disabled={!valid}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.5,
              background: cfg.color, color: '#fff', border: 'none',
            }}
          >
            {cfg.cta}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const items = useApprovalsStore((s) => s.items)
  const setStatus = useApprovalsStore((s) => s.setStatus)
  const addCommentToItem = useApprovalsStore((s) => s.addComment)
  const resolveCommentInItem = useApprovalsStore((s) => s.resolveComment)

  const [selectedId, setSelectedId] = useState<string>('')
  const [commentText, setCommentText] = useState('')
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [reasonModal, setReasonModal] = useState<{ mode: 'adjust' | 'reject'; itemId: string } | null>(null)

  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const selected = items.find((i) => i.id === selectedId) ?? items[0]

  const updateStatus = useCallback((id: string, status: ApprovalStatus) => {
    setStatus(id, status)
  }, [setStatus])

  // Switching items clears the transient pin/draft
  const switchItem = (id: string) => {
    setSelectedId(id)
    setPendingPin(null)
    setCommentText('')
  }

  const submitComment = useCallback(() => {
    const text = commentText.trim()
    if (!text || !selected) return
    const c: Comment = {
      id: `new-${Date.now()}`, author: t('approvals.you'), avatar: t('approvals.youAvatar'), color: 'var(--blue)',
      text, pin: pendingPin ?? undefined, resolved: false, createdAt: t('approvals.now'),
    }
    addCommentToItem(selected.id, c)
    setCommentText('')
    setPendingPin(null)
    toast.success(pendingPin ? t('approvals.toast.commentWithPin') : t('approvals.toast.comment'))
  }, [commentText, pendingPin, selected, addCommentToItem, t])

  const resolveComment = (id: string) => { if (selected) resolveCommentInItem(selected.id, id) }

  const handleImageClick = (x: number, y: number) => {
    setPendingPin({ x, y })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const scrollToComment = (id: string) => {
    commentRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlashId(id)
    setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1200)
  }

  const approve = useCallback((id: string) => {
    const it = items.find((i) => i.id === id)
    updateStatus(id, 'approved')
    toast.success(t('approvals.toast.approved', { name: it?.name ?? '' }))
  }, [items, updateStatus, t])

  const confirmReason = (text: string) => {
    if (!reasonModal) return
    const { mode, itemId } = reasonModal
    const it = items.find((i) => i.id === itemId)
    const note: Comment = {
      id: `sys-${Date.now()}`, author: t('approvals.you'), avatar: t('approvals.youAvatar'),
      color: mode === 'adjust' ? '#E0201A' : 'var(--red)',
      text: `${mode === 'adjust' ? t('approvals.noteAdjust') : t('approvals.noteReject')}: ${text}`,
      resolved: false, createdAt: t('approvals.now'),
    }
    addCommentToItem(itemId, note)
    if (mode === 'adjust') {
      updateStatus(itemId, 'changes')
      toast.message(t('approvals.toast.adjustRequested', { name: it?.name ?? '' }), { description: t('approvals.toast.designerNotified') })
    } else {
      updateStatus(itemId, 'rejected')
      toast.error(t('approvals.toast.rejected', { name: it?.name ?? '' }))
    }
    setReasonModal(null)
  }

  // Keyboard shortcuts (Bonus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'

      if (e.key === 'Escape') {
        if (reasonModal) setReasonModal(null)
        else if (pendingPin) setPendingPin(null)
        return
      }
      if (typing || reasonModal) return
      if (!items.length || !selected) return

      const idx = items.findIndex((i) => i.id === selectedId)
      if (e.key === 'ArrowDown') { e.preventDefault(); switchItem(items[Math.min(idx + 1, items.length - 1)].id) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); switchItem(items[Math.max(idx - 1, 0)].id) }
      else if (e.key.toLowerCase() === 'a') { if (selected.status === 'pending') approve(selected.id) }
      else if (e.key.toLowerCase() === 'r') { if (selected.status === 'pending') setReasonModal({ mode: 'adjust', itemId: selected.id }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, selectedId, reasonModal, pendingPin, selected, approve])

  return (
    <div style={{
      display: 'flex', height: '100%', background: 'var(--bg)',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      <ItemList
        items={items}
        selectedId={selectedId}
        onSelect={switchItem}
        onQuickApprove={approve}
        onQuickReject={(id) => setReasonModal({ mode: 'reject', itemId: id })}
      />

      {selected ? (
        <>
          <DetailPanel
            item={selected}
            comments={selected.comments}
            pendingPin={pendingPin}
            onImageClick={handleImageClick}
            onPinClick={scrollToComment}
            onClearPin={() => setPendingPin(null)}
            onApprove={() => approve(selected.id)}
            onReject={() => setReasonModal({ mode: 'reject', itemId: selected.id })}
            onRequestAdjust={() => setReasonModal({ mode: 'adjust', itemId: selected.id })}
          />

          <CommentPanel
            comments={selected.comments}
            commentText={commentText}
            pendingPin={pendingPin}
            flashId={flashId}
            inputRef={inputRef}
            commentRefs={commentRefs}
            onChangeText={setCommentText}
            onSubmitComment={submitComment}
            onResolve={resolveComment}
            onClearPin={() => setPendingPin(null)}
          />
        </>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10, color: 'var(--txt3)',
        }}>
          <CheckCircle2 size={28} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: 13 }}>{t('approvals.empty')}</span>
        </div>
      )}

      <AnimatePresence>
        {reasonModal && (
          <ReasonModal
            key={reasonModal.itemId + reasonModal.mode}
            mode={reasonModal.mode}
            itemName={items.find((i) => i.id === reasonModal.itemId)?.name ?? ''}
            onClose={() => setReasonModal(null)}
            onConfirm={confirmReason}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
