import { UnoPlayer, UnoCard, UnoColor } from '@/lib/uno-engine'
import { llmManager } from './manager'
import { AIPlayer, LLMProvider } from './types'

export interface LLMGameContext {
    currentPlayer: {
        name: string
        hand: UnoCard[]
        handSize: number
        personality: string
    }
    topCard: UnoCard
    playableCards: UnoCard[]
    availableActions: string[]
    gamePhase: 'playing' | 'waiting' | 'gameOver'
    otherPlayers: Array<{
        name: string
        handSize: number
        isActive: boolean
    }>
    rules: {
        stackDrawTwo: boolean
        stackDrawFour: boolean
        mustPlayIfDrawable: boolean
        allowDrawWhenPlayable: boolean
        enableUnoChallenges: boolean
    }
    recentMoves: Array<{
        player: string
        action: string
        card?: string
        timestamp: number
    }>
}

export class LLMAIStrategy {
    constructor(
        private aiPlayer: AIPlayer,
        private gameSettings: any, // GameSettings from context
        private moveHistory: Array<{ player: string, action: string, card?: string, timestamp: number }> = []
    ) { }

    async chooseCard(playableCards: UnoCard[], gameState: any, player: UnoPlayer): Promise<UnoCard | null> {
        // Only use LLM if there are multiple playable cards
        if (playableCards.length <= 1) {
            return playableCards[0] || null // Return the only card or null
        }

        // Multiple playable cards - use LLM for strategic decision
        try {
            const provider = this.getLLMProvider()
            if (!provider) {
                console.warn('LLM provider not found, falling back to basic AI')
                return this.fallbackToBasicAI(playableCards, gameState)
            }

            const context = this.buildGameContext(player, playableCards, gameState)
            const response = await llmManager.makeRequest({
                provider,
                prompt: this.buildGamePrompt(context),
                systemMessage: this.buildSystemPrompt(),
                maxTokens: 200
            })

            if (response.success && response.content) {
                const decision = this.parseLLMResponse(response.content, playableCards)
                if (decision) {
                    console.log(`LLM decision for ${player.name}:`, decision)
                    return decision
                }
            }

            // Fallback if LLM fails or returns invalid response
            console.warn('LLM decision failed, falling back to basic AI')
            return this.fallbackToBasicAI(playableCards, gameState)

        } catch (error) {
            console.error('LLM decision error:', error)
            return this.fallbackToBasicAI(playableCards, gameState)
        }
    }

    async chooseWildColor(hand: UnoCard[], gameState: any, player: UnoPlayer): Promise<UnoColor> {
        // Always use LLM for wild color choice as it's strategic
        try {
            const provider = this.getLLMProvider()
            if (!provider) {
                return this.fallbackWildColor(hand, gameState)
            }

            const context = this.buildWildColorContext(player, hand, gameState)
            const response = await llmManager.makeRequest({
                provider,
                prompt: this.buildWildColorPrompt(context),
                systemMessage: this.buildWildColorSystemPrompt(),
                maxTokens: 100
            })

            if (response.success && response.content) {
                const color = this.parseWildColorResponse(response.content)
                if (color) {
                    console.log(`LLM wild color choice for ${player.name}:`, color)
                    return color
                }
            }

            return this.fallbackWildColor(hand, gameState)

        } catch (error) {
            console.error('LLM wild color error:', error)
            return this.fallbackWildColor(hand, gameState)
        }
    }

    private getLLMProvider(): LLMProvider | null {
        if (!this.aiPlayer.llmProviderId) return null

        const provider = this.gameSettings.llmProviders?.find(
            (p: LLMProvider) => p.id === this.aiPlayer.llmProviderId
        )

        if (provider?.isActive && provider.testSuccess) {
            return provider
        }

        return null
    }

    private buildGameContext(player: UnoPlayer, playableCards: UnoCard[], gameState: any): LLMGameContext {
        return {
            currentPlayer: {
                name: player.name,
                hand: player.getHand(),
                handSize: player.getHandSize(),
                personality: this.aiPlayer.personality
            },
            topCard: gameState.topCard,
            playableCards: playableCards,
            availableActions: ['play'],
            gamePhase: 'playing',
            otherPlayers: gameState.players
                .filter((p: any) => p.id !== player.id)
                .map((p: any) => ({
                    name: p.name,
                    handSize: p.handSize || p.getHandSize?.() || 0,
                    isActive: true
                })),
            rules: {
                stackDrawTwo: false,
                stackDrawFour: false,
                mustPlayIfDrawable: false,
                allowDrawWhenPlayable: true,
                enableUnoChallenges: true
            },
            recentMoves: this.moveHistory.slice(-5)
        }
    }

    private buildWildColorContext(player: UnoPlayer, hand: UnoCard[], gameState: any): LLMGameContext {
        return {
            currentPlayer: {
                name: player.name,
                hand: hand,
                handSize: hand.length,
                personality: this.aiPlayer.personality
            },
            topCard: gameState.topCard,
            playableCards: [],
            availableActions: ['wild_color'],
            gamePhase: 'playing',
            otherPlayers: gameState.players
                .filter((p: any) => p.id !== player.id)
                .map((p: any) => ({
                    name: p.name,
                    handSize: p.handSize || p.getHandSize?.() || 0,
                    isActive: true
                })),
            rules: {
                stackDrawTwo: false,
                stackDrawFour: false,
                mustPlayIfDrawable: false,
                allowDrawWhenPlayable: true,
                enableUnoChallenges: true
            },
            recentMoves: this.moveHistory.slice(-5)
        }
    }

