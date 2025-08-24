"use client"

import { Ban, RotateCcw } from "lucide-react"
import { memo, useMemo } from "react"

interface UnoCardProps {
  color: "red" | "blue" | "green" | "yellow" | "wild"
  value: string | number
  size?: "small" | "medium" | "large"
  isPlayable?: boolean
  isDisabled?: boolean
  onClick?: () => void
  className?: string
}

// CSS Custom Properties for colors
const COLOR_VALUES = {
  red: "var(--uno-red, #dc2626)",
  blue: "var(--uno-blue, #2563eb)",
  green: "var(--uno-green, #16a34a)",
  yellow: "var(--uno-yellow, #ca8a04)",
  wild: "var(--uno-wild, #000000)",
} as const

// Memoized animation classes
const ANIMATION_CLASSES = {
  playable: "uno-card-playable",
  enhanced: "uno-card-enhanced",
  hover: "hover:scale-105 hover:shadow-lg transition-all duration-200",
  disabled: "opacity-50 cursor-not-allowed",
  wildShadow: "shadow-lg shadow-black/30",
} as const

// Reusable corner indicator component
const CornerIndicator = memo(({
  value,
  size,
  color,
  position = "top-left"
}: {
  value: string | number;
  size: "small" | "medium" | "large";
  color: string;
  position?: "top-left" | "bottom-right"
}) => {
  const textSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }

  const positionClasses = {
    "top-left": "top-1 left-1",
    "bottom-right": "bottom-1 right-1 transform rotate-180",
  }

  return (
    <div className={`absolute ${positionClasses[position]} ${textSizes[size]} font-black text-white z-10`}>
      {value}
    </div>
  )
})

CornerIndicator.displayName = "CornerIndicator"

// Reusable icon corner indicator component
const IconCornerIndicator = memo(({
  icon: Icon,
  size,
  position = "top-left"
}: {
  icon: typeof Ban;
  size: "small" | "medium" | "large";
  position?: "top-left" | "bottom-right"
}) => {
  const iconSizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }

  const positionClasses = {
    "top-left": "top-1 left-1",
    "bottom-right": "bottom-1 right-1 transform rotate-180",
  }

  return (
    <div className={`absolute ${positionClasses[position]} text-white font-black z-10`}>
      <Icon className={iconSizes[size]} />
    </div>
  )
})

IconCornerIndicator.displayName = "IconCornerIndicator"

export function UnoCard({
  color,
  value,
  size = "medium",
  isPlayable = false,
  isDisabled = false,
  onClick,
  className = ""
}: UnoCardProps) {
  const sizeClasses = useMemo(() => ({
    small: "w-[35px] h-[50px]",
    medium: "w-[80px] h-[120px]",
    large: "w-[70px] h-[105px]",
  }), [])

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (onClick && !isDisabled) {
        onClick()
      }
    }
  }

  const getAriaLabel = () => {
    const colorName = color === "wild" ? "wild" : color
    const valueName = typeof value === "number" ? value.toString() : value
    const playableStatus = isPlayable ? "playable" : "not playable"
    const disabledStatus = isDisabled ? "disabled" : ""
    return `${colorName} ${valueName} card ${playableStatus} ${disabledStatus}`.trim()
  }

  const baseClasses = useMemo(() => [
    sizeClasses[size],
    getCardBg(),
    "rounded-lg",
    ANIMATION_CLASSES.enhanced,
    isPlayable ? ANIMATION_CLASSES.playable : "",
    !isDisabled ? ANIMATION_CLASSES.hover : "",
    isDisabled ? ANIMATION_CLASSES.disabled : "",
    color === "wild" ? ANIMATION_CLASSES.wildShadow : "",
    className
  ].filter(Boolean).join(" "), [sizeClasses, size, color, isPlayable, isDisabled, className])

  return (
    <div
      className={baseClasses}
      onClick={!isDisabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={!isDisabled ? 0 : -1}
      aria-label={getAriaLabel()}
      aria-disabled={isDisabled}
    >
      {getCardComponent()}
      {/* Enhanced playable card indicator */}
      {isPlayable && !isDisabled && (
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
      {/* White oval background with reduced opacity */}
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

      {/* Top left corner */}
      <CornerIndicator value={value} size={size} color={color} position="top-left" />

      {/* Center number */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSizes[size].center} font-black z-20`}
        style={{ color: color === "yellow" ? "#000" : COLOR_VALUES[color as keyof typeof COLOR_VALUES] }}
      >
        {value}
      </div>

      {/* Bottom right corner (rotated) */}
      <CornerIndicator value={value} size={size} color={color} position="bottom-right" />
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
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

      <IconCornerIndicator icon={Ban} size={size} position="top-left" />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div
          className={`rounded-full border-4 ${iconSizes[size === "small" ? "medium" : "large"]} flex items-center justify-center`}
          style={{ borderColor: COLOR_VALUES[color as keyof typeof COLOR_VALUES], color: COLOR_VALUES[color as keyof typeof COLOR_VALUES] }}
        >
          <Ban className={iconSizes[size]} />
        </div>
      </div>

      <IconCornerIndicator icon={Ban} size={size} position="bottom-right" />
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
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

      <IconCornerIndicator icon={RotateCcw} size={size} position="top-left" />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative" style={{ color: COLOR_VALUES[color as keyof typeof COLOR_VALUES] }}>
          <RotateCcw className={iconSizes[size === "small" ? "medium" : "large"]} />
          <RotateCcw
            className={`${iconSizes[size === "small" ? "medium" : "large"]} absolute top-0 left-0 transform rotate-180`}
          />
        </div>
      </div>

      <IconCornerIndicator icon={RotateCcw} size={size} position="bottom-right" />
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
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

      <CornerIndicator value="+2" size={size} color={color} position="top-left" />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative" style={{ color: COLOR_VALUES[color as keyof typeof COLOR_VALUES] }}>
          {/* Overlapping card symbols */}
          <div className={`${textSizes[size].center} font-black flex items-center gap-1`}>
            <div className="w-4 h-6 bg-current rounded-sm opacity-80"></div>
            <div className="w-4 h-6 bg-current rounded-sm -ml-2"></div>
          </div>
          <div className={`${textSizes[size].center} font-black text-center mt-1`}>+2</div>
        </div>
      </div>

      <CornerIndicator value="+2" size={size} color={color} position="bottom-right" />
    </div>
  )
}

function WildCard({ size }: { size: "small" | "medium" | "large" }) {
  return (
    <div className="relative w-full h-full p-1">
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

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
      <div className="absolute inset-2 bg-white rounded-full opacity-80"></div>

      <CornerIndicator value="+4" size={size} color="black" position="top-left" />

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

      <CornerIndicator value="+4" size={size} color="black" position="bottom-right" />
    </div>
  )
}

// Updated getColorValue function using CSS custom properties
function getColorValue(color: string): string {
  return COLOR_VALUES[color as keyof typeof COLOR_VALUES] || COLOR_VALUES.wild
}
