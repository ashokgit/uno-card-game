import { IAIStrategy, IAIGameState, UnoPlayer, UnoCard, UnoColor } from '@/lib/uno-engine'
import { LLMAIStrategy } from './ai-strategy'
import { GameSettings } from '@/contexts/settings-context'

// Wrapper strategy that implements the existing IAIStrategy interface
export class LLMWrapperStrategy implements IAIStrategy {
    private llmStrategy: LLMAIStrategy | null = null
    private fallbackStrategy: IAIStrategy
    private gameSettings: GameSettings
    private moveHistory: Array<{ player: string, action: string, card?: string, timestamp: number }> = []

    constructor(gameSettings: GameSettings, fallbackStrategy: IAIStrategy) {
        this.gameSettings = gameSettings
        this.fallbackStrategy = fallbackStrategy
    }

    async chooseCard(playableCards: UnoCard[], gameState: IAIGameState, player: UnoPlayer): Promise<UnoCard | null> {
        console.log(`🚀 LLM WRAPPER STRATEGY CALLED for ${player.name} - Integration is working!`)
        console.log(`🔍 LLMWrapperStrategy.chooseCard called for ${player.name}`)
        console.log(`   Playable cards: ${playableCards.length}`)
        console.log(`   Player is human: ${player.isHuman}`)
        console.log(`   ⚡ LLM WRAPPER ACTIVE - This confirms LLM integration is working!`)

        // Check if this player should use LLM
        const aiPlayer = this.getAIPlayerForPlayer(player)
        console.log(`   AI Player found: ${aiPlayer ? 'Yes' : 'No'}`)
        if (aiPlayer) {
            console.log(`   LLM Provider ID: ${aiPlayer.llmProviderId}`)
            console.log(`   Personality: ${aiPlayer.personality}`)
        }

        if (!aiPlayer || !aiPlayer.llmProviderId) {
            console.log(`🚫 ${player.name}: BYPASSED LLM CALL - No LLM provider configured`)
            return await this.fallbackStrategy.chooseCard(playableCards, gameState, player)
        }

        // Only use LLM if there are multiple playable cards
        if (playableCards.length <= 1) {
            console.log(`🚫 ${player.name}: BYPASSED LLM CALL - Only ${playableCards.length} playable card(s)`)
            return playableCards[0] || null
        }

        // Check if LLM provider is active and tested
        const provider = this.gameSettings.llmProviders.find((p: any) => p.id === aiPlayer.llmProviderId)
        if (!provider || !provider.isActive || !provider.testSuccess) {
            console.log(`🚫 ${player.name}: BYPASSED LLM CALL - Provider not ready (${provider?.name || 'unknown'})`)
            console.log(`   Provider status: active=${provider?.isActive}, tested=${provider?.testSuccess}`)
            return await this.fallbackStrategy.chooseCard(playableCards, gameState, player)
        }

        console.log(`🤖 ${player.name}: NEEDS LLM CALL - ${playableCards.length} playable cards`)
        console.log(`   LLM Provider: ${provider.name} (${provider.model})`)
        console.log(`   Personality: ${aiPlayer.personality}`)
        console.log(`   Playable cards: ${playableCards.map(c => `${c.color} ${c.value}`).join(', ')}`)

        try {
            // Attempt actual LLM call
            console.log(`📡 ${player.name}: Making LLM API call...`)

            // Initialize LLM strategy if not already done
            if (!this.llmStrategy) {
                this.llmStrategy = new LLMAIStrategy(aiPlayer, this.gameSettings, this.moveHistory)
            }

            // Make actual LLM call using the LLMAIStrategy
            const llmCard = await this.llmStrategy.chooseCard(playableCards, gameState, player)

            if (llmCard) {
                console.log(`✅ ${player.name}: LLM call successful - chose ${llmCard.color} ${llmCard.value}`)
                this.logLLMDecision(player, playableCards, llmCard)
                return llmCard
            } else {
                console.log(`⚠️ ${player.name}: LLM call returned null, using fallback`)
                const fallbackCard = await this.fallbackStrategy.chooseCard(playableCards, gameState, player)
                this.logLLMDecision(player, playableCards, fallbackCard)
                return fallbackCard
            }
        } catch (error) {
            console.error(`❌ ${player.name}: LLM call failed:`, error)
            console.log(`🔄 ${player.name}: Falling back to basic AI strategy`)
            return await this.fallbackStrategy.chooseCard(playableCards, gameState, player)
        }
    }

