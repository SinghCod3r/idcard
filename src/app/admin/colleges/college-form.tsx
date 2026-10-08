'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  FormAlerts,
  TextareaField,
  TextField,
} from '@/components/forms/fields'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'
import type { College } from '@/types'
import { toast } from '@/components/ui/toast'

/**
 * One form for creating and editing. The Server Action is passed in by the
 * page, so this component never decides which mutation runs.
 */
export function CollegeForm({
  action,
  college,
  submitLabel,
  cancelHref,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  college?: College
  submitLabel: string
  cancelHref: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE)

  useEffect(() => {
    if (state.message) {
      toast.add({
        title: "Success",
        description: state.message,
        type: "success"
      })
    } else if (state.error) {
      toast.add({
        title: "Error",
        description: state.error,
        type: "error"
      })
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <FormAlerts state={state} />

      {college && <input type="hidden" name="id" value={college.id} />}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="name"
          label="College name"
          required
          defaultValue={college?.name}
          placeholder="Amrit Campus"
          autoComplete="off"
          disabled={isPending}
          error={state.fieldErrors?.name}
        />
        <TextField
          name="code"
          label="College code"
          defaultValue={college?.code}
          placeholder="ABC"
          autoComplete="off"
          disabled={isPending}
          error={state.fieldErrors?.code}
          hint={
            college
              ? 'Changing the code affects printing references.'
              : 'Leave blank and one is generated from the name.'
          }
        />
        <TextField
          name="contact_name"
          label="Contact person"
          defaultValue={college?.contact_name ?? undefined}
          autoComplete="off"
          disabled={isPending}
          error={state.fieldErrors?.contact_name}
        />
        <TextField
          name="contact_email"
          label="Contact email"
          type="email"
          defaultValue={college?.contact_email ?? undefined}
          autoComplete="off"
          disabled={isPending}
          error={state.fieldErrors?.contact_email}
        />
        <TextField
          name="phone"
          label="Phone"
          type="tel"
          defaultValue={college?.phone ?? undefined}
          autoComplete="tel"
          disabled={isPending}
          error={state.fieldErrors?.phone}
        />
      </div>

      <TextareaField
        name="address"
        label="Address"
        rows={3}
        defaultValue={college?.address ?? undefined}
        error={state.fieldErrors?.address}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
        <Link href={cancelHref} className="text-sm underline-offset-4 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
