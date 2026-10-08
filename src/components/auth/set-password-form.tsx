'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { setPasswordAction } from '@/lib/auth/actions'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'

const initialState: ActionState = EMPTY_STATE

const RULES = [
  'At least 8 characters',
  'At least one letter',
  'At least one number',
]

export function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    setPasswordAction,
    initialState
  )

  return (
    <div className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
          <ul className="space-y-1 text-xs text-muted-foreground">
            {RULES.map((rule) => (
              <li key={rule}>- {rule}</li>
            ))}
          </ul>
          {state.fieldErrors?.password && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
          {state.fieldErrors?.confirm && (
            <p className="text-sm text-destructive">{state.fieldErrors.confirm}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Save password
        </Button>
      </form>
    </div>
  )
}
