import React from 'react'
import { Button } from './ui/button'
import { Sparkles, Palette, Zap } from 'lucide-react'

interface ColorPickerProps {
    isVisible: boolean
    onColorSelect: (color: 'red' | 'blue' | 'green' | 'yellow') => void
    onClose?: () => void
}

export function ColorPicker({ isVisible, onColorSelect, onClose }: ColorPickerProps) {
    if (!isVisible) return null

    const colors = [
        {
            name: 'red',
            bg: 'bg-gradient-to-br from-red-500 to-red-700',
            hover: 'hover:from-red-400 hover:to-red-600',
            border: 'border-red-400',
            shadow: 'shadow-red-500/50',
            icon: '🔥'
        },
        {
            name: 'blue',
            bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
            hover: 'hover:from-blue-400 hover:to-blue-600',
            border: 'border-blue-400',
            shadow: 'shadow-blue-500/50',
            icon: '💙'
        },
        {
            name: 'green',
            bg: 'bg-gradient-to-br from-green-500 to-green-700',
            hover: 'hover:from-green-400 hover:to-green-600',
            border: 'border-green-400',
            shadow: 'shadow-green-500/50',
            icon: '🌿'
        },
        {
            name: 'yellow',
            bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
            hover: 'hover:from-yellow-300 hover:to-yellow-500',
            border: 'border-yellow-400',
            shadow: 'shadow-yellow-500/50',
            icon: '⭐'
        },
    ] as const

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }, (_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}

                {/* Floating sparkles */}
                {Array.from({ length: 8 }, (_, i) => (
                    <div
                        key={`sparkle-${i}`}
                        className="absolute text-yellow-300 sparkle-float"
                        style={{
                            left: `${20 + i * 10}%`,
                            top: `${30 + (i % 3) * 20}%`,
                            animationDelay: `${i * 0.3}s`,
                            fontSize: `${12 + Math.random() * 8}px`
                        }}
                    >
                        ✨
                    </div>
                ))}
            </div>

            <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 shadow-2xl border-2 border-purple-500/30 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300 color-picker-glow">
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl animate-pulse" />

                {/* Header with icon */}
                <div className="text-center mb-8 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Choose Your Power!
                    </h2>
                    <p className="text-purple-200 text-lg">Select the color for your Wild card</p>
                </div>

                {/* Color buttons grid */}
                <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                    {colors.map((color, index) => (
                        <Button
                            key={color.name}
                            onClick={() => onColorSelect(color.name)}
                            className={`
                 ${color.bg} ${color.hover} ${color.border} ${color.shadow}
                 border-2 text-white font-bold text-xl py-8 px-6 
                 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl
                 rounded-2xl relative overflow-hidden group
                 animate-in slide-in-from-bottom-4 duration-500 power-up
               `}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            {/* Color icon */}
                            <div className="text-3xl mb-2">{color.icon}</div>

                            {/* Color name */}
                            <div className="text-2xl font-black tracking-wider drop-shadow-lg">
                                {color.name.toUpperCase()}
                            </div>

                            {/* Sparkle effect */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                            </div>
                        </Button>
                    ))}
                </div>

                {/* Cancel button */}
                {onClose && (
                    <div className="text-center relative z-10">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="
                bg-black/30 border-purple-500/50 text-purple-200 
                hover:bg-purple-500/20 hover:border-purple-400 
                transition-all duration-300 transform hover:scale-105
                rounded-xl px-8 py-3 font-semibold
              "
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Bottom glow effect */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full blur-sm" />
            </div>
        </div>
    )
}
