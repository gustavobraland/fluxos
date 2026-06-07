'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Plus, Trash2, CalendarDays, User, FileText, Sparkles } from 'lucide-react'
import { useReportStore } from '@/store/useReportStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useApprovalsStore } from '@/store/useApprovalsStore'
import { usePromptsStore } from '@/store/usePromptsStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useUserStore } from '@/store/useUserStore'
import { buildDailyReport } from '@/lib/insights'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'

function formatDate(iso: string, locale = 'pt-BR') {
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const TODAY = new Date().toISOString().slice(0, 10)

export default function ReportsPage() {
  const { reports, addReport, deleteReport, loadReports } = useReportStore()
  const tasks = usePipelineStore((s) => s.tasks)
  const approvals = useApprovalsStore((s) => s.items)
  const prompts = usePromptsStore((s) => s.prompts)
  const events = useCalendarStore((s) => s.events)
  const { name: userName, email: userEmail } = useUserStore()
  const { t, locale } = useTranslation()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Carrega relatórios do Supabase no mount (RLS filtra por papel)
  useEffect(() => { void loadReports() }, [loadReports])

  const generateSummary = () => {
    setContent(buildDailyReport({ tasks, approvals, prompts, events }))
    toast.success('Resumo do dia gerado a partir da atividade real')
  }

  const handleSave = async () => {
    if (!content.trim()) { toast.error(t('reports.toast.contentRequired')); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    const report = addReport(content, userName ?? 'Admin')
    setContent('')
    setSelectedId(report.id)
    setSaving(false)
    toast.success(t('reports.toast.saved'))
  }

  // Reports sorted newest first (already newest first from store)
  const sorted = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const selected = selectedId ? reports.find(r => r.id === selectedId) : sorted[0] ?? null

  const fieldStyle: React.CSSProperties = {
    background: 'var(--s2)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--txt)',
    borderRadius: 8,
    fontSize: 13,
    padding: 12,
    outline: 'none',
    width: '100%',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.6,
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>

      {/* LEFT — EDITOR */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto"
        style={{ width: 380, borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 border-b px-4"
          style={{ minHeight: 44, borderColor: 'var(--border-subtle)' }}
        >
          <ClipboardList size={14} style={{ color: 'var(--blue)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
            {t('reports.newReport')}
          </span>
          <span
            className="ml-auto"
            style={{ fontSize: 11, color: 'var(--txt3)', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatDate(TODAY, locale)}
          </span>
        </div>

        <div className="flex flex-col flex-1" style={{ padding: '16px' }}>
          {/* Author row */}
          <div
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg,#2563EB,#A78BFA)',
              }}
            >
              {(userName ?? userEmail ?? 'A').slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'var(--txt2)' }}>{userName ?? userEmail ?? 'Admin'}</span>
            <span
              className="ml-auto"
              style={{ fontSize: 10, color: 'var(--txt3)' }}
            >
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Textarea */}
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <label
              style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}
            >
              {t('reports.contentLabel')}
            </label>
            <button
              onClick={generateSummary}
              className="flex items-center transition-all"
              style={{
                height: 24, padding: '0 10px', gap: 5, borderRadius: 7,
                fontSize: 11, fontWeight: 600,
                background: 'rgba(167,139,250,.12)', color: '#A78BFA',
                border: '1px solid rgba(167,139,250,.3)', cursor: 'pointer',
              }}
            >
              <Sparkles size={11} /> Gerar resumo do dia
            </button>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('reports.contentPlaceholder', { date: TODAY })}
            style={{ ...fieldStyle, minHeight: 220 }}
          />

          <div
            className="flex items-center justify-between mt-2 mb-4"
            style={{ fontSize: 10, color: 'var(--txt3)' }}
          >
            <span>{content.length} {t('reports.characters')}</span>
            <span>{content.trim().split(/\s+/).filter(Boolean).length} {t('reports.words')}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center justify-center gap-2"
            style={{
              height: 36,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: saving || !content.trim() ? 'var(--s3)' : 'var(--grad)',
              color: saving || !content.trim() ? 'var(--txt3)' : '#fff',
              border: 'none',
              cursor: saving || !content.trim() ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Plus size={14} />
            {saving ? t('reports.saving') : t('reports.saveBtn')}
          </motion.button>

          {/* Stats */}
          <div
            className="mt-4 flex flex-col gap-2 rounded-xl px-4 py-3"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('reports.thisMonth')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                {reports.filter(r => r.date.slice(0, 7) === TODAY.slice(0, 7)).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('reports.totalHistory')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                {reports.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE — HISTORY LIST */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto"
        style={{ width: 300, borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 border-b px-4"
          style={{ minHeight: 44, borderColor: 'var(--border-subtle)' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('reports.history')}</span>
          <span
            className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'var(--s2)', color: 'var(--txt3)' }}
          >
            {reports.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sorted.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              style={{ color: 'var(--txt3)' }}
            >
              <FileText size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 12 }}>{t('reports.noReports')}</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>{t('reports.noReportsDesc')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {sorted.map(report => {
                const isSelected = (selectedId ? selectedId : sorted[0]?.id) === report.id
                const firstLine = report.content.split('\n').find(l => l.trim()) || ''
                return (
                  <motion.button
                    key={report.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => setSelectedId(report.id)}
                    className="w-full text-left rounded-xl transition-colors group relative"
                    style={{
                      padding: '10px 12px',
                      marginBottom: 4,
                      background: isSelected ? 'var(--s2)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-mid)' : 'transparent'}`,
                    }}
                  >
                    {/* Date */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <CalendarDays size={11} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                      <span
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {report.date}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 'auto' }}>
                        {formatTime(report.createdAt)}
                      </span>
                    </div>
                    {/* Preview */}
                    <p
                      style={{
                        fontSize: 11, color: 'var(--txt2)', lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        marginBottom: 4,
                      }}
                    >
                      {firstLine || '(sem conteúdo)'}
                    </p>
                    {/* Author + delete */}
                    <div className="flex items-center gap-1">
                      <User size={9} style={{ color: 'var(--txt3)' }} />
                      <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{report.author}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteReport(report.id)
                          if (selectedId === report.id) setSelectedId(null)
                          toast.success(t('reports.toast.deleted'))
                        }}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'var(--s3)', border: '1px solid var(--border-subtle)',
                          color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* RIGHT — DETAIL VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-2 border-b px-4"
          style={{ minHeight: 44, borderColor: 'var(--border-subtle)' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
            {selected ? t('reports.reportTitle', { date: selected.date }) : t('reports.noSelected')}
          </span>
          {selected && (
            <span
              className="ml-auto text-[10px]"
              style={{ color: 'var(--txt3)' }}
            >
              {t('reports.byAt', { author: selected.author, time: formatTime(selected.createdAt) })}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: 32 }}>
          {!selected ? (
            <div
              className="flex flex-col items-center justify-center h-full text-center"
              style={{ color: 'var(--txt3)' }}
            >
              <ClipboardList size={40} style={{ opacity: 0.15, marginBottom: 16 }} />
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t('reports.noSelected')}</p>
              <p style={{ fontSize: 12 }}>{t('reports.noSelectedDesc')}</p>
            </div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ maxWidth: 680 }}
            >
              {/* Meta banner */}
              <div
                className="flex items-center gap-3 rounded-xl mb-6 px-4 py-3"
                style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#2563EB,#A78BFA)',
                  }}
                >
                  {selected.author.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{selected.author}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                    {formatDate(selected.date, locale)} · {formatTime(selected.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    deleteReport(selected.id)
                    setSelectedId(null)
                    toast.success(t('reports.toast.deleted'))
                  }}
                  className="ml-auto flex items-center gap-1.5 transition-colors"
                  style={{
                    height: 28, padding: '0 10px', borderRadius: 7,
                    fontSize: 11, fontWeight: 500,
                    background: 'rgba(240,80,80,.08)',
                    color: 'var(--red)',
                    border: '1px solid rgba(240,80,80,.2)',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={11} />
                  {t('reports.deleteBtn')}
                </button>
              </div>

              {/* Content */}
              <div
                className="rounded-xl px-6 py-5"
                style={{
                  background: 'var(--s2)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 14,
                  color: 'var(--txt)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {selected.content}
              </div>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  )
}
