/**
 * Deadlock Fix Test
 * 
 * This test specifically verifies that the critical AI loop issue has been fixed.
 * It attempts to create the exact scenario described in the bug report and ensures
 * that deadlock detection and resolution work correctly.
 */

// Import the UnoGame class
const { UnoGame } = require('../lib/uno-engine.ts')

console.log('🔧 Deadlock Fix Test - Verifying Critical AI Loop Fix')
console.log('==================================================')

// Create a game with debug mode enabled and deadlock resolution set to end_round
const game = new UnoGame(['Alice', 'Bob', 'Charlie'], 0, {
  debugMode: true,
  deadlockResolution: 'end_round',
  aiDifficulty: 'normal'
})

// Function to create a controlled deadlock scenario
function createDeadlockScenario() {
  console.log('\n🎯 Creating controlled deadlock scenario...')
  
  // First, let's get the current game state
  const initialState = game.getState()
  console.log(`Initial deck count: ${initialState.gameState.deckCount}`)
  console.log(`Initial discard pile count: ${initialState.gameState.discardPile.length}`)
  
  // We need to simulate a scenario where:
  // 1. Deck becomes empty (0 cards)
  // 2. Discard pile has only 1 card
  // 3. Current player has no playable cards
  // 4. Player must draw but cannot
  
  let turnCount = 0
  const maxTurns = 30 // Safety limit
  
  while (turnCount < maxTurns) {
    const currentState = game.getState()
    
    // Check if we've reached the deadlock condition
    if (currentState.gameState.deckCount === 0 && currentState.gameState.discardPile.length <= 1) {
      console.log('\n🚨 DEADLOCK CONDITION DETECTED!')
      console.log(`Deck count: ${currentState.gameState.deckCount}`)
      console.log(`Discard pile count: ${currentState.gameState.discardPile.length}`)
      console.log(`Current player: ${currentState.currentPlayer.name}`)
      
      // Check if current player has playable cards
      const topCard = game.getTopCard()
      if (topCard) {
        const currentPlayer = game.getCurrentPlayer()
        const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor())
        console.log(`Top card: ${topCard.color} ${topCard.value}`)
        console.log(`Current player playable cards: ${playableCards.length}`)
        
        if (playableCards.length === 0) {
          console.log('🎯 PERFECT DEADLOCK SCENARIO ACHIEVED:')
          console.log('- Deck is empty (0 cards)')
          console.log('- Discard pile has ≤1 card')
          console.log('- Current player has no playable cards')
          console.log('- Player must draw but cannot')
          
          // Now attempt to draw a card - this should trigger deadlock detection
          console.log('\n🔄 Attempting to draw card (should trigger deadlock)...')
          const result = game.drawCard(currentPlayer.id)
          console.log(`Draw result: ${result ? 'SUCCESS' : 'FAILED'}`)
          
          // Check if deadlock was resolved
          const newState = game.getState()
          console.log(`Game phase after draw: ${newState.gameState.phase}`)
          console.log(`Is game over: ${newState.roundInfo.isGameOver}`)
          
          if (newState.roundInfo.isGameOver) {
            console.log('✅ SUCCESS: Deadlock was properly detected and resolved!')
            console.log(`Round winner: ${newState.roundInfo.roundWinner?.name || 'None'}`)
            return true
          } else {
            console.log('❌ FAILURE: Deadlock was not properly resolved')
            return false
          }
        }
      }
    }
    
    // Continue the game normally to reach the deadlock condition
    const currentPlayer = game.getCurrentPlayer()
    if (!currentPlayer.isHuman) {
      // Use synchronous AI decision for testing
      const decision = game.decideAITurn()
      if (decision) {
        const success = game.applyAIAction(decision)
        console.log(`Turn ${turnCount + 1}: ${currentPlayer.name} ${decision.action}${decision.cardId ? ` (${decision.cardId})` : ''} - ${success ? 'SUCCESS' : 'FAILED'}`)
      } else {
        console.log(`Turn ${turnCount + 1}: ${currentPlayer.name} could not decide`)
      }
    } else {
      // For human player, just draw a card to continue
      const result = game.drawCard(currentPlayer.id)
      console.log(`Turn ${turnCount + 1}: ${currentPlayer.name} drew card - ${result ? 'SUCCESS' : 'FAILED'}`)
    }
    
    turnCount++
    
    // Check if game ended
    if (game.isGameOver()) {
      console.log('Game ended normally before deadlock could be created')
      return false
    }
  }
  
  console.log('Reached maximum turns without creating deadlock scenario')
  return false
}

