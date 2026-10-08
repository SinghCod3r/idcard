export function siteOrigin(): string {
  // Set NEXT_PUBLIC_SITE_URL in production so invitation and reset emails point
  // at the real host instead of localhost.
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

/** Where Supabase should land a recipient who accepts an invitation. */
export function inviteRedirect(): string {
  return `${siteOrigin()}/auth/confirm?next=${encodeURIComponent('/set-password')}`
}
