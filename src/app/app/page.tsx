import Link from 'next/link'
import { GraduationCap, Plus, UserPlus } from 'lucide-react'

import { requireCollegeMember } from '@/lib/authz/guards'
import { getCollegeStats, listStudents } from '@/lib/db/students'
import { formatDate, formatNumber } from '@/lib/labels'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/section'

export const metadata = { title: 'Dashboard' }

export default async function CollegeDashboardPage() {
  const { college } = await requireCollegeMember()

  const [stats, recent] = await Promise.all([
    getCollegeStats(college.id),
    listStudents({ collegeId: college.id, page: 1, pageSize: 10 }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title={college.name}
        description={`${college.code} · everything on this page is scoped to your college.`}
        actions={
          <Link href="/app/students/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" />
            Add student
          </Link>
        }
      />

      {stats.students === 0 ? (
        <EmptyState
          title="No students yet"
          description="Add the first student record, then build out classes as you go."
          icon={GraduationCap}
          action={
            <Link href="/app/students/new" className={buttonVariants()}>
              Add the first student
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Students"
            value={formatNumber(stats.students)}
            href="/app/students"
          />
          <StatCard
            label="Photos on file"
            value={formatNumber(stats.photos_complete)}
            hint={`${formatNumber(Math.max(stats.students - stats.photos_complete, 0))} still missing`}
          />
          <StatCard
            label="Classes"
            value={formatNumber(stats.classes)}
            href="/app/classes"
          />
        </div>
      )}

      <Card
        title="Recently added"
        description="The newest student records in your college."
        actions={
          <Link
            href="/app/students"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            All students
          </Link>
        }
      >
        {recent.rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No student records yet.
          </p>
        ) : (
          <ul className="divide-y">
            {recent.rows.map((student) => (
              <li key={student.id}>
                <Link
                  href={`/app/students/${student.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {student.full_name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {student.roll_number ?? 'No roll number'}
                      {student.class?.name ? ` · ${student.class.name}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDate(student.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
