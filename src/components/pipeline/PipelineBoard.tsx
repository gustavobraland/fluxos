'use client'
import { useState, useEffect } from 'react'
import {
  DndContext, DragOverlay, pointerWithin, rectIntersection, PointerSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent, type CollisionDetection,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, SlidersHorizontal, X, Clock, Tag, Trash2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePipelineStore } from '@/store/usePipelineStore'
import { PIPELINE_COLUMNS, PLATFORMS } from '@/lib/constants'
import { TEAM, ROLE_LABELS } from '@/lib/onboarding-config'
import { PipelineColumn } from './PipelineColumn'
import { TaskCard } from './TaskCard'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { useTranslation } from '@/hooks/useTranslation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PipelineMobile } from './PipelineMobile'
import type { Task, TaskStatus, TaskType, PlatformId } from '@/types'

const TASK_TYPES: TaskType[] = ['Copy', 'Design', 'Motion', 'Copy + Design', 'Estratégia']

// Plataformas relevantes para o Pipeline (sem Twitter / LinkedIn)
const PIPELINE_PLATFORMS = PLATFORMS.filter(p => !['twitter', 'linkedin'].includes(p.id))

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa', color: '#5B5B7A' },
  { value: 'medium', label: 'Média', color: '#F5C842' },
  { value: 'high',   label: 'Alta',  color: '#E0201A' },
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

// ─── Priority Buttons (uniform style) ─────────────────────────────────────────

