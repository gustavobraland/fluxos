'use client'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Clock, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Task } from '@/types'
import { usePipelineStore } from '@/store/usePipelineStore'
import { toast } from 'sonner'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

const TYPE_COLORS: Record<string, string> = {
  'Copy':          '#A78BFA',
  'Design':        '#F07B54',
  'Motion':        '#5BB8E8',
  'Copy + Design': '#F5C842',
  'Estratégia':    '#3ECF8E',
}

const PRIORITY_COLORS: Record<string, string> = {
  high:   '#F07B54',
  medium: '#F5C842',
  low:    '#5B5B7A',
}

interface Props {
  task: Task
  onCardClick?: (task: Task) => void
}

export function TaskCard({ task, onCardClick }: Props) {
  const { deleteTask } = usePipelineStore()
  const [hovering, setHovering] = useState(false)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const outerStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  }

  const typeColor = TYPE_COLORS[task.type] || 'var(--txt2)'
  const priorityColor = task.priorityLevel ? PRIORITY_COLORS[task.priorityLevel] : undefined

  return (
    <div
      ref={setNodeRef}
      style={outerStyle}
      {...attributes}
    >
      <motion.div
        whileHover={{ y: -1 }}
        onHoverStart={() => setHovering(true)}
        onHoverEnd={() => setHovering(false)}
        onClick={() => onCardClick?.(task)}
        className="rounded-xl p-3 cursor-pointer group relative"
        style={{ position: 'relative' }}
      >
        {/* Card body */}
        <div
          className="rounded-xl p-3 relative"
          style={{
            background: 'var(--s2)',
            border: `1px solid ${hovering ? 'var(--border-mid)' : 'var(--border-subtle)'}`,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: hovering ? '0 4px 16px rgba(0,0,0,.2)' : '0 1px 4px rgba(0,0,0,.1)',
          }}
        >
          {/* Top row: drag handle + type badge + priority star */}
          <div className="flex items-center gap-1.5 mb-2">
            {/* Drag handle — ONLY pointer listeners here */}
            <div
              {...listeners}
              onClick={e => e.stopPropagation()}
              className="flex items-center shrink-0"
              style={{ color: 'var(--txt3)', cursor: 'grab', padding: '1px' }}
              title="Arrastar"
            >
              <GripVertical size={11} />
            </div>

            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-[0.5px]"
              style={{ background: typeColor + '20', color: typeColor }}
            >
              {task.type}
            </span>

            {/* Priority indicator */}
            {(task.priority || task.priorityLevel === 'high') && (
              <Star
                size={10}
                className="ml-auto shrink-0"
                style={{ color: priorityColor || 'var(--yellow)', fill: priorityColor || 'var(--yellow)' }}
              />
            )}
          </div>

          {/* Title */}
          <p className="text-[12.5px] font-medium leading-snug mb-2.5" style={{ color: 'var(--txt)' }}>
            {task.title}
          </p>

          {/* Description preview */}
          {task.description && (
            <p
              className="text-[10.5px] leading-snug mb-2"
              style={{
                color: 'var(--txt3)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {task.description}
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Platforms */}
            <div className="flex gap-1">
              {task.platforms.slice(0, 4).map(p => (
                <span key={p} style={{ color: 'var(--txt3)' }} title={p}>
                  <PlatformIcon id={p} size={11} />
                </span>
              ))}
            </div>

            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Clock size={9} style={{ color: 'var(--txt3)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--txt3)' }}>
                  {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Delete on hover */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovering ? 1 : 0 }}
            onClick={(e) => {
              e.stopPropagation()
              deleteTask(task.id)
              toast.success('Task removida')
            }}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
            style={{ background: 'var(--s3)', color: 'var(--red)', border: '1px solid var(--border-subtle)' }}
          >
            <Trash2 size={9} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
