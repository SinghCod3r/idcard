import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as z from 'zod'
import {
  ArrowLeft,
  GraduationCap,
  Pencil,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { getCollege } from '@/lib/db/colleges'
import { getCollegeStats } from '@/lib/db/students'
import { listCollegeUsers } from '@/lib/db/members'
import { setCollegeStatusAction } from '@/app/admin/actions'
import {
  COLLEGE_STATUS_LABEL,
  ROLE_LABEL,
  formatDate,
  formatNumber,
} from '@/lib/labels'
import { buttonVariants } from '@/components/ui/button'
import { Card, EmptyState, PageHeader, StatCard } from '@/components/section'
import { TabsNav } from '@/components/tabs-nav'
import { ActiveBadge } from '@/components/active-badge'
import { ActionForm } from '@/components/forms/action-form'
import { Alert, AlertDescription } from '@/components/ui/alert'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'students', label: 'Students' },
  { key: 'staff', label: 'Staff' },
  { key: 'settings', label: 'Settings' },
]

type CollegeRow = NonNullable<Awaited<ReturnType<typeof getCollege>>>

export default async function CollegeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ collegeId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireSuperAdmin()

  const { collegeId } = await params
  if (!z.uuid().safeParse(collegeId).success) notFound()

  const query = await searchParams
  const requested = Array.isArray(query.tab) ? query.tab[0] : query.tab
  const tab = TABS.find((item) => item.key === requested)?.key ?? 'overview'

  const college = await getCollege(collegeId)
  if (!college) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={college.name}
        description="Everything on this page stays inside this one college."
        actions={
          <>
            <Link
              href="/admin/colleges"
              className={buttonVariants({ variant: 'ghost' })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Colleges
            </Link>
            <Link
              href={`/admin/users/new?college=${college.id}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Invite a user here
            </Link>
          </>
        }
      />

      <TabsNav tabs={TABS} active={tab} baseUrl={`/admin/colleges/${college.id}`} />

      {query.added && (
        <Alert>
          <AlertDescription>
            College created. Invite a College Admin so someone can start adding
            students.
          </AlertDescription>
        </Alert>
      )}

      {tab === 'overview' && <Overview college={college} />}
      {tab === 'students' && <StudentsTab college={college} />}
      {tab === 'staff' && <StaffTab collegeId={college.id} />}
      {tab === 'settings' && <SettingsTab college={college} />}
    </div>
  )
}

async function Overview({ college }: { college: CollegeRow }) {
  const stats = await getCollegeStats(college.id)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={formatNumber(stats.students)} />
        <StatCard
          label="Photos on file"
          value={formatNumber(stats.photos_complete)}
          hint={`${formatNumber(Math.max(0, stats.students - stats.photos_complete))} still missing`}
        />
        <StatCard label="Classes" value={formatNumber(stats.classes)} />
      </div>

      <Card title="College details" bodyClassName="p-0">
        <dl className="divide-y text-sm">
          <Row label="Code" value={college.code} mono />
          <Row label="Status" value={COLLEGE_STATUS_LABEL[college.status]} />
          <Row label="Contact" value={college.contact_name ?? '—'} />
          <Row label="Email" value={college.contact_email ?? '—'} />
          <Row label="Phone" value={college.phone ?? '—'} />
          <Row label="Address" value={college.address ?? '—'} />
          <Row label="Created" value={formatDate(college.created_at)} />
        </dl>
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'col-span-2 font-mono text-xs' : 'col-span-2 break-words'}>
        {value}
      </dd>
    </div>
  )
}

function StudentsTab({ college }: { college: CollegeRow }) {
  return (
    <Card title="Students" bodyClassName="space-y-4">
      <p className="text-sm text-muted-foreground">
        Student records are worked on from one list that can be filtered by
        college. Searching, paging and the review statuses all happen there.
      </p>
      <Link
        href={`/admin/students?college=${college.id}`}
        className={buttonVariants()}
      >
        <GraduationCap className="size-4" aria-hidden="true" />
        Open students of {college.name}
      </Link>
    </Card>
  )
}

async function StaffTab({ collegeId }: { collegeId: string }) {
  const staff = await listCollegeUsers({ page: 1, pageSize: 1000, collegeId })
  const rows = staff.rows

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nobody in this college yet"
        description="Invite a College Admin to run it, and College Staff to enter students."
        icon={UsersRound}
        action={
          <Link
            href={`/admin/users/new?college=${collegeId}`}
            className={buttonVariants()}
          >
            Invite a user
          </Link>
        }
      />
    )
  }

  return (
    <Card
      title="Staff"
      description="Everyone with access inside this college."
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {rows.map((person) => (
          <li
            key={person.membership_id}
            className="flex items-center justify-between gap-4 px-5 py-3"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {person.name ?? person.email}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {person.email}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <ActiveBadge
                active={person.is_active && person.membership_status === 'ACTIVE'}
              />
              <span className="text-sm text-muted-foreground">
                {ROLE_LABEL[person.role]}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SettingsTab({ college }: { college: CollegeRow }) {
  const deactivate = college.status === 'ACTIVE'

  return (
    <div className="space-y-6">
      <Card
        title="Access status"
        description={
          deactivate
            ? 'Users in this college can sign in, and their data is visible to them.'
            : 'Deactivated: these users lose access on their next request, and their data stops being reachable.'
        }
        bodyClassName="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <ActiveBadge active={deactivate} />
          <ActionForm
            action={setCollegeStatusAction}
            fields={{ id: college.id, status: deactivate ? 'INACTIVE' : 'ACTIVE' }}
            label={deactivate ? 'Deactivate college' : 'Activate college'}
            variant={deactivate ? 'destructive' : 'default'}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Status changes are recorded in the activity log. Nothing is deleted.
        </p>
      </Card>

      <Card
        title="College profile"
        description="Name, code and contact details."
        actions={
          <Link
            href={`/admin/colleges/${college.id}/edit`}
            className={buttonVariants({ size: 'sm' })}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit details
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Students are entered by this college&rsquo;s own admin and staff. The
          platform side changes access and status, not student records.
        </p>
      </Card>
    </div>
  )
}
