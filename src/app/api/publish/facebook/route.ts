import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GRAPH } from '@/lib/meta-oauth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Publica numa Página do Facebook. Body: { mediaUrl, mediaType, caption }.
// Foto → /{page}/photos ; vídeo → /{page}/videos (file_url).
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { mediaUrl?: string; mediaType?: 'image' | 'video'; caption?: string }
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'bad_json' }, { status: 400 }) }
  const { mediaUrl, mediaType = 'image', caption } = body
  if (!mediaUrl) return NextResponse.json({ success: false, error: 'mediaUrl obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return NextResponse.json({ success: false, error: 'noauth' }, { status: 401 })

  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token,account_id')
    .eq('user_email', email)
    .eq('platform', 'facebook')
    .maybeSingle()
  if (!conn?.access_token || !conn.account_id) {
    return NextResponse.json({ success: false, error: 'Facebook não conectado' }, { status: 400 })
  }
  const pageId = conn.account_id
  const token = conn.access_token

  try {
    const params = new URLSearchParams({ access_token: token })
    let endpoint: string
    if (mediaType === 'video') {
      endpoint = `${GRAPH}/${pageId}/videos`
      params.set('file_url', mediaUrl)
      if (caption) params.set('description', caption)
    } else {
      endpoint = `${GRAPH}/${pageId}/photos`
      params.set('url', mediaUrl)
      if (caption) params.set('caption', caption)
    }
    const res = await fetch(endpoint, { method: 'POST', body: params })
    const json = await res.json()
    if (!res.ok || json.error || !(json.id || json.post_id)) {
      return NextResponse.json({ success: false, error: json?.error?.message ?? 'facebook_error', detail: json?.error }, { status: 502 })
    }
    return NextResponse.json({ success: true, post_id: json.post_id ?? json.id })
  } catch {
    return NextResponse.json({ success: false, error: 'request_failed' }, { status: 502 })
  }
}
