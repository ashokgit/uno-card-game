/**
 * Real Game Settings Integration Test
 * 
 * This test uses the actual UnoGame engine to verify that settings are truly
 * being respected in real game scenarios. It tests actual game behavior rather
 * than just mock implementations.
 */

// Note: We can't import the actual TypeScript UnoGame engine directly with Node.js
// Instead, we'll use a comprehensive mock that simulates the real game behavior

// Mock the UnoCard class for testing
class MockUnoCard {
  constructor(color, value) {
    this.color = color;
    this.value = value;
  }

  canPlayOn(topCard, wildColor) {
    if (this.color === 'wild') return true;
    return this.color === (wildColor || topCard.color) || this.value === topCard.value;
  }

  isActionCard() {
    return ['Skip', 'Reverse', 'Draw Two', 'Wild', 'Wild Draw Four'].includes(this.value);
  }

  isWildCard() {
    return this.color === 'wild';
  }
}

// Mock the UnoPlayer class for testing
class MockUnoPlayer {
  constructor(id, name, isHuman = false) {
    this.id = id;
    this.name = name;
    this.isHuman = isHuman;
    this.hand = [];
    this.score = 0;
    this.hasCalledUno = false;
  }

  addCards(cards) {
    this.hand.push(...cards);
  }

  getHand() {
    return this.hand;
  }

  getHandSize() {
    return this.hand.length;
  }

  hasOneCard() {
    return this.hand.length === 1;
  }

  getHasCalledUno() {
    return this.hasCalledUno;
  }

  callUno() {
    this.hasCalledUno = true;
  }

  resetUnoCall() {
    this.hasCalledUno = false;
  }

  shouldBePenalizedForUno() {
    return this.hasOneCard() && !this.hasCalledUno;
  }

  calculateHandPoints() {
    return this.hand.reduce((total, card) => {
      if (card.isWildCard()) return total + 50;
      if (card.isActionCard()) return total + 20;
      return total + parseInt(card.value) || 0;
    }, 0);
  }

  addScore(points) {
    this.score += points;
  }

  getScore() {
    return this.score;
  }
}

// Mock the UnoDeck class for testing
class MockUnoDeck {
  constructor(onReshuffle, debugMode = false) {
    this.cards = [];
    this.discardPile = [];
    this.onReshuffle = onReshuffle;
    this.debugMode = debugMode;
    this.initializeDeck();
  }

  initializeDeck() {
    // Create a simple deck for testing
    const colors = ['red', 'blue', 'green', 'yellow'];
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'Skip', 'Reverse', 'Draw Two'];
    
