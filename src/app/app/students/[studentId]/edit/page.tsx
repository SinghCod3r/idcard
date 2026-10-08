import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { getStudent } from '@/lib/db/students'
import { getPhotoUrl } from '@/lib/db/photos'
import { uuidParam } from '@/lib/forms/params'
import { saveStudentAction } from '@/app/app/actions'
import { StudentForm } from '@/components/students/student-form'
import { buttonVariants } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/section'

export const metadata = { title: 'Edit student' }

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { college } = await requireCollegeMember()
  const { studentId } = await params

  const id = uuidParam(studentId)
  if (!id) notFound()

  const student = await getStudent(college.id, id)
  if (!student) notFound()

  const classes = await listClasses(college.id)
  
  const existingPhotoUrl = student.photo 
    ? await getPhotoUrl(student.photo.storage_path) 
    : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${student.full_name}`}
        description="Update the details before card production."
        actions={
          <Link
            href={`/app/students/${student.id}`}
            className={buttonVariants({ variant: 'ghost' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to student
          </Link>
        }
      />

      <Card title="Student details" description={`College: ${college.name}`}>
        <StudentForm
          student={student}
          action={saveStudentAction}
          classes={classes}
          cancelHref={`/app/students/${student.id}`}
          existingPhotoUrl={existingPhotoUrl ?? undefined}
        />
      </Card>
    </div>
  )
}

