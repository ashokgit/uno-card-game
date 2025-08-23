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
    Check
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
    type: 'action' | 'turn' | 'event' | 'stat'
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
        const recentEvents = eventLog.slice(-10) // Get last 10 events

        recentEvents.forEach(event => {
            switch (event.event) {
                case 'onCardPlayed':
                    setStats(prev => ({
                        ...prev,
                        cardsPlayed: prev.cardsPlayed + 1,
                        actionCardsPlayed: event.data[1]?.isActionCard?.() ? prev.actionCardsPlayed + 1 : prev.actionCardsPlayed,
                        wildCardsPlayed: event.data[1]?.isWildCard?.() ? prev.wildCardsPlayed + 1 : prev.wildCardsPlayed,
                    }))
                    addLog({
                        type: 'action',
                        message: `${event.data[0]?.name || 'Unknown'} played ${event.data[1]?.value || 'card'}`,
                        player: event.data[0]?.name,
                        data: event.data[1]
                    })
                    break

                case 'onCardDrawn':
                    setStats(prev => ({
                        ...prev,
                        cardsDrawn: prev.cardsDrawn + 1,
                    }))
                    addLog({
                        type: 'action',
                        message: `${event.data[0]?.name || 'Unknown'} drew a card${event.data[2] ? ' (auto-played)' : ''}`,
                        player: event.data[0]?.name
                    })
                    break

                case 'onTurnChange':
                    setStats(prev => ({
                        ...prev,
                        totalTurns: prev.totalTurns + 1,
                    }))
                    addLog({
                        type: 'turn',
                        message: `Turn: ${event.data[0]?.name || 'Unknown'} (${event.data[1]})`,
                        player: event.data[0]?.name,
                        data: { direction: event.data[1] }
                    })
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

                case 'onActionCardPlayed':
                    addLog({
                        type: 'event',
                        message: `⚡ ${event.data[2] || 'Action card effect'}`,
                        player: event.data[0]?.name
                    })
                    break

                case 'onDeckReshuffled':
                    addLog({
                        type: 'event',
                        message: `🔄 Deck reshuffled (${event.data[0]} cards remaining)`,
                    })
                    break
            }
        })
    }, [gameEngine?.getEventLog().length])

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
            default: return '📝'
        }
    }

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'action': return 'text-blue-300'
            case 'turn': return 'text-green-300'
            case 'event': return 'text-yellow-300'
            case 'stat': return 'text-purple-300'
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
                    className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                    onClick={onToggleVisibility}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="absolute bottom-4 left-4 z-30">
            <Card className="w-96 h-80 bg-black/60 backdrop-blur-sm border-white/20 shadow-2xl">
                <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-semibold">Game Log</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                onClick={copyLogsToClipboard}
                                title="Copy logs to clipboard"
                            >
                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                onClick={clearLogs}
                                title="Clear logs"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                onClick={onToggleVisibility}
                                title="Hide log"
                            >
                                <EyeOff className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex h-full">
                    {/* Stats Panel */}
                    <div className="w-1/2 p-2 border-r border-white/10 overflow-y-auto">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Clock className="w-4 h-4" />
                                <span>{Math.floor(gameDuration / 60)}:{(gameDuration % 60).toString().padStart(2, '0')}</span>
                            </div>

                            <div className="space-y-0.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Turns:</span>
                                    <span className="text-white">{stats.totalTurns}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Played:</span>
                                    <span className="text-blue-300">{stats.cardsPlayed}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Drawn:</span>
                                    <span className="text-green-300">{stats.cardsDrawn}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Actions:</span>
                                    <span className="text-yellow-300">{stats.actionCardsPlayed}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Wild:</span>
                                    <span className="text-purple-300">{stats.wildCardsPlayed}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">UNO:</span>
                                    <span className="text-red-300">{stats.unoCalls}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/70">Challenges:</span>
                                    <span className="text-orange-300">{stats.challenges}</span>
                                </div>
                            </div>

                            {/* Current Game State */}
                            <div className="pt-2 border-t border-white/10">
                                <div className="text-sm text-white/70 mb-1">Current State:</div>
                                <div className="space-y-0.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Direction:</span>
                                        <span className="text-white">{direction}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Top Card:</span>
                                        <span className="text-white">{currentCard?.value || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Players:</span>
                                        <span className="text-white">{players.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Log Panel */}
                    <div className="w-1/2 h-full overflow-hidden">
                        <ScrollArea ref={scrollAreaRef} className="h-full">
                            <div className="p-2 space-y-0.5 max-h-full">
                                {logs.length === 0 ? (
                                    <div className="text-center text-white/50 text-sm py-4">
                                        <Info className="w-4 h-4 mx-auto mb-1" />
                                        No logs yet
                                    </div>
                                ) : (
                                    logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className={`text-sm ${getLogColor(log.type)} flex items-start gap-1 py-1`}
                                        >
                                            <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate leading-tight">{log.message}</div>
                                                <div className="text-white/50 text-xs leading-tight">
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
            </Card>
        </div>
    )
}
