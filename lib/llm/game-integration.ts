import { UnoGame, UnoCard, UnoPlayer, UnoColor, IAIGameState, IAIStrategy } from '../uno-engine'
import { GameSettings } from '@/contexts/settings-context'
import { LLMWrapperStrategy } from './wrapper-strategy'

// UPDATE THE FACTORY FUNCTION
export function createLLMEnabledGame(
    playerNames: string[],
    humanPlayerIndex: number,
    rules: any,
    events: any,
    skipInitialDeal: boolean,
    gameSettings: GameSettings
): UnoGame {
    const game = new UnoGame(playerNames, humanPlayerIndex, rules, events, skipInitialDeal);
    const fallbackStrategy = (game as any).enhancedAIStrategy;

    // ✅ USE THE NEW CLASS
    const llmWrapperStrategy = new LLMWrapperStrategy(gameSettings, fallbackStrategy);

    // Use the proper method to set the enhanced AI strategy
    game.setEnhancedAIStrategy(llmWrapperStrategy);

    console.log('🎮 LLM-enabled game engine created with proper wrapper class.');
    console.log('📊 LLM Configuration:');
    console.log(`   - LLM Providers: ${gameSettings.llmProviders.filter(p => p.isActive).length} active`);
    console.log(`   - LLM Players: ${gameSettings.aiPlayers.filter(p => p.llmProviderId && p.isActive).length} configured`);
    console.log(`   - Total AI Players: ${gameSettings.aiPlayers.filter(p => p.isActive).length} active`);

    // Log which players have LLM configured
    const llmPlayers = gameSettings.aiPlayers.filter(p => p.llmProviderId && p.isActive);
    if (llmPlayers.length > 0) {
        console.log('🤖 LLM-Enabled Players:');
        llmPlayers.forEach(player => {
            const provider = gameSettings.llmProviders.find(p => p.id === player.llmProviderId);
            console.log(`   - ${player.name}: ${provider?.name || 'Unknown Provider'}`);
        });
    }

    return game;
}

// Utility function to check if a player should use LLM
export function shouldUseLLM(playerName: string, gameSettings: GameSettings): boolean {
    const aiPlayer = gameSettings.aiPlayers.find((p: any) => p.name === playerName)
    return !!(aiPlayer && aiPlayer.isActive && aiPlayer.llmProviderId)
}

// Utility function to get LLM provider info for a player
export function getLLMProviderInfo(playerName: string, gameSettings: GameSettings) {
    const aiPlayer = gameSettings.aiPlayers.find((p: any) => p.name === playerName)
    if (!aiPlayer || !aiPlayer.llmProviderId) return null

    const provider = gameSettings.llmProviders.find((p: any) => p.id === aiPlayer.llmProviderId)
    return {
        player: aiPlayer,
        provider: provider,
        isActive: provider?.isActive && provider?.testSuccess
    }
}
