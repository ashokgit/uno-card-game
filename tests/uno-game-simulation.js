/**
 * UNO Game Simulation Test
 * 
 * This test demonstrates a complete UNO game simulation that reaches a finished state.
 * It shows how the game engine should work when AI players properly play cards.
 */

console.log('🎮 UNO Game Simulation Test');
console.log('='.repeat(50));

class UnoGameSimulation {
  constructor() {
    this.players = ['Alice', 'Bob', 'Charlie'];
    this.currentPlayerIndex = 0;
    this.scores = { Alice: 0, Bob: 0, Charlie: 0 };
    this.handSizes = { Alice: 7, Bob: 7, Charlie: 7 };
    this.topCard = { color: 'red', value: 5 };
    this.turnCount = 0;
    this.gameOver = false;
    this.direction = 'clockwise';
    this.wildColor = null;
    this.drawPenalty = 0;
    this.skipNext = false;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    if (this.skipNext) {
      this.skipNext = false;
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  simulateTurn() {
    this.turnCount++;
    const currentPlayer = this.getCurrentPlayer();
    
    console.log(`\n--- Turn ${this.turnCount} ---`);
    console.log(`Current player: ${currentPlayer}`);
    console.log(`Top card: ${this.topCard.color} ${this.topCard.value}`);
    console.log(`Hand sizes: ${Object.entries(this.handSizes).map(([name, size]) => `${name}: ${size}`).join(', ')}`);
    
    // Apply any pending draw penalty
    if (this.drawPenalty > 0) {
      this.handSizes[currentPlayer] += this.drawPenalty;
      console.log(`📥 ${currentPlayer} drew ${this.drawPenalty} cards as penalty`);
      this.drawPenalty = 0;
      this.skipNext = true;
      this.nextTurn();
      return;
    }
    
    // Simulate card play or draw
    const action = this.simulatePlayerAction(currentPlayer);
    
    if (action.type === 'play') {
      console.log(`🎴 ${currentPlayer} played ${action.card.color} ${action.card.value}`);
      this.handSizes[currentPlayer]--;
      this.topCard = action.card;
      
      // Check for win
      if (this.handSizes[currentPlayer] === 0) {
        this.endRound(currentPlayer);
        return;
      }
      
      // Handle special cards
      this.handleSpecialCard(action.card, currentPlayer);
    } else {
      console.log(`📥 ${currentPlayer} drew a card`);
      this.handSizes[currentPlayer]++;
    }
    
    this.nextTurn();
  }

  handleSpecialCard(card, player) {
    switch (card.value) {
      case 'Skip':
        console.log(`⚡ ${player} played Skip: Skip next player`);
        this.skipNext = true;
        break;
      case 'Reverse':
        console.log(`⚡ ${player} played Reverse: Direction reversed`);
        this.direction = this.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        if (this.players.length === 2) {
          this.skipNext = true; // In 2-player game, Reverse acts like Skip
        }
        break;
      case 'Draw Two':
        console.log(`⚡ ${player} played Draw Two: Next player draws 2`);
        this.drawPenalty = 2;
        this.skipNext = true;
        break;
      case 'Wild':
        const colors = ['red', 'blue', 'green', 'yellow'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        console.log(`⚡ ${player} played Wild: Color changed to ${chosenColor}`);
        this.topCard.color = chosenColor;
        this.wildColor = chosenColor;
        break;
      case 'Wild Draw Four':
        const wildColors = ['red', 'blue', 'green', 'yellow'];
        const wildChosenColor = wildColors[Math.floor(Math.random() * wildColors.length)];
        console.log(`⚡ ${player} played Wild Draw Four: Color changed to ${wildChosenColor}, next player draws 4`);
        this.topCard.color = wildChosenColor;
        this.wildColor = wildChosenColor;
        this.drawPenalty = 4;
        this.skipNext = true;
        break;
    }
  }

  simulatePlayerAction(player) {
    // AI logic: 80% chance to play if possible, 20% chance to draw
    const canPlay = Math.random() < 0.8;
    
    if (canPlay && this.handSizes[player] > 0) {
      // Simulate playing a card that matches the top card
      const cardTypes = [
        { color: this.topCard.color, value: Math.floor(Math.random() * 10) },
        { color: this.topCard.color, value: 'Skip' },
        { color: this.topCard.color, value: 'Reverse' },
        { color: this.topCard.color, value: 'Draw Two' },
        { color: 'wild', value: 'Wild' },
        { color: 'wild', value: 'Wild Draw Four' }
      ];
      
      // Add variety - sometimes play a number card that matches the top card's value
      if (typeof this.topCard.value === 'number') {
        const colors = ['red', 'blue', 'green', 'yellow'];
        cardTypes.push({ 
          color: colors[Math.floor(Math.random() * colors.length)], 
          value: this.topCard.value 
        });
      }
      
      const card = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      return { type: 'play', card };
    } else {
      return { type: 'draw' };
    }
  }

  endRound(winner) {
    console.log(`\n🏆 ROUND END: ${winner} wins the round!`);
    
    // Calculate points (sum of all other players' hand values)
    let totalPoints = 0;
    Object.entries(this.handSizes).forEach(([player, handSize]) => {
      if (player !== winner) {
        const playerPoints = handSize * 5; // Average 5 points per card
        totalPoints += playerPoints;
      }
    });
    
    this.scores[winner] += totalPoints;
    console.log(`📊 ${winner} earned ${totalPoints} points!`);
    console.log('📊 Scores:', Object.entries(this.scores).map(([name, score]) => `${name}: ${score}`).join(', '));
    
    // Check for game winner
    if (this.scores[winner] >= 50) {
      this.gameOver = true;
      console.log(`\n🎉 GAME END: ${winner} wins the game!`);
      console.log('🏁 Final Scores:', Object.entries(this.scores).map(([name, score]) => `${name}: ${score}`).join(', '));
      return;
    }
    
    // Start new round
    console.log('\n🔄 Starting new round...');
    this.resetRound();
  }

  resetRound() {
    this.handSizes = { Alice: 7, Bob: 7, Charlie: 7 };
    this.currentPlayerIndex = 0;
    this.topCard = { color: 'red', value: 5 };
    this.direction = 'clockwise';
    this.wildColor = null;
    this.drawPenalty = 0;
    this.skipNext = false;
  }

  run(maxTurns = 1000) {
    console.log(`Starting game with ${this.players.length} players`);
    console.log(`Target score: 50 points`);
    console.log(`Max turns: ${maxTurns}`);
    
    const gameLoop = () => {
      if (this.gameOver) {
        console.log('\n🎯 Game completed successfully!');
        console.log(`Total turns: ${this.turnCount}`);
        console.log('✅ SUCCESS: Game reached a finished state!');
        return;
      }
      
      if (this.turnCount >= maxTurns) {
        console.log(`\n⚠️  Safety limit reached (${maxTurns} turns). Stopping game.`);
        console.log('❌ FAILURE: Game did not complete within turn limit');
        return;
      }
      
      this.simulateTurn();
      setTimeout(gameLoop, 50);
    };
    
    gameLoop();
  }
}

// Run the test
if (require.main === module) {
  const game = new UnoGameSimulation();
  game.run();
}

module.exports = UnoGameSimulation;
