import Link from 'next/link'
import { Folder, GraduationCap, Plus, ArrowRight } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { listStudents } from '@/lib/db/students'
import { getPhotoUrls } from '@/lib/db/photos'
import { parsePage, sanitizeSearch } from "@/lib/db/pagination"
import { getSlugFromClass } from "@/lib/utils"
import { uuidParam } from '@/lib/forms/params'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentsTable } from '@/components/students/students-table'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader } from '@/components/section'
import { ListPager, pageHref } from '@/components/list-pager'
import type { Student } from '@/types'

export const metadata = { title: 'Students' }

export default async function CollegeStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { college } = await requireCollegeMember()

  const params = await searchParams
  const page = parsePage(params.page)
  const search = sanitizeSearch(params.q)
  const classId = uuidParam(params.class)

  const [classes, students] = await Promise.all([
    listClasses(college.id),
    listStudents({
      collegeId: college.id,
      page,
      search,
      classId,
    }),
  ])
  
  const photoPaths = students.rows.flatMap(s => s.photo ? [s.photo.storage_path] : [])
  const photoUrls = await getPhotoUrls(photoPaths)

  const filterValues = {
    search,
    classId: undefined, // no longer needed on this page
  }

  const hrefFor = (student: Student) => `/app/students/${student.id}`

  const isSearchView = !!search

  const headerTitle = 'Students'
  const headerDesc = `${college.name} · Choose a class to view its students`

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle}
        description={headerDesc}
        actions={
          isSearchView ? (
            <Link href="/app/students/new" className={buttonVariants()}>
              <Plus className="size-4" aria-hidden="true" />
              Add student
            </Link>
          ) : (
            <Link href="/app/classes" className={buttonVariants()}>
              <Plus className="size-4" aria-hidden="true" />
              Manage classes
            </Link>
          )
        }
      />

      {isSearchView && (
        <StudentFilters baseUrl="/app/students" classes={classes} values={filterValues} />
      )}

      {!isSearchView ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.length === 0 ? (
             <EmptyState
               title="No classes yet"
               description="Create a class first so you can add students into it."
               icon={Folder}
               action={
                 <Link href="/app/classes" className={buttonVariants()}>
                   Create a class
                 </Link>
               }
             />
          ) : (
            classes.map((cls) => (
              <Link
                key={getSlugFromClass(cls.name)}
                href={`/app/classes/${getSlugFromClass(cls.name)}`}
                className="group flex items-center justify-between rounded-lg border bg-card p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md hover:bg-muted/40 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cls.student_count ?? 0} students
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
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
                    href={`/app/students`}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Clear search
                  </Link>
                ) : (
                  <Link href="/app/students/new" className={buttonVariants()}>
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
                      '/app/students',
                      {
                        q: search || undefined,
                      },
                      next
                    )
                  }
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
