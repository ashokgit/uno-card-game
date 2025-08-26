import {
    LLMProvider,
    LLMRequest,
    LLMResponse,
    OpenAIRequest,
    AnthropicRequest,
    OllamaRequest,
    ConnectionTest
} from './types'
import { DEFAULT_LLM_CONFIG, ERROR_MESSAGES } from './config'

// Base provider class
abstract class BaseProvider {
    protected config = DEFAULT_LLM_CONFIG

    abstract makeRequest(request: LLMRequest): Promise<LLMResponse>
    abstract testConnection(provider: LLMProvider): Promise<ConnectionTest>

    protected async makeHttpRequest(
        url: string,
        options: RequestInit,
        timeoutMs: number = this.config.timeoutMs
    ): Promise<Response> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            })
            clearTimeout(timeoutId)
            return response
        } catch (error) {
            clearTimeout(timeoutId)
            throw error
        }
    }

    protected parseResponse(response: Response, startTime: number): LLMResponse {
        const responseTime = Date.now() - startTime

        if (!response.ok) {
            let errorMessage = ERROR_MESSAGES.CONNECTION_FAILED
            if (response.status === 401) errorMessage = ERROR_MESSAGES.MISSING_API_KEY
            if (response.status === 429) errorMessage = ERROR_MESSAGES.RATE_LIMITED
            if (response.status === 403) errorMessage = ERROR_MESSAGES.QUOTA_EXCEEDED

            return {
                success: false,
                error: `${errorMessage} (${response.status})`,
                metadata: {
                    model: 'unknown',
                    provider: 'unknown',
                    responseTime
                }
            }
        }

        return {
            success: true,
            content: '',
            metadata: {
                model: 'unknown',
                provider: 'unknown',
                responseTime
            }
        }
    }
}

// OpenAI Provider
export class OpenAIProvider extends BaseProvider {
    async makeRequest(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now()

        if (!request.provider.apiKey) {
            return {
                success: false,
                error: ERROR_MESSAGES.MISSING_API_KEY
            }
        }

        const openAIRequest: OpenAIRequest = {
            model: request.provider.model,
            messages: [
                ...(request.systemMessage ? [{ role: 'system' as const, content: request.systemMessage }] : []),
                { role: 'user' as const, content: request.prompt }
            ],
            temperature: request.temperature ?? this.config.defaultTemperature,
            max_tokens: request.maxTokens ?? this.config.defaultMaxTokens
        }

        try {
            const response = await this.makeHttpRequest(
                `${request.provider.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${request.provider.apiKey}`
                    },
                    body: JSON.stringify(openAIRequest)
                }
            )

            const result = this.parseResponse(response, startTime)
            if (!result.success) return result

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            return {
                success: true,
                content,
                usage: data.usage,
                metadata: {
                    model: request.provider.model,
                    provider: 'OpenAI',
                    responseTime: result.metadata!.responseTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED,
                metadata: {
                    model: request.provider.model,
                    provider: 'OpenAI',
                    responseTime: Date.now() - startTime
                }
            }
        }
    }

    async testConnection(provider: LLMProvider): Promise<ConnectionTest> {
        const startTime = Date.now()

        try {
            const response = await this.makeRequest({
                provider,
                prompt: 'Hello! Please respond with "Connection test successful."',
                maxTokens: 50
            })

            return {
                provider,
                success: response.success,
                responseTime: Date.now() - startTime,
                error: response.error,
                sampleResponse: response.content
            }
        } catch (error) {
            return {
                provider,
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}

// Anthropic Provider
export class AnthropicProvider extends BaseProvider {
    async makeRequest(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now()

        if (!request.provider.apiKey) {
            return {
                success: false,
                error: ERROR_MESSAGES.MISSING_API_KEY
            }
        }

        const anthropicRequest: AnthropicRequest = {
            model: request.provider.model,
            max_tokens: request.maxTokens ?? this.config.defaultMaxTokens,
            messages: [
                { role: 'user' as const, content: request.prompt }
            ],
            system: request.systemMessage,
            temperature: request.temperature ?? this.config.defaultTemperature
        }

        try {
            const response = await this.makeHttpRequest(
                `${request.provider.baseUrl || 'https://api.anthropic.com'}/v1/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': request.provider.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify(anthropicRequest)
                }
            )

            const result = this.parseResponse(response, startTime)
            if (!result.success) return result

            const data = await response.json()
            const content = data.content?.[0]?.text

            return {
                success: true,
                content,
                usage: data.usage,
                metadata: {
                    model: request.provider.model,
                    provider: 'Anthropic',
                    responseTime: result.metadata!.responseTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED,
                metadata: {
                    model: request.provider.model,
                    provider: 'Anthropic',
                    responseTime: Date.now() - startTime
                }
            }
        }
    }

    async testConnection(provider: LLMProvider): Promise<ConnectionTest> {
        const startTime = Date.now()

        try {
            const response = await this.makeRequest({
                provider,
                prompt: 'Hello! Please respond with "Connection test successful."',
                maxTokens: 50
            })

            return {
                provider,
                success: response.success,
                responseTime: Date.now() - startTime,
                error: response.error,
                sampleResponse: response.content
            }
        } catch (error) {
            return {
                provider,
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}

// Ollama Provider
export class OllamaProvider extends BaseProvider {
    async makeRequest(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now()

        const ollamaRequest: OllamaRequest = {
            model: request.provider.model,
            prompt: request.prompt,
            system: request.systemMessage,
            temperature: request.temperature ?? this.config.defaultTemperature,
            stream: false
        }

        try {
            const response = await this.makeHttpRequest(
                `${request.provider.baseUrl || 'http://localhost:11434'}/api/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ollamaRequest)
                }
            )

            const result = this.parseResponse(response, startTime)
            if (!result.success) return result

            const data = await response.json()
            const content = data.response

            return {
                success: true,
                content,
                metadata: {
                    model: request.provider.model,
                    provider: 'Ollama',
                    responseTime: result.metadata!.responseTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED,
                metadata: {
                    model: request.provider.model,
                    provider: 'Ollama',
                    responseTime: Date.now() - startTime
                }
            }
        }
    }

    async testConnection(provider: LLMProvider): Promise<ConnectionTest> {
        const startTime = Date.now()

        try {
            const response = await this.makeRequest({
                provider,
                prompt: 'Hello! Please respond with "Connection test successful."',
                maxTokens: 50
            })

            return {
                provider,
                success: response.success,
                responseTime: Date.now() - startTime,
                error: response.error,
                sampleResponse: response.content
            }
        } catch (error) {
            return {
                provider,
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}

// Provider factory
export class LLMProviderFactory {
    static createProvider(providerType: string): BaseProvider {
        switch (providerType.toLowerCase()) {
            case 'openai':
                return new OpenAIProvider()
            case 'anthropic':
                return new AnthropicProvider()
            case 'ollama':
                return new OllamaProvider()
            default:
                throw new Error(`Unknown provider type: ${providerType}`)
        }
    }

    static getProviderType(provider: LLMProvider): string {
        if (provider.baseUrl?.includes('openai.com')) return 'openai'
        if (provider.baseUrl?.includes('anthropic.com')) return 'anthropic'
        if (provider.baseUrl?.includes('localhost:11434') || provider.name.toLowerCase().includes('ollama')) return 'ollama'

        // Default based on name
        if (provider.name.toLowerCase().includes('openai')) return 'openai'
        if (provider.name.toLowerCase().includes('anthropic') || provider.name.toLowerCase().includes('claude')) return 'anthropic'
        if (provider.name.toLowerCase().includes('ollama')) return 'ollama'

        return 'openai' // fallback
    }
}
