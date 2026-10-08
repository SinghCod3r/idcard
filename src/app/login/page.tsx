import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { getCurrentUser, homeFor } from '@/lib/auth/session'
import { safeRedirectTarget } from '@/lib/auth/redirect'

export const metadata: Metadata = {
  title: 'Sign in | ID Card Platform',
}

const NOTICES: Record<string, string> = {
  deactivated: 'This account has been deactivated. Contact your college admin.',
  'invalid-link': 'That link is no longer valid. Request a new one.',
  signed_out: 'You have been signed out.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect(homeFor(user))

  const { next, reason } = await searchParams

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use the account your platform owner created for you."
    >
      {reason && NOTICES[reason] && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {NOTICES[reason]}
        </p>
      )}
      <LoginForm next={safeRedirectTarget(next) || undefined} />
    </AuthShell>
  )
}
