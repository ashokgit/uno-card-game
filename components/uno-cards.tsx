"use client"

import { Ban, RotateCcw } from "lucide-react"

interface UnoCardProps {
  color: "red" | "blue" | "green" | "yellow" | "wild"
  value: string | number
  size?: "small" | "medium" | "large"
  isPlayable?: boolean
  onClick?: () => void
  className?: string
}

export function UnoCard({ color, value, size = "medium", isPlayable = false, onClick, className = "" }: UnoCardProps) {
  const sizeClasses = {
    small: "w-[35px] h-[50px]",    // Opponent cards: 35px × 50px
    medium: "w-[80px] h-[120px]",  // Center pile cards: 80px × 120px
    large: "w-[70px] h-[105px]",   // Player hand cards: 70px × 105px
  }

  const getCardComponent = () => {
    if (color === "wild") {
      if (value === "Wild Draw Four") {
        return <WildDrawFourCard size={size} />
      }
      return <WildCard size={size} />
    }

    switch (value) {
      case "Skip":
        return <SkipCard color={color} size={size} />
      case "Reverse":
        return <ReverseCard color={color} size={size} />
      case "Draw Two":
        return <DrawTwoCard color={color} size={size} />
      default:
        return <NumberCard color={color} value={value} size={size} />
    }
  }

  const getCardBg = () => {
    if (color === "wild") return "bg-black"
    switch (color) {
      case "red":
        return "bg-red-600"
      case "blue":
        return "bg-blue-600"
      case "green":
        return "bg-green-600"
      case "yellow":
        return "bg-yellow-500"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getCardBg()} rounded-lg border-2 shadow-lg cursor-pointer transition-all duration-300 transform ${isPlayable
          ? "border-green-400 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-400/50 animate-pulse playable-pulse"
          : "border-gray-300 hover:scale-105 hover:shadow-2xl"
        } ${className}`}
      onClick={onClick}
    >
      {getCardComponent()}
      {/* Enhanced playable card indicator */}
      {isPlayable && (
        <>
          <div className="absolute inset-0 bg-green-400/20 rounded-lg animate-pulse"></div>
          <div className="absolute inset-0 ring-2 ring-green-400/60 rounded-lg animate-ping"></div>
          <div className="absolute inset-0 ring-1 ring-green-300/40 rounded-lg animate-pulse"></div>
          {/* Corner indicators */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </>
      )}
    </div>
  )
}

function NumberCard({ color, value, size }: { color: string; value: string | number; size: "small" | "medium" | "large" }) {
  const textSizes = {
    small: { corner: "text-sm", center: "text-2xl" },
    medium: { corner: "text-base", center: "text-3xl" },
    large: { corner: "text-lg", center: "text-4xl" },
  }

  return (
    <div className="relative w-full h-full p-1">
      {/* White oval background */}
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      {/* Top left corner */}
      <div className={`absolute top-1 left-1 ${textSizes[size].corner} font-black text-white z-10`}>{value}</div>

      {/* Center number */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSizes[size].center} font-black z-20`}
        style={{ color: color === "yellow" ? "#000" : getColorValue(color) }}
      >
        {value}
      </div>

      {/* Bottom right corner (rotated) */}
      <div
        className={`absolute bottom-1 right-1 ${textSizes[size].corner} font-black text-white z-10 transform rotate-180`}
      >
        {value}
      </div>
    </div>
  )
}

function SkipCard({ color, size }: { color: string; size: "small" | "medium" | "large" }) {
  const iconSizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }

  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      <div className="absolute top-1 left-1 text-white font-black z-10">
        <Ban className={iconSizes[size]} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div
          className={`rounded-full border-4 ${iconSizes[size === "small" ? "medium" : "large"]} flex items-center justify-center`}
          style={{ borderColor: getColorValue(color), color: getColorValue(color) }}
        >
          <Ban className={iconSizes[size]} />
        </div>
      </div>

      <div className="absolute bottom-1 right-1 text-white font-black z-10 transform rotate-180">
        <Ban className={iconSizes[size]} />
      </div>
    </div>
  )
}

