'use client'

import { createContext, useContext } from 'react'

export type InstallOutcome = 'accepted' | 'dismissed' | 'instructions_shown'

export interface PWAContextValue {
  isInstallable: boolean
  isInstalled: boolean
  isStandalone: boolean
  isIOS: boolean
  isPromptReady: boolean
  installState: 'idle' | 'installing' | 'installed'
  promptInstall: () => Promise<InstallOutcome>
  showIOSModal: boolean
  setShowIOSModal: (show: boolean) => void
  showHelpModal: boolean
  setShowHelpModal: (show: boolean) => void
}

export const PWAContext = createContext<PWAContextValue | null>(null)

export function usePWAInstall(): PWAContextValue {
  const context = useContext(PWAContext)
  if (!context) {
    // Return safe fallback for SSR or when context is missing
    return {
      isInstallable: false,
      isInstalled: false,
      isStandalone: false,
      isIOS: false,
      isPromptReady: false,
      installState: 'idle',
      promptInstall: async () => 'dismissed',
      showIOSModal: false,
      setShowIOSModal: () => {},
      showHelpModal: false,
      setShowHelpModal: () => {},
    }
  }
  return context
}

