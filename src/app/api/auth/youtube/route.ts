import { NextResponse, type NextRequest } from 'next/server'
import { callbackUri } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ')

// Inicia o OAuth do Google/YouTube (access_type=offline → refresh_token).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'YOUTUBE_CLIENT_ID ausente no ambiente' }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUri(request, 'youtube'))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account consent') // seletor de conta + refresh_token
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('youtube_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
