const { UnoGame } = require('../dist/uno-engine.js');

// Test to verify UNO flag reset in a real game scenario
function testRealGameUnoReset() {
  console.log('🎮 Testing UNO flag reset in real game scenario...');
  
  // Create a game with two AI players
  const game = new UnoGame(['Player A', 'Player B'], -1, {
    debugMode: false,
    aiDifficulty: 'expert'
  });
  
  const playerA = game.getPlayers()[0];
  const playerB = game.getPlayers()[1];
  
  console.log(`Game started: Player A has ${playerA.getHandSize()} cards, Player B has ${playerB.getHandSize()} cards`);
  
  // Track UNO events
  let playerAUnoCalled = false;
  let playerAUnoReset = false;
  
  const originalEmitEvent = game.emitEvent;
  game.emitEvent = function(eventName, ...args) {
    if (eventName === 'onUnoCalled') {
      const player = args[0];
      if (player.id === playerA.id) {
        playerAUnoCalled = true;
        console.log(`🎉 ${player.name} called UNO!`);
      }
    }
    originalEmitEvent.call(this, eventName, ...args);
  };
  
  // Simulate game until Player A gets to 2 cards
  let turnCount = 0;
  const maxTurns = 100;
  
  while (turnCount < maxTurns && playerA.getHandSize() > 2) {
    turnCount++;
    const currentPlayer = game.getCurrentPlayer();
    const topCard = game.getTopCard();
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
    
    if (playableCards.length > 0) {
      const cardToPlay = playableCards[0];
      const willHaveOneCard = currentPlayer.getHandSize() === 2;
      game.playCard(currentPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
    } else {
      game.drawCard(currentPlayer.id);
    }
  }
  
  console.log(`After ${turnCount} turns: Player A has ${playerA.getHandSize()} cards`);
  
  if (playerA.getHandSize() !== 2) {
    console.log('❌ FAIL: Could not get Player A to exactly 2 cards');
    return false;
  }
  
  // Player A plays one card and calls UNO
  const topCard = game.getTopCard();
  const playableCards = playerA.getPlayableCards(topCard, game.getWildColor() || undefined);
  
  if (playableCards.length === 0) {
    console.log('❌ FAIL: Player A has no playable cards');
    return false;
  }
  
  const cardToPlay = playableCards[0];
  console.log(`Player A playing ${cardToPlay.color} ${cardToPlay.value} and calling UNO`);
  
  const success = game.playCard(playerA.id, cardToPlay.id, undefined, true);
  
  if (!success) {
    console.log('❌ FAIL: Player A failed to play card');
    return false;
  }
  
  console.log(`Player A now has ${playerA.getHandSize()} cards`);
  console.log(`Player A hasCalledUno: ${playerA.getHasCalledUno()}`);
  
  if (playerA.getHandSize() !== 1 || !playerA.getHasCalledUno()) {
    console.log('❌ FAIL: Player A should have 1 card and called UNO');
    return false;
  }
  
  console.log('✅ Player A successfully called UNO with 1 card');
  
  // Now Player B plays a Draw Two card
  console.log('\n--- Player B playing Draw Two to force Player A to draw ---');
  
  // Get to Player B's turn
  while (game.getCurrentPlayer().id !== playerB.id && turnCount < maxTurns) {
    turnCount++;
    const currentPlayer = game.getCurrentPlayer();
    const topCard = game.getTopCard();
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
    
    if (playableCards.length > 0) {
      const cardToPlay = playableCards[0];
      game.playCard(currentPlayer.id, cardToPlay.id);
    } else {
      game.drawCard(currentPlayer.id);
    }
  }
  
  if (game.getCurrentPlayer().id !== playerB.id) {
    console.log('❌ FAIL: Could not get to Player B\'s turn');
    return false;
  }
  
  // Find a Draw Two card in Player B's hand
  const playerBHand = playerB.getHand();
  const drawTwoCard = playerBHand.find(card => card.value === 'Draw Two');
  
  if (!drawTwoCard) {
    console.log('❌ FAIL: Player B does not have a Draw Two card');
    console.log('Player B cards:', playerBHand.map(c => `${c.color} ${c.value}`));
    return false;
  }
  
  console.log(`Player B playing ${drawTwoCard.color} ${drawTwoCard.value}`);
  const drawTwoSuccess = game.playCard(playerB.id, drawTwoCard.id);
  
  if (!drawTwoSuccess) {
    console.log('❌ FAIL: Player B failed to play Draw Two card');
    return false;
  }
  
  // Check if Player A's UNO flag was reset
  console.log(`\n--- After Draw Two ---`);
  console.log(`Player A hand size: ${playerA.getHandSize()}`);
  console.log(`Player A hasCalledUno: ${playerA.getHasCalledUno()}`);
  
  let allTestsPassed = true;
  
  // Test 1: Player A should have 3 cards
  if (playerA.getHandSize() === 3) {
    console.log('✅ PASS: Player A correctly has 3 cards after Draw Two');
  } else {
    console.log(`❌ FAIL: Player A should have 3 cards, but has ${playerA.getHandSize()}`);
    allTestsPassed = false;
  }
  
  // Test 2: hasCalledUno should be false
  if (!playerA.getHasCalledUno()) {
    console.log('✅ PASS: Player A hasCalledUno correctly reset to false after forced draw');
  } else {
    console.log('❌ FAIL: Player A hasCalledUno should be false after forced draw');
    allTestsPassed = false;
  }
  
  // Test 3: Player A should not be in a valid UNO state
  if (!playerA.isUnoCallValid()) {
    console.log('✅ PASS: Player A is correctly not in a valid UNO state');
  } else {
    console.log('❌ FAIL: Player A should not be in a valid UNO state');
    allTestsPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! UNO flag reset fix works in real game scenario.');
    console.log('✅ The hasCalledUno flag is properly reset when a player is forced to draw in a real game.');
  } else {
    console.log('❌ SOME TESTS FAILED! The UNO flag reset fix may not be working in real game scenario.');
  }
  console.log('='.repeat(60));
  
  return allTestsPassed;
}

// Run the test
if (require.main === module) {
  const result = testRealGameUnoReset();
  process.exit(result ? 0 : 1);
}

module.exports = { testRealGameUnoReset };