function PriorityGroup({ value, onChange }: { value: PriorityLevel; onChange: (v: PriorityLevel) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {PRIORITY_OPTIONS.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: active ? `1px solid ${opt.color}` : '1px solid var(--border-subtle)',
              background: active ? opt.color + '20' : 'var(--s2)',
              color: active ? opt.color : 'var(--txt2)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: 99, flexShrink: 0,
              background: opt.color, opacity: active ? 1 : 0.35,
            }} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Task Detail / Edit Modal ─────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { t } = useTranslation()
  const { updateTask, deleteTask } = usePipelineStore()

  const [title, setTitle]             = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [type, setType]               = useState<TaskType>(task.type)
  const [status, setStatus]           = useState<TaskStatus>(task.status)
  const [priorityLevel, setPriority]  = useState<PriorityLevel>(task.priorityLevel ?? 'medium')
  const [dueDate, setDueDate]         = useState(task.dueDate ?? '')
  const [platforms, setPlatforms]     = useState<PlatformId[]>(task.platforms)
  const [tagsRaw, setTagsRaw]         = useState((task.tags ?? []).join(', '))
  const [assignee, setAssignee]       = useState<string>(task.assignees?.[0] ?? '')
  const [referenceUrl, setReferenceUrl] = useState<string>(task.referenceUrl ?? '')

  function togglePlatform(id: PlatformId) {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function handleSave() {
    if (!title.trim()) { toast.error(t('pipeline.titleRequired')); return }
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      priorityLevel,
      priority: priorityLevel === 'high',
      dueDate: dueDate || undefined,
      platforms,
      tags: tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean),
      assignees: assignee ? [assignee] : [],
      referenceUrl: referenceUrl.trim() || undefined,
    })
    toast.success(t('pipeline.taskUpdated'))
    onClose()
  }

  function handleDelete() {
    deleteTask(task.id)
    toast.success(t('pipeline.toast.deleted'))
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
              {t('pipeline.editTask')}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
          </div>
          <button
            onClick={handleDelete}
            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(248,113,113,.1)', color: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={t('pipeline.removeTask')}
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
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.titleStar')}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('pipeline.descPlaceholderEdit')}
              rows={3}
              style={{ ...fieldStyle, width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.typeLabel')}</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                {TASK_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.statusLabel')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{t(`pipeline.columns.${c.id}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Atribuir para + Data de entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Atribuir para</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                <option value="">— Ninguém —</option>
                {TEAM.map(m => (
                  <option key={m.email} value={m.email}>{m.name} · {ROLE_LABELS[m.role]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                {t('pipeline.dueDateLabelShort')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>{t('pipeline.priorityLabel')}</label>
            <PriorityGroup value={priorityLevel} onChange={setPriority} />
          </div>

          {/* Link de referência */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
              <Link2 size={10} style={{ display: 'inline', marginRight: 4 }} />
              Link de referência{' '}
              <span style={{ fontWeight: 400, color: 'var(--txt3)' }}>(opcional)</span>
            </label>
            <input
              type="url"
              value={referenceUrl}
              onChange={e => setReferenceUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou Figma"
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
              <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />
              {t('pipeline.tagsCommaLabel')}
            </label>
            <input
              value={tagsRaw}
              onChange={e => setTagsRaw(e.target.value)}
              placeholder={t('pipeline.tagsExampleEdit')}
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>

          {/* Plataformas */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>{t('pipeline.platformsLabel')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PIPELINE_PLATFORMS.map(p => {
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
            {t('pipeline.cancel')}
          </button>
          <button onClick={handleSave} style={{ flex: 2, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--grad)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('pipeline.saveChanges')}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

function CreateTaskModal({ defaultStatus, onClose }: { defaultStatus: TaskStatus; onClose: () => void }) {
  const { t } = useTranslation()
  const { addTask } = usePipelineStore()

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [type, setType]                 = useState<TaskType>('Copy + Design')
  const [status, setStatus]             = useState<TaskStatus>(defaultStatus)
  const [priorityLevel, setPriority]    = useState<PriorityLevel>('medium')
  const [dueDate, setDueDate]           = useState('')
  const [platforms, setPlatforms]       = useState<PlatformId[]>(['instagram'])
  const [tagsRaw, setTagsRaw]           = useState('')
  const [assignee, setAssignee]         = useState<string>('')
  const [referenceUrl, setReferenceUrl] = useState<string>('')

  function togglePlatform(id: PlatformId) {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function handleCreate() {
    if (!title.trim()) { toast.error(t('pipeline.titleRequired')); return }
    if (platforms.length === 0) { toast.error(t('pipeline.platformRequired')); return }
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      priorityLevel,
      priority: priorityLevel === 'high',
      dueDate: dueDate || undefined,
      platforms,
      tags: tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean),
      assignees: assignee ? [assignee] : [],
      referenceUrl: referenceUrl.trim() || undefined,
    })
    toast.success(t('pipeline.toast.created'))
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
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', margin: 0, flex: 1 }}>{t('pipeline.newTask')}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--s3)', color: 'var(--txt2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Título */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.titleStar')}</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={t('pipeline.newTaskTitlePlaceholder')}
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('pipeline.descPlaceholderCreate')}
              rows={3}
              style={{ ...fieldStyle, width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Tipo + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.typeLabel')}</label>
              <select value={type} onChange={e => setType(e.target.value as TaskType)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}>
                {TASK_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{t('pipeline.statusInitial')}</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}>
                {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{t(`pipeline.columns.${c.id}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Atribuir para + Data de entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Atribuir para</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12 }}
              >
                <option value="">— Ninguém —</option>
                {TEAM.map(m => (
                  <option key={m.email} value={m.email}>{m.name} · {ROLE_LABELS[m.role]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                {t('pipeline.dueDateLabelShort')}
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>{t('pipeline.priorityLabel')}</label>
            <PriorityGroup value={priorityLevel} onChange={setPriority} />
          </div>

          {/* Link de referência */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
              <Link2 size={10} style={{ display: 'inline', marginRight: 4 }} />
              Link de referência{' '}
              <span style={{ fontWeight: 400, color: 'var(--txt3)' }}>(opcional)</span>
            </label>
            <input
              type="url"
              value={referenceUrl}
              onChange={e => setReferenceUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou Figma"
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 10px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>
              <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />
              {t('pipeline.tagsLabel')}
            </label>
            <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder={t('pipeline.tagsExampleCreate')}
              style={{ ...fieldStyle, width: '100%', height: 36, padding: '0 8px', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
          </div>

          {/* Plataformas */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 8 }}>{t('pipeline.platformsStar')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PIPELINE_PLATFORMS.map(p => {
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
            {t('pipeline.cancel')}
          </button>
          <button onClick={handleCreate} style={{ flex: 2, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--grad)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('pipeline.createTask')}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Board ─────────────────────────────────────────────────────────────────────

const COL_IDS = PIPELINE_COLUMNS.map(c => c.id) as TaskStatus[]

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  return rectIntersection(args)
}

export function PipelineBoard() {
  const { t } = useTranslation()
  const { tasks, moveTask, reorderTasks, loadTasks } = usePipelineStore()
  const [activeTask, setActiveTask]     = useState<Task | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('backlog')
  const [editTask, setEditTask]         = useState<Task | null>(null)

  const isMobile = useMediaQuery('(max-width: 768px)')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Carrega tasks do Supabase no mount. Também registra o atalho "Nova Task".
  useEffect(() => {
    void loadTasks()
    const onNew = () => { setCreateStatus('backlog'); setShowCreate(true) }
    window.addEventListener('flux:newTask', onNew)
    return () => window.removeEventListener('flux:newTask', onNew)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tasksByStatus = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(task => task.status === col.id)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const statusOf = (id: string): TaskStatus | null => {
    if (COL_IDS.includes(id as TaskStatus)) return id as TaskStatus
    return usePipelineStore.getState().tasks.find(task => task.id === id)?.status ?? null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find(task => task.id === active.id) || null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return
    const current = usePipelineStore.getState().tasks.find(task => task.id === active.id)
    if (!current) return
    const target = statusOf(over.id as string)
    if (target && target !== current.status) {
      moveTask(active.id as string, target)
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return
    if (active.id !== over.id && !COL_IDS.includes(over.id as TaskStatus)) {
      reorderTasks(active.id as string, over.id as string)
    }
  }

  if (isMobile) return <PipelineMobile />

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--txt)' }}>{t('pipeline.boardTitle')}</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--s2)', color: 'var(--txt3)' }}>
            {t('pipeline.taskCount', { count: tasks.length })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] hover:bg-[var(--s2)] transition-colors" style={{ color: 'var(--txt2)' }}>
            <Filter size={12} /> {t('pipeline.filter')}
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] hover:bg-[var(--s2)] transition-colors" style={{ color: 'var(--txt2)' }}>
            <SlidersHorizontal size={12} /> {t('pipeline.sort')}
          </button>
          <button
            onClick={() => { setCreateStatus('backlog'); setShowCreate(true) }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] text-white font-medium"
            style={{ background: 'var(--grad)' }}
          >
            <Plus size={13} /> {t('pipeline.newTask')}
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
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
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

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2" style={{ width: 224, cursor: 'grabbing' }}>
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
