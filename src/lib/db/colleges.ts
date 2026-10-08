import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { describeDbError } from './errors'
import { pageBounds, sanitizeSearch } from './pagination'
import { writeAuditEntry } from './audit'
import type { College, CollegeStatus, Page } from '@/types'

export interface CollegeWithCounts extends College {
  student_count: number
}

const COLUMNS =
  'id, name, code, address, contact_name, contact_email, phone, status, created_at, updated_at'

export interface CollegeInput {
  name: string
  code?: string | null
  address?: string | null
  contact_name?: string | null
  contact_email?: string | null
  phone?: string | null
  status?: CollegeStatus
}

/** Colleges arrive with a short code when the operator does not supply one. */
function generateCollegeCode(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, '').split(/\s+/).filter(Boolean)
  const initials = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase()
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${initials || 'CLG'}-${suffix}`
}

function toCollegeCountsShape(row: Record<string, unknown>): CollegeWithCounts {
  const { students, ...college } = row
  const embed = students as Array<{ count: number }> | null
  return {
    ...(college as unknown as College),
    student_count: embed?.[0]?.count ?? 0,
  }
}

export async function listColleges(options: {
  page: number
  search?: string
  pageSize?: number
}): Promise<Page<CollegeWithCounts>> {
  const supabase = await createClient()
  const { from, to, pageSize } = pageBounds(options.page, options.pageSize)
  const search = sanitizeSearch(options.search)

  let query = supabase
    .from('colleges')
    .select(`${COLUMNS}, students(count)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(
      `name.ilike.*${search}*,code.ilike.*${search}*,contact_name.ilike.*${search}*`
    )
  }

  const { data, count, error } = await query
  if (error) throw describeDbError('colleges.list', error)

  return {
    rows: (data ?? []).map((row) => toCollegeCountsShape(row as unknown as Record<string, unknown>)),
    total: count ?? 0,
    page: options.page,
    pageSize,
  }
}

export async function getCollege(id: string): Promise<College | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('colleges')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw describeDbError('colleges.get', error)
  return data as College | null
}

export async function getCollegesForSelector(): Promise<
  Array<Pick<College, 'id' | 'name' | 'code'>>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, code')
    .eq('status', 'ACTIVE')
    .order('name')

  if (error) throw describeDbError('colleges.selector', error)
  return (data ?? []) as Array<Pick<College, 'id' | 'name' | 'code'>>
}

export async function createCollege(
  input: CollegeInput,
  actor: { id: string }
): Promise<College> {
  const supabase = await createClient()

  const code = (input.code?.trim() || generateCollegeCode(input.name)).toUpperCase()

  const { data, error } = await supabase
    .from('colleges')
    .insert({
      name: input.name.trim(),
      code,
      address: input.address?.trim() || null,
      contact_name: input.contact_name?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      phone: input.phone?.trim() || null,
      status: input.status ?? 'ACTIVE',
    })
    .select(COLUMNS)
    .single()

  if (error) {
    throw describeDbError('colleges.create', error, {
      '23505': 'That college code is already in use. Pick another one.',
    })
  }

  await writeAuditEntry({
    collegeId: data.id,
    action: 'college.created',
    entity: 'colleges',
    entityId: data.id,
    details: { name: data.name, code: data.code },
  })

  return data as College
}

export async function updateCollege(
  id: string,
  input: CollegeInput
): Promise<College> {
  const supabase = await createClient()

  const patch: Record<string, unknown> = {
    name: input.name.trim(),
    address: input.address?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    contact_email: input.contact_email?.trim() || null,
    phone: input.phone?.trim() || null,
  }

  if (input.code?.trim()) patch.code = input.code.trim().toUpperCase()
  if (input.status) patch.status = input.status

  const { data, error } = await supabase
    .from('colleges')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) {
    throw describeDbError('colleges.update', error, {
      '23505': 'That college code is already in use. Pick another one.',
    })
  }

  await writeAuditEntry({
    collegeId: id,
    action: input.status ? 'college.status_changed' : 'college.updated',
    entity: 'colleges',
    entityId: id,
    details: input.status ? { status: input.status } : {},
  })

  return data as College
}

export async function setCollegeStatus(
  id: string,
  status: CollegeStatus
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('colleges')
    .update({ status })
    .eq('id', id)

  if (error) throw describeDbError('colleges.setStatus', error)

  await writeAuditEntry({
    collegeId: id,
    action: status === 'ACTIVE' ? 'college.activated' : 'college.deactivated',
    entity: 'colleges',
    entityId: id,
  })
}
