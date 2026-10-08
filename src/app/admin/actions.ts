'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as z from 'zod'

import { requireSuperAdmin } from '@/lib/authz/guards'
import {
  createCollege,
  setCollegeStatus,
  updateCollege,
} from '@/lib/db/colleges'
import {
  changeUserCollege,
  createCollegeUser,
  setUserActive,
} from '@/lib/db/members'
import { writeAuditEntry } from '@/lib/db/audit'
import { runAction } from '@/lib/forms/run'
import {
  optionalTrimmed,
  toFieldErrors,
  trimmed,
  type ActionState,
} from '@/lib/forms/state'
import { inviteRedirect } from '@/lib/site'
import { NOT_FOUND } from '@/lib/db/errors'

/**
 * Every action here re-checks the caller on the server. The /admin routes are
 * also guarded, and Row Level Security still decides what the request can
 * reach, so a direct POST to this module cannot act as a Super Admin.
 */

const blankToUndefined = (value: unknown) =>
  value === '' || value === undefined ? undefined : value

const optionalText = (max: number, label: string) =>
  z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, { error: `${label} is too long.` })
  )

const optionalEmail = z.preprocess(
  blankToUndefined,
  z.email({ error: 'Enter a valid email address.' })
)

// All ids in this file are uuids; a malformed one is treated as "not found".
const uuidSchema = z.uuid({ error: NOT_FOUND })

const collegeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Enter the college name.' })
    .max(120, { error: 'The college name is too long.' }),
  code: optionalText(24, 'Code'),
  contact_name: optionalText(120, 'Contact name'),
  contact_email: optionalEmail,
  phone: optionalText(32, 'Phone number'),
  address: optionalText(400, 'Address'),
})

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'], {
  error: 'Choose active or inactive.',
})

/**
 * The only roles a platform operator can hand out. SUPER_ADMIN is deliberately
 * absent, so no form or crafted POST body can promote an account through this
 * path; the database trigger enforces the same rule.
 */
function readCollege(formData: FormData) {
  return {
    name: trimmed(formData, 'name'),
    code: optionalTrimmed(formData, 'code') ?? '',
    contact_name: optionalTrimmed(formData, 'contact_name') ?? '',
    contact_email: optionalTrimmed(formData, 'contact_email') ?? '',
    phone: optionalTrimmed(formData, 'phone') ?? '',
    address: optionalTrimmed(formData, 'address') ?? '',
  }
}

export async function createCollegeAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('colleges.create', async () => {
    const actor = await requireSuperAdmin()

    const parsed = collegeSchema.safeParse(readCollege(formData))
    if (!parsed.success) return toFieldErrors(parsed.error)

    const college = await createCollege(parsed.data, actor)

    revalidatePath('/admin/colleges')
    redirect(`/admin/colleges/${college.id}?added=1`)
  })
}

export async function updateCollegeAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('colleges.update', async () => {
    await requireSuperAdmin()

    const id = trimmed(formData, 'id')
    const parsed = collegeSchema.safeParse(readCollege(formData))
    if (!parsed.success) return toFieldErrors(parsed.error)

    const checkedId = uuidSchema.safeParse(id)
    if (!checkedId.success) return { error: NOT_FOUND }

    await updateCollege(checkedId.data, parsed.data)

    revalidatePath('/admin/colleges')
    revalidatePath(`/admin/colleges/${checkedId.data}`)
    return { message: 'College details saved.' }
  })
}

export async function setCollegeStatusAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('colleges.setStatus', async () => {
    await requireSuperAdmin()

    const id = uuidSchema.safeParse(trimmed(formData, 'id'))
    const status = statusSchema.safeParse(trimmed(formData, 'status'))
    if (!id.success || !status.success) return { error: NOT_FOUND }

    await setCollegeStatus(id.data, status.data)

    revalidatePath('/admin/colleges')
    revalidatePath(`/admin/colleges/${id.data}`)
    return {
      message:
        status.data === 'ACTIVE'
          ? 'College is active again. Its users can sign in.'
          : 'College deactivated. Its users lose access immediately.',
    }
  })
}

