// Test script for LLM functionality
import { llmManager } from './manager'
import { LLMProvider } from './types'

// Test providers
const testProviders: LLMProvider[] = [
    {
        id: 'test-openai',
        name: 'Test OpenAI',
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        isActive: true
    },
    {
        id: 'test-ollama',
        name: 'Test Ollama',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        isActive: true
    }
]

export async function testLLMSystem() {
    console.log('🧪 Testing LLM System...')

    // Add test providers
    testProviders.forEach(provider => {
        llmManager.addProvider(provider)
    })

    console.log('📊 LLM Manager Stats:', llmManager.getStats())

    // Test connections
    console.log('🔗 Testing connections...')
    const results = await llmManager.testAllConnections()

    results.forEach(result => {
        if (result.success) {
            console.log(`✅ ${result.provider.name}: Connected (${result.responseTime}ms)`)
            if (result.sampleResponse) {
                console.log(`   Sample: "${result.sampleResponse}"`)
            }
        } else {
            console.log(`❌ ${result.provider.name}: Failed - ${result.error}`)
        }
    })

    // Test a simple request
    const activeProvider = llmManager.getActiveProviders()[0]
    if (activeProvider) {
        console.log(`🎮 Testing game request with ${activeProvider.name}...`)

        const gameRequest = {
            provider: activeProvider,
            prompt: 'You are playing UNO. Your hand: [red-5, blue-2, green-skip]. Top card: red-3. What do you play?',
            systemMessage: 'You are an AI playing UNO. Respond with only the card you want to play.',
            maxTokens: 50
        }

        try {
            const response = await llmManager.makeRequest(gameRequest)
            if (response.success) {
                console.log(`✅ Game request successful: "${response.content}"`)
            } else {
                console.log(`❌ Game request failed: ${response.error}`)
            }
        } catch (error) {
            console.log(`❌ Game request error: ${error}`)
        }
    }

    console.log('🏁 LLM System test complete!')
}

// Browser-compatible test function
export function testLLMInBrowser() {
    console.log('🌐 Testing LLM in browser...')

    // Create a simple test provider
    const testProvider: LLMProvider = {
        id: 'browser-test',
        name: 'Browser Test Provider',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        isActive: true
    }

    llmManager.addProvider(testProvider)

    // Test connection
    llmManager.testConnection(testProvider.id)
        .then(result => {
            if (result.success) {
                console.log('✅ Browser test successful!', result)
            } else {
                console.log('❌ Browser test failed:', result.error)
            }
        })
        .catch(error => {
            console.log('❌ Browser test error:', error)
        })
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).testLLM = testLLMInBrowser
        ; (window as any).llmManager = llmManager
}
