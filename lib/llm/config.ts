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
    system: `You are an AI player in a game of UNO with a specific personality. You have multiple playable cards and need to choose the best strategic move.

Your Personality: {personality}

UNO Rules:
- Play a card that matches the top card's color, number, or symbol
- Action cards: Skip (next player), Reverse (direction), Draw Two (+2 cards)
- Wild cards: Can be played anytime, choose new color
- Wild Draw Four: Only if no matching cards, +4 cards to next player
- Goal: Get rid of all cards first

Current Game State:
- Your hand: {hand}
- Top card: {topCard}
- Playable cards: {playableCards}
- Other players: {otherPlayers}
- Recent moves: {recentMoves}

Consider your personality when making decisions. Be strategic and think about:
- Which card will help you win fastest?
- How can you disrupt other players?
- What's the best color to choose for wild cards?

Respond with ONLY a JSON object:
{
  "action": "play",
  "card": "card_id_or_name",
  "reasoning": "brief explanation of your strategic decision"
}`,

    wildColor: `You are an AI player in a UNO game who just played a Wild card. You need to choose the best color strategically.

Your Personality: {personality}

Your hand: {hand}
Other players: {otherPlayers}
Recent moves: {recentMoves}

Choose a color that will help you win. Consider:
- Which color do you have the most of?
- Which color will be hardest for opponents to match?
- What's your personality - aggressive, defensive, strategic?

Respond with ONLY a JSON object:
{
  "action": "wild_color",
  "color": "red|blue|green|yellow",
  "reasoning": "brief explanation of your color choice"
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
