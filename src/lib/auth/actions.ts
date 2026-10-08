'use server'

import { redirect } from 'next/navigation'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, homeFor } from './session'
import { safeRedirectTarget } from './redirect'
import { siteOrigin } from '@/lib/site'
import { toFieldErrors, trimmed, type ActionState } from '@/lib/forms/state'

const credentialsSchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }),
  password: z.string().min(1, { error: 'Enter your password.' }),
})

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: 'Use at least 8 characters.' })
      .regex(/[A-Za-z]/, { error: 'Include at least one letter.' })
      .regex(/[0-9]/, { error: 'Include at least one number.' }),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'],
  })

export async function signInAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: trimmed(formData, 'email').toLowerCase(),
    // Passwords are used exactly as typed, never trimmed.
    password: String(formData.get('password') ?? ''),
  })

  if (!parsed.success) return toFieldErrors(parsed.error)

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    console.error('[auth] sign-in rejected', error.status ?? error.name)
    // Same wording for wrong password, unknown account, and unconfirmed
    // address: nothing here should let anyone probe which emails are registered.
    return { error: 'We could not sign you in with those details.' }
  }

  const user = await getCurrentUser()
  if (!user) return { error: 'We could not sign you in with those details.' }
  if (user.role === 'UNASSIGNED') redirect('/no-college')

  redirect(safeRedirectTarget(formData.get('next') as string) || homeFor(user))
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestResetAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const parsed = z.email({ error: 'Enter a valid email address.' }).safeParse(email)

  if (!parsed.success) return { error: 'Enter a valid email address.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent('/set-password')}`,
  })

  if (error) {
    console.error('[auth] reset request failed', error.message)
    return {
      message:
        'A reset link is on its way if that address has an account. It can take a minute.',
    }
  }

  return {
    message:
      'A reset link is on its way if that address has an account. It can take a minute.',
  }
}

export async function setPasswordAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  })

  if (!parsed.success) return toFieldErrors(parsed.error)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'We could not save that password. Please try again.' }
  }

  const current = await getCurrentUser()
  if (!current) redirect('/login')

  redirect(homeFor(current))
}
