import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appOrigin, callbackUri, oauthPopupResponse as finish, saveSocialConnection } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

function googleClient(): { id?: string; secret?: string } {
  return {
    id: process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const origin = appOrigin(request)
  const code = sp.get('code')
  const state = sp.get('state')
  if (sp.get('error') || !code) return finish('error', origin, sp.get('error') || 'no_code')

  const cookieState = request.cookies.get('gcal_oauth_state')?.value
  if (!cookieState || cookieState !== state) return finish('state_mismatch', origin)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return finish('noauth', origin)

  const { id: clientId, secret: clientSecret } = googleClient()
  if (!clientId || !clientSecret) return finish('config', origin)

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUri(request, 'gcal'),
        grant_type: 'authorization_code',
      }),
    })
    const tok = await tokenRes.json()
    if (!tok.access_token) {
      console.error('[oauth/gcal] token exchange falhou:', tok)
      return finish('token', origin, tok.error_description || tok.error || JSON.stringify(tok).slice(0, 300))
    }

    const expiresAt = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null

    // Calendário principal (id/nome) — best effort.
    let name = 'Google Calendar'
    let calId: string | null = 'primary'
    try {
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      })
      const cal = await calRes.json()
      if (cal?.id) { calId = cal.id; name = cal.summary || cal.id || name }
    } catch { /* segue com primary */ }

    const { error } = await saveSocialConnection(supabase, {
      user_email: email,
      platform: 'gcal',
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? null,
      account_id: calId,
      account_name: name,
      expires_at: expiresAt,
    }, null)
    if (error) {
      console.error('[oauth/gcal] save_error:', error)
      return finish('save_error', origin, error)
    }

    return finish('connected', origin)
  } catch (e) {
    console.error('[oauth/gcal] exception:', e)
    return finish('error', origin, e instanceof Error ? e.message : String(e))
  }
}
