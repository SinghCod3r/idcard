import 'server-only'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ActionError, describeDbError, FALLBACK, NOT_FOUND } from './errors'
import { pageBounds, sanitizeSearch } from './pagination'
import { writeAuditEntry } from './audit'
import type { Page } from '@/types'

export interface CollegeUserRow {
  membership_id: string
  user_id: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
  membership_status: 'ACTIVE' | 'INACTIVE'
  college_id: string
  college_name: string
  college_code: string
  name: string | null
  email: string
  is_active: boolean
  created_at: string
}

const MEMBER_SELECT =
  'id, user_id, college_id, role, status, created_at, profile:profiles(id, name, email, is_active), college:colleges(id, name, code)'

interface MemberEmbed {
  id: string
  user_id: string
  college_id: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  profile: { id: string; name: string | null; email: string; is_active: boolean } | null
  college: { id: string; name: string; code: string } | null
}

function shape(rows: MemberEmbed[]): CollegeUserRow[] {
  return rows
    .filter((row) => row.profile && row.college)
    .map((row) => ({
      membership_id: row.id,
      user_id: row.user_id,
      role: row.role,
      membership_status: row.status,
      college_id: row.college_id,
      college_name: row.college!.name,
      college_code: row.college!.code,
      name: row.profile!.name,
      email: row.profile!.email,
      is_active: row.profile!.is_active,
      created_at: row.created_at,
    }))
}

export async function listCollegeUsers(options: {
  page: number
  pageSize?: number
  search?: string
  collegeId?: string | null
}): Promise<Page<CollegeUserRow>> {
  const supabase = await createClient()
  const { from, to, pageSize } = pageBounds(options.page, options.pageSize)
  const search = sanitizeSearch(options.search)

  let query = supabase
    .from('college_members')
    .select(MEMBER_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.collegeId) query = query.eq('college_id', options.collegeId)

  if (search) {
    const { data: matches, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.ilike.*${search}*,name.ilike.*${search}*`)
      .limit(500)

    if (searchError) throw describeDbError('members.search', searchError)

    const ids = (matches ?? []).map((row: { id: string }) => row.id)
    if (ids.length === 0) {
      return { rows: [], total: 0, page: options.page, pageSize }
    }
    query = query.in('user_id', ids)
  }

  const { data, count, error } = await query
  if (error) throw describeDbError('members.list', error)

  return {
    rows: shape((data ?? []) as unknown as MemberEmbed[]),
    total: count ?? 0,
    page: options.page,
    pageSize,
  }
}

export interface CreateUserInput {
  email: string
  name: string
  password?: string
  collegeId: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
}

export async function createCollegeUser(
  input: CreateUserInput
): Promise<{ userId: string; alreadyExisted: boolean }> {
  const admin = await createAdminClient()

  const normalizedEmail = input.email.trim().toLowerCase()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  let userId = existing?.id ?? null
  let alreadyExisted = !!userId

  if (!userId) {
    if (!input.password) {
      throw new ActionError('A password is required for new users.')
    }
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name.trim() }
      })

    if (createError) {
      console.error('[users] create failed', createError.status ?? createError.name)
      throw new ActionError(
        createError.message || 'We could not create the account. Please check the email address and try again.'
      )
    }

    userId = created.user?.id ?? null
  }

  if (!userId) throw new ActionError(FALLBACK)

  const { error: memberError } = await admin
    .from('college_members')
    .insert({
      college_id: input.collegeId,
      user_id: userId,
      role: input.role,
      status: 'ACTIVE',
    })

  if (memberError) {
    if (memberError.code === '23505') {
      throw new ActionError(
        'This person already belongs to a college. Use Change college instead.'
      )
    }
    throw describeDbError('members.invite', memberError)
  }

  if (existing) {
    await admin.from('profiles').update({ name: input.name.trim() }).eq('id', userId)
  }

  return { userId, alreadyExisted: Boolean(existing) }
}

export async function changeUserCollege(
  membershipId: string,
  collegeId: string
): Promise<void> {
  const supabase = await createClient()

  const before = await supabase
    .from('college_members')
    .select('college_id, role')
    .eq('id', membershipId)
    .maybeSingle()

  if (!before.data) throw new ActionError(NOT_FOUND)

  const { error } = await supabase
    .from('college_members')
    .update({ college_id: collegeId })
    .eq('id', membershipId)

  if (error) {
    throw describeDbError('members.changeCollege', error, {
      '23505': 'This person already has an active place in another college.',
    })
  }

  await writeAuditEntry({
    collegeId,
    action: 'user.college_changed',
    entity: 'college_members',
    entityId: membershipId,
    details: { from: before.data.college_id, to: collegeId },
  })
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
  collegeId: string | null
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) throw describeDbError('members.setActive', error)

  await writeAuditEntry({
    collegeId,
    action: isActive ? 'user.activated' : 'user.deactivated',
    entity: 'profiles',
    entityId: userId,
  })
}

export async function updateOwnName(userId: string, name: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ name: name.trim() })
    .eq('id', userId)

  if (error) throw describeDbError('profile.updateName', error)
}
