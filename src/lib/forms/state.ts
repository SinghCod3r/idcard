import type { ZodError } from 'zod'

/**
 * Shape every Server Action in the app returns so forms can render one error
 * line plus per-field messages. Modelled as a value, never as a thrown error:
 * expected failures should not reach an error boundary.
 */
export interface ActionState {
  ok?: boolean
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
}

export const EMPTY_STATE: ActionState = {}

/** First message per field, so a form can label inputs without leaking internals. */
export function toFieldErrors(error: ZodError): ActionState {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return { fieldErrors, error: error.issues[0]?.message ?? 'Please check the details.' }
}

export function trimmed(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

export function optionalTrimmed(formData: FormData, key: string): string | null {
  const value = trimmed(formData, key)
  return value === '' ? null : value
}

export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