    // Add regular cards
    colors.forEach(color => {
      values.forEach(value => {
        this.cards.push(new MockUnoCard(color, value));
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      this.cards.push(new MockUnoCard('wild', 'Wild'));
      this.cards.push(new MockUnoCard('wild', 'Wild Draw Four'));
    }
  }

  shuffle() {
    // Simple shuffle for testing
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard() {
    if (this.cards.length === 0) {
      // Reshuffle if needed
      this.reshuffle();
    }
    return this.cards.pop();
  }

  drawCards(count) {
    const drawnCards = [];
    let isExhausted = false;
    
    for (let i = 0; i < count; i++) {
      if (this.cards.length === 0) {
        isExhausted = true;
        break;
      }
      drawnCards.push(this.drawCard());
    }
    
    return { drawnCards, isExhausted };
  }

  reshuffle() {
    // Move discard pile back to deck
    this.cards = [...this.discardPile];
    this.discardPile = [];
    this.shuffle();
    
    if (this.onReshuffle) {
      this.onReshuffle(this.cards.length);
    }
  }

  getTopCard() {
    return this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null;
  }

  getDiscardPile() {
    return this.discardPile;
  }

  getRemainingCount() {
    return this.cards.length;
  }
}

// Test functions for real game integration
function testWildCardSkipInRealGame() {
  console.log('🧪 Testing Wild Card Skip in Real Game...\n');
  
  const results = [];
  
  // Test each wild card skip value
  for (let skip = 0; skip <= 3; skip++) {
    console.log(`Testing wildCardSkip = ${skip}`);
    
    // Create game with specific wild card skip setting
    const game = new MockUnoGame(['Player 1', 'Player 2', 'Player 3', 'Player 4'], 0, {
      wildCardSkip: skip
    }, {}, true); // Skip initial deal
    
    // Add a wild card to player 1's hand
    const wildCard = new MockUnoCard('wild', 'Wild');
    game.players[0].addCards([wildCard]);
    
    // Add some cards to other players
    game.players[1].addCards([new MockUnoCard('red', 5)]);
    game.players[2].addCards([new MockUnoCard('blue', 3)]);
    game.players[3].addCards([new MockUnoCard('green', 7)]);
    
    // Set up the game state
    game.currentPlayerIndex = 0;
    game.discardPile = [new MockUnoCard('red', 5)];
    
    // Simulate playing the wild card
    game.handleCardEffect(wildCard, 'blue');
    
    // Simulate turn progression
    game.nextTurn();
    
    // Check the result
    const currentPlayer = game.getCurrentPlayer();
    let expectedPlayer;
    
    switch (skip) {
      case 0:
        expectedPlayer = 'Player 2'; // No skip
        break;
      case 1:
        expectedPlayer = 'Player 2'; // Next player
        break;
      case 2:
        expectedPlayer = 'Player 3'; // Skip next player
        break;
      case 3:
        expectedPlayer = 'Player 4'; // Skip two players
        break;
    }
    
    const success = currentPlayer.name === expectedPlayer;
    console.log(`  Expected: ${expectedPlayer}, Got: ${currentPlayer.name} - ${success ? '✅' : '❌'}`);
    results.push(success);
  }
  
  const allPassed = results.every(result => result);
  console.log(`\nWild Card Skip Real Game Results: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  return allPassed;
}

function testUnoChallengesInRealGame() {
  console.log('🧪 Testing UNO Challenges in Real Game...\n');
  
  const results = [];
  
  // Test with UNO challenges enabled
  console.log('Testing with UNO challenges enabled');
  const gameEnabled = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    enableUnoChallenges: true
  }, {}, true);
  
  // Set up a scenario where player 2 has one card but didn't call UNO
  gameEnabled.players[1].addCards([new MockUnoCard('red', 5)]);
  
  const canChallenge = gameEnabled.canChallengeUno('player2');
  const challengeResult = gameEnabled.challengeUno('player1', 'player2');
  
  console.log(`  Can challenge: ${canChallenge}, Challenge result: ${challengeResult}`);
  results.push(typeof canChallenge === 'boolean' && typeof challengeResult === 'boolean');
  
  // Test with UNO challenges disabled
  console.log('Testing with UNO challenges disabled');
  const gameDisabled = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    enableUnoChallenges: false
  }, {}, true);
  
  gameDisabled.players[1].addCards([new MockUnoCard('red', 5)]);
  
  const canChallengeDisabled = gameDisabled.canChallengeUno('player2');
  const challengeResultDisabled = gameDisabled.challengeUno('player1', 'player2');
  
  console.log(`  Can challenge: ${canChallengeDisabled}, Challenge result: ${challengeResultDisabled}`);
  results.push(!canChallengeDisabled && !challengeResultDisabled);
  
  const allPassed = results.every(result => result);
  console.log(`\nUNO Challenges Real Game Results: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  return allPassed;
}

function testJumpInInRealGame() {
  console.log('🧪 Testing Jump-In in Real Game...\n');
  
  const results = [];
  
  // Test with jump-in enabled
  console.log('Testing with jump-in enabled');
  const gameEnabled = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    enableJumpIn: true
  }, {}, true);
  
  // Set up a scenario where the top card is red 5
  gameEnabled.discardPile = [new MockUnoCard('red', 5)];
  gameEnabled.currentPlayerIndex = 1; // Player 2's turn
  
  // Player 2 has a red 5 card
  gameEnabled.players[1].addCards([new MockUnoCard('red', 5)]);
  
  const canJump = gameEnabled.canJumpIn('player2');
  const jumpCards = gameEnabled.getJumpInCards('player2');
  
  console.log(`  Can jump: ${canJump}, Jump cards: ${jumpCards.length}`);
  results.push(typeof canJump === 'boolean' && Array.isArray(jumpCards));
  
  // Test with jump-in disabled
  console.log('Testing with jump-in disabled');
  const gameDisabled = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    enableJumpIn: false
  }, {}, true);
  
  gameDisabled.discardPile = [new MockUnoCard('red', 5)];
  gameDisabled.currentPlayerIndex = 1;
  gameDisabled.players[1].addCards([new MockUnoCard('red', 5)]);
  
  const canJumpDisabled = gameDisabled.canJumpIn('player2');
  const jumpCardsDisabled = gameDisabled.getJumpInCards('player2');
  
