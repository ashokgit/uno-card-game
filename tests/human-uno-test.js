const { UnoGame } = require('../lib/uno-engine.ts');

// Test to verify that human player UNO calling still works correctly
function testHumanUnoCalling() {
  console.log('🧪 Testing human player UNO calling functionality...');
  
  // Create a game with one human player and one AI player
  const game = new UnoGame(['Human Player', 'AI Player'], 0, {
    debugMode: false,
    aiDifficulty: 'expert'
  });
  
  // Get the human player (index 0) and AI player (index 1)
  const humanPlayer = game.getPlayers()[0];
  const aiPlayer = game.getPlayers()[1];
  
  console.log(`Initial setup: Human has ${humanPlayer.getHandSize()} cards, AI has ${aiPlayer.getHandSize()} cards`);
  
  // Manually set human to have exactly 2 cards for testing
  let humanHandSize = humanPlayer.getHandSize();
  let attempts = 0;
  const maxAttempts = 50;
  
  while (humanHandSize > 2 && attempts < maxAttempts) {
    attempts++;
    const currentPlayer = game.getCurrentPlayer();
    
    if (currentPlayer.id === humanPlayer.id) {
      // Human's turn - play a card
      const topCard = game.getTopCard();
      const playableCards = humanPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`Human playing ${cardToPlay.color} ${cardToPlay.value} (hand size: ${humanHandSize})`);
        
        // Human should NOT automatically call UNO (isUnoCall = false)
        const willHaveOneCard = false; // Human must manually call UNO
        const success = game.playCard(humanPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
        if (success) {
          humanHandSize = humanPlayer.getHandSize();
          console.log(`Human played successfully. New hand size: ${humanHandSize}`);
        } else {
          console.log('Human failed to play card');
          break;
        }
      } else {
        console.log('Human has no playable cards, drawing...');
        game.drawCard(humanPlayer.id);
        humanHandSize = humanPlayer.getHandSize();
      }
    } else {
      // AI's turn - play a simple card to keep the game moving
      const topCard = game.getTopCard();
      const playableCards = aiPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`AI playing ${cardToPlay.color} ${cardToPlay.value}`);
        game.playCard(aiPlayer.id, cardToPlay.id);
      } else {
        console.log('AI drawing card');
        game.drawCard(aiPlayer.id);
      }
    }
  }
  
  console.log(`\n🎯 Human now has ${humanHandSize} cards`);
  
  // Now test the critical scenario: Human plays second-to-last card WITHOUT calling UNO
  if (humanHandSize === 2) {
    console.log('\n🔍 Testing human player UNO call behavior...');
    
    // Wait for human turn
    while (game.getCurrentPlayer().id !== humanPlayer.id && attempts < maxAttempts) {
      attempts++;
      const currentPlayer = game.getCurrentPlayer();
      const topCard = game.getTopCard();
      const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        game.playCard(currentPlayer.id, playableCards[0].id);
      } else {
        game.drawCard(currentPlayer.id);
      }
    }
    
    if (game.getCurrentPlayer().id === humanPlayer.id) {
      const topCard = game.getTopCard();
      const playableCards = humanPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`Human playing ${cardToPlay.color} ${cardToPlay.value} (NOT calling UNO)`);
        
        // Human should NOT automatically call UNO
        const willHaveOneCard = false; // Human must manually call UNO
        const success = game.playCard(humanPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
        
        if (success) {
          console.log(`✅ Human played successfully. New hand size: ${humanPlayer.getHandSize()}`);
          console.log(`Human has called UNO: ${humanPlayer.getHasCalledUno()}`);
          
          // Test 1: Verify human's internal state is NOT updated (no automatic UNO call)
          if (!humanPlayer.getHasCalledUno()) {
            console.log('✅ PASS: Human player state correctly NOT updated (no automatic UNO call)');
          } else {
            console.log('❌ FAIL: Human player state incorrectly updated - should not auto-call UNO');
            return false;
          }
          
          // Test 2: Verify human should be challengeable (didn't call UNO)
          if (humanPlayer.shouldBePenalizedForUno()) {
            console.log('✅ PASS: Human should be penalized for UNO (did not call)');
          } else {
            console.log('❌ FAIL: Human should be penalized but is not marked as should be penalized');
            return false;
          }
          
          // Test 3: Verify UNO call is NOT valid
          if (!humanPlayer.isUnoCallValid()) {
            console.log('✅ PASS: Human UNO call is not valid (did not call)');
          } else {
            console.log('❌ FAIL: Human UNO call should not be valid but is marked as valid');
            return false;
          }
          
          console.log('\n🎉 All tests passed! Human UNO calling behavior is correct.');
          return true;
        } else {
          console.log('❌ FAIL: Human failed to play card');
          return false;
        }
      } else {
        console.log('❌ FAIL: Human has no playable cards when should have 2 cards');
        return false;
      }
    } else {
      console.log('❌ FAIL: Could not get to human turn');
      return false;
    }
  } else {
    console.log(`❌ FAIL: Human does not have 2 cards (has ${humanHandSize})`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const result = testHumanUnoCalling();
  process.exit(result ? 0 : 1);
}

module.exports = { testHumanUnoCalling };
