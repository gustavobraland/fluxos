'use client'
import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Copy, Trash2, Pencil, Send } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { useTranslation } from '@/hooks/useTranslation'
import { CATEGORY_COLOR } from '@/types/prompts'
import type { Prompt } from '@/types/prompts'

const KNOWN_PLATFORMS = new Set([
  'instagram',
  'twitter',
  'tiktok',
  'linkedin',
  'facebook',
  'telegram',
])

interface PromptCardProps {
  prompt: Prompt
  onUse: (p: Prompt) => void
  onEdit: (p: Prompt) => void
  onDuplicate: (p: Prompt) => void
  onDelete: (p: Prompt) => void
}

export function PromptCard({ prompt, onUse, onEdit, onDuplicate, onDelete }: PromptCardProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const accent = CATEGORY_COLOR[prompt.category]

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const preview = prompt.template.split('\n').slice(0, 2).join('\n')
  const chipPlatforms = prompt.platforms.filter((p) => KNOWN_PLATFORMS.has(p.toLowerCase()))

  return (
    <div
      style={{
        background: 'var(--s1)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--txt)',
              lineHeight: 1.3,
            }}
          >
            {prompt.title}
          </div>
        </div>

        {/* Menu */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={t('prompts.card.moreOptions')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--txt2)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--s3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 4,
                minWidth: 140,
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDuplicate(prompt)
                }}
                style={menuItemStyle('var(--txt)')}
              >
                <Copy size={14} /> {t('prompts.card.duplicate')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(prompt)
                }}
                style={menuItemStyle('var(--red)')}
              >
                <Trash2 size={14} /> {t('prompts.card.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tone badge + platforms */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: accent,
            background: 'var(--s3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 20,
            padding: '2px 8px',
          }}
        >
          {prompt.tone}
        </span>
        {chipPlatforms.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--txt2)' }}>
            {chipPlatforms.map((p) => (
              <PlatformIcon key={p} id={p} size={12} />
            ))}
          </div>
        )}
      </div>

      {/* Template preview */}
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--txt2)',
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}
      >
        {preview}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <span style={{ fontSize: 10.5, color: 'var(--txt3)', marginRight: 'auto' }}>
          {t('prompts.card.used', { count: prompt.usageCount })}
        </span>
        <button
          onClick={() => onEdit(prompt)}
          style={{
            background: 'var(--s3)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--txt2)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Pencil size={13} /> {t('prompts.card.edit')}
        </button>
        <button
          onClick={() => onUse(prompt)}
          style={{
            background: 'var(--grad)',
            border: 'none',
            color: '#000',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Send size={13} /> {t('prompts.card.use')}
        </button>
      </div>
    </div>
  )
}

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'transparent',
    border: 'none',
    color,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '7px 9px',
    borderRadius: 7,
    textAlign: 'left',
  }
}
