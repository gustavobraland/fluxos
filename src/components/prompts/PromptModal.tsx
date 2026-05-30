'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { PROMPT_CATEGORIES } from '@/types/prompts'
import type { Prompt, PromptCategory } from '@/types/prompts'

export interface PromptModalData {
  title: string
  category: PromptCategory
  tone: string
  template: string
  platforms: string[]
  tags: string[]
}

interface PromptModalProps {
  open: boolean
  initial?: Prompt | null
  onClose: () => void
  onSave: (data: PromptModalData) => void
}

const PLATFORM_OPTIONS = ['instagram', 'twitter', 'tiktok', 'facebook', 'telegram']

export function PromptModal({ open, initial, onClose, onSave }: PromptModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<PromptCategory>('custom')
  const [tone, setTone] = useState('')
  const [template, setTemplate] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initial?.title ?? '')
    setCategory(initial?.category ?? 'custom')
    setTone(initial?.tone ?? '')
    setTemplate(initial?.template ?? '')
    setPlatforms(initial?.platforms ?? [])
    setTags(initial?.tags ?? [])
    setTagInput('')
  }, [open, initial])

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const commitTag = () => {
    const parts = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (parts.length) {
      setTags((prev) => Array.from(new Set([...prev, ...parts])))
    }
    setTagInput('')
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const canSave = title.trim().length > 0 && template.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      category,
      tone: tone.trim(),
      template,
      platforms,
      tags,
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
                {initial ? 'Editar prompt' : 'Novo prompt'}
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--txt2)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 2,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Título */}
              <Field label="Título">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Gol dramático nos acréscimos"
                  style={inputStyle}
                />
              </Field>

              {/* Categoria + Tom */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Categoria">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PromptCategory)}
                      style={inputStyle}
                    >
                      {PROMPT_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Tom">
                    <input
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Ex: Eufórico"
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>

              {/* Plataformas */}
              <Field label="Plataformas">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORM_OPTIONS.map((p) => {
                    const active = platforms.includes(p)
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: active ? 'var(--grad-soft)' : 'var(--s3)',
                          border: `1px solid ${active ? 'var(--blue)' : 'var(--border-subtle)'}`,
                          color: active ? 'var(--txt)' : 'var(--txt2)',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: active ? 600 : 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        <PlatformIcon id={p} size={13} />
                        {p}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Template */}
              <Field label="Template">
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={8}
                  placeholder="Conteúdo do prompt..."
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'JetBrains Mono, monospace',
                    lineHeight: 1.5,
                    minHeight: 140,
                  }}
                />
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5 }}>
                  Use {'{{variavel}}'} para campos dinâmicos
                </div>
              </Field>

              {/* Tags */}
              <Field label="Tags">
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'var(--s3)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--txt2)',
                          borderRadius: 20,
                          padding: '3px 8px',
                          fontSize: 11.5,
                        }}
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label={`Remover ${t}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--txt2)',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      commitTag()
                    }
                  }}
                  onBlur={commitTag}
                  placeholder="Digite e pressione Enter ou vírgula"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '14px 20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: 'var(--s3)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--txt2)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  background: 'var(--grad)',
                  border: 'none',
                  color: '#000',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  opacity: canSave ? 1 : 0.5,
                }}
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--txt2)',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--s2)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '9px 11px',
  fontSize: 13,
  color: 'var(--txt)',
  outline: 'none',
  fontFamily: 'inherit',
}
