/* eslint-disable @next/next/no-img-element */
// ─── Render do template de arte de gol (next/og / Satori) ─────────────────────
// Reutilizado por /api/art/generate-template (manual) e /api/art/generate-goal
// (automático com fotos do DALL-E). Renderiza 1080×1350 (4:5, feed do Instagram)
// no modelo Canal BRA e faz upload no Supabase Storage (bucket media).

import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { countryCode, flagUrl, ptName } from '@/lib/country-flags'

const TEAL = '#00D4B4'
const TEAL_DARK = '#064E43'
const DARK = '#0B1F1C'
const W = 1080
const H = 1350

export interface GoalTemplateBody {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  scorerName?: string | null
  minute?: number | null
  competition?: string | null
  scorerTeam?: string | null
  footerText?: string | null
  topImageUrl?: string | null
  bottomImageUrl?: string | null
  homeFlag?: string | null
  awayFlag?: string | null
}

// ─── Fonte de destaque (Anton) — carregada uma vez, com fallback gracioso ─────
let antonCache: ArrayBuffer | null | undefined
async function loadAnton(): Promise<ArrayBuffer | null> {
  if (antonCache !== undefined) return antonCache
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Anton')).text()
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)
    if (m) {
      const res = await fetch(m[1])
      if (res.ok) { antonCache = await res.arrayBuffer(); return antonCache }
    }
  } catch { /* sem rede → usa fonte padrão */ }
  antonCache = null
  return null
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// Frase do rodapé derivada do contexto do gol (ou override via footerText).
export function footerFor(b: GoalTemplateBody): string {
  if (b.footerText) return b.footerText.toUpperCase()
  const st = b.scorerTeam
  if (!st) return `${ptName(b.homeTeam).toUpperCase()} ${b.homeScore} × ${b.awayScore} ${ptName(b.awayTeam).toUpperCase()}`
  const isHome = norm(st) === norm(b.homeTeam)
  const isAway = norm(st) === norm(b.awayTeam)
  const T = ptName(st).toUpperCase()
  if (!isHome && !isAway) return `${T} BALANÇA AS REDES`
  const s = isHome ? b.homeScore : b.awayScore // placar do time que marcou (após o gol)
  const o = isHome ? b.awayScore : b.homeScore
  const before = s - 1
  if (s === o) return `${T} EMPATA O JOGO`
  if (s > o && before === o) return `${T} SAI NA FRENTE NO PLACAR`
  if (s > o && before > o) return `${T} AMPLIA A VANTAGEM`
  return `${T} DIMINUI O PLACAR`
}

function flagFor(team: string, fallback?: string | null): string | null {
  const code = countryCode(team)
  return code ? flagUrl(code) : (fallback ?? null)
}

