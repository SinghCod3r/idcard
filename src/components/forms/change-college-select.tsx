'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'
import type { Option } from '@/components/forms/fields'

/**
 * Moves a user between colleges. Only reachable from /admin: the action behind
 * it calls requireSuperAdmin(), and a college user cannot reach it at all.
 */
export function ChangeCollegeSelect({
  action,
  membershipId,
  currentCollegeId,
  colleges,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  membershipId: string
  currentCollegeId: string
  colleges: Option[]
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE)

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="membership_id" value={membershipId} />
      <label className="sr-only" htmlFor={`college-${membershipId}`}>
        College for this user
      </label>
      <div className="flex items-center gap-2">
        <select
          id={`college-${membershipId}`}
          name="college_id"
          defaultValue={currentCollegeId}
          disabled={isPending}
          className="h-8 min-w-32 max-w-44 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {colleges.map((college) => (
            <option key={college.value} value={college.value}>
              {college.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Move
        </Button>
      </div>
      {state.error && (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="text-xs text-emerald-700" aria-live="polite">
          {state.message}
        </p>
      )}
    </form>
  )
}
