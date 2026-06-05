import { NextResponse, type NextRequest } from 'next/server'
import { callbackUri } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

// Inicia o OAuth do TikTok (Login Kit) e redireciona para a autorização.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY ausente no ambiente' }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('scope', 'user.info.basic,video.publish,video.upload')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', callbackUri(request, 'tiktok'))
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
