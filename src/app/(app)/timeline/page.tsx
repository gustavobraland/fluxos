'use client'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/shallow'
import { useRouter } from 'next/navigation'
import { useFixturesStore } from '@/store/useFixturesStore'
import { useWarRoomStore, type WarRoomSetup } from '@/store/useWarRoomStore'
import { isLiveStatus } from '@/types/fixtures'
import type { Fixture } from '@/types/fixtures'
import { FixturesToolbar, type FixtureFilter } from '@/components/timeline/FixturesToolbar'
import { FixturesDayGroups } from '@/components/timeline/FixturesDayGroups'
import { FixtureSelectedBar } from '@/components/timeline/FixtureSelectedBar'
import { WarRoomSetupModal } from '@/components/timeline/WarRoomSetupModal'
import { useTranslation } from '@/hooks/useTranslation'

export default function TimelinePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const setActiveFixture = useWarRoomStore(s => s.setActiveFixture)

  const {
    fixtures, loading, error, selectedFixture, requestsUsed, connected, lastFetched,
    fetchAll, selectFixture,
  } = useFixturesStore(
    useShallow(s => ({
      fixtures: s.fixtures,
      loading: s.loading,
      error: s.error,
      selectedFixture: s.selectedFixture,
      requestsUsed: s.requestsUsed,
      connected: s.connected,
      lastFetched: s.lastFetched,
      fetchAll: s.fetchAll,
      selectFixture: s.selectFixture,
    }))
  )

  const [filter, setFilter] = useState<FixtureFilter>('ALL')
  const [modalFixture, setModalFixture] = useState<Fixture | null>(null)

  // Fetch on mount (store skips if cache is still fresh)
  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(
    () => filter === 'ALL' ? fixtures : fixtures.filter(f => f._category === filter),
    [fixtures, filter]
  )

  const liveCount = useMemo(
    () => fixtures.filter(f => isLiveStatus(f.fixture.status.short)).length,
    [fixtures]
  )

  const handleLaunch = (setup: WarRoomSetup) => {
    if (!modalFixture) return
    setActiveFixture(modalFixture, setup)
    setModalFixture(null)
    router.push('/warroom')
  }

  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 16px', flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
          {t('timeline.title')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>
          {t('timeline.subtitle')}
        </div>
      </div>

      {/* Toolbar */}
      <FixturesToolbar
        filter={filter}
        onFilter={setFilter}
        liveCount={liveCount}
        requestsUsed={requestsUsed}
        loading={loading}
        lastFetched={lastFetched}
        onRefresh={fetchAll}
      />

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px', paddingBottom: selectedFixture ? 90 : 16,
      }}>
        {loading && fixtures.length === 0 ? (
          <CenteredState emoji="⏳" text={t('timeline.loading')} />
        ) : error && fixtures.length === 0 ? (
          <CenteredState
            emoji="⚠"
            text={connected ? t('timeline.errorLoad') : t('timeline.apiUnavailable')}
            sub={error}
            action={{ label: t('timeline.tryAgain'), onClick: fetchAll }}
          />
        ) : filtered.length === 0 ? (
          <CenteredState
            emoji="🏟"
            text={t('timeline.noFixtures')}
            sub={filter === 'ALL' ? t('timeline.noFixturesAll') : t('timeline.noFixturesFilter')}
          />
        ) : (
          <FixturesDayGroups
            fixtures={filtered}
            selectedId={selectedFixture?.fixture.id ?? null}
            onSelect={selectFixture}
            onOpenWarRoom={setModalFixture}
          />
        )}
      </div>

      {/* Selected bar */}
      <AnimatePresence>
        {selectedFixture && (
          <FixtureSelectedBar
            key={selectedFixture.fixture.id}
            fixture={selectedFixture}
            onOpenWarRoom={() => setModalFixture(selectedFixture)}
            onClear={() => selectFixture(null)}
          />
        )}
      </AnimatePresence>

      {/* Setup modal */}
      <AnimatePresence>
        {modalFixture && (
          <WarRoomSetupModal
            fixture={modalFixture}
            onClose={() => setModalFixture(null)}
            onLaunch={handleLaunch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Centered empty / loading / error state ────────────────────────────────────

function CenteredState({
  emoji, text, sub, action,
}: {
  emoji: string
  text: string
  sub?: string | null
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 280, gap: 8, textAlign: 'center',
    }}>
      <span style={{ fontSize: 32, opacity: 0.28 }}>{emoji}</span>
      <span style={{ fontSize: 13, color: 'var(--txt2)', fontWeight: 600 }}>{text}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'var(--font-mono)' }}>{sub}</span>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 6, height: 32, padding: '0 16px', borderRadius: 8,
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)',
            color: 'var(--blue)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
