import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Only @braland.com.br Google accounts may access the app.
// (Next 16 renamed the "middleware" convention to "proxy".)
const ALLOWED_DOMAIN = 'braland.com.br'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

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

  const { data: { user } } = await supabase.auth.getUser()
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
