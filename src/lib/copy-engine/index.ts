// src/lib/copy-engine/index.ts
// Entrada do copy-engine (client). Eventos de template resolvem localmente
// (instantâneo, sem rede); eventos de IA chamam a rota server /api/copy
// (Gemini Flash → Claude Sonnet). Sempre cai no template se a IA falhar.

import { classify, type EventType } from './classifier'
import { buildTemplate } from './templates'
import type { CopyEvent, CopyResult } from './types'

export * from './classifier'
export * from './types'
export { buildTemplate, scoreLine } from './templates'

export async function generateCopy(event: CopyEvent, opts?: { brandVoice?: string }): Promise<CopyResult> {
  if (classify(event.type) === 'template') {
    return { text: buildTemplate(event), by: 'template' }
  }
  try {
    const res = await fetch('/api/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: event.type, facts: event.facts, brandVoice: opts?.brandVoice }),
    })
    if (res.ok) {
      const data = (await res.json()) as Partial<CopyResult>
      if (data?.text) return { text: data.text, by: data.by ?? 'gemini' }
    }
  } catch { /* cai no template */ }
  return { text: buildTemplate(event), by: 'fallback' }
}

export type { EventType }
