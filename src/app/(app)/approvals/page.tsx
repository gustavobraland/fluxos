'use client'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, RotateCcw, Film, Trophy, BarChart2, Laugh,
  ImageIcon, Trash2, History, Clock,
} from 'lucide-react'
import type { ApprovalItem, ApprovalAction } from '@/types'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import { useUserStore } from '@/store/useUserStore'
import { useTranslation } from '@/hooks/useTranslation'
import { usePermission } from '@/hooks/usePermission'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ─── Status meta ───────────────────────────────────────────────────────────────

type Status = ApprovalItem['status']

const STATUS_COLOR: Record<Status, string> = {
  pending:   'var(--yellow)',
  approved:  'var(--green)',
  rejected:  'var(--red)',
  changes:   '#E0201A',
  published: '#A78BFA',
}

const STATUS_BG: Record<Status, string> = {
  pending:   'rgba(245,200,66,0.15)',
  approved:  'rgba(62,207,142,0.15)',
  rejected:  'rgba(248,113,113,0.15)',
  changes:   'rgba(224,32,26,0.15)',
  published: 'rgba(167,139,250,0.15)',
}

const ACTION_COLOR: Record<ApprovalAction, string> = {
  approved:  'var(--green)',
  rejected:  'var(--red)',
  changes:   '#E0201A',
  published: '#A78BFA',
  deleted:   'var(--txt3)',
}

function itemIcon(emoji: string, size = 14) {
  switch (emoji) {
    case 'trophy':   return <Trophy size={size} />
    case 'laugh':    return <Laugh size={size} />
    case 'film':     return <Film size={size} />
    case 'barchart': return <BarChart2 size={size} />
    default:         return <ImageIcon size={size} />
  }
}

