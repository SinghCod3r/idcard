import { requireCollegeMember } from '@/lib/authz/guards'
import { AppChrome } from '@/components/layout/app-chrome'

export const metadata = { title: 'ID Cards' }

/**
 * Renders the college chrome. It authorizes so a signed-out visitor never sees
 * the shell, but that is not the enforcement point: every page below calls its
 * own guard, because layouts are not re-run on every client navigation.
 */
export default async function CollegeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireCollegeMember()

  return (
    <AppChrome user={user} area="app">
      {children}
    </AppChrome>
  )
}
