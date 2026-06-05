import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Publica um vídeo no TikTok via Content Posting API (PULL_FROM_URL).
// Body: { videoUrl, caption }. O usuário vem da sessão (não confia no body).
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { videoUrl?: string; caption?: string }
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'bad_json' }, { status: 400 }) }
  const { videoUrl, caption } = body
  if (!videoUrl) return NextResponse.json({ success: false, error: 'videoUrl obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return NextResponse.json({ success: false, error: 'noauth' }, { status: 401 })

  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token')
    .eq('user_email', email)
    .eq('platform', 'tiktok')
    .maybeSingle()
  if (!conn?.access_token) return NextResponse.json({ success: false, error: 'TikTok não conectado' }, { status: 400 })

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        'content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: (caption ?? '').slice(0, 2200),
          // Apps sem App Review só publicam como privado (SELF_ONLY).
          privacy_level: 'SELF_ONLY',
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl, // o domínio do vídeo precisa estar verificado no TikTok
        },
      }),
    })
    const json = await res.json()
    if (json?.error && json.error.code !== 'ok') {
      return NextResponse.json({ success: false, error: json.error.message ?? 'tiktok_error', detail: json.error }, { status: 502 })
    }
    return NextResponse.json({ success: true, publish_id: json?.data?.publish_id ?? null })
  } catch {
    return NextResponse.json({ success: false, error: 'request_failed' }, { status: 502 })
  }
}
