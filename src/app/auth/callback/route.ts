import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_DOMAIN = 'braland.com.br'

// OAuth callback: exchange the code for a session, then enforce the domain.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const email = (data.user?.email ?? '').toLowerCase()
      if (email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return NextResponse.redirect(`${origin}/pipeline`)
      }
      // Authenticated but outside the allowed domain → block.
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=domain`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
