// ─── AI Goal Enrichment Route ─────────────────────────────────────────────────
// POST { goal: GoalEvent } → { headline: string }
// MVP: template pool. Replace with real LLM call when needed.

import type { GoalEvent } from '@/lib/timeline'
import { NextRequest, NextResponse } from 'next/server'

type Fn = (scorer: string, score: string) => string

const TEMPLATES: Fn[] = [
  (s, sc) => `GOL de ${s}! Placar: ${sc}`,
  (s, sc) => `${s} marca! Novo placar: ${sc}`,
  (s, sc) => `Golaço de ${s} — ${sc}`,
  (s, sc) => `${s} decide! Agora é ${sc}`,
  (s, sc) => `É GOL! ${s} amplia — ${sc}`,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { goal: GoalEvent }
  const { goal } = body
  if (!goal?.scorer) return NextResponse.json({ headline: 'GOL!' })
  const headline = pick(TEMPLATES)(goal.scorer, goal.scoreStr)
  return NextResponse.json({ headline })
}
