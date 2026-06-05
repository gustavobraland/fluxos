import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Garante um access_token válido (renova via refresh_token se expirado).
async function freshToken(
  supabase: SupabaseClient,
  email: string,
  conn: { access_token: string; refresh_token: string | null; expires_at: string | null },
): Promise<string | null> {
  const notExpired = conn.expires_at && new Date(conn.expires_at).getTime() - Date.now() > 60_000
  if (notExpired) return conn.access_token
  if (!conn.refresh_token) return conn.access_token // sem refresh — tenta o atual

  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) return conn.access_token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const tok = await res.json()
  if (!tok.access_token) return conn.access_token
  const expiresAt = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null
  await supabase
    .from('social_connections')
    .update({ access_token: tok.access_token, expires_at: expiresAt })
    .eq('user_email', email)
    .eq('platform', 'youtube')
  return tok.access_token
}

// Publica um vídeo (Short) no YouTube. Body: { videoUrl, title, description }.
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { videoUrl?: string; title?: string; description?: string }
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'bad_json' }, { status: 400 }) }
  const { videoUrl, title, description } = body
  if (!videoUrl) return NextResponse.json({ success: false, error: 'videoUrl obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return NextResponse.json({ success: false, error: 'noauth' }, { status: 401 })

  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token,refresh_token,expires_at')
    .eq('user_email', email)
    .eq('platform', 'youtube')
    .maybeSingle()
  if (!conn?.access_token) return NextResponse.json({ success: false, error: 'YouTube não conectado' }, { status: 400 })

  try {
    const token = await freshToken(supabase, email, conn)

    // Baixa o vídeo e envia em multipart/related (metadados + binário).
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) return NextResponse.json({ success: false, error: 'download_failed' }, { status: 502 })
    const videoBuf = new Uint8Array(await videoRes.arrayBuffer())

    const metadata = JSON.stringify({
      snippet: { title: (title ?? 'Flux OS').slice(0, 100), description: description ?? '' },
      status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
    })
    const boundary = 'flux' + crypto.randomUUID().replace(/-/g, '')
    const pre = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: video/*\r\n\r\n`
    const post = `\r\n--${boundary}--`
    const reqBody = new Blob([pre, videoBuf, post])

    const upRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': `multipart/related; boundary=${boundary}` },
        body: reqBody,
      },
    )
    const json = await upRes.json()
    if (!upRes.ok || json.error) {
      return NextResponse.json({ success: false, error: json?.error?.message ?? 'youtube_error', detail: json?.error }, { status: 502 })
    }
    return NextResponse.json({ success: true, video_id: json.id ?? null })
  } catch {
    return NextResponse.json({ success: false, error: 'request_failed' }, { status: 502 })
  }
}
