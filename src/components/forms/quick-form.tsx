'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FormAlerts,
  SelectField,
  TextField,
  TextareaField,
  type Option,
} from '@/components/forms/fields'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'
import { cn } from '@/lib/utils'

export type QuickField =
  | { kind: 'hidden'; name: string; value: string }
  | {
      kind: 'text'
      name: string
      label: string
      type?: string
      defaultValue?: string
      placeholder?: string
      required?: boolean
      hint?: string
    }
  | {
      kind: 'select'
      name: string
      label: string
      options: Option[]
      defaultValue?: string
      required?: boolean
      hint?: string
    }
  | {
      kind: 'textarea'
      name: string
      label: string
      defaultValue?: string
      placeholder?: string
      required?: boolean
      hint?: string
      rows?: number
    }
  | {
      kind: 'checkbox'
      name: string
      label: string
      defaultValue?: boolean
      hint?: string
    }
  | {
      kind: 'file'
      name: string
      label: string
      accept?: string
      required?: boolean
      hint?: string
    }

const COLUMNS = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

/**
 * The small add/edit form every management screen in the college area uses.
 * It submits through a Server Action, so the page itself stays a server
 * component and no list is ever held in client state.
 */
export function QuickForm({
  action,
  fields,
  submitLabel,
  columns = 2,
  variant = 'default',
  size = 'default',
  withAlerts = true,
  className,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  fields: QuickField[]
  submitLabel: string
  columns?: keyof typeof COLUMNS
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  /** Inline rows skip the block alert and show only the error line. */
  withAlerts?: boolean
  className?: string
}) {
  const [state, submit, isPending] = useActionState(action, EMPTY_STATE)

  const inputs = fields.filter((field) => field.kind !== 'hidden')
  const hidden = fields.filter((field) => field.kind === 'hidden')

  return (
    <form action={submit} className={cn('space-y-4', className)}>
      {hidden.map((field) => (
        <input
          key={field.name}
          type="hidden"
          name={field.name}
          value={field.value}
        />
      ))}

      {withAlerts && <FormAlerts state={state} />}

      <div className={cn('grid gap-4', COLUMNS[columns], inputs.length === 0 && 'hidden')}>
        {inputs.map((field) => {
          const error = withAlerts
            ? state.fieldErrors?.[field.name]
            : (state.error ?? state.fieldErrors?.[field.name])

          if (field.kind === 'select') {
            return (
              <SelectField
                key={field.name}
                name={field.name}
                label={field.label}
                options={field.options}
                defaultValue={field.defaultValue}
                required={field.required}
                hint={field.hint}
                error={error}
                disabled={isPending}
              />
            )
          }

          if (field.kind === 'textarea') {
            return (
              <TextareaField
                key={field.name}
                name={field.name}
                label={field.label}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                required={field.required}
                hint={field.hint}
                rows={field.rows}
                error={error}
              />
            )
          }

          if (field.kind === 'checkbox') {
            return (
              <Field
                key={field.name}
                id={field.name}
                label={field.label}
                error={error}
                hint={field.hint}
              >
                <label
                  htmlFor={field.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    defaultChecked={field.defaultValue}
                    className="size-4 rounded border-input accent-primary"
                  />
                  <span className="text-muted-foreground">
                    {field.hint ?? 'Leave unchecked to keep it off.'}
                  </span>
                </label>
              </Field>
            )
          }

          if (field.kind === 'file') {
            return (
              <Field
                key={field.name}
                id={field.name}
                label={field.label}
                error={error}
                hint={field.hint}
              >
                <input
                  id={field.name}
                  name={field.name}
                  type="file"
                  accept={field.accept}
                  required={field.required}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>
            )
          }

          return (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              required={field.required}
              hint={field.hint}
              error={error}
              disabled={isPending}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant={variant} size={size} disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
        {!withAlerts && state.message && (
          <span className="text-sm text-muted-foreground">{state.message}</span>
        )}
      </div>
    </form>
  )
}
