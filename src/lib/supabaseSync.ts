'use client'
// ─── Supabase ⇄ Zustand sync ──────────────────────────────────────────────────
// On load: pull each domain from Supabase (cloud wins when a row exists).
// On change: debounce-push the whole array back. localStorage stays as the
// offline cache. No-ops entirely when Supabase env isn't configured.

import { sbLoad, sbSave, supabaseEnabled } from './supabase'
import { usePromptsStore } from '@/store/usePromptsStore'
import { useCalendarStore, type CalendarEvent } from '@/store/useCalendarStore'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import type { Prompt } from '@/types/prompts'
import type { ApprovalItem } from '@/types'

let started = false

function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined
  return (...a: A) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

export async function initSupabaseSync(): Promise<void> {
  if (started || !supabaseEnabled()) return
  started = true

  let hydrating = true

  const [prompts, events, items] = await Promise.all([
    sbLoad<Prompt[]>('prompts'),
    sbLoad<CalendarEvent[]>('calendar'),
    sbLoad<ApprovalItem[]>('approvals'),
  ])

  // Cloud wins when a row exists; otherwise seed the cloud with current state.
  if (Array.isArray(prompts)) usePromptsStore.setState({ prompts })
  else void sbSave('prompts', usePromptsStore.getState().prompts)

  if (Array.isArray(events)) useCalendarStore.setState({ events })
  else void sbSave('calendar', useCalendarStore.getState().events)

  if (Array.isArray(items)) useApprovalsStore.setState({ items })
  else void sbSave('approvals', useApprovalsStore.getState().items)

  hydrating = false

  const savePrompts = debounce((v: Prompt[]) => void sbSave('prompts', v), 800)
  const saveCalendar = debounce((v: CalendarEvent[]) => void sbSave('calendar', v), 800)
  const saveApprovals = debounce((v: ApprovalItem[]) => void sbSave('approvals', v), 800)

  usePromptsStore.subscribe((s) => { if (!hydrating) savePrompts(s.prompts) })
  useCalendarStore.subscribe((s) => { if (!hydrating) saveCalendar(s.events) })
  useApprovalsStore.subscribe((s) => { if (!hydrating) saveApprovals(s.items) })
}
