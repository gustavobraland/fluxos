'use client'
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const CHIPS = ['Caption', 'Hashtags', 'Agendar', 'Reescrever', 'Thread']

export function AIBar() {
  const { aiBarOpen, closeAiBar } = useAppStore()
  const [val, setVal] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!val.trim() && !activeChip) return
    setLoading(true)
    setResult('')
    await new Promise(r => setTimeout(r, 1200))
    setResult(`✦ Resultado gerado para "${activeChip || val}": Post criado com sucesso! Engajamento estimado: alto ↑`)
    setLoading(false)
    setVal('')
  }

  return (
    <AnimatePresence>
      {aiBarOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-[640px] px-4"
        >
          <div
            className="rounded-[20px] overflow-hidden shadow-2xl"
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--border-mid)',
              boxShadow: '0 24px 80px rgba(0,0,0,.6)',
            }}
          >
            {/* Result area */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pt-3 pb-2 text-[13px]"
                  style={{ color: 'var(--txt2)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {result}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chips */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-0 flex-wrap">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setActiveChip(activeChip === chip ? null : chip)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    background: activeChip === chip ? 'var(--grad-soft)' : 'var(--s2)',
                    color: activeChip === chip ? 'var(--blue)' : 'var(--txt2)',
                    border: `1px solid ${activeChip === chip ? 'rgba(91,184,232,.3)' : 'transparent'}`,
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* AI icon */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[14px] shrink-0 font-bold"
                style={{ background: 'var(--grad)' }}
              >
                ✦
              </div>

              <input
                ref={inputRef}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder={activeChip ? `Gerar ${activeChip.toLowerCase()} para…` : 'Descreva o que a IA deve criar…'}
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: 'var(--txt)' }}
                autoFocus
              />

              {/* Loading spinner or Send */}
              <button
                onClick={handleSend}
                disabled={loading}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
                style={{ background: loading ? 'var(--s2)' : 'var(--grad)' }}
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={12} className="text-white" />
                )}
              </button>

              {/* Close */}
              <button onClick={closeAiBar} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--s2)] transition-colors shrink-0" style={{ color: 'var(--txt3)' }}>
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
