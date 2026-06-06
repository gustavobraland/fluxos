// src/lib/copy-engine/types.ts
import type { EventType } from './classifier'

// Fatos REAIS do evento — nunca inventar nada além disto na geração.
export interface CopyFacts {
  homeTeam: string
  awayTeam: string
  scoreHome: number
  scoreAway: number
  minute?: number | null
  league?: string | null
  /** Time sujeito do evento (quem marcou / levou cartão / fez a sub). */
  teamName?: string | null
  scorer?: string | null            // goal
  player?: string | null            // card
  cardType?: 'yellow' | 'red' | null
  playerOut?: string | null         // substitution
  playerIn?: string | null          // substitution
  result?: 'win' | 'draw' | 'loss' | null  // fulltime (perspectiva do time da casa de conteúdo)
  /** Texto livre p/ breaking / preview / classification (contexto extra factual). */
  note?: string | null
}

export interface CopyEvent {
  type: EventType
  facts: CopyFacts
}

export interface CopyResult {
  text: string
  by: 'template' | 'gemini' | 'gemini+sonnet' | 'sonnet' | 'fallback'
}
