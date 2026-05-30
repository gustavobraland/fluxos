'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Radio } from 'lucide-react'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { isLiveStatus, isFinishedStatus } from '@/types/fixtures'
import { MatchHeader } from '@/components/warroom/MatchHeader'
import { WarRoomTabs } from '@/components/warroom/WarRoomTabs'
import { LineupPanel } from '@/components/warroom/LineupPanel'
import { ContentQueue } from '@/components/warroom/ContentQueue'
import { PrePackPanel } from '@/components/warroom/PrePackPanel'
import { QuotaDisplay } from '@/components/warroom/QuotaDisplay'
import { startPolling, stopPolling } from '@/services/warroom-polling'
import { fetchLineup } from '@/services/warroom-lineup'
import { startMockMatch, stopMockMatch, isMockRunning } from '@/services/warroom-mock'

const KICKOFF_WINDOW_MS = 10 * 60_000  // begin polling 10 min before kickoff
const IS_DEV = process.env.NODE_ENV === 'development'

// ─── Empty state (no fixture selected) ────────────────────────────────────────

function EmptyState() {
  const router = useRouter()
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg)',
    }}>
      <Radio size={32} style={{ color: 'var(--txt3)', opacity: 0.4 }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt2)' }}>
          Nenhuma partida no War Room
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 4 }}>
          Selecione um jogo na aba Partidas para começar a monitorar
        </div>
      </div>
      <button
        onClick={() => router.push('/timeline')}
        style={{
          height: 32, padding: '0 16px', borderRadius: 8,
          background: 'rgba(91,184,232,0.12)', border: '1px solid rgba(91,184,232,0.3)',
          color: 'var(--blue)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}
      >
        ← Selecionar partida
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarRoomPage() {
  const fixture = useWarRoomStore(s => s.activeFixture)
  const liveData = useWarRoomStore(s => s.liveData)
  const queue = useWarRoomStore(s => s.queue)
  const fixtureId = fixture?.fixture.id ?? null
  const kickoffTs = fixture?.fixture.timestamp ?? 0
  const cachedStatus = fixture?.fixture.status.short

  // Lineup: fetch once per fixture
  useEffect(() => {
    if (fixtureId == null) return
    void fetchLineup(fixtureId)
  }, [fixtureId])

  // Adaptive polling lifecycle — only spin up near/at kickoff to save credits
  useEffect(() => {
    if (fixtureId == null) return

    const liveNow = cachedStatus ? isLiveStatus(cachedStatus) : false
    const finished = cachedStatus ? isFinishedStatus(cachedStatus) : false

    const maybeStart = () => {
      const st = useWarRoomStore.getState()
      if (isMockRunning() || st.isPolling || st.matchEnded) return
      const nearKickoff = kickoffTs * 1000 - Date.now() < KICKOFF_WINDOW_MS
      if (isLiveStatus(st.liveData?.status ?? cachedStatus ?? 'NS') || nearKickoff) {
        startPolling(fixtureId)
      }
    }

    if (isMockRunning()) {
      // a simulation owns the store — don't touch the live poller
    } else if (liveNow) {
      startPolling(fixtureId)
    } else if (!finished) {
      maybeStart()
    }

    // Re-check every minute so a scheduled match auto-starts at kickoff
    const iv = setInterval(maybeStart, 60_000)
    return () => {
      clearInterval(iv)
      stopPolling()
      stopMockMatch()
    }
  }, [fixtureId, kickoffTs, cachedStatus])

  if (!fixture) return <EmptyState />

  const status = liveData?.status ?? fixture.fixture.status.short
  const showQueue = isLiveStatus(status) || isFinishedStatus(status) || queue.length > 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', background: 'var(--bg)',
    }}>
      <WarRoomTabs />
      <MatchHeader />

      {IS_DEV && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 16px', flexShrink: 0,
          background: 'rgba(167,139,250,0.06)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: '#A78BFA', background: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.25)', borderRadius: 4, padding: '1px 6px',
          }}>
            DEV
          </span>
          <span style={{ fontSize: 10, color: 'var(--txt3)' }}>
            Simula NS → gol → intervalo → gol → fim (3s/estado, sem gastar quota)
          </span>
          <button
            onClick={() => startMockMatch()}
            style={{
              marginLeft: 'auto', height: 24, padding: '0 12px', borderRadius: 6,
              background: 'rgba(167,139,250,0.15)', color: '#A78BFA',
              border: '1px solid rgba(167,139,250,0.35)', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
            }}
          >
            ▶ Simular jogo
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main column — live content */}
        <div style={{
          flex: '0 0 58%', display: 'flex', flexDirection: 'column', gap: 10,
          padding: '12px 8px 12px 12px', overflowY: 'auto',
        }}>
          {showQueue ? (
            <ContentQueue />
          ) : null}

          {showQueue && queue.length === 0 && (
            <div style={{
              background: 'var(--s1)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '32px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                Monitorando ao vivo — conteúdo aparece em gol, intervalo e fim de jogo.
              </div>
            </div>
          )}

          {!showQueue && (
            <div style={{
              background: 'var(--s1)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '32px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt2)' }}>
                Aguardando o apito inicial
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                O monitoramento ao vivo começa automaticamente perto do horário do jogo.
              </div>
            </div>
          )}
        </div>

        {/* Side column — lineup, pre-packs, quota */}
        <div style={{
          flex: '0 0 42%', display: 'flex', flexDirection: 'column', gap: 10,
          padding: '12px 12px 12px 4px', overflowY: 'auto',
        }}>
          <LineupPanel />
          <PrePackPanel />
          <QuotaDisplay />
        </div>
      </div>
    </div>
  )
}
