'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TEAMS, BRAND_ASSETS, type TeamCategory } from '@/lib/teams'
import { useWarRoomStore } from '@/store/useWarRoomStore'
import { useTranslation } from '@/hooks/useTranslation'
import { TeamAssetCard, type AssetCardItem } from '@/components/assets/TeamAssetCard'

type Filter = 'all' | TeamCategory | 'brand'

const FILTER_IDS: Filter[] = ['all', 'BR', 'EU', 'NT', 'brand']
const SECTION_EMOJI: Record<TeamCategory, string> = { BR: '🇧🇷', EU: '🌍', NT: '🏳' }

const GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 10,
}

async function downloadImage(url: string, name: string) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${name}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  } catch {
    // CDN may block CORS reads — open in a new tab so the user can save it
    window.open(url, '_blank', 'noopener')
  }
}

export default function AssetsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const warRoomActive = useWarRoomStore(s => s.activeFixtures.length > 0)

  const q = query.trim().toLowerCase()

  const teams = useMemo(() => TEAMS.filter(t => {
    if (!q) return true
    return (
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
    )
  }), [q])

  const brand = useMemo(() => BRAND_ASSETS.filter(b => !q || b.name.toLowerCase().includes(q)), [q])

  const copyUrl = (url: string) => {
    void navigator.clipboard?.writeText(url)
    toast.success(t('assets.toast.urlCopied'))
  }
  const insertMultipost = (url: string) => {
    void navigator.clipboard?.writeText(url)
    toast.success(t('assets.toast.urlCopiedMultipost'))
    router.push('/multipost')
  }
  const insertWarRoom = (url: string) => {
    void navigator.clipboard?.writeText(url)
    toast.success(t('assets.toast.urlCopiedWarRoom'))
    router.push('/warroom')
  }

  const cardProps = (item: AssetCardItem) => ({
    item,
    warRoomActive,
    onCopy: () => copyUrl(item.logo),
    onDownload: () => downloadImage(item.logo, item.name),
    onInsertMultipost: () => insertMultipost(item.logo),
    onInsertWarRoom: () => insertWarRoom(item.logo),
  })

  const cats: TeamCategory[] = ['BR', 'EU', 'NT']
  const showCat = (c: TeamCategory) => (filter === 'all' || filter === c) && teams.some(t => t.category === c)
  const showBrand = (filter === 'all' || filter === 'brand') && brand.length > 0
  const nothing = !showBrand && !cats.some(showCat)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 14px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--txt)' }}>{t('assets.title')}</h1>
        <p style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
          {t('assets.subtitle')}
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 14, maxWidth: 460 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('assets.searchPlaceholder')}
            style={{
              width: '100%', height: 38, padding: '0 12px 0 34px', borderRadius: 10,
              background: 'var(--s2)', border: '1px solid var(--border-subtle)',
              color: 'var(--txt)', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {FILTER_IDS.map(id => {
            const active = filter === id
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  height: 30, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: active ? 'var(--s3)' : 'var(--s2)',
                  color: active ? 'var(--txt)' : 'var(--txt2)',
                  border: `1px solid ${active ? 'var(--blue)' : 'var(--border-subtle)'}`,
                }}
              >
                {t(`assets.filters.${id}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        {nothing && (
          <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 13, padding: '48px 0' }}>
            {t('assets.empty', { query })}
          </div>
        )}

        {cats.map(c => showCat(c) && (
          <section key={c} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt2)', marginBottom: 10 }}>
              {SECTION_EMOJI[c]} {t(`assets.sections.${c}`)}
            </h2>
            <div style={GRID}>
              {teams.filter(t => t.category === c).map(t => (
                <TeamAssetCard key={t.id} {...cardProps({ name: t.name, logo: t.logo, sub: `${t.shortName} · ${t.league}` })} />
              ))}
            </div>
          </section>
        ))}

        {showBrand && (
          <section style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt2)', marginBottom: 10 }}>
              ✦ {t('assets.sections.brand')}
            </h2>
            <div style={GRID}>
              {brand.map(b => (
                <TeamAssetCard key={b.id} {...cardProps({ name: b.name, logo: b.logo })} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
