'use client'
import { create } from 'zustand'
import type { GoalEvent, MatchEntry } from '@/lib/timeline'

// ─── Store ────────────────────────────────────────────────────────────────────

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface TimelineState {
  goals: GoalEvent[]                      // newest first, cap 100
  connectionStatus: ConnectionStatus
  activeMatch: MatchEntry | null          // match sent to War Room

  connect: () => void
  disconnect: () => void
  addGoal: (goal: GoalEvent) => void
  setActiveMatch: (match: MatchEntry | null) => void
}

// ─── SSE module-level refs (survive StrictMode double-mount) ──────────────────

let _es: EventSource | null = null
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTimelineStore = create<TimelineState>((set, get) => ({
  goals: [],
  connectionStatus: 'disconnected',
  activeMatch: null,

  connect() {
    if (typeof window === 'undefined') return
    if (_es !== null) return

    set({ connectionStatus: 'connecting' })

    const setup = () => {
      _es = new EventSource('/api/events/stream')

      _es.onopen = () => set({ connectionStatus: 'connected' })

      _es.onmessage = (msg: MessageEvent<string>) => {
        try {
          const goal = JSON.parse(msg.data) as GoalEvent
          if (!goal.id) return
          get().addGoal(goal)
        } catch { /* ignore */ }
      }

      _es.onerror = () => {
        set({ connectionStatus: 'error' })
        _es?.close()
        _es = null
        _reconnectTimer = setTimeout(() => {
          _reconnectTimer = null
          setup()
        }, 5_000)
      }
    }

    setup()
  },

  disconnect() {
    if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null }
    if (_es) { _es.close(); _es = null }
    set({ connectionStatus: 'disconnected' })
  },

  addGoal(goal) {
    set(state => {
      if (state.goals.some(g => g.id === goal.id)) return state
      return { goals: [goal, ...state.goals].slice(0, 100) }
    })
  },

  setActiveMatch(match) {
    set({ activeMatch: match })
  },
}))
