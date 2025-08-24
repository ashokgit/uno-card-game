"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Play,
    Settings,
    Trophy,
    Users,
    Zap,
    Brain,
    Volume2,
    Info,
    Star,
    BookOpen
} from "lucide-react"
import { GameSettings } from "./game-settings"
import { RulesModal } from "./rules-modal"
import { UnoRules } from "@/lib/uno-engine"

interface MainMenuProps {
    onStartGame: (rules: UnoRules, playerCount: number) => void
}

export function MainMenu({ onStartGame }: MainMenuProps) {
    const [showSettings, setShowSettings] = useState(false)
    const [showRules, setShowRules] = useState(false)
    const [currentRules, setCurrentRules] = useState<UnoRules>({
        stackDrawTwo: false,
        stackDrawFour: false,
        mustPlayIfDrawable: false,
        allowDrawWhenPlayable: true,
        targetScore: 500,
        debugMode: false,
        aiDifficulty: 'expert',
        enableJumpIn: false,
        enableSevenZero: false,
        enableSwapHands: false,
        showDiscardPile: true,
        deadlockResolution: 'end_round',
    })

    const handleStartGame = (rules: UnoRules, playerCount: number) => {
        setCurrentRules(rules)
        onStartGame(rules, playerCount)
    }

    const quickStart = () => {
        onStartGame(currentRules, 6)
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Enhanced casino background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

            {/* Casino table surface */}
            <div className="absolute inset-0 table-surface-enhanced">
                <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-slate-800/90 via-slate-700/70 to-transparent"></div>
                <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 bg-slate-700/20 rounded-full blur-3xl"></div>
            </div>

            {/* Ambient casino lighting effects */}
            <div className="absolute inset-0">
                <div className="lighting-effect"></div>
                <div className="lighting-effect"></div>
                <div className="lighting-effect"></div>
            </div>

            {/* Floating casino elements */}
            <div className="floating-casino-elements"></div>

            {/* Casino ambiance overlay */}
            <div className="casino-ambiance"></div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl">
                    {/* Logo and Title */}
                    <div className="text-center mb-12">
                        <div className="relative inline-block mb-6">
                            <img
                                src="/uno-arena.png"
                                alt="UNO Arena Logo"
                                className="w-32 h-32 object-contain drop-shadow-2xl animate-pulse"
                                style={{ animationDuration: '3s' }}
                            />
                            {/* Enhanced glow effect for the logo */}
                            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse scale-150"></div>
                            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-ping scale-125"></div>
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-4 fascinate-regular drop-shadow-2xl">
                            UNO ARENA
                        </h1>
                        <p className="text-xl text-gray-300 font-gaming-secondary">
                            The Ultimate UNO Experience
                        </p>
                    </div>

                    {/* Main Menu Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Quick Start */}
                        <Card className="p-6 bg-gradient-to-br from-blue-600/40 to-purple-600/40 border-blue-400/40 hover:border-blue-300/70 transition-all duration-300 hover:scale-105 cursor-pointer group shadow-lg hover:shadow-blue-500/20 backdrop-blur-sm" onClick={quickStart}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    <Play className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Quick Start</h3>
                                <p className="text-white/90 text-sm mb-4 leading-relaxed font-medium">Jump right into the action with default settings</p>
                                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md">6 Players • Expert AI</Badge>
                            </div>
                        </Card>

                        {/* Custom Game */}
                        <Card className="p-6 bg-gradient-to-br from-emerald-600/40 to-teal-600/40 border-emerald-400/40 hover:border-emerald-300/70 transition-all duration-300 hover:scale-105 cursor-pointer group shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm" onClick={() => setShowSettings(true)}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    <Settings className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Custom Game</h3>
                                <p className="text-white/90 text-sm mb-4 leading-relaxed font-medium">Configure rules, AI difficulty, and more</p>
                                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md">Fully Customizable</Badge>
                            </div>
                        </Card>

                        {/* How to Play and Rules */}
                        <Card className="p-6 bg-gradient-to-br from-amber-600/40 to-orange-600/40 border-amber-400/40 hover:border-amber-300/70 transition-all duration-300 hover:scale-105 cursor-pointer group shadow-lg hover:shadow-amber-500/20 backdrop-blur-sm" onClick={() => setShowRules(true)}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">How to Play</h3>
                                <p className="text-white/90 text-sm mb-4 leading-relaxed font-medium">Learn the rules and strategies</p>
                                <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-md">Rules & Tips</Badge>
                            </div>
                        </Card>

                        {/* Game Features */}
                        <Card className="p-6 bg-gradient-to-br from-purple-600/40 to-pink-600/40 border-purple-400/40 shadow-lg backdrop-blur-sm">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Star className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Features</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-center gap-3 bg-black/20 rounded-lg p-2 border border-white/10">
                                        <Brain className="w-5 h-5 text-cyan-400" />
                                        <span className="text-white font-semibold">Smart AI Opponents</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 bg-black/20 rounded-lg p-2 border border-white/10">
                                        <Zap className="w-5 h-5 text-yellow-400" />
                                        <span className="text-white font-semibold">House Rules Support</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 bg-black/20 rounded-lg p-2 border border-white/10">
                                        <Volume2 className="w-5 h-5 text-emerald-400" />
                                        <span className="text-white font-semibold">Sound & Music</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Current Settings Preview */}
                    <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 mb-8 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-cyan-400" />
                            Current Settings
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center bg-black/20 rounded-lg p-3 border border-white/10">
                                <p className="text-white/90 text-sm font-semibold">Players</p>
                                <p className="text-white font-bold text-lg">6</p>
                            </div>
                            <div className="text-center bg-black/20 rounded-lg p-3 border border-white/10">
                                <p className="text-white/90 text-sm font-semibold">AI Difficulty</p>
                                <p className="text-white font-bold text-lg capitalize">{currentRules.aiDifficulty}</p>
                            </div>
                            <div className="text-center bg-black/20 rounded-lg p-3 border border-white/10">
                                <p className="text-white/90 text-sm font-semibold">Target Score</p>
                                <p className="text-white font-bold text-lg">{currentRules.targetScore}</p>
                            </div>
                            <div className="text-center bg-black/20 rounded-lg p-3 border border-white/10">
                                <p className="text-white/90 text-sm font-semibold">House Rules</p>
                                <p className="text-white font-bold text-lg">
                                    {currentRules.enableJumpIn || currentRules.enableSevenZero || currentRules.enableSwapHands ? 'Enabled' : 'Off'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={quickStart}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg px-8 py-4 shadow-xl hover:shadow-2xl hover:shadow-blue-400/50 transition-all duration-300 font-gaming-secondary transform hover:scale-105"
                        >
                            <Play className="w-6 h-6 mr-2" />
                            Quick Start
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => setShowSettings(true)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg px-8 py-4 shadow-xl hover:shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 font-gaming-secondary transform hover:scale-105"
                        >
                            <Settings className="w-6 h-6 mr-2" />
                            Customize Game
                        </Button>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            <GameSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onStartGame={handleStartGame}
                currentRules={currentRules}
            />

            {/* Rules Modal */}
            <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        </div>
    )
}
