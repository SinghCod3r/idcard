import { requireSuperAdmin } from '@/lib/authz/guards'
import { AppChrome } from '@/components/layout/app-chrome'

export const metadata = { title: 'Platform admin' }

/**
 * The chrome needs the signed-in user, so this layout authorizes too. It is not
 * the enforcement point: layouts are not re-rendered on every client
 * navigation, which is why each page under /admin calls requireSuperAdmin()
 * itself.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireSuperAdmin()

  return (
    <AppChrome user={user} area="admin">
      {children}
    </AppChrome>
  )
}
