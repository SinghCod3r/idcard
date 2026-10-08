import { redirect } from 'next/navigation'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'UNASSIGNED') redirect('/no-college')
  redirect(homeFor(user))
}
