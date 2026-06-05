import { NextResponse, type NextRequest } from 'next/server'
import { FB_DIALOG } from '@/lib/meta-oauth'
import { callbackUri } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

const SCOPES = 'pages_show_list,pages_read_engagement,pages_manage_posts'

// Inicia o OAuth do Facebook (publicar em Páginas).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const appId = process.env.META_APP_ID
  if (!appId) return NextResponse.json({ error: 'META_APP_ID ausente no ambiente' }, { status: 500 })

  const state = crypto.randomUUID()
  const url = new URL(FB_DIALOG)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', callbackUri(request, 'facebook'))
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('facebook_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
