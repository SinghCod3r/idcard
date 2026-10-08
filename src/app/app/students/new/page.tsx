import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { saveStudentAction } from '@/app/app/actions'
import { StudentForm } from '@/components/students/student-form'
import { buttonVariants } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/section'

export const metadata = { title: 'New student' }

export default async function NewStudentPage() {
  const { college } = await requireCollegeMember()

  const classes = await listClasses(college.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add a student"
        description="Provide basic student information."
        actions={
          <Link
            href="/app/students"
            className={buttonVariants({ variant: 'ghost' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to students
          </Link>
        }
      />

      <Card title="Student details" description={`College: ${college.name}`}>
        <StudentForm
          action={saveStudentAction}
          classes={classes}
          cancelHref="/app/students"
        />
      </Card>
    </div>
  )
}
