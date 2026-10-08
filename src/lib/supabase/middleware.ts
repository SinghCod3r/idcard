import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/set-password', '/auth']

/**
 * Optimistic only: keep the session cookies fresh and bounce clearly
 * unauthenticated visitors to sign-in. Real authorization lives in the data
 * layer and Row Level Security, because this runs on every request and cannot
 * afford a database read.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not add work between createServerClient and getUser(): skipping the
  // refresh can sign users out at random.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    if (path !== '/') {
      url.searchParams.set('next', path + request.nextUrl.search)
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