    async chooseWildColor(hand: UnoCard[], gameState: IAIGameState, player: UnoPlayer): Promise<UnoColor> {
        console.log(`🔍 LLMWrapperStrategy.chooseWildColor called for ${player.name}`)
        console.log(`   Hand size: ${hand.length}`)
        console.log(`   Player is human: ${player.isHuman}`)

        // Check if this player should use LLM
        const aiPlayer = this.getAIPlayerForPlayer(player)
        if (!aiPlayer || !aiPlayer.llmProviderId) {
            console.log(`🚫 ${player.name}: BYPASSED LLM CALL (Wild Color) - No LLM provider configured`)
            return await this.fallbackStrategy.chooseWildColor(hand, gameState, player)
        }

        // Check if LLM provider is active and tested
        const provider = this.gameSettings.llmProviders.find((p: any) => p.id === aiPlayer.llmProviderId)
        if (!provider || !provider.isActive || !provider.testSuccess) {
            console.log(`🚫 ${player.name}: BYPASSED LLM CALL (Wild Color) - Provider not ready`)
            return await this.fallbackStrategy.chooseWildColor(hand, gameState, player)
        }

        console.log(`🎨 ${player.name}: NEEDS LLM CALL (Wild Color)`)
        console.log(`   LLM Provider: ${provider.name} (${provider.model})`)
        console.log(`   Personality: ${aiPlayer.personality}`)
        console.log(`   Hand: ${hand.map(c => `${c.color} ${c.value}`).join(', ')}`)

        try {
            // Attempt actual LLM call
            console.log(`📡 ${player.name}: Making LLM API call for wild color...`)

            // Initialize LLM strategy if not already done
            if (!this.llmStrategy) {
                this.llmStrategy = new LLMAIStrategy(aiPlayer, this.gameSettings, this.moveHistory)
            }

            // Make actual LLM call using the LLMAIStrategy
            const llmColor = await this.llmStrategy.chooseWildColor(hand, gameState, player)

            if (llmColor) {
                console.log(`✅ ${player.name}: LLM wild color call successful - chose ${llmColor}`)
                this.logLLMWildColorDecision(player, hand, llmColor)
                return llmColor
            } else {
                console.log(`⚠️ ${player.name}: LLM wild color call returned null, using fallback`)
                const fallbackColor = await this.fallbackStrategy.chooseWildColor(hand, gameState, player)
                this.logLLMWildColorDecision(player, hand, fallbackColor)
                return fallbackColor
            }
        } catch (error) {
            console.error(`❌ ${player.name}: LLM wild color call failed:`, error)
            console.log(`🔄 ${player.name}: Falling back to basic AI strategy for wild color`)
            return await this.fallbackStrategy.chooseWildColor(hand, gameState, player)
        }
    }

    private getAIPlayerForPlayer(player: UnoPlayer): any | null {
        if (player.isHuman) return null

        return this.gameSettings.aiPlayers.find((aiPlayer: any) =>
            aiPlayer.name === player.name && aiPlayer.isActive
        ) || null
    }

    private logLLMDecision(player: UnoPlayer, playableCards: UnoCard[], chosenCard: UnoCard | null) {
        const aiPlayer = this.getAIPlayerForPlayer(player)
        if (!aiPlayer) return

        console.log(`🧠 LLM Decision Log for ${player.name}:`)
        console.log(`   Available cards: ${playableCards.map(c => `${c.color} ${c.value}`).join(', ')}`)
        console.log(`   Chosen card: ${chosenCard ? `${chosenCard.color} ${chosenCard.value}` : 'none'}`)
        console.log(`   Personality: ${aiPlayer.personality}`)

        // Add to move history
        this.moveHistory.push({
            player: player.name,
            action: 'play',
            card: chosenCard ? `${chosenCard.color} ${chosenCard.value}` : undefined,
            timestamp: Date.now()
        })
    }

    private logLLMWildColorDecision(player: UnoPlayer, hand: UnoCard[], chosenColor: UnoColor) {
        const aiPlayer = this.getAIPlayerForPlayer(player)
        if (!aiPlayer) return

        console.log(`🎨 LLM Wild Color Decision Log for ${player.name}:`)
        console.log(`   Hand: ${hand.map(c => `${c.color} ${c.value}`).join(', ')}`)
        console.log(`   Chosen color: ${chosenColor}`)
        console.log(`   Personality: ${aiPlayer.personality}`)

        // Add to move history
        this.moveHistory.push({
            player: player.name,
            action: 'wild_color',
            card: chosenColor,
            timestamp: Date.now()
        })
    }

    // Method to get move history for debugging
    getMoveHistory() {
        return this.moveHistory
    }

    // Build context for LLM calls
    private buildLLMContext(playableCards: UnoCard[], gameState: IAIGameState, player: UnoPlayer) {
        const aiPlayer = this.getAIPlayerForPlayer(player)
        if (!aiPlayer) return null

        return {
            player: {
                name: player.name,
                personality: aiPlayer.personality,
                handSize: player.getHandSize(),
                hand: player.getHand().map(card => ({
                    id: card.id,
                    color: card.color,
                    value: card.value
                }))
            },
            gameState: {
                topCard: gameState.topCard ? {
                    color: gameState.topCard.color,
                    value: gameState.topCard.value
                } : null,
                wildColor: gameState.wildColor,
                direction: gameState.direction,
                players: gameState.players
            },
            playableCards: playableCards.map(card => ({
                id: card.id,
                color: card.color,
                value: card.value
            })),
            moveHistory: this.moveHistory.slice(-5), // Last 5 moves
            timestamp: Date.now()
        }
    }
}
