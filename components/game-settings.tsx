"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
    Settings,
    Gamepad2,
    Brain,
    Monitor,
    Volume2,
    Zap,
    Shuffle,
    RotateCcw,
    Target,
    Users,
    Palette,
    Info
} from "lucide-react"
import { UnoRules } from "@/lib/uno-engine"

interface GameSettingsProps {
    isOpen: boolean
    onClose: () => void
    onStartGame: (rules: UnoRules, playerCount: number) => void
    currentRules?: UnoRules
}

interface UISettings {
    animationSpeed: number
    soundEffects: boolean
    backgroundMusic: boolean
    musicVolume: number
    visualEffects: boolean
    autoUnoCall: boolean
    confirmActionCards: boolean
    showPlayableCards: boolean
    gameSpeed: number
}

const DEFAULT_UI_SETTINGS: UISettings = {
    animationSpeed: 1.0,
    soundEffects: true,
    backgroundMusic: true,
    musicVolume: 0.3,
    visualEffects: true,
    autoUnoCall: false,
    confirmActionCards: true,
    showPlayableCards: true,
    gameSpeed: 1.0,
}

export function GameSettings({ isOpen, onClose, onStartGame, currentRules }: GameSettingsProps) {
    const [rules, setRules] = useState<UnoRules>(currentRules || {
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

    const [uiSettings, setUISettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)
    const [playerCount, setPlayerCount] = useState(6)

    if (!isOpen) return null

    const updateRule = (key: keyof UnoRules, value: any) => {
        setRules(prev => ({ ...prev, [key]: value }))
    }

    const updateUISetting = (key: keyof UISettings, value: any) => {
        setUISettings(prev => ({ ...prev, [key]: value }))
    }

    const resetToDefaults = () => {
        setRules({
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
        setUISettings(DEFAULT_UI_SETTINGS)
        setPlayerCount(6)
    }

    const handleStartGame = () => {
        onStartGame(rules, playerCount)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600/30 shadow-2xl">
                <div className="p-6 border-b border-slate-600/30 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Game Settings</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetToDefaults}
                                className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50 hover:border-slate-400/50"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50 hover:border-slate-400/50"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <Tabs defaultValue="rules" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-600/30">
                            <TabsTrigger value="rules" className="data-[state=active]:bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                                <Gamepad2 className="w-4 h-4 mr-2" />
                                Rules
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold">
                                <Brain className="w-4 h-4 mr-2" />
                                AI
                            </TabsTrigger>
                            <TabsTrigger value="interface" className="data-[state=active]:bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">
                                <Monitor className="w-4 h-4 mr-2" />
                                Interface
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="data-[state=active]:bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold">
                                <Settings className="w-4 h-4 mr-2" />
                                Advanced
                            </TabsTrigger>
                        </TabsList>

                        {/* Game Rules Tab */}
                        <TabsContent value="rules" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Rules */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <Target className="w-4 h-4 text-white" />
                                        </div>
                                        Core Rules
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                                                                         <div>
                                                 <p className="text-white font-medium">Stack Draw Two</p>
                                                 <p className="text-white/80 text-sm">Allow stacking Draw Two cards</p>
                                             </div>
                                            <Switch
                                                checked={rules.stackDrawTwo}
                                                onCheckedChange={(checked) => updateRule('stackDrawTwo', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Stack Wild Draw Four</p>
                                                <p className="text-gray-400 text-sm">Allow stacking Wild Draw Four cards</p>
                                            </div>
                                            <Switch
                                                checked={rules.stackDrawFour}
                                                onCheckedChange={(checked) => updateRule('stackDrawFour', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Must Play If Drawable</p>
                                                <p className="text-gray-400 text-sm">Force playing drawn cards if possible</p>
                                            </div>
                                            <Switch
                                                checked={rules.mustPlayIfDrawable}
                                                onCheckedChange={(checked) => updateRule('mustPlayIfDrawable', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Allow Draw When Playable</p>
                                                <p className="text-gray-400 text-sm">Allow drawing even with playable cards</p>
                                            </div>
                                            <Switch
                                                checked={rules.allowDrawWhenPlayable}
                                                onCheckedChange={(checked) => updateRule('allowDrawWhenPlayable', checked)}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* House Rules */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                            <Shuffle className="w-4 h-4 text-white" />
                                        </div>
                                        House Rules
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Jump In</p>
                                                <p className="text-gray-400 text-sm">Play identical cards out of turn</p>
                                            </div>
                                            <Switch
                                                checked={rules.enableJumpIn}
                                                onCheckedChange={(checked) => updateRule('enableJumpIn', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Seven-Zero Rules</p>
                                                <p className="text-gray-400 text-sm">Enable 7-0 hand swapping and rotation</p>
                                            </div>
                                            <Switch
                                                checked={rules.enableSevenZero}
                                                onCheckedChange={(checked) => updateRule('enableSevenZero', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Swap Hands</p>
                                                <p className="text-gray-400 text-sm">Enable hand swapping house rule</p>
                                            </div>
                                            <Switch
                                                checked={rules.enableSwapHands}
                                                onCheckedChange={(checked) => updateRule('enableSwapHands', checked)}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Victory Conditions */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                                            <Target className="w-4 h-4 text-white" />
                                        </div>
                                        Victory Conditions
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-white font-medium">Target Score</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[rules.targetScore]}
                                                    onValueChange={([value]) => updateRule('targetScore', value)}
                                                    max={1000}
                                                    min={100}
                                                    step={50}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-blue-600 text-white min-w-[60px] text-center">
                                                    {rules.targetScore}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Player Count */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-white" />
                                        </div>
                                        Players
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-white font-medium">Number of Players</label>
                                            <Select value={playerCount.toString()} onValueChange={(value) => setPlayerCount(parseInt(value))}>
                                                <SelectTrigger className="mt-2 bg-black/50 border-white/20 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black/90 border-white/20">
                                                    {[2, 3, 4, 5, 6].map(num => (
                                                        <SelectItem key={num} value={num.toString()} className="text-white">
                                                            {num} Players
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* AI Settings Tab */}
                        <TabsContent value="ai" className="space-y-6 mt-6">
                            <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    AI Opponents
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-white font-medium">AI Difficulty</label>
                                        <Select value={rules.aiDifficulty} onValueChange={(value: any) => updateRule('aiDifficulty', value)}>
                                            <SelectTrigger className="mt-2 bg-black/50 border-white/20 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black/90 border-white/20">
                                                <SelectItem value="easy" className="text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span>Easy</span>
                                                        <Badge className="bg-green-600 text-xs">Random Play</Badge>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="normal" className="text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span>Normal</span>
                                                        <Badge className="bg-blue-600 text-xs">Basic Strategy</Badge>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="hard" className="text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span>Hard</span>
                                                        <Badge className="bg-orange-600 text-xs">Advanced</Badge>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="expert" className="text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span>Expert</span>
                                                        <Badge className="bg-red-600 text-xs">Master Level</Badge>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-white font-medium">Game Speed</label>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Slider
                                                value={[uiSettings.gameSpeed]}
                                                onValueChange={([value]) => updateUISetting('gameSpeed', value)}
                                                max={3}
                                                min={0.5}
                                                step={0.1}
                                                className="flex-1"
                                            />
                                            <Badge className="bg-purple-600 text-white min-w-[60px] text-center">
                                                {uiSettings.gameSpeed}x
                                            </Badge>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Controls AI thinking time and animation speed
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Interface Tab */}
                        <TabsContent value="interface" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Visual Settings */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <Palette className="w-4 h-4 text-white" />
                                        </div>
                                        Visual Settings
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Visual Effects</p>
                                                <p className="text-gray-400 text-sm">Particle effects and animations</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.visualEffects}
                                                onCheckedChange={(checked) => updateUISetting('visualEffects', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Show Playable Cards</p>
                                                <p className="text-gray-400 text-sm">Highlight cards you can play</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.showPlayableCards}
                                                onCheckedChange={(checked) => updateUISetting('showPlayableCards', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Confirm Action Cards</p>
                                                <p className="text-gray-400 text-sm">Show confirmation for special cards</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.confirmActionCards}
                                                onCheckedChange={(checked) => updateUISetting('confirmActionCards', checked)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white font-medium">Animation Speed</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[uiSettings.animationSpeed]}
                                                    onValueChange={([value]) => updateUISetting('animationSpeed', value)}
                                                    max={2}
                                                    min={0.5}
                                                    step={0.1}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-blue-600 text-white min-w-[60px] text-center">
                                                    {uiSettings.animationSpeed}x
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Audio Settings */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                            <Volume2 className="w-4 h-4 text-white" />
                                        </div>
                                        Audio Settings
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Sound Effects</p>
                                                <p className="text-gray-400 text-sm">Card sounds and feedback</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.soundEffects}
                                                onCheckedChange={(checked) => updateUISetting('soundEffects', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Background Music</p>
                                                <p className="text-gray-400 text-sm">Casino ambiance music</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.backgroundMusic}
                                                onCheckedChange={(checked) => updateUISetting('backgroundMusic', checked)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white font-medium">Music Volume</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[uiSettings.musicVolume]}
                                                    onValueChange={([value]) => updateUISetting('musicVolume', value)}
                                                    max={1}
                                                    min={0}
                                                    step={0.1}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-green-600 text-white min-w-[60px] text-center">
                                                    {Math.round(uiSettings.musicVolume * 100)}%
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Gameplay Settings */}
                                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-white" />
                                        </div>
                                        Gameplay
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Auto UNO Call</p>
                                                <p className="text-gray-400 text-sm">Automatically call UNO with one card</p>
                                            </div>
                                            <Switch
                                                checked={uiSettings.autoUnoCall}
                                                onCheckedChange={(checked) => updateUISetting('autoUnoCall', checked)}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Advanced Tab */}
                        <TabsContent value="advanced" className="space-y-6 mt-6">
                            <Card className="p-6 bg-black/30 border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-orange-400" />
                                    Advanced Options
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Debug Mode</p>
                                            <p className="text-gray-400 text-sm">Show detailed game information</p>
                                        </div>
                                        <Switch
                                            checked={rules.debugMode}
                                            onCheckedChange={(checked) => updateRule('debugMode', checked)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white font-medium">Deadlock Resolution</label>
                                        <Select value={rules.deadlockResolution} onValueChange={(value: any) => updateRule('deadlockResolution', value)}>
                                            <SelectTrigger className="mt-2 bg-black/50 border-white/20 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black/90 border-white/20">
                                                <SelectItem value="end_round" className="text-white">
                                                    End Round - End the round when deadlock detected
                                                </SelectItem>
                                                <SelectItem value="force_reshuffle" className="text-white">
                                                    Force Reshuffle - Reshuffle to continue playing
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Show Full Discard Pile</p>
                                            <p className="text-gray-400 text-sm">Allow viewing entire discard pile</p>
                                        </div>
                                        <Switch
                                            checked={rules.showDiscardPile}
                                            onCheckedChange={(checked) => updateRule('showDiscardPile', checked)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-6 border-t border-white/20 bg-black/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Info className="w-5 h-5 text-blue-400" />
                            <p className="text-gray-400 text-sm">
                                Settings will be applied when you start a new game
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="bg-black/30 text-white border-white/20 hover:bg-black/50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStartGame}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
                            >
                                Start Game
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
