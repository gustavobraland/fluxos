'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trophy, FileText, Clock, TrendingUp, CalendarDays, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'
import { useIntegrationsStore } from '@/store/useIntegrationsStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useFixturesStore } from '@/store/useFixturesStore'
import type { Fixture } from '@/types/fixtures'
import { TeamLogo } from '@/components/timeline/TeamLogo'
import { useTranslation } from '@/hooks/useTranslation'

const TZ = 'America/Sao_Paulo'

// Converte um Fixture da API num evento de exibição do calendário.
function fixtureToDisplay(fx: Fixture): DisplayEvent {
  const ms = fx.fixture.timestamp * 1000
  const date = new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD
  return {
    id: `match-${fx.fixture.id}`,
    day: Number(date.slice(8, 10)),
    month: Number(date.slice(5, 7)),
    year: Number(date.slice(0, 4)),
    time: new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
    type: 'match',
    title: `${fx.teams.home.name} × ${fx.teams.away.name}`,
    subtitle: fx.league.name,
    result: null,
    leagueLogo: fx.league.logo,
    homeLogo: fx.teams.home.logo,
    awayLogo: fx.teams.away.logo,
  }
}

type ViewMode = 'month' | 'week'

// Display shape merging the legacy mock events with the live store events.
interface DisplayEvent {
  id: string
  day: number
  month: number
  year?: number
  time?: string
  type: string
  title: string
  subtitle?: string
  result?: 'win' | 'draw' | 'loss' | null
  leagueLogo?: string
  homeLogo?: string
  awayLogo?: string
}

