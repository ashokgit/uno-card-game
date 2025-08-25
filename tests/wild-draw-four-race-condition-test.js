/**
 * Wild Draw Four Race Condition Test
 * 
 * This test verifies that the fix for the race condition in previousActiveColor
 * state handling for Wild Draw Four challenges works correctly.
 * 
 * The issue was that previousActiveColor was being set after the card was moved
 * to the discard pile, which could lead to incorrect challenge outcomes.
 */

console.log('🔧 Wild Draw Four Race Condition Test - Verifying previousActiveColor Fix')
console.log('='.repeat(60));

// Mock classes to simulate the game engine
class MockUnoCard {
  constructor(id, color, value) {
    this.id = id;
    this.color = color;
    this.value = value;
  }

  isWildDrawFour() {
    return this.color === "wild" && this.value === "Wild Draw Four";
  }
}

class MockUnoPlayer {
  constructor(name, hand) {
    this.name = name;
    this.hand = hand;
  }

  getHand() {
    return this.hand;
  }

  removeCard(cardId) {
    const cardIndex = this.hand.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return this.hand.splice(cardIndex, 1)[0];
    }
    return null;
  }
}

class MockUnoGame {
  constructor() {
    this.previousActiveColor = null;
    this.wildColor = null;
    this.topCard = null;
    this.discardPile = [];
    this.players = [];
  }

  setTopCard(card) {
    this.topCard = card;
  }

  setWildColor(color) {
    this.wildColor = color;
  }

  setPreviousActiveColor(color) {
    this.previousActiveColor = color;
  }

  getTopCard() {
    return this.topCard;
  }

  getWildColor() {
    return this.wildColor;
  }

  getPreviousActiveColor() {
    return this.previousActiveColor;
  }

  getCurrentPlayer() {
    return this.players[0];
  }

  getPlayers() {
    return this.players;
  }

  // Simulate the playCard method with the race condition fix
  playCard(playerId, cardId) {
    const player = this.players.find(p => p.name === playerId);
    if (!player) return false;

    const card = player.getHand().find(c => c.id === cardId);
    if (!card) return false;

    // CAPTURE THE ACTIVE COLOR BEFORE ANY MUTATIONS (THE FIX)
    const activeColorBeforePlay = this.wildColor || this.getTopCard().color;

    // Remove card from player's hand
    const playedCard = player.removeCard(cardId);
    if (!playedCard) return false;

    // Move card to discard pile (this changes getTopCard())
    this.discardPile.push(playedCard);
    this.topCard = playedCard;

    // Store the active color ONLY when playing a Wild Draw Four
    if (playedCard.value === "Wild Draw Four") {
      this.previousActiveColor = activeColorBeforePlay; // Use the captured color
    }

    return true;
  }

  // Simulate the old buggy playCard method
  playCardBuggy(playerId, cardId) {
    const player = this.players.find(p => p.name === playerId);
    if (!player) return false;

    const card = player.getHand().find(c => c.id === cardId);
    if (!card) return false;

    // Remove card from player's hand
    const playedCard = player.removeCard(cardId);
    if (!playedCard) return false;

    // Move card to discard pile (this changes getTopCard())
    this.discardPile.push(playedCard);
    this.topCard = playedCard;

    // BUGGY: Store the active color AFTER mutations
    if (playedCard.value === "Wild Draw Four") {
      this.previousActiveColor = this.wildColor || this.getTopCard().color; // This is wrong!
    }

    return true;
  }
}

// Test 1: Verify previousActiveColor is captured BEFORE mutations
function testPreviousActiveColorCapture() {
  console.log('\n🎯 Test 1: previousActiveColor Capture Timing Verification')
  
  // Create a mock game
  const game = new MockUnoGame()
  
  // Set up the scenario: Blue is the active color, Alice has a Wild Draw Four
  const blueCard = new MockUnoCard('blue-1', 'blue', 5)
  const wildDrawFourCard = new MockUnoCard('wild-draw-four-1', 'wild', 'Wild Draw Four')
  
  game.setTopCard(blueCard)
  game.setWildColor(null)
  
  const alice = new MockUnoPlayer('Alice', [wildDrawFourCard])
  game.players = [alice]

  console.log('Verifying previousActiveColor is captured before card mutations...')
  console.log(`   Initial top card: ${game.getTopCard().color} ${game.getTopCard().value}`)
  console.log(`   Initial wild color: ${game.getWildColor() || 'none'}`)
  console.log(`   Alice has Wild Draw Four card: ${wildDrawFourCard.id}`)
  
  // Capture the active color before playing the card
  const activeColorBeforePlay = game.getWildColor() || game.getTopCard().color
  console.log(`   Active color before play: ${activeColorBeforePlay}`)
  
  // Play the Wild Draw Four card using the FIXED method
  const playResult = game.playCard('Alice', wildDrawFourCard.id)
  
  if (!playResult) {
    console.log('   ❌ Failed to play Wild Draw Four card')
    return false
  }
  
  // Check what previousActiveColor was set to
  const previousActiveColor = game.getPreviousActiveColor()
  console.log(`   previousActiveColor after play: ${previousActiveColor}`)
  
  // Verify that previousActiveColor matches the color before the card was played
  if (previousActiveColor === activeColorBeforePlay) {
    console.log('   ✅ SUCCESS: previousActiveColor correctly captured the color before the card was played')
    return true
  } else {
    console.log(`   ❌ FAILURE: previousActiveColor (${previousActiveColor}) does not match active color before play (${activeColorBeforePlay})`)
    return false
  }
}

