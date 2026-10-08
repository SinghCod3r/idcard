'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  FormAlerts,
  SelectField,
  TextField,
  type Option,
} from '@/components/forms/fields'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'

export function CreateForm({
  action,
  colleges,
  defaultCollegeId,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  colleges: Option[]
  defaultCollegeId?: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE)

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <FormAlerts state={state} />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="name"
            label="Full name"
            required
            autoComplete="off"
            disabled={isPending}
            error={state.fieldErrors?.name}
          />
          <TextField
            name="password"
            label="Initial Password"
            type="text"
            required
            autoComplete="off"
            disabled={isPending}
            error={state.fieldErrors?.password}
            hint="Set a password for the new user."
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            placeholder="person@college.edu"
            disabled={isPending}
            error={state.fieldErrors?.email}
            hint="This becomes their sign-in address."
          />
          <SelectField
            name="college_id"
            label="College"
            options={colleges}
            required
            defaultValue={defaultCollegeId}
            disabled={isPending}
            error={state.fieldErrors?.college_id}
          />
          <SelectField
            name="role"
            label="Role inside that college"
            required
            disabled={isPending}
            error={state.fieldErrors?.role}
            options={[
              { value: 'COLLEGE_STAFF', label: 'College Staff' },
              { value: 'COLLEGE_ADMIN', label: 'College Admin' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Create account
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