function ReverseCard({ color, size }: { color: string; size: "small" | "medium" | "large" }) {
  const iconSizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }

  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      <div className="absolute top-1 left-1 text-white font-black z-10">
        <RotateCcw className={iconSizes[size]} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative" style={{ color: getColorValue(color) }}>
          <RotateCcw className={iconSizes[size === "small" ? "medium" : "large"]} />
          <RotateCcw
            className={`${iconSizes[size === "small" ? "medium" : "large"]} absolute top-0 left-0 transform rotate-180`}
          />
        </div>
      </div>

      <div className="absolute bottom-1 right-1 text-white font-black z-10 transform rotate-180">
        <RotateCcw className={iconSizes[size]} />
      </div>
    </div>
  )
}

function DrawTwoCard({ color, size }: { color: string; size: "small" | "medium" | "large" }) {
  const textSizes = {
    small: { corner: "text-xs", center: "text-lg" },
    medium: { corner: "text-sm", center: "text-xl" },
    large: { corner: "text-base", center: "text-2xl" },
  }

  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      <div className={`absolute top-1 left-1 ${textSizes[size].corner} font-black text-white z-10`}>+2</div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative" style={{ color: getColorValue(color) }}>
          {/* Overlapping card symbols */}
          <div className={`${textSizes[size].center} font-black flex items-center gap-1`}>
            <div className="w-4 h-6 bg-current rounded-sm opacity-80"></div>
            <div className="w-4 h-6 bg-current rounded-sm -ml-2"></div>
          </div>
          <div className={`${textSizes[size].center} font-black text-center mt-1`}>+2</div>
        </div>
      </div>

      <div
        className={`absolute bottom-1 right-1 ${textSizes[size].corner} font-black text-white z-10 transform rotate-180`}
      >
        +2
      </div>
    </div>
  )
}

function WildCard({ size }: { size: "small" | "medium" | "large" }) {
  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      <div className="absolute top-1 left-1 text-white font-black z-10">
        <div className="w-3 h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full"></div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative">
          {/* Colorful oval */}
          <div
            className={`${size === "small" ? "w-8 h-12" : size === "medium" ? "w-10 h-16" : "w-12 h-20"} rounded-full`}
            style={{
              background: "linear-gradient(45deg, #ef4444 0%, #eab308 25%, #22c55e 50%, #3b82f6 75%, #ef4444 100%)",
            }}
          ></div>
        </div>
      </div>

      <div className="absolute bottom-1 right-1 text-white font-black z-10 transform rotate-180">
        <div className="w-3 h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full"></div>
      </div>
    </div>
  )
}

function WildDrawFourCard({ size }: { size: "small" | "medium" | "large" }) {
  const textSizes = {
    small: { corner: "text-xs", center: "text-sm" },
    medium: { corner: "text-sm", center: "text-base" },
    large: { corner: "text-base", center: "text-lg" },
  }

  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-90"></div>

      <div className={`absolute top-1 left-1 ${textSizes[size].corner} font-black text-white z-10`}>+4</div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative flex flex-col items-center">
          {/* Four colored card symbols */}
          <div className="flex gap-1 mb-1">
            <div className="w-2 h-3 bg-red-500 rounded-sm"></div>
            <div className="w-2 h-3 bg-yellow-500 rounded-sm"></div>
          </div>
          <div className="flex gap-1 mb-1">
            <div className="w-2 h-3 bg-green-500 rounded-sm"></div>
            <div className="w-2 h-3 bg-blue-500 rounded-sm"></div>
          </div>
          <div className={`${textSizes[size].center} font-black text-black`}>+4</div>
        </div>
      </div>

      <div
        className={`absolute bottom-1 right-1 ${textSizes[size].corner} font-black text-white z-10 transform rotate-180`}
      >
        +4
      </div>
    </div>
  )
}

function getColorValue(color: string): string {
  switch (color) {
    case "red":
      return "#dc2626"
    case "blue":
      return "#2563eb"
    case "green":
      return "#16a34a"
    case "yellow":
      return "#ca8a04"
    default:
      return "#000000"
  }
}
