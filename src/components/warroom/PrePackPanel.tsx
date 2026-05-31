'use client'
import { Package, Rocket, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWarRoomStore, type PrePackScenario } from '@/store/useWarRoomStore'
import { useMultipostStore } from '@/store/useMultipostStore'
import { useTranslation } from '@/hooks/useTranslation'

const SCENARIO_COLOR: Record<PrePackScenario, string> = {
  win: 'var(--green)', draw: 'var(--yellow)', loss: 'var(--red)',
}

// Pre-produced creative bundles for each end-of-match scenario. Deploying one
// hands its caption + platforms to Multipost (no game data is invented — the
// matchup names come from the live fixture).
export function PrePackPanel() {
  const prePacks = useWarRoomStore(s => s.prePacks)
  const fixture = useWarRoomStore(s => s.activeFixture)
  const activatePrePack = useWarRoomStore(s => s.activatePrePack)
  const setDraft = useMultipostStore(s => s.setDraft)
  const router = useRouter()
  const { t } = useTranslation()

  const matchup = fixture
    ? `${fixture.teams.home.name} x ${fixture.teams.away.name}`
    : ''

  const deploy = (scenario: PrePackScenario, label: string) => {
    activatePrePack(scenario)
    setDraft({
      caption: `${label.toUpperCase()} · ${matchup}`,
      platforms: ['instagram', 'twitter', 'facebook'],
      scheduledAt: null,
      source: 'warroom',
    })
    toast.success(t('warroom.prePackToast', { label }))
    router.push('/multipost')
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Package size={13} style={{ color: 'var(--txt2)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t('warroom.prePacks')}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--txt3)' }}>
          {t('warroom.deployByScenario')}
        </span>
      </div>

      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prePacks.map(pack => {
          const color = SCENARIO_COLOR[pack.scenario]
          const deployed = pack.status === 'deployed'
          return (
            <div key={pack.scenario} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${deployed ? color + '55' : 'var(--border-subtle)'}`,
              background: deployed ? color + '10' : 'var(--s2)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{pack.label}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
                  {t('warroom.prePackArts', { assets: pack.assetCount, platforms: pack.platformCount })}
                </div>
              </div>
              {deployed ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Check size={11} /> {t('warroom.prePackSent')}
                </span>
              ) : (
                <button
                  onClick={() => deploy(pack.scenario, pack.label)}
                  style={{
                    height: 26, padding: '0 10px', borderRadius: 6,
                    background: color + '15', color, border: `1px solid ${color}40`,
                    cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  }}
                >
                  <Rocket size={10} /> {t('warroom.prePackDeploy')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
