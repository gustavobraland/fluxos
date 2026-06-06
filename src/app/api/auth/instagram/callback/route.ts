import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GRAPH, redirectUri } from '@/lib/meta-oauth'
import { appOrigin, oauthPopupResponse as finish, saveSocialConnection } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

interface MetaPage {
  name: string
  access_token: string
  instagram_business_account?: { id: string; username?: string; profile_picture_url?: string }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const origin = appOrigin(request)
  const code = sp.get('code')
  const state = sp.get('state')
  const oauthError = sp.get('error')

  if (oauthError || !code) return finish('error', origin)

  // CSRF
  const cookieState = request.cookies.get('ig_oauth_state')?.value
  if (!cookieState || cookieState !== state) return finish('state_mismatch', origin)

  // Quem está conectando (sessão Supabase do Google login, mesmo domínio).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) return finish('noauth', origin)

  const appId = process.env.META_APP_ID
  const secret = process.env.META_APP_SECRET
  if (!appId || !secret) return finish('config', origin)

  try {
    // 1. code → token de curta duração
    const shortUrl = `${GRAPH}/oauth/access_token?client_id=${appId}`
      + `&redirect_uri=${encodeURIComponent(redirectUri(request))}`
      + `&client_secret=${secret}&code=${encodeURIComponent(code)}`
    const short = await (await fetch(shortUrl)).json()
    if (!short.access_token) return finish('token', origin)

    // 2. troca por token de longa duração (~60 dias)
    const llUrl = `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token`
      + `&client_id=${appId}&client_secret=${secret}&fb_exchange_token=${short.access_token}`
    const ll = await (await fetch(llUrl)).json()
    const userToken: string = ll.access_token || short.access_token
    const expiresAt = ll.expires_in
      ? new Date(Date.now() + ll.expires_in * 1000).toISOString()
      : null

    // 3. páginas + conta IG business ligada (token de página publica em nome do IG)
    const pagesUrl = `${GRAPH}/me/accounts`
      + `?fields=name,access_token,instagram_business_account{id,username,profile_picture_url}`
      + `&access_token=${userToken}`
    const pages = await (await fetch(pagesUrl)).json()
    const list: MetaPage[] = pages.data ?? []

    const rows = list
      .filter((p) => p.instagram_business_account?.id)
      .map((p) => ({
        base: {
          user_email: email,
          platform: 'instagram',
          access_token: p.access_token,
          account_id: p.instagram_business_account!.id,
          account_name: p.instagram_business_account!.username
            ? '@' + p.instagram_business_account!.username
            : p.name,
          expires_at: expiresAt,
        },
        avatar: p.instagram_business_account!.profile_picture_url ?? null,
      }))

    if (rows.length === 0) return finish('no_ig', origin) // nenhuma conta IG business ligada à página

    // Uma conexão por plataforma (conta primária).
    const { error } = await saveSocialConnection(supabase, rows[0].base, rows[0].avatar)
    if (error) {
      console.error('[oauth/instagram] save_error:', error)
      return finish('save_error', origin, error)
    }

    return finish('connected', origin)
  } catch (e) {
    console.error('[oauth/instagram] exception:', e)
    return finish('error', origin, e instanceof Error ? e.message : String(e))
  }
}
