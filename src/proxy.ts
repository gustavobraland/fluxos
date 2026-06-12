import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Only @braland.com.br Google accounts may access the app.
// (Next 16 renamed the "middleware" convention to "proxy".)
const ALLOWED_DOMAIN = 'braland.com.br'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Bypass de autenticação SOMENTE em desenvolvimento local (preview).
  // Duplo-guardado: exige a flag NEXT_PUBLIC_PREVIEW_NOAUTH=1 (em .env.local) E
  // NODE_ENV !== 'production' — então NUNCA libera acesso em produção/Vercel,
  // mesmo que a flag vaze para o ambiente de deploy.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PREVIEW_NOAUTH === '1') {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // getUser() makes a server-side call to verify the session and rotates
  // the refresh token if needed. Under concurrent requests (e.g. parallel
  // fetches on page load) two requests can race to rotate the same token —
  // one succeeds, the other throws refresh_token_already_used.
  // In that case we fall back to getSession() which reads the existing JWT
  // from cookies without a network call (the access token is usually still
  // valid; the rotation was just proactive).
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code === 'refresh_token_already_used') {
      // Concurrent rotation race — not a security issue, read JWT from cookies.
      try {
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user ?? null
      } catch {
        user = null
      }
    } else {
      console.error('[proxy] Unexpected auth error:', e)
    }
  }

  const email = (user?.email ?? '').toLowerCase()
  const allowed = !!user && email.endsWith(`@${ALLOWED_DOMAIN}`)

  if (!allowed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    if (user) url.searchParams.set('error', 'domain')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Protect everything except the login page, the OAuth callback, API routes,
  // Next internals and static files.
  matcher: ['/((?!login|auth|api|_next/static|_next/image|favicon.svg|.*\\..*).*)'],
}
