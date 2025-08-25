const { UnoGame } = require('../dist/uno-engine.js');

function testEnhancedAIStrategy() {
  console.log('🧠 Testing Enhanced AI Strategy Implementation...');
  
  // Test 1: Create a game with expert AI
  console.log('\n🎮 Test 1: Creating game with expert AI');
  const game = new UnoGame(['AI Player', 'Human Player'], 1, {
    aiDifficulty: 'expert',
    debugMode: true
  });
  
  // Get initial state
  const initialState = game.getState();
  console.log('Initial game state:', {
    players: initialState.players.map(p => ({ name: p.name, handSize: p.handSize, isHuman: p.isHuman })),
    currentPlayer: initialState.currentPlayer.name,
    aiDifficulty: game.getRules().aiDifficulty
  });
  
  // Test 2: Simulate AI turns to see enhanced behavior
  console.log('\n🔄 Test 2: Simulating AI turns...');
  let turnCount = 0;
  const maxTurns = 15;
  
  while (turnCount < maxTurns && !game.isGameOver()) {
    const currentState = game.getState();
    const currentPlayer = currentState.currentPlayer;
    const currentPlayerData = currentState.players.find(p => p.id === currentPlayer.id);
    
    console.log(`\nTurn ${turnCount + 1}: ${currentPlayer.name}'s turn (${currentPlayerData?.handSize} cards)`);
    
    // If it's an AI turn, let it play
    if (!currentPlayerData?.isHuman) {
      console.log(`🤖 AI ${currentPlayer.name} is thinking...`);
      
      // Get AI decision
      const aiDecision = game.decideAITurn();
      if (aiDecision) {
        console.log(`AI decision: ${aiDecision.action}${aiDecision.cardId ? ` (card: ${aiDecision.cardId})` : ''}${aiDecision.chosenColor ? ` (color: ${aiDecision.chosenColor})` : ''}`);
        
        if (aiDecision.action === 'play') {
          const success = game.playCard(currentPlayer.id, aiDecision.cardId, aiDecision.chosenColor);
          console.log(`AI played card: ${success ? 'SUCCESS' : 'FAILED'}`);
        } else {
          const card = game.drawCard(currentPlayer.id);
          console.log(`AI drew card: ${card ? `${card.color} ${card.value}` : 'No card drawn'}`);
        }
      } else {
        console.log('AI decided to draw a card (no playable cards)');
        game.drawCard(currentPlayer.id);
      }
    } else {
      // For human player, just draw a card to keep the game moving
      console.log('👤 Human player drawing a card to keep game moving...');
      game.drawCard(currentPlayer.id);
    }
    
    turnCount++;
    
    // Check if game ended
    if (game.isGameOver()) {
      const finalState = game.getState();
      console.log(`\n🏁 Game ended! Winner: ${finalState.roundInfo.gameWinner?.name || 'Unknown'}`);
      break;
    }
  }
  
  // Test 3: Analyze AI behavior patterns
  console.log('\n📊 Test 3: Analyzing AI behavior patterns');
  const eventLog = game.getEventLog();
  
  const cardPlayedEvents = eventLog.filter(log => log.event === 'onCardPlayed');
  const actionCardEvents = eventLog.filter(log => log.event === 'onActionCardPlayed');
  const wildCardEvents = cardPlayedEvents.filter(log => log.data && log.data[1] && log.data[1].color === 'wild');
  
  console.log(`Total cards played: ${cardPlayedEvents.length}`);
  console.log(`Action cards played: ${actionCardEvents.length}`);
  console.log(`Wild cards played: ${wildCardEvents.length}`);
  
  // Analyze AI vs Human behavior
  const aiPlays = cardPlayedEvents.filter(log => log.data && log.data[0] && !log.data[0].isHuman);
  const humanPlays = cardPlayedEvents.filter(log => log.data && log.data[0] && log.data[0].isHuman);
  
  console.log(`AI plays: ${aiPlays.length}`);
  console.log(`Human plays: ${humanPlays.length}`);
  
  // Check for strategic patterns in AI plays
  const aiActionCards = aiPlays.filter(log => log.data && log.data[1] && log.data[1].isActionCard && log.data[1].isActionCard());
  const aiWildCards = aiPlays.filter(log => log.data && log.data[1] && log.data[1].color === 'wild');
  
  console.log(`AI action cards: ${aiActionCards.length}`);
  console.log(`AI wild cards: ${aiWildCards.length}`);
  
  console.log('\n✅ Enhanced AI Strategy test completed!');
  console.log('\n🎯 Expected Enhanced AI Features:');
  console.log('- Strategic card selection based on opponent threats');
  console.log('- Resource conservation (saving powerful cards)');
  console.log('- Advanced wild color selection');
  console.log('- Card counting and probability analysis');
  console.log('- Opponent behavior tracking');
  
  if (aiActionCards.length > 0 || aiWildCards.length > 0) {
    console.log('\n✅ AI is using strategic cards - enhanced behavior detected!');
  } else {
    console.log('\n⚠️ AI behavior appears basic - may need to verify implementation');
  }
}

// Run the test
if (require.main === module) {
  testEnhancedAIStrategy();
}

module.exports = { testEnhancedAIStrategy };
