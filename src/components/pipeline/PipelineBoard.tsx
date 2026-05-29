'use client'
import { useState } from 'react'
import {
  DndContext, DragOverlay, rectIntersection, PointerSensor,
  useSensor, useSensors, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, SlidersHorizontal, X, Star, Clock, Tag, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { usePipelineStore } from '@/store/usePipelineStore'
import { PIPELINE_COLUMNS, PLATFORMS } from '@/lib/constants'
import { PipelineColumn } from './PipelineColumn'
import { TaskCard } from './TaskCard'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import type { Task, TaskStatus, TaskType, PlatformId } from '@/types'

const TASK_TYPES: TaskType[] = ['Copy', 'Design', 'Motion', 'Copy + Design', 'Estratégia']
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa',  color: '#5B5B7A' },
  { value: 'medium', label: 'Média',  color: '#F5C842' },
  { value: 'high',   label: 'Alta',   color: '#F07B54' },
] as const

type PriorityLevel = 'low' | 'medium' | 'high'

// ─── Backdrop ─────────────────────────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClick}
    />
  )
}

// ─── Shared field styles ───────────────────────────────────────────────────────

const fieldStyle = {
  background: 'var(--s2)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--txt)',
  fontFamily: 'Sora, sans-serif',
  outline: 'none',
}

