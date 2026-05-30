'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApprovalItem, Comment } from '@/types'

// Seed data — persisted after first load, so status changes / comments survive reload.
const INITIAL_ITEMS: ApprovalItem[] = [
  {
    id: 'a1',
    name: 'Story Gol Arrascaeta',
    subtitle: 'Instagram Story · Design',
    emoji: 'trophy',
    type: 'image',
    status: 'pending',
    comments: [
      { id: 'c1', author: 'Carla M.', avatar: 'CM', color: '#5BB8E8', text: 'Ficou incrível! Só ajustar a fonte no rodapé.', pin: { x: 30, y: 80 }, resolved: false, createdAt: 'há 12 min' },
      { id: 'c2', author: 'Lucas P.', avatar: 'LP', color: '#F07B54', text: 'Aprovar assim que corrigir o detalhe da fonte.', pin: { x: 68, y: 40 }, resolved: false, createdAt: 'há 8 min' },
    ],
  },
  {
    id: 'a2',
    name: 'Meme Placar Parcial',
    subtitle: 'X / Twitter · Meme',
    emoji: 'laugh',
    type: 'image',
    status: 'approved',
    comments: [
      { id: 'c3', author: 'Ana R.', avatar: 'AR', color: '#3ECF8E', text: 'Perfeito, aprovado!', resolved: true, createdAt: 'há 25 min' },
    ],
  },
  {
    id: 'a3',
    name: 'Reel Melhores Lances',
    subtitle: 'Instagram Reels · Vídeo',
    emoji: 'film',
    type: 'video',
    status: 'pending',
    comments: [
      { id: 'c4', author: 'Thiago S.', avatar: 'TS', color: '#A78BFA', text: 'A trilha sonora precisa de licença antes de publicar.', resolved: false, createdAt: 'há 5 min' },
    ],
  },
  {
    id: 'a4',
    name: 'Infográfico Estatísticas',
    subtitle: 'Todos · Design',
    emoji: 'barchart',
    type: 'image',
    status: 'rejected',
    comments: [
      { id: 'c5', author: 'Carla M.', avatar: 'CM', color: '#5BB8E8', text: 'Dados incorretos — placar da semana passada.', pin: { x: 50, y: 55 }, resolved: false, createdAt: 'há 1h' },
    ],
  },
]

interface ApprovalsState {
  items: ApprovalItem[]
  setStatus: (id: string, status: ApprovalItem['status']) => void
  addComment: (itemId: string, comment: Comment) => void
  resolveComment: (itemId: string, commentId: string) => void
}

export const useApprovalsStore = create<ApprovalsState>()(
  persist(
    (set) => ({
      items: INITIAL_ITEMS,

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
