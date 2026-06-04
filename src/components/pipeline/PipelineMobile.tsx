'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Star, Clock, Trash2, ChevronRight, X } from 'lucide-react'
import { usePipelineStore } from '@/store/usePipelineStore'
import { PIPELINE_COLUMNS, PLATFORMS } from '@/lib/constants'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { SwipeableCard } from '@/components/mobile/SwipeableCard'
import { useTranslation } from '@/hooks/useTranslation'
import type { Task, TaskStatus, TaskType, PlatformId } from '@/types'

const TASK_TYPES: TaskType[] = ['Copy', 'Design', 'Motion', 'Copy + Design', 'Estratégia']
const COL_IDS = PIPELINE_COLUMNS.map((c) => c.id) as TaskStatus[]

const TYPE_COLORS: Record<string, string> = {
  'Copy': '#A78BFA', 'Design': '#E0201A', 'Motion': '#2563EB',
  'Copy + Design': '#F5C842', 'Estratégia': '#3ECF8E',
}

export function PipelineMobile() {
  const { t } = useTranslation()
  const { tasks, addTask, updateTask, moveTask, deleteTask } = usePipelineStore()
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [detail, setDetail] = useState<Task | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Botão central de "Nova Task" (ActionSheet / atalho) abre a folha de criação.
  useEffect(() => {
    const onNew = () => setCreateOpen(true)
    window.addEventListener('flux:newTask', onNew)
    return () => window.removeEventListener('flux:newTask', onNew)
  }, [])

  const colLabel = (id: TaskStatus) => t(`pipeline.columns.${id}`)
  const list = filter === 'all' ? tasks : tasks.filter((tk) => tk.status === filter)

  const moveToNext = (task: Task) => {
    const i = COL_IDS.indexOf(task.status)
    const next = COL_IDS[Math.min(i + 1, COL_IDS.length - 1)]
    if (next !== task.status) {
      moveTask(task.id, next)
      toast.success(`${task.title} → ${colLabel(next)}`)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header + filtro de coluna */}
      <div className="px-4 pt-3 pb-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--txt)' }}>
            {t('pipeline.boardTitle')} · {t('pipeline.taskCount', { count: tasks.length })}
          </h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] text-white font-medium"
            style={{ background: '#E0201A' }}
          >
            <Plus size={14} /> {t('pipeline.newTask')}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={t('pipeline.filterAll') || 'Todos'} />
          {COL_IDS.map((id) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)} label={colLabel(id)} />
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: 'var(--txt3)' }}>
            <div className="text-2xl mb-1 opacity-20">◻</div>
            <span className="text-[12px]">{t('pipeline.dropHere')}</span>
          </div>
        )}
        {list.map((task) => {
          const typeColor = TYPE_COLORS[task.type] || 'var(--txt2)'
          return (
            <SwipeableCard
              key={task.id}
              rightAction={{ label: t('pipeline.details') || 'Detalhes', color: '#2563EB', onAction: () => setDetail(task) }}
              leftAction={{ label: colLabel(COL_IDS[Math.min(COL_IDS.indexOf(task.status) + 1, COL_IDS.length - 1)]), color: '#E0201A', onAction: () => moveToNext(task) }}
            >
              <button
                onClick={() => setDetail(task)}
                className="w-full text-left rounded-xl p-3"
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
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--txt2)' }}>
                    {colLabel(task.status)} <ChevronRight size={11} />
                  </span>
                </div>
              </button>
            </SwipeableCard>
          )
        })}
      </div>

      {/* Detalhe / mover coluna */}
      <BottomSheet isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="flex flex-col gap-4 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2 py-1 rounded" style={{ background: 'var(--s2)', color: 'var(--txt2)' }}>{detail.type}</span>
              {detail.platforms.map((p) => (
                <span key={p} style={{ color: 'var(--txt3)' }}><PlatformIcon id={p} size={14} /></span>
              ))}
              {detail.dueDate && (
                <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--txt3)' }}>
                  <Clock size={11} /> {new Date(detail.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            <label className="text-[12px] font-semibold" style={{ color: 'var(--txt2)' }}>
              {t('pipeline.statusLabel')}
              <select
                value={detail.status}
                onChange={(e) => {
                  const next = e.target.value as TaskStatus
                  moveTask(detail.id, next)
                  setDetail({ ...detail, status: next })
                  toast.success(`${detail.title} → ${colLabel(next)}`)
                }}
                className="w-full mt-1.5 h-11 px-3 rounded-lg text-[14px]"
                style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
              >
                {COL_IDS.map((id) => <option key={id} value={id}>{colLabel(id)}</option>)}
              </select>
            </label>

            <button
              onClick={() => { deleteTask(detail.id); setDetail(null); toast.success(t('pipeline.toast.deleted')) }}
              className="flex items-center justify-center gap-2 h-11 rounded-lg text-[13px] font-medium"
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
        defaultStatus={filter === 'all' ? 'backlog' : filter}
        onClose={() => setCreateOpen(false)}
        onCreate={(data) => { addTask(data); setCreateOpen(false); toast.success(t('pipeline.toast.created')) }}
      />
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 h-8 px-3 rounded-full text-[12px] font-medium whitespace-nowrap"
      style={{
        background: active ? '#E0201A' : 'var(--s2)',
        color: active ? '#fff' : 'var(--txt2)',
        border: `1px solid ${active ? '#E0201A' : 'var(--border-subtle)'}`,
      }}
    >
      {label}
    </button>
  )
}

function CreateTaskSheet({
  isOpen, defaultStatus, onClose, onCreate,
}: {
  isOpen: boolean
  defaultStatus: TaskStatus
  onClose: () => void
  onCreate: (data: Omit<Task, 'id' | 'createdAt'>) => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('Copy + Design')
  const [platforms, setPlatforms] = useState<PlatformId[]>(['instagram'])
  const [dueDate, setDueDate] = useState('')

  const reset = () => { setTitle(''); setType('Copy + Design'); setPlatforms(['instagram']); setDueDate('') }
  const togglePlatform = (id: PlatformId) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = () => {
    if (!title.trim()) { toast.error(t('pipeline.titleRequired')); return }
    if (platforms.length === 0) { toast.error(t('pipeline.platformRequired')); return }
    onCreate({
      title: title.trim(), type, status: defaultStatus,
      priorityLevel: 'medium', priority: false,
      dueDate: dueDate || undefined, platforms, tags: [],
    })
    reset()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { reset(); onClose() }}
      title={t('pipeline.newTask')}
      height="full"
      footer={
        <button
          onClick={submit}
          className="w-full h-12 rounded-xl text-[15px] font-semibold text-white"
          style={{ background: '#E0201A' }}
        >
          {t('pipeline.createTask')}
        </button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label={t('pipeline.titleStar')}>
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('pipeline.newTaskTitlePlaceholder')}
            className="w-full h-12 px-3 rounded-lg text-[16px]"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
          />
        </Field>

        <Field label={t('pipeline.typeLabel')}>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((tt) => (
              <Chip key={tt} active={type === tt} onClick={() => setType(tt)} label={tt} />
            ))}
          </div>
        </Field>

        <Field label={t('pipeline.platformsStar')}>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
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

        <Field label={t('pipeline.dueDateLabelShort')}>
          <input
            type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-12 px-3 rounded-lg text-[16px]"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
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
