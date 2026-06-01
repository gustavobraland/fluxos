'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApprovalItem, Comment } from '@/types'

interface ApprovalsState {
  items: ApprovalItem[]
  setStatus: (id: string, status: ApprovalItem['status']) => void
  addComment: (itemId: string, comment: Comment) => void
  resolveComment: (itemId: string, commentId: string) => void
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
    }),
    { name: 'flux-approvals' }
  )
)
