// src/lib/copy-engine/classifier.ts
// Classifica o evento da partida e decide a "rota" de geração de copy:
// eventos simples → template puro (instantâneo, custo zero);
// eventos complexos → IA (Gemini Flash rascunha; Claude Sonnet refina quando aplicável).

export type EventType =
  | 'goal'           // template puro
  | 'card'           // template puro
  | 'substitution'   // template puro
  | 'halftime'       // Gemini Flash
  | 'fulltime'       // Gemini Flash + Claude Sonnet
  | 'var'            // template puro
  | 'preview'        // Gemini Flash + Claude Sonnet
  | 'classification' // Gemini Flash + Claude Sonnet
  | 'breaking'       // Claude Sonnet direto

// Rota de geração escolhida pelo classifier.
export type CopyRoute = 'template' | 'gemini' | 'gemini+sonnet' | 'sonnet'

// Eventos simples → template
// Eventos complexos → IA
export const TEMPLATE_EVENTS: EventType[] = ['goal', 'card', 'substitution', 'var']
export const AI_EVENTS: EventType[] = ['halftime', 'fulltime', 'preview', 'classification', 'breaking']

const ROUTE: Record<EventType, CopyRoute> = {
  goal: 'template',
  card: 'template',
  substitution: 'template',
  var: 'template',
  halftime: 'gemini',
  fulltime: 'gemini+sonnet',
  preview: 'gemini+sonnet',
  classification: 'gemini+sonnet',
  breaking: 'sonnet',
}

export function classify(event: EventType): CopyRoute {
  return ROUTE[event] ?? 'template'
}

export const isTemplateEvent = (e: EventType): boolean => classify(e) === 'template'
export const isAiEvent = (e: EventType): boolean => classify(e) !== 'template'
