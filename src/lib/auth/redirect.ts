/**
 * Only these in-app paths may be used as post-login or post-link targets, so a
 * crafted `next` parameter cannot bounce a signed-in user somewhere else.
 */
export function safeRedirectTarget(
  next: string | null | undefined
): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return ''
  return /^\/(admin|app|set-password|no-college)(\/|$)/.test(next) ? next : ''
}
