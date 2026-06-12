'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApprovalItem, ApprovalLogEntry, ApprovalAction, Comment, Task } from '@/types'

interface ApprovalsState {
  items: ApprovalItem[]
  /** Histórico de auditoria (quem aprovou/rejeitou/excluiu, quando) — mais recente primeiro. */
  log: ApprovalLogEntry[]
  /** Decide o status registrando autor + carimbo de tempo + entrada no histórico. */
  setStatus: (id: string, status: ApprovalItem['status'], by?: string, note?: string) => void
  addComment: (itemId: string, comment: Comment) => void
  resolveComment: (itemId: string, commentId: string) => void
  /** Remove um item e registra a exclusão no histórico. */
  removeItem: (id: string, by?: string) => void
  /** Adiciona uma task publicada via Pipeline como item de aprovação. Idempotente por id. */
  addFromTask: (task: Task) => void
}

function logEntry(item: ApprovalItem, action: ApprovalAction, by: string, note?: string): ApprovalLogEntry {
  return {
    id: `log-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    itemId: item.id,
    itemName: item.name,
    action,
    by: by || 'Sistema',
    at: new Date().toISOString(),
    note,
  }
}

// Status que correspondem a uma ação de auditoria (pending não gera log).
const STATUS_ACTION: Partial<Record<ApprovalItem['status'], ApprovalAction>> = {
  approved: 'approved',
  rejected: 'rejected',
  changes: 'changes',
  published: 'published',
}

export const useApprovalsStore = create<ApprovalsState>()(
  persist(
    (set) => ({
      items: [],
      log: [],

      setStatus: (id, status, by = 'Sistema', note) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id)
          if (!item) return s
          const decided = status !== 'pending'
          const action = STATUS_ACTION[status]
          return {
            items: s.items.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status,
                    decidedBy: decided ? by : undefined,
                    decidedAt: decided ? new Date().toISOString() : undefined,
                  }
                : i
            ),
            log: action ? [logEntry(item, action, by, note), ...s.log].slice(0, 200) : s.log,
          }
        }),

      addComment: (itemId, comment) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === itemId ? { ...i, comments: [...i.comments, comment] } : i)),
        })),

      resolveComment: (itemId, commentId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === itemId
              ? { ...i, comments: i.comments.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)) }
              : i
          ),
        })),

      removeItem: (id, by = 'Sistema') =>
        set((s) => {
          const item = s.items.find((i) => i.id === id)
          return {
            items: s.items.filter((i) => i.id !== id),
            log: item ? [logEntry(item, 'deleted', by), ...s.log].slice(0, 200) : s.log,
          }
        }),

      addFromTask: (task) => {
        const now = new Date().toISOString()
        const platformList = task.platforms.slice(0, 3).join(', ')
        const dateStr = new Date(now).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const item: ApprovalItem = {
          id: `task-${task.id}`,
          name: task.title,
          subtitle: `${task.type}${platformList ? ' · ' + platformList : ''} · Publicado em ${dateStr}`,
          emoji: '✅',
          type: 'image',
          status: 'published',
          comments: [],
          taskId: task.id,
          publishedAt: now,
        }
        set((s) => {
          const exists = s.items.some((i) => i.id === item.id)
          return {
            items: exists
              ? s.items.map((i) => (i.id === item.id ? { ...item, decidedBy: i.decidedBy, decidedAt: i.decidedAt } : i))
              : [...s.items, item],
            log: exists ? s.log : [logEntry(item, 'published', task.assignees?.[0] ?? 'Sistema'), ...s.log].slice(0, 200),
          }
        })
      },
    }),
    { name: 'flux-approvals' }
  )
)
