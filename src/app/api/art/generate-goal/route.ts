// ─── Arte de gol AUTOMÁTICA — DALL-E 3 (2 fotos) + next/og + Supabase ─────────
// POST { homeTeam, awayTeam, homeScore, awayScore, scorerName?, minute?,
//        competition?, scorerTeam?, homeFlag?, awayFlag? }
//   → { artUrl, source, photos: { action, player }, error? }
//
// Fluxo 100% automático (só o clique em "Arte"):
//   1. Gera 2 imagens via DALL-E 3 (b64_json) — momento do gol (topo, time
//      adversário ao fundo) e jogador do time que marcou comemorando (baixo).
//   2. Embute as fotos como data URI e monta a arte no template Canal BRA.
//   3. Salva no Supabase Storage e devolve a URL pública.
//
// Robustez:
//   - response_format b64_json → a imagem volta embutida (sem 2º fetch a URL
//     temporária do OpenAI, que o Satori às vezes não consegue carregar → era a
//     causa de "gerar sem imagem").
//   - maxDuration 60 — 2 gerações DALL-E + render não estouram o limite da função.
//   - Se faltar key / DALL-E falhar → placeholders (nunca derruba o fluxo); o
//     motivo fica no log e no campo `error` da resposta.

import { renderGoalArtPng, uploadArtPng, type GoalTemplateBody } from '@/lib/art/goal-template'
import { jerseyColor } from '@/lib/country-flags'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type DalleSize = '1024x1024' | '1792x1024' | '1024x1792'
const QUALITY = (process.env.OPENAI_IMAGE_QUALITY as 'standard' | 'hd') || 'standard'

function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// FOTO 1 — topo: cena do gol (comemoração com adversário batido ao fundo).
// Sem marcas registradas (FIFA/Getty) p/ não disparar recusa de content-policy.
function actionPrompt(scorerTeam: string, scorerColor: string, opponentTeam: string, opponentColor: string): string {
  return `Photorealistic sports photography, international football World Cup 2026. ` +
    `A ${scorerTeam} football player in ${scorerColor} jersey just scored a goal, ` +
    `celebrating with arms wide open, euphoric expression, mouth open screaming. ` +
    `Behind him, the ${opponentTeam} goalkeeper in ${opponentColor} jersey on the ground defeated, ` +
    `and ${opponentTeam} defenders in ${opponentColor} jerseys looking frustrated. ` +
    `Packed stadium crowd in background, dramatic stadium lights, broadcast camera angle. ` +
    `Cinematic, high contrast, professional sports wire photo style. ` +
    `No text, no logos, no numbers on jerseys, no recognizable real faces.`
}

// FOTO 2 — baixo: jogador do time que marcou comemorando (close, fundo desfocado).
function playerPrompt(scorerTeam: string, scorerColor: string): string {
  return `Photorealistic sports photography. ` +
    `A ${scorerTeam} football player in ${scorerColor} jersey celebrating a goal, ` +
    `joyful emotional close-up, fist clenched or pointing to the sky, ` +
    `blurred packed stadium with floodlights behind him, dramatic lighting, ` +
    `professional sports wire photo style, sharp focus on the player. ` +
    `No text, no logos, no numbers on jerseys, no recognizable real faces.`
}

interface DalleResult { url: string | null; err: string | null }

/** Uma geração DALL-E 3 → data URI (base64). Captura o motivo do erro. Nunca lança. */
async function dalleDataUri(prompt: string, size: DalleSize, apiKey: string, label: string): Promise<DalleResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 55_000)
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: QUALITY, style: 'natural', response_format: 'b64_json' }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      let detail = `http_${res.status}`
      try {
        const j = await res.json() as { error?: { code?: string; type?: string; message?: string } }
        detail = `${res.status}:${j?.error?.code || j?.error?.type || ''}:${(j?.error?.message || '').slice(0, 120)}`
      } catch { /* corpo não-JSON */ }
      console.error(`[art-goal] DALL-E ${label} erro ${detail}`)
      return { url: null, err: detail }
    }
    const data = (await res.json()) as { data?: { b64_json?: string }[] }
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) { console.error(`[art-goal] DALL-E ${label} sem b64_json`); return { url: null, err: 'no_b64' } }
    console.log(`[art-goal] DALL-E ${label} OK (${Math.round(b64.length / 1024)}KB)`)
    return { url: `data:image/png;base64,${b64}`, err: null }
  } catch (e) {
    const msg = (e as Error)?.name === 'AbortError' ? 'timeout' : String(e).slice(0, 120)
    console.error(`[art-goal] DALL-E ${label} exceção: ${msg}`)
    return { url: null, err: msg }
  } finally {
    clearTimeout(timer)
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

  // Cores: jogador = time que marcou; fundo = time adversário.
  const scorerTeam = b.scorerTeam ?? b.homeTeam
  const opponentTeam = norm(scorerTeam) === norm(b.awayTeam) ? b.homeTeam : b.awayTeam
  const scorerColor = jerseyColor(scorerTeam)
  const opponentColor = jerseyColor(opponentTeam)

  // 1. Gera as 2 fotos em paralelo (data URI). Degrada p/ placeholders se faltar key/erro.
  const apiKey = process.env.OPENAI_API_KEY
  let actionImg: string | null = null
  let playerImg: string | null = null
  let dalleError: string | undefined
  if (apiKey) {
    const [a, p] = await Promise.all([
      dalleDataUri(actionPrompt(scorerTeam, scorerColor, opponentTeam, opponentColor), '1024x1792', apiKey, 'gol'),
      dalleDataUri(playerPrompt(scorerTeam, scorerColor), '1024x1792', apiKey, 'comemoração'),
    ])
    actionImg = a.url
    playerImg = p.url
    // Propaga o motivo real (key inválida, billing, content-policy, timeout…) se faltou alguma foto
    if (!actionImg || !playerImg) dalleError = a.err || p.err || 'dalle_failed'
  } else {
    dalleError = 'no_openai_key'
    console.log('[art-goal] OPENAI_API_KEY ausente — gerando com placeholders')
  }

  // 2. Monta a arte final com as fotos (data URI) ou placeholders.
  let png: ArrayBuffer
  try {
    png = await renderGoalArtPng({ ...b, topImageUrl: actionImg, bottomImageUrl: playerImg })
  } catch (e) {
    console.error('[art-goal] render falhou:', e)
    return Response.json({ artUrl: null, error: 'render_failed' }, { status: 500 })
  }

  // 3. Upload + URL pública.
  const safe = (s: string) => s.replace(/\s+/g, '')
  const { artUrl, source } = await uploadArtPng(png, `goal-${safe(b.homeTeam)}-${safe(b.awayTeam)}`)
  return Response.json({ artUrl, source, photos: { action: !!actionImg, player: !!playerImg }, error: dalleError })
}
