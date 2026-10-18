'use client'

import { CheckCircle2, Loader2, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePWAInstall } from '@/hooks/use-pwa-install'

interface DownloadAppButtonProps {
  onCloseSidebar?: () => void
  className?: string
}

export function DownloadAppButton({ onCloseSidebar, className }: DownloadAppButtonProps) {
  const {
    isStandalone,
    isInstalled,
    installState,
    promptInstall,
  } = usePWAInstall()

  // 1. If running inside standalone PWA mode or already installed
  if (isStandalone || isInstalled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 select-none',
          className
        )}
      >
        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>✓ App Installed</span>
      </div>
    )
  }

  // 2. If actively installing
  if (installState === 'installing') {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 bg-slate-800/40 cursor-wait',
          className
        )}
      >
        <Loader2 className="size-5 shrink-0 animate-spin text-blue-400" aria-hidden="true" />
        <span>Installing...</span>
      </button>
    )
  }

  // 3. Regular installable / fallback state
  const handleClick = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted' || outcome === 'instructions_shown') {
      onCloseSidebar?.()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 ease-out hover:translate-x-1 active:scale-[0.98] hover:bg-slate-800 hover:text-white cursor-pointer group text-left',
        className
      )}
      aria-label="Download and install application"
    >
      <Smartphone
        className="size-5 shrink-0 text-blue-400 group-hover:scale-110 transition-transform duration-200"
        aria-hidden="true"
      />
      <span className="flex-1 font-medium">📱 Download App</span>
    </button>
  )
}
