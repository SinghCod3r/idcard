import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, GraduationCap, Plus } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { listStudents } from '@/lib/db/students'
import { getPhotoUrls } from '@/lib/db/photos'
import { parsePage, sanitizeSearch } from "@/lib/db/pagination"
import { getSlugFromClass } from '@/lib/utils'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentsTable } from '@/components/students/students-table'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader } from '@/components/section'
import { ListPager, pageHref } from '@/components/list-pager'
import type { Student } from '@/types'

export const metadata = { title: 'Class View' }

export default async function ClassViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { college } = await requireCollegeMember()

  const query = await searchParams
  const page = parsePage(query.page)
  const search = sanitizeSearch(query.q)
  
  const resolvedParams = await params
  const rawParam = decodeURIComponent(resolvedParams.classId ?? '')
  if (!rawParam) notFound()

  const [classes, allStudents] = await Promise.all([
    listClasses(college.id),
    listStudents({
      collegeId: college.id,
      page,
      search,
    }),
  ])
  
  const selectedClass = classes.find((c) => c.id === rawParam || getSlugFromClass(c.name) === rawParam)
  if (!selectedClass) {
    notFound()
  }

  // We need to fetch students specifically for this class since we didn't have the UUID to start with.
  // We can either fetch all students in the class or just re-fetch with classId.
  const students = await listStudents({
    collegeId: college.id,
    page,
    search,
    classId: selectedClass.id
  })

  const photoPaths = students.rows.flatMap(s => s.photo ? [s.photo.storage_path] : [])
  const photoUrls = await getPhotoUrls(photoPaths)

  const filterValues = {
    search,
    classId: selectedClass.id,
  }

  const hrefFor = (student: Student) => `/app/students/${student.id}`

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedClass.name}
        description={`${students.total} student(s) in this class`}
        actions={
          <>
            <Link href={`/app/students/new?class=${selectedClass.id}`} className={buttonVariants()}>
              <Plus className="size-4" aria-hidden="true" />
              Add student
            </Link>
            <Link href="/app/students" className={buttonVariants({ variant: 'ghost' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              All classes
            </Link>
          </>
        }
      />

      <StudentFilters baseUrl={`/app/classes/${getSlugFromClass(selectedClass.name)}`} classes={classes} values={filterValues} hideClassFilter />

      {students.rows.length === 0 ? (
        <EmptyState
          title={search ? 'No student matches these filters' : 'No students yet'}
          description={
            search
              ? 'Try widening the filters, or clear them to see the whole list.'
              : 'Add the first student record to this class.'
          }
          icon={GraduationCap}
          action={
            search ? (
              <Link
                href={`/app/classes/${getSlugFromClass(selectedClass.name)}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Clear search
              </Link>
            ) : (
              <Link href={`/app/students/new?class=${selectedClass.id}`} className={buttonVariants()}>
                Add student
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden" bodyClassName="p-0">
          <StudentsTable students={students.rows} hrefFor={hrefFor} photoUrls={photoUrls} />

          <div className="px-5 pb-4">
            <ListPager
              page={students.page}
              total={students.total}
              pageSize={students.pageSize}
              label="students"
              hrefFor={(next) =>
                pageHref(
                  `/app/classes/${getSlugFromClass(selectedClass.name)}`,
                  { q: search || undefined },
                  next
                )
              }
            />
          </div>
        </Card>
      )}
    </div>
  )
}
