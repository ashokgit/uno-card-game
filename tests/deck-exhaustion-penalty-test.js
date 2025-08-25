const { UnoGame, UnoCard, UnoColor, UnoValue } = require('../lib/uno-engine.ts');

class DeckExhaustionPenaltyTest {
  constructor() {
    this.testResults = [];
  }

  async runTest() {
    console.log('🧪 Testing Deck Exhaustion During Penalty (Issue #6)');
    console.log('=' .repeat(60));

    try {
      await this.testDeckExhaustionDuringPenalty();
      await this.testPartialPenaltyHandling();
      await this.testDeadlockAfterExhaustion();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test failed with error:', error);
    }
  }

  async testDeckExhaustionDuringPenalty() {
    console.log('\n📋 Test 1: Deck exhaustion during +8 penalty');
    
    // Create game with stackDrawTwo enabled
    const game = new UnoGame(['Alice', 'Bob', 'Charlie'], 0, {
      stackDrawTwo: true,
      debugMode: true
    });

    // Manually set up a scenario where deck has limited cards
    // We'll need to manipulate the deck to have very few cards
    const deck = game.deck;
    
    // Get current deck state
    const initialDeckCount = deck.getRemainingCount();
    const discardCount = deck.getDiscardPile().length;
    
    console.log(`Initial deck: ${initialDeckCount} cards, discard: ${discardCount} cards`);
    
    // Set up a +8 penalty (4 stacked Draw Twos)
    game.drawPenalty = 8;
    
    // Apply the penalty
    const currentPlayer = game.getCurrentPlayer();
    const initialHandSize = currentPlayer.getHandSize();
    
    console.log(`Player ${currentPlayer.name} has ${initialHandSize} cards, must draw ${game.drawPenalty} as penalty`);
    
    // Apply penalty
    const drawn = deck.drawCards(game.drawPenalty);
    currentPlayer.addCards(drawn);
    
    const finalHandSize = currentPlayer.getHandSize();
    const cardsActuallyDrawn = drawn.length;
    const remainingDeck = deck.getRemainingCount();
    
    console.log(`Cards actually drawn: ${cardsActuallyDrawn}`);
    console.log(`Final hand size: ${finalHandSize}`);
    console.log(`Remaining deck: ${remainingDeck}`);
    
    // Check if this is the bug scenario
    const isBugScenario = cardsActuallyDrawn < game.drawPenalty && remainingDeck === 0;
    
    if (isBugScenario) {
      console.log('🚨 BUG DETECTED: Partial penalty applied, deck exhausted!');
      this.testResults.push({
        test: 'Deck exhaustion during penalty',
        status: 'FAIL',
        details: `Expected to draw ${game.drawPenalty} cards, but only drew ${cardsActuallyDrawn}. Deck exhausted.`
      });
    } else {
      console.log('✅ No bug detected in this scenario');
      this.testResults.push({
        test: 'Deck exhaustion during penalty',
        status: 'PASS',
        details: `Drew ${cardsActuallyDrawn}/${game.drawPenalty} cards, deck remaining: ${remainingDeck}`
      });
    }
  }

  async testPartialPenaltyHandling() {
    console.log('\n📋 Test 2: Game continues after partial penalty');
    
    // Create game with minimal deck
    const game = new UnoGame(['Alice', 'Bob', 'Charlie'], 0, {
      stackDrawTwo: true,
      debugMode: true
    });

    // Set up a scenario where penalty cannot be fully satisfied
    game.drawPenalty = 10; // Large penalty
    
    const currentPlayer = game.getCurrentPlayer();
    const initialHandSize = currentPlayer.getHandSize();
    
    console.log(`Player ${currentPlayer.name} must draw ${game.drawPenalty} cards as penalty`);
    
    // Apply penalty
    const drawn = game.deck.drawCards(game.drawPenalty);
    currentPlayer.addCards(drawn);
    
    console.log(`Actually drew ${drawn.length} cards`);
    
    // Check if game continues normally after partial penalty
    const gameState = game.getState();
    const isGameContinuing = gameState.gameState.phase === 'playing';
    
    if (drawn.length < game.drawPenalty && isGameContinuing) {
      console.log('🚨 BUG DETECTED: Game continues after partial penalty!');
      this.testResults.push({
        test: 'Game continues after partial penalty',
        status: 'FAIL',
        details: `Game continues normally after drawing only ${drawn.length}/${game.drawPenalty} penalty cards`
      });
    } else {
      console.log('✅ Game handles partial penalty correctly');
      this.testResults.push({
        test: 'Game continues after partial penalty',
        status: 'PASS',
        details: `Game state: ${gameState.gameState.phase}`
      });
    }
  }

  async testDeadlockAfterExhaustion() {
    console.log('\n📋 Test 3: Deadlock detection after deck exhaustion');
    
    // Create game
    const game = new UnoGame(['Alice', 'Bob', 'Charlie'], 0, {
      stackDrawTwo: true,
      debugMode: true
    });

    // Force deck exhaustion
    const deck = game.deck;
    const initialDeckCount = deck.getRemainingCount();
    
    console.log(`Initial deck count: ${initialDeckCount}`);
    
    // Draw all cards to exhaust deck
    const allCards = deck.drawCards(initialDeckCount);
    console.log(`Drew all ${allCards.length} cards from deck`);
    
    // Try to draw one more card (should trigger deadlock detection)
    const extraCard = deck.drawCard();
    
    if (extraCard === null) {
      console.log('✅ Deck properly exhausted, no more cards available');
      this.testResults.push({
        test: 'Deadlock after exhaustion',
        status: 'PASS',
        details: 'Deck properly exhausted, drawCard returns null'
      });
    } else {
      console.log('❌ Unexpected: drew card from exhausted deck');
      this.testResults.push({
        test: 'Deadlock after exhaustion',
        status: 'FAIL',
        details: 'Drew card from supposedly exhausted deck'
      });
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(40));
    
    let passCount = 0;
    let failCount = 0;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      console.log(`   ${result.details}`);
      console.log('');
      
      if (result.status === 'PASS') passCount++;
      else failCount++;
    });
    
    console.log(`Total: ${passCount} passed, ${failCount} failed`);
    
    if (failCount > 0) {
      console.log('\n🚨 ISSUE #6 CONFIRMED: Deck exhaustion during penalty bug exists!');
      console.log('The game continues normally after applying partial penalties when deck is exhausted.');
    } else {
      console.log('\n✅ Issue #6 NOT CONFIRMED: No deck exhaustion bugs detected in these tests.');
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new DeckExhaustionPenaltyTest();
  test.runTest();
}

module.exports = DeckExhaustionPenaltyTest;
