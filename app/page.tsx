"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UnoCard } from "@/components/uno-cards"
import {
  Trophy,
  Coins,
  RotateCw,
  RotateCcw,
  Plus,
  Hand,
  ArrowRight,
  Zap,
  Ban,
  Shuffle,
  Brain,
  Clock,
} from "lucide-react"
import { UnoGame as GameEngine, type UnoCard as EngineCard, type GameDirection, type UnoColor } from "@/lib/uno-engine"
import { GameLog } from "@/components/game-log"

interface Player {
  id: number
  name: string
  cardCount: number
  avatar: string
  isActive: boolean
  isNextPlayer: boolean
  position: { top: string; left: string; transform?: string; position?: string }
  cards: GameCard[]
}

interface GameCard {
  id: number
  color: "red" | "blue" | "green" | "yellow" | "wild"
  value: string | number
  isPlayable: boolean
}

interface AnimatedCard {
  id: number
  card: GameCard
  startX: number
  startY: number
  endX: number
  endY: number
  currentX: number
  currentY: number
  isAnimating: boolean
  type: 'throw' | 'draw' | 'deal' | 'land'
  rotation: number
  scale: number
  zIndex: number
  trajectory: 'arc' | 'straight' | 'bounce'
  duration: number
  delay: number
  startTime: number
}

