import Link from 'next/link'
import { Search } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Option } from '@/components/forms/fields'

export interface FilterField {
  name: string
  label: string
  value: string
  options: Option[]
}

/**
 * Filters submit as a plain GET form instead of client state: the page reads
 * them from searchParams, so filtering works on first paint, on refresh, on
 * back navigation, and with JavaScript disabled. The page number is
 * deliberately not carried over — a new filter starts at page one.
 */
export function FilterBar({
  baseUrl,
  search = '',
  fields = [],
  extraFields,
  searchPlaceholder = 'Search',
  submitLabel = 'Apply',
}: {
  baseUrl: string
  search?: string
  fields?: FilterField[]
  extraFields?: Record<string, string>
  searchPlaceholder?: string
  submitLabel?: string
}) {
  const hasFilters = Boolean(search) || fields.some((field) => field.value)

  return (
    <form
      method="get"
      action={baseUrl}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="min-w-52 flex-1 space-y-1.5">
        <label htmlFor="q" className="text-sm font-medium">
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="q"
            name="q"
            defaultValue={search || undefined}
            placeholder={searchPlaceholder}
            className="h-9 pl-8"
          />
        </div>
      </div>

      {extraFields && Object.entries(extraFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      {fields.map((field) => (
        <div key={field.name} className="min-w-40 space-y-1.5">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          <select
            id={field.name}
            name={field.name}
            defaultValue={field.value}
            className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <Button type="submit">{submitLabel}</Button>

      {hasFilters && (
        <Link
          href={extraFields ? `${baseUrl}?${new URLSearchParams(extraFields).toString()}` : baseUrl}
          className={buttonVariants({ variant: 'ghost' })}
        >
          Clear
        </Link>
      )}
    </form>
  )
}
