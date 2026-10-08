import Link from 'next/link'
import { Activity, Building2, History, UserPlus } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { getPlatformStats } from '@/lib/db/students'
import { listColleges } from '@/lib/db/colleges'
import { listAuditLogs } from '@/lib/db/audit'
import { describeAction, formatDateTime, formatNumber } from '@/lib/labels'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader, StatCard } from '@/components/section'
import { ActiveBadge } from '@/components/active-badge'

export const metadata = { title: 'Platform overview' }

export default async function AdminOverviewPage() {
  await requireSuperAdmin()

  const [stats, colleges, activity] = await Promise.all([
    getPlatformStats(),
    listColleges({ page: 1, pageSize: 5 }),
    listAuditLogs(null, 8),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform overview"
        description="Every college on the platform, and what changed most recently."
        actions={
          <>
            <Link href="/admin/colleges/new" className={buttonVariants()}>
              <Building2 className="size-4" aria-hidden="true" />
              New college
            </Link>
            <Link
              href="/admin/users/new"
              className={buttonVariants({ variant: 'outline' })}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Invite a user
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Colleges"
          value={formatNumber(stats.colleges)}
          hint={`${formatNumber(stats.colleges_active)} active`}
          href="/admin/colleges"
        />
        <StatCard
          label="Students"
          value={formatNumber(stats.students)}
          hint="Across every college"
          href="/admin/students"
        />
        <StatCard
          label="College users"
          value={formatNumber(stats.college_users)}
          hint="Admins and staff with a college"
          href="/admin/users"
        />
        <StatCard
          label="Photos missing"
          value={formatNumber(stats.photos_missing)}
          hint="Students who cannot get a card yet"
        />
        <StatCard
          label="Newest college"
          value={colleges.rows[0]?.name ?? '—'}
          hint={colleges.rows[0]?.code}
          href={colleges.rows[0] ? `/admin/colleges/${colleges.rows[0].id}` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Colleges"
          description="The five most recently added."
          actions={
            <Link
              href="/admin/colleges"
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              View all
            </Link>
          }
        >
          {colleges.rows.length === 0 ? (
            <EmptyState
              title="No colleges yet"
              description="Create the first college, then invite an admin for it."
              icon={Building2}
              action={
                <Link href="/admin/colleges/new" className={buttonVariants()}>
                  New college
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {colleges.rows.map((college) => (
                <li key={college.id}>
                  <Link
                    href={`/admin/colleges/${college.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {college.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {college.code}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <ActiveBadge active={college.status === 'ACTIVE'} />
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatNumber(college.student_count)} students
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent activity"
          description="Who changed what. Passwords and tokens are never recorded."
        >
          {activity.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              description="Creating a college or inviting a user will show up here."
              icon={Activity}
            />
          ) : (
            <ul className="divide-y">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-3">
                  <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {describeAction(entry.action)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.actor?.name ?? entry.actor?.email ?? 'Unknown'} &middot;{' '}
                      {formatDateTime(entry.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