export async function createUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.create', async () => {
    const actor = await requireSuperAdmin()

    const parsed = z
      .object({
        email: z.email({ error: 'Enter a valid email address.' }),
        name: z
          .string()
          .trim()
          .min(2, { error: 'Enter the person’s name.' })
          .max(120, { error: 'The name is too long.' }),
        password: z
          .string()
          .min(6, { error: 'Password must be at least 6 characters.' }),
        college_id: uuidSchema,
        role: z.enum(['COLLEGE_ADMIN', 'COLLEGE_STAFF'])
      })
      .safeParse({
        email: trimmed(formData, 'email').toLowerCase(),
        name: trimmed(formData, 'name'),
        password: trimmed(formData, 'password'),
        college_id: trimmed(formData, 'college_id'),
        role: trimmed(formData, 'role') || 'COLLEGE_ADMIN'
      })

    if (!parsed.success) return toFieldErrors(parsed.error)

    const { email, name, password, college_id, role } = parsed.data

    const { alreadyExisted } = await createCollegeUser({
      email, name, password, collegeId: college_id, role
    })

    await writeAuditEntry({
      collegeId: college_id,
      action: alreadyExisted ? 'user.reused' : 'user.created',
      entity: 'college_members',
      entityId: null,
      details: { role },
    })

    revalidatePath('/admin/users')
    return {
      message: alreadyExisted
        ? 'That account already existed, so the college access was added. They can sign in with their existing password.'
        : 'User account created successfully.',
    }
  })
}

export async function changeUserCollegeAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.changeCollege', async () => {
    await requireSuperAdmin()

    const parsed = z
      .object({
        membership_id: uuidSchema,
        college_id: uuidSchema,
      })
      .safeParse({
        membership_id: trimmed(formData, 'membership_id'),
        college_id: trimmed(formData, 'college_id'),
      })

    if (!parsed.success) return { error: NOT_FOUND }

    await changeUserCollege(parsed.data.membership_id, parsed.data.college_id)

    revalidatePath('/admin/users')
    return { message: 'College updated for that user.' }
  })
}

export async function setUserActiveAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.setActive', async () => {
    const actor = await requireSuperAdmin()

    const parsed = z
      .object({
        user_id: uuidSchema,
        active: z.enum(['1', '0']),
        college_id: z.preprocess(blankToUndefined, uuidSchema),
      })
      .safeParse({
        user_id: trimmed(formData, 'user_id'),
        active: trimmed(formData, 'active'),
        college_id: optionalTrimmed(formData, 'college_id'),
      })

    if (!parsed.success) return { error: NOT_FOUND }

    if (parsed.data.user_id === actor.id) {
      return { error: 'You cannot deactivate your own account.' }
    }

    const active = parsed.data.active === '1'
    await setUserActive(parsed.data.user_id, active, parsed.data.college_id ?? null)

    revalidatePath('/admin/users')
    return {
      message: active
        ? 'Account restored. The person can sign in again.'
        : 'Account deactivated. Existing sessions are cut off at the next request.',
    }
  })
}

export async function updateUserPasswordAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.updatePassword', async () => {
    await requireSuperAdmin()

    const parsed = z
      .object({
        user_id: uuidSchema,
        password: z.string().min(6, { error: 'Password must be at least 6 characters.' }),
      })
      .safeParse({
        user_id: trimmed(formData, 'user_id'),
        password: trimmed(formData, 'password'),
      })

    if (!parsed.success) return toFieldErrors(parsed.error)

    const { user_id, password } = parsed.data
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = await createAdminClient()

    const { error } = await admin.auth.admin.updateUserById(user_id, {
      password
    })

    if (error) {
      console.error('[users] update password failed', error)
      return { error: 'Failed to update password.' }
    }

    revalidatePath('/admin/users')
    return { message: 'Password updated successfully.' }
  })
}
