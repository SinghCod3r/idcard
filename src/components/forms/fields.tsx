import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/forms/state'

const CONTROL =
  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30'

export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = {
  name: string
  label: string
  error?: string
  hint?: string
} & Pick<
  React.ComponentProps<'input'>,
  | 'type'
  | 'required'
  | 'defaultValue'
  | 'placeholder'
  | 'autoComplete'
  | 'autoCapitalize'
  | 'inputMode'
  | 'disabled'
>

export function TextField({
  name,
  label,
  error,
  hint,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  autoComplete,
  autoCapitalize,
  inputMode,
  disabled,
}: TextFieldProps) {
  return (
    <Field id={name} label={label} error={error} hint={hint} required={required}>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        inputMode={inputMode}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(CONTROL, 'h-9')}
      />
    </Field>
  )
}

export interface Option {
  value: string
  label: string
}

/**
 * A native select rather than the Radix/Base UI one: these forms submit with a
 * plain GET or a Server Action, so they must work before hydration and keep
 * progressive enhancement, which the menu-primitive select cannot.
 */
export function SelectField({
  name,
  label,
  options,
  error,
  hint,
  required,
  defaultValue,
  disabled,
  onChange,
}: {
  name: string
  label: string
  options: Option[]
  error?: string
  hint?: string
  required?: boolean
  defaultValue?: string
  disabled?: boolean
  onChange?: React.ComponentProps<'select'>['onChange']
}) {
  return (
    <Field id={name} label={label} error={error} hint={hint} required={required}>
      <select
        id={name}
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? options[0]?.value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={cn(CONTROL, 'h-9 pr-8')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function TextareaField({
  name,
  label,
  error,
  hint,
  rows = 3,
  required,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  error?: string
  hint?: string
  rows?: number
  required?: boolean
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <Field id={name} label={label} error={error} hint={hint} required={required}>
      <Textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        className={CONTROL}
      />
    </Field>
  )
}

/** One place that renders action feedback, so no form shows a raw error. */
export function FormAlerts({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }
  if (state.message) {
    return (
      <Alert>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }
  return null
}
