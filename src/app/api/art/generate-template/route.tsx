// ─── Arte por TEMPLATE (next/og) — render manual / teste ──────────────────────
// POST { homeTeam, awayTeam, homeScore, awayScore, scorerName?, minute?,
//        competition?, scorerTeam?, footerText?, topImageUrl?, bottomImageUrl?,
//        homeFlag?, awayFlag? }
//   → { artUrl: string | null, source: 'storage' | 'dataurl' }
//
// Render puro: usa as URLs de imagem que vierem no corpo (ou placeholders).
// A geração AUTOMÁTICA das fotos (DALL-E) está em /api/art/generate-goal.

import { renderGoalArtPng, uploadArtPng, type GoalTemplateBody } from '@/lib/art/goal-template'

export const dynamic = 'force-dynamic'

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

  let png: ArrayBuffer
  try {
    png = await renderGoalArtPng(b)
  } catch (e) {
    console.error('[art-template] render falhou:', e)
    return Response.json({ artUrl: null, error: 'render_failed' }, { status: 500 })
  }

  const safe = (s: string) => s.replace(/\s+/g, '')
  const { artUrl, source } = await uploadArtPng(png, `template-goal-${safe(b.homeTeam)}-${safe(b.awayTeam)}`)
  return Response.json({ artUrl, source })
}
