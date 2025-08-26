const { UnoGame } = require('../lib/uno-engine')
const { LLMAIStrategy } = require('../lib/llm/ai-strategy')

// Mock game settings for testing
const mockGameSettings = {
  llmProviders: [
    {
      id: 'test-provider',
      name: 'Test Provider',
      apiKey: 'test-key',
      model: 'test-model',
      isActive: true,
      testSuccess: true
    }
  ],
  aiPlayers: [
    {
      id: 'test-player',
      name: 'Test AI',
      avatar: 'test-avatar.png',
      llmProviderId: 'test-provider',
      personality: 'I am a strategic and aggressive UNO player who likes to disrupt opponents.',
      isActive: true
    }
  ]
}

// Mock LLM manager for testing
const mockLLMManager = {
  makeRequest: async (request) => {
    console.log('Mock LLM request:', request)
    
    // Simulate LLM response based on the prompt
    if (request.prompt.includes('play')) {
      return {
        success: true,
        content: JSON.stringify({
          action: 'play',
          card: 'test-card-id',
          reasoning: 'This is the best strategic move based on my personality.'
        })
      }
    } else if (request.prompt.includes('wild_color')) {
      return {
        success: true,
        content: JSON.stringify({
          action: 'wild_color',
          color: 'red',
          reasoning: 'I choose red because I have many red cards.'
        })
      }
    }
    
    return {
      success: false,
      content: null,
      error: 'Mock error'
    }
  }
}

// Mock the llmManager import
jest.mock('../lib/llm/manager', () => ({
  llmManager: mockLLMManager
}))

describe('LLM Integration Test', () => {
  let game
  let llmStrategy

  beforeEach(() => {
    // Create a simple game
    game = new UnoGame(['You', 'Test AI'], 0, {
      aiDifficulty: 'expert',
      debugMode: true
    })
    
    // Create LLM strategy
    llmStrategy = new LLMAIStrategy(
      mockGameSettings.aiPlayers[0],
      mockGameSettings,
      []
    )
  })

  test('LLM strategy should handle single playable card without LLM call', async () => {
    // Create a scenario with only one playable card
    const mockPlayer = {
      name: 'Test AI',
      getHand: () => [
        { id: 'card1', color: 'red', value: 5 },
        { id: 'card2', color: 'blue', value: 7 }
      ],
      getHandSize: () => 2
    }
    
    const playableCards = [{ id: 'card1', color: 'red', value: 5 }]
    const gameState = { topCard: { color: 'red', value: 3 } }
    
    const result = await llmStrategy.chooseCard(playableCards, gameState, mockPlayer)
    
    expect(result).toBe(playableCards[0])
  })

  test('LLM strategy should use LLM for multiple playable cards', async () => {
    const mockPlayer = {
      name: 'Test AI',
      getHand: () => [
        { id: 'card1', color: 'red', value: 5 },
        { id: 'card2', color: 'blue', value: 7 },
        { id: 'card3', color: 'wild', value: 'Wild' }
      ],
      getHandSize: () => 3
    }
    
    const playableCards = [
      { id: 'card1', color: 'red', value: 5 },
      { id: 'card3', color: 'wild', value: 'Wild' }
    ]
    const gameState = { 
      topCard: { color: 'red', value: 3 },
      players: [
        { id: 'player1', name: 'You', handSize: 5, isHuman: true },
        { id: 'player2', name: 'Test AI', handSize: 3, isHuman: false }
      ]
    }
    
    const result = await llmStrategy.chooseCard(playableCards, gameState, mockPlayer)
    
    // Should return the card that the mock LLM chose
    expect(result.id).toBe('test-card-id')
  })

  test('LLM strategy should fallback to basic AI if LLM fails', async () => {
    // Mock LLM to fail
    const failingLLMManager = {
      makeRequest: async () => ({
        success: false,
        content: null,
        error: 'API error'
      })
    }
    
    // Temporarily replace the mock
    jest.doMock('../lib/llm/manager', () => ({
      llmManager: failingLLMManager
    }))
    
    const mockPlayer = {
      name: 'Test AI',
      getHand: () => [
        { id: 'card1', color: 'red', value: 5 },
        { id: 'card2', color: 'blue', value: 7 }
      ],
      getHandSize: () => 2
    }
    
    const playableCards = [
      { id: 'card1', color: 'red', value: 5 },
      { id: 'card2', color: 'blue', value: 7 }
    ]
    const gameState = { topCard: { color: 'red', value: 3 } }
    
    const result = await llmStrategy.chooseCard(playableCards, gameState, mockPlayer)
    
    // Should fallback to basic AI (prefer action cards, then numbers)
    expect(result).toBe(playableCards[0]) // First card in this case
  })

  test('LLM strategy should handle wild color choice', async () => {
    const mockPlayer = {
      name: 'Test AI',
      getHand: () => [
        { id: 'card1', color: 'red', value: 5 },
        { id: 'card2', color: 'blue', value: 7 }
      ],
      getHandSize: () => 2
    }
    
    const hand = [
      { id: 'card1', color: 'red', value: 5 },
      { id: 'card2', color: 'blue', value: 7 }
    ]
    const gameState = { 
      topCard: { color: 'wild', value: 'Wild' },
      players: [
        { id: 'player1', name: 'You', handSize: 5, isHuman: true },
        { id: 'player2', name: 'Test AI', handSize: 2, isHuman: false }
      ]
    }
    
    const result = await llmStrategy.chooseWildColor(hand, gameState, mockPlayer)
    
    expect(result).toBe('red') // Based on mock LLM response
  })
})

console.log('LLM Integration Test Suite Loaded')
console.log('Run with: npm test -- tests/llm-integration-test.js')
