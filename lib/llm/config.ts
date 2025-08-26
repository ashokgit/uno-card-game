import { LLMConfig } from './types'

// Default LLM configuration
export const DEFAULT_LLM_CONFIG: LLMConfig = {
    defaultTemperature: 0.7,
    defaultMaxTokens: 500,
    timeoutMs: 30000, // 30 seconds
    retryAttempts: 3
}

// Provider-specific configurations
export const PROVIDER_CONFIGS = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        requiresApiKey: true
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com',
        defaultModel: 'claude-3-haiku-20240307',
        supportedModels: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
        requiresApiKey: true
    },
    ollama: {
        baseUrl: 'http://localhost:11434',
        defaultModel: 'llama2',
        supportedModels: ['llama2', 'mistral', 'codellama', 'gpt-oss:20b'],
        requiresApiKey: false
    }
}

// UNO Game specific prompts
export const UNO_PROMPTS = {
    system: `You are an AI player in a game of UNO. You must make strategic decisions based on your hand and the current game state.

Rules:
- You can play a card if it matches the color, number, or symbol of the top card
- Action cards (Skip, Reverse, Draw Two) have special effects
- Wild cards can be played on any card and let you choose a new color
- Wild Draw Four can only be played if you have no other playable cards
- The goal is to get rid of all your cards first

Respond with ONLY a JSON object containing:
{
  "action": "play" | "draw" | "wild_color",
  "card": "card_name" (if action is "play"),
  "color": "red|blue|green|yellow" (if action is "wild_color"),
  "reasoning": "brief explanation of your decision"
}`,

    test: `You are testing an LLM connection for a UNO game. Please respond with a simple message confirming the connection is working.`
}

// Error messages
export const ERROR_MESSAGES = {
    INVALID_PROVIDER: 'Invalid LLM provider configuration',
    MISSING_API_KEY: 'API key is required for this provider',
    CONNECTION_FAILED: 'Failed to connect to LLM provider',
    TIMEOUT: 'Request timed out',
    INVALID_RESPONSE: 'Invalid response from LLM provider',
    RATE_LIMITED: 'Rate limit exceeded',
    QUOTA_EXCEEDED: 'API quota exceeded'
}
