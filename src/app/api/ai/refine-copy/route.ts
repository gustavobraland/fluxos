// ─── AI Copy Refinement Route ─────────────────────────────────────────────────
// POST { draft, platforms, mediaType?, brandVoice? }
//   → { copies: Record<PlatformId, string>, refinedBy: 'ai' | 'fallback' }
//
// Tiers, each falling through to the next — never 500s the UI:
//   1. Google Gemini (preferido, se GEMINI_API_KEY estiver setado).
//   2. Anthropic (se ANTHROPIC_API_KEY estiver setado) — alta qualidade.
//   3. Pollinations — grátis e sem key, para o ambiente de teste (best effort).
//   4. Adaptação local determinística — sempre funciona, sem rede.

import { PLATFORM_LIMITS, PLATFORM_META, type PlatformId, type PlatformLimit } from '@/lib/platform-limits'

export const dynamic = 'force-dynamic'

interface RefineBody {
  draft: string
  platforms: PlatformId[]
  mediaType?: 'image' | 'video' | null
  brandVoice?: string
}

const SHORT_LIMIT_PLATFORMS: PlatformId[] = ['youtube_shorts', 'twitter']

// ─── Deterministic local fallback ─────────────────────────────────────────────

function fallbackCopy(draft: string, platform: PlatformId): string {
  const limit = PLATFORM_LIMITS[platform]
  let text = draft.trim()
  // Short-limit platforms read best on a single line.
  if (SHORT_LIMIT_PLATFORMS.includes(platform)) {
    text = text.replace(/\s*\n+\s*/g, ' ').trim()
  }
  // Soft-target the recommended length, hard-cap at the caption limit.
  const soft = limit.recommended
  const hard = limit.caption
  if (text.length > soft) {
    const cut = Math.min(soft, hard)
    text = text.slice(0, cut).trimEnd()
    // Avoid cutting mid-word when possible.
    const lastSpace = text.lastIndexOf(' ')
    if (lastSpace > cut * 0.6) text = text.slice(0, lastSpace).trimEnd()
    text = text.replace(/[.,;:!\-]+$/, '') + '…'
  }
  if (text.length > hard) text = text.slice(0, hard)
  return text
}

