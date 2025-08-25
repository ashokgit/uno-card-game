const { UnoPlayer, UnoCard } = require('../dist/uno-engine.js');

// Test to verify that hasCalledUno flag is reset when a player who called UNO is forced to draw
function testForcedDrawUnoReset() {
  console.log('🎯 Testing UNO flag reset after forced draw...');
  
  // Create a player
  const player = new UnoPlayer('player1', 'Player A', false);
  
  // Create some test cards
  const card1 = new UnoCard('red', '5');
  const card2 = new UnoCard('blue', '7');
  const card3 = new UnoCard('green', '3');
  const card4 = new UnoCard('yellow', '1');
  
  console.log('Step 1: Adding initial cards to player');
  player.addCards([card1, card2, card3]);
  console.log(`Player hand size: ${player.getHandSize()}`);
  console.log(`Player hasCalledUno: ${player.getHasCalledUno()}`);
  
  // Step 2: Remove one card to get to exactly 2 cards
  console.log('\nStep 2: Removing one card to get to 2 cards');
  player.removeCard(card1.id);
  console.log(`Player hand size: ${player.getHandSize()}`);
  console.log(`Player hasCalledUno: ${player.getHasCalledUno()}`);
  
  // Step 3: Remove one more card and call UNO (player now has 1 card)
  console.log('\nStep 3: Removing one more card and calling UNO');
  player.removeCard(card2.id);
  player.callUno();
  console.log(`Player hand size: ${player.getHandSize()}`);
  console.log(`Player hasCalledUno: ${player.getHasCalledUno()}`);
  
  // Verify player has called UNO with 1 card
  if (player.getHandSize() !== 1) {
    console.log('❌ FAIL: Player should have exactly 1 card');
    return false;
  }
  
  if (!player.getHasCalledUno()) {
    console.log('❌ FAIL: Player should have called UNO');
    return false;
  }
  
  console.log('✅ Player successfully called UNO with 1 card');
  
  // Step 4: Simulate forced draw (like from Draw Two or Wild Draw Four)
  console.log('\nStep 4: Simulating forced draw (Draw Two penalty)');
  const forcedCard1 = new UnoCard('red', '8');
  const forcedCard2 = new UnoCard('blue', '9');
  
  console.log(`Before forced draw - Player hand size: ${player.getHandSize()}, hasCalledUno: ${player.getHasCalledUno()}`);
  
  // This is the critical test - addCards should reset hasCalledUno when hand size > 1
  player.addCards([forcedCard1, forcedCard2]);
  
  console.log(`After forced draw - Player hand size: ${player.getHandSize()}, hasCalledUno: ${player.getHasCalledUno()}`);
  
  // Test the critical fix: hasCalledUno should be false after forced draw
  let allTestsPassed = true;
  
  // Test 1: Player should have 3 cards (1 original + 2 from forced draw)
  if (player.getHandSize() === 3) {
    console.log('✅ PASS: Player correctly has 3 cards after forced draw');
  } else {
    console.log(`❌ FAIL: Player should have 3 cards, but has ${player.getHandSize()}`);
    allTestsPassed = false;
  }
  
  // Test 2: hasCalledUno should be false (this is the critical fix)
  if (!player.getHasCalledUno()) {
    console.log('✅ PASS: Player hasCalledUno correctly reset to false after forced draw');
  } else {
    console.log('❌ FAIL: Player hasCalledUno should be false after forced draw');
    allTestsPassed = false;
  }
  
  // Test 3: Player should not be in a valid UNO state
  if (!player.isUnoCallValid()) {
    console.log('✅ PASS: Player is correctly not in a valid UNO state');
  } else {
    console.log('❌ FAIL: Player should not be in a valid UNO state');
    allTestsPassed = false;
  }
  
  // Test 4: Player should not be penalized for UNO (since they have multiple cards)
  if (!player.shouldBePenalizedForUno()) {
    console.log('✅ PASS: Player should not be penalized for UNO (has multiple cards)');
  } else {
    console.log('❌ FAIL: Player should not be penalized for UNO');
    allTestsPassed = false;
  }
  
  // Test 5: Test edge case - adding cards when already having multiple cards
  console.log('\nStep 5: Testing edge case - adding cards when already having multiple cards');
  const extraCard = new UnoCard('green', '2');
  const beforeExtraCard = player.getHasCalledUno();
  player.addCards([extraCard]);
  const afterExtraCard = player.getHasCalledUno();
  
  if (beforeExtraCard === afterExtraCard) {
    console.log('✅ PASS: Adding cards when already having multiple cards preserves UNO state');
  } else {
    console.log('❌ FAIL: Adding cards when already having multiple cards should not change UNO state');
    allTestsPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! UNO flag reset fix is working correctly.');
    console.log('✅ The hasCalledUno flag is properly reset when a player is forced to draw.');
  } else {
    console.log('❌ SOME TESTS FAILED! The UNO flag reset fix may not be working.');
  }
  console.log('='.repeat(60));
  
  return allTestsPassed;
}

// Run the test
if (require.main === module) {
  const result = testForcedDrawUnoReset();
  process.exit(result ? 0 : 1);
}

module.exports = { testForcedDrawUnoReset };
