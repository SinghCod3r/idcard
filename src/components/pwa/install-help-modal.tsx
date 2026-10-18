'use client'

import { useEffect, useState } from 'react'
import { Download, Monitor, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstallHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InstallHelpModal({ isOpen, onClose }: InstallHelpModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl transition-all"
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
            <Download className="size-6" />
          </div>
          <div>
            <h3 id="install-help-title" className="font-semibold text-lg leading-tight">
              Install ID Card Manager
            </h3>
            <p className="text-xs text-slate-400">Install as a standalone Progressive Web App</p>
          </div>
        </div>

        <div className="space-y-3.5 my-5 text-sm text-slate-300">
          <div className="rounded-lg bg-slate-800/50 p-3.5 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 font-medium text-white">
              <Monitor className="size-4 text-blue-400" />
              <span>Desktop (Chrome, Edge, Brave)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the <strong className="text-white">Install icon</strong> in your browser&apos;s address bar (near the bookmark star), or click the browser menu (<strong className="text-white">⋮</strong>) and select <strong className="text-white">&ldquo;Install ID Card Manager&rdquo;</strong>.
            </p>
          </div>

          <div className="rounded-lg bg-slate-800/50 p-3.5 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 font-medium text-white">
              <Smartphone className="size-4 text-emerald-400" />
              <span>Mobile (Android / iPhone)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open this website on your phone. On Android, tap the three dots menu (<strong className="text-white">⋮</strong>) and choose <strong className="text-white">&ldquo;Install app&rdquo;</strong>. On iPhone, tap <strong className="text-white">Share</strong> then <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
            </p>
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

