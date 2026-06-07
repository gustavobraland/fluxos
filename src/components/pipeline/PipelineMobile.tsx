'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Star, Clock, Trash2, Check, Link2 } from 'lucide-react'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useUserStore } from '@/store/useUserStore'
import { PIPELINE_COLUMNS, PLATFORMS } from '@/lib/constants'
import { TEAM, ROLE_LABELS } from '@/lib/onboarding-config'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { SwipeableCard } from '@/components/mobile/SwipeableCard'
import { useTranslation } from '@/hooks/useTranslation'
import type { Task, TaskStatus, TaskType, PlatformId } from '@/types'

const TASK_TYPES: TaskType[] = ['Copy', 'Design', 'Motion', 'Copy + Design', 'Estratégia']
const COL_IDS = PIPELINE_COLUMNS.map((c) => c.id) as TaskStatus[]
const COL_COLOR: Record<string, string> = Object.fromEntries(PIPELINE_COLUMNS.map((c) => [c.id, c.color]))

// Plataformas relevantes para o Pipeline (sem Twitter / LinkedIn)
const PIPELINE_PLATFORMS = PLATFORMS.filter(p => !['twitter', 'linkedin'].includes(p.id))

const TYPE_COLORS: Record<string, string> = {
  'Copy': '#A78BFA', 'Design': '#E0201A', 'Motion': '#2563EB',
  'Copy + Design': '#F5C842', 'Estratégia': '#3ECF8E',
}

const PRIORITY_OPTIONS = [
  { value: 'low'    as const, label: 'Baixa', color: '#5B5B7A' },
  { value: 'medium' as const, label: 'Média', color: '#F5C842' },
  { value: 'high'   as const, label: 'Alta',  color: '#E0201A' },
]

