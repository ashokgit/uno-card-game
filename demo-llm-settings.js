// Browser Console Demo for LLM Settings
// Run this in the browser console on http://localhost:3092

console.log('🎮 LLM Settings Demo')
console.log('====================')

// Function to test LLM settings access
function testLLMSettings() {
  console.log('\n📋 Testing LLM Settings Access...')
  
  // Check if settings context is available
  if (typeof window !== 'undefined' && window.React) {
    console.log('✅ React is available')
  } else {
    console.log('❌ React not available')
    return
  }
  
  // Try to access localStorage settings
  try {
    const gameSettings = localStorage.getItem('gameSettings')
    if (gameSettings) {
      const parsed = JSON.parse(gameSettings)
      console.log('✅ Game settings found in localStorage')
      console.log('LLM Providers:', parsed.llmProviders?.length || 0)
      console.log('AI Players:', parsed.aiPlayers?.length || 0)
      
      // Show default players
      if (parsed.aiPlayers) {
        console.log('\n👥 Default AI Players:')
        parsed.aiPlayers.forEach((player, index) => {
          const type = player.llmProviderId ? 'LLM' : 'Basic AI'
          const status = player.isActive ? 'Active' : 'Inactive'
          console.log(`  ${index + 1}. ${player.name} (${type}) - ${status}`)
        })
      }
      
      // Show LLM providers
      if (parsed.llmProviders) {
        console.log('\n🤖 LLM Providers:')
        parsed.llmProviders.forEach((provider, index) => {
          const status = provider.isActive ? 'Active' : 'Inactive'
          const tested = provider.testSuccess ? 'Tested' : 'Not Tested'
          console.log(`  ${index + 1}. ${provider.name} - ${status} (${tested})`)
        })
      }
    } else {
      console.log('❌ No game settings found in localStorage')
    }
  } catch (error) {
    console.log('❌ Error accessing settings:', error)
  }
}

// Function to simulate adding an LLM provider
function simulateAddLLMProvider() {
  console.log('\n➕ Simulating LLM Provider Addition...')
  
  try {
    const gameSettings = JSON.parse(localStorage.getItem('gameSettings') || '{}')
    
    // Add a new LLM provider
    const newProvider = {
      id: 'demo-provider-' + Date.now(),
      name: 'Demo Provider',
      apiKey: 'demo-key',
      model: 'gpt-3.5-turbo',
      isActive: false,
      testSuccess: false
    }
    
    if (!gameSettings.llmProviders) {
      gameSettings.llmProviders = []
    }
    
    gameSettings.llmProviders.push(newProvider)
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings))
    
    console.log('✅ Added demo LLM provider:', newProvider.name)
    console.log('   ID:', newProvider.id)
    console.log('   Status: Inactive (needs testing)')
    
  } catch (error) {
    console.log('❌ Error adding provider:', error)
  }
}

// Function to simulate assigning LLM to a player
function simulateAssignLLMToPlayer() {
  console.log('\n🎯 Simulating LLM Assignment to Player...')
  
  try {
    const gameSettings = JSON.parse(localStorage.getItem('gameSettings') || '{}')
    
    if (gameSettings.aiPlayers && gameSettings.aiPlayers.length > 0) {
      const player = gameSettings.aiPlayers[0] // Alice
      const provider = gameSettings.llmProviders?.[0] // First provider
      
      if (provider && provider.testSuccess) {
        player.llmProviderId = provider.id
        player.personality = 'I am Alice, a strategic and patient UNO player who likes to analyze the game carefully.'
        
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings))
        
        console.log('✅ Assigned LLM to Alice')
        console.log('   Provider:', provider.name)
        console.log('   Personality:', player.personality.substring(0, 50) + '...')
      } else {
        console.log('❌ No tested LLM provider available')
      }
    } else {
      console.log('❌ No AI players found')
    }
    
  } catch (error) {
    console.log('❌ Error assigning LLM:', error)
  }
}

// Function to test LLM manager
function testLLMManager() {
  console.log('\n🔧 Testing LLM Manager...')
  
  // Check if llmManager is available globally
  if (typeof window !== 'undefined' && window.llmManager) {
    console.log('✅ LLM Manager is available globally')
    
    // Test getting providers
    const providers = window.llmManager.getAllProviders()
    console.log('Available providers:', providers.length)
    
    // Test connection status
    if (providers.length > 0) {
      const status = window.llmManager.getConnectionStatus(providers[0].id)
      console.log('Connection status for first provider:', status)
    }
  } else {
    console.log('❌ LLM Manager not available globally')
    console.log('   Try running: window.llmManager = require("./lib/llm/manager").llmManager')
  }
}

// Function to show current game state
function showCurrentGameState() {
  console.log('\n🎮 Current Game State...')
  
  // Check if game engine is available
  if (typeof window !== 'undefined' && window.UnoGame) {
    console.log('✅ UnoGame is available')
  } else {
    console.log('❌ UnoGame not available')
  }
  
  // Check if we're on the game page
  const gameContainer = document.querySelector('[data-game-container]') || 
                       document.querySelector('.game-container') ||
                       document.querySelector('#game')
  
  if (gameContainer) {
    console.log('✅ Game container found')
  } else {
    console.log('❌ Game container not found - not on game page')
  }
}

// Main demo function
function runLLMDemo() {
  console.log('🚀 Starting LLM Settings Demo...\n')
  
  testLLMSettings()
  simulateAddLLMProvider()
  simulateAssignLLMToPlayer()
  testLLMManager()
  showCurrentGameState()
  
  console.log('\n🎉 Demo completed!')
  console.log('\n📝 Next Steps:')
  console.log('1. Open Settings modal')
  console.log('2. Go to LLM tab')
  console.log('3. Test connection for a provider')
  console.log('4. Assign LLM to a player')
  console.log('5. Start a game to see LLM in action')
}

// Export functions for manual testing
window.testLLMSettings = testLLMSettings
window.simulateAddLLMProvider = simulateAddLLMProvider
window.simulateAssignLLMToPlayer = simulateAssignLLMToPlayer
window.testLLMManager = testLLMManager
window.runLLMDemo = runLLMDemo

console.log('📚 Available functions:')
console.log('- runLLMDemo() - Run full demo')
console.log('- testLLMSettings() - Test settings access')
console.log('- simulateAddLLMProvider() - Add demo provider')
console.log('- simulateAssignLLMToPlayer() - Assign LLM to player')
console.log('- testLLMManager() - Test LLM manager')

// Auto-run demo if on game page
if (document.readyState === 'complete') {
  runLLMDemo()
} else {
  window.addEventListener('load', runLLMDemo)
}
