"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface UISettings {
  animationSpeed: number
  soundEffects: boolean
  backgroundMusic: boolean
  musicVolume: number
  visualEffects: boolean
  autoUnoCall: boolean
  confirmActionCards: boolean
  showPlayableCards: boolean
  gameSpeed: number
}

interface SettingsContextType {
  uiSettings: UISettings
  updateUISetting: (key: keyof UISettings, value: any) => void
  resetUISettings: () => void
}

const DEFAULT_UI_SETTINGS: UISettings = {
  animationSpeed: 1.0,
  soundEffects: true,
  backgroundMusic: true,
  musicVolume: 0.3,
  visualEffects: true,
  autoUnoCall: false,
  confirmActionCards: true,
  showPlayableCards: true,
  gameSpeed: 1.0,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [uiSettings, setUISettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('uno-ui-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setUISettings({ ...DEFAULT_UI_SETTINGS, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved UI settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uno-ui-settings', JSON.stringify(uiSettings))
  }, [uiSettings])

  const updateUISetting = (key: keyof UISettings, value: any) => {
    setUISettings(prev => ({ ...prev, [key]: value }))
  }

  const resetUISettings = () => {
    setUISettings(DEFAULT_UI_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ uiSettings, updateUISetting, resetUISettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