export function PipelineMobile() {
  const { t } = useTranslation()
  const { tasks, addTask, moveTask, deleteTask } = usePipelineStore()
  const { name, email } = useUserStore()
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [moveTaskItem, setMoveTaskItem] = useState<Task | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const onNew = () => setCreateOpen(true)
    window.addEventListener('flux:newTask', onNew)
    return () => window.removeEventListener('flux:newTask', onNew)
  }, [])

  const colLabel = (id: TaskStatus) => t(`pipeline.columns.${id}`)

  const isMine = (task: Task) => {
    const who = [name, email].filter(Boolean).map((s) => s!.toLowerCase())
    return (task.assignees ?? []).some((a) => who.includes(a.toLowerCase()))
  }
  const scoped = scope === 'mine' ? tasks.filter(isMine) : tasks

  const moveToNext = (task: Task) => {
    const next = COL_IDS[Math.min(COL_IDS.indexOf(task.status) + 1, COL_IDS.length - 1)]
    if (next !== task.status) { moveTask(task.id, next); toast.success(`${task.title} → ${colLabel(next)}`) }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header + filtros */}
      <div className="px-4 pt-3 pb-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--txt)' }}>
            {t('pipeline.boardTitle')} · {t('pipeline.taskCount', { count: scoped.length })}
          </h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] text-white font-medium"
            style={{ background: '#E0201A' }}
          >
            <Plus size={14} /> {t('pipeline.newTask')}
          </button>
        </div>
        <div className="inline-flex rounded-lg p-0.5" style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)' }}>
          <ScopeBtn active={scope === 'all'} onClick={() => setScope('all')} label="Todas" />
          <ScopeBtn active={scope === 'mine'} onClick={() => setScope('mine')} label="Minhas" />
        </div>
      </div>

      {/* Lista agrupada por status */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
        {scoped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: 'var(--txt3)' }}>
            <div className="text-2xl mb-1 opacity-20">◻</div>
            <span className="text-[12px]">{t('pipeline.dropHere')}</span>
          </div>
        )}

        {COL_IDS.map((colId) => {
          const colTasks = scoped.filter((tk) => tk.status === colId)
          if (colTasks.length === 0) return null
          return (
            <section key={colId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span style={{ width: 8, height: 8, borderRadius: 99, background: COL_COLOR[colId] }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--txt2)' }}>
                  {colLabel(colId)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--s2)', color: 'var(--txt3)' }}>
                  {colTasks.length}
                </span>
              </div>

              {colTasks.map((task) => {
                const typeColor = TYPE_COLORS[task.type] || 'var(--txt2)'
                const assigneeName = task.assignees?.[0]
                  ? TEAM.find(m => m.email === task.assignees![0])?.name ?? task.assignees![0]
                  : null
                return (
                  <SwipeableCard
                    key={task.id}
                    rightAction={{ label: colLabel(COL_IDS[Math.min(COL_IDS.indexOf(task.status) + 1, COL_IDS.length - 1)]), color: '#3ECF8E', onAction: () => moveToNext(task) }}
                  >
                    <div
                      onClick={() => setMoveTaskItem(task)}
                      className="rounded-xl p-3"
                      style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-[0.5px]"
                          style={{ background: typeColor + '20', color: typeColor }}>
                          {task.type}
                        </span>
                        {(task.priority || task.priorityLevel === 'high') && (
                          <Star size={11} className="ml-auto" style={{ color: '#E0201A', fill: '#E0201A' }} />
                        )}
                      </div>
                      <p className="text-[13px] font-medium leading-snug mb-2" style={{ color: 'var(--txt)' }}>{task.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {task.platforms.slice(0, 4).map((p) => (
                              <span key={p} style={{ color: 'var(--txt3)' }}><PlatformIcon id={p} size={12} /></span>
                            ))}
                          </div>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--txt3)' }}>
                              <Clock size={9} />
                              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          )}
                          {assigneeName && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--s3)', color: 'var(--txt3)' }}>
                              {assigneeName}
                            </span>
                          )}
                        </div>
                        {/* Badge de status clicável → abre o picker de coluna */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setMoveTaskItem(task) }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: COL_COLOR[task.status] + '22', color: COL_COLOR[task.status] }}
                        >
                          {colLabel(task.status)}
                        </button>
                      </div>
                    </div>
                  </SwipeableCard>
                )
              })}
            </section>
          )
        })}
      </div>

      {/* Picker: mover para coluna */}
      <BottomSheet isOpen={!!moveTaskItem} onClose={() => setMoveTaskItem(null)} title={moveTaskItem?.title}>
        {moveTaskItem && (
          <div className="flex flex-col gap-2 pb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--txt2)' }}>Mover para</div>
            {COL_IDS.map((id) => {
              const current = moveTaskItem.status === id
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (!current) { moveTask(moveTaskItem.id, id); toast.success(`${moveTaskItem.title} → ${colLabel(id)}`) }
                    setMoveTaskItem(null)
                  }}
                  className="flex items-center gap-2.5 w-full h-12 px-3 rounded-lg text-left text-[14px]"
                  style={{
                    background: current ? COL_COLOR[id] + '18' : 'var(--s2)',
                    border: `1px solid ${current ? COL_COLOR[id] + '55' : 'var(--border-subtle)'}`,
                    color: 'var(--txt)',
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: COL_COLOR[id] }} />
                  <span className="flex-1 font-medium">{colLabel(id)}</span>
                  {current && <Check size={16} style={{ color: COL_COLOR[id] }} />}
                </button>
              )
            })}
            <button
              onClick={() => { deleteTask(moveTaskItem.id); setMoveTaskItem(null); toast.success(t('pipeline.toast.deleted')) }}
              className="flex items-center justify-center gap-2 h-12 mt-1 rounded-lg text-[13px] font-medium"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.25)' }}
            >
              <Trash2 size={14} /> {t('pipeline.removeTask')}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Nova Task */}
      <CreateTaskSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(data) => { addTask(data); setCreateOpen(false); toast.success(t('pipeline.toast.created')) }}
      />
    </div>
  )
}

function ScopeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-4 rounded-md text-[12px] font-medium"
      style={{ background: active ? 'var(--s1)' : 'transparent', color: active ? 'var(--txt)' : 'var(--txt3)', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}
    >
      {label}
    </button>
  )
}

