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
import { findPlayerPhotoDataUri } from '@/lib/art/acervo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

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

// Configs de geração tentadas em ordem (a conta pode servir gpt-image-1 OU
// dall-e-3, com parâmetros/sizes diferentes). Cada uma já com size landscape
// que encaixa nas faixas da arte. Para no 1º sucesso. Erros 400/403 NÃO cobram
// crédito — só a geração bem-sucedida cobra.
const IMAGE_CONFIGS: Record<string, unknown>[] = [
  { model: 'gpt-image-1', size: '1536x1024', quality: 'high' },
  { model: 'gpt-image-1', size: '1536x1024' },
  { model: 'gpt-image-1', size: '1024x1024' },
  { model: 'dall-e-3', size: '1792x1024', response_format: 'b64_json' },
  { model: 'dall-e-3', size: '1792x1024' },
]

/**
 * Geração de imagem → data URI (base64). Tenta IMAGE_CONFIGS até uma funcionar.
 * Aceita resposta em b64_json OU url (baixa e converte). Nunca lança.
 */
async function dalleDataUri(prompt: string, apiKey: string, label: string): Promise<DalleResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 58_000)
  let lastErr = 'no_attempt'
  try {
    for (const cfg of IMAGE_CONFIGS) {
      const body = { ...cfg, prompt, n: 1 }
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })

      if (res.ok) {
        const data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] }
        const item = data?.data?.[0]
        if (item?.b64_json) {
          console.log(`[art-goal] ${label} OK via ${cfg.model} (${Math.round(item.b64_json.length / 1024)}KB)`)
          return { url: `data:image/png;base64,${item.b64_json}`, err: null }
        }
        if (item?.url) {
          const buf = await fetch(item.url, { signal: ctrl.signal }).then(r => r.arrayBuffer())
          console.log(`[art-goal] ${label} OK via ${cfg.model}/url (${Math.round(buf.byteLength / 1024)}KB)`)
          return { url: `data:image/png;base64,${Buffer.from(buf).toString('base64')}`, err: null }
        }
        lastErr = `${cfg.model}:no_image`
        continue
      }

      let j: { error?: { code?: string; type?: string; message?: string } } = {}
      try { j = await res.json() } catch { /* corpo não-JSON */ }
      lastErr = `${cfg.model} ${res.status}:${j?.error?.code || j?.error?.type || ''}:${(j?.error?.message || '').slice(0, 90)}`
      console.warn(`[art-goal] ${label} tentativa ${cfg.model} falhou → ${lastErr}`)
    }
    console.error(`[art-goal] ${label} todas as configs falharam → ${lastErr}`)
    return { url: null, err: lastErr }
  } catch (e) {
    const msg = (e as Error)?.name === 'AbortError' ? 'timeout' : String(e).slice(0, 120)
    console.error(`[art-goal] ${label} exceção: ${msg}`)
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

  // 1a. Foto do jogador (baixo): primeiro tenta o ACERVO (casa pelo nome do
  //     arquivo, normalizado sem acento). Se achar, usa a foto real e economiza
  //     uma geração DALL-E.
  const acervoPlayer = await findPlayerPhotoDataUri(b.scorerName)
  let playerSource: 'acervo' | 'dalle' | 'none' = 'none'
  if (acervoPlayer) {
    playerSource = 'acervo'
    console.log(`[art-goal] foto do jogador "${b.scorerName}" veio do acervo`)
  }

  // 1b. Foto de ação (topo) sempre via DALL-E; jogador via DALL-E só se faltou no acervo.
  const apiKey = process.env.OPENAI_API_KEY
  let actionImg: string | null = null
  let playerImg: string | null = acervoPlayer
  let dalleError: string | undefined
  if (apiKey) {
    const tasks = [dalleDataUri(actionPrompt(scorerTeam, scorerColor, opponentTeam, opponentColor), apiKey, 'gol')]
    if (!acervoPlayer) tasks.push(dalleDataUri(playerPrompt(scorerTeam, scorerColor), apiKey, 'comemoração'))
    const [a, p] = await Promise.all(tasks)
    actionImg = a.url
    if (!acervoPlayer) {
      playerImg = p?.url ?? null
      if (playerImg) playerSource = 'dalle'
    }
    if (!actionImg || !playerImg) dalleError = a.err || p?.err || 'dalle_failed'
  } else if (!acervoPlayer) {
    // Sem OpenAI E sem acervo → placeholders nas duas.
    dalleError = 'no_openai_key'
    console.log('[art-goal] OPENAI_API_KEY ausente — gerando com placeholders')
  } else {
    // Tem acervo p/ o jogador, mas sem OpenAI p/ a foto de ação.
    dalleError = 'no_openai_key'
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
  return Response.json({
    artUrl,
    source,
    photos: { action: !!actionImg, player: !!playerImg, playerSource },
    error: dalleError,
  })
}
