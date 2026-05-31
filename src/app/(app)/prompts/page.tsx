'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { usePromptsStore } from '@/store/usePromptsStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useTranslation } from '@/hooks/useTranslation'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptModal, type PromptModalData } from '@/components/prompts/PromptModal'
import { PROMPT_CATEGORIES } from '@/types/prompts'
import type { Prompt, PromptCategory } from '@/types/prompts'

type Filter = 'all' | PromptCategory

export default function PromptsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const prompts = usePromptsStore((s) => s.prompts)
  const addPrompt = usePromptsStore((s) => s.addPrompt)
  const updatePrompt = usePromptsStore((s) => s.updatePrompt)
  const deletePrompt = usePromptsStore((s) => s.deletePrompt)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Prompt | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return prompts.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.tone.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [prompts, search, filter])

  const handleUse = (p: Prompt) => {
    const template = usePromptsStore.getState().usePrompt(p.id)
    useMultipostStore.getState().setDraft({
      caption: template,
      platforms: p.platforms,
      scheduledAt: null,
      source: 'prompt',
    })
    toast.success(t('prompts.toast.loaded'))
    router.push('/multipost')
  }

  const handleNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (p: Prompt) => {
    setEditing(p)
    setModalOpen(true)
  }

  const handleDuplicate = (p: Prompt) => {
    addPrompt({
      title: `${p.title} ${t('prompts.copySuffix')}`,
      category: p.category,
      tone: p.tone,
      template: p.template,
      platforms: [...p.platforms],
      tags: [...p.tags],
      createdBy: p.createdBy,
    })
    toast.success(t('prompts.toast.duplicated'))
  }

  const handleDelete = (p: Prompt) => {
    deletePrompt(p.id)
    toast.success(t('prompts.toast.deleted'))
  }

  const handleSave = (data: PromptModalData) => {
    if (editing) {
      updatePrompt(editing.id, data)
      toast.success(t('prompts.toast.updated'))
    } else {
      addPrompt({ ...data, createdBy: t('prompts.createdBy') })
      toast.success(t('prompts.toast.created'))
    }
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          background: 'var(--s1)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--txt2)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('prompts.searchPlaceholder')}
            style={{
              width: '100%',
              background: 'var(--s2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              color: 'var(--txt)',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={handleNew}
          style={{
            marginLeft: 'auto',
            background: 'var(--grad)',
            border: 'none',
            color: '#000',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Plus size={15} /> {t('prompts.new')}
        </button>
      </div>

      {/* Category pills */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          flexShrink: 0,
          background: 'var(--s1)',
        }}
        className="no-scrollbar"
      >
        {([{ id: 'all' }, ...PROMPT_CATEGORIES.map((c) => ({ id: c.id }))] as { id: Filter }[]).map(
          (c) => {
            const active = filter === c.id
            const label = c.id === 'all' ? t('prompts.filterAll') : t(`prompts.categories.${c.id}`)
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                style={{
                  background: active ? 'var(--blue)' : 'var(--s3)',
                  color: active ? '#000' : 'var(--txt2)',
                  border: active ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            )
          }
        )}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--txt2)',
              padding: '60px 0',
              fontSize: 14,
            }}
          >
            {t('prompts.empty')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {filtered.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onUse={handleUse}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <PromptModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
