'use client'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'

export interface SwipeAction {
  icon?: React.ReactNode
  label: string
  color: string
  onAction: () => void
}

interface SwipeableCardProps {
  children: React.ReactNode
  /** Revelada ao arrastar para a DIREITA → (verde: aprovar/publicar/detalhes). */
  rightAction?: SwipeAction
  /** Revelada ao arrastar para a ESQUERDA ← (vermelho: mover/rejeitar). */
  leftAction?: SwipeAction
  threshold?: number
}

/**
 * Card com ações por swipe (uso com o polegar, sem abrir o card).
 * Arrastar além do threshold dispara a ação; senão, volta à origem.
 */
export function SwipeableCard({ children, rightAction, leftAction, threshold = 90 }: SwipeableCardProps) {
  const x = useMotionValue(0)

  // Fundo esquerdo aparece ao arrastar p/ direita; direito ao arrastar p/ esquerda.
  const leftOpacity = useTransform(x, [0, threshold], [0, 1])
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (rightAction && info.offset.x > threshold) rightAction.onAction()
    else if (leftAction && info.offset.x < -threshold) leftAction.onAction()
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      {rightAction && (
        <motion.div
          style={{ opacity: leftOpacity, background: rightAction.color }}
          className="absolute inset-y-0 left-0 flex items-center gap-2 px-5 text-white font-semibold text-[13px]"
        >
          {rightAction.icon} {rightAction.label}
        </motion.div>
      )}
      {leftAction && (
        <motion.div
          style={{ opacity: rightOpacity, background: leftAction.color }}
          className="absolute inset-y-0 right-0 flex items-center justify-end gap-2 px-5 text-white font-semibold text-[13px]"
        >
          {leftAction.label} {leftAction.icon}
        </motion.div>
      )}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragSnapToOrigin
        dragDirectionLock
        onDragEnd={onDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}
