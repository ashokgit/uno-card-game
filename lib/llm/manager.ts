import {
    LLMProvider,
    LLMRequest,
    LLMResponse,
    ConnectionTest,
    LLMGameRequest,
    GameContext
} from './types'
import { LLMProviderFactory } from './providers'
import { UNO_PROMPTS } from './config'

// Add LLM event interface
export interface LLMEvents {
    onLLMRequest?: (request: LLMRequest, playerName: string) => void
    onLLMResponse?: (response: LLMResponse, playerName: string, request: LLMRequest) => void
    onLLMError?: (error: string, playerName: string, request: LLMRequest) => void
}

export class LLMManager {
    private providers: Map<string, LLMProvider> = new Map()
    private connectionCache: Map<string, ConnectionTest> = new Map()
    private cacheTimeout = 5 * 60 * 1000 // 5 minutes
    private onTestResultUpdate?: (providerId: string, result: ConnectionTest) => void
    private events: LLMEvents = {}

    constructor() {
        // Initialize with empty providers map
    }

    // Set LLM events callback
    setEvents(events: LLMEvents) {
        this.events = events
    }

    // Set callback for when test results are updated
    setTestResultCallback(callback: (providerId: string, result: ConnectionTest) => void) {
        this.onTestResultUpdate = callback
    }

    // Provider management
    addProvider(provider: LLMProvider): void {
        this.providers.set(provider.id, provider)
        // Clear connection cache for this provider
        this.connectionCache.delete(provider.id)
    }

    removeProvider(providerId: string): void {
        this.providers.delete(providerId)
        this.connectionCache.delete(providerId)
    }

    getProvider(providerId: string): LLMProvider | undefined {
        return this.providers.get(providerId)
    }

    getAllProviders(): LLMProvider[] {
        return Array.from(this.providers.values())
    }

    getActiveProviders(): LLMProvider[] {
        return Array.from(this.providers.values()).filter(p => p.isActive)
    }

