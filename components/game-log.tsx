"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
    Activity,
    Clock,
    Users,
    Trophy,
    Target,
    TrendingUp,
    Eye,
    EyeOff,
    Trash2,
    Info,
    Copy,
    Check,
    Bug
} from "lucide-react"
import { UnoGame } from "@/lib/uno-engine"

interface GameLogProps {
    gameEngine: UnoGame | null
    players: any[]
    currentCard: any
    direction: string
    isVisible?: boolean
    onToggleVisibility?: () => void
}

interface LogEntry {
    id: string
    timestamp: number
    type: 'action' | 'turn' | 'event' | 'stat' | 'state'
    message: string
    player?: string
    data?: any
}

export function GameLog({
    gameEngine,
    players,
    currentCard,
    direction,
    isVisible = true,
    onToggleVisibility
}: GameLogProps) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [stats, setStats] = useState({
        totalTurns: 0,
        cardsPlayed: 0,
        cardsDrawn: 0,
        actionCardsPlayed: 0,
        wildCardsPlayed: 0,
        unoCalls: 0,
        challenges: 0,
        gameStartTime: Date.now(),
    })
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)
    const [debugMode, setDebugMode] = useState(true) // Enable debug mode by default for testing
    const [processedEventCount, setProcessedEventCount] = useState(0)

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight
            }
        }
    }, [logs])

    // Add log entry
    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            ...entry,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
        }
        setLogs(prev => [...prev.slice(-49), newEntry]) // Keep last 50 entries
    }

    // Update stats when game state changes
    useEffect(() => {
        if (!gameEngine) return

        const eventLog = gameEngine.getEventLog()

        // Handle case where event log was cleared (e.g., game restart)
        if (eventLog.length < processedEventCount) {
            setProcessedEventCount(0)
        }

        const newEvents = eventLog.slice(processedEventCount) // Only process new events

        newEvents.forEach(event => {
            switch (event.event) {
                case 'onCardPlayed':
                    setStats(prev => ({
                        ...prev,
                        cardsPlayed: prev.cardsPlayed + 1,
                        actionCardsPlayed: event.data[1]?.isActionCard?.() ? prev.actionCardsPlayed + 1 : prev.actionCardsPlayed,
                        wildCardsPlayed: event.data[1]?.isWildCard?.() ? prev.wildCardsPlayed + 1 : prev.wildCardsPlayed,
                    }))

                    // Enhanced logging for card plays
                    const card = event.data[1]
                    const player = event.data[0]
                    let cardDescription = card?.value || 'card'

                    if (card?.isWildCard()) {
                        const chosenColor = event.data[2] || 'unknown'
                        cardDescription = `Wild (→ ${chosenColor})`
                    } else if (card?.isActionCard()) {
                        cardDescription = `${card.value} (${card.color})`
                    } else {
                        cardDescription = `${card.value} (${card.color})`
                    }

                    addLog({
                        type: 'action',
                        message: `${player?.name || 'Unknown'} played ${cardDescription}`,
                        player: player?.name,
                        data: card
                    })

                    // Enhanced AI decision logging
                    if (debugMode && player && !player.isHuman && gameEngine) {
                        const playerObj = gameEngine.getPlayers().find(p => p.id === player.id)
                        if (playerObj) {
                            const handSize = playerObj.getHandSize()
                            const topCard = gameEngine.getTopCard()
                            const wildColor = gameEngine.getWildColor()

                            if (topCard) {
                                const playableCards = playerObj.getPlayableCards(topCard, wildColor || undefined)
                                addLog({
                                    type: 'stat',
                                    message: `🤖 ${player.name} AI: ${handSize} cards, ${playableCards.length} playable, chose ${card.color} ${card.value}`,
                                    player: player.name,
                                    data: {
                                        handSize,
                                        playableCount: playableCards.length,
                                        chosenCard: `${card.color} ${card.value}`,
                                        playableCards: playableCards.map(c => `${c.color} ${c.value}`)
                                    }
                                })
                            }
                        }
                    }

                    // Log deck state after card play
                    if (debugMode && gameEngine) {
                        const deckCount = gameEngine.getDeckCount()
                        const discardCount = gameEngine.getDiscardPile().length
                        const topCard = gameEngine.getTopCard()

                        addLog({
                            type: 'state',
                            message: `📊 Deck after play: ${deckCount} cards | Discard: ${discardCount} cards | Top: ${topCard ? `${topCard.color} ${topCard.value}` : 'None'}`,
                            data: { deckCount, discardCount, topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None' }
                        })
                    }
                    break

                case 'onCardDrawn':
                    setStats(prev => ({
                        ...prev,
                        cardsDrawn: prev.cardsDrawn + 1,
                    }))

                    const drawnPlayer = event.data[0]
                    const drawnCard = event.data[1]
                    const autoPlayed = event.data[2]

                    let drawMessage = `${drawnPlayer?.name || 'Unknown'} drew a card`
                    if (drawnCard) {
                        drawMessage = `${drawnPlayer?.name || 'Unknown'} drew ${drawnCard.color} ${drawnCard.value}`
                    }
                    if (autoPlayed) {
                        drawMessage += ' (auto-played)'
                    }

                    addLog({
                        type: 'action',
                        message: drawMessage,
                        player: drawnPlayer?.name,
                        data: { card: drawnCard, autoPlayed }
                    })

                    // Add detailed hand update if debug mode is enabled
                    if (debugMode && drawnPlayer && gameEngine) {
                        const playerObj = gameEngine.getPlayers().find(p => p.id === drawnPlayer.id)
                        if (playerObj) {
                            const handCards = playerObj.getHand().map(c => `${c.color} ${c.value}`)
                            addLog({
                                type: 'state',
                                message: `📋 ${drawnPlayer.name} hand after draw: [${handCards.join(', ')}]`,
                                player: drawnPlayer.name,
                                data: { handSize: playerObj.getHandSize(), cards: handCards }
                            })
                        }
                    }

                    // Enhanced AI draw logging
                    if (debugMode && drawnPlayer && !drawnPlayer.isHuman && gameEngine) {
                        const playerObj = gameEngine.getPlayers().find(p => p.id === drawnPlayer.id)
                        if (playerObj) {
                            const handSize = playerObj.getHandSize()
                            const topCard = gameEngine.getTopCard()
                            const wildColor = gameEngine.getWildColor()

                            if (topCard && drawnCard) {
                                const playableCards = playerObj.getPlayableCards(topCard, wildColor || undefined)
                                const drawnCardPlayable = drawnCard.canPlayOn(topCard, wildColor || undefined, [])

                                addLog({
                                    type: 'stat',
                                    message: `🤖 ${drawnPlayer.name} AI drew ${drawnCard.color} ${drawnCard.value} (playable: ${drawnCardPlayable}) - now has ${handSize} cards, ${playableCards.length} playable`,
                                    player: drawnPlayer.name,
                                    data: {
                                        drawnCard: `${drawnCard.color} ${drawnCard.value}`,
                                        isPlayable: drawnCardPlayable,
                                        handSize,
                                        playableCount: playableCards.length,
                                        playableCards: playableCards.map(c => `${c.color} ${c.value}`)
                                    }
                                })
                            }
                        }
                    }
                    break

                case 'onTurnChange':
                    setStats(prev => ({
                        ...prev,
                        totalTurns: prev.totalTurns + 1,
                    }))

                    const turnPlayer = event.data[0]
                    const direction = event.data[1]
                    let turnMessage = `Turn: ${turnPlayer?.name || 'Unknown'} (${direction})`

                    // Add UNO warning if player has one card
                    if (turnPlayer && gameEngine) {
                        const playerObj = gameEngine.getPlayers().find(p => p.id === turnPlayer.id)
                        if (playerObj && playerObj.hasOneCard()) {
                            turnMessage += ' [1 CARD - CALL UNO!]'
                        }
                    }

                    addLog({
                        type: 'turn',
                        message: turnMessage,
                        player: turnPlayer?.name,
                        data: { direction }
                    })

                    // Add detailed player state log if debug mode is enabled
                    if (debugMode && gameEngine) {
                        const topCard = gameEngine.getTopCard()
                        const wildColor = gameEngine.getWildColor()

                        // Log current player's hand and playable cards
                        if (turnPlayer) {
                            const playerObj = gameEngine.getPlayers().find(p => p.id === turnPlayer.id)
                            if (playerObj && topCard) {
                                const handCards = playerObj.getHand().map(c => `${c.color} ${c.value}`)
                                const playableCards = playerObj.getPlayableCards(topCard, wildColor || undefined)
                                    .map(c => `${c.color} ${c.value}`)

                                addLog({
                                    type: 'state',
                                    message: `📋 ${turnPlayer.name}: ${playerObj.getHandSize()} cards [${handCards.join(', ')}]`,
                                    player: turnPlayer.name,
                                    data: { handSize: playerObj.getHandSize(), cards: handCards }
                                })

                                if (playableCards.length > 0) {
                                    addLog({
                                        type: 'state',
                                        message: `🎯 ${turnPlayer.name} can play: [${playableCards.join(', ')}]`,
                                        player: turnPlayer.name,
                                        data: { playableCards }
                                    })
                                } else {
                                    addLog({
                                        type: 'state',
                                        message: `❌ ${turnPlayer.name} has no playable cards - must draw`,
                                        player: turnPlayer.name,
                                        data: { playableCards: [] }
                                    })

                                    // Enhanced AI no-playable-cards logging
                                    if (!turnPlayer.isHuman) {
                                        addLog({
                                            type: 'stat',
                                            message: `🤖 ${turnPlayer.name} AI: No playable cards, must draw from deck`,
                                            player: turnPlayer.name,
                                            data: {
                                                handSize: playerObj.getHandSize(),
                                                handCards: handCards,
                                                topCard: `${topCard.color} ${topCard.value}`,
                                                wildColor: wildColor
                                            }
                                        })
                                    }

                                    // Log deck state when player has no playable cards
                                    if (debugMode && gameEngine) {
                                        const deckCount = gameEngine.getDeckCount()
                                        const discardCount = gameEngine.getDiscardPile().length

                                        if (deckCount === 0) {
                                            addLog({
                                                type: 'state',
                                                message: `⚠️ WARNING: Deck is empty (${discardCount} cards in discard pile) - ${turnPlayer.name} cannot draw!`,
                                                data: { deckCount, discardCount, player: turnPlayer.name }
                                            })
                                        }
                                    }
                                }
                            }
                        }

                        // Log game state summary
                        const allPlayers = gameEngine.getPlayers()
                        const handSizes = allPlayers.map(p => `${p.name}: ${p.getHandSize()}`).join(', ')
                        const deckCount = gameEngine.getDeckCount()
                        const discardCount = gameEngine.getDiscardPile().length

                        addLog({
                            type: 'state',
                            message: `📊 Game State: ${handSizes} | Deck: ${deckCount} | Discard: ${discardCount} | Top: ${topCard ? `${topCard.color} ${topCard.value}` : 'None'}`,
                            data: {
                                handSizes: allPlayers.map(p => ({ name: p.name, handSize: p.getHandSize() })),
                                deckCount,
                                discardCount,
                                topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None'
                            }
                        })
                    }
                    break

                case 'onUnoCalled':
                    setStats(prev => ({
                        ...prev,
                        unoCalls: prev.unoCalls + 1,
                    }))
                    addLog({
                        type: 'event',
                        message: `🎉 ${event.data[0]?.name || 'Unknown'} called UNO!`,
                        player: event.data[0]?.name
                    })
                    break

                case 'onUnoChallenged':
                    setStats(prev => ({
                        ...prev,
                        challenges: prev.challenges + 1,
                    }))
                    addLog({
                        type: 'event',
                        message: `${event.data[0]?.name || 'Unknown'} challenged ${event.data[1]?.name || 'Unknown'}'s UNO ${event.data[2] ? '✅' : '❌'}`,
                        player: event.data[0]?.name
                    })
                    break



                case 'onDeckReshuffled':
                    addLog({
                        type: 'event',
                        message: `🔄 Deck reshuffled (${event.data[0]} cards remaining)`,
                    })

                    // Add detailed deck state if debug mode is enabled
                    if (debugMode && gameEngine) {
                        const deckCount = gameEngine.getDeckCount()
                        const discardCount = gameEngine.getDiscardPile().length
                        const topCard = gameEngine.getTopCard()

                        addLog({
                            type: 'state',
                            message: `📊 Deck State: ${deckCount} cards | Discard: ${discardCount} cards | Top: ${topCard ? `${topCard.color} ${topCard.value}` : 'None'}`,
                            data: { deckCount, discardCount, topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None' }
                        })
                    }
                    break

                case 'onActionCardPlayed':
                    // Log action card effects
                    const actionCardPlayer = event.data[0]
                    const actionCardData = event.data[1]
                    const actionEffect = event.data[2]

                    addLog({
                        type: 'event',
                        message: `⚡ ${actionCardPlayer?.name || 'Unknown'}: ${actionEffect}`,
                        player: actionCardPlayer?.name,
                        data: { card: actionCardData, effect: actionEffect }
                    })

                    // Log deck state after action card
                    if (debugMode && gameEngine) {
                        const deckCount = gameEngine.getDeckCount()
                        const discardCount = gameEngine.getDiscardPile().length
                        const topCard = gameEngine.getTopCard()
                        const drawPenalty = gameEngine.getDrawPenalty()
                        const skipNext = gameEngine.getState().gameState.skipNext

                        addLog({
                            type: 'state',
                            message: `📊 After action: Deck ${deckCount} | Discard ${discardCount} | Top ${topCard ? `${topCard.color} ${topCard.value}` : 'None'} | Penalty ${drawPenalty} | Skip ${skipNext}`,
                            data: {
                                deckCount,
                                discardCount,
                                topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None',
                                drawPenalty,
                                skipNext
                            }
                        })
                    }
                    break
            }
        })

        // Update processed event count
        setProcessedEventCount(eventLog.length)
    }, [gameEngine, processedEventCount, debugMode])

    const clearLogs = () => {
        setLogs([])
        setStats({
            totalTurns: 0,
            cardsPlayed: 0,
            cardsDrawn: 0,
            actionCardsPlayed: 0,
            wildCardsPlayed: 0,
            unoCalls: 0,
            challenges: 0,
            gameStartTime: Date.now(),
        })
        setProcessedEventCount(0)
    }

    const copyLogsToClipboard = async () => {
        const logText = logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString()
            return `[${timestamp}] ${log.message}`
        }).join('\n')

        const statsText = `
Game Statistics:
- Game Duration: ${Math.floor(gameDuration / 60)}:${(gameDuration % 60).toString().padStart(2, '0')}
- Total Turns: ${stats.totalTurns}
- Cards Played: ${stats.cardsPlayed}
- Cards Drawn: ${stats.cardsDrawn}
- Action Cards: ${stats.actionCardsPlayed}
- Wild Cards: ${stats.wildCardsPlayed}
- UNO Calls: ${stats.unoCalls}
- Challenges: ${stats.challenges}
- Current Direction: ${direction}
- Top Card: ${currentCard?.value || 'None'}
- Players: ${players.length}
        `.trim()

        const fullText = `${statsText}\n\nGame Log:\n${logText}`

        try {
            await navigator.clipboard.writeText(fullText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const getLogIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'action': return '🎮'
            case 'turn': return '🔄'
            case 'event': return '⚡'
            case 'stat': return '📊'
            case 'state': return '📋'
            default: return '📝'
        }
    }

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'action': return 'text-blue-300'
            case 'turn': return 'text-green-300'
            case 'event': return 'text-yellow-300'
            case 'stat': return 'text-purple-300'
            case 'state': return 'text-cyan-300'
            default: return 'text-gray-300'
        }
    }

    const formatTime = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        return `${Math.floor(diff / 3600000)}h ago`
    }

    const gameDuration = Math.floor((Date.now() - stats.gameStartTime) / 1000)

    if (!isVisible) {
        return (
            <div className="absolute bottom-4 left-4 z-30">
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-black/50 text-white border-white/20 hover:bg-black/70 transition-all duration-300"
                    onClick={onToggleVisibility}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="absolute left-0 top-0 h-full z-30">
            <div className="flex h-full">
                {/* Collapsible Sidebar */}
                <div className="w-80 h-full bg-black/80 backdrop-blur-lg border-r border-white/20 shadow-2xl transition-all duration-300">
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-white" />
                                <span className="text-white text-lg font-semibold">Game Log</span>
                                {debugMode && (
                                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                        DEBUG
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-7 w-7 p-0 hover:text-white hover:bg-white/10 ${debugMode ? 'text-green-400' : 'text-white/70'}`}
                                    onClick={() => setDebugMode(!debugMode)}
                                    title="Toggle debug mode"
                                >
                                    <Bug className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={copyLogsToClipboard}
                                    title="Copy logs to clipboard"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={clearLogs}
                                    title="Clear logs"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={onToggleVisibility}
                                    title="Hide log"
                                >
                                    <EyeOff className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full">
                        {/* Stats Panel */}
                        <div className="p-4 border-b border-white/10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-white/80">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-semibold">{Math.floor(gameDuration / 60)}:{(gameDuration % 60).toString().padStart(2, '0')}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Turns:</span>
                                        <span className="text-white font-semibold">{stats.totalTurns}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Played:</span>
                                        <span className="text-blue-300 font-semibold">{stats.cardsPlayed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Drawn:</span>
                                        <span className="text-green-300 font-semibold">{stats.cardsDrawn}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Actions:</span>
                                        <span className="text-yellow-300 font-semibold">{stats.actionCardsPlayed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Wild:</span>
                                        <span className="text-purple-300 font-semibold">{stats.wildCardsPlayed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">UNO:</span>
                                        <span className="text-red-300 font-semibold">{stats.unoCalls}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Challenges:</span>
                                        <span className="text-orange-300 font-semibold">{stats.challenges}</span>
                                    </div>
                                    {debugMode && (
                                        <div className="flex justify-between">
                                            <span className="text-green-400/70">Debug Mode:</span>
                                            <span className="text-green-400 font-semibold">ON</span>
                                        </div>
                                    )}
                                </div>

                                {/* Current Game State */}
                                <div className="pt-3 border-t border-white/10">
                                    <div className="text-sm text-white/70 mb-2 font-semibold">Current State:</div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Direction:</span>
                                            <span className="text-white font-semibold">{direction}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Top Card:</span>
                                            <span className="text-white font-semibold">{currentCard?.value || 'None'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Players:</span>
                                            <span className="text-white font-semibold">{players.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Log Panel */}
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea ref={scrollAreaRef} className="h-full">
                                <div className="p-4 space-y-1">
                                    {logs.length === 0 ? (
                                        <div className="text-center text-white/50 text-sm py-8">
                                            <Info className="w-6 h-6 mx-auto mb-2" />
                                            No logs yet
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className={`text-sm ${getLogColor(log.type)} flex items-start gap-2 py-2 border-b border-white/5 last:border-b-0`}
                                            >
                                                <span className="flex-shrink-0 text-lg">{getLogIcon(log.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="leading-tight font-medium">{log.message}</div>
                                                    <div className="text-white/50 text-xs leading-tight mt-1">
                                                        {formatTime(log.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