// ─── Task Detail / Edit Modal ─────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTask, deleteTask } = usePipelineStore()

  const [title, setTitle]           = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [type, setType]             = useState<TaskType>(task.type)
  const [status, setStatus]         = useState<TaskStatus>(task.status)
  const [priorityLevel, setPriority]= useState<PriorityLevel>(task.priorityLevel ?? 'medium')
  const [dueDate, setDueDate]       = useState(task.dueDate ?? '')
  const [platforms, setPlatforms]   = useState<PlatformId[]>(task.platforms)
  const [tagsRaw, setTagsRaw]       = useState((task.tags ?? []).join(', '))

  function togglePlatform(id: PlatformId) {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function handleSave() {
    if (!title.trim()) { toast.error('Título obrigatório'); return }
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      priorityLevel,
      priority: priorityLevel === 'high',
      dueDate: dueDate || undefined,
      platforms,
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
    })
    toast.success('Task atualizada')
    onClose()
  }

  function handleDelete() {
    deleteTask(task.id)
    toast.success('Task removida')
    onClose()
  }

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[540px] rounded-2xl shadow-2xl"
        style={{ background: 'var(--s1)', border: '1px solid var(--border-mid)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Editar Task
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
          </div>
          <button
            onClick={handleDelete}
            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(248,113,113,.1)', color: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Remover task"
          >
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--s3)', color: 'var(--txt2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o contexto, briefing ou detalhes da task…"
              rows={3}
              style={{ ...fieldStyle, width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type + Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Tipo</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>Prioridade</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  style={{
                    flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: priorityLevel === opt.value ? `1px solid ${opt.color}` : '1px solid var(--border-subtle)',
                    background: priorityLevel === opt.value ? opt.color + '20' : 'var(--s2)',
                    color: priorityLevel === opt.value ? opt.color : 'var(--txt2)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.value === 'high' && <Star size={11} style={{ fill: 'currentColor' }} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date + Tags row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                Data limite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
                <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />
                Tags (separadas por vírgula)
              </label>
              <input
                value={tagsRaw}
                onChange={e => setTagsRaw(e.target.value)}
                placeholder="urgente, copa, reel"
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>Plataformas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORMS.map(p => {
                const sel = platforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    style={{
                      height: 30, padding: '0 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                      border: sel ? `1px solid ${p.color}55` : '1px solid var(--border-subtle)',
                      background: sel ? p.color + '20' : 'var(--s2)',
                      color: sel ? 'var(--txt)' : 'var(--txt2)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <PlatformIcon id={p.id} size={12} />
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 13, background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ flex: 2, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--grad)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Salvar alterações
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

function CreateTaskModal({ defaultStatus, onClose }: { defaultStatus: TaskStatus; onClose: () => void }) {
  const { addTask } = usePipelineStore()

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [type, setType]               = useState<TaskType>('Copy + Design')
  const [status, setStatus]           = useState<TaskStatus>(defaultStatus)
  const [priorityLevel, setPriority]  = useState<PriorityLevel>('medium')
  const [dueDate, setDueDate]         = useState('')
  const [platforms, setPlatforms]     = useState<PlatformId[]>(['instagram'])
  const [tagsRaw, setTagsRaw]         = useState('')

  function togglePlatform(id: PlatformId) {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function handleCreate() {
    if (!title.trim()) { toast.error('Título obrigatório'); return }
    if (platforms.length === 0) { toast.error('Selecione ao menos uma plataforma'); return }
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      priorityLevel,
      priority: priorityLevel === 'high',
      dueDate: dueDate || undefined,
      platforms,
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
    })
    toast.success('Task criada!')
    onClose()
  }

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[540px] rounded-2xl shadow-2xl"
        style={{ background: 'var(--s1)', border: '1px solid var(--border-mid)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', margin: 0, flex: 1 }}>Nova Task</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--s3)', color: 'var(--txt2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Título *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ex: Post Flamengo pré-jogo"
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefing, contexto ou detalhes importantes…"
              rows={3}
              style={{ ...fieldStyle, width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as TaskType)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}>
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Status inicial</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}>
                {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>Prioridade</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  style={{
                    flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: priorityLevel === opt.value ? `1px solid ${opt.color}` : '1px solid var(--border-subtle)',
                    background: priorityLevel === opt.value ? opt.color + '20' : 'var(--s2)',
                    color: priorityLevel === opt.value ? opt.color : 'var(--txt2)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.value === 'high' && <Star size={11} style={{ fill: 'currentColor' }} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Data limite</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Tags</label>
              <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="urgente, copa…"
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>Plataformas *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORMS.map(p => {
                const sel = platforms.includes(p.id)
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    style={{
                      height: 30, padding: '0 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                      border: sel ? `1px solid ${p.color}55` : '1px solid var(--border-subtle)',
                      background: sel ? p.color + '20' : 'var(--s2)',
                      color: sel ? 'var(--txt)' : 'var(--txt2)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    <PlatformIcon id={p.id} size={12} />
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 13, background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleCreate} style={{ flex: 2, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--grad)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Criar Task
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Board ─────────────────────────────────────────────────────────────────────

export function PipelineBoard() {
  const { tasks, moveTask } = usePipelineStore()
  const [activeTask, setActiveTask]   = useState<Task | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('backlog')
  const [editTask, setEditTask]       = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByStatus = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find(t => t.id === active.id) || null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    const task = tasks.find(t => t.id === active.id)
    if (!task) return

    const colIds = PIPELINE_COLUMNS.map(c => c.id)
    if (colIds.includes(over.id as TaskStatus)) {
      if (task.status !== over.id) {
        moveTask(task.id, over.id as TaskStatus)
        toast.success(`Movido para ${PIPELINE_COLUMNS.find(c => c.id === over.id)?.label}`)
      }
      return
    }

    const overTask = tasks.find(t => t.id === over.id)
    if (overTask && overTask.status !== task.status) {
      moveTask(task.id, overTask.status)
      toast.success(`Movido para ${PIPELINE_COLUMNS.find(c => c.id === overTask.status)?.label}`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--txt)' }}>Pipeline</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--s2)', color: 'var(--txt3)' }}>
            {tasks.length} tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] hover:bg-[var(--s2)] transition-colors" style={{ color: 'var(--txt2)' }}>
            <Filter size={12} /> Filtrar
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] hover:bg-[var(--s2)] transition-colors" style={{ color: 'var(--txt2)' }}>
            <SlidersHorizontal size={12} /> Ordenar
          </button>
          <button
            onClick={() => { setCreateStatus('backlog'); setShowCreate(true) }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] text-white font-medium"
            style={{ background: 'var(--grad)' }}
          >
            <Plus size={13} /> Nova Task
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            defaultStatus={createStatus}
            onClose={() => setShowCreate(false)}
          />
        )}
        {editTask && (
          <TaskDetailModal
            task={editTask}
            onClose={() => setEditTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full p-5 min-w-max">
            {PIPELINE_COLUMNS.map(col => (
              <PipelineColumn
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id] || []}
                onAddTask={() => { setCreateStatus(col.id); setShowCreate(true) }}
                onTaskClick={setEditTask}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
