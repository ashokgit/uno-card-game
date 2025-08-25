const { UnoGame } = require('../lib/uno-engine.ts');

// Focused test to specifically verify AI UNO calling behavior
function testAIUnoSpecificBehavior() {
  console.log('🎯 Testing AI UNO calling behavior specifically...');
  
  // Create a game with one AI player and one human player
  const game = new UnoGame(['AI Player', 'Human Player'], 1, {
    debugMode: false,
    aiDifficulty: 'expert'
  });
  
  // Get the players
  const aiPlayer = game.getPlayers()[0];
  const humanPlayer = game.getPlayers()[1];
  
  console.log(`Game started: AI has ${aiPlayer.getHandSize()} cards, Human has ${humanPlayer.getHandSize()} cards`);
  
  let turnCount = 0;
  const maxTurns = 100;
  let aiUnoCalls = 0;
  let aiPenalties = 0;
  
  // Track UNO events
  const originalEmitEvent = game.emitEvent;
  game.emitEvent = function(eventName, ...args) {
    if (eventName === 'onUnoCalled') {
      const player = args[0];
      console.log(`🎉 ${player.name} called UNO!`);
      if (!player.isHuman) {
        aiUnoCalls++;
      }
    } else if (eventName === 'onUnoChallenged') {
      const challenger = args[0];
      const target = args[1];
      const success = args[2];
      console.log(`⚡ ${challenger.name} challenged ${target.name} for UNO - ${success ? 'SUCCESS' : 'FAILED'}`);
      if (success && !target.isHuman) {
        aiPenalties++;
      }
    }
    
    originalEmitEvent.call(this, eventName, ...args);
  };
  
  // Simulate game until AI gets to 2 cards
  while (turnCount < maxTurns && aiPlayer.getHandSize() > 2) {
    turnCount++;
    const currentPlayer = game.getCurrentPlayer();
    const topCard = game.getTopCard();
    
    console.log(`\n--- Turn ${turnCount}: ${currentPlayer.name}'s turn (AI has ${aiPlayer.getHandSize()} cards) ---`);
    
    // Get playable cards
    const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
    
    if (playableCards.length > 0) {
      // Player can play a card
      const cardToPlay = playableCards[0];
      console.log(`${currentPlayer.name} playing ${cardToPlay.color} ${cardToPlay.value}`);
      
      // Determine if this play will leave the player with one card (for UNO calling)
      const willHaveOneCard = currentPlayer.getHandSize() === 2;
      
      if (willHaveOneCard) {
        console.log(`🎯 ${currentPlayer.name} will have 1 card after this play - should call UNO`);
      }
      
      const success = game.playCard(currentPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
      
      if (success) {
        console.log(`✅ ${currentPlayer.name} played successfully`);
        
        // Check if player won
        if (currentPlayer.isEmpty()) {
          console.log(`🏆 ${currentPlayer.name} WINS THE GAME!`);
          break;
        }
        
        // Check UNO status after play
        if (currentPlayer.hasOneCard()) {
          console.log(`📢 ${currentPlayer.name} UNO status after play: ${currentPlayer.getHasCalledUno()}`);
        }
      } else {
        console.log(`❌ ${currentPlayer.name} failed to play card`);
        break;
      }
    } else {
      // Player must draw
      console.log(`${currentPlayer.name} has no playable cards, drawing...`);
      const drawnCard = game.drawCard(currentPlayer.id);
      
      if (drawnCard) {
        console.log(`${currentPlayer.name} drew ${drawnCard.color} ${drawnCard.value}`);
        
        // Check if drawn card can be played
        if (drawnCard.canPlayOn(topCard, game.getWildColor() || undefined)) {
          console.log(`${currentPlayer.name} can play the drawn card`);
          const willHaveOneCard = currentPlayer.getHandSize() === 2;
          const success = game.playCard(currentPlayer.id, drawnCard.id, undefined, willHaveOneCard);
          
          if (success) {
            console.log(`✅ ${currentPlayer.name} played drawn card`);
            
            // Check if player won
            if (currentPlayer.isEmpty()) {
              console.log(`🏆 ${currentPlayer.name} WINS THE GAME!`);
              break;
            }
          }
        } else {
          console.log(`${currentPlayer.name} cannot play the drawn card`);
        }
      } else {
        console.log(`❌ ${currentPlayer.name} failed to draw card`);
        break;
      }
    }
  }
  
  console.log(`\n🎯 AI now has ${aiPlayer.getHandSize()} cards`);
  
  // Now test the specific scenario: AI plays second-to-last card
  if (aiPlayer.getHandSize() === 2) {
    console.log('\n🔍 Testing AI UNO call when playing second-to-last card...');
    
    // Wait for AI turn
    while (game.getCurrentPlayer().id !== aiPlayer.id && turnCount < maxTurns) {
      turnCount++;
      const currentPlayer = game.getCurrentPlayer();
      const topCard = game.getTopCard();
      const playableCards = currentPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        console.log(`${currentPlayer.name} playing ${playableCards[0].color} ${playableCards[0].value}`);
        game.playCard(currentPlayer.id, playableCards[0].id);
      } else {
        console.log(`${currentPlayer.name} drawing card`);
        game.drawCard(currentPlayer.id);
      }
    }
    
    if (game.getCurrentPlayer().id === aiPlayer.id) {
      const topCard = game.getTopCard();
      const playableCards = aiPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`AI playing ${cardToPlay.color} ${cardToPlay.value} (should call UNO)`);
        
        // This is the critical test - AI should call UNO when playing second-to-last card
        const willHaveOneCard = true; // AI will have one card after this play
        const success = game.playCard(aiPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
        
        if (success) {
          console.log(`✅ AI played successfully. New hand size: ${aiPlayer.getHandSize()}`);
          console.log(`AI has called UNO: ${aiPlayer.getHasCalledUno()}`);
          
          // Test results
          let allTestsPassed = true;
          
          // Test 1: AI should have called UNO
          if (aiUnoCalls > 0) {
            console.log('✅ PASS: AI called UNO when playing second-to-last card');
          } else {
            console.log('❌ FAIL: AI did not call UNO');
            allTestsPassed = false;
          }
          
          // Test 2: AI's internal state should be updated
          if (aiPlayer.getHasCalledUno()) {
            console.log('✅ PASS: AI player state correctly updated with hasCalledUno = true');
          } else {
            console.log('❌ FAIL: AI player state not updated - hasCalledUno should be true');
            allTestsPassed = false;
          }
          
          // Test 3: AI should not be challengeable
          if (!aiPlayer.shouldBePenalizedForUno()) {
            console.log('✅ PASS: AI should not be penalized for UNO (correctly called)');
          } else {
            console.log('❌ FAIL: AI should not be penalized but is marked as should be penalized');
            allTestsPassed = false;
          }
          
          // Test 4: AI should not have been penalized
          if (aiPenalties === 0) {
            console.log('✅ PASS: AI was not penalized for UNO');
          } else {
            console.log(`❌ FAIL: AI was penalized ${aiPenalties} times`);
            allTestsPassed = false;
          }
          
          console.log('\n' + '='.repeat(50));
          if (allTestsPassed) {
            console.log('🎉 ALL TESTS PASSED! AI UNO fix is working correctly.');
          } else {
            console.log('❌ SOME TESTS FAILED! There may be issues with the fix.');
          }
          console.log('='.repeat(50));
          
          return allTestsPassed;
        } else {
          console.log('❌ FAIL: AI failed to play card');
          return false;
        }
      } else {
        console.log('❌ FAIL: AI has no playable cards when it should have 2 cards');
        return false;
      }
    } else {
      console.log('❌ FAIL: Could not get to AI turn');
      return false;
    }
  } else {
    console.log(`❌ FAIL: AI does not have 2 cards (has ${aiPlayer.getHandSize()})`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const result = testAIUnoSpecificBehavior();
  process.exit(result ? 0 : 1);
}

module.exports = { testAIUnoSpecificBehavior };
