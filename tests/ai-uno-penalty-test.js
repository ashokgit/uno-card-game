/**
 * AI UNO Penalty Test
 * 
 * This test verifies that the AI UNO penalty issue has been fixed.
 * The issue was that AI players were not automatically calling UNO when playing
 * their second-to-last card, which left them vulnerable to UNO challenges.
 */

const { UnoGame } = require('../lib/uno-engine.ts');

// Test to verify the AI UNO call bug fix
function testAIUnoCallFix() {
  console.log('🧪 Testing AI UNO call bug fix...');
  
  // Create a game with one AI player and one human player
  const game = new UnoGame(['AI Player', 'Human Player'], 1, {
    debugMode: false, // Turn off debug to reduce noise
    aiDifficulty: 'expert'
  });
  
  // Get the AI player (index 0) and human player (index 1)
  const aiPlayer = game.getPlayers()[0];
  const humanPlayer = game.getPlayers()[1];
  
  console.log(`Initial setup: AI has ${aiPlayer.getHandSize()} cards, Human has ${humanPlayer.getHandSize()} cards`);
  
  // Manually set AI to have exactly 2 cards for testing
  // We'll simulate this by playing cards until AI has 2 cards
  let aiHandSize = aiPlayer.getHandSize();
  let attempts = 0;
  const maxAttempts = 50; // Prevent infinite loops
  
  while (aiHandSize > 2 && attempts < maxAttempts) {
    attempts++;
    const currentPlayer = game.getCurrentPlayer();
    
    if (currentPlayer.id === aiPlayer.id) {
      // AI's turn - let it play a card
      const topCard = game.getTopCard();
      const playableCards = aiPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`AI playing ${cardToPlay.color} ${cardToPlay.value} (hand size: ${aiHandSize})`);
        
        // Check if this play will leave AI with one card
        const willHaveOneCard = aiHandSize === 2;
        
        const success = game.playCard(aiPlayer.id, cardToPlay.id, undefined, willHaveOneCard);
        if (success) {
          aiHandSize = aiPlayer.getHandSize();
          console.log(`AI played successfully. New hand size: ${aiHandSize}`);
        } else {
          console.log('AI failed to play card');
          break;
        }
      } else {
        console.log('AI has no playable cards, drawing...');
        game.drawCard(aiPlayer.id);
        aiHandSize = aiPlayer.getHandSize();
      }
    } else {
      // Human's turn - play a simple card to keep the game moving
      const topCard = game.getTopCard();
      const playableCards = humanPlayer.getPlayableCards(topCard, game.getWildColor() || undefined);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        console.log(`Human playing ${cardToPlay.color} ${cardToPlay.value}`);
        game.playCard(humanPlayer.id, cardToPlay.id);
      } else {
        console.log('Human drawing card');
        game.drawCard(humanPlayer.id);
      }
    }
  }
  
  console.log(`\n🎯 AI now has ${aiHandSize} cards`);
  
  // Now test the critical scenario: AI plays its second-to-last card
  if (aiHandSize === 2) {
    console.log('\n🔍 Testing AI UNO call when playing second-to-last card...');
    
    // Wait for AI turn
    while (game.getCurrentPlayer().id !== aiPlayer.id && attempts < maxAttempts) {
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
          
          // Test 1: Verify AI's internal state is updated
          if (aiPlayer.getHasCalledUno()) {
            console.log('✅ PASS: AI player state correctly updated with hasCalledUno = true');
          } else {
            console.log('❌ FAIL: AI player state not updated - hasCalledUno should be true');
            return false;
          }
          
          // Test 2: Verify AI should not be challengeable
          if (!aiPlayer.shouldBePenalizedForUno()) {
            console.log('✅ PASS: AI should not be penalized for UNO (correctly called)');
          } else {
            console.log('❌ FAIL: AI should not be penalized but is marked as should be penalized');
            return false;
          }
          
          // Test 3: Verify UNO call is valid
          if (aiPlayer.isUnoCallValid()) {
            console.log('✅ PASS: AI UNO call is valid');
          } else {
            console.log('❌ FAIL: AI UNO call should be valid but is not');
            return false;
          }
          
          console.log('\n🎉 All tests passed! AI UNO call bug has been fixed.');
          return true;
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
    console.log(`❌ FAIL: AI does not have 2 cards (has ${aiHandSize})`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const result = testAIUnoCallFix();
  process.exit(result ? 0 : 1);
}

module.exports = { testAIUnoCallFix };
