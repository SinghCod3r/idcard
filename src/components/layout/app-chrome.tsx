'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  Building2,
  CalendarRange,
  CreditCard,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCircle2,
  Users,
  UsersRound,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { navFor } from '@/lib/nav'
import { ROLE_LABEL } from '@/lib/labels'
import type { CurrentUser } from '@/lib/auth/session'
import { signOutAction } from '@/lib/auth/actions'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const ICONS = {
  '/admin': LayoutDashboard,
  '/admin/colleges': Building2,
  '/admin/users': UsersRound,
  '/admin/students': GraduationCap,
  '/app': LayoutDashboard,
  '/app/students': GraduationCap,
  '/app/classes': Layers,
  '/app/sections': Users,
  '/app/academic-sessions': CalendarRange,
  '/app/staff': UsersRound,
  '/app/settings': Settings,
} as const


function isActive(pathname: string, href: string, areaHref: string) {
  if (href === areaHref) return pathname === href
  
  // Highlighting "Students" when viewing a specific class
  if (href === '/app/students' && pathname.startsWith('/app/classes/')) {
    return true
  }
  
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({
  user,
  areaHref,
  onNavigate,
}: {
  user: CurrentUser
  areaHref: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navFor(user.role).items.map((item) => {
        const Icon = ICONS[item.href as keyof typeof ICONS] ?? LayoutDashboard
        const active = isActive(pathname, item.href, areaHref)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1 active:scale-[0.98]',
              active
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Brand({ user }: { user: CurrentUser }) {
  return (
    <div className="space-y-1 border-b border-slate-800 px-5 py-5">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <CreditCard className="size-5" aria-hidden="true" />
        {user.role === 'SUPER_ADMIN' ? 'Platform admin' : 'ID Cards'}
      </div>
      <p className="truncate text-xs text-slate-400">
        {user.role === 'SUPER_ADMIN'
          ? 'All colleges'
          : (user.college?.name ?? 'No college assigned')}
      </p>
    </div>
  )
}

/**
 * Chrome for both signed-in areas. The role and college it renders come from
 * the server-verified user passed in as a prop; hiding a link here is cosmetic
 * only, the route and the database do the enforcing.
 */
export function AppChrome({
  user,
  area,
  children,
}: {
  user: CurrentUser
  area: 'admin' | 'app'
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const areaHref = area === 'admin' ? '/admin' : '/app'

  const signOut = () => startTransition(() => void signOutAction())

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 z-40 hidden w-64 flex-col bg-slate-900 text-white md:flex">
        <Brand user={user} />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks user={user} areaHref={areaHref} />
        </div>
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 px-2 text-xs text-slate-500">
            {ROLE_LABEL[user.role] ?? user.role}
          </div>
          <button
            onClick={signOut}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-400 transition-all duration-200 ease-out hover:translate-x-1 active:scale-[0.98] hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="size-5 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Sheet key={pathname}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'md:hidden'
              )}
            >
              <span className="sr-only">Open menu</span>
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex flex-col w-72 gap-0 bg-slate-900 p-0 text-white"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Brand user={user} />
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks user={user} areaHref={areaHref} />
              </div>
              <div className="border-t border-slate-800 p-3">
                <div className="mb-2 px-2 text-xs text-slate-500">
                  {ROLE_LABEL[user.role] ?? user.role}
                </div>
                <button
                  onClick={signOut}
                  disabled={isPending}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-400 transition-all duration-200 ease-out hover:translate-x-1 active:scale-[0.98] hover:bg-slate-800/60 hover:text-white"
                >
                  <LogOut className="size-5 shrink-0" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'gap-2 px-2 font-semibold'
              )}
            >
              <span className="sr-only">Open account menu</span>
              <UserCircle2 className="size-6 text-muted-foreground" aria-hidden="true" />
              <span className="hidden max-w-40 truncate sm:inline">
                {user.name ?? user.email}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="space-y-0.5">
                  <span className="block truncate">{user.email}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} disabled={isPending}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
