import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Reset password | ID Card Platform' }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
