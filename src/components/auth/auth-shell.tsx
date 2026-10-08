import { CreditCard } from 'lucide-react'

/** Shared frame for the unauthenticated screens: login, reset, password setup. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <CreditCard className="h-6 w-6" aria-hidden="true" />
          ID Card Platform
        </div>
        <blockquote className="max-w-md space-y-3">
          <p className="text-lg leading-relaxed">
            One platform for every college: student records, photographs, approval
            and printing — with each college&rsquo;s data kept in its own boundary.
          </p>
          <footer className="text-sm text-slate-400">
            Multi-college operations, without spreadsheets.
          </footer>
        </blockquote>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 text-base font-semibold tracking-tight lg:hidden">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            ID Card Platform
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
