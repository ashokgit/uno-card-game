"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LLMProvider, ConnectionTest } from "@/lib/llm"
import { llmManager } from "@/lib/llm"
import { Zap, CheckCircle, XCircle, Clock, Wifi, WifiOff } from "lucide-react"

interface LLMConnectionTestProps {
    provider: LLMProvider
    onTestComplete?: (result: ConnectionTest) => void
}

export function LLMConnectionTest({ provider, onTestComplete }: LLMConnectionTestProps) {
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<ConnectionTest | null>(null)

    const handleTestConnection = async () => {
        setIsTesting(true)
        setTestResult(null)

        try {
            // Add provider to manager if not already there
            llmManager.addProvider(provider)

            const result = await llmManager.testConnection(provider.id)
            setTestResult(result)
            onTestComplete?.(result)

            // Force re-render to update UI state
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('llm-status-updated'))
            }, 100)
        } catch (error) {
            const errorResult: ConnectionTest = {
                provider,
                success: false,
                responseTime: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
            setTestResult(errorResult)
            onTestComplete?.(errorResult)
        } finally {
            setIsTesting(false)
        }
    }

    const getStatusIcon = () => {
        if (isTesting) return <Clock className="w-4 h-4 animate-spin" />
        if (!testResult) return <Wifi className="w-4 h-4" />
        if (testResult.success) return <CheckCircle className="w-4 h-4 text-green-500" />
        return <XCircle className="w-4 h-4 text-red-500" />
    }

    const getStatusBadge = () => {
        if (isTesting) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/50">Testing...</Badge>
        if (!testResult) return <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/50">Not Tested</Badge>
        if (testResult.success) return <Badge className="bg-green-600/20 text-green-400 border-green-500/50">Connected</Badge>
        return <Badge className="bg-red-600/20 text-red-400 border-red-500/50">Failed</Badge>
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="text-sm font-medium text-white">Connection Test</span>
                    {getStatusBadge()}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-slate-600/50 text-white border-slate-500/50 hover:bg-slate-500/50 text-xs"
                >
                    {isTesting ? 'Testing...' : 'Test'}
                </Button>
            </div>

            {testResult && (
                <div className="space-y-2 text-sm">
                    {testResult.success ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span>Connection successful!</span>
                            </div>
                            <div className="text-gray-400">
                                Response time: {testResult.responseTime}ms
                            </div>
                            {testResult.sampleResponse && (
                                <div className="text-gray-400">
                                    Sample response: "{testResult.sampleResponse}"
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-red-400">
                                <XCircle className="w-4 h-4" />
                                <span>Connection failed</span>
                            </div>
                            <div className="text-red-300">
                                Error: {testResult.error}
                            </div>
                            {testResult.responseTime > 0 && (
                                <div className="text-gray-400">
                                    Response time: {testResult.responseTime}ms
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="text-xs text-gray-400">
                <div>Model: {provider.model}</div>
                {provider.baseUrl && <div>Base URL: {provider.baseUrl}</div>}
            </div>
        </div>
    )
}

interface LLMConnectionTestPanelProps {
    providers: LLMProvider[]
    onTestComplete?: (results: ConnectionTest[]) => void
}

export function LLMConnectionTestPanel({ providers, onTestComplete }: LLMConnectionTestPanelProps) {
    const [isTestingAll, setIsTestingAll] = useState(false)
    const [testResults, setTestResults] = useState<ConnectionTest[]>([])

    const handleTestAllConnections = async () => {
        setIsTestingAll(true)
        setTestResults([])

        try {
            // Add all providers to manager
            providers.forEach(provider => llmManager.addProvider(provider))

            const results = await llmManager.testAllConnections()
            setTestResults(results)
            onTestComplete?.(results)
        } catch (error) {
            console.error('Error testing connections:', error)
        } finally {
            setIsTestingAll(false)
        }
    }

    const successfulTests = testResults.filter(r => r.success).length
    const failedTests = testResults.filter(r => !r.success).length

    return (
        <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    Connection Testing
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestAllConnections}
                    disabled={isTestingAll || providers.length === 0}
                    className="bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600/30"
                >
                    {isTestingAll ? 'Testing All...' : 'Test All Connections'}
                </Button>
            </div>

            {testResults.length > 0 && (
                <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-400">{successfulTests} successful</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-400">{failedTests} failed</span>
                        </div>
                        <div className="text-gray-400">
                            Total: {testResults.length} providers
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {providers.map((provider) => (
                    <LLMConnectionTest
                        key={provider.id}
                        provider={provider}
                        onTestComplete={(result) => {
                            setTestResults(prev => {
                                const filtered = prev.filter(r => r.provider.id !== provider.id)
                                return [...filtered, result]
                            })
                        }}
                    />
                ))}

                {providers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No LLM providers configured</p>
                        <p className="text-sm">Add providers to test connections</p>
                    </div>
                )}
            </div>
        </Card>
    )
}
