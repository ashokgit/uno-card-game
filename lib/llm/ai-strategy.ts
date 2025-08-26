import { UnoPlayer, UnoCard, UnoColor } from '@/lib/uno-engine'
import { llmManager } from './manager'
import { AIPlayer, LLMProvider } from './types'
import { UNO_PROMPTS } from './config'

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
        return UNO_PROMPTS.system.replace('{personality}', this.aiPlayer.personality)
    }

    private buildWildColorSystemPrompt(): string {
        return UNO_PROMPTS.wildColor.replace('{personality}', this.aiPlayer.personality)
    }

    private buildGamePrompt(context: LLMGameContext): string {
        // Convert card objects to structured JSON for the LLM
        const handAsJSON = JSON.stringify(context.currentPlayer.hand.map(c => ({
            id: c.id,
            color: c.color,
            value: c.value
        })))

        const playableAsJSON = JSON.stringify(context.playableCards.map(c => ({
            id: c.id,
            color: c.color,
            value: c.value
        })))

        const topCardAsJSON = JSON.stringify({
            color: context.topCard.color,
            value: context.topCard.value
        })

        const otherPlayersAsJSON = JSON.stringify(context.otherPlayers.map(p => ({
            name: p.name,
            handSize: p.handSize,
            isActive: p.isActive
        })))

        const recentMovesAsJSON = JSON.stringify(context.recentMoves.slice(-3).map(m => ({
            player: m.player,
            action: m.action,
            card: m.card || null,
            timestamp: m.timestamp
        })))

        return UNO_PROMPTS.system
            .replace('{personality}', this.aiPlayer.personality)
            .replace('{hand}', handAsJSON)
            .replace('{topCard}', topCardAsJSON)
            .replace('{playableCards}', playableAsJSON)
            .replace('{otherPlayers}', otherPlayersAsJSON)
            .replace('{recentMoves}', recentMovesAsJSON)
    }

    private buildWildColorPrompt(context: LLMGameContext): string {
        // Convert card objects to structured JSON for the LLM
        const handAsJSON = JSON.stringify(context.currentPlayer.hand.map(c => ({
            id: c.id,
            color: c.color,
            value: c.value
        })))

        const otherPlayersAsJSON = JSON.stringify(context.otherPlayers.map(p => ({
            name: p.name,
            handSize: p.handSize,
            isActive: p.isActive
        })))

        const recentMovesAsJSON = JSON.stringify(context.recentMoves.slice(-3).map(m => ({
            player: m.player,
            action: m.action,
            card: m.card || null,
            timestamp: m.timestamp
        })))

        return UNO_PROMPTS.wildColor
            .replace('{personality}', this.aiPlayer.personality)
            .replace('{hand}', handAsJSON)
            .replace('{otherPlayers}', otherPlayersAsJSON)
            .replace('{recentMoves}', recentMovesAsJSON)
    }

    private parseLLMResponse(response: string, playableCards: UnoCard[]): UnoCard | null {
        try {
            const parsed = JSON.parse(response)

            if (parsed.action === 'play' && parsed.card) {
                // Find the card by ID (now more reliable with structured data)
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
            const parsed = JSON.parse(response)

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