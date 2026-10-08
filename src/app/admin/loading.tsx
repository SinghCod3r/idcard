import { CreditCard } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
        <CreditCard className="size-8 text-primary animate-pulse" />
        <div className="absolute inset-0 rounded-xl border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-xl border-t-2 border-primary animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  )
}