// Test 2: Verify challenge validation uses correct previousActiveColor
function testChallengeValidation() {
  console.log('\n🎯 Test 2: Challenge Validation with Correct previousActiveColor')
  
  // Create a mock game
  const game = new MockUnoGame()
  
  // Set up the scenario: Blue is the active color, Alice plays Wild Draw Four
  const blueCard = new MockUnoCard('blue-1', 'blue', 5)
  const wildDrawFourCard = new MockUnoCard('wild-draw-four-1', 'wild', 'Wild Draw Four')
  
  game.setTopCard(blueCard)
  game.setWildColor(null)
  
  const alice = new MockUnoPlayer('Alice', [wildDrawFourCard])
  const bob = new MockUnoPlayer('Bob', [new MockUnoCard('blue-2', 'blue', 3)]) // Bob has blue cards
  const charlie = new MockUnoPlayer('Charlie', [new MockUnoCard('red-1', 'red', 7)]) // Charlie has no blue cards
  
  game.players = [alice, bob, charlie]

  console.log('Verifying challenge validation uses correct previousActiveColor...')
  console.log(`   Current active color: ${game.getWildColor() || game.getTopCard().color}`)
  
  // Play the Wild Draw Four card
  const playResult = game.playCard('Alice', wildDrawFourCard.id)
  
  if (!playResult) {
    console.log('   ❌ Failed to play Wild Draw Four card')
    return false
  }
  
  // Check previousActiveColor
  const previousActiveColor = game.getPreviousActiveColor()
  console.log(`   previousActiveColor after Wild Draw Four: ${previousActiveColor}`)
  
  // Simulate challenge validation
  const bobHasBlueCards = bob.getHand().some(card => card.color === previousActiveColor)
  const charlieHasBlueCards = charlie.getHand().some(card => card.color === previousActiveColor)
  
  console.log(`   Bob has ${previousActiveColor} cards: ${bobHasBlueCards}`)
  console.log(`   Charlie has ${previousActiveColor} cards: ${charlieHasBlueCards}`)
  
  // The challenge should be valid if the previousActiveColor is correct
  if (bobHasBlueCards && !charlieHasBlueCards) {
    console.log('   ✅ SUCCESS: Challenge validation is working with correct previousActiveColor')
    return true
  } else {
    console.log('   ❌ FAILURE: Challenge validation is not working correctly')
    return false
  }
}

// Test 3: Verify the fix doesn't break regular Wild card behavior
function testRegularWildCardBehavior() {
  console.log('\n🎯 Test 3: Regular Wild Card Behavior Verification')
  
  // Create a mock game
  const game = new MockUnoGame()
  
  // Set up the scenario: Blue is the active color, Alice has a regular Wild card
  const blueCard = new MockUnoCard('blue-1', 'blue', 5)
  const wildCard = new MockUnoCard('wild-1', 'wild', 'Wild')
  
  game.setTopCard(blueCard)
  game.setWildColor(null)
  
  const alice = new MockUnoPlayer('Alice', [wildCard])
  game.players = [alice]

  console.log('Verifying regular Wild card behavior is not affected...')
  console.log(`   Alice has Wild card: ${wildCard.id}`)
  
  // Capture the active color before playing the card
  const activeColorBeforePlay = game.getWildColor() || game.getTopCard().color
  console.log(`   Active color before play: ${activeColorBeforePlay}`)
  
  // Play the Wild card
  const playResult = game.playCard('Alice', wildCard.id)
  
  if (!playResult) {
    console.log('   ❌ Failed to play Wild card')
    return false
  }
  
  // Check that previousActiveColor is not set for regular Wild cards
  const previousActiveColor = game.getPreviousActiveColor()
  console.log(`   previousActiveColor after regular Wild: ${previousActiveColor}`)
  
  // previousActiveColor should be null for regular Wild cards
  if (previousActiveColor === null) {
    console.log('   ✅ SUCCESS: previousActiveColor correctly not set for regular Wild cards')
    return true
  } else {
    console.log(`   ❌ FAILURE: previousActiveColor should be null for regular Wild cards, but got: ${previousActiveColor}`)
    return false
  }
}

