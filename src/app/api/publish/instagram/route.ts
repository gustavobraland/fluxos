import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GRAPH } from '@/lib/meta-oauth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Publica no Instagram via Graph API: cria o container (/media) e publica
// (/media_publish). Vídeo = REELS (espera o processamento). Imagem = post.
// Body: { mediaUrl, mediaType: 'image'|'video', caption }.
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { mediaUrl?: string; mediaType?: 'image' | 'video'; caption?: string }
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'bad_json' }, { status: 400 }) }
  const { mediaUrl, mediaType = 'video', caption } = body
  if (!mediaUrl) return NextResponse.json({ success: false, error: 'mediaUrl obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return NextResponse.json({ success: false, error: 'noauth' }, { status: 401 })

  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token,account_id')
    .eq('user_email', email)
    .eq('platform', 'instagram')
    .maybeSingle()
  if (!conn?.access_token || !conn.account_id) {
    return NextResponse.json({ success: false, error: 'Instagram não conectado' }, { status: 400 })
  }
  const igId = conn.account_id
  const token = conn.access_token

  try {
    // 1. cria o container de mídia
    const params = new URLSearchParams({ caption: caption ?? '', access_token: token })
    if (mediaType === 'video') {
      params.set('media_type', 'REELS')
      params.set('video_url', mediaUrl)
    } else {
      params.set('image_url', mediaUrl)
    }
    const createRes = await fetch(`${GRAPH}/${igId}/media`, { method: 'POST', body: params })
    const create = await createRes.json()
    if (!create.id) {
      return NextResponse.json({ success: false, error: create?.error?.message ?? 'container_failed', detail: create?.error }, { status: 502 })
    }
    const creationId: string = create.id

    // 2. vídeo precisa terminar o processamento antes de publicar
    if (mediaType === 'video') {
      let ready = false
      for (let i = 0; i < 18; i++) {
        await sleep(3000)
        const st = await (await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${token}`)).json()
        if (st.status_code === 'FINISHED') { ready = true; break }
        if (st.status_code === 'ERROR') return NextResponse.json({ success: false, error: 'processing_error' }, { status: 502 })
      }
      if (!ready) return NextResponse.json({ success: false, error: 'processing_timeout' }, { status: 504 })
    }

    // 3. publica
    const pubRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: 'POST',
      body: new URLSearchParams({ creation_id: creationId, access_token: token }),
    })
    const pub = await pubRes.json()
    if (!pub.id) {
      return NextResponse.json({ success: false, error: pub?.error?.message ?? 'publish_failed', detail: pub?.error }, { status: 502 })
    }
    return NextResponse.json({ success: true, media_id: pub.id })
  } catch {
    return NextResponse.json({ success: false, error: 'request_failed' }, { status: 502 })
  }
}
