/* eslint-disable @next/next/no-img-element */
// ─── Render do template de arte de gol (next/og / Satori) ─────────────────────
// Recria o layout do PSD Canal BRA (1080×1350): DUAS fotos full-bleed (gol no
// topo, comemoração embaixo), linha divisória em gradiente Canal BRA, placar
// CENTRALIZADO sobre a linha, logo oficial no canto superior esquerdo, watermark
// @CANAL.BRA no topo, título "GOL DE {jogador}" e rodapé com o minuto no padrão
// brasileiro ("40' DO SEGUNDO TEMPO"). Só fotos/copy/placar/bandeiras mudam.

import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { countryCode, flagUrl, ptName } from '@/lib/country-flags'
import { CANAL_BRA_LOGO, CANAL_BRA_LOGO_W, CANAL_BRA_LOGO_H } from './canal-bra-logo'

const CYAN = '#00D5FF'
const GREEN = '#2DFFB3'
const W = 1080
const H = 1350
const HALF = 675
const GRAD = `linear-gradient(90deg, ${CYAN}, ${GREEN})`
const LOGO_W = 116
const LOGO_H = Math.round(LOGO_W * (CANAL_BRA_LOGO_H / CANAL_BRA_LOGO_W))

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

// Minuto no padrão brasileiro: ≤45 = primeiro tempo; >45 = (min-45) segundo tempo.
export function minuteBR(min: number | null | undefined): string {
  if (min == null) return ''
  return min <= 45 ? `${min}' DO PRIMEIRO TEMPO` : `${min - 45}' DO SEGUNDO TEMPO`
}

// Frase contextual (fallback quando não há minuto).
function contextualFooter(b: GoalTemplateBody): string {
  const st = b.scorerTeam
  if (!st) return `${ptName(b.homeTeam).toUpperCase()} ${b.homeScore} × ${b.awayScore} ${ptName(b.awayTeam).toUpperCase()}`
  const isHome = norm(st) === norm(b.homeTeam)
  const isAway = norm(st) === norm(b.awayTeam)
  const T = ptName(st).toUpperCase()
  if (!isHome && !isAway) return `${T} BALANÇA AS REDES`
  const s = isHome ? b.homeScore : b.awayScore
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

// Meia-tela com a foto preenchendo tudo + overlay escuro para legibilidade.
function PhotoHalf({ url, gradient, hint, overlay, display }: {
  url: string | null | undefined; gradient: string; hint: string; overlay: string; display?: string
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', width: W, height: HALF, backgroundImage: gradient, alignItems: 'center', justifyContent: 'center' }}>
      {url
        ? <img src={url} width={W} height={HALF} style={{ width: W, height: HALF, objectFit: 'cover' }} />
        : <div style={{ display: 'flex', fontFamily: display, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase' }}>{hint}</div>}
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: HALF, backgroundImage: overlay }} />
    </div>
  )
}

function PillFlag({ url }: { url: string | null }) {
  if (!url) return <div style={{ display: 'flex', width: 92, height: 62, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)' }} />
  return <img src={url} width={92} height={62} style={{ width: 92, height: 62, objectFit: 'cover', borderRadius: 6 }} />
}

/** Renderiza o PNG 1080×1350 do template de gol. */
export async function renderGoalArtPng(b: GoalTemplateBody): Promise<ArrayBuffer> {
  const anton = await loadAnton()
  const display = anton ? 'Anton' : undefined
  const headline = b.scorerName ? `GOL DE ${b.scorerName.toUpperCase()}` : 'GOL!'
  const footer = b.footerText
    ? b.footerText.toUpperCase()
    : (b.minute != null ? minuteBR(b.minute) : contextualFooter(b))
  const homeFlag = flagFor(b.homeTeam, b.homeFlag)
  const awayFlag = flagFor(b.awayTeam, b.awayFlag)

  const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
    <span style={{ display: 'flex', color: GREEN, fontFamily: display, fontSize: 56 }}>{dir === 'l' ? '›' : '‹'}</span>
  )

  const tree = (
    <div style={{ position: 'relative', width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: '#05080a', fontFamily: display ?? 'sans-serif' }}>
      {/* TOPO — foto do gol */}
      <PhotoHalf url={b.topImageUrl} gradient="linear-gradient(135deg, #1f2937, #0b1220)" hint="Foto do gol"
        overlay="linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 32%, rgba(0,0,0,0.62) 100%)" display={display} />
      {/* BAIXO — foto da comemoração */}
      <PhotoHalf url={b.bottomImageUrl} gradient="linear-gradient(135deg, #0e3a3a, #0b1220)" hint="Foto da comemoração"
        overlay="linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.78) 100%)" display={display} />

      {/* Linha divisória — gradiente Canal BRA, atravessa toda a arte */}
      <div style={{ position: 'absolute', top: HALF - 4, left: 0, width: W, height: 8, backgroundImage: GRAD }} />

      {/* Logo oficial — canto superior esquerdo */}
      <img src={CANAL_BRA_LOGO} width={LOGO_W} height={LOGO_H} style={{ position: 'absolute', top: 30, left: 40, width: LOGO_W, height: LOGO_H }} />

      {/* Watermark @CANAL.BRA — topo centro */}
      <div style={{ position: 'absolute', top: 48, left: 0, width: W, display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 24, letterSpacing: 12, fontWeight: 700 }}>
        @ C A N A L . B R A
      </div>

      {/* Título — GOL DE {jogador}, logo acima do placar */}
      <div style={{ position: 'absolute', top: 506, left: 0, width: W, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <Chevron dir="l" />
        <span style={{ display: 'flex', color: '#fff', fontFamily: display, fontSize: 60, letterSpacing: 1 }}>{headline}</span>
        <Chevron dir="r" />
      </div>

      {/* Placar — centralizado SOBRE a linha divisória */}
      <div style={{ position: 'absolute', top: 612, left: 0, width: W, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, backgroundImage: GRAD, border: '4px solid rgba(255,255,255,0.92)', borderRadius: 20, padding: '14px 30px' }}>
          <PillFlag url={homeFlag} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff', fontFamily: display, fontSize: 76 }}>
            <span style={{ display: 'flex' }}>{String(b.homeScore ?? 0)}</span>
            <span style={{ display: 'flex', fontSize: 50 }}>×</span>
            <span style={{ display: 'flex' }}>{String(b.awayScore ?? 0)}</span>
          </div>
          <PillFlag url={awayFlag} />
        </div>
      </div>

      {/* Rodapé — minuto no padrão brasileiro */}
      <div style={{ position: 'absolute', bottom: 54, left: 0, width: W, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Chevron dir="l" />
        <span style={{ display: 'flex', color: '#fff', fontFamily: display, fontSize: 48, letterSpacing: 1 }}>{footer}</span>
        <Chevron dir="r" />
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
