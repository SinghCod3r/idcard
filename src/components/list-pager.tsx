import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { totalPages } from '@/lib/db/pagination'

export function ListPager({
  page,
  total,
  pageSize,
  hrefFor,
  label = 'records',
}: {
  page: number
  total: number
  pageSize: number
  hrefFor: (page: number) => string
  label?: string
}) {
  const pageCount = totalPages(total, pageSize)
  if (pageCount <= 1) return null

  const first = Math.max(1, page - 2)
  const shown = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => first + index
  ).filter((n) => n <= pageCount)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total} {label} &middot; page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            page <= 1 && 'pointer-events-none opacity-50'
          )}
        >
          Previous
        </Link>
        {shown.map((n) => (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cn(
              buttonVariants({
                variant: n === page ? 'default' : 'ghost',
                size: 'sm',
              }),
              'min-w-9 tabular-nums'
            )}
          >
            {n}
          </Link>
        ))}
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= pageCount}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            page >= pageCount && 'pointer-events-none opacity-50'
          )}
        >
          Next
        </Link>
      </div>
    </div>
  )
}

/** Keeps current filters while swapping the page. */
export function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== 'page') search.set(key, value)
  }
  if (page > 1) search.set('page', String(page))
  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}