    private buildSystemPrompt(): string {
        return `You are an AI player in a UNO game with a specific personality. You have multiple playable cards and need to choose the best strategic move.

Your Personality: ${this.aiPlayer.personality}

UNO Rules:
- Play a card that matches the top card's color, number, or symbol
- Action cards: Skip (next player), Reverse (direction), Draw Two (+2 cards)
- Wild cards: Can be played anytime, choose new color
- Wild Draw Four: Only if no matching cards, +4 cards to next player
- Goal: Get rid of all cards first

Consider your personality when making decisions. Be strategic and think about:
- Which card will help you win fastest?
- How can you disrupt other players?
- What's the best color to choose for wild cards?

Respond with ONLY a JSON object:
{
  "action": "play",
  "card": "card_id",
  "reasoning": "brief explanation of your strategic decision"
}`
    }

    private buildWildColorSystemPrompt(): string {
        return `You are an AI player in a UNO game who just played a Wild card. You need to choose the best color strategically.

Your Personality: ${this.aiPlayer.personality}

Choose a color that will help you win. Consider:
- Which color do you have the most of?
- Which color will be hardest for opponents to match?
- What's your personality - aggressive, defensive, strategic?

Respond with ONLY a JSON object:
{
  "action": "wild_color",
  "color": "red|blue|green|yellow",
  "reasoning": "brief explanation of your color choice"
}`
    }

    private buildGamePrompt(context: LLMGameContext): string {
        return `
Current Game State:
- Your hand: ${context.currentPlayer.hand.map(card => `${card.color} ${card.value}`).join(', ')}
- Top card: ${context.topCard.color} ${context.topCard.value}
- Playable cards: ${context.playableCards.map(card => `${card.color} ${card.value}`).join(', ')}
- Other players: ${context.otherPlayers.map(p => `${p.name} (${p.handSize} cards)`).join(', ')}
- Recent moves: ${context.recentMoves.slice(-3).map(m => `${m.player}: ${m.action}${m.card ? ` ${m.card}` : ''}`).join(', ') || 'None'}

Choose the best strategic move based on your personality.
`
    }

    private buildWildColorPrompt(context: LLMGameContext): string {
        return `
Your hand: ${context.currentPlayer.hand.map(card => `${card.color} ${card.value}`).join(', ')}
Other players: ${context.otherPlayers.map(p => `${p.name} (${p.handSize} cards)`).join(', ')}
Recent moves: ${context.recentMoves.slice(-3).map(m => `${m.player}: ${m.action}${m.card ? ` ${m.card}` : ''}`).join(', ') || 'None'}

Choose the best color strategically.
`
    }

    private parseLLMResponse(response: string, playableCards: UnoCard[]): UnoCard | null {
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResponse = response.trim()

            // Remove markdown code blocks (```json ... ```)
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }

            // Try to extract JSON from the response if it's not pure JSON
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                cleanResponse = jsonMatch[0]
            }

            const parsed = JSON.parse(cleanResponse)

            if (parsed.action === 'play' && parsed.card) {
                // Find the card by ID
                const selectedCard = playableCards.find(card => card.id === parsed.card)

                if (selectedCard) {
                    console.log(`LLM reasoning: ${parsed.reasoning || 'No reasoning provided'}`)
                    return selectedCard
                } else {
                    console.warn(`LLM returned invalid card ID: ${parsed.card}`)
                    console.warn(`Available card IDs: ${playableCards.map(c => c.id).join(', ')}`)
                }
            } else {
                console.warn('LLM response missing required fields:', parsed)
            }

            return null
        } catch (error) {
            console.error('Failed to parse LLM response:', error)
            console.error('Raw response:', response)
            return null
        }
    }

    private parseWildColorResponse(response: string): UnoColor | null {
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResponse = response.trim()

            // Remove markdown code blocks (```json ... ```)
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }

            // Try to extract JSON from the response if it's not pure JSON
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                cleanResponse = jsonMatch[0]
            }

            const parsed = JSON.parse(cleanResponse)

            if (parsed.action === 'wild_color' && parsed.color) {
                const validColors: UnoColor[] = ['red', 'blue', 'green', 'yellow']
                if (validColors.includes(parsed.color)) {
                    console.log(`LLM wild color reasoning: ${parsed.reasoning || 'No reasoning provided'}`)
                    return parsed.color
                }
            }

            return null
        } catch (error) {
            console.error('Failed to parse LLM wild color response:', error)
            console.error('Raw response:', response)
            return null
        }
    }

    private fallbackToBasicAI(playableCards: UnoCard[], gameState: any): UnoCard | null {
        // Simple fallback: prefer action cards, then numbers, then wild cards
        const actionCards = playableCards.filter(card =>
            card.value === 'Skip' || card.value === 'Reverse' || card.value === 'Draw Two'
        )

        if (actionCards.length > 0) {
            return actionCards[0]
        }

        const numberCards = playableCards.filter(card =>
            typeof card.value === 'number'
        )

        if (numberCards.length > 0) {
            return numberCards[0]
        }

        return playableCards[0]
    }

    private fallbackWildColor(hand: UnoCard[], gameState: any): UnoColor {
        // Simple fallback: choose the color you have most of
        const colorCounts = new Map<UnoColor, number>()
        const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow']

        colors.forEach(color => colorCounts.set(color, 0))

        hand.forEach(card => {
            if (card.color && card.color !== 'wild') {
                colorCounts.set(card.color, (colorCounts.get(card.color) || 0) + 1)
            }
        })

        let bestColor: UnoColor = 'red'
        let maxCount = 0

        colors.forEach(color => {
            const count = colorCounts.get(color) || 0
            if (count > maxCount) {
                maxCount = count
                bestColor = color
            }
        })

        return bestColor
    }
}