const RESULT_COLOR: Record<'win' | 'draw' | 'loss', string> = {
  win:  'var(--green)',
  draw: 'var(--txt2)',
  loss: 'var(--red)',
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const TYPE_COLORS: Record<string, string> = {
  match:    'var(--blue)',
  content:  'var(--green)',
  deadline: 'var(--yellow)',
  trending: 'var(--orange)',
  campaign: 'var(--txt2)',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  match:    Trophy,
  content:  FileText,
  deadline: Clock,
  trending: TrendingUp,
  campaign: FileText,
}

const WEEK_HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { integrations, connectInt, connecting } = useIntegrationsStore()
  const gcal = integrations.find(i => i.id === 'gcal')
  const gcalConnected = gcal?.connected ?? false
  const isConnecting = connecting === 'gcal'

  // Data real de hoje (BRT) — o calendário abre no mês corrente.
  const now = new Date()
  const todayParts = now.toLocaleDateString('en-CA', { timeZone: TZ }).split('-')
  const TODAY_YEAR = Number(todayParts[0])
  const TODAY_MONTH = Number(todayParts[1])
  const TODAY_DAY = Number(todayParts[2])

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentMonth, setCurrentMonth] = useState(TODAY_MONTH)
  const [currentYear, setCurrentYear] = useState(TODAY_YEAR)
  const [selectedDay, setSelectedDay] = useState<number | null>(TODAY_DAY)

  const monthName = (m: number) => t(`calendar.months.${m}`)

  // Jogos da Copa + times monitorados (próximos 7 dias) — reaproveita o mesmo
  // cache do Timeline (TTL 10 min) para NÃO gastar créditos extras da API.
  const copaFixtures = useFixturesStore(useShallow(s => s.fixtures))
  const fetchFixtures = useFixturesStore(s => s.fetchAll)
  useEffect(() => {
    // Garante que tarefas com prazo (Pipeline) também apareçam no calendário.
    usePipelineStore.getState().loadTasks()
    // Carrega os jogos (pula se o cache do Timeline ainda estiver fresco).
    void fetchFixtures()
  }, [fetchFixtures])

  // Live events from the War Room / Multipost / Pipeline (deadlines) sync
  const storeEvents = useCalendarStore(useShallow(s => s.events))
  const storeDisplay = useMemo<DisplayEvent[]>(() =>
    storeEvents.map(e => ({
      id: e.id,
      day: Number(e.date.slice(8, 10)),
      month: Number(e.date.slice(5, 7)),
      year: Number(e.date.slice(0, 4)),
      time: e.time,
      type: e.type,
      title: e.title,
      subtitle: e.subtitle,
      result: e.result,
      leagueLogo: e.leagueLogo,
      homeLogo: e.homeLogo,
      awayLogo: e.awayLogo,
    })), [storeEvents])

  // Merge: jogos da Copa + eventos do store (War Room / posts / prazos).
  // Eventos do store têm prioridade (ex.: resultado preenchido) sobre o fixture cru.
  const allDisplay = useMemo<DisplayEvent[]>(() => {
    const storeIds = new Set(storeDisplay.map(e => e.id))
    const copa = copaFixtures.map(fixtureToDisplay).filter(e => !storeIds.has(e.id))
    return [...copa, ...storeDisplay]
  }, [copaFixtures, storeDisplay])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const isCurrentMonth = currentMonth === TODAY_MONTH && currentYear === TODAY_YEAR

  const eventsForDay = (day: number): DisplayEvent[] =>
    allDisplay.filter((e) => e.day === day && e.month === currentMonth && e.year === currentYear)

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Semana (Dom→Sáb) que contém o dia selecionado (ou hoje) no mês corrente.
  const weekAnchor = selectedDay ?? TODAY_DAY
  const weekStart = weekAnchor - new Date(currentYear, currentMonth - 1, weekAnchor).getDay()
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--txt)' }}>

      {/* ── Google Calendar banner ── */}
      {!gcalConnected ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px',
          background: 'rgba(66,133,244,.08)',
          borderBottom: '1px solid rgba(66,133,244,.2)',
          flexShrink: 0,
        }}>
          <CalendarDays size={15} style={{ color: '#4285F4', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--txt2)', flex: 1 }}>
            {t('calendar.bannerConnectDesc')}
          </span>
          <button
            onClick={() => connectInt('gcal')}
            disabled={isConnecting}
            style={{
              height: 28,
              padding: '0 14px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              background: '#4285F4',
              color: '#fff',
              border: 'none',
              cursor: isConnecting ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: isConnecting ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {isConnecting ? t('calendar.connecting') : t('calendar.connectGcal')}
          </button>
          <button
            onClick={() => router.push('/integrations')}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--txt2)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            {t('calendar.viewIntegrations')}
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 20px',
          background: 'rgba(62,207,142,.06)',
          borderBottom: '1px solid rgba(62,207,142,.2)',
          flexShrink: 0,
        }}>
          <CheckCircle2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--txt2)', flex: 1 }}>
            {t('calendar.connectedDesc')}
          </span>
          <button style={{
            height: 26,
            padding: '0 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            background: 'transparent',
            color: 'var(--txt2)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <RefreshCw size={10} />
            {t('calendar.syncGcal')}
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{
        padding: '20px 28px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t('calendar.pageTitle')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={prevMonth}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--s3)', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
              {monthName(currentMonth)} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--s3)', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', background: 'var(--s3)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['month', 'week'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: viewMode === v ? 'var(--s1)' : 'transparent',
                color: viewMode === v ? 'var(--txt)' : 'var(--txt2)',
                transition: 'all 0.18s ease',
              }}
            >
              {v === 'month' ? t('calendar.viewMonth') : t('calendar.viewWeek')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, paddingBottom: 28 }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 0 0 28px' }}>
          {viewMode === 'month' ? (
            <MonthView
              daysInMonth={daysInMonth}
              firstDay={firstDay}
              today={isCurrentMonth ? TODAY_DAY : -1}
              currentMonth={currentMonth}
              eventsForDay={eventsForDay}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          ) : (
            <WeekView weekDays={weekDays} eventsForDay={eventsForDay} today={isCurrentMonth ? TODAY_DAY : -1} />
          )}
        </div>

        <div style={{ width: 280, flexShrink: 0, marginRight: 28, marginLeft: 20, display: 'flex', flexDirection: 'column' }}>
          <SidePanel selectedDay={selectedDay} events={selectedEvents} monthName={monthName(currentMonth)} />
        </div>
      </div>
    </div>
  )
}

