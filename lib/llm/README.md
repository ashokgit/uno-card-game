# LLM Integration System

This directory contains the complete LLM (Large Language Model) integration system for the UNO card game. The system is designed to be modular, extensible, and easy to use.

## Architecture

```
lib/llm/
├── types.ts          # Core TypeScript interfaces and types
├── config.ts         # Configuration constants and provider settings
├── providers.ts      # Provider implementations (OpenAI, Anthropic, Ollama)
├── manager.ts        # Main LLM manager and orchestration
├── test.ts          # Testing utilities
├── index.ts         # Main exports
└── README.md        # This file
```

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Ollama
- **Connection Testing**: Built-in connection validation
- **Game Integration**: Specialized prompts for UNO gameplay
- **Error Handling**: Comprehensive error management
- **Caching**: Connection test results caching
- **Type Safety**: Full TypeScript support

## Quick Start

### 1. Basic Usage

```typescript
import { llmManager } from '@/lib/llm'

// Add a provider
const provider = {
  id: 'my-openai',
  name: 'My OpenAI',
  apiKey: 'your-api-key',
  model: 'gpt-3.5-turbo',
  isActive: true
}

llmManager.addProvider(provider)

// Test connection
const result = await llmManager.testConnection(provider.id)
console.log('Connection successful:', result.success)

// Make a request
const response = await llmManager.makeRequest({
  provider,
  prompt: 'Hello, how are you?',
  maxTokens: 100
})
```

### 2. Game-Specific Requests

```typescript
const gameRequest = {
  provider,
  gameContext: {
    currentPlayer: 'Alice',
    playerHand: ['red-5', 'blue-2', 'green-skip'],
    topCard: 'red-3',
    availableActions: ['play', 'draw'],
    gameState: 'playing',
    otherPlayers: [
      { name: 'Bob', handSize: 4 },
      { name: 'Carol', handSize: 3 }
    ]
  },
  playerPersonality: 'Strategic and analytical',
  maxTokens: 200
}

const response = await llmManager.makeGameRequest(gameRequest)
```

## Supported Providers

### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **Models**: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- **Requires API Key**: Yes

### Anthropic
- **Base URL**: `https://api.anthropic.com`
- **Models**: claude-3-haiku, claude-3-sonnet, claude-3-opus
- **Requires API Key**: Yes

### Ollama
- **Base URL**: `http://localhost:11434`
- **Models**: llama2, mistral, codellama, gpt-oss:20b
- **Requires API Key**: No

## Configuration

### Default Settings
```typescript
const DEFAULT_LLM_CONFIG = {
  defaultTemperature: 0.7,
  defaultMaxTokens: 500,
  timeoutMs: 30000, // 30 seconds
  retryAttempts: 3
}
```

### Provider-Specific Configs
Each provider has specific configuration options in `config.ts`:

```typescript
export const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    requiresApiKey: true
  },
  // ... other providers
}
```

## Testing

### Browser Testing
Open the browser console and run:
```javascript
testLLM() // Tests with Ollama on localhost:11434
```

### Programmatic Testing
```typescript
import { testLLMSystem } from '@/lib/llm/test'

await testLLMSystem()
```

## Error Handling

The system provides comprehensive error handling:

```typescript
const response = await llmManager.makeRequest(request)

if (response.success) {
  console.log('Success:', response.content)
} else {
  console.log('Error:', response.error)
  // Common errors:
  // - "API key is required for this provider"
  // - "Failed to connect to LLM provider"
  // - "Request timed out"
  // - "Rate limit exceeded"
}
```

## Integration with Game Settings

The LLM system integrates with the game settings through:

1. **Settings Context**: LLM providers and AI players are stored in the settings context
2. **UI Components**: Connection testing UI in the game settings modal
3. **Game Engine**: LLM-powered AI players can be used in gameplay

### Adding a New Provider

1. **Update Types** (`types.ts`): Add provider-specific request/response types
2. **Add Provider Class** (`providers.ts`): Implement the provider class
3. **Update Factory** (`providers.ts`): Add to the factory method
4. **Update Config** (`config.ts`): Add provider configuration
5. **Test**: Use the testing utilities to verify functionality

## Best Practices

1. **Always test connections** before using providers in production
2. **Use appropriate timeouts** for different providers
3. **Handle errors gracefully** in the UI
4. **Cache connection results** to avoid repeated tests
5. **Validate provider configurations** before adding them
6. **Use game-specific prompts** for better gameplay experience

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if the provider is running (especially Ollama)
   - Verify API keys for cloud providers
   - Check network connectivity

2. **Timeout Errors**
   - Increase timeout in configuration
   - Check provider response times
   - Consider using faster models

3. **Rate Limiting**
   - Implement retry logic with exponential backoff
   - Use multiple providers as fallbacks
   - Monitor usage limits

### Debug Mode

Enable debug logging:
```typescript
// In browser console
llmManager.clearConnectionCache() // Clear cached results
console.log(llmManager.getStats()) // View statistics
```

## Future Enhancements

- [ ] Streaming responses
- [ ] Provider fallback chains
- [ ] Response caching
- [ ] Usage analytics
- [ ] Custom model fine-tuning
- [ ] Multi-modal support (images, etc.)
