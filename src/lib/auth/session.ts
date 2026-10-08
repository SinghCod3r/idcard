import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { EffectiveRole } from '@/types'

export interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: EffectiveRole
  /** The one college this account can act inside. Null for Super Admin. */
  college: {
    id: string
    name: string
    code: string
    role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
  } | null
}

/**
 * Resolves who is calling from the auth cookie and the database, never from
 * anything the request carries. Memoised per request so a page, its layout and
 * a server action in the same pass share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('auth: profile lookup failed', profileError.code)
    throw new Error('Could not load your account. Please try again.')
  }

  if (!profile) return null

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?reason=deactivated')
  }

  const isSuperAdmin = profile.role === 'SUPER_ADMIN'

  const { data: membership, error: membershipError } = await supabase
    .from('college_members')
    .select('college_id, role, status, college:colleges(id, name, code, status)')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (membershipError) {
    console.error('auth: membership lookup failed', membershipError.code)
    throw new Error('Could not load your college access. Please try again.')
  }

  type CollegeRef = { id: string; name: string; code: string; status: string }

  // PostgREST hands back a to-one embed as an object; the untyped client infers
  // an array, so it is narrowed once here instead of trusted throughout.
  const ref = membership
    ? (membership.college as unknown as CollegeRef | null)
    : null

  let college: CurrentUser['college'] = null

  if (membership && ref?.status === 'ACTIVE') {
    college = {
      id: ref.id,
      name: ref.name,
      code: ref.code,
      role: membership.role as 'COLLEGE_ADMIN' | 'COLLEGE_STAFF',
    }
  }

  let role: EffectiveRole
  if (isSuperAdmin) role = 'SUPER_ADMIN'
  else if (college) role = college.role
  else role = 'UNASSIGNED'

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role,
    college,
  }
})

/** Authenticated landing area, so login and logout always land in the right place. */
export function homeFor(user: CurrentUser): string {
  return user.role === 'SUPER_ADMIN' ? '/admin' : '/app'
}

export const requireAuth = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
})
