import React, { useState, useEffect } from 'react'
import { UnoCard } from './uno-cards'

interface EnhancedDiscardPileProps {
  currentCard: {
    color: "red" | "blue" | "green" | "yellow" | "wild"
    value: string | number
  } | null
  isAnimating: boolean
  className?: string
}

export function EnhancedDiscardPile({
  currentCard,
  isAnimating,
  className = ""
}: EnhancedDiscardPileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(0)

  // Dynamic glow effect based on card color
  useEffect(() => {
    if (currentCard && !isAnimating) {
      setGlowIntensity(1)
      const timer = setTimeout(() => setGlowIntensity(0.5), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentCard, isAnimating])

  const getGlowColor = () => {
    if (!currentCard) return 'rgba(255, 255, 255, 0.1)'
    
    const colorMap = {
      red: 'rgba(220, 38, 38, 0.6)',
      blue: 'rgba(37, 99, 235, 0.6)',
      green: 'rgba(22, 163, 74, 0.6)',
      yellow: 'rgba(202, 138, 4, 0.6)',
      wild: 'rgba(0, 0, 0, 0.6)'
    }
    
    return colorMap[currentCard.color]
  }

  const getPileHeight = () => {
    // Simulate pile height based on game progress
    return Math.min(5, Math.max(1, Math.floor(Math.random() * 5) + 1))
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Stacking Effect - Multiple card layers for discard pile */}
      <div className="relative">
        {/* Background cards for stacking effect */}
        {Array.from({ length: getPileHeight() }, (_, i) => (
          <div
            key={`discard-stack-${i}`}
            className="absolute bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/20 rounded-lg"
            style={{
              width: '80px',
              height: '120px',
              transform: `
                translateX(${i * 1}px) 
                translateY(${i * 0.5}px) 
                rotate(${1 + i * 0.3}deg)
                scale(${1 - i * 0.02})
              `,
              zIndex: 10 - i,
              opacity: 0.6 - i * 0.1,
              filter: `blur(${i * 0.3}px)`,
            }}
          />
        ))}

        {/* Main discard card */}
        <div
          className={`
            relative transition-all duration-500 ease-out
            transform-style-preserve-3d
            perspective-1000
            ${isAnimating ? "scale-110 rotate-12" : ""}
            ${isHovered ? "hover:translate-y-[-4px] hover:rotate-1" : ""}
          `}
          style={{
            transform: `
              perspective(800px) 
              rotateX(${isHovered ? 8 : 5}deg) 
              rotateY(${isHovered ? 3 : 2}deg)
              translateZ(${isHovered ? 10 : 0}px)
            `,
            filter: `
              drop-shadow(0 8px 25px rgba(0,0,0,0.3)) 
              drop-shadow(0 0 15px ${getGlowColor()})
              drop-shadow(0 0 30px ${getGlowColor()})
            `,
          }}
        >
          {currentCard && !isAnimating && (
            <div className="relative">
              <UnoCard
                color={currentCard.color}
                value={currentCard.value}
                size="medium"
                className="shadow-2xl border-white/30 relative z-10"
              />
              
              {/* Enhanced glow effect for current card */}
              <div 
                className="absolute inset-0 rounded-lg blur-xl animate-pulse scale-110 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${getGlowColor()}, transparent 70%)`,
                  opacity: glowIntensity,
                }}
              />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg animate-shimmer pointer-events-none" />
              
              {/* Particle effects for special cards */}
              {(currentCard.value === "Wild" || currentCard.value === "Wild Draw Four") && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={`particle-${i}`}
                      className="absolute w-1 h-1 bg-white rounded-full animate-particle-sparkle"
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Action card special effects */}
              {["Skip", "Reverse", "Draw Two"].includes(currentCard.value as string) && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 ring-4 ring-yellow-400/40 rounded-lg animate-pulse scale-125" />
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-lg animate-pulse" />
                </div>
              )}
            </div>
          )}
          
          {isAnimating && (
            <div className="w-20 h-28 bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/30 shadow-2xl rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Enhanced glow aura */}
        <div 
          className="absolute inset-0 rounded-lg blur-2xl transition-all duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${getGlowColor()}, transparent 80%)`,
            transform: 'scale(1.3)',
            zIndex: -1,
            opacity: glowIntensity * 0.8,
          }}
        />
      </div>

      {/* Pile indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg">
        {getPileHeight()}
      </div>

      {/* Hover indicator */}
      {isHovered && currentCard && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap animate-fade-in pointer-events-none">
          {currentCard.color} {currentCard.value}
        </div>
      )}
    </div>
  )
}

// CSS animations for the enhanced discard pile
const styles = `
  @keyframes particle-sparkle {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: scale(1) rotate(180deg);
      opacity: 0.8;
    }
    100% {
      transform: scale(0) rotate(360deg);
      opacity: 0;
    }
  }

  .animate-particle-sparkle {
    animation: particle-sparkle 1.5s ease-out forwards;
  }

  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }

  .perspective-1000 {
    perspective: 1000px;
  }
`

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
