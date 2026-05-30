// ─── Real production insights ─────────────────────────────────────────────────
// Pure aggregations over the app's own stores (pipeline, approvals, prompts,
// calendar). No external/platform data — these are real internal metrics.

import type { Task, TaskStatus } from '@/types'
import type { ApprovalItem } from '@/types'
import type { Prompt } from '@/types/prompts'
import type { CalendarEvent } from '@/store/useCalendarStore'

const TZ = 'America/Sao_Paulo'
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })
const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface DayBucket { key: string; label: string; count: number }

export interface ProductionInsights {
  pipelineTotal: number
  byStatus: Record<TaskStatus, number>
  byType: Record<string, number>
  createdToday: number
  approvals: { pending: number; approved: number; rejected: number; changes: number; total: number }
  prompts: { total: number; uses: number; top: { title: string; usageCount: number }[] }
  matches: { total: number; today: number; upcoming: number }
  last7: DayBucket[]
}

interface Sources {
  tasks: Task[]
  approvals: ApprovalItem[]
  prompts: Prompt[]
  events: CalendarEvent[]
}

const STATUSES: TaskStatus[] = ['backlog', 'production', 'review', 'ready', 'published']

export function computeInsights({ tasks, approvals, prompts, events }: Sources): ProductionInsights {
  const todayKey = dayKey(new Date())

  const byStatus = Object.fromEntries(STATUSES.map(s => [s, 0])) as Record<TaskStatus, number>
  const byType: Record<string, number> = {}
  let createdToday = 0
  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
    byType[t.type] = (byType[t.type] ?? 0) + 1
    if (dayKey(new Date(t.createdAt)) === todayKey) createdToday++
  }

  const approvalsAgg = { pending: 0, approved: 0, rejected: 0, changes: 0, total: approvals.length }
  for (const a of approvals) {
    if (a.status === 'pending') approvalsAgg.pending++
    else if (a.status === 'approved') approvalsAgg.approved++
    else if (a.status === 'rejected') approvalsAgg.rejected++
    else if (a.status === 'changes') approvalsAgg.changes++
  }

  const uses = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0)
  const top = [...prompts]
    .filter(p => (p.usageCount || 0) > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 4)
    .map(p => ({ title: p.title, usageCount: p.usageCount }))

  const matchEvents = events.filter(e => e.type === 'match')
  const nowSec = Math.floor(Date.now() / 1000)
  const matches = {
    total: matchEvents.length,
    today: matchEvents.filter(e => dayKey(new Date(e.timestamp * 1000)) === todayKey).length,
    upcoming: matchEvents.filter(e => e.timestamp >= nowSec).length,
  }

  // Tasks created per day over the last 7 days (BRT), oldest → newest
  const last7: DayBucket[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const count = tasks.filter(t => dayKey(new Date(t.createdAt)) === key).length
    last7.push({ key, label: WEEKDAY[d.getDay()], count })
  }

  return {
    pipelineTotal: tasks.length,
    byStatus,
    byType,
    createdToday,
    approvals: approvalsAgg,
    prompts: { total: prompts.length, uses, top },
    matches,
    last7,
  }
}

// ─── Daily report draft generator (real activity) ────────────────────────────

export function buildDailyReport(src: Sources): string {
  const ins = computeInsights(src)
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: TZ })
  const todayKey = dayKey(new Date())

  const matchesToday = src.events
    .filter(e => e.type === 'match' && dayKey(new Date(e.timestamp * 1000)) === todayKey)
    .map(e => `   • ${e.title} — ${e.time}${e.result ? ` (${e.result === 'win' ? 'Vitória' : e.result === 'loss' ? 'Derrota' : 'Empate'})` : ''}`)

  const lines = [
    `Resumo do dia — ${dateStr}`,
    ``,
    `📋 Pipeline (${ins.pipelineTotal} no total)`,
    `   • Produção: ${ins.byStatus.production} · Revisão: ${ins.byStatus.review} · Prontos: ${ins.byStatus.ready} · Publicados: ${ins.byStatus.published}`,
    `   • Criados hoje: ${ins.createdToday}`,
    ``,
    `✅ Aprovações (${ins.approvals.total})`,
    `   • Aprovadas: ${ins.approvals.approved} · Pendentes: ${ins.approvals.pending} · Ajuste: ${ins.approvals.changes} · Rejeitadas: ${ins.approvals.rejected}`,
    ``,
    `⚽ Jogos hoje: ${ins.matches.today}`,
    ...(matchesToday.length ? matchesToday : ['   • Nenhum jogo monitorado hoje']),
    ``,
    `✦ Prompts mais usados`,
    ...(ins.prompts.top.length
      ? ins.prompts.top.map(p => `   • ${p.title} (${p.usageCount}x)`)
      : ['   • Nenhum prompt usado ainda']),
    ``,
    `— Observações:`,
    ``,
  ]
  return lines.join('\n')
}
