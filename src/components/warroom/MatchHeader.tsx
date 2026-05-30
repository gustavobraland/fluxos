'use client'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { isLiveStatus, isFinishedStatus, type FixtureStatus } from '@/types/fixtures'
import { formatDateShortBRT, formatTimeBRT } from '@/lib/fixtures-client'
import { TeamLogo } from '@/components/timeline/TeamLogo'
import { CountdownTimer } from './CountdownTimer'
import { stopPolling } from '@/services/warroom-polling'

function PulsingDot({ color = 'var(--red)' }: { color?: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, animation: 'pulseDot 1.4s ease-in-out infinite', flexShrink: 0,
    }} />
  )
}

// Top banner for the War Room. Reads the active fixture + the live polling
// snapshot. Live score/minute come from `liveData` (real poll); kickoff/countdown
// shown for scheduled matches; ENCERRADO once finished. All data is from the API.
export function MatchHeader() {
  const fixture = useWarRoomStore(s => s.activeFixture)
  const liveData = useWarRoomStore(s => s.liveData)
  const clearActiveFixture = useWarRoomStore(s => s.clearActiveFixture)
  const router = useRouter()

  if (!fixture) return null

  const { teams, league, fixture: f, goals } = fixture
  // Live snapshot wins over the cached timeline status/score
  const status: FixtureStatus = liveData?.status ?? f.status.short
  const elapsed = liveData?.elapsed ?? f.status.elapsed
  const live = isLiveStatus(status)
  const finished = isFinishedStatus(status)
  const showScore = live || finished
  const score = liveData?.goals ?? { home: goals.home ?? 0, away: goals.away ?? 0 }

  const dismiss = () => {
    stopPolling()
    clearActiveFixture()  // closes the selected tab; auto-selects another if any
    // Only leave the War Room when no matches remain open
    if (useWarRoomStore.getState().activeFixtures.length === 0) {
      router.push('/timeline')
    }
  }

  return (
    <div style={{
      background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 16px', flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Competition */}
      <div style={{ textAlign: 'center', flexShrink: 0, maxWidth: 90 }}>
        <TeamLogo src={league.logo} alt={league.name} size={18} />
        <div style={{
          fontSize: 8, fontWeight: 700, color: 'var(--txt3)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {league.name}
        </div>
      </div>

      {/* Home */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
        <span style={{
          fontSize: 13, fontWeight: 700, color: 'var(--txt)', textAlign: 'right',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {teams.home.name}
        </span>
        <TeamLogo src={teams.home.logo} alt={teams.home.name} size={28} />
      </div>

      {/* Score / countdown */}
      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 72 }}>
        {showScore ? (
          <>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800,
              color: live ? 'var(--green)' : 'var(--txt)', letterSpacing: 2, lineHeight: 1,
            }}>
              {score.home}<span style={{ color: 'var(--txt3)', margin: '0 3px' }}>–</span>{score.away}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 4 }}>
              {live ? (
                <>
                  <PulsingDot color="var(--green)" />
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                    {status === 'HT' ? 'INTERVALO' : `${elapsed ?? ''}'`}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--txt3)' }}>
                  ENCERRADO
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CountdownTimer kickoffTs={f.timestamp} />
            <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>
              {formatDateShortBRT(f.timestamp)} · {formatTimeBRT(f.timestamp)} BRT
            </div>
          </div>
        )}
      </div>

      {/* Away */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <TeamLogo src={teams.away.logo} alt={teams.away.name} size={28} />
        <span style={{
          fontSize: 13, fontWeight: 700, color: 'var(--txt)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {teams.away.name}
        </span>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        title="Sair do War Room"
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--s2)', border: '1px solid var(--border-subtle)',
          color: 'var(--txt3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
