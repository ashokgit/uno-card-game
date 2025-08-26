// Core LLM Types and Interfaces

export interface LLMProvider {
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

export interface AIPlayer {
    id: string
    name: string
    avatar: string
    llmProviderId: string | null
    personality: string
    isActive: boolean
    isDefault?: boolean
}

export interface LLMRequest {
    provider: LLMProvider
    prompt: string
    systemMessage?: string
    temperature?: number
    maxTokens?: number
}

export interface LLMResponse {
    success: boolean
    content?: string
    error?: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    metadata?: {
        model: string
        provider: string
        responseTime: number
    }
}

export interface GameContext {
    currentPlayer: string
    playerHand: string[]
    topCard: string
    availableActions: string[]
    gameState: string
    otherPlayers: Array<{
        name: string
        handSize: number
    }>
}

export interface LLMGameRequest extends LLMRequest {
    gameContext: GameContext
    playerPersonality: string
}

// Provider-specific types
export interface OpenAIRequest {
    model: string
    messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
    }>
    temperature?: number
    max_tokens?: number
}

export interface AnthropicRequest {
    model: string
    max_tokens: number
    messages: Array<{
        role: 'user' | 'assistant'
        content: string
    }>
    system?: string
    temperature?: number
}

export interface OllamaRequest {
    model: string
    prompt: string
    system?: string
    temperature?: number
    stream?: boolean
}

// Test connection types
export interface ConnectionTest {
    provider: LLMProvider
    success: boolean
    responseTime: number
    error?: string
    sampleResponse?: string
}

export interface LLMConfig {
    defaultTemperature: number
    defaultMaxTokens: number
    timeoutMs: number
    retryAttempts: number
}