function PhotoBand({ url, height, gradient, hint, display }: {
  url: string | null | undefined; height: number; gradient: string; hint: string; display?: string
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', width: W, height, backgroundImage: gradient, alignItems: 'center', justifyContent: 'center' }}>
      {url ? (
        <img src={url} width={W} height={height} style={{ width: W, height, objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', fontFamily: display, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function Flag({ url }: { url: string | null }) {
  if (!url) return <div style={{ display: 'flex', width: 132, height: 88, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.15)' }} />
  return <img src={url} width={132} height={88} style={{ width: 132, height: 88, objectFit: 'cover', borderRadius: 8, border: '3px solid rgba(255,255,255,0.85)' }} />
}

/** Renderiza o PNG 1080×1350 do template de gol. */
export async function renderGoalArtPng(b: GoalTemplateBody): Promise<ArrayBuffer> {
  const anton = await loadAnton()
  const display = anton ? 'Anton' : undefined
  const competition = b.competition || 'Copa do Mundo 2026'
  const minute = b.minute != null ? `${b.minute}'` : ''
  const headline = b.scorerName ? `GOL DE ${b.scorerName.toUpperCase()} ${minute}`.trim() : `GOL! ${minute}`.trim()
  const footer = footerFor(b)
  const homeFlag = flagFor(b.homeTeam, b.homeFlag)
  const awayFlag = flagFor(b.awayTeam, b.awayFlag)

  const tree = (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: DARK, fontFamily: display ?? 'sans-serif' }}>
      {/* TOPO — foto de ação + logo + watermark */}
      <div style={{ position: 'relative', display: 'flex', width: W, height: 520 }}>
        <PhotoBand url={b.topImageUrl} height={520} gradient="linear-gradient(135deg, #14532d, #052e16)" hint="Foto de ação" display={display} />
        <div style={{ position: 'absolute', top: 34, left: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: DARK, border: `3px solid ${TEAL}`, borderRadius: 14, padding: '10px 16px' }}>
          <div style={{ display: 'flex', fontFamily: display, fontSize: 22, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>CANAL</div>
          <div style={{ display: 'flex', fontFamily: display, fontSize: 34, color: TEAL, letterSpacing: 2, lineHeight: 1 }}>BRA</div>
        </div>
        <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 22, letterSpacing: 10 }}>
          @ C A N A L . B R A
        </div>
      </div>

      {/* MEIO — faixa teal com título, placar e competição */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: W, height: 380, backgroundColor: TEAL, padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#fff', fontFamily: display, fontSize: 64, letterSpacing: 1 }}>
          <span style={{ display: 'flex', color: 'rgba(255,255,255,0.6)' }}>›</span>
          <span style={{ display: 'flex' }}>{headline}</span>
          <span style={{ display: 'flex', color: 'rgba(255,255,255,0.6)' }}>‹</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 26, backgroundColor: DARK, borderRadius: 18, padding: '14px 28px' }}>
          <Flag url={homeFlag} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#fff', fontFamily: display, fontSize: 84 }}>
            <span style={{ display: 'flex' }}>{String(b.homeScore ?? 0)}</span>
            <span style={{ display: 'flex', color: TEAL, fontSize: 56 }}>×</span>
            <span style={{ display: 'flex' }}>{String(b.awayScore ?? 0)}</span>
          </div>
          <Flag url={awayFlag} />
        </div>

        <div style={{ display: 'flex', marginTop: 22, color: TEAL_DARK, fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
          {competition}
        </div>
      </div>

      {/* BAIXO — foto do jogador comemorando */}
      <div style={{ position: 'relative', display: 'flex', width: W, height: 320 }}>
        <PhotoBand url={b.bottomImageUrl} height={320} gradient="linear-gradient(135deg, #0e7490, #155e75)" hint="Foto comemoração" display={display} />
      </div>

      {/* RODAPÉ — frase em branco sobre fundo escuro */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, width: W, height: 130, backgroundColor: DARK }}>
        <span style={{ display: 'flex', color: TEAL }}>›</span>
        <span style={{ display: 'flex', color: '#fff', fontFamily: display, fontSize: 44, letterSpacing: 1 }}>{footer}</span>
        <span style={{ display: 'flex', color: TEAL }}>‹</span>
      </div>
    </div>
  )

  const img = new ImageResponse(tree, {
    width: W,
    height: H,
    fonts: anton ? [{ name: 'Anton', data: anton, style: 'normal', weight: 400 }] : undefined,
  })
  return img.arrayBuffer()
}

/** Upload do PNG no Supabase Storage (bucket media). Fallback: data URL. */
export async function uploadArtPng(png: ArrayBuffer, baseName: string): Promise<{ artUrl: string; source: 'storage' | 'dataurl' }> {
  try {
    const supabase = await createClient()
    const fileName = `arts/${baseName}-${Date.now()}.png`
    const { error: upErr } = await supabase.storage.from('media').upload(fileName, png, {
      contentType: 'image/png',
      upsert: true,
    })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName)
      return { artUrl: publicUrl, source: 'storage' }
    }
    console.warn('[art] upload falhou, devolvendo data URL:', upErr.message)
  } catch (e) {
    console.warn('[art] exceção no storage, devolvendo data URL:', e)
  }
  return { artUrl: `data:image/png;base64,${Buffer.from(png).toString('base64')}`, source: 'dataurl' }
}