    // Connection testing
    async testConnection(providerId: string): Promise<ConnectionTest> {
        const provider = this.getProvider(providerId)
        if (!provider) {
            return {
                provider: { id: providerId, name: 'Unknown', apiKey: '', model: '', isActive: false },
                success: false,
                responseTime: 0,
                error: 'Provider not found'
            }
        }

        // Check cache first
        const cached = this.connectionCache.get(providerId)
        if (cached && Date.now() - cached.responseTime < this.cacheTimeout) {
            return cached
        }

        try {
            const providerType = LLMProviderFactory.getProviderType(provider)
            const llmProvider = LLMProviderFactory.createProvider(providerType)
            const result = await llmProvider.testConnection(provider)

            // Cache the result
            this.connectionCache.set(providerId, result)

            // Notify callback if set
            this.onTestResultUpdate?.(providerId, result)

            return result
        } catch (error) {
            const result: ConnectionTest = {
                provider,
                success: false,
                responseTime: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
            this.connectionCache.set(providerId, result)

            // Notify callback if set
            this.onTestResultUpdate?.(providerId, result)

            return result
        }
    }

    async testAllConnections(): Promise<ConnectionTest[]> {
        const tests: Promise<ConnectionTest>[] = []

        for (const provider of this.getAllProviders()) {
            tests.push(this.testConnection(provider.id))
        }

        return Promise.all(tests)
    }

    // LLM requests
    async makeRequest(request: LLMRequest): Promise<LLMResponse> {
        const provider = this.getProvider(request.provider.id)
        if (!provider) {
            return {
                success: false,
                error: 'Provider not found'
            }
        }

        if (!provider.isActive) {
            return {
                success: false,
                error: 'Provider is not active'
            }
        }

        // Emit request event
        this.events.onLLMRequest?.(request, request.playerName || 'Unknown')

        try {
            const providerType = LLMProviderFactory.getProviderType(provider)
            const llmProvider = LLMProviderFactory.createProvider(providerType)
            const response = await llmProvider.makeRequest(request)

            // Emit response event
            this.events.onLLMResponse?.(response, request.playerName || 'Unknown', request)

            return response
        } catch (error) {
            const response: LLMResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
            // Emit error event
            this.events.onLLMError?.(response.error || 'Unknown error', request.playerName || 'Unknown', request)
            return response
        }
    }

    // Game-specific requests
    async makeGameRequest(request: LLMGameRequest): Promise<LLMResponse> {
        const gamePrompt = this.buildGamePrompt(request.gameContext, request.playerPersonality)

        return this.makeRequest({
            ...request,
            prompt: gamePrompt,
            systemMessage: UNO_PROMPTS.system
        })
    }

    // Wild color specific request
    async makeWildColorRequest(request: LLMGameRequest): Promise<LLMResponse> {
        const wildColorPrompt = this.buildWildColorPrompt(request.gameContext, request.playerPersonality)

        return this.makeRequest({
            ...request,
            prompt: wildColorPrompt,
            systemMessage: UNO_PROMPTS.wildColor
        })
    }

    private buildGamePrompt(gameContext: GameContext, personality: string): string {
        return `
Your Personality: ${personality}

Current Game State:
- Your hand: ${gameContext.playerHand.join(', ')}
- Top card: ${gameContext.topCard}
- Available actions: ${gameContext.availableActions.join(', ')}
- Other players: ${gameContext.otherPlayers.map(p => `${p.name} (${p.handSize} cards)`).join(', ')}

Choose the best strategic move based on your personality.
`
    }

    private buildWildColorPrompt(gameContext: GameContext, personality: string): string {
        return `
Your Personality: ${personality}

Your hand: ${gameContext.playerHand.join(', ')}
Other players: ${gameContext.otherPlayers.map(p => `${p.name} (${p.handSize} cards)`).join(', ')}

Choose the best color strategically.
`
    }

    // Utility methods
    clearConnectionCache(): void {
        this.connectionCache.clear()
    }

    getConnectionStatus(providerId: string): ConnectionTest | null {
        // Check cache first
        const cached = this.connectionCache.get(providerId)
        if (cached) return cached

        // Check if provider has stored test results
        const provider = this.getProvider(providerId)
        if (provider && provider.lastTested) {
            const result: ConnectionTest = {
                provider,
                success: provider.testSuccess || false,
                responseTime: provider.responseTime || 0,
                error: provider.testError,
                sampleResponse: undefined
            }
            return result
        }

        return null
    }

    // Load test results from provider data
    loadTestResults(providers: LLMProvider[]) {
        providers.forEach(provider => {
            this.addProvider(provider)
            if (provider.lastTested) {
                const result: ConnectionTest = {
                    provider,
                    success: provider.testSuccess || false,
                    responseTime: provider.responseTime || 0,
                    error: provider.testError,
                    sampleResponse: undefined
                }
                this.connectionCache.set(provider.id, result)
            }
        })
    }

    // Batch operations
    async makeBatchRequests(requests: LLMRequest[]): Promise<LLMResponse[]> {
        const results: Promise<LLMResponse>[] = []

        for (const request of requests) {
            results.push(this.makeRequest(request))
        }

        return Promise.all(results)
    }

    // Provider validation
    validateProvider(provider: LLMProvider): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!provider.name.trim()) {
            errors.push('Provider name is required')
        }

        if (!provider.model.trim()) {
            errors.push('Model name is required')
        }

        const providerType = LLMProviderFactory.getProviderType(provider)

        // Check if API key is required
        if (providerType === 'openai' || providerType === 'anthropic') {
            if (!provider.apiKey.trim()) {
                errors.push('API key is required for this provider')
            }
        }

        // Validate base URL format
        if (provider.baseUrl && !this.isValidUrl(provider.baseUrl)) {
            errors.push('Invalid base URL format')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    // Statistics
    getStats(): {
        totalProviders: number
        activeProviders: number
        successfulConnections: number
        failedConnections: number
    } {
        const totalProviders = this.providers.size
        const activeProviders = this.getActiveProviders().length
        let successfulConnections = 0
        let failedConnections = 0

        for (const test of this.connectionCache.values()) {
            if (test.success) {
                successfulConnections++
            } else {
                failedConnections++
            }
        }

        return {
            totalProviders,
            activeProviders,
            successfulConnections,
            failedConnections
        }
    }
}

// Singleton instance
export const llmManager = new LLMManager()