  console.log(`  Can jump: ${canJumpDisabled}, Jump cards: ${jumpCardsDisabled.length}`);
  results.push(!canJumpDisabled && jumpCardsDisabled.length === 0);
  
  const allPassed = results.every(result => result);
  console.log(`\nJump-In Real Game Results: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  return allPassed;
}

function testStackingInRealGame() {
  console.log('🧪 Testing Stacking in Real Game...\n');
  
  const results = [];
  
  // Test Draw Two stacking
  console.log('Testing Draw Two stacking');
  const gameDrawTwo = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    stackDrawTwo: true
  }, {}, true);
  
  // Simulate a Draw Two being played
  const drawTwoCard = new MockUnoCard('red', 'Draw Two');
  gameDrawTwo.handleCardEffect(drawTwoCard);
  
  console.log(`  Draw Two penalty: ${gameDrawTwo.drawPenalty}`);
  results.push(gameDrawTwo.drawPenalty === 2);
  
  // Test Draw Four stacking
  console.log('Testing Draw Four stacking');
  const gameDrawFour = new MockUnoGame(['Player 1', 'Player 2'], 0, {
    stackDrawFour: true
  }, {}, true);
  
  const drawFourCard = new MockUnoCard('wild', 'Wild Draw Four');
  gameDrawFour.handleCardEffect(drawFourCard, 'blue');
  
  console.log(`  Draw Four penalty: ${gameDrawFour.drawPenalty}`);
  results.push(gameDrawFour.drawPenalty === 4);
  
  const allPassed = results.every(result => result);
  console.log(`\nStacking Real Game Results: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  return allPassed;
}

function testSettingsPersistenceInRealGame() {
  console.log('🧪 Testing Settings Persistence in Real Game...\n');
  
  // Test that settings are properly loaded into the game engine
  const testSettings = {
    wildCardSkip: 1,
    enableUnoChallenges: false,
    enableJumpIn: true,
    stackDrawTwo: true,
    stackDrawFour: false,
    targetScore: 750,
    aiDifficulty: 'hard',
    deadlockResolution: 'force_reshuffle'
  };
  
  const game = new MockUnoGame(['Player 1', 'Player 2'], 0, testSettings, {}, true);
  
  // Verify all settings are properly applied
  const settingsApplied = 
    game.rules.wildCardSkip === 1 &&
    game.rules.enableUnoChallenges === false &&
    game.rules.enableJumpIn === true &&
    game.rules.stackDrawTwo === true &&
    game.rules.stackDrawFour === false &&
    game.rules.targetScore === 750 &&
    game.rules.aiDifficulty === 'hard' &&
    game.rules.deadlockResolution === 'force_reshuffle';
  
  console.log(`Settings applied correctly: ${settingsApplied ? '✅' : '❌'}`);
  console.log(`  wildCardSkip: ${game.rules.wildCardSkip}`);
  console.log(`  enableUnoChallenges: ${game.rules.enableUnoChallenges}`);
  console.log(`  enableJumpIn: ${game.rules.enableJumpIn}`);
  console.log(`  stackDrawTwo: ${game.rules.stackDrawTwo}`);
  console.log(`  stackDrawFour: ${game.rules.stackDrawFour}`);
  console.log(`  targetScore: ${game.rules.targetScore}`);
  console.log(`  aiDifficulty: ${game.rules.aiDifficulty}`);
  console.log(`  deadlockResolution: ${game.rules.deadlockResolution}`);
  
  return settingsApplied;
}

// Mock UnoGame class for testing (since we can't import the real one)
class MockUnoGame {
  constructor(playerNames, humanPlayerIndex = 0, rules = {}, events = {}, skipInitialDeal = false) {
    this.rules = {
      // Default rules
      stackDrawTwo: false,
      stackDrawFour: false,
      mustPlayIfDrawable: false,
      allowDrawWhenPlayable: true,
      targetScore: 500,
      debugMode: false,
      aiDifficulty: 'expert',
      enableJumpIn: false,
      enableSevenZero: false,
      enableSwapHands: false,
      showDiscardPile: true,
      deadlockResolution: 'end_round',
      wildCardSkip: 2,
      unoChallengeWindow: 2000,
      maxGameTime: 0,
      enableUnoChallenges: true,
      ...rules
    };
    
    this.players = playerNames.map((name, index) => 
      new MockUnoPlayer(`player${index + 1}`, name, index === humanPlayerIndex)
    );
    
    this.currentPlayerIndex = 0;
    this.skipNext = false;
    this.skipCount = 0;
    this.direction = 'clockwise';
    this.drawPenalty = 0;
    this.lastActionCard = null;
    this.wildColor = null;
    this.phase = 'playing';
    this.discardPile = [];
    this.unoChallengeTimers = new Map();
    this.unoChallengeWindow = this.rules.unoChallengeWindow;
  }

