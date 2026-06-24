'use client'
import { create } from 'zustand'
import { sbSelect, sbInsert } from '@/lib/supabase'
import { useUserStore } from '@/store/useUserStore'

export interface ChatMessage {
  id: string
  user_email: string | null
  user_name: string | null
  text: string
  created_at: string
}

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  load: () => Promise<void>
  send: (text: string) => Promise<void>
}

const WS = 'braland'

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  load: async () => {
    if (get().loading) return
    set({ loading: true })
    const rows = await sbSelect<ChatMessage>('chat_messages', {
      filters: { workspace_id: WS },
      order: 'created_at.asc',
    })
    // mantém só as 300 mais recentes em memória
    set({ messages: rows.slice(-300), loading: false })
  },

  send: async (text) => {
    const t = text.trim()
    if (!t) return
    const u = useUserStore.getState()
    const name = u.name ?? u.email ?? 'Você'
    // Atualização otimista
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      user_email: u.email,
      user_name: name,
      text: t,
      created_at: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, optimistic] }))
    await sbInsert('chat_messages', {
      workspace_id: WS,
      user_email: u.email,
      user_name: name,
      text: t,
    })
    // Recarrega para pegar a linha real + mensagens de outros
    await get().load()
  },
}))
