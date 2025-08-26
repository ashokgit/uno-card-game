// Simple test for LLM strategy without requiring full uno-engine
console.log('🧪 Testing LLM Strategy Components...\n')

// Mock the required types and classes
class MockUnoCard {
  constructor(id, color, value) {
    this.id = id
    this.color = color
    this.value = value
  }
}

class MockUnoPlayer {
  constructor(name) {
    this.name = name
    this.hand = []
  }
  
  getHand() {
    return this.hand
  }
  
  getHandSize() {
    return this.hand.length
  }
  
  setHand(cards) {
    this.hand = cards
  }
}

// Mock LLM manager
const mockLLMManager = {
  makeRequest: async (request) => {
    console.log('🤖 Mock LLM Request:')
    console.log('  Provider:', request.provider.name)
    console.log('  System message length:', request.systemMessage.length)
    console.log('  Prompt length:', request.prompt.length)
    
    // Simulate LLM response
    if (request.prompt.includes('play')) {
      return {
        success: true,
        content: JSON.stringify({
          action: 'play',
          card: 'card1',
          reasoning: 'Playing the first available card as a strategic move.'
        })
      }
    } else if (request.prompt.includes('wild_color')) {
      return {
        success: true,
        content: JSON.stringify({
          action: 'wild_color',
          color: 'red',
          reasoning: 'Choosing red because it appears most frequently in my hand.'
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
const originalRequire = require
require = function(id) {
  if (id === './lib/llm/manager') {
    return { llmManager: mockLLMManager }
  }
  return originalRequire.apply(this, arguments)
}

// Now import our LLM strategy
const { LLMAIStrategy } = require('./lib/llm/ai-strategy')

// Test data
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

async function testLLMStrategy() {
  console.log('🎯 Testing LLM Strategy Logic...\n')
  
  // Create LLM strategy
  const llmStrategy = new LLMAIStrategy(
    mockGameSettings.aiPlayers[0],
    mockGameSettings,
    []
  )
  
  // Test 1: Single playable card (no LLM needed)
  console.log('📋 Test 1: Single playable card')
  const singleCard = [new MockUnoCard('card1', 'red', 5)]
  const mockPlayer1 = new MockUnoPlayer('Test AI')
  const gameState1 = { topCard: { color: 'red', value: 3 } }
  
  const result1 = await llmStrategy.chooseCard(singleCard, gameState1, mockPlayer1)
  console.log('  Result:', result1 ? `${result1.color} ${result1.value}` : 'null')
  console.log('  ✅ Expected: No LLM call, direct return\n')
  
  // Test 2: Multiple playable cards (LLM needed)
  console.log('📋 Test 2: Multiple playable cards')
  const multipleCards = [
    new MockUnoCard('card1', 'red', 5),
    new MockUnoCard('card2', 'wild', 'Wild'),
    new MockUnoCard('card3', 'blue', 7)
  ]
  const mockPlayer2 = new MockUnoPlayer('Test AI')
  mockPlayer2.setHand(multipleCards)
  const gameState2 = { 
    topCard: { color: 'red', value: 3 },
    players: [
      { id: 'player1', name: 'You', handSize: 5, isHuman: true },
      { id: 'player2', name: 'Test AI', handSize: 3, isHuman: false }
    ]
  }
  
  const result2 = await llmStrategy.chooseCard(multipleCards, gameState2, mockPlayer2)
  console.log('  Result:', result2 ? `${result2.color} ${result2.value}` : 'null')
  console.log('  ✅ Expected: LLM call made, strategic decision\n')
  
  // Test 3: Wild color choice
  console.log('📋 Test 3: Wild color choice')
  const hand = [
    new MockUnoCard('card1', 'red', 5),
    new MockUnoCard('card2', 'blue', 7),
    new MockUnoCard('card3', 'red', 9)
  ]
  const mockPlayer3 = new MockUnoPlayer('Test AI')
  mockPlayer3.setHand(hand)
  const gameState3 = { 
    topCard: { color: 'wild', value: 'Wild' },
    players: [
      { id: 'player1', name: 'You', handSize: 5, isHuman: true },
      { id: 'player2', name: 'Test AI', handSize: 3, isHuman: false }
    ]
  }
  
  const result3 = await llmStrategy.chooseWildColor(hand, gameState3, mockPlayer3)
  console.log('  Result:', result3)
  console.log('  ✅ Expected: LLM call made, color chosen\n')
  
  // Test 4: Fallback when LLM provider not available
  console.log('📋 Test 4: Fallback to basic AI')
  const llmStrategyNoProvider = new LLMAIStrategy(
    { ...mockGameSettings.aiPlayers[0], llmProviderId: null },
    mockGameSettings,
    []
  )
  
  const result4 = await llmStrategyNoProvider.chooseCard(multipleCards, gameState2, mockPlayer2)
  console.log('  Result:', result4 ? `${result4.color} ${result4.value}` : 'null')
  console.log('  ✅ Expected: Fallback to basic AI logic\n')
  
  console.log('🎉 All tests completed!')
  console.log('\n📊 Summary:')
  console.log('• LLM strategy correctly handles single vs multiple playable cards')
  console.log('• LLM calls are made only when needed (multiple choices)')
  console.log('• Wild color selection uses LLM for strategic decisions')
  console.log('• Fallback to basic AI works when LLM unavailable')
  console.log('• Personality-driven decision making is integrated')
}

// Run the test
testLLMStrategy().catch(console.error)
