// ─── Arte de gol AUTOMÁTICA — DALL-E 3 (2 fotos) + next/og + Supabase ─────────
// POST { homeTeam, awayTeam, homeScore, awayScore, scorerName?, minute?,
//        competition?, scorerTeam?, homeFlag?, awayFlag? }
//   → { artUrl, source, photos: { action: boolean, player: boolean } }
//
// Fluxo 100% automático (só o clique em "Arte"):
//   1. Gera 2 imagens via DALL-E 3 — foto de ação (topo) e jogador comemorando (baixo)
//   2. Monta a arte final no template Canal BRA (next/og) com essas fotos
//   3. Salva no Supabase Storage e devolve a URL pública
//
// Robusto: se OPENAI_API_KEY faltar ou o DALL-E falhar, segue com placeholders
// (a arte ainda é gerada). Nunca derruba o fluxo.

import { renderGoalArtPng, uploadArtPng, type GoalTemplateBody } from '@/lib/art/goal-template'
import { jerseyColor } from '@/lib/country-flags'

export const dynamic = 'force-dynamic'

type DalleSize = '1024x1024' | '1792x1024' | '1024x1792'

const QUALITY = (process.env.OPENAI_IMAGE_QUALITY as 'standard' | 'hd') || 'standard'

const ACTION_PROMPT =
  'Professional football match action photo, players competing for the ball inside the penalty area, ' +
  'stadium crowd in background, FIFA World Cup 2026, broadcast camera angle, photorealistic, ' +
  'high quality sports photography, no text'

function playerPrompt(color: string): string {
  return (
    `Professional football player celebrating a goal, wearing ${color} jersey, euphoric celebration gesture, ` +
    'teal/green blurred background, close up portrait, photorealistic sports photography, no text, no logos'
  )
}

/** Uma geração DALL-E 3. Retorna a URL temporária ou null (nunca lança). */
async function dalle(prompt: string, size: DalleSize, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: QUALITY, style: 'vivid' }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[art-goal] DALL-E erro HTTP', res.status, err.slice(0, 200))
      return null
    }
    const data = (await res.json()) as { data?: { url?: string }[] }
    return data?.data?.[0]?.url ?? null
  } catch (e) {
    console.error('[art-goal] DALL-E exceção:', e)
    return null
  }
}

export async function POST(req: Request): Promise<Response> {
  let b: GoalTemplateBody
  try {
    b = (await req.json()) as GoalTemplateBody
  } catch {
    return Response.json({ artUrl: null, error: 'bad_request' }, { status: 400 })
  }
  if (!b.homeTeam || !b.awayTeam) {
    return Response.json({ artUrl: null, error: 'missing_teams' }, { status: 400 })
  }

  // 1. Gera as 2 fotos em paralelo (degrada para placeholders se faltar key/erro)
  const apiKey = process.env.OPENAI_API_KEY
  let actionUrl: string | null = null
  let playerUrl: string | null = null
  if (apiKey) {
    const color = jerseyColor(b.scorerTeam ?? b.homeTeam)
    ;[actionUrl, playerUrl] = await Promise.all([
      dalle(ACTION_PROMPT, '1792x1024', apiKey),
      dalle(playerPrompt(color), '1024x1024', apiKey),
    ])
  } else {
    console.log('[art-goal] OPENAI_API_KEY ausente — gerando com placeholders')
  }

  // 2. Monta a arte final com as fotos (ou placeholders)
  let png: ArrayBuffer
  try {
    png = await renderGoalArtPng({ ...b, topImageUrl: actionUrl, bottomImageUrl: playerUrl })
  } catch (e) {
    console.error('[art-goal] render falhou:', e)
    return Response.json({ artUrl: null, error: 'render_failed' }, { status: 500 })
  }

  // 3. Upload + URL pública
  const safe = (s: string) => s.replace(/\s+/g, '')
  const { artUrl, source } = await uploadArtPng(png, `goal-${safe(b.homeTeam)}-${safe(b.awayTeam)}`)
  return Response.json({ artUrl, source, photos: { action: !!actionUrl, player: !!playerUrl } })
}
