import Link from 'next/link'
import { Building2, GraduationCap, Folder, ArrowRight } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { getCollege, listColleges } from '@/lib/db/colleges'
import { listStudents } from '@/lib/db/students'
import { getPhotoUrls } from '@/lib/db/photos'
import { parsePage, sanitizeSearch } from '@/lib/db/pagination'
import { uuidParam } from '@/lib/forms/params'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentsTable } from '@/components/students/students-table'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader } from '@/components/section'
import { ListPager, pageHref } from '@/components/list-pager'

export const metadata = { title: 'Students' }

export default async function PlatformStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireSuperAdmin()

  const params = await searchParams
  const collegeId = uuidParam(params.college)
  const page = parsePage(params.page)
  const search = sanitizeSearch(params.q)
  const classId = uuidParam(params.class)

  if (!collegeId) {
    const colleges = await listColleges({ page: 1, pageSize: 100 })

    return (
      <div className="space-y-6">
        <PageHeader
          title="Students"
          description="Student records belong to a college, so the platform view opens one college at a time."
        />
        {colleges.rows.length === 0 ? (
          <EmptyState
            title="No colleges yet"
            description="Create a college and invite its admin before students can exist."
            icon={Building2}
            action={
              <Link href="/admin/colleges/new" className={buttonVariants()}>
                New college
              </Link>
            }
          />
        ) : (
          <Card title="Choose a college" bodyClassName="p-0">
            <ul className="divide-y">
              {colleges.rows.map((college) => (
                <li key={college.id}>
                  <Link
                    href={`/admin/students?college=${college.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {college.name}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {college.code}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                      {college.student_count} students
                      {college.status !== 'ACTIVE' && '· inactive'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    )
  }

  const college = await getCollege(collegeId)
  if (!college) {
    return (
      <div className="space-y-6">
        <PageHeader title="Students" />
        <EmptyState
          title="That college could not be found"
          description="It may have been removed. Pick a college from the list instead."
          icon={GraduationCap}
          action={
            <Link href="/admin/students" className={buttonVariants()}>
              Choose a college
            </Link>
          }
        />
      </div>
    )
  }

  const [classes, students] = await Promise.all([
    listClasses(collegeId),
    listStudents({
      collegeId,
      page,
      search,
      classId,
    }),
  ])

  const photoPaths = students.rows.flatMap(s => s.photo ? [s.photo.storage_path] : [])
  const photoUrls = await getPhotoUrls(photoPaths)

  const filterValues = {
    search,
    classId: classId ?? undefined,
  }

  const isClassView = !!classId || !!search

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Students · ${college.name}`}
        description="Read-only here. Entering and reviewing students happens inside the college."
        actions={
          <div className="flex gap-2">
            <Link
              href={`/api/colleges/${college.id}/photos/zip`}
              prefetch={false}
              target="_blank"
              className={buttonVariants()}
            >
              Download all photos (ZIP)
            </Link>
            <Link
              href={`/admin/colleges/${college.id}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Back to college
            </Link>
          </div>
        }
      />

      {isClassView && (
        <StudentFilters baseUrl="/admin/students" classes={classes} values={filterValues} extraQuery={{ college: collegeId }} />
      )}

      {!isClassView ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.length === 0 ? (
             <EmptyState
               title="No classes yet"
               description="The college has not added any classes."
               icon={Folder}
             />
          ) : (
            classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/admin/students?college=${collegeId}&class=${cls.id}`}
                className="group flex items-center justify-between rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-muted/40"
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
                  : 'The college has not added any students to this class.'
              }
              icon={GraduationCap}
              action={
                search ? (
                  <Link
                    href={`/admin/students?college=${collegeId}${classId ? `&class=${classId}` : ''}`}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Clear search
                  </Link>
                ) : null
              }
            />
          ) : (
            <Card className="overflow-hidden" bodyClassName="p-0">
              <StudentsTable students={students.rows} photoUrls={photoUrls} />

              <div className="px-5 pb-4">
                <ListPager
                  page={students.page}
                  total={students.total}
                  pageSize={students.pageSize}
                  label="students"
                  hrefFor={(next) =>
                    pageHref(
                      '/admin/students',
                      {
                        college: collegeId,
                        q: search || undefined,
                        class: classId,
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
