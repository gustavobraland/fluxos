import { NextResponse, type NextRequest } from 'next/server'
import { callbackUri } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

// Escopo p/ criar eventos no Google Calendar do usuário (gera lembretes/notificações).
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

// Reaproveita o mesmo app Google do YouTube (ou GOOGLE_CLIENT_ID dedicado).
// Requer no Google Cloud: API "Google Calendar" habilitada + redirect URI
//   <origin>/api/auth/gcal/callback autorizado.
function googleClientId(): string | undefined {
  return process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = googleClientId()
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID/YOUTUBE_CLIENT_ID ausente no ambiente' }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUri(request, 'gcal'))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account consent') // seletor de conta + refresh_token
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('gcal_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
