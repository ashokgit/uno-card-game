// Demo script for testing the LLM system
// Run this in the browser console at http://localhost:3091

console.log('🚀 UNO LLM System Demo')
console.log('======================')

// Check if LLM system is available
if (typeof window.testLLM === 'function') {
  console.log('✅ LLM system is loaded!')
  
  // Test the LLM system
  console.log('🧪 Testing LLM connection...')
  window.testLLM()
  
  // Show available functions
  console.log('📋 Available functions:')
  console.log('- testLLM() - Test LLM connection')
  console.log('- llmManager - Access the LLM manager')
  
  // Show LLM manager stats
  if (window.llmManager) {
    console.log('📊 LLM Manager Stats:', window.llmManager.getStats())
  }
  
} else {
  console.log('❌ LLM system not found. Make sure the page is loaded.')
  console.log('💡 Try refreshing the page and running this script again.')
}

// Helper function to test with Ollama
async function testOllamaConnection() {
  console.log('🔗 Testing Ollama connection...')
  
  if (!window.llmManager) {
    console.log('❌ LLM Manager not available')
    return
  }
  
  const ollamaProvider = {
    id: 'demo-ollama',
    name: 'Demo Ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    isActive: true
  }
  
  try {
    window.llmManager.addProvider(ollamaProvider)
    const result = await window.llmManager.testConnection(ollamaProvider.id)
    
    if (result.success) {
      console.log('✅ Ollama connection successful!', result)
    } else {
      console.log('❌ Ollama connection failed:', result.error)
      console.log('💡 Make sure Ollama is running on localhost:11434')
    }
  } catch (error) {
    console.log('❌ Error testing Ollama:', error)
  }
}

// Helper function to test game request
async function testGameRequest() {
  console.log('🎮 Testing game request...')
  
  if (!window.llmManager) {
    console.log('❌ LLM Manager not available')
    return
  }
  
  const provider = window.llmManager.getActiveProviders()[0]
  if (!provider) {
    console.log('❌ No active providers found')
    return
  }
  
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
    maxTokens: 100
  }
  
  try {
    const response = await window.llmManager.makeGameRequest(gameRequest)
    
    if (response.success) {
      console.log('✅ Game request successful!')
      console.log('Response:', response.content)
    } else {
      console.log('❌ Game request failed:', response.error)
    }
  } catch (error) {
    console.log('❌ Error making game request:', error)
  }
}

// Add helper functions to window
window.testOllamaConnection = testOllamaConnection
window.testGameRequest = testGameRequest

console.log('🎯 Additional test functions:')
console.log('- testOllamaConnection() - Test Ollama specifically')
console.log('- testGameRequest() - Test a game request')

console.log('🏁 Demo script loaded! Check the console for results.')
