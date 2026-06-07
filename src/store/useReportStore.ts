'use client'
// ─── Daily Reports store — Supabase-backed ────────────────────────────────────
// Salva relatórios no Supabase `daily_reports` (uma entrada por usuário/dia).
// RLS garante que CEO/Admin veem tudo, demais membros só o próprio.
// localStorage (`persist`) serve como cache offline / fallback sem Supabase.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyReport } from '@/types'
import { supabaseEnabled } from '@/lib/supabase'

function getSupabaseClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/supabase/client').createClient() as ReturnType<typeof import('@/lib/supabase/client').createClient>
}
function getUserStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/store/useUserStore').useUserStore as typeof import('@/store/useUserStore').useUserStore
}

interface ReportState {
  reports: DailyReport[]
  loading: boolean
  /** Carrega relatórios do Supabase (RLS filtra pelo papel). Chame no mount. */
  loadReports: () => Promise<void>
  /** Salva localmente + persiste no Supabase em background. Retorno síncrono. */
  addReport: (content: string, author?: string) => DailyReport
  /** Remove localmente + deleta do Supabase em background. */
  deleteReport: (id: string) => void
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      reports: [],
      loading: false,

      // ── Load ─────────────────────────────────────────────────────────────────
      loadReports: async () => {
        if (!supabaseEnabled()) return
        set({ loading: true })
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from('daily_reports')
            .select('id, report_date, content, user_name, user_email, role, created_at')
            .order('created_at', { ascending: false })
          if (error) throw error
          const reports: DailyReport[] = (data ?? []).map((r: {
            id: string; report_date: string; content: string;
            user_name: string | null; user_email: string | null;
            role: string | null; created_at: string
          }) => ({
            id: r.id,
            date: r.report_date,
            content: r.content,
            author: r.user_name ?? r.user_email ?? 'Admin',
            userEmail: r.user_email ?? undefined,
            userRole: r.role ?? undefined,
            createdAt: r.created_at,
          }))
          set({ reports, loading: false })
        } catch (e) {
          console.error('[reports] loadReports:', e)
          set({ loading: false })
        }
      },

      // ── Add ──────────────────────────────────────────────────────────────────
      addReport: (content, author = 'Admin') => {
        const user = getUserStore().getState()
        const userEmail = user.email
        const userRole  = user.role ?? undefined
        const resolvedAuthor = user.name ?? author

        const now = new Date()
        const report: DailyReport = {
          id: crypto.randomUUID(),
          date: now.toISOString().slice(0, 10),
          content: content.trim(),
          author: resolvedAuthor,
          userEmail: userEmail ?? undefined,
          userRole,
          createdAt: now.toISOString(),
        }
        set((s) => ({ reports: [report, ...s.reports] }))

        // Persist to Supabase (upsert: um relatório por dia por usuário)
        if (supabaseEnabled() && userEmail) {
          void (async () => {
            try {
              const supabase = getSupabaseClient()
              const { error } = await supabase
                .from('daily_reports')
                .upsert(
                  {
                    id:           report.id,
                    workspace_id: 'braland',
                    user_email:   userEmail,
                    user_name:    resolvedAuthor,
                    role:         userRole ?? null,
                    report_date:  report.date,
                    content:      content.trim(),
                    created_at:   report.createdAt,
                  },
                  { onConflict: 'user_email,report_date' }
                )
              if (error) console.error('[reports] addReport:', error)
            } catch (e) {
              console.error('[reports] addReport:', e)
            }
          })()
        }

        return report
      },

      // ── Delete ───────────────────────────────────────────────────────────────
      deleteReport: (id) => {
        set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }))
        if (!supabaseEnabled()) return
        void (async () => {
          try {
            const supabase = getSupabaseClient()
            const { error } = await supabase.from('daily_reports').delete().eq('id', id)
            if (error) console.error('[reports] deleteReport:', error)
          } catch (e) {
            console.error('[reports] deleteReport:', e)
          }
        })()
      },
    }),
    { name: 'flux-reports' }
  )
)
