import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as z from 'zod'
import { ArrowLeft } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { getCollege } from '@/lib/db/colleges'
import { updateCollegeAction } from '@/app/admin/actions'
import { buttonVariants } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/section'
import { CollegeForm } from '@/app/admin/colleges/college-form'

export const metadata = { title: 'Edit college' }

export default async function EditCollegePage({
  params,
}: {
  params: Promise<{ collegeId: string }>
}) {
  await requireSuperAdmin()

  const { collegeId } = await params
  if (!z.uuid().safeParse(collegeId).success) notFound()

  const college = await getCollege(collegeId)
  if (!college) notFound()

  const back = `/admin/colleges/${collegeId}`

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${college.name}`}
        description="Changes are recorded in the activity log."
        actions={
          <Link href={back} className={buttonVariants({ variant: 'ghost' })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        }
      />

      <Card className="mx-auto w-full max-w-3xl" title="College details">
        <CollegeForm
          action={updateCollegeAction}
          college={college}
          submitLabel="Save changes"
          cancelHref={back}
        />
      </Card>
    </div>
  )
}
