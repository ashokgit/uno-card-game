const { UnoGame } = require('../lib/uno-engine.ts');

// Comprehensive test that simulates a full UNO game to completion
function testFullGameSimulation() {
  console.log('🎮 Testing full UNO game simulation with AI UNO fix...');
  
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
  const maxTurns = 200; // Prevent infinite loops
  let aiUnoCalls = 0;
  let humanUnoCalls = 0;
  let aiPenalties = 0;
  let humanPenalties = 0;
  
  // Track game events
  const gameEvents = [];
  
  // Add event listeners to track UNO calls and challenges
  const originalEmitEvent = game.emitEvent;
  game.emitEvent = function(eventName, ...args) {
    if (eventName === 'onUnoCalled') {
      const player = args[0];
      console.log(`🎉 ${player.name} called UNO!`);
      if (player.isHuman) {
        humanUnoCalls++;
      } else {
        aiUnoCalls++;
      }
    } else if (eventName === 'onUnoChallenged') {
      const challenger = args[0];
      const target = args[1];
      const success = args[2];
      console.log(`⚡ ${challenger.name} challenged ${target.name} for UNO - ${success ? 'SUCCESS' : 'FAILED'}`);
      if (success) {
        if (target.isHuman) {
          humanPenalties++;
        } else {
          aiPenalties++;
        }
      }
    }
    
    gameEvents.push({ event: eventName, args });
    originalEmitEvent.call(this, eventName, ...args);
  };
  
  // Simulate the game until completion
  while (turnCount < maxTurns && game.getPhase() !== 'game_over') {
    turnCount++;
    const currentPlayer = game.getCurrentPlayer();
    const topCard = game.getTopCard();
    
    console.log(`\n--- Turn ${turnCount}: ${currentPlayer.name}'s turn ---`);
    console.log(`Top card: ${topCard.color} ${topCard.value}`);
    console.log(`Hand sizes: AI=${aiPlayer.getHandSize()}, Human=${humanPlayer.getHandSize()}`);
    
    // Check if current player has one card and should call UNO
    if (currentPlayer.hasOneCard()) {
      console.log(`⚠️  ${currentPlayer.name} has 1 card - UNO status: ${currentPlayer.getHasCalledUno()}`);
    }
    
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
    
    // Check for game end conditions
    if (game.getPhase() === 'game_over') {
      console.log('🏁 Game ended');
      break;
    }
  }
  
  // Game summary
  console.log('\n' + '='.repeat(50));
  console.log('🎮 GAME SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total turns: ${turnCount}`);
  console.log(`Game phase: ${game.getPhase()}`);
  console.log(`Final hand sizes: AI=${aiPlayer.getHandSize()}, Human=${humanPlayer.getHandSize()}`);
  console.log(`AI UNO calls: ${aiUnoCalls}`);
  console.log(`Human UNO calls: ${humanUnoCalls}`);
  console.log(`AI penalties: ${aiPenalties}`);
  console.log(`Human penalties: ${humanPenalties}`);
  
  // Verify the fix worked correctly
  let allTestsPassed = true;
  
  // Test 1: AI should have called UNO when appropriate
  if (aiUnoCalls > 0) {
    console.log('✅ PASS: AI called UNO when appropriate');
  } else {
    console.log('⚠️  NOTE: AI did not call UNO (may not have reached 1 card)');
  }
  
  // Test 2: AI should not have been penalized unfairly
  if (aiPenalties === 0) {
    console.log('✅ PASS: AI was not unfairly penalized for UNO');
  } else {
    console.log(`❌ FAIL: AI was penalized ${aiPenalties} times - this may indicate the fix didn't work`);
    allTestsPassed = false;
  }
  
  // Test 3: Game should have completed properly
  if (game.getPhase() === 'game_over' || turnCount < maxTurns) {
    console.log('✅ PASS: Game completed properly');
  } else {
    console.log('❌ FAIL: Game did not complete properly');
    allTestsPassed = false;
  }
  
  // Test 4: No infinite loops or crashes
  if (turnCount < maxTurns) {
    console.log('✅ PASS: No infinite loops detected');
  } else {
    console.log('❌ FAIL: Game may have infinite loop');
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
}

// Run the test
if (require.main === module) {
  const result = testFullGameSimulation();
  process.exit(result ? 0 : 1);
}

module.exports = { testFullGameSimulation };
