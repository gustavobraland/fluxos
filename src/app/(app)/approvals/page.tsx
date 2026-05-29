'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, Film, Trophy, BarChart2, Laugh, MessageSquare, MapPin, CheckCheck } from 'lucide-react'
import type { ApprovalItem, Comment } from '@/types'

// ─── Static Data ──────────────────────────────────────────────────────────────

const INITIAL_ITEMS: ApprovalItem[] = [
  {
    id: 'a1',
    name: 'Story Gol Arrascaeta',
    subtitle: 'Instagram Story · Design',
    emoji: 'trophy',
    type: 'image',
    status: 'pending',
    comments: [
      {
        id: 'c1',
        author: 'Carla M.',
        avatar: 'CM',
        color: '#5BB8E8',
        text: 'Ficou incrível! Só ajustar a fonte no rodapé.',
        pin: { x: 30, y: 80 },
        resolved: false,
        createdAt: 'há 12 min',
      },
      {
        id: 'c2',
        author: 'Lucas P.',
        avatar: 'LP',
        color: '#F07B54',
        text: 'Aprovar assim que corrigir o detalhe da fonte.',
        resolved: false,
        createdAt: 'há 8 min',
      },
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
      {
        id: 'c3',
        author: 'Ana R.',
        avatar: 'AR',
        color: '#3ECF8E',
        text: 'Perfeito, aprovado!',
        resolved: true,
        createdAt: 'há 25 min',
      },
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
      {
        id: 'c4',
        author: 'Thiago S.',
        avatar: 'TS',
        color: '#A78BFA',
        text: 'A trilha sonora precisa de licença antes de publicar.',
        resolved: false,
        createdAt: 'há 5 min',
      },
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
      {
        id: 'c5',
        author: 'Carla M.',
        avatar: 'CM',
        color: '#5BB8E8',
        text: 'Dados incorretos — placar da semana passada.',
        resolved: false,
        createdAt: 'há 1h',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending:  'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending:  'var(--yellow)',
  approved: 'var(--green)',
  rejected: 'var(--red)',
}

const STATUS_BG: Record<ApprovalStatus, string> = {
  pending:  'rgba(245,200,66,0.15)',
  approved: 'rgba(62,207,142,0.15)',
  rejected: 'rgba(248,113,113,0.15)',
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

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      style={{
        background: STATUS_BG[status],
        color: STATUS_COLOR[status],
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 99,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function ItemList({
  items,
  selectedId,
  onSelect,
}: {
  items: ApprovalItem[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Aprovações</span>
        <span
          style={{
            background: 'var(--s3)',
            color: 'var(--txt2)',
            fontSize: 11,
            fontWeight: 600,
            padding: '1px 7px',
            borderRadius: 99,
          }}
        >
          {items.length}
        </span>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {items.map((item) => {
          const active = item.id === selectedId
          const pendingComments = item.comments.filter(c => !c.resolved).length
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: active ? 'var(--s2)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontFamily: 'Sora, sans-serif',
                transition: 'background 0.15s',
              }}
            >
              {/* Type icon */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: active ? 'var(--s3)' : 'var(--s2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: STATUS_COLOR[item.status],
                }}
              >
                {getItemIcon(item.emoji)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: active ? 'var(--txt)' : 'var(--txt2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 3,
                  }}
                >
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 5 }}>
                  {item.subtitle}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge status={item.status} />
                  {pendingComments > 0 && (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--txt3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      <MessageSquare size={9} />
                      {pendingComments}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Center Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  onApprove,
  onReject,
}: {
  item: ApprovalItem
  onApprove: () => void
  onReject: () => void
}) {
  const steps = [
    { label: 'Criação',          done: true },
    { label: 'Revisão interna',  done: item.status !== 'pending' },
    { label: 'Aprovação final',  done: item.status === 'approved' },
  ]

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: STATUS_BG[item.status],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: STATUS_COLOR[item.status],
            flexShrink: 0,
          }}
        >
          {getItemIcon(item.emoji)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{item.subtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Info rows */}
        <div style={{
          background: 'var(--s2)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {[
            { label: 'Tipo de conteúdo', value: item.type === 'video' ? 'Vídeo' : 'Imagem' },
            { label: 'Canal', value: item.subtitle.split('·')[0].trim() },
            { label: 'Formato', value: item.subtitle.split('·')[1]?.trim() ?? '—' },
            { label: 'Status atual', value: STATUS_LABEL[item.status] },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--txt3)', flex: '0 0 160px' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Progress tracker */}
        <div
          style={{
            background: 'var(--s2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Fluxo de aprovação
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step.done ? 'var(--green)' : 'var(--s3)',
                      border: `2px solid ${step.done ? 'var(--green)' : 'var(--border-mid)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {step.done
                      ? <CheckCheck size={12} style={{ color: '#000' }} />
                      : <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 700 }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ fontSize: 10, color: step.done ? 'var(--txt)' : 'var(--txt3)', whiteSpace: 'nowrap' }}>
                    {step.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: step.done ? 'var(--green)' : 'var(--border-subtle)',
                      margin: '0 4px',
                      marginBottom: 18,
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          background: 'var(--s1)',
        }}
      >
        <button
          onClick={onReject}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(248,113,113,0.10)',
            color: 'var(--red)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          <XCircle size={14} />
          Rejeitar
        </button>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--s3)',
            color: 'var(--txt)',
            border: '1px solid var(--border-mid)',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          <RotateCcw size={14} />
          Solicitar revisão
        </button>
        <button
          onClick={onApprove}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--green)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
            marginLeft: 'auto',
          }}
        >
          <CheckCircle2 size={14} />
          Aprovar
        </button>
      </div>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function CommentPanel({ item }: { item: ApprovalItem }) {
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(item.comments)

  // Reset when item changes
  const [lastId, setLastId] = useState(item.id)
  if (item.id !== lastId) {
    setLastId(item.id)
    setComments(item.comments)
  }

  function handleComment() {
    const text = commentText.trim()
    if (!text) return
    const newComment: Comment = {
      id: `new-${Date.now()}`,
      author: 'Você',
      avatar: 'VC',
      color: 'var(--blue)',
      text,
      resolved: false,
      createdAt: 'agora',
    }
    setComments((prev) => [...prev, newComment])
    setCommentText('')
    toast.success('Comentário adicionado')
  }

  function handleResolve(id: string) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)))
  }

  const open = comments.filter(c => !c.resolved)
  const resolved = comments.filter(c => c.resolved)

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <MessageSquare size={14} style={{ color: 'var(--txt2)' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Comentários</span>
        <span
          style={{
            background: open.length > 0 ? 'rgba(245,200,66,.18)' : 'var(--s3)',
            color: open.length > 0 ? 'var(--yellow)' : 'var(--txt2)',
            fontSize: 11,
            fontWeight: 600,
            padding: '1px 7px',
            borderRadius: 99,
          }}
        >
          {open.length} abertos
        </span>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <AnimatePresence>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                opacity: c.resolved ? 0.45 : 1,
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000',
                    flexShrink: 0,
                  }}
                >
                  {c.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{c.createdAt}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                {c.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.pin && (
                  <span style={{ fontSize: 10, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={9} />
                    Pin na imagem
                  </span>
                )}
                {!c.resolved ? (
                  <button
                    onClick={() => handleResolve(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      border: '1px solid var(--border-mid)',
                      borderRadius: 4,
                      color: 'var(--txt2)',
                      fontSize: 10,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontFamily: 'Sora, sans-serif',
                      marginLeft: 'auto',
                    }}
                  >
                    <CheckCheck size={9} />
                    Resolver
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--green)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={9} />
                    Resolvido
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
          background: 'var(--s1)',
        }}
      >
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Adicionar comentário… (Ctrl+Enter para enviar)"
          rows={3}
          style={{
            width: '100%',
            background: 'var(--s3)',
            border: '1px solid var(--border-mid)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            color: 'var(--txt)',
            fontFamily: 'Sora, sans-serif',
            resize: 'none',
            outline: 'none',
            marginBottom: 8,
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment()
          }}
        />
        <button
          onClick={handleComment}
          style={{
            width: '100%',
            background: 'var(--blue)',
            color: '#000',
            border: 'none',
            borderRadius: 7,
            padding: '7px 0',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <MessageSquare size={12} />
          Comentar
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>(INITIAL_ITEMS)
  const [selectedId, setSelectedId] = useState(INITIAL_ITEMS[0].id)

  const selected = items.find((i) => i.id === selectedId) ?? items[0]

  function updateStatus(id: string, status: ApprovalStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  function handleApprove() {
    updateStatus(selected.id, 'approved')
    toast.success(`"${selected.name}" aprovado!`)
  }

  function handleReject() {
    updateStatus(selected.id, 'rejected')
    toast.error(`"${selected.name}" rejeitado.`)
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <ItemList items={items} selectedId={selectedId} onSelect={setSelectedId} />
      <DetailPanel item={selected} onApprove={handleApprove} onReject={handleReject} />
      <CommentPanel item={selected} />
    </div>
  )
}
