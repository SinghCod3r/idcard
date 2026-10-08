import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CircleCheck, Pencil } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { getStudent } from '@/lib/db/students'
import { getPhotoUrl } from '@/lib/db/photos'
import { uuidParam } from '@/lib/forms/params'
import { formatDateTime } from '@/lib/labels'
import { buttonVariants } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, PageHeader } from '@/components/section'

export const metadata = { title: 'Student' }

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">
        {value || <span className="font-normal text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { college } = await requireCollegeMember()
  const { studentId } = await params
  const query = await searchParams

  const id = uuidParam(studentId)
  if (!id) notFound()

  const student = await getStudent(college.id, id)
  if (!student) notFound()

  const photoUrl = student.photo?.storage_path
    ? await getPhotoUrl(student.photo.storage_path)
    : null

  return (
    <div className="space-y-6">
      {query.added && (
        <Alert>
          <CircleCheck className="size-4" aria-hidden="true" />
          <AlertDescription>
            Student created. Ask them to check the details, then review the record
            when it is submitted.
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title={student.full_name}
        description={student.class?.name ?? 'No class'}
        actions={
          <>
            <Link
              href={`/app/students/${student.id}/edit`}
              className={buttonVariants()}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit details
            </Link>
            <Link
              href="/app/students"
              className={buttonVariants({ variant: 'ghost' })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All students
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex h-48 w-40 overflow-hidden rounded-md border bg-muted shadow-sm">
            {photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={photoUrl} 
                alt={`${student.full_name}'s photo`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/50 text-muted-foreground">
                <span className="text-xs">No photo</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-2">
          <Card title="Academic">
            <dl>
              <Row label="Class" value={student.class?.name ?? null} />
              <Row label="Roll number" value={student.roll_number} />
            </dl>
          </Card>

          <Card title="Personal">
            <dl>
              <Row label="Phone" value={student.phone} />
            </dl>
          </Card>

          <Card title="Record" className="lg:col-span-2">
            <dl>
              <Row label="Added" value={formatDateTime(student.created_at)} />
              <Row label="Last changed" value={formatDateTime(student.updated_at)} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
