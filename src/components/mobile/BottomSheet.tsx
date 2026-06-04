'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Conteúdo fixo no rodapé (ex.: botão de submit) — sobe acima do teclado. */
  footer?: React.ReactNode
  height?: 'auto' | 'half' | 'full'
}

/**
 * Folha que sobe de baixo. Fecha ao tocar no overlay ou arrastar o handle p/ baixo.
 * O rodapé (footer) respeita a safe-area do iPhone e sobe acima do teclado virtual
 * via visualViewport — o botão de submit nunca fica escondido.
 */
export function BottomSheet({ isOpen, onClose, title, children, footer, height = 'auto' }: BottomSheetProps) {
  const [kb, setKb] = useState(0)

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop
      setKb(Math.max(0, Math.round(overlap)))
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    onResize()
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
      setKb(0)
    }
  }, [isOpen])

  const maxHeight = height === 'full' ? '95dvh' : height === 'half' ? '62dvh' : '90dvh'

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className="fixed left-0 right-0 bottom-0 z-[101] flex flex-col rounded-t-2xl"
            style={{
              background: 'var(--s1)',
              borderTop: '1px solid var(--border-mid)',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.3)',
              maxHeight,
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-mid)' }} />
            </div>

            {title && (
              <div className="px-5 pb-2 shrink-0 text-[16px] font-bold" style={{ color: 'var(--txt)' }}>
                {title}
              </div>
            )}

            <div className="overflow-y-auto px-5 pb-2" style={{ flex: 1 }}>
              {children}
            </div>

            {footer ? (
              <div
                className="px-5 pt-3 shrink-0 border-t"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--s1)',
                  paddingBottom: `calc(env(safe-area-inset-bottom) + 12px + ${kb}px)`,
                }}
              >
                {footer}
              </div>
            ) : (
              <div className="shrink-0" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + ${kb}px)` }} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
