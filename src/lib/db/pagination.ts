import 'server-only'

export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export function pageBounds(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE)
  return { from: (page - 1) * size, to: page * size - 1, pageSize: size }
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * PostgREST treats , ( ) and * inside an `or=(...)` filter as structure, so
 * search text is stripped of them before it reaches one.
 */
export function sanitizeSearch(raw: string | string[] | undefined): string {
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? ''
  return value.replace(/[,*()]/g, '').trim().slice(0, 80)
}

export interface SearchParams {
  page?: string | string[]
  q?: string | string[]
}
