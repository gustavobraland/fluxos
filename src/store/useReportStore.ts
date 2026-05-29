'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyReport } from '@/types'

interface ReportState {
  reports: DailyReport[]
  addReport: (content: string, author?: string) => DailyReport
  deleteReport: (id: string) => void
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      reports: [],

      addReport: (content, author = 'Admin') => {
        const now = new Date()
        const report: DailyReport = {
          id: crypto.randomUUID(),
          date: now.toISOString().slice(0, 10), // YYYY-MM-DD
          content: content.trim(),
          author,
          createdAt: now.toISOString(),
        }
        set((s) => ({ reports: [report, ...s.reports] }))
        return report
      },

      deleteReport: (id) =>
        set((s) => ({ reports: s.reports.filter(r => r.id !== id) })),
    }),
    { name: 'flux-reports' }
  )
)
