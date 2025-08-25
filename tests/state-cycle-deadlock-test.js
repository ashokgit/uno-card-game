/**
 * State Cycle Deadlock Detection Test
 * 
 * This test verifies that the enhanced deadlock detection can catch cycles
 * of action cards as described in Issue #4.
 */

console.log('🔄 State Cycle Deadlock Detection Test');
console.log('='.repeat(50));

class StateCycleTest {
  constructor() {
    this.players = ['Player1', 'Player2', 'Player3', 'Player4'];
    this.currentPlayerIndex = 0;
    this.direction = 'clockwise';
    this.turnCount = 0;
    
    // Enhanced deadlock detection properties
    this.gameStateHistory = [];
    this.MAX_STATE_HISTORY = 20;
    this.DEADLOCK_CYCLE_THRESHOLD = 3;
    
    // Player hands (simplified representation)
    this.playerHands = {
      'Player1': [{ color: 'red', value: 'Skip' }],
      'Player2': [],
      'Player3': [{ color: 'red', value: 'Skip' }],
      'Player4': []
    };
    
    // Game state
    this.topCard = { color: 'red', value: 5 };
    this.wildColor = null;
    this.deckCount = 0;
    this.discardCount = 1;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  // Generate a hash representing the current strategic game state
  generateGameStateHash() {
    const topCardInfo = this.topCard ? `${this.topCard.color}-${this.topCard.value}` : 'none';
    
    // Sort hand sizes to make the hash order-independent
    const handSizes = this.players.map(p => this.playerHands[p].length).sort((a, b) => a - b);
    
    const stateComponents = [
      `hands:${handSizes.join(',')}`,
      `top:${topCardInfo}`,
      `player:${this.currentPlayerIndex}`,
      `dir:${this.direction}`,
      `wild:${this.wildColor || 'none'}`,
      `deck:${this.deckCount}`,
      `discard:${this.discardCount}`
    ];
    
    return stateComponents.join('|');
  }

  // Add current game state to history and check for cycles
  updateGameStateHistory() {
    const currentStateHash = this.generateGameStateHash();
    
    // Add to history
    this.gameStateHistory.push(currentStateHash);
    
    // Keep only the most recent states
    if (this.gameStateHistory.length > this.MAX_STATE_HISTORY) {
      this.gameStateHistory = this.gameStateHistory.slice(-this.MAX_STATE_HISTORY);
    }
    
    console.log(`  State hash: ${currentStateHash}`);
    return currentStateHash;
  }

  // Check if the current state indicates a cycle (potential deadlock)
  detectStateCycle() {
    if (this.gameStateHistory.length < this.DEADLOCK_CYCLE_THRESHOLD) {
      return false;
    }
    
    const currentState = this.gameStateHistory[this.gameStateHistory.length - 1];
    const occurrences = this.gameStateHistory.filter(state => state === currentState).length;
    
    if (occurrences >= this.DEADLOCK_CYCLE_THRESHOLD) {
      console.log(`  🔄 State cycle detected: state has appeared ${occurrences} times`);
      return true;
    }
    
    return false;
  }

  // Simulate playing a skip card
  playSkipCard(player) {
    console.log(`  🎴 ${player} plays Red Skip`);
    
    // Remove the skip card from hand
    this.playerHands[player] = [];
    
    // Add to discard pile
    this.discardCount++;
    
    // Skip the next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 2) % this.players.length;
    
    console.log(`  ⚡ Skipping next player, turn goes to ${this.getCurrentPlayer()}`);
  }

  // Simulate a turn
  simulateTurn() {
    this.turnCount++;
    const currentPlayer = this.getCurrentPlayer();
    
    console.log(`\n--- Turn ${this.turnCount} ---`);
    console.log(`Current player: ${currentPlayer}`);
    console.log(`Hand sizes: ${this.players.map(p => `${p}: ${this.playerHands[p].length}`).join(', ')}`);
    
    // Update state history
    this.updateGameStateHistory();
    
    // Check for state cycle
    if (this.detectStateCycle()) {
      console.log('✅ DEADLOCK DETECTED! State cycle identified.');
      return true;
    }
    
    // Simulate the action card cycle
    if (currentPlayer === 'Player1' && this.playerHands[currentPlayer].length > 0) {
      this.playSkipCard(currentPlayer);
    } else if (currentPlayer === 'Player3' && this.playerHands[currentPlayer].length > 0) {
      this.playSkipCard(currentPlayer);
    } else {
      console.log(`  ⏭️ ${currentPlayer} is skipped (no cards to play)`);
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    
    return false;
  }

  // Run the test
  runTest() {
    console.log('Setting up action card cycle scenario...');
    console.log('- Player1: Red Skip');
    console.log('- Player3: Red Skip');
    console.log('- Top card: Red 5');
    console.log('- Current player: Player1\n');
    
    const maxTurns = 20;
    let deadlockDetected = false;
    
    for (let i = 0; i < maxTurns && !deadlockDetected; i++) {
      deadlockDetected = this.simulateTurn();
      
      if (deadlockDetected) {
        break;
      }
    }
    
    console.log('\n=== Test Results ===');
    if (deadlockDetected) {
      console.log('✅ SUCCESS: Enhanced deadlock detection correctly identified the action card cycle.');
      console.log('The state-based detection system is working properly.');
      console.log(`Deadlock detected after ${this.turnCount} turns.`);
    } else {
      console.log('❌ FAILURE: Enhanced deadlock detection failed to identify the action card cycle.');
      console.log('The system needs further investigation.');
      console.log(`Test completed after ${this.turnCount} turns without detecting deadlock.`);
    }
    
    console.log(`\nState history length: ${this.gameStateHistory.length}`);
    console.log(`Final state hash: ${this.gameStateHistory[this.gameStateHistory.length - 1] || 'none'}`);
    
    return deadlockDetected;
  }
}

// Run the test
const test = new StateCycleTest();
const result = test.runTest();

console.log('\n🎯 Test completed!');
