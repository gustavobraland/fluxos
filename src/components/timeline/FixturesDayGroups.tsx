'use client'
import { AnimatePresence } from 'framer-motion'
import type { Fixture } from '@/types/fixtures'
import { groupByDay, hasLiveFixture } from '@/lib/fixtures-client'
import { FixtureCard } from './FixtureCard'
import { useTranslation } from '@/hooks/useTranslation'

export function FixturesDayGroups({
  fixtures,
  selectedId,
  onSelect,
  onOpenWarRoom,
}: {
  fixtures: Fixture[]
  selectedId: number | null
  onSelect: (f: Fixture) => void
  onOpenWarRoom: (f: Fixture) => void
}) {
  const { t } = useTranslation()
  const groups = groupByDay(fixtures)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map(group => {
        const liveHere = hasLiveFixture(group.fixtures)
        return (
          <div key={group.key}>
            {/* Day header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 12, paddingBottom: 6,
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{
                fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                color: group.isToday ? 'var(--blue)' : 'var(--txt2)',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--txt3)',
                fontFamily: 'var(--font-mono)',
              }}>
                {group.fixtures.length} {group.fixtures.length === 1 ? t('timeline.game') : t('timeline.games')}
              </span>
              {liveHere && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: 'var(--green)',
                    animation: 'pulseDot 1.2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    {t('timeline.live')}
                  </span>
                </span>
              )}
            </div>

            {/* Cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}>
              <AnimatePresence initial={false}>
                {group.fixtures.map(f => (
                  <FixtureCard
                    key={f.fixture.id}
                    fixture={f}
                    selected={selectedId === f.fixture.id}
                    onSelect={() => onSelect(f)}
                    onOpenWarRoom={() => onOpenWarRoom(f)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
