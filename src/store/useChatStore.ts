'use client'
import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { sbSelect, sbInsert } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
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
  subscribe: () => void
  unsubscribe: () => void
}

const WS = 'braland'

// Canal Realtime (instantâneo). Fora do store p/ não recriar entre renders.
let channel: RealtimeChannel | null = null

// Acrescenta uma mensagem evitando duplicar e substituindo o "otimista" (tmp-).
function appendMessage(set: (fn: (s: ChatState) => Partial<ChatState>) => void, m: ChatMessage) {
  set((s) => {
    if (s.messages.some(x => x.id === m.id)) return {}
    const cleaned = s.messages.filter(
      x => !(x.id.startsWith('tmp-') && x.text === m.text && x.user_email === m.user_email),
    )
    return { messages: [...cleaned, m].slice(-300) }
  })
}

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
    // O Realtime entrega a linha real e substitui o otimista; sem realtime,
    // o polling de segurança reconcilia.
  },

  // Realtime: novas mensagens chegam na hora via Supabase Realtime.
  subscribe: () => {
    if (channel) return
    try {
      const supabase = createClient()
      channel = supabase
        .channel(`chat:${WS}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `workspace_id=eq.${WS}` },
          (payload) => appendMessage(set, payload.new as ChatMessage),
        )
        .subscribe()
    } catch (e) {
      console.warn('[chat] realtime indisponível, usando polling:', e)
    }
  },

  unsubscribe: () => {
    if (channel) { try { channel.unsubscribe() } catch { /* ok */ } channel = null }
  },
}))
