import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string
  value: string | number
  href?: string
  hint?: string
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
      >
        {body}
      </Link>
    )
  }

  return <div className="rounded-xl border bg-card p-5 shadow-sm">{body}</div>
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description: string
  action?: React.ReactNode
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Icon className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Tables and forms need their own edges instead of the default padding. */
  bodyClassName?: string
}) {
  return (
    <section
      className={cn('rounded-xl border bg-card shadow-sm', className)}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="space-y-0.5">
            {title && <h2 className="font-semibold tracking-tight">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
