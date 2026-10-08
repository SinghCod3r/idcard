import type { EffectiveRole } from '@/types'

export interface NavItem {
  label: string
  href: string
  /** Only shown to these roles; the route itself is guarded on the server. */
  roles: EffectiveRole[]
}

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', roles: ['SUPER_ADMIN'] },
  { label: 'Colleges', href: '/admin/colleges', roles: ['SUPER_ADMIN'] },
  { label: 'Users', href: '/admin/users', roles: ['SUPER_ADMIN'] },
  { label: 'Students', href: '/admin/students', roles: ['SUPER_ADMIN'] },
]

export const COLLEGE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/app', roles: ['COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
  { label: 'Classes', href: '/app/classes', roles: ['COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
  { label: 'Students', href: '/app/students', roles: ['COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
  { label: 'Profile', href: '/app/settings', roles: ['COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
]

export function navFor(role: EffectiveRole): {
  area: 'admin' | 'app' | null
  items: NavItem[]
} {
  if (role === 'SUPER_ADMIN') return { area: 'admin', items: SUPER_ADMIN_NAV }
  if (role === 'UNASSIGNED') return { area: null, items: [] }
  return { area: 'app', items: COLLEGE_NAV.filter((item) => item.roles.includes(role)) }
}
