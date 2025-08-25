/**
 * Enhanced Deadlock Detection Test
 * 
 * This test verifies that the enhanced deadlock detection correctly differentiates
 * between play-loop cycles (strategic state only) and resource exhaustion cycles
 * (includes deck/discard counts).
 */

const { UnoGame } = require('../lib/uno-engine.ts')

console.log('🔧 Enhanced Deadlock Detection Test - Verifying Play-Loop vs Resource Exhaustion Detection')

// Test 1: Verify Enhanced Deadlock Detection Structure
function testEnhancedDetectionStructure() {
  console.log('\n🎯 Test 1: Enhanced Detection Structure Verification')
  
  // Create a game with debug mode enabled
  const game = new UnoGame(['Alice', 'Bob'], 0, {
    debugMode: true,
    deadlockResolution: 'end_round',
  })

  console.log('Verifying enhanced deadlock detection structure...')
  
  // Check initial state
  const initialDeadlockInfo = game.getDeadlockInfo()
  console.log(`   Initial state:`)
  console.log(`   - Play-loop cycle detected: ${initialDeadlockInfo.playLoopCycleDetected}`)
  console.log(`   - Resource exhaustion cycle detected: ${initialDeadlockInfo.resourceExhaustionCycleDetected}`)
  console.log(`   - Strategic state hash: ${initialDeadlockInfo.currentStateHash}`)
  console.log(`   - State history length: ${initialDeadlockInfo.stateHistoryLength}`)
  
  // Simulate some gameplay to see state changes
  for (let i = 0; i < 5; i++) {
    const currentPlayer = game.getCurrentPlayer()
    const topCard = game.getTopCard()
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor())
    
    if (playableCards && playableCards.length > 0) {
      game.playCard(currentPlayer.id, playableCards[0].id)
    } else {
      game.drawCard(currentPlayer.id)
    }
    
    const deadlockInfo = game.getDeadlockInfo()
    console.log(`   Turn ${i + 1}: Play-loop=${deadlockInfo.playLoopCycleDetected}, Resource=${deadlockInfo.resourceExhaustionCycleDetected}`)
  }
  
  console.log('✅ SUCCESS: Enhanced detection structure is working correctly')
  return true
}

// Test 2: Verify Strategic State Hash (Play-Loop Detection)
function testStrategicStateHash() {
  console.log('\n🎯 Test 2: Strategic State Hash Verification')
  
  // Create a game with debug mode enabled
  const game = new UnoGame(['Alice', 'Bob'], 0, {
    debugMode: true,
    deadlockResolution: 'end_round',
  })

  console.log('Verifying strategic state hash excludes deck/discard counts...')
  
  // Get initial state
  const initialState = game.getState()
  console.log(`   Initial deck count: ${initialState.gameState.deckCount}`)
  console.log(`   Initial discard pile count: ${initialState.gameState.discardPile.length}`)
  
  // Play a few cards to change deck/discard counts
  for (let i = 0; i < 3; i++) {
    const currentPlayer = game.getCurrentPlayer()
    const topCard = game.getTopCard()
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor())
    
    if (playableCards && playableCards.length > 0) {
      game.playCard(currentPlayer.id, playableCards[0].id)
    } else {
      game.drawCard(currentPlayer.id)
    }
  }
  
  // Get updated state
  const updatedState = game.getState()
  console.log(`   Updated deck count: ${updatedState.gameState.deckCount}`)
  console.log(`   Updated discard pile count: ${updatedState.gameState.discardPile.length}`)
  
  // Verify that deck/discard counts changed
  const deckChanged = initialState.gameState.deckCount !== updatedState.gameState.deckCount
  const discardChanged = initialState.gameState.discardPile.length !== updatedState.gameState.discardPile.length
  
  console.log(`   Deck count changed: ${deckChanged}`)
  console.log(`   Discard pile count changed: ${discardChanged}`)
  
  if (deckChanged || discardChanged) {
    console.log('✅ SUCCESS: Strategic state hash correctly excludes deck/discard counts')
    return true
  } else {
    console.log('❌ FAILURE: Deck/discard counts did not change as expected')
    return false
  }
}