function buildFallback(draft: string, platforms: PlatformId[]): Record<string, string> {
  const copies: Record<string, string> = {}
  for (const p of platforms) copies[p] = fallbackCopy(draft, p)
  return copies
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(body: RefineBody): string {
  const { draft, platforms, mediaType, brandVoice } = body
  const limitsBlock = platforms
    .map((p) => {
      const l: PlatformLimit = PLATFORM_LIMITS[p]
      const meta = PLATFORM_META[p]
      const extras: string[] = []
      if (l.hashtags) extras.push(`até ${l.hashtags} hashtags`)
      return `- ${p} (${meta.label}): máximo ${l.caption} caracteres, ideal ~${l.recommended}. ${l.note}.${extras.length ? ' ' + extras.join(', ') + '.' : ''}`
    })
    .join('\n')

  const mediaLine = mediaType
    ? `A publicação acompanha uma mídia do tipo: ${mediaType === 'video' ? 'vídeo' : 'imagem'}.`
    : 'A publicação não tem mídia anexada.'

  return `Você é um especialista em copywriting para redes sociais. Adapte a copy base abaixo para cada plataforma solicitada, respeitando o tom da marca e os limites de cada rede.

COPY BASE:
"""
${draft}
"""

${mediaLine}

${brandVoice ? `DIRETRIZES DA MARCA:\n${brandVoice}\n` : ''}
LIMITES POR PLATAFORMA:
${limitsBlock}

REGRAS:
- NÃO inventar informações que não estejam na copy base (datas, números, nomes, resultados).
- Respeitar o tom de voz e o idioma da marca.
- Adaptar o tamanho ao ideal de cada plataforma, sem ultrapassar o limite máximo.
- Use hashtags apenas quando fizer sentido para a plataforma.

Retorne APENAS um JSON válido (sem markdown, sem comentários) no formato:
{${platforms.map((p) => `"${p}": "..."`).join(', ')}}`
}

// ─── JSON extraction (handles markdown fences) ────────────────────────────────

function parseModelJson(text: string): Record<string, unknown> {
  let cleaned = text.trim()
  // Strip ```json ... ``` or ``` ... ``` fences.
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) cleaned = fence[1].trim()
  // If extra prose surrounds the object, grab the outermost braces.
  if (!cleaned.startsWith('{')) {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1)
  }
  return JSON.parse(cleaned) as Record<string, unknown>
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  let body: RefineBody
  try {
    body = (await req.json()) as RefineBody
  } catch {
    return Response.json({ copies: {}, refinedBy: 'fallback' as const })
  }

  const draft = (body.draft || '').trim()
  const platforms = (Array.isArray(body.platforms) ? body.platforms : []).filter(
    (p): p is PlatformId => p in PLATFORM_LIMITS
  )

  if (!draft || platforms.length === 0) {
    return Response.json({ copies: buildFallback(draft, platforms), refinedBy: 'fallback' as const })
  }

  const prompt = buildPrompt({ ...body, draft, platforms })

  // Shape a model's raw text into the per-platform copies map (with hard caps).
  const shape = (text: string): Record<string, string> => {
    const parsed = parseModelJson(text)
    const copies: Record<string, string> = {}
    for (const p of platforms) {
      const value = parsed[p]
      if (typeof value === 'string' && value.trim()) {
        const cap = PLATFORM_LIMITS[p].caption
        copies[p] = value.length > cap ? value.slice(0, cap) : value
      } else {
        copies[p] = fallbackCopy(draft, p)
      }
    }
    return copies
  }

  // ── Tier 1: Google Gemini (preferido quando GEMINI_API_KEY está setado) ──
  const geminiKey = process.env.GEMINI_API_KEY
  console.log('[refine-copy] GEMINI_KEY presente:', !!geminiKey, geminiKey ? geminiKey.slice(0, 8) + '…' : 'N/A')
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 },
          }),
        },
      )
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return Response.json({ copies: shape(text), refinedBy: 'ai' as const })
        console.warn('[refine-copy] Gemini respondeu ok mas sem texto')
      } else {
        const errBody = await res.text().catch(() => '')
        console.error('[refine-copy] Gemini erro HTTP', res.status, errBody.slice(0, 300))
      }
    } catch (e) { console.error('[refine-copy] Gemini exceção:', e) }
  }

  // ── Tier 2: Anthropic (only if a key is configured) ──
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    try {
      const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-5'
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      })
      if (res.ok) {
        const data = (await res.json()) as { content?: { text?: string }[] }
        const text = data?.content?.[0]?.text
        if (text) return Response.json({ copies: shape(text), refinedBy: 'ai' as const })
      }
    } catch { /* fall through to the free tier */ }
  }

  // ── Tier 2: Pollinations — free, keyless (test env). Best effort. ──
  // Disable by setting AI_FREE_TIER=off. Times out fast so the UI stays snappy.
  if (process.env.AI_FREE_TIER !== 'off') {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6_000)
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.AI_FREE_MODEL || 'openai',
          messages: [
            { role: 'system', content: 'Você responde SOMENTE com JSON válido, sem markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timer))

      if (res.ok) {
        const ct = res.headers.get('content-type') || ''
        let text = ''
        if (ct.includes('application/json')) {
          const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; content?: string }
          text = data?.choices?.[0]?.message?.content ?? data?.content ?? ''
        } else {
          text = await res.text()
        }
        if (text && text.trim().includes('{')) {
          return Response.json({ copies: shape(text), refinedBy: 'ai' as const })
        }
      }
    } catch { /* fall through to local */ }
  }

  // ── Tier 3: deterministic local adaptation (always works) ──
  return Response.json({ copies: buildFallback(draft, platforms), refinedBy: 'fallback' as const })
}
