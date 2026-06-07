'use client'
// ─── Pipeline store — Supabase-backed (raw PostgREST fetch) ───────────────────
// Usa os helpers sbSelect/sbInsert/sbPatch/sbDelete de @/lib/supabase,
// que chamam a API REST diretamente com a anon key (sem SDK, sem require()).
//
// RLS de `pipeline_tasks` permite `anon, authenticated` — a auth real é o
// proxy.ts (@braland.com.br). Consistente com `flux_state`.
//
// Todas as mutações são otimistas: estado local atualiza imediatamente,
// Supabase sincroniza em background, reverte se houver erro.

import { create } from 'zustand'
import type { Task, TaskStatus, TaskType, PlatformId } from '@/types'
import { supabaseEnabled, sbSelect, sbInsert, sbPatch, sbDelete } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import { useUserStore } from '@/store/useUserStore'

// ─── DB row type (snake_case) ──────────────────────────────────────────────────
interface DbTask {
  id: string
  workspace_id: string
  title: string
  description: string | null
  type: string | null
  status: string
  platforms: string[] | null
  assigned_to: string[] | null
  due_date: string | null
  created_by: string | null
  priority: boolean | null
  priority_level: string | null
  tags: string[] | null
  reference_url: string | null
  created_at: string
  updated_at?: string
}

function rowToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: (row.type as TaskType) ?? 'Copy',
    status: (row.status as TaskStatus) ?? 'backlog',
    platforms: (row.platforms ?? []) as PlatformId[],
    dueDate: row.due_date ?? undefined,
    priority: row.priority ?? false,
    priorityLevel: (row.priority_level as 'low' | 'medium' | 'high') ?? 'medium',
    assignees: row.assigned_to ?? [],
    tags: row.tags ?? [],
    referenceUrl: row.reference_url ?? undefined,
    createdAt: row.created_at,
  }
}

function taskToRow(task: Task, createdBy?: string | null): Record<string, unknown> {
  return {
    id:             task.id,
    workspace_id:   'braland',
    title:          task.title,
    description:    task.description ?? null,
    type:           task.type ?? null,
    status:         task.status,
    platforms:      task.platforms.length > 0 ? task.platforms : null,
    assigned_to:    task.assignees && task.assignees.length > 0 ? task.assignees : null,
    due_date:       task.dueDate ?? null,
    created_by:     createdBy ?? null,
    priority:       task.priority ?? false,
    priority_level: task.priorityLevel ?? null,
    tags:           task.tags && task.tags.length > 0 ? task.tags : null,
    reference_url:  task.referenceUrl ?? null,
    created_at:     task.createdAt,
  }
}

// ─── Calendar sync ─────────────────────────────────────────────────────────────
const STATUS_EVENT_TYPE: Partial<Record<TaskStatus, 'content' | 'deadline' | 'campaign'>> = {
  backlog: 'content', production: 'content',
  review: 'deadline', ready: 'deadline',
  published: 'campaign',
}

function syncTaskToCalendar(task: Task): void {
  if (!task.dueDate) return
  try {
    useCalendarStore.getState().addEvent({
      id: `task-${task.id}`,
      type: STATUS_EVENT_TYPE[task.status] ?? 'content',
      title: task.title,
      subtitle: `${task.type}${task.platforms.length ? ' · ' + task.platforms.slice(0, 3).join(', ') : ''}`,
      date: task.dueDate,
      time: '09:00',
      timestamp: Math.floor(new Date(task.dueDate + 'T09:00:00').getTime() / 1000),
      platforms: task.platforms,
      source: 'manual',
    })
  } catch { /* calendário não inicializado */ }
}

function removeTaskFromCalendar(taskId: string): void {
  try { useCalendarStore.getState().removeEvent(`task-${taskId}`) } catch { /* ok */ }
}

// ─── Approvals sync ────────────────────────────────────────────────────────────
function publishTaskToApprovals(task: Task): void {
  try { useApprovalsStore.getState().addFromTask(task) } catch { /* ok */ }
}

// ─── Store ─────────────────────────────────────────────────────────────────────
interface PipelineState {
  tasks: Task[]
  loading: boolean
  /** Busca todas as tasks do Supabase. Chame no mount do Pipeline. */
  loadTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  moveTask: (taskId: string, toStatus: TaskStatus) => Promise<void>
  /** Reordena localmente (drag & drop) — não persiste a ordem no Supabase. */
  reorderTasks: (activeId: string, overId: string) => void
  deleteTask: (taskId: string) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  tasks: [],
  loading: false,

