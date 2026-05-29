'use client'
import { create } from 'zustand'
import type { Task, TaskStatus } from '@/types'

// Seed data
const SEED_TASKS: Task[] = [
  { id: '1', title: 'Post Flamengo x Botafogo — Pré-jogo', type: 'Copy + Design', status: 'production', platforms: ['instagram', 'twitter'], dueDate: '2026-05-27', priority: true, createdAt: '2026-05-25T10:00:00Z' },
  { id: '2', title: 'Highlights rodada 8 Brasileirão', type: 'Motion', status: 'review', platforms: ['instagram', 'youtube', 'tiktok'], dueDate: '2026-05-26', createdAt: '2026-05-24T14:00:00Z' },
  { id: '3', title: 'Odds da semana — Betano feature', type: 'Design', status: 'backlog', platforms: ['instagram'], dueDate: '2026-05-28', createdAt: '2026-05-25T09:00:00Z' },
  { id: '4', title: 'Copa do Brasil — Quartas preview', type: 'Estratégia', status: 'backlog', platforms: ['instagram', 'twitter', 'linkedin'], createdAt: '2026-05-25T11:00:00Z' },
  { id: '5', title: 'Libertadores Semi — Motion reel', type: 'Motion', status: 'ready', platforms: ['instagram', 'tiktok'], dueDate: '2026-05-29', createdAt: '2026-05-23T16:00:00Z' },
  { id: '6', title: 'Thread análise tática Palmeiras', type: 'Copy', status: 'production', platforms: ['twitter'], dueDate: '2026-05-27', createdAt: '2026-05-25T08:00:00Z' },
  { id: '7', title: 'Carrossel top apostas finais de semana', type: 'Copy + Design', status: 'published', platforms: ['instagram'], createdAt: '2026-05-24T12:00:00Z' },
]

interface PipelineState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  moveTask: (taskId: string, toStatus: TaskStatus) => void
  deleteTask: (taskId: string) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
}

export const usePipelineStore = create<PipelineState>((set) => ({
  tasks: SEED_TASKS,

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

  deleteTask: (taskId) => set((s) => ({
    tasks: s.tasks.filter(t => t.id !== taskId)
  })),

  updateTask: (taskId, updates) => set((s) => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  })),
}))
