"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    Info,
    Download,
    Upload,
    Plus,
    Trash2
} from "lucide-react"
import { UnoRules } from "@/lib/uno-engine"
import { useSettings } from "@/contexts/settings-context"
import { LLMConnectionTestPanel, LLMConnectionTest } from "@/components/llm-connection-test"
import { llmManager } from "@/lib/llm"

interface GameSettingsProps {
    isOpen: boolean
    onClose: () => void
    onStartGame: (rules: UnoRules, playerCount: number) => void
    currentRules?: UnoRules
}

export function GameSettings({ isOpen, onClose, onStartGame, currentRules }: GameSettingsProps) {
    const {
        uiSettings,
        gameSettings,
        updateUISetting,
        updateRule,
        updateGameSetting,
        addLLMProvider,
        updateLLMProvider,
        updateLLMProviderTestResult,
        removeLLMProvider,
        addAIPlayer,
        updateAIPlayer,
        removeAIPlayer,
        resetAllSettings,
        exportSettings,
        importSettings
    } = useSettings()

    // Force re-render when LLM status changes
    const [, forceUpdate] = useState({})

    useEffect(() => {
        const handleLLMStatusUpdate = () => forceUpdate({})
        window.addEventListener('llm-status-updated', handleLLMStatusUpdate)
        return () => window.removeEventListener('llm-status-updated', handleLLMStatusUpdate)
    }, [])

    // Set up LLM manager test result callback
    useEffect(() => {
        llmManager.setTestResultCallback((providerId, result) => {
            updateLLMProviderTestResult(providerId, {
                success: result.success,
                responseTime: result.responseTime,
                error: result.error
            })
        })

        // Load existing test results from settings
        llmManager.loadTestResults(gameSettings.llmProviders)
    }, [updateLLMProviderTestResult, gameSettings.llmProviders])

    if (!isOpen) return null

    const handleStartGame = () => {
        onStartGame(gameSettings.rules, gameSettings.playerCount)
        onClose()
    }

    const handleExportSettings = () => {
        const settingsJson = exportSettings()
        const blob = new Blob([settingsJson], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `uno-settings-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleImportSettings = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const content = e.target?.result as string
                    const success = importSettings(content)
                    if (success) {
                        alert('Settings imported successfully!')
                    } else {
                        alert('Failed to import settings. Please check the file format.')
                    }
                }
                reader.readAsText(file)
            }
        }
        input.click()
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
                                onClick={handleExportSettings}
                                className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50 hover:border-slate-400/50"
                                title="Export Settings"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImportSettings}
                                className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50 hover:border-slate-400/50"
                                title="Import Settings"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetAllSettings}
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
                        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-600/30">
                            <TabsTrigger value="rules" className="data-[state=active]:bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                                <Gamepad2 className="w-4 h-4 mr-2" />
                                Rules
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold">
                                <Brain className="w-4 h-4 mr-2" />
                                AI
                            </TabsTrigger>
                            <TabsTrigger value="llm" className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold">
                                <Zap className="w-4 h-4 mr-2" />
                                LLM
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
                                                checked={gameSettings.rules.stackDrawTwo}
                                                onCheckedChange={(checked) => updateRule('stackDrawTwo', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Stack Wild Draw Four</p>
                                                <p className="text-gray-400 text-sm">Allow stacking Wild Draw Four cards</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.stackDrawFour}
                                                onCheckedChange={(checked) => updateRule('stackDrawFour', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Must Play If Drawable</p>
                                                <p className="text-gray-400 text-sm">Force playing drawn cards if possible</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.mustPlayIfDrawable}
                                                onCheckedChange={(checked) => updateRule('mustPlayIfDrawable', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Allow Draw When Playable</p>
                                                <p className="text-gray-400 text-sm">Allow drawing even with playable cards</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.allowDrawWhenPlayable}
                                                onCheckedChange={(checked) => updateRule('allowDrawWhenPlayable', checked)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white font-medium">Wild Card Skip</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[gameSettings.rules.wildCardSkip]}
                                                    onValueChange={([value]) => updateRule('wildCardSkip', value)}
                                                    max={3}
                                                    min={0}
                                                    step={1}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-purple-600 text-white min-w-[60px] text-center">
                                                    {gameSettings.rules.wildCardSkip === 0 ? 'None' :
                                                        gameSettings.rules.wildCardSkip === 1 ? 'Next' :
                                                            `${gameSettings.rules.wildCardSkip} Players`}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Number of players to skip when Wild card is played (0 = no skip, 1 = next player, 2 = skip next player)
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Enable UNO Challenges</p>
                                                <p className="text-gray-400 text-sm">Allow players to challenge missed UNO calls</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.enableUnoChallenges}
                                                onCheckedChange={(checked) => updateRule('enableUnoChallenges', checked)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white font-medium">UNO Challenge Window</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[gameSettings.rules.unoChallengeWindow / 1000]}
                                                    onValueChange={([value]) => updateRule('unoChallengeWindow', value * 1000)}
                                                    max={5}
                                                    min={1}
                                                    step={0.5}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-orange-600 text-white min-w-[60px] text-center">
                                                    {gameSettings.rules.unoChallengeWindow / 1000}s
                                                </Badge>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Time window to challenge UNO calls (in seconds)
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-white font-medium">Max Game Time</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Slider
                                                    value={[gameSettings.rules.maxGameTime]}
                                                    onValueChange={([value]) => updateRule('maxGameTime', value)}
                                                    max={60}
                                                    min={0}
                                                    step={5}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-red-600 text-white min-w-[60px] text-center">
                                                    {gameSettings.rules.maxGameTime === 0 ? 'No Limit' : `${gameSettings.rules.maxGameTime}m`}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Maximum game time before auto-ending (0 = no limit)
                                            </p>
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
                                                checked={gameSettings.rules.enableJumpIn}
                                                onCheckedChange={(checked) => updateRule('enableJumpIn', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Seven-Zero Rules</p>
                                                <p className="text-gray-400 text-sm">Enable 7-0 hand swapping and rotation</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.enableSevenZero}
                                                onCheckedChange={(checked) => updateRule('enableSevenZero', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Swap Hands</p>
                                                <p className="text-gray-400 text-sm">Enable hand swapping house rule</p>
                                            </div>
                                            <Switch
                                                checked={gameSettings.rules.enableSwapHands}
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
                                                    value={[gameSettings.rules.targetScore]}
                                                    onValueChange={([value]) => updateRule('targetScore', value)}
                                                    max={1000}
                                                    min={100}
                                                    step={50}
                                                    className="flex-1"
                                                />
                                                <Badge className="bg-blue-600 text-white min-w-[60px] text-center">
                                                    {gameSettings.rules.targetScore}
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
                                            <Select value={gameSettings.playerCount.toString()} onValueChange={(value) => updateGameSetting('playerCount', parseInt(value))}>
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
                                        <Select value={gameSettings.rules.aiDifficulty} onValueChange={(value: any) => updateRule('aiDifficulty', value)}>
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

                        {/* LLM Settings Tab */}
                        <TabsContent value="llm" className="space-y-6 mt-6">
                            {/* LLM Providers */}
                            <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-white" />
                                        </div>
                                        LLM Providers
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            addLLMProvider({
                                                name: 'New Provider',
                                                apiKey: '',
                                                model: 'gpt-3.5-turbo',
                                                isActive: false
                                            })
                                        }}
                                        className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50"
                                    >
                                        Add Provider
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {gameSettings.llmProviders.map((provider) => (
                                        <Card key={provider.id} className="p-4 bg-slate-700/30 border-slate-600/20">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                                        <input
                                                            type="text"
                                                            value={provider.name}
                                                            onChange={(e) => updateLLMProvider(provider.id, { name: e.target.value })}
                                                            className="bg-black/50 border border-slate-500/50 text-white px-3 py-1 rounded text-sm flex-1"
                                                            placeholder="Provider Name"
                                                        />
                                                        {llmManager.getConnectionStatus(provider.id)?.success && (
                                                            <Badge className="bg-green-600/20 text-green-400 border-green-500/50 text-xs">
                                                                Tested
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Switch
                                                        checked={provider.isActive}
                                                        onCheckedChange={(checked) => updateLLMProvider(provider.id, { isActive: checked })}
                                                        disabled={!llmManager.getConnectionStatus(provider.id)?.success}
                                                        title={!llmManager.getConnectionStatus(provider.id)?.success ? "Test connection first" : ""}
                                                    />
                                                </div>
                                                <input
                                                    type="password"
                                                    value={provider.apiKey}
                                                    onChange={(e) => updateLLMProvider(provider.id, { apiKey: e.target.value })}
                                                    className="bg-black/50 border border-slate-500/50 text-white px-3 py-1 rounded text-sm w-full"
                                                    placeholder="API Key"
                                                />
                                                <input
                                                    type="text"
                                                    value={provider.baseUrl || ''}
                                                    onChange={(e) => updateLLMProvider(provider.id, { baseUrl: e.target.value })}
                                                    className="bg-black/50 border border-slate-500/50 text-white px-3 py-1 rounded text-sm w-full"
                                                    placeholder="Base URL (optional)"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={provider.model}
                                                        onChange={(e) => updateLLMProvider(provider.id, { model: e.target.value })}
                                                        className="bg-black/50 border border-slate-500/50 text-white px-3 py-1 rounded text-sm flex-1"
                                                        placeholder="Model Name"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeLLMProvider(provider.id)}
                                                        className="bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>

                                                {/* Inline Connection Test */}
                                                <div className="pt-2 border-t border-slate-600/20">
                                                    <LLMConnectionTest
                                                        provider={provider}
                                                        onTestComplete={(result: any) => {
                                                            console.log(`Test result for ${provider.name}:`, result)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {gameSettings.llmProviders.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No LLM providers configured</p>
                                            <p className="text-sm">Add a provider to enable AI-powered gameplay</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* AI Players */}
                            <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-white" />
                                        </div>
                                        AI Players
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                addAIPlayer({
                                                    name: 'New AI Player',
                                                    avatar: '/human-avatar.png',
                                                    llmProviderId: null,
                                                    personality: 'Friendly and strategic',
                                                    isActive: false
                                                })
                                            }}
                                            className="bg-slate-700/50 text-white border-slate-500/50 hover:bg-slate-600/50"
                                        >
                                            Add Player
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Reset all AI players to defaults? This will remove any custom players.')) {
                                                    resetAllSettings()
                                                }
                                            }}
                                            className="bg-orange-600/20 text-orange-400 border-orange-500/50 hover:bg-orange-600/30"
                                        >
                                            Reset to Defaults
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {gameSettings.aiPlayers.map((player) => (
                                        <Card key={player.id} className={`p-4 border-slate-600/20 ${player.isDefault
                                            ? 'bg-slate-700/30 border-blue-500/30'
                                            : 'bg-slate-700/30 border-slate-600/20'
                                            }`}>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={player.avatar}
                                                            alt={player.name}
                                                            className="w-12 h-12 rounded-full border-2 border-slate-500/50"
                                                        />
                                                        {player.isDefault && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <span className="text-xs text-white font-bold">D</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={player.name}
                                                                onChange={(e) => updateAIPlayer(player.id, { name: e.target.value })}
                                                                className="bg-black/50 border border-slate-500/50 text-white px-3 py-1 rounded text-sm flex-1"
                                                                placeholder="Player Name"
                                                            />
                                                            {player.llmProviderId && (
                                                                (() => {
                                                                    const provider = gameSettings.llmProviders.find(p => p.id === player.llmProviderId)
                                                                    const isAvailable = provider &&
                                                                        provider.isActive &&
                                                                        llmManager.getConnectionStatus(provider.id)?.success
                                                                    return (
                                                                        <Badge className={`text-xs ${isAvailable
                                                                            ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                                                            : 'bg-red-600/20 text-red-400 border-red-500/50'
                                                                            }`}>
                                                                            {isAvailable ? 'LLM' : 'LLM (Unavailable)'}
                                                                        </Badge>
                                                                    )
                                                                })()
                                                            )}
                                                            {!player.llmProviderId && (
                                                                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/50 text-xs">
                                                                    Basic AI
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={player.isActive}
                                                        onCheckedChange={(checked) => updateAIPlayer(player.id, { isActive: checked })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="md:col-span-2">
                                                        <label className="text-white/80 text-sm mb-1 block">LLM Provider</label>
                                                        <Select
                                                            value={player.llmProviderId || 'none'}
                                                            onValueChange={(value) => updateAIPlayer(player.id, { llmProviderId: value === 'none' ? null : value })}
                                                        >
                                                            <SelectTrigger className="bg-black/50 border-slate-500/50 text-white text-sm">
                                                                <SelectValue placeholder="Select LLM" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-black/90 border-slate-500/50">
                                                                <SelectItem value="none" className="text-white">Basic AI</SelectItem>
                                                                {gameSettings.llmProviders
                                                                    .filter(provider =>
                                                                        provider.isActive &&
                                                                        llmManager.getConnectionStatus(provider.id)?.success
                                                                    )
                                                                    .map((provider) => (
                                                                        <SelectItem key={provider.id} value={provider.id} className="text-white">
                                                                            {provider.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                {gameSettings.llmProviders
                                                                    .filter(provider =>
                                                                        provider.isActive &&
                                                                        llmManager.getConnectionStatus(provider.id)?.success
                                                                    ).length === 0 &&
                                                                    gameSettings.llmProviders.length > 0 && (
                                                                        <SelectItem value="no-llm" disabled className="text-gray-500 text-xs">
                                                                            No tested & active LLM providers
                                                                        </SelectItem>
                                                                    )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label className="text-white/80 text-sm mb-1 block">Avatar</label>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const avatars = [
                                                                    '/human-avatar.png',
                                                                    '/diverse-female-avatar.png',
                                                                    '/female-avatar-2.png',
                                                                    '/female-avatar-3.png',
                                                                    '/male-avatar.png',
                                                                    '/male-avatar-2.png',
                                                                    '/male-avatar-3.png'
                                                                ]
                                                                const currentIndex = avatars.indexOf(player.avatar)
                                                                const nextIndex = (currentIndex + 1) % avatars.length
                                                                updateAIPlayer(player.id, { avatar: avatars[nextIndex] })
                                                            }}
                                                            className="w-full bg-slate-600/50 text-white border-slate-500/50 hover:bg-slate-500/50"
                                                        >
                                                            Change Avatar
                                                        </Button>
                                                    </div>
                                                </div>
                                                {player.llmProviderId && (
                                                    <div>
                                                        <label className="text-white/80 text-sm mb-1 block">Personality</label>
                                                        <textarea
                                                            value={player.personality}
                                                            onChange={(e) => updateAIPlayer(player.id, { personality: e.target.value })}
                                                            className="bg-black/50 border border-slate-500/50 text-white px-3 py-2 rounded text-sm w-full resize-none"
                                                            placeholder="Describe the player's personality and playing style..."
                                                            rows={3}
                                                        />
                                                    </div>
                                                )}
                                                {!player.isDefault && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeAIPlayer(player.id)}
                                                        className="w-full bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30"
                                                    >
                                                        Remove Player
                                                    </Button>
                                                )}
                                                {player.isDefault && (
                                                    <div className="text-center py-2 text-gray-400 text-sm">
                                                        Default player - cannot be removed
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                    {gameSettings.aiPlayers.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No AI players configured</p>
                                            <p className="text-sm">Add AI players to create custom opponents</p>
                                        </div>
                                    )}

                                    {/* Debug Section - Temporary */}
                                    <Card className="p-4 bg-yellow-900/20 border-yellow-500/30">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-yellow-200">
                                                <p className="font-semibold mb-2">Debug Info:</p>
                                                <p>Total AI Players: {gameSettings.aiPlayers.length}</p>
                                                <p>Default Players: {gameSettings.aiPlayers.filter(p => p.isDefault).length}</p>
                                                <p>Custom Players: {gameSettings.aiPlayers.filter(p => !p.isDefault).length}</p>
                                                <p>Active Players: {gameSettings.aiPlayers.filter(p => p.isActive).length}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        console.log('Current AI Players:', gameSettings.aiPlayers)
                                                        console.log('Default Players:', gameSettings.aiPlayers.filter(p => p.isDefault))
                                                    }}
                                                    className="mt-2 bg-yellow-600/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-600/30"
                                                >
                                                    Log to Console
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Info Section */}
                                    <Card className="p-4 bg-blue-900/20 border-blue-500/30">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-blue-200">
                                                <p className="font-semibold mb-2">Player Types:</p>
                                                <ul className="space-y-1">
                                                    <li><span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">Basic AI</span> - Uses the existing game AI (default)</li>
                                                    <li><span className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">LLM</span> - Uses configured LLM provider for enhanced gameplay</li>
                                                </ul>
                                                <p className="mt-2 text-blue-300">
                                                    Default players (marked with "D") use Basic AI by default.
                                                    <br />
                                                    <strong>LLM Rules:</strong> Providers must be tested before activation. Only tested & active providers can be assigned to players.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
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
                                            checked={gameSettings.rules.debugMode}
                                            onCheckedChange={(checked) => updateRule('debugMode', checked)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white font-medium">Deadlock Resolution</label>
                                        <Select value={gameSettings.rules.deadlockResolution} onValueChange={(value: any) => updateRule('deadlockResolution', value)}>
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
                                            checked={gameSettings.rules.showDiscardPile}
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
                                Settings are automatically saved and will persist between sessions. Use Export/Import to backup or share your settings.
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
