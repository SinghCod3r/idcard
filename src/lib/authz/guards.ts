import 'server-only'

import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { requireAuth, type CurrentUser } from '@/lib/auth/session'
import { ActionError } from '@/lib/db/errors'

/**
 * Route- and action-level authorization. These do not replace Row Level
 * Security: they decide which UI and which mutations a caller may attempt,
 * while the database makes an attempted cross-college write impossible.
 */

export const requireSuperAdmin = cache(async (): Promise<CurrentUser> => {
  const user = await requireAuth()
  if (user.role !== 'SUPER_ADMIN') {
    redirect(user.college ? '/app' : '/no-college')
  }
  return user
})

/** A user who signed up but has not been placed in a college yet. */
export const requireCollegeMember = cache(async (): Promise<{
  user: CurrentUser
  college: NonNullable<CurrentUser['college']>
}> => {
  const user = await requireAuth()
  if (user.role === 'SUPER_ADMIN') redirect('/admin')
  if (!user.college) redirect('/no-college')
  return { user, college: user.college }
})

/**
 * Validates a college id that arrived from a URL or form against the caller.
 * College users get their own id back no matter what they asked for, so a
 * hand-edited `college_id` narrows to their own college instead of escaping it.
 */
export async function resolveCollegeAccess(
  requestedCollegeId: string | null | undefined,
  user: CurrentUser
): Promise<string> {
  if (user.role === 'SUPER_ADMIN') {
    if (!requestedCollegeId) {
      throw new ActionError('Choose a college first.')
    }
    return requestedCollegeId
  }

  if (!user.college) notFound()
  return user.college.id
}
