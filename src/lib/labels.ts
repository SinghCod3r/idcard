import type { EffectiveRole } from '@/types'

/** Human copy shared by server and client components. */

export const ROLE_LABEL: Record<EffectiveRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  COLLEGE_ADMIN: 'College Admin',
  COLLEGE_STAFF: 'College Staff',
  UNASSIGNED: 'No college yet',
}

export const COLLEGE_STATUS_LABEL = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const

/**
 * Audit rows store machine actions. Rendered as a sentence so the activity log
 * reads like one, and an unmapped action still shows something useful.
 */
const ACTIONS: Record<string, string> = {
  'college.created': 'College created',
  'college.updated': 'College details updated',
  'college.status_changed': 'College status changed',
  'college.activated': 'College activated',
  'college.deactivated': 'College deactivated',
  'user.invited': 'User invited',
  'user.reused': 'Existing account given college access',
  'user.college_changed': 'User moved to another college',
  'user.activated': 'User activated',
  'user.deactivated': 'User deactivated',
  'student.created': 'Student created',
  'student.updated': 'Student updated',
  'student.status_changed': 'Student review status changed',
  'student.card_status_changed': 'Card status changed',
  'student.archived': 'Student archived',
  'student.restored': 'Student restored',
  'student.photo_uploaded': 'Photo uploaded',
  'student.photo_deleted': 'Photo deleted',
  'staff.role_changed': 'Staff role changed',
  'staff.removed_from_roster': 'Staff removed from roster',
  'session.created': 'Academic session created',
  'session.updated': 'Academic session updated',
  'session.deleted': 'Academic session deleted',
  'class.created': 'Class created',
  'class.updated': 'Class updated',
  'class.deleted': 'Class deleted',
  'section.created': 'Section created',
  'section.deleted': 'Section deleted',
}

export function describeAction(action: string): string {
  return ACTIONS[action] ?? action.replace(/[_.]/g, ' ')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString()
}
