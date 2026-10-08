'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as z from 'zod'

import { requireCollegeMember } from '@/lib/authz/guards'
import {
  createClass,
  deleteClass,
  updateClass,
} from '@/lib/db/academic'
import { updateOwnName } from '@/lib/db/members'
import {
  createStudent,
  updateStudent,
  type StudentInput,
} from '@/lib/db/students'
import { writeAuditEntry } from '@/lib/db/audit'
import { NOT_FOUND } from '@/lib/db/errors'
import { runAction } from '@/lib/forms/run'
import { optionalTrimmed, toFieldErrors, trimmed, type ActionState } from '@/lib/forms/state'

const uuidSchema = z.uuid({ error: NOT_FOUND })

const blankToUndefined = (value: unknown) =>
  value === '' || value === undefined ? undefined : value

const optionalText = (max: number, label: string) =>
  z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, { error: `${label} is too long.` }).optional()
  )

const studentSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { error: 'Enter the student’s name.' })
    .max(120, { error: 'The student’s name is too long.' }),
  class_id: z.uuid({ error: 'Choose the class.' }),
  roll_number: optionalText(64, 'Roll number'),
  phone: optionalText(32, 'Phone number'),
})

const STUDENT_FIELDS = [
  'full_name',
  'class_id',
  'roll_number',
  'phone',
] as const

function readStudentForm(formData: FormData) {
  return Object.fromEntries(
    STUDENT_FIELDS.map((key) => [key, trimmed(formData, key)])
  )
}

function toStudentInput(values: z.infer<typeof studentSchema>): StudentInput {
  return {
    class_id: values.class_id,
    full_name: values.full_name,
    roll_number: values.roll_number ?? null,
    phone: values.phone ?? null,
  }
}

export async function saveStudentAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('students.save', async () => {
    const { user, college } = await requireCollegeMember()

    const parsed = studentSchema.safeParse(readStudentForm(formData))
    if (!parsed.success) return toFieldErrors(parsed.error)

    const input = toStudentInput(parsed.data)
    const studentId = optionalTrimmed(formData, 'id')
    const photoFile = formData.get('photo') as File | null
    console.log('[DEBUG] photoFile received:', photoFile ? { name: photoFile.name, size: photoFile.size, type: photoFile.type } : null)

    let activeStudentId = studentId

    if (studentId) {
      const checked = uuidSchema.safeParse(studentId)
      if (!checked.success) return { error: NOT_FOUND }

      await updateStudent(college.id, checked.data, input)
      activeStudentId = checked.data
    } else {
      const student = await createStudent(college.id, input, user.id)
      activeStudentId = student.id
    }

    if (photoFile && photoFile.size > 0) {
      const { uploadStudentPhoto } = await import('@/lib/db/photos')
      await uploadStudentPhoto({
        collegeId: college.id,
        studentId: activeStudentId,
        file: photoFile,
      })
    }

    revalidatePath('/app/students')
    if (studentId) {
      revalidatePath(`/app/students/${activeStudentId}`)
      return { message: 'Student details saved.', ok: true }
    } else {
      redirect(`/app/students/${activeStudentId}?added=1`)
    }
  })
}

// ---------------------------------------------------------------- academic

const classSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Enter the class name.' })
    .max(64, { error: 'The class name is too long.' }),
  order_index: z.preprocess(
    (value) => (value === '' ? 0 : Number(value)),
    z.number({ error: 'The order must be a number.' }).int().min(0).max(999)
  ),
})

export async function saveClassAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('classes.save', async () => {
    const { college } = await requireCollegeMember()

    const parsed = classSchema.safeParse({
      name: trimmed(formData, 'name'),
      order_index: trimmed(formData, 'order_index'),
    })
    if (!parsed.success) return toFieldErrors(parsed.error)

    const classId = optionalTrimmed(formData, 'id')

    if (classId) {
      const checked = uuidSchema.safeParse(classId)
      if (!checked.success) return { error: NOT_FOUND }

      await updateClass(college.id, checked.data, parsed.data)
      await writeAuditEntry({
        collegeId: college.id,
        action: 'class.updated',
        entity: 'classes',
        entityId: checked.data,
      })
      revalidatePath('/app/classes')
      return { message: 'Class saved.', ok: true }
    }

    await createClass(college.id, parsed.data)
    await writeAuditEntry({
      collegeId: college.id,
      action: 'class.created',
      entity: 'classes',
      entityId: null,
      details: { name: parsed.data.name },
    })

    revalidatePath('/app/classes')
    return { message: 'Class added.', ok: true }
  })
}

export async function deleteClassAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('classes.delete', async () => {
    const { college } = await requireCollegeMember()

    const classId = uuidSchema.safeParse(trimmed(formData, 'id'))
    if (!classId.success) return { error: NOT_FOUND }

    await deleteClass(college.id, classId.data)
    await writeAuditEntry({
      collegeId: college.id,
      action: 'class.deleted',
      entity: 'classes',
      entityId: classId.data,
    })

    revalidatePath('/app/classes')
    return { message: 'Class deleted.', ok: true }
  })
}

// ------------------------------------------------------------------ profile

export async function updateOwnProfileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('profile.update', async () => {
    const { user } = await requireCollegeMember()

    const parsed = z
      .object({
        name: z
          .string()
          .trim()
          .min(2, { error: 'Enter your name.' })
          .max(120, { error: 'Your name is too long.' }),
      })
      .safeParse({ name: trimmed(formData, 'name') })

    if (!parsed.success) return toFieldErrors(parsed.error)

    await updateOwnName(user.id, parsed.data.name)

    revalidatePath('/app/settings')
    return { message: 'Your name is updated.', ok: true }
  })
}
