import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appOrigin, callbackUri, oauthPopupResponse as finish, saveSocialConnection } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const origin = appOrigin(request)
  const code = sp.get('code')
  const state = sp.get('state')
  if (sp.get('error') || !code) return finish('error', origin)

  const cookieState = request.cookies.get('youtube_oauth_state')?.value
  if (!cookieState || cookieState !== state) return finish('state_mismatch', origin)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return finish('noauth', origin)

  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) return finish('config', origin)

  try {
    // code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUri(request, 'youtube'),
        grant_type: 'authorization_code',
      }),
    })
    const tok = await tokenRes.json()
    if (!tok.access_token) {
      console.error('[oauth/youtube] token exchange falhou:', tok)
      return finish('token', origin, tok.error_description || tok.error || JSON.stringify(tok).slice(0, 300))
    }

    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null

    // Canal (nome + avatar) — best effort.
    let name = 'YouTube'
    let avatar: string | null = null
    let channelId: string | null = null
    try {
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tok.access_token}` } },
      )
      const ch = await chRes.json()
      const item = ch?.items?.[0]
      if (item) {
        channelId = item.id ?? null
        name = item.snippet?.title ?? name
        avatar = item.snippet?.thumbnails?.default?.url ?? null
      }
    } catch { /* segue sem canal */ }

    const { error } = await saveSocialConnection(supabase, {
      user_email: email,
      platform: 'youtube',
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? null,
      account_id: channelId,
      account_name: name,
      expires_at: expiresAt,
    }, avatar)
    if (error) {
      console.error('[oauth/youtube] save_error:', error)
      return finish('save_error', origin, error)
    }

    return finish('connected', origin)
  } catch (e) {
    console.error('[oauth/youtube] exception:', e)
    return finish('error', origin, e instanceof Error ? e.message : String(e))
  }
}
