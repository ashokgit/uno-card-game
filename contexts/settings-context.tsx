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

interface LLMProvider {
  id: string
  name: string
  apiKey: string
  baseUrl?: string
  model: string
  isActive: boolean
  lastTested?: number
  testSuccess?: boolean
  testError?: string
  responseTime?: number
}

interface AIPlayer {
  id: string
  name: string
  avatar: string
  llmProviderId: string | null
  personality: string
  isActive: boolean
  isDefault?: boolean
}

export interface GameSettings {
  rules: UnoRules
  playerCount: number
  llmProviders: LLMProvider[]
  aiPlayers: AIPlayer[]
}

interface SettingsContextType {
  uiSettings: UISettings
  gameSettings: GameSettings
  updateUISetting: (key: keyof UISettings, value: any) => void
  updateGameSetting: (key: keyof GameSettings, value: any) => void
  updateRule: (key: keyof UnoRules, value: any) => void
  addLLMProvider: (provider: Omit<LLMProvider, 'id'>) => void
  updateLLMProvider: (id: string, updates: Partial<LLMProvider>) => void
  updateLLMProviderTestResult: (id: string, testResult: { success: boolean; responseTime: number; error?: string }) => void
  removeLLMProvider: (id: string) => void
  addAIPlayer: (player: Omit<AIPlayer, 'id'>) => void
  updateAIPlayer: (id: string, updates: Partial<AIPlayer>) => void
  removeAIPlayer: (id: string) => void
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
  playerCount: 10,
  llmProviders: [
    {
      id: 'openai-default',
      name: 'OpenAI',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      isActive: false
    },
    {
      id: 'anthropic-default',
      name: 'Anthropic',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-haiku-20240307',
      isActive: false
    }
  ],
  aiPlayers: [
    {
      id: 'alice-default',
      name: 'Alice',
      avatar: '/female-avatar-2.png',
      llmProviderId: null,
      personality: 'Strategic and analytical player who thinks several moves ahead',
      isActive: true,
      isDefault: true
    },
    {
      id: 'bob-default',
      name: 'Bob',
      avatar: '/male-avatar.png',
      llmProviderId: null,
      personality: 'Aggressive player who likes to use action cards frequently',
      isActive: true,
      isDefault: true
    },
    {
      id: 'carol-default',
      name: 'Carol',
      avatar: '/diverse-female-avatar.png',
      llmProviderId: null,
      personality: 'Defensive player who prefers to hold onto cards until the right moment',
      isActive: true,
      isDefault: true
    },
    {
      id: 'dave-default',
      name: 'Dave',
      avatar: '/male-avatar-2.png',
      llmProviderId: null,
      personality: 'Balanced player who adapts strategy based on the game situation',
      isActive: true,
      isDefault: true
    },
    {
      id: 'eve-default',
      name: 'Eve',
      avatar: '/female-avatar-3.png',
      llmProviderId: null,
      personality: 'Creative player who makes unexpected moves and takes calculated risks',
      isActive: true,
      isDefault: true
    },
    {
      id: 'frank-default',
      name: 'Frank',
      avatar: '/male-avatar-3.png',
      llmProviderId: null,
      personality: 'Tactical player who focuses on card counting and probability',
      isActive: true,
      isDefault: true
    },
    {
      id: 'grace-default',
      name: 'Grace',
      avatar: '/human-avatar.png',
      llmProviderId: null,
      personality: 'Social player who adapts strategy based on other players\' behavior',
      isActive: true,
      isDefault: true
    },
    {
      id: 'henry-default',
      name: 'Henry',
      avatar: '/male-avatar.png',
      llmProviderId: null,
      personality: 'Calculating player who carefully tracks all cards played',
      isActive: true,
      isDefault: true
    },
    {
      id: 'iris-default',
      name: 'Iris',
      avatar: '/female-avatar-2.png',
      llmProviderId: null,
      personality: 'Opportunistic player who seizes every advantage',
      isActive: true,
      isDefault: true
    }
  ],
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [uiSettings, setUISettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)

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
        // Merge settings but preserve saved player states
        const mergedSettings = {
          ...DEFAULT_GAME_SETTINGS,
          ...parsed,
          // Merge default players with saved states, preserving custom players
          aiPlayers: [
            // Start with default players but preserve their saved states
            ...DEFAULT_GAME_SETTINGS.aiPlayers.map(defaultPlayer => {
              const savedPlayer = parsed.aiPlayers?.find((p: any) => p.id === defaultPlayer.id)
              return savedPlayer ? { ...defaultPlayer, ...savedPlayer } : defaultPlayer
            }),
            // Add any custom players that aren't defaults
            ...(parsed.aiPlayers?.filter((player: any) => !player.isDefault) || [])
          ]
        }
        setGameSettings(mergedSettings)
      } catch (error) {
        console.warn('Failed to parse saved game settings:', error)
      }
    }

    setIsInitialized(true)
  }, [])

  // Save UI settings to localStorage whenever they change (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('uno-ui-settings', JSON.stringify(uiSettings))
    }
  }, [uiSettings, isInitialized])

  // Save game settings to localStorage whenever they change (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('uno-game-settings', JSON.stringify(gameSettings))
    }
  }, [gameSettings, isInitialized])

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

  const addLLMProvider = (provider: Omit<LLMProvider, 'id'>) => {
    const newProvider: LLMProvider = {
      ...provider,
      id: `llm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setGameSettings(prev => ({
      ...prev,
      llmProviders: [...prev.llmProviders, newProvider]
    }))
  }

  const updateLLMProvider = (id: string, updates: Partial<LLMProvider>) => {
    setGameSettings(prev => ({
      ...prev,
      llmProviders: prev.llmProviders.map(provider =>
        provider.id === id ? { ...provider, ...updates } : provider
      )
    }))
  }

  const updateLLMProviderTestResult = (id: string, testResult: {
    success: boolean
    responseTime: number
    error?: string
  }) => {
    setGameSettings(prev => ({
      ...prev,
      llmProviders: prev.llmProviders.map(provider =>
        provider.id === id ? {
          ...provider,
          lastTested: Date.now(),
          testSuccess: testResult.success,
          testError: testResult.error,
          responseTime: testResult.responseTime
        } : provider
      )
    }))
  }

  const removeLLMProvider = (id: string) => {
    setGameSettings(prev => ({
      ...prev,
      llmProviders: prev.llmProviders.filter(provider => provider.id !== id)
    }))
  }

  const addAIPlayer = (player: Omit<AIPlayer, 'id'>) => {
    const newPlayer: AIPlayer = {
      ...player,
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false // Ensure custom players are marked as non-default
    }
    console.log('➕ Adding new AI player:', newPlayer)
    setGameSettings(prev => ({
      ...prev,
      aiPlayers: [...prev.aiPlayers, newPlayer]
    }))
  }

  const updateAIPlayer = (id: string, updates: Partial<AIPlayer>) => {
    setGameSettings(prev => ({
      ...prev,
      aiPlayers: prev.aiPlayers.map(player =>
        player.id === id ? { ...player, ...updates } : player
      )
    }))
  }

  const removeAIPlayer = (id: string) => {
    setGameSettings(prev => ({
      ...prev,
      aiPlayers: prev.aiPlayers.filter(player => player.id !== id)
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
      addLLMProvider,
      updateLLMProvider,
      updateLLMProviderTestResult,
      removeLLMProvider,
      addAIPlayer,
      updateAIPlayer,
      removeAIPlayer,
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
