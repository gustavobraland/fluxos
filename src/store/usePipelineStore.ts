'use client'
import { create } from 'zustand'
import type { Task, TaskStatus } from '@/types'

interface PipelineState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  moveTask: (taskId: string, toStatus: TaskStatus) => void
  /** Reorder the flat list so `activeId` sits at `overId`'s position (drag & drop). */
  reorderTasks: (activeId: string, overId: string) => void
  deleteTask: (taskId: string) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
}

export const usePipelineStore = create<PipelineState>((set) => ({
  tasks: [],

  addTask: (task) => set((s) => ({
    tasks: [...s.tasks, {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }]
  })),

  moveTask: (taskId, toStatus) => set((s) => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: toStatus } : t)
  })),

  reorderTasks: (activeId, overId) => set((s) => {
    if (activeId === overId) return {}
    const from = s.tasks.findIndex(t => t.id === activeId)
    const to = s.tasks.findIndex(t => t.id === overId)
    if (from === -1 || to === -1) return {}
    const next = [...s.tasks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return { tasks: next }
  }),

  deleteTask: (taskId) => set((s) => ({
    tasks: s.tasks.filter(t => t.id !== taskId)
  })),

  updateTask: (taskId, updates) => set((s) => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  })),
}))
