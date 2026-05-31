'use client'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { isLiveStatus } from '@/types/fixtures'
import { TeamLogo } from '@/components/timeline/TeamLogo'
import { useTranslation } from '@/hooks/useTranslation'

function LiveDot() {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: 'var(--green)', animation: 'pulseDot 1.4s ease-in-out infinite', flexShrink: 0,
    }} />
  )
}

// Tab strip — one per active fixture, plus a "+ Jogo" button. Switching tabs
// changes selectedFixtureId; the rest of the War Room re-renders off the mirror.
export function WarRoomTabs() {
  const router = useRouter()
  const fixtures = useWarRoomStore(useShallow(s => s.activeFixtures))
  const selectedId = useWarRoomStore(s => s.selectedFixtureId)
  const sessions = useWarRoomStore(s => s.sessions)
  const selectFixture = useWarRoomStore(s => s.selectFixture)
  const { t } = useTranslation()

  if (fixtures.length === 0) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      padding: '6px 12px', overflowX: 'auto',
      borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg)',
    }}>
      {fixtures.map(f => {
        const id = f.fixture.id
        const active = id === selectedId
        const liveStatus = sessions[id]?.liveData?.status ?? f.fixture.status.short
        const live = isLiveStatus(liveStatus)
        return (
          <button
            key={id}
            onClick={() => selectFixture(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              height: 30, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontWeight: 600,
              background: active ? 'var(--s3)' : 'var(--s2)',
              color: active ? 'var(--txt)' : 'var(--txt2)',
              border: `1px solid ${active ? 'var(--blue)' : 'var(--border-subtle)'}`,
              maxWidth: 240,
            }}
          >
            <TeamLogo src={f.teams.home.logo} alt={f.teams.home.name} size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.teams.home.name} × {f.teams.away.name}
            </span>
            <TeamLogo src={f.teams.away.logo} alt={f.teams.away.name} size={16} />
            {live && <LiveDot />}
          </button>
        )
      })}

      <button
        onClick={() => router.push('/timeline')}
        title={t('warroom.addAnotherMatch')}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          height: 30, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
          fontSize: 11, fontWeight: 600,
          background: 'transparent', color: 'var(--txt3)',
          border: '1px dashed var(--border-subtle)',
        }}
      >
        <Plus size={12} /> {t('warroom.matchTab')}
      </button>
    </div>
  )
}
