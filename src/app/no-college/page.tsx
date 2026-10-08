import type { Metadata } from 'next'

import { buttonVariants } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth/session'
import { signOutAction } from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Waiting for access | ID Card Platform' }

export default async function NoCollegePage() {
  const user = await requireAuth()

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          &#8987;
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your college has not been assigned yet
        </h1>
        <p className="text-sm text-muted-foreground">
          You are signed in as {user.email}. A platform owner needs to attach your
          account to a college before you can see any student records. Once they
          do, sign in again and your dashboard will open.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className={buttonVariants({ variant: 'outline' })}
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
