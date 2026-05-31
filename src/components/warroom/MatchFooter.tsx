'use client'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { isLiveStatus, isFinishedStatus, type FixtureStatus } from '@/types/fixtures'
import { TeamLogo } from '@/components/timeline/TeamLogo'
import { useTranslation } from '@/hooks/useTranslation'

function statusLabel(
  status: FixtureStatus,
  elapsed: number | null,
  t: (key: string) => string,
): { text: string; live: boolean } {
  if (status === 'HT') return { text: t('warroom.halftime'), live: true }
  if (isFinishedStatus(status)) return { text: t('warroom.finished'), live: false }
  if (isLiveStatus(status)) return { text: `${elapsed ?? 0}'`, live: true }
  return { text: t('warroom.preMatch'), live: false }
}

// Bottom bar (rodapé) of the War Room — visual live strip: status/minute on the
// left, the goals timeline (scorer + minute) in the middle, score on the right.
export function MatchFooter() {
  const fixture = useWarRoomStore(s => s.activeFixture)
  const liveData = useWarRoomStore(s => s.liveData)
  const goals = useWarRoomStore(s => s.goals)
  const { t } = useTranslation()

  if (!fixture) return null

  const status = liveData?.status ?? fixture.fixture.status.short
  const elapsed = liveData?.elapsed ?? fixture.fixture.status.elapsed
  const score = liveData?.goals ?? { home: fixture.goals.home ?? 0, away: fixture.goals.away ?? 0 }
  const { text, live } = statusLabel(status, elapsed, t)
  const { home, away } = fixture.teams

  return (
    <div style={{
      flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'var(--s1)',
      display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', minHeight: 48,
    }}>
      {/* Status / minute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 86 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: live ? 'var(--red)' : 'var(--txt3)',
          animation: live ? 'pulseDot 1.4s ease-in-out infinite' : undefined,
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
          color: live ? 'var(--red)' : 'var(--txt3)', letterSpacing: '0.04em',
        }}>
          {text}
        </span>
      </div>

      <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', flexShrink: 0 }} />

      {/* Goals timeline */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', minWidth: 0 }} className="no-scrollbar">
        {goals.length === 0 ? (
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('warroom.noGoalsYet')}</span>
        ) : (
          goals.map((g) => (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              background: 'var(--s2)', border: '1px solid var(--border-subtle)',
              borderRadius: 99, padding: '3px 10px 3px 8px',
            }}>
              <span style={{ fontSize: 12 }}>⚽</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>
                {g.scorer ?? g.team}
              </span>
              {g.minute != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--red)' }}>
                  {g.minute}&apos;
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt3)' }}>
                {g.score.home}-{g.score.away}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <TeamLogo src={home.logo} alt={home.name} size={18} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800,
          color: live ? 'var(--red)' : 'var(--txt)', letterSpacing: 1,
        }}>
          {score.home}<span style={{ color: 'var(--txt3)', margin: '0 3px' }}>×</span>{score.away}
        </span>
        <TeamLogo src={away.logo} alt={away.name} size={18} />
      </div>
    </div>
  )
}
