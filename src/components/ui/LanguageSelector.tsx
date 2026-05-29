'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check, ShieldAlert } from 'lucide-react'
import { useI18nStore, SUPPORTED_LOCALES } from '@/store/useI18nStore'
import { useTranslation } from '@/hooks/useTranslation'

export function LanguageSelector() {
  const { locale, directorMode, setLocale, toggleDirectorMode } = useI18nStore()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = SUPPORTED_LOCALES.find(l => l.id === locale) ?? SUPPORTED_LOCALES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={t('languageSelector.label')}
        className="flex items-center gap-1.5 h-8 px-2 rounded-lg transition-colors hover:bg-[var(--s2)]"
        style={{
          color: directorMode ? 'var(--blue)' : 'var(--txt2)',
          border: directorMode ? '1px solid rgba(91,184,232,.3)' : '1px solid transparent',
          background: directorMode ? 'rgba(91,184,232,.08)' : 'transparent',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>
          {directorMode ? t('languageSelector.directorModeOn') : current.nativeLabel}
        </span>
        <ChevronDown
          size={10}
          style={{
            color: 'var(--txt3)',
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 200,
              background: 'var(--s2)',
              border: '1px solid var(--border-mid)',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,.3)',
              overflow: 'hidden',
              zIndex: 200,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '8px 12px 6px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--txt3)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {t('languageSelector.label')}
            </div>

            {/* Language options */}
            <div style={{ padding: '4px 0' }}>
              {SUPPORTED_LOCALES.map(l => {
                const isActive = locale === l.id && !directorMode
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      setLocale(l.id)
                      if (directorMode) useI18nStore.getState().setDirectorMode(false)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-[var(--s3)]"
                    style={{ color: isActive ? 'var(--txt)' : 'var(--txt2)' }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{l.flag}</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>
                        {l.nativeLabel}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{l.label}</div>
                    </div>
                    {isActive && <Check size={12} style={{ color: 'var(--blue)', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>

            {/* Director Mode divider */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '4px 0' }}>
              <button
                onClick={() => {
                  toggleDirectorMode()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-[var(--s3)]"
                style={{ color: directorMode ? 'var(--blue)' : 'var(--txt2)' }}
              >
                <ShieldAlert size={13} style={{ color: directorMode ? 'var(--blue)' : 'var(--txt3)', flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: directorMode ? 600 : 400 }}>
                    {t('languageSelector.directorMode')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
                    {t('languageSelector.directorModeDesc')}
                  </div>
                </div>
                {/* Toggle pill */}
                <div
                  style={{
                    width: 28, height: 16, borderRadius: 99,
                    background: directorMode ? 'var(--blue)' : 'var(--s4)',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 1, left: directorMode ? 13 : 1,
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
