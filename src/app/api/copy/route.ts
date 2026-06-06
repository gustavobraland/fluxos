// src/app/api/copy/route.ts
// Geração de copy por IA do War Room. Roteia pelo classifier:
//   gemini          → Gemini Flash
//   gemini+sonnet   → Gemini Flash rascunha → Claude Sonnet refina
//   sonnet          → Claude Sonnet direto
// Sempre cai no template determinístico se faltar key / der erro (nunca 500 a UI).

import { classify, type EventType } from '@/lib/copy-engine/classifier'
import { buildTemplate, buildAiPrompt, buildRefinePrompt } from '@/lib/copy-engine/templates'
import type { CopyFacts } from '@/lib/copy-engine/types'

export const dynamic = 'force-dynamic'

interface Body { type: EventType; facts: CopyFacts; brandVoice?: string }

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const SONNET_MODEL = process.env.COPY_SONNET_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'

function clean(s: string): string {
  return s.trim().replace(/^```[a-z]*\n?|\n?```$/g, '').replace(/^["']|["']$/g, '').trim()
}

async function gemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8 } }),
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text ? clean(text) : null
  } catch { return null }
}

async function sonnet(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: SONNET_MODEL, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { content?: { text?: string }[] }
    const text = data?.content?.[0]?.text
    return text ? clean(text) : null
  } catch { return null }
}

export async function POST(req: Request): Promise<Response> {
  let body: Body
  try { body = (await req.json()) as Body } catch { return Response.json({ text: '', by: 'fallback' }) }

  const { type, facts, brandVoice } = body
  const template = buildTemplate({ type, facts })
  const route = classify(type)
  const prompt = buildAiPrompt(type, facts, brandVoice)

  // gemini puro
  if (route === 'gemini') {
    const g = await gemini(prompt)
    return Response.json(g ? { text: g, by: 'gemini' } : { text: template, by: 'fallback' })
  }

  // sonnet direto
  if (route === 'sonnet') {
    const s = await sonnet(prompt)
    if (s) return Response.json({ text: s, by: 'sonnet' })
    const g = await gemini(prompt) // degrade pro gemini
    return Response.json(g ? { text: g, by: 'gemini' } : { text: template, by: 'fallback' })
  }

  // gemini+sonnet — Gemini rascunha, Sonnet refina
  if (route === 'gemini+sonnet') {
    const draft = await gemini(prompt)
    const refined = await sonnet(buildRefinePrompt(draft || template, type, facts, brandVoice))
    if (refined) return Response.json({ text: refined, by: 'gemini+sonnet' })
    if (draft) return Response.json({ text: draft, by: 'gemini' })
    return Response.json({ text: template, by: 'fallback' })
  }

  // template (não deveria chegar aqui — o client resolve local)
  return Response.json({ text: template, by: 'template' })
}
