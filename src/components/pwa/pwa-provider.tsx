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

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
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

    // 3. Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsPromptReady(true)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsPromptReady(false)
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallState('installed')
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // 5. Register Service Worker in production or live browser environments
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.')
                  }
                }
              }
            }
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      }

      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
      }
    }

    return () => {
      mediaQuery.removeEventListener?.('change', handleMediaChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (isStandalone) {
      return 'dismissed'
    }

    if (deferredPrompt) {
      setInstallState('installing')
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsInstalled(true)
          setIsInstallable(false)
          setDeferredPrompt(null)
          setIsPromptReady(false)
          setInstallState('installed')
          return 'accepted'
        } else {
          setInstallState('idle')
          return 'dismissed'
        }
      } catch (err) {
        console.warn('[PWA] Error in promptInstall:', err)
        setInstallState('idle')
        return 'dismissed'
      }
    }

    if (isIOS) {
      setShowIOSModal(true)
      return 'instructions_shown'
    }

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
