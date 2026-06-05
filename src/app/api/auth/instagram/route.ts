import { NextResponse, type NextRequest } from 'next/server'
import { FB_DIALOG, META_SCOPES, redirectUri } from '@/lib/meta-oauth'

export const dynamic = 'force-dynamic'

// Inicia o OAuth: monta a URL de autorização do Meta e redireciona para o login.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const appId = process.env.META_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID ausente no ambiente' }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const url = new URL(FB_DIALOG)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri(request))
  url.searchParams.set('scope', META_SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  // CSRF: guarda o state num cookie pra conferir no callback.
  res.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
