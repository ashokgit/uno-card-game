import React, { useState, useEffect, useRef } from 'react'
import { Hand } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface EnhancedDeckProps {
    deckCount: number
    isDrawable: boolean
    isPlayerTurn: boolean
    onClick: () => void
    className?: string
}

export function EnhancedDeck({
    deckCount,
    isDrawable,
    isPlayerTurn,
    onClick,
    className = ""
}: EnhancedDeckProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
    const [shuffleAnimation, setShuffleAnimation] = useState(false)
    const deckRef = useRef<HTMLDivElement>(null)

    // Generate particles for sparkle effect
    useEffect(() => {
        if (isPlayerTurn && isDrawable) {
            const newParticles = Array.from({ length: 8 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: Math.random() * 2
            }))
            setParticles(newParticles)
        } else {
            setParticles([])
        }
    }, [isPlayerTurn, isDrawable])

    // Occasional shuffle animation
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                setShuffleAnimation(true)
                setTimeout(() => setShuffleAnimation(false), 300)
            }
        }, 5000) // Check every 5 seconds

        return () => clearInterval(interval)
    }, [])

    const handleClick = () => {
        if (isDrawable && !shuffleAnimation) {
            onClick()
        }
    }

    const getGlowColor = () => {
        if (!isDrawable) return 'rgba(255, 255, 255, 0.1)'
        if (isPlayerTurn) return 'rgba(0, 191, 255, 0.6)'
        return 'rgba(255, 215, 0, 0.4)'
    }

    const getPulseAnimation = () => {
        if (!isDrawable) return ''
        if (isPlayerTurn) return 'animate-pulse'
        return 'animate-pulse-slow'
    }

    return (
        <div
            ref={deckRef}
            className={`deck-enhanced ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 3D Stacking Effect - Multiple card layers */}
            <div className="deck-card-stack">
                {/* Background cards for stacking effect */}
                {Array.from({ length: 3 }, (_, i) => (
                    <div
                        key={`stack-${i}`}
                        className="deck-card-background"
                        style={{
                            width: '80px',
                            height: '120px',
                            transform: `translateX(${-i * 2}px) translateY(${i * 1}px) rotate(${-2 + i * 0.5}deg) scale(${1 - i * 0.02})`,
                            zIndex: 10 - i,
                            opacity: 0.7 - i * 0.2,
                            filter: `blur(${i * 0.5}px)`,
                        }}
                    />
                ))}

                {/* Main deck card */}
                <div
                    className={`
                        deck-card-main
                        cursor-pointer 
                        ${isDrawable ? '' : 'opacity-50'}
                        ${shuffleAnimation ? 'animate-shuffle' : ''}
                        ${getPulseAnimation()}
                        ${isPlayerTurn && isDrawable ? 'deck-glow-active' : isDrawable ? 'deck-glow-available' : ''}
                    `}
                    onClick={handleClick}
                    style={{
                        width: '80px',
                        height: '120px',
                        transform: `perspective(800px) rotateX(${isHovered ? 15 : 10}deg) rotateY(${isHovered ? -5 : -5}deg) translateZ(${isHovered ? 20 : 0}px)`,
                    }}
                >
                    {/* Card content */}
                    <div className="w-full h-full rounded-lg flex items-center justify-center relative">
                        <Hand className="w-8 h-8 text-white drop-shadow-lg" />
                        <div className="absolute inset-2 border-2 border-white/30 rounded-md"></div>
                        <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full"></div>
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg animate-shimmer"></div>

                        {/* Texture overlay */}
                        <div className="absolute inset-0 opacity-30 rounded-lg" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='texture' x='0' y='0' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='rgba(255,255,255,0.05)'%3E%3C/circle%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23texture)'%3E%3C/rect%3E%3C/svg%3E")`
                        }}></div>
                    </div>

                    {/* Glossy finish effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg pointer-events-none"></div>
                </div>

                {/* Enhanced glow aura */}
                <div
                    className="deck-glow-aura absolute inset-0"
                    style={{
                        background: `radial-gradient(circle, ${getGlowColor()}, transparent 70%)`,
                        transform: 'scale(1.2)',
                        zIndex: -1,
                    }}
                />
            </div>

            {/* Particle effects */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-particle-float pointer-events-none"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        animationDelay: `${particle.delay}s`,
                    }}
                />
            ))}

            {/* Deck count badge */}
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white border-white/20 shadow-lg">
                {deckCount}
            </Badge>

            {/* Interactive hover indicator */}
            {isHovered && isDrawable && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap animate-fade-in">
                    Click to draw
                </div>
            )}

            {/* Turn indicator glow */}
            {isPlayerTurn && isDrawable && (
                <div className="absolute inset-0 rounded-lg animate-pulse-ring pointer-events-none">
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-400/60"></div>
                </div>
            )}
        </div>
    )
}


