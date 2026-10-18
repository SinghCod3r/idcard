'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  PWAContext,
  type InstallOutcome,
  type PWAContextValue,
} from '@/hooks/use-pwa-install'
import { IOSInstallModal } from '@/components/pwa/ios-install-modal'
import { InstallHelpModal } from '@/components/pwa/install-help-modal'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Module-level persistent cache for deferred prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null

// Attach module-level listener immediately when script executes in the browser
if (typeof window !== 'undefined') {
  const win = window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }
  if (win.__deferredPrompt) {
    globalDeferredPrompt = win.__deferredPrompt
    console.log('[PWA] beforeinstallprompt fired')
    console.log('[PWA] install prompt available:', true)
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    const promptEvent = e as BeforeInstallPromptEvent
    globalDeferredPrompt = promptEvent
    ;(window as unknown as { __deferredPrompt: BeforeInstallPromptEvent }).__deferredPrompt = promptEvent
    console.log('[PWA] beforeinstallprompt fired')
    console.log('[PWA] install prompt available:', true)
    window.dispatchEvent(new Event('pwa-prompt-ready'))
  })

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null
    ;(window as unknown as { __deferredPrompt: null }).__deferredPrompt = null
    console.log('[PWA] app installed')
    window.dispatchEvent(new Event('pwa-installed'))
  })
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }
      return globalDeferredPrompt || win.__deferredPrompt || null
    }
    return null
  })

  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isPromptReady, setIsPromptReady] = useState(false)
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'installed'>('idle')
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Initialize checks on client mount
  useEffect(() => {
    // 1. Check if running in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    setIsStandalone(isStandaloneMode)
    if (isStandaloneMode) {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallState('installed')
    }

    // Listen for display mode change
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true)
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallState('installed')
      }
    }
    mediaQuery.addEventListener?.('change', handleMediaChange)

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setIsIOS(isIOSDevice)

    if (isIOSDevice && !isStandaloneMode) {
      setIsInstallable(true)
    }

    // 3. Synchronize prompt state from global/window store
    const syncPromptState = () => {
      const win = window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }
      const prompt = globalDeferredPrompt || win.__deferredPrompt || null
      if (prompt) {
        setDeferredPrompt(prompt)
        setIsPromptReady(true)
        setIsInstallable(true)
        console.log('[PWA] install prompt available:', true)
      }
    }

    syncPromptState()

    const handlePromptReady = () => syncPromptState()
    const handleAppInstalledEvent = () => {
      setDeferredPrompt(null)
      globalDeferredPrompt = null
      ;(window as unknown as { __deferredPrompt: null }).__deferredPrompt = null
      setIsPromptReady(false)
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallState('installed')
    }

    window.addEventListener('pwa-prompt-ready', handlePromptReady)
    window.addEventListener('pwa-installed', handleAppInstalledEvent)
    window.addEventListener('beforeinstallprompt', handlePromptReady)
    window.addEventListener('appinstalled', handleAppInstalledEvent)

    // 4. Ensure Service Worker is registered
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope)
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err)
        })
    }

    return () => {
      mediaQuery.removeEventListener?.('change', handleMediaChange)
      window.removeEventListener('pwa-prompt-ready', handlePromptReady)
      window.removeEventListener('pwa-installed', handleAppInstalledEvent)
      window.removeEventListener('beforeinstallprompt', handlePromptReady)
      window.removeEventListener('appinstalled', handleAppInstalledEvent)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    const win = typeof window !== 'undefined' ? (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }) : undefined
    const activePrompt = deferredPrompt || globalDeferredPrompt || win?.__deferredPrompt || null

    console.log('[PWA] Download App clicked')
    console.log('[PWA] deferredPrompt:', activePrompt)

    if (isStandalone) {
      console.log('[PWA] Already running in standalone mode')
      return 'dismissed'
    }

    // 1. Immediately prioritize native install prompt when available
    if (activePrompt) {
      console.log('[PWA] Triggering native PWA installation prompt...')
      setInstallState('installing')
      try {
        await activePrompt.prompt()
        const { outcome } = await activePrompt.userChoice
        console.log('[PWA] Install prompt outcome:', outcome)

        if (outcome === 'accepted') {
          setIsInstalled(true)
          setIsInstallable(false)
          setDeferredPrompt(null)
          globalDeferredPrompt = null
          if (win) {
            win.__deferredPrompt = undefined
          }
          setIsPromptReady(false)
          setInstallState('installed')
          return 'accepted'
        } else {
          setInstallState('idle')
          return 'dismissed'
        }
      } catch (err) {
        console.warn('[PWA] Error calling prompt():', err)
        setInstallState('idle')
        return 'dismissed'
      }
    }

    // 2. iOS fallback: Show Add to Home Screen instructions
    if (isIOS) {
      console.log('[PWA] iOS Safari detected, showing Add to Home Screen instructions')
      setShowIOSModal(true)
      return 'instructions_shown'
    }

    // 3. Fallback when browser does not support beforeinstallprompt or prompt has not fired
    console.log('[PWA] Native prompt unavailable in this browser/session')
    setShowHelpModal(true)
    return 'instructions_shown'
  }, [deferredPrompt, isIOS, isStandalone])

  const contextValue = useMemo<PWAContextValue>(
    () => ({
      isInstallable,
      isInstalled,
      isStandalone,
      isIOS,
      isPromptReady,
      installState,
      promptInstall,
      showIOSModal,
      setShowIOSModal,
      showHelpModal,
      setShowHelpModal,
    }),
    [
      isInstallable,
      isInstalled,
      isStandalone,
      isIOS,
      isPromptReady,
      installState,
      promptInstall,
      showIOSModal,
      showHelpModal,
    ]
  )

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
      <InstallHelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </PWAContext.Provider>
  )
}