// Function to test the force reshuffle deadlock resolution
function testForceReshuffleResolution() {
  console.log('\n🔄 Testing force reshuffle deadlock resolution...')
  
  // Create a new game with force_reshuffle resolution
  const reshuffleGame = new UnoGame(['Alice', 'Bob'], 0, {
    debugMode: true,
    deadlockResolution: 'force_reshuffle',
    aiDifficulty: 'normal'
  })
  
  // Try to create a deadlock scenario
  let turnCount = 0
  const maxTurns = 20
  
  while (turnCount < maxTurns) {
    const currentState = reshuffleGame.getState()
    
    // Check for deadlock condition
    if (currentState.gameState.deckCount === 0 && currentState.gameState.discardPile.length <= 1) {
      const currentPlayer = reshuffleGame.getCurrentPlayer()
      const topCard = reshuffleGame.getTopCard()
      
      if (topCard) {
        const playableCards = currentPlayer.getPlayableCards(topCard, reshuffleGame.getWildColor())
        
        if (playableCards.length === 0) {
          console.log('🎯 Testing force reshuffle deadlock resolution...')
          const result = reshuffleGame.drawCard(currentPlayer.id)
          console.log(`Draw result: ${result ? 'SUCCESS' : 'FAILED'}`)
          
          const newState = reshuffleGame.getState()
          console.log(`Deck count after resolution: ${newState.gameState.deckCount}`)
          console.log(`Discard pile count after resolution: ${newState.gameState.discardPile.length}`)
          
          if (newState.gameState.deckCount > 0) {
            console.log('✅ SUCCESS: Force reshuffle deadlock resolution worked!')
            return true
          } else {
            console.log('❌ FAILURE: Force reshuffle did not work properly')
            return false
          }
        }
      }
    }
    
    // Continue game
    const currentPlayer = reshuffleGame.getCurrentPlayer()
    if (!currentPlayer.isHuman) {
      const decision = reshuffleGame.decideAITurn()
      if (decision) {
        reshuffleGame.applyAIAction(decision)
      }
    } else {
      reshuffleGame.drawCard(currentPlayer.id)
    }
    
    turnCount++
    
    if (reshuffleGame.isGameOver()) {
      console.log('Game ended before testing force reshuffle')
      return false
    }
  }
  
  console.log('Could not test force reshuffle resolution')
  return false
}

// Run the tests
try {
  console.log('\n🧪 Running deadlock fix tests...')
  
  // Test 1: End round deadlock resolution
  const test1Result = createDeadlockScenario()
  
  // Test 2: Force reshuffle deadlock resolution
  const test2Result = testForceReshuffleResolution()
  
  console.log('\n📊 Test Results:')
  console.log(`End round deadlock resolution: ${test1Result ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Force reshuffle deadlock resolution: ${test2Result ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (test1Result && test2Result) {
    console.log('\n🎉 ALL TESTS PASSED! The critical AI loop issue has been fixed.')
  } else {
    console.log('\n⚠️  Some tests failed. The fix may need further investigation.')
  }
  
} catch (error) {
  console.error('\n💥 ERROR during deadlock fix test:', error.message)
  console.error(error.stack)
}

console.log('\n🏁 Deadlock fix test completed')
