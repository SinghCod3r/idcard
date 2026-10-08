import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="mt-2 text-muted-foreground">
        We couldn't find the page or resource you were looking for. 
        It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <div className="mt-8">
        <Link href="/app" className={buttonVariants()}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

