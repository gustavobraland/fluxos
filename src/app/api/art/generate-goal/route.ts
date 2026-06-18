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

// Prompts no estilo wire-photo (Getty/AP) — máxima foto-realidade, adversário ao
// fundo nos dois, enquadramento landscape p/ o cover-crop. {scorerColor} = time que
// marcou · {opponentColor} = time adversário. (Refinados via workflow de direção de arte.)
const ACTION_TEMPLATE =
  "A real World Cup 2026 night-match broadcast and press photograph, captured on a professional long broadcast " +
  "telephoto lens from the pitch-side photographers' pit in the decisive-moment wire-photo style of Getty and AP, " +
  "no studio look at all and never a media-day setup, landscape horizontal orientation. The goal moment: a single " +
  "male forward in a {scorerColor} national-team kit at the instant he strikes the ball to score, body torqued through " +
  "a powerful follow-through, his planted boot kicking up a small spray of real grass and chalk, a sharp natural motion " +
  "blur on his swinging leg and on the ball as it rockets off his foot toward goal, full-stride athletic intensity, " +
  "sweat and turf flecks airborne. He is centered in the wide frame with comfortable headroom above him so a cover-crop " +
  "will not clip his head. In the softly out-of-focus background a beaten goalkeeper and two defenders in {opponentColor} " +
  "kits lunge and dive a fraction too late, stranded and reaching helplessly, their dejection legible through creamy bokeh; " +
  "beyond them a densely packed nighttime crowd melts into warm floodlit bokeh. Shot wide open for razor-sharp focus on the " +
  "striker with very shallow depth of field, stadium floodlights at night raking across realistic trampled grass with " +
  "visible mowing stripes and torn divots, authentic jersey fabric folds and wrinkles, sweat-sheened skin with real pores, " +
  "fine sensor grain, natural true-to-life broadcast color, and the candid, unposed, slightly imperfect feel of a genuine " +
  "captured instant. No text, no logos, no scoreboard, no watermark, no readable sponsor boards. Premium editorial sports " +
  "photojournalism in the vein of ESPN FC, OneFootball, 433, TNT Sports and FIFA — not a studio shot, not a media-day " +
  "portrait, not a 3D render, not an illustration."

const CELEBRATION_TEMPLATE =
  "A real World Cup 2026 night-match broadcast and press photograph, captured on a professional long broadcast telephoto " +
  "lens from the pitch-side photographers' pit in the decisive-moment wire-photo style of Getty and AP, no studio look at " +
  "all and never a media-day setup, landscape horizontal orientation. The scoring player, a single male footballer in a " +
  "{scorerColor} national-team kit, wheels away celebrating the goal he just scored, arms flung wide and head tilted back " +
  "roaring in raw emotion, veins and sweat on his face catching the floodlights, eyes alive, frozen mid-stride. He is " +
  "centered in the wide frame with generous headroom above so a cover-crop will not clip his head or hands. Close behind " +
  "him his teammates in matching {scorerColor} kits surge in to mob him in soft focus with natural motion in their rush; " +
  "in the deeper out-of-focus background dejected opponents in {opponentColor} kits stand slumped with hands on hips and " +
  "heads down, and a beaten goalkeeper in {opponentColor} slumps near the net, while a vast packed nighttime crowd dissolves " +
  "into glowing floodlit bokeh. Shot wide open for razor-sharp focus on the celebrating player and lush creamy bokeh " +
  "everywhere else, very shallow depth of field, stadium floodlights at night, realistic trampled grass underfoot, authentic " +
  "jersey fabric texture and lifelike sweat-sheened skin, fine sensor grain, natural true-to-life broadcast color, and the " +
  "candid, unposed, slightly imperfect feel of a genuine captured instant. No text, no logos, no scoreboard, no watermark, " +
  "no readable sponsor boards. Premium editorial sports photojournalism in the vein of ESPN FC, OneFootball, 433, TNT Sports " +
  "and FIFA — not a studio shot, not a media-day portrait, not a 3D render, not an illustration."

const fill = (tpl: string, scorerColor: string, opponentColor: string) =>
  tpl.replaceAll('{scorerColor}', scorerColor).replaceAll('{opponentColor}', opponentColor)

const actionPrompt = (scorerColor: string, opponentColor: string) => fill(ACTION_TEMPLATE, scorerColor, opponentColor)
const celebrationPrompt = (scorerColor: string, opponentColor: string) => fill(CELEBRATION_TEMPLATE, scorerColor, opponentColor)

/** Uma geração DALL-E 3 → data URI (base64) ou null. Nunca lança. */
async function dalleDataUri(prompt: string, size: DalleSize, apiKey: string, label: string): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 50_000)
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: QUALITY, style: 'vivid', response_format: 'b64_json' }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error(`[art-goal] DALL-E ${label} HTTP ${res.status}:`, err.slice(0, 240))
      return null
    }
    const data = (await res.json()) as { data?: { b64_json?: string }[] }
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) { console.error(`[art-goal] DALL-E ${label} sem b64_json`); return null }
    console.log(`[art-goal] DALL-E ${label} OK (${Math.round(b64.length / 1024)}KB)`)
    return `data:image/png;base64,${b64}`
  } catch (e) {
    console.error(`[art-goal] DALL-E ${label} exceção:`, e)
    return null
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
    ;[actionImg, playerImg] = await Promise.all([
      dalleDataUri(actionPrompt(scorerColor, opponentColor), '1792x1024', apiKey, 'gol'),
      dalleDataUri(celebrationPrompt(scorerColor, opponentColor), '1792x1024', apiKey, 'comemoração'),
    ])
    if (!actionImg && !playerImg) dalleError = 'dalle_failed'
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
