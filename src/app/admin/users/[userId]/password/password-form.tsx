'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  FormAlerts,
  TextField,
} from '@/components/forms/fields'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'
import { toast } from '@/components/ui/toast'

export function PasswordForm({
  action,
  userId,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  userId: string
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
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <FormAlerts state={state} />
        
        <input type="hidden" name="user_id" value={userId} />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="password"
            label="New Password"
            type="text"
            required
            autoComplete="off"
            disabled={isPending}
            error={state.fieldErrors?.password}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save password
          </Button>
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: 'ghost' })}
          >
            Back to users
          </Link>
        </div>
      </form>
    </div>
  )
}
