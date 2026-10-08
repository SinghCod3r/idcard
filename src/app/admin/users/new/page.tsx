import Link from 'next/link'
import * as z from 'zod'
import { Building2 } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { getCollegesForSelector } from '@/lib/db/colleges'
import { createUserAction } from '@/app/admin/actions'
import { firstParam } from '@/lib/forms/state'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader } from '@/components/section'
import { CreateForm } from '@/app/admin/users/create-form'

export const metadata = { title: 'Create a user' }

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireSuperAdmin()

  const params = await searchParams
  const requested = firstParam(params.college)
  const colleges = await getCollegesForSelector()

  const defaultCollege =
    requested && z.uuid().safeParse(requested).success && colleges.some((c) => c.id === requested)
      ? requested
      : undefined

  if (colleges.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create a user" />
        <EmptyState
          title="There is no college to place them in"
          description="College users always belong to one college. Create a college first."
          icon={Building2}
          action={
            <Link href="/admin/colleges/new" className={buttonVariants()}>
              New college
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a user"
        description="One college, one role. You will set their initial password."
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
        title="Invitation"
        description="Create a new user account directly. Super Admin cannot be handed out here."
      >
        <CreateForm
          action={createUserAction}
          colleges={colleges.map((college) => ({
            value: college.id,
            label: `${college.name} (${college.code})`,
          }))}
          defaultCollegeId={defaultCollege}
        />
      </Card>
    </div>
  )
}
