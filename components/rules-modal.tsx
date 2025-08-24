"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    X,
    BookOpen,
    Target,
    Zap,
    AlertTriangle,
    CheckCircle,
    Info,
    Users,
    Clock,
    Star,
    Trophy,
    Lightbulb
} from "lucide-react"

interface RulesModalProps {
    isOpen: boolean
    onClose: () => void
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-600/50 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-gradient-to-r from-slate-800 to-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">How to Play UNO</h2>
                            <p className="text-slate-300 text-sm">Complete rules and strategies</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <Tabs defaultValue="basics" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-600">
                            <TabsTrigger value="basics" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                                <Target className="w-4 h-4 mr-2" />
                                Basics
                            </TabsTrigger>
                            <TabsTrigger value="cards" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                                <Zap className="w-4 h-4 mr-2" />
                                Cards
                            </TabsTrigger>
                            <TabsTrigger value="rules" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Rules
                            </TabsTrigger>
                            <TabsTrigger value="strategy" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Strategy
                            </TabsTrigger>
                        </TabsList>

                        {/* Basics Tab */}
                        <TabsContent value="basics" className="mt-6 space-y-6">
                            <Card className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    Game Objective
                                </h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Be the first player to get rid of all your cards! The game ends when one player has no cards left.
                                </p>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-emerald-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                    Setup
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>Each player starts with 7 cards</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>One card is placed face-up to start the discard pile</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>Play proceeds clockwise (or counterclockwise with Reverse cards)</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                    Turn Structure
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span>Play a card that matches the color, number, or symbol of the top card</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span>If you can't play, draw a card from the deck</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span>If you draw a playable card, you may play it immediately</span>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Cards Tab */}
                        <TabsContent value="cards" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6 bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-400/30">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                                        Number Cards (0-9)
                                    </h3>
                                    <p className="text-slate-300 text-sm">
                                        Basic cards with numbers 0-9. Play them on matching colors or numbers.
                                    </p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        Action Cards
                                    </h3>
                                    <div className="space-y-2 text-slate-300 text-sm">
                                        <div><strong>Skip:</strong> Next player loses their turn</div>
                                        <div><strong>Reverse:</strong> Changes direction of play</div>
                                        <div><strong>Draw Two:</strong> Next player draws 2 cards and skips turn</div>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-purple-400" />
                                        Wild Cards
                                    </h3>
                                    <div className="space-y-2 text-slate-300 text-sm">
                                        <div><strong>Wild:</strong> Change the color to any color you choose</div>
                                        <div><strong>Wild Draw Four:</strong> Change color + next player draws 4 cards and skips turn</div>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-green-400" />
                                        Card Matching
                                    </h3>
                                    <p className="text-slate-300 text-sm">
                                        You can play a card if it matches the <strong>color</strong> or <strong>number/symbol</strong> of the top card. Wild cards can be played anytime.
                                    </p>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Rules Tab */}
                        <TabsContent value="rules" className="mt-6 space-y-6">
                            <Card className="p-6 bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                    The UNO Rule
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span>When you have <strong>exactly 1 card left</strong>, you MUST call "UNO!"</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span>You have <strong>2 seconds</strong> to call UNO after playing your second-to-last card</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span>If you don't call UNO in time, you draw <strong>2 penalty cards</strong></span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span>Other players can challenge your UNO call if they think you forgot</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                    Special Rules
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Wild Draw Four Challenge:</strong> If you suspect someone played Wild Draw Four when they had a matching card, you can challenge them</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>False UNO Challenge:</strong> Challenge players who call UNO when they have more than 1 card</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Stacking:</strong> Some house rules allow stacking Draw Two and Wild Draw Four cards</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-emerald-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                    Winning
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>First player to play their last card wins the round</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>Points are awarded based on remaining cards in other players' hands</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>Game continues until someone reaches the target score (default: 500 points)</span>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Strategy Tab */}
                        <TabsContent value="strategy" className="mt-6 space-y-6">
                            <Card className="p-6 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-purple-400" />
                                    Basic Strategy
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Save Wild cards</strong> for when you're close to winning or in emergencies</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Use action cards strategically</strong> to skip players who are close to winning</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Pay attention to other players' card counts</strong> to anticipate their moves</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Don't forget to call UNO!</strong> Set a reminder or use auto-UNO call</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-400" />
                                    Advanced Tips
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Color management:</strong> Try to keep cards of the same color to increase playable options</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Timing:</strong> Use Draw Two and Wild Draw Four when the next player is close to winning</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Bluffing:</strong> Sometimes it's worth drawing cards to avoid revealing your strategy</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Challenge wisely:</strong> Only challenge Wild Draw Four when you're confident</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-green-400" />
                                    Game Settings Tips
                                </h3>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>Auto UNO Call:</strong> Enable this setting to automatically call UNO when you have one card</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>AI Difficulty:</strong> Start with "Easy" to learn, then increase difficulty</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span><strong>House Rules:</strong> Experiment with different rule combinations for variety</span>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-600/50 bg-gradient-to-r from-slate-800 to-slate-700">
                    <div className="flex justify-between items-center">
                        <p className="text-slate-400 text-sm">
                            Ready to play? Click outside or press ESC to close
                        </p>
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            Got it!
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