  // ── Load ────────────────────────────────────────────────────────────────────
  loadTasks: async () => {
    if (!supabaseEnabled()) return
    set({ loading: true })
    const rows = await sbSelect<DbTask>('pipeline_tasks', {
      filters: { workspace_id: 'braland' },
      order: 'created_at.asc',
    })
    const tasks = rows.map(rowToTask)
    set({ tasks, loading: false })
    // Sync due_date tasks to Calendar
    tasks.forEach(syncTaskToCalendar)
  },

  // ── Add ─────────────────────────────────────────────────────────────────────
  addTask: async (task) => {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const newTask: Task = { ...task, id, createdAt }

    // 1. Optimistic
    set((s) => ({ tasks: [...s.tasks, newTask] }))
    syncTaskToCalendar(newTask)

    // 2. Persist
    if (!supabaseEnabled()) return
    const createdBy = useUserStore.getState().email ?? null
    const err = await sbInsert('pipeline_tasks', taskToRow(newTask, createdBy))
    if (err) {
      console.error('[pipeline] addTask — INSERT falhou:', err)
      // Revert on error
      set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    }
  },

  // ── Move ────────────────────────────────────────────────────────────────────
  moveTask: async (taskId, toStatus) => {
    const prev = get().tasks.find(t => t.id === taskId)
    if (!prev) return
    const updated: Task = { ...prev, status: toStatus }

    // 1. Optimistic
    set((s) => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }))
    syncTaskToCalendar(updated)
    if (toStatus === 'published') publishTaskToApprovals(updated)

    // 2. Persist
    if (!supabaseEnabled()) return
    const err = await sbPatch('pipeline_tasks', taskId, { status: toStatus })
    if (err) {
      console.error('[pipeline] moveTask — PATCH falhou:', err)
      // Revert
      set((s) => ({ tasks: s.tasks.map(t => t.id === taskId ? prev : t) }))
    }
  },

  // ── Reorder (local only — DnD within same column) ───────────────────────────
  reorderTasks: (activeId, overId) => set((s) => {
    if (activeId === overId) return {}
    const from = s.tasks.findIndex(t => t.id === activeId)
    const to   = s.tasks.findIndex(t => t.id === overId)
    if (from === -1 || to === -1) return {}
    const next = [...s.tasks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return { tasks: next }
  }),

  // ── Delete ──────────────────────────────────────────────────────────────────
  deleteTask: async (taskId) => {
    const prev = get().tasks.find(t => t.id === taskId)

    // 1. Optimistic
    set((s) => ({ tasks: s.tasks.filter(t => t.id !== taskId) }))
    removeTaskFromCalendar(taskId)

    // 2. Persist
    if (!supabaseEnabled()) return
    const err = await sbDelete('pipeline_tasks', taskId)
    if (err) {
      console.error('[pipeline] deleteTask — DELETE falhou:', err)
      // Revert
      if (prev) set((s) => ({ tasks: [...s.tasks, prev] }))
    }
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  updateTask: async (taskId, updates) => {
    const prev = get().tasks.find(t => t.id === taskId)
    if (!prev) return
    const updated: Task = { ...prev, ...updates }

    // 1. Optimistic
    set((s) => ({ tasks: s.tasks.map(t => t.id === taskId ? updated : t) }))
    syncTaskToCalendar(updated)
    if (updates.status === 'published' && prev.status !== 'published') {
      publishTaskToApprovals(updated)
    }

    // 2. Persist
    if (!supabaseEnabled()) return
    const err = await sbPatch('pipeline_tasks', taskId, {
      title:          updated.title,
      description:    updated.description ?? null,
      type:           updated.type ?? null,
      status:         updated.status,
      platforms:      updated.platforms.length > 0 ? updated.platforms : null,
      assigned_to:    updated.assignees && updated.assignees.length > 0 ? updated.assignees : null,
      due_date:       updated.dueDate ?? null,
      priority:       updated.priority ?? false,
      priority_level: updated.priorityLevel ?? null,
      tags:           updated.tags && updated.tags.length > 0 ? updated.tags : null,
      reference_url:  updated.referenceUrl ?? null,
    })
    if (err) {
      console.error('[pipeline] updateTask — PATCH falhou:', err)
      // Revert
      set((s) => ({ tasks: s.tasks.map(t => t.id === taskId ? prev : t) }))
    }
  },
}))
