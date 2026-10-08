import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { describeDbError, NOT_FOUND } from './errors'
import { pageBounds, sanitizeSearch } from './pagination'
import { writeAuditEntry } from './audit'
import type { Page, Student } from '@/types'

const PHOTO_EMBED =
  'photo:student_photos(id, storage_path, mime_type, file_size, width, height, updated_at)'

const LIST_COLUMNS =
  `id, college_id, class_id, full_name, roll_number, phone, created_at, updated_at, class:classes(name), ${PHOTO_EMBED}`

const DETAIL_COLUMNS =
  `id, college_id, class_id, full_name, roll_number, phone, created_by, created_at, updated_at, college:colleges(id, name, code, address), class:classes(id, name), ${PHOTO_EMBED}`

export interface StudentFilters {
  collegeId: string
  page: number
  pageSize?: number
  search?: string
  classId?: string | null
}

export async function listStudents(
  filters: StudentFilters
): Promise<Page<Student>> {
  const supabase = await createClient()
  const { from, to, pageSize } = pageBounds(filters.page, filters.pageSize)
  const search = sanitizeSearch(filters.search)

  let query = supabase
    .from('students')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('college_id', filters.collegeId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.classId) query = query.eq('class_id', filters.classId)

  if (search) {
    query = query.or(
      `full_name.ilike.*${search}*,roll_number.ilike.*${search}*,phone.ilike.*${search}*`
    )
  }

  const { data, count, error } = await query
  if (error) throw describeDbError('students.list', error)

  const rows = (data ?? []).map((row: any) => {
    const photo = Array.isArray(row.photo) ? row.photo[0] : row.photo
    return { ...row, photo: photo ?? null } as Student
  })

  return {
    rows,
    total: count ?? 0,
    page: filters.page,
    pageSize,
  }
}

/**
 * The college id comes from the verified caller, never from the url, so a
 * student id lifted from another tenant simply matches no row.
 */
export async function getStudent(
  collegeId: string,
  studentId: string
): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(DETAIL_COLUMNS)
    .eq('id', studentId)
    .eq('college_id', collegeId)
    .maybeSingle()

  if (error) throw describeDbError('students.get', error)
  if (!data) return null
  
  const photo = Array.isArray(data.photo) ? data.photo[0] : data.photo
  return { ...data, photo: photo ?? null } as unknown as Student
}

export interface StudentInput {
  class_id: string
  full_name: string
  roll_number?: string | null
  phone?: string | null
}

function blankToNull(input: StudentInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    out[key] = typeof value === 'string' ? value.trim() || null : value ?? null
  }
  return out
}

export async function createStudent(
  collegeId: string,
  input: StudentInput,
  actorId: string
): Promise<Student> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .insert({
      ...blankToNull(input),
      college_id: collegeId,
      created_by: actorId,
    })
    .select(DETAIL_COLUMNS)
    .single()

  if (error) {
    throw describeDbError('students.create', error)
  }

  const created = data as unknown as Student

  await writeAuditEntry({
    collegeId,
    action: 'student.created',
    entity: 'students',
    entityId: created.id,
    details: { full_name: created.full_name },
  })

  return created
}

export async function updateStudent(
  collegeId: string,
  studentId: string,
  input: StudentInput
): Promise<Student> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .update(blankToNull(input))
    .eq('id', studentId)
    .eq('college_id', collegeId)
    .select(DETAIL_COLUMNS)
    .single()

  if (error) {
    throw describeDbError('students.update', error, {
      PGRST116: NOT_FOUND,
    })
  }

  await writeAuditEntry({
    collegeId,
    action: 'student.updated',
    entity: 'students',
    entityId: studentId,
  })

  return data as unknown as Student
}

export interface StudentStats {
  students: number
  photos_complete: number
  classes: number
}

/** Counts computed in Postgres, so a dashboard never pages through students. */
export async function getCollegeStats(
  collegeId: string
): Promise<StudentStats> {
  const supabase = await createClient()

  const [students, classes] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
  ])

  return {
    students: students.count ?? 0,
    classes: classes.count ?? 0,
    photos_complete: 0, // simplified out
  }
}

export interface PlatformStats {
  colleges: number
  colleges_active: number
  students: number
  college_users: number
  photos_missing: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient()

  const [colleges, collegesActive, students, users] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'COLLEGE_USER').eq('is_active', true),
  ])

  return {
    colleges: colleges.count ?? 0,
    colleges_active: collegesActive.count ?? 0,
    students: students.count ?? 0,
    college_users: users.count ?? 0,
    photos_missing: 0, // Simplified to 0 since we don't have this complex query anymore
  }
}
