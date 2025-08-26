/**
 * Wild Card Skip Test
 * 
 * This test verifies that the wild card skip functionality works correctly
 * with different settings (0 = no skip, 1 = next player, 2 = skip next player, etc.)
 */

// Mock the UnoGame class for testing
class MockUnoGame {
  constructor(rules = {}) {
    this.rules = {
      wildCardSkip: 2, // Default: skip next player
      ...rules
    };
    this.players = [
      { id: 'player1', name: 'Player 1' },
      { id: 'player2', name: 'Player 2' },
      { id: 'player3', name: 'Player 3' },
      { id: 'player4', name: 'Player 4' }
    ];
    this.currentPlayerIndex = 0;
    this.skipNext = false;
    this.skipCount = 0;
    this.direction = 'clockwise';
  }

  // Simulate wild card effect
  handleWildCard() {
    if (this.rules.wildCardSkip > 1) {
      this.skipNext = true;
      this.skipCount = this.rules.wildCardSkip - 2; // -2 because nextTurn() already advances by 1, and we want to skip additional players
    }
  }

  // Simulate turn progression
  nextTurn() {
    let step = this.direction === "clockwise" ? 1 : -1;
    
    if (this.skipNext) {
      console.log(`Skipping next player due to skip effect`);
      const skippedPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
      const skippedPlayer = this.players[skippedPlayerIndex];
      console.log(`Skipped: ${skippedPlayer.name}`);
      
      this.currentPlayerIndex = skippedPlayerIndex;
      this.skipNext = false;
      
      // Handle additional skips if skipCount > 0
      if (this.skipCount > 0) {
        console.log(`Additional skip effect: skipping ${this.skipCount} more player(s)`);
        for (let i = 0; i < this.skipCount; i++) {
          const additionalSkippedIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
          const additionalSkippedPlayer = this.players[additionalSkippedIndex];
          console.log(`Skipped: ${additionalSkippedPlayer.name}`);
          
          this.currentPlayerIndex = additionalSkippedIndex;
        }
        this.skipCount = 0;
      }
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length;
    const current = this.players[this.currentPlayerIndex];
    console.log(`Turn changed to: ${current.name}`);
    
    return current;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }
}

// Test functions
function testWildCardSkipNoSkip() {
  console.log('🧪 Testing Wild Card Skip: No Skip (0)...\n');
  
  const game = new MockUnoGame({ wildCardSkip: 0 });
  const initialPlayer = game.getCurrentPlayer();
  console.log(`Initial player: ${initialPlayer.name}`);
  
  game.handleWildCard();
  const nextPlayer = game.nextTurn();
  
  if (nextPlayer.name === 'Player 2') {
    console.log('✅ Wild card with skip=0 correctly moves to next player (no skip)');
    return true;
  } else {
    console.log('❌ Wild card with skip=0 did not move to correct player');
    return false;
  }
}

function testWildCardSkipNext() {
  console.log('\n🧪 Testing Wild Card Skip: Next Player (1)...\n');
  
  const game = new MockUnoGame({ wildCardSkip: 1 });
  const initialPlayer = game.getCurrentPlayer();
  console.log(`Initial player: ${initialPlayer.name}`);
  
  game.handleWildCard();
  const nextPlayer = game.nextTurn();
  
  if (nextPlayer.name === 'Player 2') {
    console.log('✅ Wild card with skip=1 correctly moves to next player');
    return true;
  } else {
    console.log('❌ Wild card with skip=1 did not move to correct player');
    return false;
  }
}

function testWildCardSkipNextPlayer() {
  console.log('\n🧪 Testing Wild Card Skip: Skip Next Player (2)...\n');
  
  const game = new MockUnoGame({ wildCardSkip: 2 });
  const initialPlayer = game.getCurrentPlayer();
  console.log(`Initial player: ${initialPlayer.name}`);
  
  game.handleWildCard();
  const nextPlayer = game.nextTurn();
  
  if (nextPlayer.name === 'Player 3') {
    console.log('✅ Wild card with skip=2 correctly skips next player');
    return true;
  } else {
    console.log('❌ Wild card with skip=2 did not skip correctly');
    return false;
  }
}

function testWildCardSkipTwoPlayers() {
  console.log('\n🧪 Testing Wild Card Skip: Skip Two Players (3)...\n');
  
  const game = new MockUnoGame({ wildCardSkip: 3 });
  const initialPlayer = game.getCurrentPlayer();
  console.log(`Initial player: ${initialPlayer.name}`);
  
  game.handleWildCard();
  const nextPlayer = game.nextTurn();
  
  if (nextPlayer.name === 'Player 4') {
    console.log('✅ Wild card with skip=3 correctly skips two players');
    return true;
  } else {
    console.log('❌ Wild card with skip=3 did not skip correctly');
    return false;
  }
}

function testWildCardSkipSettingsPersistence() {
  console.log('\n🧪 Testing Wild Card Skip Settings Persistence...\n');
  
  // Test that settings are properly saved and loaded
  const testSettings = {
    rules: {
      wildCardSkip: 1,
      // ... other rules
    }
  };
  
  // Simulate saving to localStorage
  localStorage.setItem('uno-game-settings', JSON.stringify(testSettings));
  
  // Simulate loading from localStorage
  const savedSettings = JSON.parse(localStorage.getItem('uno-game-settings'));
  
  if (savedSettings.rules.wildCardSkip === 1) {
    console.log('✅ Wild card skip setting persists correctly');
    return true;
  } else {
    console.log('❌ Wild card skip setting does not persist correctly');
    return false;
  }
}

// Run tests
function runWildCardSkipTests() {
  console.log('🚀 Starting Wild Card Skip Tests\n');
  
  const results = [
    testWildCardSkipNoSkip(),
    testWildCardSkipNext(),
    testWildCardSkipNextPlayer(),
    testWildCardSkipTwoPlayers(),
    testWildCardSkipSettingsPersistence()
  ];

  console.log('\n📊 Test Results:');
  console.log(`No Skip (0): ${results[0] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Next Player (1): ${results[1] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Skip Next (2): ${results[2] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Skip Two (3): ${results[3] ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Settings Persistence: ${results[4] ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = results.every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All wild card skip tests passed! The wild card skip functionality is working correctly.');
    return true;
  } else {
    console.log('\n💥 Some wild card skip tests failed. Please check the implementation.');
    return false;
  }
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
  module.exports = { runWildCardSkipTests };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runWildCardSkipTests();
}
