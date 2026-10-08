import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'

import { requireSuperAdmin } from '@/lib/authz/guards'
import { listColleges } from '@/lib/db/colleges'
import { parsePage, sanitizeSearch } from '@/lib/db/pagination'
import { firstParam } from '@/lib/forms/state'
import { formatNumber } from '@/lib/labels'
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

export const metadata = { title: 'Colleges' }

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireSuperAdmin()

  const params = await searchParams
  const page = parsePage(params.page)
  const search = sanitizeSearch(firstParam(params.q))

  const colleges = await listColleges({ page, search, pageSize: 20 })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        description="Each college is a separate tenant: its users only ever see their own data."
        actions={
          <Link href="/admin/colleges/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" />
            New college
          </Link>
        }
      />

      <FilterBar
        baseUrl="/admin/colleges"
        search={search}
        searchPlaceholder="Name, code or contact"
      />

      {colleges.rows.length === 0 ? (
        <EmptyState
          title={search ? 'No college matches that search' : 'No colleges yet'}
          description={
            search
              ? 'Try part of the name or the college code instead.'
              : 'Create the first college, then invite an admin and staff for it.'
          }
          icon={Building2}
          action={
            search ? (
              <Link href="/admin/colleges" className={buttonVariants({ variant: 'outline' })}>
                Clear search
              </Link>
            ) : (
              <Link href="/admin/colleges/new" className={buttonVariants()}>
                New college
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>College</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.rows.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell>
                      <Link
                        href={`/admin/colleges/${college.id}`}
                        className="font-medium hover:underline"
                      >
                        {college.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground sm:hidden">
                        {college.code}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs">
                      {college.code}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-56 truncate">
                        {college.contact_name ?? college.contact_email ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(college.student_count)}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={college.status === 'ACTIVE'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="px-5 pb-4">
            <ListPager
              page={colleges.page}
              total={colleges.total}
              pageSize={colleges.pageSize}
              label="colleges"
              hrefFor={(next) =>
                pageHref('/admin/colleges', { q: search || undefined }, next)
              }
            />
          </div>
        </Card>
      )}
    </div>
  )
}
