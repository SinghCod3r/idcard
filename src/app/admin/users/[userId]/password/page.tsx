import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/authz/guards'
import { updateUserPasswordAction } from '@/app/admin/actions'
import { buttonVariants } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/section'
import { PasswordForm } from './password-form'

export const metadata = { title: 'Change Password' }

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  await requireSuperAdmin()
  const { userId } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        description="Set a new password for this user."
        actions={
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: 'ghost' })}
          >
            Back to users
          </Link>
        }
      />

      <Card
        className="mx-auto w-full max-w-3xl"
        title="Reset Password"
        description="The new password will be immediately active."
      >
        <PasswordForm action={updateUserPasswordAction} userId={userId} />
      </Card>
    </div>
  )
}