function MonthView({
  daysInMonth, firstDay, today, currentMonth, eventsForDay, selectedDay, onSelectDay,
}: {
  daysInMonth: number
  firstDay: number
  today: number
  currentMonth: number
  eventsForDay: (d: number) => DisplayEvent[]
  selectedDay: number | null
  onSelectDay: (d: number) => void
}) {
  const { t } = useTranslation()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_KEYS.map((dk) => (
          <div key={dk} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--txt3)', padding: '0 0 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t(`calendar.daysHeader.${dk}`)}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', flex: 1, gap: 4 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const evs = eventsForDay(day)
          const isToday = day === today
          const isSelected = day === selectedDay
          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectDay(day)}
              style={{
                borderRadius: 10, padding: '8px 8px 6px', cursor: 'pointer',
                background: isSelected ? 'var(--s3)' : 'var(--s2)',
                border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', gap: 4, minHeight: 72,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: isToday ? 700 : 400,
                  background: isToday ? 'var(--grad)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--txt2)',
                }}>
                  {day}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {evs.slice(0, 3).map((ev) => (
                  <div key={ev.id} title={ev.title} style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[ev.type] }} />
                ))}
                {evs.length > 3 && <span style={{ fontSize: 9, color: 'var(--txt3)', marginLeft: 2 }}>+{evs.length - 3}</span>}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ weekDays, eventsForDay, today }: { weekDays: number[]; eventsForDay: (d: number) => DisplayEvent[]; today: number }) {
  const { t } = useTranslation()
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', marginBottom: 4, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 2, paddingBottom: 8 }}>
        <div />
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', textTransform: 'uppercase' }}>{t(`calendar.daysHeader.${DAY_KEYS[i]}`)}</div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '4px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, background: d === today ? 'var(--grad)' : 'transparent', color: d === today ? '#fff' : 'var(--txt)' }}>
              {d}
            </div>
          </div>
        ))}
      </div>

      {WEEK_HOURS.map((hour) => (
        <div key={hour} style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', minHeight: 52, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'JetBrains Mono, monospace', paddingTop: 4, paddingRight: 8, textAlign: 'right' }}>{hour}</div>
          {weekDays.map((d, i) => {
            const evs = eventsForDay(d).filter((e) => e.time?.startsWith(hour.slice(0, 2)))
            return (
              <div key={i} style={{ padding: '4px 3px', borderLeft: '1px solid var(--border-subtle)' }}>
                {evs.map((ev) => (
                  <div key={ev.id} style={{ background: `${TYPE_COLORS[ev.type]}22`, borderLeft: `3px solid ${TYPE_COLORS[ev.type]}`, borderRadius: 4, padding: '3px 6px', fontSize: 10, color: TYPE_COLORS[ev.type], fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SidePanel({ selectedDay, events, monthName }: { selectedDay: number | null; events: DisplayEvent[]; monthName: string }) {
  const { t } = useTranslation()
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
          {selectedDay ? t('calendar.eventsForDay', { day: selectedDay, month: monthName }) : t('calendar.selectDay')}
        </div>
        {selectedDay && (
          <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 2 }}>
            {events.length !== 1 ? t('calendar.eventCountPlural', { count: events.length }) : t('calendar.eventCount', { count: events.length })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <AnimatePresence mode="wait">
          {!selectedDay ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--txt3)', fontSize: 13, gap: 8, padding: '40px 0', textAlign: 'center' }}
            >
              <CalendarDays size={28} style={{ opacity: 0.3 }} />
              {t('calendar.clickDayHint')}
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div key="no-events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 13, padding: '30px 0' }}
            >
              {t('calendar.noEvents')}
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map((ev) => {
                const Icon = TYPE_ICONS[ev.type] || FileText
                const color = TYPE_COLORS[ev.type] || 'var(--txt2)'
                const isMatch = ev.type === 'match'
                const resColor = ev.result ? RESULT_COLOR[ev.result] : null
                return (
                  <div key={ev.id} style={{ background: 'var(--s3)', borderRadius: 10, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {isMatch && ev.leagueLogo ? (
                        <TeamLogo src={ev.leagueLogo} alt={ev.subtitle || 'liga'} size={14} />
                      ) : (
                        <Icon size={12} style={{ color, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--txt2)' }}>{ev.time}</span>
                      {resColor && ev.result && (
                        <span style={{
                          marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.04em', borderRadius: 99, padding: '1px 7px',
                          color: resColor, background: `${resColor}22`, border: `1px solid ${resColor}55`,
                        }}>
                          {t(`calendar.result.${ev.result}`)}
                        </span>
                      )}
                    </div>

                    {isMatch && (ev.homeLogo || ev.awayLogo) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.4 }}>
                        <TeamLogo src={ev.homeLogo || ''} alt="" size={16} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{ev.title}</span>
                        <TeamLogo src={ev.awayLogo || ''} alt="" size={16} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', lineHeight: 1.4 }}>{ev.title}</div>
                    )}

                    <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}22`, color, textTransform: 'capitalize' }}>
                      {ev.subtitle || ev.type}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <button style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px dashed var(--border-mid)', background: 'transparent', color: 'var(--txt2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={14} />
          {t('calendar.scheduleContent')}
        </button>
      </div>
    </div>
  )
}
