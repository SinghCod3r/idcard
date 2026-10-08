import 'server-only'

import { unstable_rethrow } from 'next/navigation'
import { ActionError, FALLBACK } from '@/lib/db/errors'
import type { ActionState } from './state'

/**
 * Wraps a mutation so a Server Action returns form state instead of throwing.
 *
 * Framework control-flow errors (redirect, notFound) are re-thrown: a guard
 * that rejected this caller must keep navigating, not be reported as a form
 * error. Only `ActionError` messages reach the user, because those are the
 * sentences the data layer wrote for humans; any other failure could disclose
 * schema or policy internals, so it is logged server-side and answered with a
 * generic line.
 */
export async function runAction(
  label: string,
  run: () => Promise<ActionState | void>
): Promise<ActionState> {
  try {
    return (await run()) ?? { ok: true }
  } catch (err) {
    unstable_rethrow(err)
    if (err instanceof ActionError) return { error: err.message }
    console.error(`[action] ${label}`, err)
    return { error: FALLBACK }
  }
}
