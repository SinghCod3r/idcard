'use client'

import { useEffect, useState } from 'react'
import { PlusSquare, Share2, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IOSInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Smartphone className="size-6" />
          </div>
          <div>
            <h3 id="ios-install-title" className="font-semibold text-lg leading-tight">
              Install on iOS
            </h3>
            <p className="text-xs text-slate-400">Install ID Card Manager to your Home Screen</p>
          </div>
        </div>

        <div className="space-y-3.5 my-5 text-sm text-slate-300">
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-400 font-semibold text-xs">
              1
            </div>
            <div className="leading-snug">
              <span>Tap the </span>
              <strong className="text-white inline-flex items-center gap-1 font-semibold">
                Share <Share2 className="inline size-3.5 text-blue-400" />
              </strong>
              <span> button in Safari&apos;s toolbar.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-400 font-semibold text-xs">
              2
            </div>
            <div className="leading-snug">
              <span>Scroll down and tap </span>
              <strong className="text-white inline-flex items-center gap-1 font-semibold">
                Add to Home Screen <PlusSquare className="inline size-3.5 text-blue-400" />
              </strong>
              <span>.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-400 font-semibold text-xs">
              3
            </div>
            <div className="leading-snug">
              <span>Tap </span>
              <strong className="text-white font-semibold">Add</strong>
              <span> in the top-right corner to finish installing.</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2.5 transition-all"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
