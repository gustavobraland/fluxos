'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useUserStore } from '@/store/useUserStore'

// Cor estável por nome (avatar)
const AVATAR_COLORS = ['#2563EB', '#3ECF8E', '#E0201A', '#A78BFA', '#F5C842', '#00D4B4', '#F97316', '#EC4899']
function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'FX'
}
function timeLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const messages = useChatStore(s => s.messages)
  const load = useChatStore(s => s.load)
  const send = useChatStore(s => s.send)
  const subscribe = useChatStore(s => s.subscribe)
  const unsubscribe = useChatStore(s => s.unsubscribe)
  const myEmail = useUserStore(s => s.email)

  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Carrega o histórico + Realtime (instantâneo) + polling lento de segurança (12s)
  // caso a publication de realtime não esteja habilitada.
  useEffect(() => {
    void load()
    subscribe()
    const iv = setInterval(() => { void load() }, 12000)
    return () => { clearInterval(iv); unsubscribe() }
  }, [load, subscribe, unsubscribe])

  // Auto-scroll pro fim quando chega mensagem
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const submit = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    void send(t)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>Chat da equipe</div>
        <span style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 4 }}>· canal #geral</span>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, color: 'var(--txt3)',
          }}>
            <MessageSquare size={28} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: 13 }}>Nenhuma mensagem ainda — diga olá 👋</span>
          </div>
        ) : (
          messages.map(m => {
            const name = m.user_name || m.user_email || 'Alguém'
            const mine = !!myEmail && m.user_email === myEmail
            const color = colorFor(name)
            return (
              <div key={m.id} style={{ display: 'flex', gap: 10, flexDirection: mine ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: color, color: '#fff', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {initials(name)}
                </div>
                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt2)' }}>{mine ? 'Você' : name}</span>
                    <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>{timeLabel(m.created_at)}</span>
                  </div>
                  <div style={{
                    fontSize: 13, lineHeight: 1.45, color: 'var(--txt)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: mine ? 'rgba(37,99,235,0.14)' : 'var(--s2)',
                    border: `1px solid ${mine ? 'rgba(37,99,235,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 12, padding: '8px 12px',
                  }}>
                    {m.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--s1)', padding: '12px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Mensagem para a equipe… (Enter envia, Shift+Enter quebra linha)"
            rows={1}
            style={{
              flex: 1, resize: 'none', maxHeight: 120, minHeight: 40,
              background: 'var(--s3)', border: '1px solid var(--border-mid)', borderRadius: 10,
              padding: '10px 12px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0, border: 'none',
              cursor: text.trim() ? 'pointer' : 'default', opacity: text.trim() ? 1 : 0.5,
              background: 'var(--grad)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
