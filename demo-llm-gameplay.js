// Demo script to test LLM integration
const { UnoGame } = require('./lib/uno-engine')
const { LLMAIStrategy } = require('./lib/llm/ai-strategy')

// Mock game settings
const mockGameSettings = {
  llmProviders: [
    {
      id: 'openai-test',
      name: 'OpenAI Test',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
      isActive: true,
      testSuccess: true
    }
  ],
  aiPlayers: [
    {
      id: 'alice-llm',
      name: 'Alice (LLM)',
      avatar: 'female-avatar.png',
      llmProviderId: 'openai-test',
      personality: 'I am Alice, a strategic and patient UNO player. I prefer to save my action cards for critical moments and focus on building a strong hand.',
      isActive: true
    },
    {
      id: 'bob-basic',
      name: 'Bob (Basic)',
      avatar: 'male-avatar.png',
      llmProviderId: null,
      personality: '',
      isActive: true
    }
  ]
}

// Mock LLM manager that simulates responses
const mockLLMManager = {
  makeRequest: async (request) => {
    console.log('\n🤖 LLM Request:')
    console.log('Provider:', request.provider.name)
    console.log('System:', request.systemMessage.substring(0, 100) + '...')
    console.log('Prompt:', request.prompt.substring(0, 150) + '...')
    
    // Simulate realistic LLM responses based on the context
    if (request.prompt.includes('play')) {
      // Analyze the playable cards and make a strategic decision
      const playableCards = request.prompt.match(/Playable cards: (.+)/)?.[1] || ''
      
      if (playableCards.includes('Wild')) {
        return {
          success: true,
          content: JSON.stringify({
            action: 'play',
            card: 'wild-card-id',
            reasoning: 'Playing Wild card to gain control and choose the most strategic color.'
          })
        }
      } else if (playableCards.includes('Skip') || playableCards.includes('Reverse')) {
        return {
          success: true,
          content: JSON.stringify({
            action: 'play',
            card: 'action-card-id',
            reasoning: 'Playing action card to disrupt opponent and gain advantage.'
          })
        }
      } else {
        return {
          success: true,
          content: JSON.stringify({
            action: 'play',
            card: 'number-card-id',
            reasoning: 'Playing number card to reduce hand size and maintain flexibility.'
          })
        }
      }
    } else if (request.prompt.includes('wild_color')) {
      // Choose color based on hand composition
      const hand = request.prompt.match(/Your hand: (.+)/)?.[1] || ''
      
      if (hand.includes('red')) {
        return {
          success: true,
          content: JSON.stringify({
            action: 'wild_color',
            color: 'red',
            reasoning: 'Choosing red because I have several red cards in my hand.'
          })
        }
      } else if (hand.includes('blue')) {
        return {
          success: true,
          content: JSON.stringify({
            action: 'wild_color',
            color: 'blue',
            reasoning: 'Choosing blue as it appears to be my most common color.'
          })
        }
      } else {
        return {
          success: true,
          content: JSON.stringify({
            action: 'wild_color',
            color: 'green',
            reasoning: 'Choosing green as a strategic color choice.'
          })
        }
      }
    }
    
    return {
      success: false,
      content: null,
      error: 'Mock error'
    }
  }
}

// Mock the llmManager
jest.mock('./lib/llm/manager', () => ({
  llmManager: mockLLMManager
}))

async function demoLLMGameplay() {
  console.log('🎮 LLM UNO Gameplay Demo')
  console.log('========================\n')
  
  // Create a game with LLM-powered AI
  const game = new UnoGame(['You', 'Alice (LLM)', 'Bob (Basic)'], 0, {
    aiDifficulty: 'expert',
    debugMode: true
  })
  
  // Create LLM strategy for Alice
  const aliceLLMStrategy = new LLMAIStrategy(
    mockGameSettings.aiPlayers[0],
    mockGameSettings,
    []
  )
  
  console.log('Game created with 3 players:')
  console.log('- You (Human)')
  console.log('- Alice (LLM-powered)')
  console.log('- Bob (Basic AI)')
  console.log('\n')
  
  // Simulate a few turns to demonstrate LLM integration
  console.log('🔄 Simulating game turns...\n')
  
  for (let turn = 1; turn <= 3; turn++) {
    console.log(`--- Turn ${turn} ---`)
    
    const currentPlayer = game.getCurrentPlayer()
    const topCard = game.getTopCard()
    
    console.log(`Current player: ${currentPlayer.name}`)
    console.log(`Top card: ${topCard.color} ${topCard.value}`)
    console.log(`Hand size: ${currentPlayer.getHandSize()}`)
    
    if (currentPlayer.name === 'Alice (LLM)') {
      console.log('🤖 Alice is using LLM strategy...')
      
      // Get playable cards
      const playableCards = currentPlayer.getPlayableCards(topCard)
      console.log(`Playable cards: ${playableCards.map(c => `${c.color} ${c.value}`).join(', ')}`)
      
      if (playableCards.length > 1) {
        console.log('Multiple playable cards - using LLM for strategic decision')
        
        const gameState = {
          topCard: topCard,
          players: game.getPlayers().map(p => ({
            id: p.id,
            name: p.name,
            handSize: p.getHandSize(),
            isHuman: p.isHuman
          }))
        }
        
        const chosenCard = await aliceLLMStrategy.chooseCard(playableCards, gameState, currentPlayer)
        
        if (chosenCard) {
          console.log(`✅ LLM chose: ${chosenCard.color} ${chosenCard.value}`)
          
          // If it's a wild card, also test color choice
          if (chosenCard.color === 'wild') {
            console.log('🎨 LLM choosing wild card color...')
            const chosenColor = await aliceLLMStrategy.chooseWildColor(
              currentPlayer.getHand(),
              gameState,
              currentPlayer
            )
            console.log(`✅ LLM chose color: ${chosenColor}`)
          }
        } else {
          console.log('❌ LLM failed to choose a card')
        }
      } else if (playableCards.length === 1) {
        console.log('Single playable card - no LLM needed')
        console.log(`Will play: ${playableCards[0].color} ${playableCards[0].value}`)
      } else {
        console.log('No playable cards - must draw')
      }
    } else {
      console.log('Using basic AI strategy')
    }
    
    console.log('')
  }
  
  console.log('✅ Demo completed!')
  console.log('\nKey Features Demonstrated:')
  console.log('• LLM only used when multiple playable cards exist')
  console.log('• Personality-driven decision making')
  console.log('• Fallback to basic AI when LLM unavailable')
  console.log('• Strategic wild color selection')
  console.log('• Realistic LLM response simulation')
}

// Run the demo
if (require.main === module) {
  demoLLMGameplay().catch(console.error)
}

module.exports = { demoLLMGameplay }
