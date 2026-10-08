import 'server-only'

/**
 * Postgres/PostgREST details stay in the server log; users get a sentence they
 * can act on. Never return error.message straight to the screen, it leaks
 * schema and policy internals.
 */

interface DbError {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

export function logDbError(context: string, error: DbError | null): void {
  console.error(
    `[db] ${context}: ${error?.code ?? 'unknown'} ${error?.message ?? ''}`.trim()
  )
}

export class ActionError extends Error {}

const FRIENDLY: Record<string, string> = {
  '23505': 'That record already exists. Check for a duplicate value.',
  '23503': 'The linked record could not be found. Please choose a valid option.',
  '23514': 'Some values do not fit together. Please check the details.',
  '22P02': 'One of the values is not valid.',
  '42501': 'You do not have permission to make that change.',
  '42505': 'You do not have permission to make that change.',
  PGRST116: 'That record could not be found.',
}

export function describeDbError(
  context: string,
  error: DbError | null,
  overrides: Partial<Record<string, string>> = {}
): ActionError {
  logDbError(context, error)
  const code = error?.code ?? ''
  return new ActionError(overrides[code] ?? FRIENDLY[code] ?? FALLBACK)
}

export const FALLBACK =
  'We could not save that right now. Please try again.'

export const NOT_FOUND = 'That record could not be found.'
