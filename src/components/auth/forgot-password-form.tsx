'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestResetAction } from '@/lib/auth/actions'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'

const initialState: ActionState = EMPTY_STATE

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestResetAction,
    initialState
  )

  if (state.message) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border bg-muted/40 p-3 text-sm">
          {state.message}
        </p>
        <Link
          href="/login"
          className={buttonVariants({ variant: 'outline', className: 'w-full' })}
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@college.edu"
          required
          disabled={isPending}
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