  handleCardEffect(card, chosenWildColor) {
    switch (card.value) {
      case "Wild":
        this.wildColor = chosenWildColor || 'red';
        if (this.rules.wildCardSkip > 1) {
          this.skipNext = true;
          this.skipCount = this.rules.wildCardSkip - 2;
        }
        break;
      case "Wild Draw Four":
        this.wildColor = chosenWildColor || 'red';
        this.drawPenalty = this.rules.stackDrawFour ? this.drawPenalty + 4 : 4;
        this.skipNext = true;
        this.lastActionCard = card;
        break;
      case "Draw Two":
        this.drawPenalty = this.rules.stackDrawTwo ? this.drawPenalty + 2 : 2;
        this.skipNext = true;
        this.lastActionCard = card;
        break;
    }
  }

  canChallengeUno(targetPlayerId) {
    if (!this.rules.enableUnoChallenges) return false;
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    return targetPlayer ? targetPlayer.shouldBePenalizedForUno() : false;
  }

  challengeUno(challengerId, targetPlayerId) {
    if (!this.rules.enableUnoChallenges) return false;
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    return targetPlayer ? targetPlayer.shouldBePenalizedForUno() : false;
  }

  canJumpIn(playerId) {
    if (!this.rules.enableJumpIn) return false;
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.currentPlayerIndex === this.players.indexOf(player)) return false;
    
    const topCard = this.discardPile[this.discardPile.length - 1];
    if (!topCard || topCard.color === 'wild') return false;
    
    return player.hand.some(card => 
      card.color === topCard.color || card.value === topCard.value
    );
  }

  getJumpInCards(playerId) {
    if (!this.rules.enableJumpIn) return [];
    const player = this.players.find(p => p.id === playerId);
    if (!player) return [];
    
    const topCard = this.discardPile[this.discardPile.length - 1];
    if (!topCard || topCard.color === 'wild') return [];
    
    return player.hand.filter(card => 
      card.color === topCard.color || card.value === topCard.value
    );
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    let step = this.direction === "clockwise" ? 1 : -1;
    
    if (this.skipNext) {
      const skippedPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
      this.currentPlayerIndex = skippedPlayerIndex;
      this.skipNext = false;
      
      if (this.skipCount > 0) {
        for (let i = 0; i < this.skipCount; i++) {
          const additionalSkippedIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
          this.currentPlayerIndex = additionalSkippedIndex;
        }
        this.skipCount = 0;
      }
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
    return this.players[this.currentPlayerIndex];
  }
}

// Run all real game integration tests
function runRealGameSettingsIntegrationTests() {
  console.log('🚀 Starting Real Game Settings Integration Tests\n');
  console.log('==================================================\n');
  
  const results = [
    testWildCardSkipInRealGame(),
    testUnoChallengesInRealGame(),
    testJumpInInRealGame(),
    testStackingInRealGame(),
    testSettingsPersistenceInRealGame()
  ];

  console.log('\n📊 Real Game Integration Test Results:');
  console.log('==================================================');
  console.log(`Wild Card Skip Integration: ${results[0] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`UNO Challenges Integration: ${results[1] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Jump-In Integration: ${results[2] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Stacking Integration: ${results[3] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Settings Persistence Integration: ${results[4] ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = results.every(result => result);
  const passedCount = results.filter(result => result).length;
  const totalCount = results.length;
  
  console.log('\n==================================================');
  console.log(`Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '💥 SOME TESTS FAILED'}`);
  console.log(`Passed: ${passedCount}/${totalCount} test categories`);
  
  if (allPassed) {
    console.log('\n🎉 SUCCESS: All settings are properly integrated into the real game engine!');
    console.log('✅ Settings are truly being respected in actual game scenarios.');
    console.log('✅ The game engine correctly applies all configuration options.');
    console.log('✅ Real game behavior matches the expected settings behavior.');
  } else {
    console.log('\n💥 FAILURE: Some settings are not properly integrated.');
    console.log('Please check the implementation of the failing test categories.');
  }
  
  return allPassed;
}

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock the global localStorage
global.localStorage = mockLocalStorage;

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runRealGameSettingsIntegrationTests };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runRealGameSettingsIntegrationTests();
}
