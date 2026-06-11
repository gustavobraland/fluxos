// ─── Arte automática — DALL-E 3 + Supabase Storage ────────────────────────────
// POST { type, homeTeam, awayTeam, scoreHome, scoreAway, scorer?, minute?, league? }
//   → { artUrl: string | null }
//
// Fluxo:
//   1. Gera imagem com DALL-E 3 (HD 1024×1024)
//   2. Faz download do buffer
//   3. Salva no Supabase Storage bucket `media` → arts/
//   4. Retorna a URL pública permanente
//
// Se OPENAI_API_KEY não estiver setado → { artUrl: null } (sem erro p/ a UI)
// Se upload falhar → retorna a URL temporária do DALL-E (válida ~1h para download)

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface ArtEventBody {
  type: 'goal' | 'halftime' | 'fulltime' | 'card' | 'preview' | 'breaking'
  homeTeam: string
  awayTeam: string
  scoreHome: number
  scoreAway: number
  scorer?: string | null
  minute?: number | null
  league?: string | null
  result?: 'win' | 'draw' | 'loss' | null
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildArtPrompt(e: ArtEventBody): string {
  const score = `${e.homeTeam} ${e.scoreHome} x ${e.scoreAway} ${e.awayTeam}`
  const league = e.league ? ` (${e.league})` : ''

  switch (e.type) {
    case 'goal': {
      const scorerLine = e.scorer ? `Gol de ${e.scorer}.` : 'Gol marcado.'
      const minLine = e.minute ? ` Minuto ${e.minute}.` : ''
      return (
        `Dramatic sports social media artwork for a Brazilian football goal.${minLine} ${scorerLine} ` +
        `Score: ${score}${league}. ` +
        `Explosive goal celebration energy, stadium lights, crowd in ecstasy, confetti, motion blur. ` +
        `Bold Brazilian football colors — green and yellow accents. Modern sports graphic design. ` +
        `Cinematic, vivid, no text, no logos, no player faces. Portrait orientation for Instagram Stories.`
      )
    }
    case 'halftime':
      return (
        `Atmospheric halftime social media artwork for Brazilian football. ` +
        `Match: ${score}${league}. ` +
        `Stadium at night, tunnel atmosphere, players walking off, scoreboard glow, anticipation and tension. ` +
        `Brazilian football spirit, warm stadium lighting, crowd energy. ` +
        `Modern sports design, vivid colors. No text, no logos. Instagram-ready composition.`
      )
    case 'fulltime': {
      const mood =
        e.result === 'win'
          ? 'Victory celebration, joy, champion energy, trophy atmosphere'
          : e.result === 'loss'
          ? 'Tense, reflective end-of-match atmosphere, dramatic lighting'
          : 'Balanced draw atmosphere, respect between teams, dramatic stadium lighting'
      return (
        `Final whistle social media artwork for Brazilian football. ` +
        `Final score: ${score}${league}. ` +
        `${mood}. ` +
        `Cinematic stadium scene, Brazilian football passion, dramatic lighting, crowd reaction. ` +
        `Modern sports graphic. No text, no logos, no player faces. High quality, vivid.`
      )
    }
    case 'card':
      return (
        `Dramatic yellow or red card moment in Brazilian football. ` +
        `Match: ${score}${league}. ` +
        `Referee hand raised, card shown, tense stadium atmosphere. ` +
        `Brazilian football, dynamic composition. No text, no logos.`
      )
    case 'preview':
      return (
        `Pre-match hype artwork for Brazilian football. ` +
        `${e.homeTeam} vs ${e.awayTeam}${league}. ` +
        `Two stadium halves facing each other, epic battle atmosphere, stadium lights blazing. ` +
        `Brazilian football energy, bold colors. No text, no logos, no player faces.`
      )
    default:
      return (
        `Dynamic Brazilian football sports graphic. Match: ${score}${league}. ` +
        `Stadium atmosphere, vivid colors, action energy. No text, no logos.`
      )
  }
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.log('[art] OPENAI_API_KEY não configurada')
    return Response.json({ artUrl: null, error: 'no_key' })
  }

  let body: ArtEventBody
  try {
    body = (await req.json()) as ArtEventBody
  } catch {
    return Response.json({ artUrl: null, error: 'bad_request' })
  }

  const artPrompt = buildArtPrompt(body)
  console.log('[art] gerando DALL-E 3 para tipo:', body.type)

  // ── 1. Gerar imagem com DALL-E 3 ────────────────────────────────────────────
  let dalleUrl: string | null = null
  try {
    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: artPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      }),
    })

    if (!dalleRes.ok) {
      const errBody = await dalleRes.text().catch(() => '')
      console.error('[art] DALL-E erro HTTP', dalleRes.status, errBody.slice(0, 300))
      return Response.json({ artUrl: null, error: `dalle_${dalleRes.status}` })
    }

    const dalleData = (await dalleRes.json()) as { data?: { url?: string }[] }
    dalleUrl = dalleData?.data?.[0]?.url ?? null

    if (!dalleUrl) {
      console.error('[art] DALL-E não retornou URL')
      return Response.json({ artUrl: null, error: 'dalle_no_url' })
    }

    console.log('[art] DALL-E gerou imagem com sucesso')
  } catch (e) {
    console.error('[art] DALL-E exceção:', e)
    return Response.json({ artUrl: null, error: 'dalle_exception' })
  }

  // ── 2. Fazer download do buffer da imagem ────────────────────────────────────
  let imageBuffer: ArrayBuffer | null = null
  try {
    const imgRes = await fetch(dalleUrl)
    if (imgRes.ok) {
      imageBuffer = await imgRes.arrayBuffer()
    }
  } catch (e) {
    console.warn('[art] Falha ao baixar imagem do DALL-E, retornando URL temporária:', e)
  }

  // Se download falhou → retorna URL temporária do DALL-E (válida ~1h para o time baixar)
  if (!imageBuffer) {
    return Response.json({ artUrl: dalleUrl, source: 'dalle_temp' })
  }

  // ── 3. Salvar no Supabase Storage ─────────────────────────────────────────────
  try {
    const supabase = await createClient()
    const fileName = `arts/${body.type}-${body.homeTeam.replace(/\s+/g, '')}-${body.awayTeam.replace(/\s+/g, '')}-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.warn('[art] Upload Supabase falhou, usando URL DALL-E:', uploadError.message)
      return Response.json({ artUrl: dalleUrl, source: 'dalle_temp' })
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName)
    console.log('[art] Arte salva no Supabase Storage:', publicUrl)
    return Response.json({ artUrl: publicUrl, source: 'storage' })
  } catch (e) {
    console.warn('[art] Exceção no Supabase Storage, usando URL DALL-E:', e)
    return Response.json({ artUrl: dalleUrl, source: 'dalle_temp' })
  }
}
