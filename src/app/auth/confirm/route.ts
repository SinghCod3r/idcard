import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectTarget } from '@/lib/auth/redirect'

/**
 * Lands the links Supabase emails out: invitation acceptance, password recovery,
 * and magic links. The `next` target is validated so this cannot be turned into
 * an open redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const linkType = url.searchParams.get('type')
  const next = safeRedirectTarget(url.searchParams.get('next')) || '/app'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  if (tokenHash) {
    const type =
      linkType === 'invite' ? 'invite' : linkType === 'recovery' ? 'recovery' : 'email'

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      // An accepted invitation or a recovery link should end at a password form.
      const target =
        linkType === 'invite' || linkType === 'recovery' ? '/set-password' : next
      return NextResponse.redirect(new URL(target, url.origin))
    }

    console.error('[auth] token verification failed', error.message)
  }

  return NextResponse.redirect(
    new URL('/login?reason=invalid-link', url.origin)
  )
}