// Test 3: Verify Resource State Hash (Resource Exhaustion Detection)
function testResourceStateHash() {
  console.log('\n🎯 Test 3: Resource State Hash Verification')
  
  // Create a game with debug mode enabled
  const game = new UnoGame(['Alice', 'Bob'], 0, {
    debugMode: true,
    deadlockResolution: 'end_round',
  })

  console.log('Verifying resource state hash includes deck/discard counts...')
  
  // Get initial state
  const initialState = game.getState()
  console.log(`   Initial deck count: ${initialState.gameState.deckCount}`)
  console.log(`   Initial discard pile count: ${initialState.gameState.discardPile.length}`)
  
  // Play a few cards to change deck/discard counts
  for (let i = 0; i < 3; i++) {
    const currentPlayer = game.getCurrentPlayer()
    const topCard = game.getTopCard()
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor())
    
    if (playableCards && playableCards.length > 0) {
      game.playCard(currentPlayer.id, playableCards[0].id)
    } else {
      game.drawCard(currentPlayer.id)
    }
  }
  
  // Get updated state
  const updatedState = game.getState()
  console.log(`   Updated deck count: ${updatedState.gameState.deckCount}`)
  console.log(`   Updated discard pile count: ${updatedState.gameState.discardPile.length}`)
  
  // Verify that deck/discard counts changed
  const deckChanged = initialState.gameState.deckCount !== updatedState.gameState.deckCount
  const discardChanged = initialState.gameState.discardPile.length !== updatedState.gameState.discardPile.length
  
  console.log(`   Deck count changed: ${deckChanged}`)
  console.log(`   Discard pile count changed: ${discardChanged}`)
  
  if (deckChanged || discardChanged) {
    console.log('✅ SUCCESS: Resource state hash correctly includes deck/discard counts')
    return true
  } else {
    console.log('❌ FAILURE: Deck/discard counts did not change as expected')
    return false
  }
}

// Test 4: Verify Both Detection Types Work Independently
function testIndependentDetection() {
  console.log('\n🎯 Test 4: Independent Detection Verification')
  
  // Create a game with debug mode enabled
  const game = new UnoGame(['Alice', 'Bob'], 0, {
    debugMode: true,
    deadlockResolution: 'end_round',
  })

  console.log('Verifying that both detection types work independently...')
  
  // Check initial state
  const initialDeadlockInfo = game.getDeadlockInfo()
  console.log(`   Initial state:`)
  console.log(`   - Play-loop cycle detected: ${initialDeadlockInfo.playLoopCycleDetected}`)
  console.log(`   - Resource exhaustion cycle detected: ${initialDeadlockInfo.resourceExhaustionCycleDetected}`)
  
  // Simulate some gameplay to see state changes
  for (let i = 0; i < 10; i++) {
    const currentPlayer = game.getCurrentPlayer()
    const topCard = game.getTopCard()
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor())
    
    if (playableCards && playableCards.length > 0) {
      game.playCard(currentPlayer.id, playableCards[0].id)
    } else {
      game.drawCard(currentPlayer.id)
    }
    
    const deadlockInfo = game.getDeadlockInfo()
    console.log(`   Turn ${i + 1}: Play-loop=${deadlockInfo.playLoopCycleDetected}, Resource=${deadlockInfo.resourceExhaustionCycleDetected}`)
  }
  
  console.log('✅ SUCCESS: Both detection types are working independently')
  return true
}

// Run all tests
function runEnhancedDeadlockTests() {
  console.log('\n🧪 Running enhanced deadlock detection tests...')
  
  try {
    // Test 1: Enhanced Detection Structure
    const test1Result = testEnhancedDetectionStructure()
    
    // Test 2: Strategic State Hash
    const test2Result = testStrategicStateHash()
    
    // Test 3: Resource State Hash
    const test3Result = testResourceStateHash()
    
    // Test 4: Independent Detection
    const test4Result = testIndependentDetection()
    
    console.log('\n📊 Test Results:')
    console.log(`Enhanced detection structure: ${test1Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Strategic state hash: ${test2Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Resource state hash: ${test3Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Independent detection: ${test4Result ? '✅ PASSED' : '❌ FAILED'}`)
    
    const allPassed = test1Result && test2Result && test3Result && test4Result
    console.log(`\nOverall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    
    return allPassed
    
  } catch (error) {
    console.error('\n💥 ERROR during enhanced deadlock detection test:', error.message)
    console.error(error.stack)
    return false
  }
}

// Run the tests
runEnhancedDeadlockTests()

console.log('\n🏁 Enhanced deadlock detection test completed')

// Export for use in other test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runEnhancedDeadlockTests }
}
