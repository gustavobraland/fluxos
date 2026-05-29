'use client'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/types'

interface Props {
  column: { id: TaskStatus; label: string; color: string }
  tasks: Task[]
  onAddTask?: () => void
  onTaskClick?: (task: Task) => void
}

export function PipelineColumn({ column, tasks, onAddTask, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col shrink-0 w-[224px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--txt)' }}>{column.label}</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'var(--s2)', color: 'var(--txt3)' }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--s2)] transition-colors"
          style={{ color: 'var(--txt3)' }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Drop zone */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 min-h-[120px] rounded-xl transition-colors"
          style={{
            background: isOver ? column.color + '10' : 'transparent',
            border: isOver ? `1px dashed ${column.color}40` : '1px solid transparent',
          }}
        >
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 rounded-xl text-center"
              style={{ color: 'var(--txt3)' }}
            >
              <div className="text-2xl mb-1 opacity-20">◻</div>
              <span className="text-[11px]">Solte aqui</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onCardClick={onTaskClick} />
              ))}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
