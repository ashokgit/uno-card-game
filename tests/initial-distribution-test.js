const { UnoGame } = require('../dist/uno-engine.js');

console.log('🧪 Testing Initial Card Distribution Animation');
console.log('==============================================\n');

// Test 1: Verify game engine can be initialized without initial deal
console.log('📋 Test 1: Verifying game engine initialization without initial deal');
try {
  const game = new UnoGame(['Player 1', 'Player 2'], 0, {}, {}, true);
  
  // Check that players have 0 cards initially
  const players = game.getPlayers();
  const allPlayersHaveZeroCards = players.every(player => player.getHandSize() === 0);
  
  if (allPlayersHaveZeroCards) {
    console.log('✅ Players start with 0 cards when skipInitialDeal is true');
  } else {
    console.log('❌ Players do not start with 0 cards');
    players.forEach(player => {
      console.log(`   ${player.name}: ${player.getHandSize()} cards`);
    });
  }
  
  // Check that deck is not empty
  const deckCount = game.getDeckCount();
  if (deckCount > 0) {
    console.log(`✅ Deck has ${deckCount} cards available for distribution`);
  } else {
    console.log('❌ Deck is empty');
  }
  
} catch (error) {
  console.log('❌ Error initializing game engine:', error.message);
}

console.log('\n📋 Test 2: Verifying dealOneCardToPlayer method');
try {
  const game = new UnoGame(['Player 1', 'Player 2'], 0, {}, {}, true);
  
  // Deal one card to first player
  const card1 = game.dealOneCardToPlayer(0);
  const card2 = game.dealOneCardToPlayer(1);
  
  if (card1 && card2) {
    console.log('✅ dealOneCardToPlayer returns cards successfully');
    console.log(`   Player 1 received: ${card1.color} ${card1.value}`);
    console.log(`   Player 2 received: ${card2.color} ${card2.value}`);
  } else {
    console.log('❌ dealOneCardToPlayer failed to return cards');
  }
  
  // Check player hand sizes
  const players = game.getPlayers();
  if (players[0].getHandSize() === 1 && players[1].getHandSize() === 1) {
    console.log('✅ Players have correct hand sizes after dealing');
  } else {
    console.log('❌ Players have incorrect hand sizes');
    players.forEach(player => {
      console.log(`   ${player.name}: ${player.getHandSize()} cards`);
    });
  }
  
} catch (error) {
  console.log('❌ Error testing dealOneCardToPlayer:', error.message);
}

console.log('\n📋 Test 3: Verifying complete distribution simulation');
try {
  const game = new UnoGame(['Player 1', 'Player 2', 'Player 3'], 0, {}, {}, true);
  
  // Simulate distributing 7 cards to each player
  for (let round = 0; round < 7; round++) {
    for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
      const card = game.dealOneCardToPlayer(playerIndex);
      if (!card) {
        console.log(`❌ Failed to deal card to player ${playerIndex} in round ${round}`);
        break;
      }
    }
  }
  
  // Check final hand sizes
  const players = game.getPlayers();
  const allPlayersHaveSevenCards = players.every(player => player.getHandSize() === 7);
  
  if (allPlayersHaveSevenCards) {
    console.log('✅ All players have 7 cards after complete distribution');
    players.forEach(player => {
      console.log(`   ${player.name}: ${player.getHandSize()} cards`);
    });
  } else {
    console.log('❌ Players do not have 7 cards after complete distribution');
    players.forEach(player => {
      console.log(`   ${player.name}: ${player.getHandSize()} cards`);
    });
  }
  
  // Check remaining deck
  const remainingCards = game.getDeckCount();
  console.log(`📊 Remaining cards in deck: ${remainingCards}`);
  
} catch (error) {
  console.log('❌ Error testing complete distribution:', error.message);
}

console.log('\n📋 Test 4: Verifying startGameAfterDistribution method');
try {
  const game = new UnoGame(['Player 1', 'Player 2'], 0, {}, {}, true);
  
  // Deal initial cards
  for (let i = 0; i < 7; i++) {
    game.dealOneCardToPlayer(0);
    game.dealOneCardToPlayer(1);
  }
  
  // Start the game
  game.startGameAfterDistribution();
  
  // Check that game has started (should have a top card)
  const topCard = game.getTopCard();
  if (topCard) {
    console.log('✅ Game started successfully after distribution');
    console.log(`   Top card: ${topCard.color} ${topCard.value}`);
  } else {
    console.log('❌ Game did not start properly after distribution');
  }
  
  // Check that current player is set
  const currentPlayer = game.getCurrentPlayer();
  if (currentPlayer) {
    console.log(`✅ Current player set: ${currentPlayer.name}`);
  } else {
    console.log('❌ Current player not set');
  }
  
} catch (error) {
  console.log('❌ Error testing startGameAfterDistribution:', error.message);
}

console.log('\n🎉 Initial Card Distribution Animation Tests Complete!');
console.log('=====================================================');
