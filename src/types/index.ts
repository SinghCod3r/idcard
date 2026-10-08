export type GlobalRole = 'SUPER_ADMIN' | 'COLLEGE_USER'

/**
 * What the signed-in user is allowed to do. SUPER_ADMIN comes from profiles,
 * and COLLEGE_ADMIN/STAFF means they are assigned to a college.
 * UNASSIGNED means nobody has placed them in a college yet.
 */
export type EffectiveRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'COLLEGE_STAFF' | 'UNASSIGNED'

export type CollegeStatus = 'ACTIVE' | 'INACTIVE'

export interface Profile {
  id: string
  name: string | null
  email: string
  role: GlobalRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface College {
  id: string
  name: string
  code: string
  address: string | null
  contact_name: string | null
  contact_email: string | null
  phone: string | null
  status: CollegeStatus
  created_at: string
  updated_at: string
}

export interface CollegeMember {
  id: string
  college_id: string
  user_id: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  updated_at: string
  profile?: Pick<Profile, 'name' | 'email' | 'is_active'> | null
}

export interface MyClass {
  id: string
  college_id: string
  name: string
  order_index: number
  created_at: string
  student_count?: number
}

/** The student_photos fields every students query embeds. */
export interface StudentPhotoRef {
  id: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  width: number | null
  height: number | null
  updated_at: string
}

export interface Student {
  id: string
  college_id: string
  class_id: string
  full_name: string
  roll_number: string | null
  phone: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  college?: Pick<College, 'name'> | null
  class?: Pick<MyClass, 'name'> | null
  photo?: StudentPhotoRef | null
}

export interface StudentPhoto {
  id: string
  student_id: string
  college_id: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  actor_id: string
  college_id: string | null
  action: string
  entity: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface Page<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
}
