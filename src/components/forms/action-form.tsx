'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'

/**
 * A single-click mutation: hidden fields plus a submit button, no client state.
 * The action itself re-checks authorization on the server.
 */
export function ActionForm({
  action,
  fields,
  label,
  variant = 'outline',
  size = 'sm',
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  fields: Record<string, string>
  label: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}) {
  const [state, submit, isPending] = useActionState(action, EMPTY_STATE)

  return (
    <form
      action={submit}
      className="inline-flex flex-wrap items-center gap-2"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant={variant} size={size} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {label}
      </Button>
      {state.error && (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
