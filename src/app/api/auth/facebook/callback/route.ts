import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GRAPH } from '@/lib/meta-oauth'
import { appOrigin, callbackUri, oauthPopupResponse as finish, saveSocialConnection } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

interface FBPage {
  id: string
  name: string
  access_token: string
  picture?: { data?: { url?: string } }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const origin = appOrigin(request)
  const code = sp.get('code')
  const state = sp.get('state')
  if (sp.get('error') || !code) return finish('error', origin)

  const cookieState = request.cookies.get('facebook_oauth_state')?.value
  if (!cookieState || cookieState !== state) return finish('state_mismatch', origin)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return finish('noauth', origin)

  const appId = process.env.META_APP_ID
  const secret = process.env.META_APP_SECRET
  if (!appId || !secret) return finish('config', origin)

  try {
    // code → token curto
    const shortUrl = `${GRAPH}/oauth/access_token?client_id=${appId}`
      + `&redirect_uri=${encodeURIComponent(callbackUri(request, 'facebook'))}`
      + `&client_secret=${secret}&code=${encodeURIComponent(code)}`
    const short = await (await fetch(shortUrl)).json()
    if (!short.access_token) {
      console.error('[oauth/facebook] token exchange falhou:', short)
      return finish('token', origin, short?.error?.message || JSON.stringify(short).slice(0, 300))
    }

    // token longo
    const llUrl = `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token`
      + `&client_id=${appId}&client_secret=${secret}&fb_exchange_token=${short.access_token}`
    const ll = await (await fetch(llUrl)).json()
    const userToken: string = ll.access_token || short.access_token
    const expiresAt = ll.expires_in ? new Date(Date.now() + ll.expires_in * 1000).toISOString() : null

    // Páginas geridas (token de página publica em nome da Página).
    const pagesUrl = `${GRAPH}/me/accounts?fields=name,access_token,picture{url}&access_token=${userToken}`
    const pages = await (await fetch(pagesUrl)).json()
    const page: FBPage | undefined = (pages.data ?? [])[0]
    if (!page?.id) {
      console.error('[oauth/facebook] sem páginas:', pages)
      return finish('no_page', origin, pages?.error?.message || 'Nenhuma Página do Facebook encontrada para esta conta.')
    }

    const { error } = await saveSocialConnection(supabase, {
      user_email: email,
      platform: 'facebook',
      access_token: page.access_token,
      account_id: page.id,
      account_name: page.name,
      expires_at: expiresAt,
    }, page.picture?.data?.url ?? null)
    if (error) {
      console.error('[oauth/facebook] save_error:', error)
      return finish('save_error', origin, error)
    }

    return finish('connected', origin)
  } catch (e) {
    console.error('[oauth/facebook] exception:', e)
    return finish('error', origin, e instanceof Error ? e.message : String(e))
  }
}