function CreateTaskSheet({
  isOpen, onClose, onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: Omit<Task, 'id' | 'createdAt'>) => void
}) {
  const { t } = useTranslation()
  const [title, setTitle]               = useState('')
  const [type, setType]                 = useState<TaskType>('Copy + Design')
  const [platforms, setPlatforms]       = useState<PlatformId[]>(['instagram'])
  const [dueDate, setDueDate]           = useState('')
  const [priorityLevel, setPriority]    = useState<'low' | 'medium' | 'high'>('medium')
  const [assignee, setAssignee]         = useState<string>('')
  const [referenceUrl, setReferenceUrl] = useState<string>('')

  const reset = () => {
    setTitle(''); setType('Copy + Design'); setPlatforms(['instagram'])
    setDueDate(''); setPriority('medium'); setAssignee(''); setReferenceUrl('')
  }
  const togglePlatform = (id: PlatformId) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = () => {
    if (!title.trim()) { toast.error(t('pipeline.titleRequired')); return }
    if (platforms.length === 0) { toast.error(t('pipeline.platformRequired')); return }
    onCreate({
      title: title.trim(), type, status: 'backlog',
      priorityLevel, priority: priorityLevel === 'high',
      dueDate: dueDate || undefined, platforms, tags: [],
      assignees: assignee ? [assignee] : [],
      referenceUrl: referenceUrl.trim() || undefined,
    })
    reset()
  }

  const fieldCss: React.CSSProperties = {
    background: 'var(--s2)', border: '1px solid var(--border-subtle)',
    color: 'var(--txt)', width: '100%', borderRadius: 10, outline: 'none',
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { reset(); onClose() }}
      title={t('pipeline.newTask')}
      height="full"
      headerAction={
        <button onClick={submit} className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#E0201A' }}>
          {t('pipeline.createTask')}
        </button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">

        {/* Título */}
        <Field label={t('pipeline.titleStar')}>
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('pipeline.newTaskTitlePlaceholder')}
            className="h-12 px-3 text-[16px]"
            style={fieldCss}
          />
        </Field>

        {/* Tipo */}
        <Field label={t('pipeline.typeLabel')}>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((tt) => <Chip key={tt} active={type === tt} onClick={() => setType(tt)} label={tt} />)}
          </div>
        </Field>

        {/* Atribuir para */}
        <Field label="Atribuir para">
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="h-12 px-3 text-[15px]"
            style={fieldCss}
          >
            <option value="">— Ninguém —</option>
            {TEAM.map(m => (
              <option key={m.email} value={m.email}>{m.name} · {ROLE_LABELS[m.role]}</option>
            ))}
          </select>
        </Field>

        {/* Prioridade */}
        <Field label={t('pipeline.priorityLabel')}>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map(opt => {
              const active = priorityLevel === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className="flex-1 h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5"
                  style={{
                    border: active ? `1px solid ${opt.color}` : '1px solid var(--border-subtle)',
                    background: active ? opt.color + '20' : 'var(--s2)',
                    color: active ? opt.color : 'var(--txt2)',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: opt.color, opacity: active ? 1 : 0.35 }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </Field>

        {/* Plataformas */}
        <Field label={t('pipeline.platformsStar')}>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_PLATFORMS.map((p) => (
              <button
                key={p.id} onClick={() => togglePlatform(p.id)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px]"
                style={{
                  background: platforms.includes(p.id) ? p.color + '20' : 'var(--s2)',
                  color: platforms.includes(p.id) ? 'var(--txt)' : 'var(--txt2)',
                  border: `1px solid ${platforms.includes(p.id) ? p.color + '55' : 'var(--border-subtle)'}`,
                }}
              >
                <PlatformIcon id={p.id} size={13} /> {p.name}
              </button>
            ))}
          </div>
        </Field>

        {/* Data de entrega */}
        <Field label={t('pipeline.dueDateLabelShort')}>
          <input
            type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="h-12 px-3 text-[16px]"
            style={fieldCss}
          />
        </Field>

        {/* Link de referência */}
        <Field label="Link de referência (opcional)">
          <input
            type="url" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="https://drive.google.com/... ou Figma"
            className="h-12 px-3 text-[15px]"
            style={fieldCss}
          />
        </Field>

      </div>
    </BottomSheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--txt2)' }}>{label}</div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="h-9 px-3 rounded-lg text-[13px] font-medium"
      style={{
        background: active ? 'var(--red-s)' : 'var(--s2)',
        color: active ? 'var(--red)' : 'var(--txt2)',
        border: `1px solid ${active ? '#E0201A' : 'var(--border-subtle)'}`,
      }}
    >
      {label}
    </button>
  )
}
