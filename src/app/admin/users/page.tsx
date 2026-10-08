import Link from 'next/link'
import * as z from 'zod'
import { Plus, UsersRound } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { listCollegeUsers } from '@/lib/db/members'
import { getCollegesForSelector } from '@/lib/db/colleges'
import { parsePage, sanitizeSearch } from '@/lib/db/pagination'
import { firstParam } from '@/lib/forms/state'
import { changeUserCollegeAction, setUserActiveAction } from '@/app/admin/actions'
import { ROLE_LABEL } from '@/lib/labels'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, EmptyState, PageHeader } from '@/components/section'
import { FilterBar } from '@/components/filters/filter-bar'
import { ListPager, pageHref } from '@/components/list-pager'
import { ActiveBadge } from '@/components/active-badge'
import { ActionForm } from '@/components/forms/action-form'
import { ChangeCollegeSelect } from '@/components/forms/change-college-select'

export const metadata = { title: 'Users' }

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireSuperAdmin()

  const params = await searchParams
  const page = parsePage(params.page)
  const search = sanitizeSearch(firstParam(params.q))
  // A hand-typed college id is simply ignored; it never widens what is shown.
  const collegeParam = firstParam(params.college)
  const collegeId = collegeParam && z.uuid().safeParse(collegeParam).success
    ? collegeParam
    : undefined

  const [users, colleges] = await Promise.all([
    listCollegeUsers({ page, search, collegeId, pageSize: 20 }),
    getCollegesForSelector(),
  ])

  const activeCollege = colleges.find((c) => c.id === collegeId)
  const collegeOptions = colleges.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Admins and staff inside colleges. Every account belongs to exactly one college, and nobody chooses that themselves."
        actions={
          <Link href="/admin/users/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" />
            Create a user
          </Link>
        }
      />

      <FilterBar
        baseUrl="/admin/users"
        search={search}
        searchPlaceholder="Name or email"
        fields={[
          {
            name: 'college',
            label: 'College',
            value: activeCollege?.id ?? '',
            options: [{ value: '', label: 'All colleges' }, ...collegeOptions],
          },
        ]}
      />

      {users.rows.length === 0 ? (
        <EmptyState
          title={
            search || activeCollege
              ? 'No user matches those filters'
              : 'No college users yet'
          }
          description={
            search || activeCollege
              ? 'Clear the filters, or create a user into the college.'
              : 'Create a college first, then create an admin for it.'
          }
          icon={UsersRound}
          action={
            <Link href="/admin/users/new" className={buttonVariants()}>
              Create a user
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">Move / block</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.rows.map((user) => (
                  <TableRow key={user.membership_id}>
                    <TableCell>
                      <span className="block max-w-56 truncate font-medium">
                        {user.name ?? user.email}
                      </span>
                      <span className="block max-w-56 truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users?college=${user.college_id}`}
                        className="hover:underline"
                      >
                        {user.college_name}
                      </Link>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {user.college_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ROLE_LABEL[user.role]}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge
                        active={user.is_active && user.membership_status === 'ACTIVE'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <ChangeCollegeSelect
                          action={changeUserCollegeAction}
                          membershipId={user.membership_id}
                          currentCollegeId={user.college_id}
                          colleges={collegeOptions}
                        />
                        <ActionForm
                          action={setUserActiveAction}
                          fields={{
                            user_id: user.user_id,
                            active: user.is_active ? '0' : '1',
                            college_id: user.college_id,
                          }}
                          label={user.is_active ? 'Deactivate' : 'Activate'}
                          variant={user.is_active ? 'destructive' : 'default'}
                        />
                        <Link
                          href={`/admin/users/${user.user_id}/password`}
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        >
                          Password
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="px-5 pb-4">
            <ListPager
              page={users.page}
              total={users.total}
              pageSize={users.pageSize}
              label="users"
              hrefFor={(next) =>
                pageHref(
                  '/admin/users',
                  {
                    q: search || undefined,
                    college: activeCollege?.id,
                  },
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