export default function UnoGame() {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [gameState, setGameState] = useState({
    level: 3,
    coins: 1250,
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [playDelay, setPlayDelay] = useState(false)
  const [animatedCards, setAnimatedCards] = useState<AnimatedCard[]>([])
  const [animationPool, setAnimationPool] = useState<AnimatedCard[]>([])
  const [nextAnimationId, setNextAnimationId] = useState(1)
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null)
  const [direction, setDirection] = useState<GameDirection>("clockwise")
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("")
  const [feedback, setFeedback] = useState<{ message: string; type: "good" | "bad" | "great" | "perfect" } | null>(null)
  const [isAITurnAnimating, setIsAITurnAnimating] = useState(false)
  const [isLogVisible, setIsLogVisible] = useState(false)
  const [isDiscardPileVisible, setIsDiscardPileVisible] = useState(false)
  const [showActionConfirm, setShowActionConfirm] = useState<{ card: GameCard; confirmed: () => void } | null>(null)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)

  useEffect(() => {
    const playerNames = ["You", "Alice", "Bob", "Carol", "Dave", "Eve"]
    const engine = new GameEngine(playerNames, 0, { showDiscardPile: true }) // Human player at index 0
    setGameEngine(engine)
  }, [])

  // Initialize game state when engine is ready
  useEffect(() => {
    if (gameEngine) {
      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      // Update playable cards after initial state is set
      setTimeout(() => {
        updatePlayableCards()
      }, 0)
    }
  }, [gameEngine])



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't handle shortcuts when typing in input fields
      }

      const key = event.key.toLowerCase()

      if (key === 'd' && players[0]?.isActive && !playDelay &&
        gameEngine && gameEngine.getDeckCount() > 0 &&
        !(players[0]?.cards.some(card => card.isPlayable) || false)) {
        drawCard()
      } else if (key === 'u' && players[0] && players[0].cardCount === 1) {
        callUno()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [players, playDelay, gameEngine])

  // Object pooling for animations
  const getAnimationFromPool = (): AnimatedCard => {
    if (animationPool.length > 0) {
      const pooled = animationPool[0]
      setAnimationPool(prev => prev.slice(1))
      return {
        ...pooled,
        id: nextAnimationId,
        isAnimating: false,
        currentX: 0,
        currentY: 0,
        startTime: 0
      }
    }

    // Create new animation object if pool is empty
    const newAnimation: AnimatedCard = {
      id: nextAnimationId,
      card: { id: 0, color: "red", value: "1", isPlayable: false },
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      currentX: 0,
      currentY: 0,
      isAnimating: false,
      type: 'throw',
      rotation: 0,
      scale: 1,
      zIndex: 1000,
      trajectory: 'straight',
      duration: 1200,
      delay: 0,
      startTime: 0
    }

    setNextAnimationId(prev => prev + 1)
    return newAnimation
  }

  const returnAnimationToPool = (animation: AnimatedCard) => {
    setAnimationPool(prev => [...prev, animation])
  }

  // Performance monitoring
  const logAnimationPerformance = () => {
    if (isDeveloperMode) {
      const activeAnimations = animatedCards.filter(card => card.isAnimating).length
      const poolSize = animationPool.length
      console.log(`Animation Performance - Active: ${activeAnimations}/3, Pool: ${poolSize}`)
    }
  }

  const convertToUIFormat = () => {
    if (!gameEngine) return { players: [], currentCard: null, direction: "clockwise" as GameDirection }

    const enginePlayers = gameEngine.getPlayers()
    const topCard = gameEngine.getTopCard()
    const nextPlayer = gameEngine.getNextPlayer()

    const players: Player[] = enginePlayers.map((player, index) => {
      const playerData = {
        id: index,
        name: player.name,
        cardCount: player.getHandSize(),
        avatar:
          index === 0
            ? "/placeholder.svg?height=48&width=48"
            : index === 1
              ? "/diverse-female-avatar.png"
              : index === 2
                ? "/male-avatar.png"
                : index === 3
                  ? "/female-avatar-2.png"
                  : index === 4
                    ? "/male-avatar-2.png"
                    : "/female-avatar-3.png",
        isActive: gameEngine.getCurrentPlayer().id === player.id,
        isNextPlayer: nextPlayer.id === player.id,
        position: getPlayerPosition(index),
        cards: index === 0 ? (player.getHand() || []).map(convertEngineCard) : [],
      }

      return playerData
    })



    return {
      players,
      currentCard: topCard ? convertEngineCard(topCard) : null,
      direction: gameEngine.getDirection(),
    }
  }

  const convertEngineCard = (engineCard: EngineCard): GameCard => ({
    id: Number.parseInt(engineCard.id),
    color: engineCard.color,
    value: engineCard.value,
    isPlayable: false, // Will be updated by updatePlayableCards
  })

  const getPlayerPosition = (index: number) => {
    // Current player (bottom center) - unchanged
    if (index === 0) {
      return { top: "92%", left: "50%" }
    }

    // Perfect symmetrical arc using polar coordinates
    const centerX = 50; // Center of screen horizontally
    const centerY = 35 + 20; // Center of deck area moved 20px below
    const radius = 35;  // Distance from center (increased for more spacing)

    // Angles for each opponent (in degrees)
    const angles = [180, 225, 270, 315, 0]; // Perfect arc distribution

    const opponentIndex = index - 1
    if (opponentIndex < angles.length) {
      const angle = angles[opponentIndex];
      const radian = (angle * Math.PI) / 180;

      return {
        top: `${centerY + radius * Math.sin(radian)}%`,
        left: `${centerX + radius * Math.cos(radian)}%`,
        position: 'absolute' as const,
        transform: 'translate(-50%, -50%)' // Perfect centering
      }
    }

    // Fallback for additional players
    const fallbackIndex = opponentIndex - angles.length
    return {
      top: `${centerY + (fallbackIndex * 5)}%`,
      left: `${centerX + (fallbackIndex * 10)}%`,
      position: 'absolute' as const,
      transform: 'translate(-50%, -50%)'
    }
  }

  const updatePlayableCards = () => {
    if (!gameEngine || !currentCard) return

    const topCard = gameEngine.getTopCard()
    const wildColor = gameEngine.getWildColor()
    const humanPlayer = gameEngine.getPlayers()[0]

    if (topCard) {
      const playableCards = humanPlayer.getPlayableCards(topCard, wildColor || undefined)
      const playableIds = new Set(playableCards.map((card) => card.id))

      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.map((player) => {
          if (player.id === 0) {
            return {
              ...player,
              cards: (player.cards || []).map((card) => ({
                ...card,
                isPlayable: playableIds.has(card.id.toString()),
              })),
            }
          }
          return player
        })
        return updatedPlayers
      })
    }
  }

  const playCard = (cardToPlay: GameCard) => {
    if (!gameEngine || !currentCard || !canPlayCard(cardToPlay, currentCard) || playDelay || !players[0]?.isActive)
      return

    setIsAnimating(true)
    setPlayDelay(true)

    // Enhanced sound effects based on card type
    if (cardToPlay.color === "wild") {
      playSound("special")
      // Add particle effects for wild cards
      createParticleEffect(cardToPlay, "wild")
    } else if (cardToPlay.value === "Skip" || cardToPlay.value === "Draw Two") {
      playSound("special")
      // Add particle effects for action cards
      createParticleEffect(cardToPlay, "action")
    } else {
      playSound("play")
      // Add subtle particle effects for number cards
      createParticleEffect(cardToPlay, "number")
    }

    const moveEvaluation = evaluateMove(cardToPlay, { currentCard, direction, players })
    setFeedback(moveEvaluation)

    setTimeout(() => setFeedback(null), 2000)

    const userHandElement = document.querySelector("[data-user-hand]")
    const centerElement = document.querySelector("[data-center-pile]")
    const playedCardElement = document.querySelector(`[data-card-id="${cardToPlay.id}"]`)

    if (userHandElement && centerElement) {
      const userHandRect = userHandElement.getBoundingClientRect()
      const centerRect = centerElement.getBoundingClientRect()

      let startX = userHandRect.left + userHandRect.width / 2
      let startY = userHandRect.top + userHandRect.height / 2

      if (playedCardElement) {
        const cardRect = playedCardElement.getBoundingClientRect()
        startX = cardRect.left + cardRect.width / 2
        startY = cardRect.top + cardRect.height / 2
      }

      // Check if we can add more animations (limit to 3 concurrent)
      if (animatedCards.filter(card => card.isAnimating).length >= 3) {
        // Skip animation if too many are running
        console.log("Animation limit reached, skipping card throw animation")
      } else {
        // Create realistic throwing animation using object pooling
        const animatedCard = getAnimationFromPool()
        animatedCard.card = cardToPlay
        animatedCard.startX = startX
        animatedCard.startY = startY
        animatedCard.endX = centerRect.left + centerRect.width / 2
        animatedCard.endY = centerRect.top + centerRect.height / 2
        animatedCard.currentX = startX
        animatedCard.currentY = startY
        animatedCard.isAnimating = true
        animatedCard.type = 'throw'
        animatedCard.rotation = Math.random() * 360 - 180 // Random rotation for realistic effect
        animatedCard.scale = 1.2
        animatedCard.zIndex = 10000
        animatedCard.trajectory = 'arc' // Use arc trajectory for throwing effect
        animatedCard.duration = 1200 // Reduced from 2000ms to 1200ms
        animatedCard.delay = animatedCards.filter(card => card.isAnimating).length * 150 // Stagger delay of 150ms
        animatedCard.startTime = Date.now() + animatedCard.delay

        setAnimatedCards((prev) => [...prev, animatedCard])
      }

      // Play card flip sound at start
      playSound("card-flip")

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    }

    // Delay game state update until animation completes
    setTimeout(() => {
      let chosenColor: "red" | "blue" | "green" | "yellow" | undefined
      if (cardToPlay.color === "wild") {
        const colors: ("red" | "blue" | "green" | "yellow")[] = ["red", "blue", "green", "yellow"]
        chosenColor = colors[Math.floor(Math.random() * colors.length)]
      }

      const success = gameEngine.playCard("player_0", cardToPlay.id.toString(), chosenColor)
      console.log("[v0] User card play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

      if (success) {
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

        if (gameEngine.isGameOver()) {
          const winner = gameEngine.getRoundWinner()
          if (winner) {
            playSound("win")
          }
        }
      }

      setIsAnimating(false)
      setPlayDelay(false)
    }, 1400) // Slightly longer than animation duration (1200ms + 200ms buffer)
  }

  // Add particle effect function
  const createParticleEffect = (card: GameCard, type: "wild" | "action" | "number") => {
    // Limit particle effects to prevent performance issues
    const existingParticles = document.querySelectorAll('.animate-particle-sparkle')
    if (existingParticles.length > 10) {
      console.log("Too many particles, skipping particle effect")
      return
    }
    const centerElement = document.querySelector("[data-center-pile]")
    if (!centerElement) return

    const rect = centerElement.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Create particle elements (reduced count for performance)
    const particleCount = type === "wild" ? 6 : type === "action" ? 4 : 2
    const colors = type === "wild"
      ? ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"]
      : type === "action"
        ? ["#ff9ff3", "#54a0ff", "#5f27cd", "#00d2d3"]
        : ["#ff6b6b", "#4ecdc4", "#45b7d1"]

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "fixed pointer-events-none rounded-full animate-particle-sparkle"
      particle.style.cssText = `
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        z-index: 10001;
        --sparkle-x: ${(Math.random() - 0.5) * 100}px;
        --sparkle-y: ${(Math.random() - 0.5) * 100}px;
        --sparkle-x2: ${(Math.random() - 0.5) * 200}px;
        --sparkle-y2: ${(Math.random() - 0.5) * 200}px;
      `
      document.body.appendChild(particle)

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 1000)
    }
  }

  const drawCard = () => {
    if (!gameEngine || playDelay || !players[0]?.isActive) return

    // Check if player has playable cards
    const topCard = gameEngine.getTopCard()
    if (topCard) {
      const playableCards = players[0]?.cards.filter(card => card.isPlayable) || []
      if (playableCards.length > 0) {
        console.log("[v0] Cannot draw - player has playable cards:", playableCards.length)
        return
      }
    }

    playSound("draw")
    setPlayDelay(true)

    // Create drawing animation
    const deckElement = document.querySelector("[data-deck]")
    const userHandElement = document.querySelector("[data-user-hand]")

    if (deckElement && userHandElement) {
      const deckRect = deckElement.getBoundingClientRect()
      const handRect = userHandElement.getBoundingClientRect()

      // Check if we can add more animations (limit to 3 concurrent)
      if (animatedCards.filter(card => card.isAnimating).length >= 3) {
        // Skip animation if too many are running
        console.log("Animation limit reached, skipping draw animation")
      } else {
        // Create drawing animation using object pooling
        const animatedCard = getAnimationFromPool()
        animatedCard.card = { id: Math.random(), color: "red", value: "?", isPlayable: false }
        animatedCard.startX = deckRect.left + deckRect.width / 2
        animatedCard.startY = deckRect.top + deckRect.height / 2
        animatedCard.endX = handRect.left + handRect.width / 2
        animatedCard.endY = handRect.top + handRect.height / 2
        animatedCard.currentX = deckRect.left + deckRect.width / 2
        animatedCard.currentY = deckRect.top + deckRect.height / 2
        animatedCard.isAnimating = true
        animatedCard.type = 'draw'
        animatedCard.rotation = 0
        animatedCard.scale = 1
        animatedCard.zIndex = 9999
        animatedCard.trajectory = 'straight'
        animatedCard.duration = 1200 // Reduced from 1500ms to 1200ms
        animatedCard.delay = animatedCards.filter(card => card.isAnimating).length * 150 // Stagger delay of 150ms
        animatedCard.startTime = Date.now() + animatedCard.delay

        setAnimatedCards((prev) => [...prev, animatedCard])
      }

      // Play card flip sound at start
      playSound("card-flip")

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    }

    // Delay game state update until animation completes
    setTimeout(() => {
      const drawnCard = gameEngine.drawCard("player_0")
      console.log("[v0] User draw result, New current player:", gameEngine.getCurrentPlayer().name)

      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      setPlayDelay(false)
    }, 1400) // Slightly longer than animation duration (1200ms + 200ms buffer)
  }

  const callUno = () => {
    if (!gameEngine || players[0]?.cardCount !== 1) return
    playSound("uno")
    gameEngine.callUno("player_0")
  }

  const challengeUno = (targetPlayerId: string) => {
    if (!gameEngine) return
    const success = gameEngine.challengeUno("player_0", targetPlayerId)
    if (success) {
      playSound("special")
      setFeedback({ message: "🎯 UNO Challenge Successful! +2 cards penalty!", type: "great" })
    } else {
      setFeedback({ message: "❌ UNO Challenge Failed!", type: "bad" })
    }
    setTimeout(() => setFeedback(null), 2000)
  }

  const challengeWildDrawFour = (targetPlayerId: string) => {
    if (!gameEngine) return
    const success = gameEngine.challengeWildDrawFour("player_0", targetPlayerId)
    if (success) {
      playSound("special")
      setFeedback({ message: "🎯 Wild Draw Four Challenge Successful! +4 cards penalty!", type: "great" })
    } else {
      playSound("draw")
      setFeedback({ message: "❌ Wild Draw Four Challenge Failed! You draw 6 cards!", type: "bad" })
    }
    setTimeout(() => setFeedback(null), 2000)
  }

  useEffect(() => {
    if (!gameEngine || gameEngine.isGameOver()) return

    const currentPlayer = gameEngine.getCurrentPlayer()
    setCurrentPlayerId(currentPlayer.id)

    const isHumanTurn = currentPlayer.name === "You" || currentPlayer.id === "player_0"

    if (!isHumanTurn && !playDelay) {
      console.log("[v0] AI turn starting for:", currentPlayer.name)
      const timer = setTimeout(() => {
        playAITurn()
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [currentPlayerId, playDelay, gameEngine])

  const playAITurn = () => {
    if (!gameEngine || isAITurnAnimating) return

    const currentPlayer = gameEngine.getCurrentPlayer()
    console.log("Playing AI turn for:", currentPlayer.name)

    setIsAITurnAnimating(true)

    // First, determine what the AI will do
    const topCard = gameEngine.getTopCard()
    let cardToPlay: GameCard | null = null
    let chosenWildColor: string | undefined = undefined
    let shouldDraw = false

    if (topCard) {
      // Convert topCard to GameCard format for comparison
      const topGameCard: GameCard = {
        id: Number.parseInt(topCard.id),
        color: topCard.color,
        value: topCard.value,
        isPlayable: false
      }

      // Find a playable card in AI's hand
      const aiHand = currentPlayer.getHand()
      for (const card of aiHand) {
        const gameCard: GameCard = {
          id: Number.parseInt(card.id),
          color: card.color,
          value: card.value,
          isPlayable: false
        }

        if (canPlayCard(gameCard, topGameCard)) {
          cardToPlay = gameCard
          if (card.isWildCard()) {
            // AI chooses color based on most cards in hand
            const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 }
            aiHand.forEach(c => {
              if (c.color !== "wild") {
                colorCounts[c.color as keyof typeof colorCounts]++
              }
            })
            const maxColor = Object.entries(colorCounts).reduce((a, b) =>
              colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b
            )[0]
            chosenWildColor = maxColor
          }
          break
        }
      }

      // If no playable card found, AI should draw
      if (!cardToPlay) {
        shouldDraw = true
      }
    }

    const currentPlayerIndex = gameEngine.getPlayers().findIndex((p) => p.id === currentPlayer.id)
    const aiPlayerElement = document.querySelector(`[data-player="${currentPlayerIndex}"]`)
    const centerElement = document.querySelector("[data-center-pile]")
    const deckElement = document.querySelector("[data-deck]")

    if (aiPlayerElement && centerElement) {
      if (shouldDraw && deckElement) {
        // AI needs to draw a card
        console.log("AI drawing card")
        playSound("draw")

        const aiPlayerRect = aiPlayerElement.getBoundingClientRect()
        const deckRect = deckElement.getBoundingClientRect()

        // Create drawing animation
        const animatedCard: AnimatedCard = {
          id: Date.now() + currentPlayerIndex,
          card: { id: Math.random(), color: "red", value: "?", isPlayable: false },
          startX: deckRect.left + deckRect.width / 2,
          startY: deckRect.top + deckRect.height / 2,
          endX: aiPlayerRect.left + aiPlayerRect.width / 2,
          endY: aiPlayerRect.top + aiPlayerRect.height / 2,
          currentX: deckRect.left + deckRect.width / 2,
          currentY: deckRect.top + deckRect.height / 2,
          isAnimating: true,
          type: 'draw',
          rotation: 0,
          scale: 1,
          zIndex: 9999,
          trajectory: 'straight',
          duration: 1500,
          delay: 0,
          startTime: Date.now(),
        }

        setAnimatedCards((prev) => [...prev, animatedCard])
        playSound("card-flip")

        // Execute AI draw after animation
        setTimeout(() => {
          // For AI drawing, we need to call drawCard directly since playAITurn would try to make another decision
          const drawnCard = gameEngine.drawCard(currentPlayer.id)
          console.log("AI draw result:", drawnCard ? "success" : "failed", "New current player:", gameEngine.getCurrentPlayer().name)

          const gameData = convertToUIFormat()
          setPlayers(gameData.players)
          setCurrentCard(gameData.currentCard)
          setDirection(gameData.direction)
          setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
          setIsAITurnAnimating(false)
        }, 1600)
      } else if (cardToPlay) {
        // AI will play a card
        console.log("AI playing card:", cardToPlay)
        const aiSounds = ["play", "special"] as const
        const randomSound = aiSounds[Math.floor(Math.random() * aiSounds.length)]
        playSound(randomSound)

        const aiPlayerRect = aiPlayerElement.getBoundingClientRect()
        const centerRect = centerElement.getBoundingClientRect()

        // Create AI card throwing animation with the actual card being played
        const animatedCard: AnimatedCard = {
          id: Date.now() + currentPlayerIndex,
          card: cardToPlay,
          startX: aiPlayerRect.left + aiPlayerRect.width / 2,
          startY: aiPlayerRect.top + aiPlayerRect.height / 2,
          endX: centerRect.left + centerRect.width / 2,
          endY: centerRect.top + centerRect.height / 2,
          currentX: aiPlayerRect.left + aiPlayerRect.width / 2,
          currentY: aiPlayerRect.top + aiPlayerRect.height / 2,
          isAnimating: true,
          type: 'throw',
          rotation: Math.random() * 720 - 360, // More dramatic rotation for AI
          scale: 1.5, // Make it bigger for better visibility
          zIndex: 10000,
          trajectory: 'arc', // Use arc for more dramatic AI throws
          duration: 3000, // Longer duration for better visibility
          delay: 0,
          startTime: Date.now(),
        }

        setAnimatedCards((prev) => [...prev, animatedCard])
        playSound("card-flip")

        // Execute AI play after animation
        setTimeout(() => {
          // For AI playing, we need to call playCard directly with the chosen card
          const success = gameEngine.playCard(currentPlayer.id, cardToPlay.id.toString(), chosenWildColor as UnoColor | undefined)
          console.log("AI play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

          const gameData = convertToUIFormat()
          setPlayers(gameData.players)
          setCurrentCard(gameData.currentCard)
          setDirection(gameData.direction)
          setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
          setIsAITurnAnimating(false)
        }, 3100)
      } else {
        // Fallback: just execute AI turn without animation
        console.log("AI turn fallback - no animation")
        const success = gameEngine.playAITurn()
        console.log("AI turn result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
        setIsAITurnAnimating(false)
      }
    } else {
      // Fallback: just execute AI turn without animation
      console.log("AI turn fallback - no DOM elements")
      const success = gameEngine.playAITurn()
      console.log("AI turn result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
      setIsAITurnAnimating(false)
    }
  }

  const canPlayCard = (card: GameCard, topCard: GameCard): boolean => {
    if (card.color === "wild") return true

    if (gameEngine?.getWildColor() && card.color === gameEngine.getWildColor()) return true

    if (card.color === topCard.color) return true
    if (card.value === topCard.value && typeof card.value === typeof topCard.value) return true

    return false
  }

  const playSound = (type: "play" | "draw" | "win" | "uno" | "special" | "shuffle" | "card-flip" | "card-land") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const createSound = (frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      return { oscillator, gainNode }
    }

    switch (type) {
      case "play":
        // Card swoosh sound - quick frequency sweep
        createSound(400, 0.15, "sawtooth", 0.2)
        setTimeout(() => createSound(600, 0.1, "sine", 0.15), 50)
        break

      case "draw":
        // Card flip sound - lower pitched
        createSound(300, 0.2, "square", 0.25)
        setTimeout(() => createSound(250, 0.15, "triangle", 0.2), 80)
        break

      case "win":
        // Victory fanfare - ascending notes
        createSound(523, 0.3, "sine", 0.4) // C5
        setTimeout(() => createSound(659, 0.3, "sine", 0.4), 150) // E5
        setTimeout(() => createSound(784, 0.5, "sine", 0.5), 300) // G5
        setTimeout(() => createSound(1047, 0.8, "sine", 0.6), 500) // C6
        break

      case "uno":
        // Dramatic UNO call - bold and attention-grabbing
        createSound(800, 0.4, "square", 0.5)
        setTimeout(() => createSound(1000, 0.3, "sawtooth", 0.4), 200)
        setTimeout(() => createSound(1200, 0.5, "sine", 0.6), 400)
        break

      case "special":
        // Special card effect - magical sound
        createSound(600, 0.2, "triangle", 0.3)
        setTimeout(() => createSound(800, 0.2, "sine", 0.25), 100)
        setTimeout(() => createSound(1000, 0.3, "sawtooth", 0.2), 200)
        break

      case "shuffle":
        // Card shuffle sound - rapid sequence
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            createSound(200 + Math.random() * 200, 0.1, "square", 0.15)
          }, i * 50)
        }
        break

      case "card-flip":
        // Card flip sound - crisp and quick
        createSound(500, 0.08, "sine", 0.1)
        setTimeout(() => createSound(700, 0.08, "sine", 0.1), 50)
        break

      case "card-land":
        // Card landing sound - soft thud
        createSound(300, 0.12, "sawtooth", 0.15)
        break
    }
  }

  useEffect(() => {
    if (gameEngine) {
      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      playSound("shuffle")
    }
  }, [gameEngine])

  useEffect(() => {
    if (gameEngine && currentCard) {
      updatePlayableCards()
    }
  }, [gameEngine, currentCard])

  // Animation frame update for smooth card movement
  useEffect(() => {
    if (animatedCards.length === 0) return

    let animationId: number

    const animate = () => {
      setAnimatedCards(prev => {
        const updated = prev.map(card => {
          if (!card.isAnimating) return card

          const elapsed = Date.now() - card.startTime
          const progress = Math.min(elapsed / card.duration, 1)

          if (progress >= 1) {
            // Animation complete
            if (card.type === 'throw' || card.type === 'draw') {
              playSound("card-land")
            }
            return { ...card, isAnimating: false, currentX: card.endX, currentY: card.endY, type: 'land' as any }
          }

          // Simple linear interpolation for smooth movement
          const currentX = card.startX + (card.endX - card.startX) * progress
          const currentY = card.startY + (card.endY - card.startY) * progress

          return { ...card, currentX, currentY }
        })

        // Remove completed animations and return to pool
        const completed = updated.filter(card => !card.isAnimating && card.type === 'land')
        if (completed.length > 0) {
          // Return completed animations to pool
          completed.forEach(card => returnAnimationToPool(card))

          setTimeout(() => {
            setAnimatedCards(current => current.filter(card => card.isAnimating || card.type !== 'land'))
          }, 500)
        }

        return updated
      })

      // Continue animation loop if there are still animating cards
      if (animatedCards.some(card => card.isAnimating)) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [animatedCards.length])

  const renderCardContent = (card: GameCard, size: "small" | "medium" | "large" = "medium") => {
    const sizeClasses = {
      small: "text-lg",
      medium: "text-2xl",
      large: "text-3xl",
    }

    const getCardIcon = (value: string | number) => {
      if (value === "Skip") return <Ban className="w-6 h-6" />
      if (value === "Draw Two") return <Plus className="w-6 h-6" />
      if (value === "Wild") return <Shuffle className="w-6 h-6" />
      return value
    }

    const cardIcon = getCardIcon(card.value)

    return (
      <div className="w-full h-full rounded-lg flex flex-col items-center justify-between p-1 relative">
        <div
          className={`${sizeClasses[size]} font-black text-white drop-shadow-lg self-start flex items-center justify-center`}
        >
          {typeof cardIcon === "object" ? cardIcon : cardIcon}
        </div>

        <div
          className={`${size === "large" ? "text-4xl" : size === "medium" ? "text-3xl" : "text-2xl"} font-black text-white drop-shadow-lg flex items-center justify-center`}
        >
          {typeof cardIcon === "object" ? (
            <div className={size === "large" ? "scale-150" : size === "medium" ? "scale-125" : "scale-100"}>
              {cardIcon}
            </div>
          ) : (
            cardIcon
          )}
        </div>

        <div
          className={`${sizeClasses[size]} font-black text-white drop-shadow-lg self-end transform rotate-180 flex items-center justify-center`}
        >
          {typeof cardIcon === "object" ? cardIcon : cardIcon}
        </div>

        <div className="absolute inset-1 border-2 border-white/20 rounded-md"></div>
      </div>
    )
  }

  const getCardColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-gradient-to-br from-red-600 to-red-400"
      case "blue":
        return "bg-gradient-to-br from-blue-600 to-blue-400"
      case "green":
        return "bg-gradient-to-br from-green-600 to-green-400"
      case "yellow":
        return "bg-gradient-to-br from-yellow-500 to-yellow-300"
      case "wild":
        return "bg-gradient-to-br from-purple-600 via-pink-500 to-red-500"
      default:
        return "bg-gradient-to-br from-gray-600 to-gray-400"
    }
  }

  const evaluateMove = (
    cardPlayed: GameCard,
    gameState: any,
  ): { message: string; type: "good" | "bad" | "great" | "perfect" } => {
    const userCards = players[0]?.cards || []
    const remainingCards = userCards.length - 1 // After playing this card

    if (remainingCards === 0) {
      return { message: "🎉 PERFECT! You won the round!", type: "perfect" }
    }

    if (remainingCards === 1) {
      return { message: "🔥 AMAZING! One card left - don't forget UNO!", type: "perfect" }
    }

    if (cardPlayed.color === "wild") {
      return { message: "🌟 GREAT PLAY! Wild card at the perfect time!", type: "great" }
    }

    if (cardPlayed.value === "Skip" || cardPlayed.value === "Draw Two") {
      return { message: "💪 EXCELLENT! Action card disrupts opponents!", type: "great" }
    }

    if (cardPlayed.value === "Reverse") {
      return { message: "👍 NICE! Reverse can change the game flow!", type: "good" }
    }

    const playableCards = userCards.filter((card) => card.isPlayable)
    if (playableCards.length > 3) {
      return { message: "🎯 GOOD CHOICE! Smart selection from many options!", type: "good" }
    }

    const goodMessages = [
      "✨ SOLID MOVE! Keep it up!",
      "👌 NICE PLAY! You're doing great!",
      "🎮 GOOD STRATEGY! Well played!",
      "⚡ SMOOTH! That works perfectly!",
    ]

    return {
      message: goodMessages[Math.floor(Math.random() * goodMessages.length)],
      type: "good",
    }
  }

  if (!gameEngine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
        <Card className="p-8 bg-black/50 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Loading UNO Game...</h2>
          <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full mx-auto"></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800"></div>

      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-xl animate-bounce"></div>

        {/* Additional animated background elements */}
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-white/35 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-2/3 right-1/6 w-1 h-1 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rotate-45 animate-ping"></div>
        <div
          className="absolute top-3/4 right-1/4 w-2 h-2 bg-white rotate-45 animate-ping"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/6 w-2 h-2 bg-white rotate-45 animate-ping"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/6 w-2 h-2 bg-white rotate-45 animate-ping"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {animatedCards.map((animatedCard) => {
        const getAnimationStyle = () => {
          // Use the current position that's being updated by the animation frame
          const currentX = animatedCard.currentX || animatedCard.startX
          const currentY = animatedCard.currentY || animatedCard.startY

          // Calculate rotation and scale based on animation type
          let rotation = 0
          let scale = animatedCard.scale || 1

          if (animatedCard.isAnimating) {
            const elapsed = Date.now() - animatedCard.startTime
            const progress = Math.min(elapsed / animatedCard.duration, 1)

            if (animatedCard.type === 'throw') {
              rotation = (animatedCard.rotation || 0) * progress
              if (animatedCard.trajectory === 'arc') {
                scale = (animatedCard.scale || 1) + Math.sin(progress * Math.PI) * 0.2
              }
            } else if (animatedCard.type === 'draw') {
              rotation = Math.sin(progress * Math.PI * 4) * 15
            }
          }

          return {
            left: currentX - 50,
            top: currentY - 70,
            zIndex: animatedCard.zIndex,
            transform: `rotate(${rotation}deg) scale(${scale})`,
            transition: 'none',
            position: 'fixed' as const,
            pointerEvents: 'none' as const,
          }
        }

        const getGlowEffect = () => {
          switch (animatedCard.type) {
            case 'throw':
              return 'shadow-2xl border-4 border-yellow-400 animate-pulse drop-shadow-2xl'
            case 'draw':
              return 'shadow-xl border-2 border-blue-400 animate-pulse drop-shadow-xl'
            case 'land':
              return 'shadow-lg border-2 border-green-400 animate-card-land'
            default:
              return 'shadow-lg border-2 border-white/50'
          }
        }

        return (
          <div
            key={animatedCard.id}
            className="fixed pointer-events-none"
            style={getAnimationStyle()}
          >
            <div className="relative">
              <UnoCard
                color={animatedCard.card.color}
                value={animatedCard.card.value}
                size="medium"
                className={getGlowEffect()}
              />

              {/* Enhanced glow effects based on animation type */}
              {animatedCard.type === 'throw' && (
                <>
                  <div className="absolute inset-0 bg-yellow-400/50 rounded-lg blur-lg animate-pulse"></div>
                  <div className="absolute inset-0 bg-white/30 rounded-lg blur-md animate-ping"></div>
                  <div className="absolute inset-0 bg-red-400/40 rounded-lg blur-sm animate-bounce"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/60 to-orange-400/60 rounded-lg blur-xl animate-pulse"></div>
                </>
              )}

              {animatedCard.type === 'draw' && (
                <>
                  <div className="absolute inset-0 bg-blue-400/40 rounded-lg blur-lg animate-pulse"></div>
                  <div className="absolute inset-0 bg-cyan-300/30 rounded-lg blur-md animate-ping"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-cyan-400/50 rounded-lg blur-xl animate-pulse"></div>
                </>
              )}

              {/* Enhanced particle trail effects */}
              {animatedCard.type === 'throw' && (
                <>
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400/60 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400/50 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-red-400/40 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                  <div className="absolute top-1/2 -right-2 w-2 h-2 bg-yellow-300/50 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                </>
              )}

              {animatedCard.type === 'draw' && (
                <>
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400/50 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {gameEngine?.isGameOver() && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="p-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-center shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 font-gaming">🎉 Game Over! 🎉</h2>
            <p className="text-2xl font-semibold mb-6 font-gaming-secondary">{gameEngine.getRoundWinner()?.name || 'Unknown'} Wins!</p>
            <Button onClick={() => window.location.reload()} className="bg-black text-white hover:bg-gray-800 font-gaming-secondary">
              Play Again
            </Button>
          </Card>
        </div>
      )}

      {/* Action Card Confirmation Dialog */}
      {showActionConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center shadow-2xl max-w-md">
            <h3 className="text-xl font-bold mb-4">Confirm Action Card</h3>
            <div className="mb-4">
              <UnoCard
                color={showActionConfirm.card.color}
                value={showActionConfirm.card.value}
                size="medium"
                className="mx-auto"
              />
            </div>
            <p className="text-sm mb-6 opacity-90">
              Are you sure you want to play this {showActionConfirm.card.value} card?
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowActionConfirm(null)}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={showActionConfirm.confirmed}
                className="bg-yellow-500 text-black hover:bg-yellow-400"
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {feedback && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div
            className={`
            px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce text-center font-bold text-lg font-gaming-secondary
            ${feedback.type === "perfect" ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-300" : ""}
            ${feedback.type === "great" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300" : ""}
            ${feedback.type === "good" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-300" : ""}
            ${feedback.type === "bad" ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300" : ""}
          `}
          >
            <p className="drop-shadow-lg">{feedback.message}</p>
            {feedback.type === "perfect" && (
              <div className="absolute inset-0 bg-yellow-400/30 rounded-2xl blur-xl animate-pulse"></div>
            )}
          </div>
        </div>
      )}

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 flex items-center gap-4 z-10">
        {/* Developer Mode Toggle */}
        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/20 hover:bg-white/10 flex items-center gap-1"
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
        >
          <Brain className="w-4 h-4" />
          Dev Mode
        </Button>

        {/* Developer Mode Panel */}
        {isDeveloperMode && (
          <div className="bg-black/70 text-white p-2 rounded-lg text-xs">
            <div>Draw Penalty: {gameEngine?.getDrawPenalty() || 0}</div>
            <div>Last Action: {gameEngine?.getLastActionCard()?.value || "None"}</div>
            <div>Playable Cards: {players[0]?.cards.filter(c => c.isPlayable).length || 0}</div>
            <div>Can Challenge UNO: {players.slice(1).some(p => gameEngine?.canChallengeUno(`player_${p.id}`)) ? "Yes" : "No"}</div>
            <div>Opponents: {players.slice(1).length}</div>
            <div>Positions: {players.slice(1).map(p => `${p.name}:${p.position.top},${p.position.left}`).join(' | ')}</div>
            <div>Active Animations: {animatedCards.filter(card => card.isAnimating).length}/3</div>
            <div>Animation Pool: {animationPool.length}</div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="bg-black/50 text-white p-2 rounded-lg text-xs">
          <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
          <div className={`${players[0]?.isActive && !playDelay && gameEngine && gameEngine.getDeckCount() > 0 && !(players[0]?.cards.some(card => card.isPlayable) || false) ? 'text-green-400' : 'text-gray-400'}`}>
            D - Draw Card
          </div>
          <div className={`${players[0] && players[0].cardCount === 1 ? 'text-green-400' : 'text-gray-400'}`}>
            U - Call UNO
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/20 hover:bg-white/10 flex items-center gap-1"
          onClick={() => setIsDiscardPileVisible(!isDiscardPileVisible)}
          disabled={!gameEngine?.getRules().showDiscardPile}  // Only enable if rule is on
          title={gameEngine?.getRules().showDiscardPile ? "Toggle Discard Pile View" : "Full Discard Pile Disabled"}
        >
          <Shuffle className="w-4 h-4" />
          Discard Pile
        </Button>
      </div>

      {/* Top-right game stats */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <Badge
          variant="secondary"
          className="text-sm font-bold bg-black/50 text-white border-white/20 flex items-center gap-1 font-gaming-secondary"
        >
          <Trophy className="w-4 h-4" />
          {gameState.level}
        </Badge>
        <Badge variant="outline" className="text-sm bg-black/50 text-white border-white/20 flex items-center gap-1 font-gaming-secondary">
          <Coins className="w-4 h-4" />
          {gameState.coins}
        </Badge>
      </div>

      {/* Center Game Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
        {/* Uno Arena Imprinted Text */}
        <div className="uno-arena-text fascinate-regular">
          UNO ARENA
        </div>

        <div className="flex items-center gap-8">
          <div className="relative" data-deck>
            <Card
              className={`bg-gradient-to-br from-red-600 to-red-800 border-2 border-white/30 shadow-2xl transform rotate-2 cursor-pointer transition-transform ${playDelay ? "opacity-50" : "hover:scale-105"
                }`}
              onClick={drawCard}
              style={{ width: '80px', height: '120px' }}
            >
              <div className="w-full h-full rounded-lg flex items-center justify-center relative">
                <Hand className="w-8 h-8 text-white drop-shadow-lg" />
                <div className="absolute inset-2 border-2 border-white/30 rounded-md"></div>
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
            </Card>
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white border-white/20">
              {gameEngine?.getDeckCount()}
            </Badge>
          </div>

          <div className="relative" data-center-pile>
            <div
              className={`transform -rotate-1 transition-all duration-500 ${isAnimating ? "scale-110 rotate-12" : ""}`}
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
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-lg blur-xl animate-pulse scale-110"></div>
                  <div className="absolute inset-0 bg-white/10 rounded-lg blur-md animate-ping scale-105"></div>
                  <div className="absolute inset-0 ring-4 ring-yellow-400/30 rounded-lg animate-pulse scale-125"></div>
                </div>
              )}
              {isAnimating && (
                <div className="w-20 h-28 bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/30 shadow-2xl rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-400 text-black animate-bounce font-bold shadow-xl flex items-center gap-2 px-3 py-1">
                <ArrowRight className="w-4 h-4" />
                Current Card
              </Badge>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col gap-2">
          <Badge variant="outline" className="text-xs bg-black/50 text-white border-white/20 flex items-center gap-1">
            {direction === "clockwise" ? <RotateCw className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            {direction}
          </Badge>
          {gameEngine?.getDrawPenalty() > 0 && (
            <Badge className="text-xs bg-red-500 text-white animate-pulse">
              Draw {gameEngine.getDrawPenalty()} cards!
            </Badge>
          )}
          {gameEngine?.getLastActionCard() && gameEngine.getDrawPenalty() > 0 && (
            <Badge className="text-xs bg-orange-500 text-white">
              Stackable: {gameEngine.getLastActionCard()?.value}
            </Badge>
          )}
        </div>
      </div>

      {/* Opponents Arc Container */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] z-30 pointer-events-none">
        {/* Debug info - remove in production */}
        {isDeveloperMode && (
          <div className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded text-xs">
            Opponents: {players.slice(1).length} | Total: {players.length}
          </div>
        )}

        {players.slice(1).map((player) => (
          <div
            key={player.id}
            data-player={player.id}
            className="absolute transition-all duration-500"
            style={{
              top: player.position.top,
              left: player.position.left,
              position: 'absolute',
              transform: `translate(-50%, -50%) ${player.isActive ? "scale(1.1)" : "scale(1.0)"}`,
            }}
          >
            <div className={`flex flex-col items-center gap-3 ${player.isActive ? "animate-pulse" : ""} pointer-events-auto`}>



              {/* Opponent Cards Display - Only for Active Player */}
              {player.isActive && (
                <div className="flex gap-[-15px] transform-origin-center mb-2">
                  {Array.from({ length: Math.min(player.cardCount, 5) }, (_, i) => (
                    <div
                      key={i}
                      className="transition-transform duration-300 hover:scale-110"
                      style={{
                        transform: `rotate(${(i - 2) * 3}deg)`,
                        zIndex: 5 - i
                      }}
                    >
                      <UnoCard
                        color="red"
                        value="1"
                        size="small"
                        className="shadow-lg"
                      />
                    </div>
                  ))}
                  {player.cardCount > 5 && (
                    <div className="w-[35px] h-[50px] bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-400 rounded-md shadow-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+{player.cardCount - 5}</span>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`relative transition-all duration-300 ${player.isActive
                  ? "ring-4 ring-yellow-400 rounded-full shadow-2xl shadow-yellow-400/70 scale-110"
                  : player.isNextPlayer
                    ? "ring-2 ring-blue-400/60 rounded-full shadow-lg shadow-blue-400/40 scale-105"
                    : ""
                  }`}
              >
                <Avatar
                  className={`border-2 border-white/30 shadow-lg transition-all duration-300 ${player.isActive
                    ? "w-20 h-20"
                    : player.isNextPlayer
                      ? "w-18 h-18"
                      : "w-16 h-16"
                    }`}
                >
                  <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-sm">
                    {player.name[0]}
                  </AvatarFallback>
                </Avatar>
                {player.isActive && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/40 rounded-full animate-ping shadow-lg"></div>
                    {/* Enhanced glow effect */}
                    <div className="absolute inset-0 ring-4 ring-yellow-400/50 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 ring-2 ring-yellow-300/30 rounded-full animate-ping"></div>
                  </>
                )}
                {player.isNextPlayer && !player.isActive && (
                  <>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400/60 rounded-full animate-pulse shadow-md"></div>
                    {/* Subtle glow effect for next player */}
                    <div className="absolute inset-0 ring-2 ring-blue-400/30 rounded-full animate-pulse"></div>
                  </>
                )}
              </div>

              <div className="text-center">
                <p
                  className={`font-semibold text-white drop-shadow-lg transition-all duration-300 ${player.isActive
                    ? "text-base"
                    : player.isNextPlayer
                      ? "text-sm font-bold"
                      : "text-sm"
                    }`}
                >
                  {player.name}
                  {player.isNextPlayer && !player.isActive && (
                    <span className="ml-1 text-blue-300 text-xs">→</span>
                  )}
                </p>
                <p className={`text-white/80 transition-all duration-300 ${player.isActive
                  ? "text-sm"
                  : player.isNextPlayer
                    ? "text-xs font-medium"
                    : "text-xs"
                  }`}>
                  {player.cardCount} {player.cardCount === 1 ? 'card' : 'cards'}
                </p>
                {player.cardCount === 1 && !player.isActive && (
                  <div className="mt-1">
                    <Badge className="bg-red-500 text-white text-xs animate-pulse">
                      Call UNO!
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center gap-8">
          <div className="relative" data-deck>
            <Card
              className={`bg-gradient-to-br from-red-600 to-red-800 border-2 border-white/30 shadow-2xl transform rotate-2 cursor-pointer transition-transform ${playDelay ? "opacity-50" : "hover:scale-105"
                }`}
              onClick={drawCard}
              style={{ width: '80px', height: '120px' }}
            >
              <div className="w-full h-full rounded-lg flex items-center justify-center relative">
                <Hand className="w-8 h-8 text-white drop-shadow-lg" />
                <div className="absolute inset-2 border-2 border-white/30 rounded-md"></div>
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
            </Card>
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white border-white/20">
              {gameEngine?.getDeckCount()}
            </Badge>
          </div>

          <div className="relative" data-center-pile>
            <div
              className={`transform -rotate-1 transition-all duration-500 ${isAnimating ? "scale-110 rotate-12" : ""}`}
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
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-lg blur-xl animate-pulse scale-110"></div>
                  <div className="absolute inset-0 bg-white/10 rounded-lg blur-md animate-ping scale-105"></div>
                  <div className="absolute inset-0 ring-4 ring-yellow-400/30 rounded-lg animate-pulse scale-125"></div>
                </div>
              )}
              {isAnimating && (
                <div className="w-20 h-28 bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/30 shadow-2xl rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-400 text-black animate-bounce font-bold shadow-xl flex items-center gap-2 px-3 py-1 font-gaming-secondary">
                <ArrowRight className="w-4 h-4" />
                Current Card
              </Badge>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col gap-2">
          <Badge variant="outline" className="text-xs bg-black/50 text-white border-white/20 flex items-center gap-1 font-gaming-secondary">
            {direction === "clockwise" ? <RotateCw className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            {direction}
          </Badge>
          {gameEngine?.getDrawPenalty() > 0 && (
            <Badge className="text-xs bg-red-500 text-white animate-pulse font-gaming-secondary">
              Draw {gameEngine.getDrawPenalty()} cards!
            </Badge>
          )}
          {gameEngine?.getLastActionCard() && gameEngine.getDrawPenalty() > 0 && (
            <Badge className="text-xs bg-orange-500 text-white font-gaming-secondary">
              Stackable: {gameEngine.getLastActionCard()?.value}
            </Badge>
          )}
        </div>
      </div>

      {/* Current Player Area - Casino Style Bottom Board */}
      <div className="absolute bottom-0 left-0 right-0 h-[45vh] z-20" data-user-hand>
        {/* Casino-style curved board background */}
        <div className="absolute bottom-0 left-0 right-0 h-full">
          {/* Ambient glow effect */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[95vw] h-[42vh] bg-gradient-to-t from-emerald-400/20 via-emerald-300/10 to-transparent rounded-t-[55%] blur-xl"></div>
          {/* Curved board with gradient */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vw] h-[40vh] bg-gradient-to-t from-emerald-900/80 via-emerald-800/60 to-emerald-700/40 rounded-t-[50%] border-t-4 border-emerald-500/50 shadow-2xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          {/* Inner curved board */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[85vw] h-[35vh] bg-gradient-to-t from-emerald-800/90 via-emerald-700/70 to-emerald-600/50 rounded-t-[45%] border-t-2 border-emerald-400/30"></div>
          {/* Decorative casino elements */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[80vw] h-[30vh] bg-gradient-to-t from-emerald-700/80 to-emerald-600/60 rounded-t-[40%] border-t border-emerald-300/20"></div>

          {/* Casino-style decorative dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-8">
            <div className="w-3 h-3 bg-yellow-400/60 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-red-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="w-3 h-3 bg-green-400/60 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-end h-full pb-8">
          {/* Player Hand - Positioned at the bottom of the curved board */}
          <div className="flex items-end gap-4 p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-4">
            {(players[0]?.cards || []).map((card, index) => (
              <div
                key={card.id}
                data-card-id={card.id}
                className={`transition-all duration-300 transform hover:scale-110 hover:-translate-y-4 ${card.isPlayable && players[0]?.isActive && !playDelay
                  ? "cursor-pointer hover:shadow-2xl hover:shadow-green-400/50 hover:rotate-0"
                  : card.isPlayable
                    ? "cursor-pointer hover:scale-105"
                    : "opacity-60"
                  }`}
                style={{
                  transform: `rotate(${(index - 3) * 3}deg) translateY(${index % 2 === 0 ? '0px' : '-10px'})`,
                  zIndex: card.isPlayable && players[0]?.isActive && !playDelay ? 10 : 1
                }}
                onClick={() => {
                  if (card.isPlayable && players[0]?.isActive && !playDelay) {
                    // Show confirmation for action cards
                    if (card.value === "Skip" || card.value === "Draw Two" || card.value === "Reverse" || card.color === "wild") {
                      setShowActionConfirm({
                        card,
                        confirmed: () => {
                          playCard(card)
                          setShowActionConfirm(null)
                        }
                      })
                    } else {
                      playCard(card)
                    }
                  }
                }}
              >
                <UnoCard
                  color={card.color}
                  value={card.value}
                  size="large"
                  isPlayable={card.isPlayable && players[0]?.isActive && !playDelay}
                  className={`shadow-xl transition-all duration-300 ${card.isPlayable && players[0]?.isActive && !playDelay
                    ? "hover:shadow-2xl hover:shadow-yellow-400/50 hover:border-yellow-400/80"
                    : ""
                    }`}
                />
              </div>
            ))}
          </div>




        </div>
      </div>





      {/* Challenge Buttons - Fixed Position Above Player Hand */}
      <div className="absolute bottom-[55vh] left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {players.slice(1).map((player) => {
            const canChallengeUno = gameEngine?.canChallengeUno(`player_${player.id}`)
            const canChallengeWildDrawFour = gameEngine?.canChallengeWildDrawFour(`player_${player.id}`)

            if (!canChallengeUno && !canChallengeWildDrawFour) return null

            return (
              <div key={player.id} className="flex gap-2">
                {canChallengeUno && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-300 border-yellow-500 hover:bg-yellow-500/30 text-xs hover:shadow-lg hover:shadow-yellow-400/30 transition-all duration-300"
                    onClick={() => challengeUno(`player_${player.id}`)}
                    disabled={playDelay}
                  >
                    Challenge {player.name} UNO
                  </Button>
                )}
                {canChallengeWildDrawFour && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-purple-500/20 text-purple-300 border-purple-500 hover:bg-purple-500/30 text-xs hover:shadow-lg hover:shadow-purple-400/30 transition-all duration-300"
                    onClick={() => challengeWildDrawFour(`player_${player.id}`)}
                    disabled={playDelay}
                  >
                    Challenge {player.name} +4
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons - Bottom Right Corner */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-40">
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold shadow-xl hover:shadow-2xl hover:shadow-blue-400/50 flex items-center gap-2 disabled:opacity-50 transition-all duration-300 min-h-[44px] font-gaming-secondary"
          onClick={drawCard}
          disabled={
            !players[0]?.isActive ||
            gameEngine?.getDeckCount() <= 0 ||
            playDelay ||
            (players[0]?.cards.some(card => card.isPlayable) || false)
          }
          title={
            !players[0]?.isActive
              ? "Not your turn"
              : gameEngine?.getDeckCount() <= 0
                ? "No cards left to draw"
                : playDelay
                  ? "Please wait"
                  : (players[0]?.cards.some(card => card.isPlayable) || false)
                    ? "You have playable cards - play them first!"
                    : "Draw a card (Press D)"
          }
        >
          <Plus className="w-5 h-5" />
          Draw Card
          <span className="text-xs opacity-70 ml-1">(D)</span>
        </Button>
        <Button
          size="lg"
          className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-xl hover:shadow-2xl hover:shadow-red-400/50 flex items-center gap-2 transition-all duration-300 min-h-[44px] font-gaming-secondary"
          onClick={callUno}
          disabled={!players[0] || players[0].cardCount !== 1}
          title={
            !players[0]
              ? "No player data"
              : players[0].cardCount !== 1
                ? `Call UNO when you have exactly 1 card (you have ${players[0].cardCount})`
                : "Call UNO! (Press U)"
          }
        >
          <Zap className="w-5 h-5" />
          UNO!
          <span className="text-xs opacity-70 ml-1">(U)</span>
        </Button>

        {/* View Logs Button */}
        <Button
          size="sm"
          variant="outline"
          className="bg-black/40 text-white border-white/30 hover:bg-black/60 hover:border-white/50 transition-all duration-300"
          onClick={() => setIsLogVisible(!isLogVisible)}
        >
          {isLogVisible ? "Hide Logs" : "View Logs"}
        </Button>
      </div>

      {/* Game Log Component */}
      <GameLog
        gameEngine={gameEngine}
        players={players}
        currentCard={currentCard}
        direction={direction}
        isVisible={isLogVisible}
        onToggleVisibility={() => setIsLogVisible(!isLogVisible)}
      />

      {/* Discard Pile Viewer */}
      {isDiscardPileVisible && gameEngine?.getRules().showDiscardPile && (
        <div className="absolute bottom-4 right-4 w-80 h-96 bg-black/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-4 z-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              Discard Pile ({gameEngine.getDiscardPile().length} cards)
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-gray-300"
              onClick={() => setIsDiscardPileVisible(false)}
            >
              Close
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {gameEngine.getDiscardPile().map((card, index) => (
              <UnoCard
                key={index}
                color={card.color}
                value={card.value}
                size="small"
                className="shadow-md"
              />
            ))}
          </div>
          {gameEngine.getDiscardPile().length === 0 && (
            <p className="text-white/70 text-center mt-8">Discard pile is empty</p>
          )}
        </div>
      )}
    </div>
  )
}
