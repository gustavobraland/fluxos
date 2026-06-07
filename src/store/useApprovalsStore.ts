'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApprovalItem, Comment, Task } from '@/types'

interface ApprovalsState {
  items: ApprovalItem[]
  setStatus: (id: string, status: ApprovalItem['status']) => void
  addComment: (itemId: string, comment: Comment) => void
  resolveComment: (itemId: string, commentId: string) => void
  /** Adiciona uma task publicada via Pipeline como item de aprovação. Idempotente por id. */
  addFromTask: (task: Task) => void
}

export const useApprovalsStore = create<ApprovalsState>()(
  persist(
    (set) => ({
      items: [],

      setStatus: (id, status) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, status } : i)) })),

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
        set((s) => ({
          items: s.items.some((i) => i.id === item.id)
            ? s.items.map((i) => (i.id === item.id ? item : i))
            : [...s.items, item],
        }))
      },
    }),
    { name: 'flux-approvals' }
  )
)
