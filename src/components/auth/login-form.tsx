'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signInAction } from '@/lib/auth/actions'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'

const initialState: ActionState = EMPTY_STATE

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState)

  return (
    <div className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

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
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          {state.fieldErrors?.password && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
    </div>
  )
}
