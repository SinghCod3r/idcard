import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/auth-shell'
import { SetPasswordForm } from '@/components/auth/set-password-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Choose a password | ID Card Platform' }

export default async function SetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <AuthShell
      title="Choose a password"
      subtitle="Set a password for your account to continue."
    >
      <SetPasswordForm />
    </AuthShell>
  )
}
