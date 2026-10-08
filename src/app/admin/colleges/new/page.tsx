import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { createCollegeAction } from '@/app/admin/actions'
import { buttonVariants } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/section'
import { CollegeForm } from '@/app/admin/colleges/college-form'

export const metadata = { title: 'New college' }

export default async function NewCollegePage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-6">
      <PageHeader
        title="New college"
        description="Create the tenant first. Invitations for its admin and staff come after."
        actions={
          <Link
            href="/admin/colleges"
            className={buttonVariants({ variant: 'ghost' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to colleges
          </Link>
        }
      />

      <Card className="mx-auto w-full max-w-3xl" title="College details">
        <CollegeForm
          action={createCollegeAction}
          submitLabel="Create college"
          cancelHref="/admin/colleges"
        />
      </Card>
    </div>
  )
}
