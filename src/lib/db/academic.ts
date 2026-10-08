import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ActionError, describeDbError } from './errors'
import type { MyClass } from '@/types'

/**
 * Academic structure lives inside one college. Every call takes the college id
 * that the caller was verified against and pushes it into the query, so a
 * crafted class id from a form can never reach another tenant.
 */

export async function listClasses(
  collegeId: string,
): Promise<MyClass[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select('id, college_id, name, order_index, created_at, students(count)')
    .eq('college_id', collegeId)
    .order('order_index')
    .order('name')

  if (error) throw describeDbError('classes.list', error)

  return (data ?? []).map((row: any) => ({
    ...row,
    student_count: row.students[0]?.count ?? 0,
  })) as MyClass[]
}

export async function createClass(
  collegeId: string,
  input: { name: string; order_index?: number }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('classes').insert({
    college_id: collegeId,
    name: input.name.trim(),
    order_index: input.order_index ?? 0,
  })

  if (error) {
    throw describeDbError('classes.create', error, {
      '23505': 'This college already has a class with that name.',
    })
  }
}

export async function updateClass(
  collegeId: string,
  classId: string,
  input: { name: string; order_index?: number }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('classes')
    .update({ name: input.name.trim(), order_index: input.order_index ?? 0 })
    .eq('id', classId)
    .eq('college_id', collegeId)

  if (error) {
    throw describeDbError('classes.update', error, {
      '23505': 'This college already has a class with that name.',
    })
  }
}

export async function deleteClass(collegeId: string, classId: string) {
  const supabase = await createClient()

  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)

  if ((count ?? 0) > 0) {
    throw new ActionError('Students are already enrolled in this class.')
  }

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('college_id', collegeId)

  if (error) throw describeDbError('classes.delete', error)
}
