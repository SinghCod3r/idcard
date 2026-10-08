import * as z from 'zod'

import { firstParam } from './state'

/**
 * Query-string readers that treat every value as hostile input. A malformed or
 * hand-typed id is dropped rather than reaching a query, so a crafted url
 * changes what is filtered, never what is allowed.
 */
export function uuidParam(
  raw: string | string[] | undefined
): string | undefined {
  const value = firstParam(raw)
  return value && z.uuid().safeParse(value).success ? value : undefined
}

export function oneOfParam<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[]
): T | undefined {
  const value = firstParam(raw)
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}
