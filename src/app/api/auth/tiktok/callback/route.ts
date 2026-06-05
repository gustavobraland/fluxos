import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appOrigin, callbackUri, oauthPopupResponse as finish } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

interface TikTokUser { open_id?: string; display_name?: string; avatar_url?: string }

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const origin = appOrigin(request)
  const code = sp.get('code')
  const state = sp.get('state')
  if (sp.get('error') || !code) return finish('error', origin)

  const cookieState = request.cookies.get('tiktok_oauth_state')?.value
  if (!cookieState || cookieState !== state) return finish('state_mismatch', origin)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return finish('noauth', origin)

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) return finish('config', origin)

  try {
    // code → token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUri(request, 'tiktok'),
      }),
    })
    const tok = await tokenRes.json()
    if (!tok.access_token) return finish('token', origin)

    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null

    // Perfil (nome + avatar) — best effort.
    let profile: TikTokUser = { open_id: tok.open_id }
    try {
      const uRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url',
        { headers: { Authorization: `Bearer ${tok.access_token}` } },
      )
      const uJson = await uRes.json()
      profile = uJson?.data?.user ?? profile
    } catch { /* segue sem perfil */ }

    const { error } = await supabase.from('social_connections').upsert(
      {
        user_email: email,
        platform: 'tiktok',
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        account_id: profile.open_id ?? tok.open_id ?? null,
        account_name: profile.display_name ?? 'TikTok',
        avatar_url: profile.avatar_url ?? null,
        expires_at: expiresAt,
      },
      { onConflict: 'user_email,platform' },
    )
    if (error) return finish('save_error', origin)

    return finish('connected', origin)
  } catch {
    return finish('error', origin)
  }
}