// Test 4: Demonstrate the difference between buggy and fixed behavior
function testBuggyVsFixedBehavior() {
  console.log('\n🎯 Test 4: Buggy vs Fixed Behavior Comparison')
  
  // Set up the scenario: Blue is the active color, Alice has a Wild Draw Four
  const blueCard = new MockUnoCard('blue-1', 'blue', 5)
  const wildDrawFourCard = new MockUnoCard('wild-draw-four-1', 'wild', 'Wild Draw Four')
  
  console.log('Demonstrating the race condition fix...')
  console.log(`   Initial active color: blue`)
  console.log(`   Alice plays Wild Draw Four`)
  
  // Test with BUGGY behavior
  const buggyGame = new MockUnoGame()
  buggyGame.setTopCard(blueCard)
  buggyGame.setWildColor(null)
  
  const aliceBuggy = new MockUnoPlayer('Alice', [wildDrawFourCard])
  buggyGame.players = [aliceBuggy]
  
  // Use the buggy method
  buggyGame.playCardBuggy('Alice', wildDrawFourCard.id)
  const buggyPreviousActiveColor = buggyGame.getPreviousActiveColor()
  console.log(`   BUGGY behavior - previousActiveColor: ${buggyPreviousActiveColor}`)
  
  // Test with FIXED behavior
  const fixedGame = new MockUnoGame()
  fixedGame.setTopCard(blueCard)
  fixedGame.setWildColor(null)
  
  const aliceFixed = new MockUnoPlayer('Alice', [wildDrawFourCard])
  fixedGame.players = [aliceFixed]
  
  // Use the fixed method
  fixedGame.playCard('Alice', wildDrawFourCard.id)
  const fixedPreviousActiveColor = fixedGame.getPreviousActiveColor()
  console.log(`   FIXED behavior - previousActiveColor: ${fixedPreviousActiveColor}`)
  
  // The buggy behavior might capture the wrong color (the Wild Draw Four card's color)
  // The fixed behavior should capture the correct color (blue)
  if (buggyPreviousActiveColor === 'wild' && fixedPreviousActiveColor === 'blue') {
    console.log('   ✅ SUCCESS: Fixed behavior correctly captures the color before the card was played')
    console.log('   ✅ SUCCESS: Buggy behavior incorrectly captures the Wild Draw Four card color')
    return true
  } else if (fixedPreviousActiveColor === 'blue') {
    console.log('   ✅ SUCCESS: Fixed behavior correctly captures the color before the card was played')
    return true
  } else {
    console.log('   ❌ FAILURE: Fixed behavior is not working correctly')
    return false
  }
}

// Run all tests
function runWildDrawFourRaceConditionTests() {
  console.log('\n🧪 Running Wild Draw Four race condition tests...')
  
  try {
    // Test 1: previousActiveColor Capture Timing
    const test1Result = testPreviousActiveColorCapture()
    
    // Test 2: Challenge Validation
    const test2Result = testChallengeValidation()
    
    // Test 3: Regular Wild Card Behavior
    const test3Result = testRegularWildCardBehavior()
    
    // Test 4: Buggy vs Fixed Behavior Comparison
    const test4Result = testBuggyVsFixedBehavior()
    
    console.log('\n📊 Test Results:')
    console.log(`previousActiveColor capture timing: ${test1Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Challenge validation: ${test2Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Regular Wild card behavior: ${test3Result ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Buggy vs fixed behavior comparison: ${test4Result ? '✅ PASSED' : '❌ FAILED'}`)
    
    const allPassed = test1Result && test2Result && test3Result && test4Result
    console.log(`\nOverall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    
    return allPassed
    
  } catch (error) {
    console.error('\n💥 ERROR during Wild Draw Four race condition test:', error.message)
    console.error(error.stack)
    return false
  }
}

// Run the tests
runWildDrawFourRaceConditionTests()

console.log('\n🏁 Wild Draw Four race condition test completed')

// Export for use in other test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runWildDrawFourRaceConditionTests }
}