function StatusBadge({ status }: { status: Status }) {
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

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Reason modal (reject / adjust) ───────────────────────────────────────────

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

// ─── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel() {
  const { t } = useTranslation()
  const log = useApprovalsStore((s) => s.log)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      width: isMobile ? '100%' : 320, flexShrink: 0,
      borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
      borderTop: isMobile ? '1px solid var(--border-subtle)' : undefined,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--s1)',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <History size={14} style={{ color: 'var(--txt2)' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t('approvals.history')}</span>
        <span style={{ background: 'var(--s3)', color: 'var(--txt2)', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99, marginLeft: 'auto' }}>
          {log.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {log.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--txt3)', fontSize: 12 }}>
            {t('approvals.historyEmpty')}
          </div>
        ) : (
          log.map((e) => (
            <div key={e.id} style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: `${ACTION_COLOR[e.action]}22`, color: ACTION_COLOR[e.action],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {e.action === 'approved' ? <CheckCircle2 size={13} />
                  : e.action === 'rejected' ? <XCircle size={13} />
                  : e.action === 'changes' ? <RotateCcw size={13} />
                  : e.action === 'deleted' ? <Trash2 size={13} />
                  : <CheckCircle2 size={13} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 700 }}>{e.by}</strong>{' '}
                  <span style={{ color: ACTION_COLOR[e.action], fontWeight: 600 }}>
                    {t(`approvals.log.${e.action}`)}
                  </span>{' '}
                  <span style={{ color: 'var(--txt2)' }}>{e.itemName}</span>
                </div>
                {e.note && (
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3, fontStyle: 'italic' }}>
                    “{e.note}”
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={9} /> {formatWhen(e.at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item, canApprove, onApprove, onReject, onAdjust, onDelete,
}: {
  item: ApprovalItem
  canApprove: boolean
  onApprove: () => void
  onReject: () => void
  onAdjust: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const status = item.status
  const pending = status === 'pending'

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)', borderRadius: 12,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: STATUS_BG[status], color: STATUS_COLOR[status],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {itemIcon(item.emoji)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{item.subtitle}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Quem decidiu */}
      {item.decidedBy && (
        <div style={{
          fontSize: 11, color: 'var(--txt2)', display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: 2,
        }}>
          <span style={{ color: STATUS_COLOR[status], fontWeight: 600 }}>
            {t(`approvals.statusLabel.${status}`)}
          </span>
          <span style={{ color: 'var(--txt3)' }}>·</span>
          <span>{t('approvals.by')} <strong style={{ color: 'var(--txt)', fontWeight: 600 }}>{item.decidedBy}</strong></span>
          {item.decidedAt && (
            <>
              <span style={{ color: 'var(--txt3)' }}>·</span>
              <span style={{ color: 'var(--txt3)' }}>{formatWhen(item.decidedAt)}</span>
            </>
          )}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {pending && canApprove && (
          <>
            <button
              onClick={onApprove}
              style={btn('#000', 'var(--green)', 'var(--green)')}
            >
              <CheckCircle2 size={13} /> {t('approvals.approve')}
            </button>
            <button
              onClick={onAdjust}
              style={btn('var(--txt)', 'var(--border-mid)', 'var(--s3)')}
            >
              <RotateCcw size={13} /> {t('approvals.requestAdjust')}
            </button>
            <button
              onClick={onReject}
              style={btn('var(--red)', 'rgba(248,113,113,0.25)', 'rgba(248,113,113,0.10)')}
            >
              <XCircle size={13} /> {t('approvals.reject')}
            </button>
          </>
        )}
        {pending && !canApprove && (
          <span style={{ fontSize: 11, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={12} /> {t('approvals.noApprovePermission')}
          </span>
        )}
        {canApprove && (
          <button
            onClick={onDelete}
            title={t('approvals.delete')}
            style={{
              marginLeft: 'auto', width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--txt3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function btn(color: string, border: string, bg: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
    height: 30, padding: '0 12px', borderRadius: 7,
    fontSize: 12, fontWeight: 700, color, background: bg, border: `1px solid ${border}`,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTERS: ('all' | Status)[] = ['all', 'pending', 'approved', 'changes', 'rejected', 'published']

export default function ApprovalsPage() {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const canApprove = usePermission('content.approve')
  const items = useApprovalsStore((s) => s.items)
  const setStatus = useApprovalsStore((s) => s.setStatus)
  const removeItem = useApprovalsStore((s) => s.removeItem)
  const userName = useUserStore((s) => s.name)
  const userEmail = useUserStore((s) => s.email)
  const me = userName || userEmail || 'Você'

  const [filter, setFilter] = useState<'all' | Status>('all')
  const [reasonModal, setReasonModal] = useState<{ mode: 'adjust' | 'reject'; itemId: string } | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1
    return c
  }, [items])

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter)

  const approve = useCallback((id: string) => {
    const it = items.find((i) => i.id === id)
    setStatus(id, 'approved', me)
    toast.success(t('approvals.toast.approved', { name: it?.name ?? '' }))
  }, [items, setStatus, me, t])

  const confirmReason = (text: string) => {
    if (!reasonModal) return
    const { mode, itemId } = reasonModal
    const it = items.find((i) => i.id === itemId)
    if (mode === 'adjust') {
      setStatus(itemId, 'changes', me, text)
      toast.message(t('approvals.toast.adjustRequested', { name: it?.name ?? '' }), { description: t('approvals.toast.designerNotified') })
    } else {
      setStatus(itemId, 'rejected', me, text)
      toast.error(t('approvals.toast.rejected', { name: it?.name ?? '' }))
    }
    setReasonModal(null)
  }

  const del = (id: string) => {
    const it = items.find((i) => i.id === id)
    if (!window.confirm(t('approvals.deleteConfirm'))) return
    removeItem(id, me)
    toast.success(t('approvals.toast.deleted', { name: it?.name ?? '' }))
  }

  return (
    <div style={{
      display: 'flex', height: '100%', background: 'var(--bg)',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Main — list + filters */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>{t('approvals.title')}</span>
            <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{t('approvals.manageSubtitle')}</span>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const active = filter === f
              const count = counts[f] ?? 0
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 99, cursor: 'pointer',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    background: active ? 'var(--s3)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(37,99,235,0.4)' : 'var(--border-subtle)'}`,
                    color: active ? 'var(--txt)' : 'var(--txt3)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {t(`approvals.filters.${f}`)}
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)' }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, color: 'var(--txt3)', padding: '60px 0',
            }}>
              <CheckCircle2 size={28} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: 13 }}>{t('approvals.empty')}</span>
            </div>
          ) : (
            filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                canApprove={canApprove}
                onApprove={() => approve(item.id)}
                onAdjust={() => setReasonModal({ mode: 'adjust', itemId: item.id })}
                onReject={() => setReasonModal({ mode: 'reject', itemId: item.id })}
                onDelete={() => del(item.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* History */}
      <HistoryPanel />

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
