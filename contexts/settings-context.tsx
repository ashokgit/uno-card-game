"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { UnoRules } from "@/lib/uno-engine"

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

interface GameSettings {
  rules: UnoRules
  playerCount: number
}

interface SettingsContextType {
  uiSettings: UISettings
  gameSettings: GameSettings
  updateUISetting: (key: keyof UISettings, value: any) => void
  updateGameSetting: (key: keyof GameSettings, value: any) => void
  updateRule: (key: keyof UnoRules, value: any) => void
  resetUISettings: () => void
  resetGameSettings: () => void
  resetAllSettings: () => void
  exportSettings: () => string
  importSettings: (settingsJson: string) => boolean
  clearAllSettings: () => void
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

const DEFAULT_GAME_RULES: UnoRules = {
  stackDrawTwo: false,
  stackDrawFour: false,
  mustPlayIfDrawable: false,
  allowDrawWhenPlayable: true,
  targetScore: 500,
  debugMode: false,
  aiDifficulty: 'expert',
  enableJumpIn: false,
  enableSevenZero: false,
  enableSwapHands: false,
  showDiscardPile: true,
  deadlockResolution: 'end_round',
  wildCardSkip: 2,
  unoChallengeWindow: 2000,
  maxGameTime: 0,
  enableUnoChallenges: true,
}

const DEFAULT_GAME_SETTINGS: GameSettings = {
  rules: DEFAULT_GAME_RULES,
  playerCount: 6,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [uiSettings, setUISettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedUISettings = localStorage.getItem('uno-ui-settings')
    const savedGameSettings = localStorage.getItem('uno-game-settings')

    if (savedUISettings) {
      try {
        const parsed = JSON.parse(savedUISettings)
        setUISettings({ ...DEFAULT_UI_SETTINGS, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved UI settings:', error)
      }
    }

    if (savedGameSettings) {
      try {
        const parsed = JSON.parse(savedGameSettings)
        setGameSettings({ ...DEFAULT_GAME_SETTINGS, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved game settings:', error)
      }
    }
  }, [])

  // Save UI settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uno-ui-settings', JSON.stringify(uiSettings))
  }, [uiSettings])

  // Save game settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uno-game-settings', JSON.stringify(gameSettings))
  }, [gameSettings])

  const updateUISetting = (key: keyof UISettings, value: any) => {
    setUISettings(prev => ({ ...prev, [key]: value }))
  }

  const updateGameSetting = (key: keyof GameSettings, value: any) => {
    setGameSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateRule = (key: keyof UnoRules, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      rules: { ...prev.rules, [key]: value }
    }))
  }

  const resetUISettings = () => {
    setUISettings(DEFAULT_UI_SETTINGS)
  }

  const resetGameSettings = () => {
    setGameSettings(DEFAULT_GAME_SETTINGS)
  }

  const resetAllSettings = () => {
    setUISettings(DEFAULT_UI_SETTINGS)
    setGameSettings(DEFAULT_GAME_SETTINGS)
  }

  const exportSettings = (): string => {
    const allSettings = {
      uiSettings,
      gameSettings,
      version: '1.0',
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(allSettings, null, 2)
  }

  const importSettings = (settingsJson: string): boolean => {
    try {
      const parsed = JSON.parse(settingsJson)

      if (parsed.uiSettings) {
        setUISettings({ ...DEFAULT_UI_SETTINGS, ...parsed.uiSettings })
      }

      if (parsed.gameSettings) {
        setGameSettings({ ...DEFAULT_GAME_SETTINGS, ...parsed.gameSettings })
      }

      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  const clearAllSettings = () => {
    localStorage.removeItem('uno-ui-settings')
    localStorage.removeItem('uno-game-settings')
    resetAllSettings()
  }

  return (
    <SettingsContext.Provider value={{
      uiSettings,
      gameSettings,
      updateUISetting,
      updateGameSetting,
      updateRule,
      resetUISettings,
      resetGameSettings,
      resetAllSettings,
      exportSettings,
      importSettings,
      clearAllSettings
    }}>
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
