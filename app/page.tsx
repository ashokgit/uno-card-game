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
import { UnoGame as GameEngine, type UnoCard as EngineCard, type GameDirection } from "@/lib/uno-engine"

interface Player {
  id: number
  name: string
  cardCount: number
  avatar: string
  isActive: boolean
  position: { top: string; left: string }
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
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null)
  const [direction, setDirection] = useState<GameDirection>("clockwise")
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("")
  const [feedback, setFeedback] = useState<{ message: string; type: "good" | "bad" | "great" | "perfect" } | null>(null)
  const [isAITurnAnimating, setIsAITurnAnimating] = useState(false)

  useEffect(() => {
    const playerNames = ["You", "Alice", "Bob", "Carol", "Dave", "Eve"]
    const engine = new GameEngine(playerNames, 0, {
      debugMode: true, // Enable debug logging
      aiDifficulty: 'hard', // Set AI difficulty
      stackDrawTwo: false, // Official rules: no stacking
      stackDrawFour: false, // Official rules: no stacking
      mustPlayIfDrawable: false, // Official rules: player chooses
      targetScore: 500,
    }, {
      // Event handlers for UI integration
      onCardPlayed: (player, card, chosenColor) => {
        console.log(`🎴 ${player.name} played ${card.color} ${card.value}${chosenColor ? ` (chose ${chosenColor})` : ''}`)
      },
      onTurnChange: (nextPlayer, direction) => {
        console.log(`🔄 Turn: ${nextPlayer.name} (${direction})`)
      },
      onRoundEnd: (winner, points, scores) => {
        console.log(`🏆 Round won by ${winner.name} with ${points} points!`)
        console.log('📊 Scores:', Object.fromEntries(scores))
      },
      onGameEnd: (winner, finalScores) => {
        console.log(`🎉 GAME OVER! ${winner.name} wins the game!`)
        console.log('🏁 Final scores:', Object.fromEntries(finalScores))
      },
      onUnoCalled: (player) => {
        console.log(`📢 ${player.name} called UNO!`)
      },
      onUnoChallenged: (challenger, target, success) => {
        console.log(`⚖️ ${challenger.name} challenged ${target.name}'s UNO call - ${success ? 'SUCCESS' : 'FAILED'}`)
      },
      onWildDrawFourChallenged: (challenger, target, success) => {
        console.log(`🎯 ${challenger.name} challenged ${target.name}'s Wild Draw Four - ${success ? 'SUCCESS' : 'FAILED'}`)
      },
      onCardDrawn: (player, card, autoPlayed) => {
        console.log(`📥 ${player.name} drew ${card.color} ${card.value}${autoPlayed ? ' (auto-played)' : ''}`)
      },
      onActionCardPlayed: (player, card, effect) => {
        console.log(`⚡ ${player.name} played ${card.color} ${card.value} - ${effect}`)
      },
    })
    setGameEngine(engine)
  }, [])

  const convertToUIFormat = () => {
    if (!gameEngine) return { players: [], currentCard: null, direction: "clockwise" as GameDirection }

    const enginePlayers = gameEngine.getPlayers()
    const topCard = gameEngine.getTopCard()

    const players: Player[] = enginePlayers.map((player, index) => ({
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
      position: getPlayerPosition(index),
      cards: index === 0 ? (player.getHand() || []).map(convertEngineCard) : [],
    }))

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
    const positions = [
      { top: "92%", left: "50%" }, // User (bottom center)
      { top: "8%", left: "50%" },  // Alice (top center)
      { top: "20%", left: "85%" }, // Bob (top right)
      { top: "50%", left: "90%" }, // Carol (right center)
      { top: "80%", left: "85%" }, // Dave (bottom right)
      { top: "50%", left: "10%" }, // Eve (left center)
    ]
    return positions[index] || { top: "50%", left: "50%" }
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

    if (
      cardToPlay.color === "wild" ||
      cardToPlay.value === "Skip" ||
      cardToPlay.value === "Draw Two" ||
      cardToPlay.value === "Reverse"
    ) {
      playSound("special")
    } else {
      playSound("play")
    }

    const moveEvaluation = evaluateMove(cardToPlay, { currentCard, direction, players })
    setFeedback(moveEvaluation)

    setTimeout(() => setFeedback(null), 3000)

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

      // Create realistic throwing animation
      const animatedCard: AnimatedCard = {
        id: Date.now() + Math.random(),
        card: cardToPlay,
        startX,
        startY,
        endX: centerRect.left + centerRect.width / 2,
        endY: centerRect.top + centerRect.height / 2,
        currentX: startX,
        currentY: startY,
        isAnimating: true,
        type: 'throw',
        rotation: Math.random() * 360 - 180, // Random rotation for realistic effect
        scale: 1.2,
        zIndex: 10000,
        trajectory: 'arc', // Use arc trajectory for throwing effect
        duration: 2000,
        delay: 0,
        startTime: Date.now(),
      }

      setAnimatedCards((prev) => [...prev, animatedCard])

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
      console.log("User card play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

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
    }, 2100) // Slightly longer than animation duration
  }

  const drawCard = () => {
    if (!gameEngine || playDelay || !players[0]?.isActive) return

    // Check if player has playable cards
    const topCard = gameEngine.getTopCard()
    if (topCard) {
      const playableCards = players[0]?.cards.filter(card => card.isPlayable) || []
      if (playableCards.length > 0) {
        console.log("Cannot draw - player has playable cards:", playableCards.length)
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

      const animatedCard: AnimatedCard = {
        id: Date.now() + Math.random(),
        card: { id: Math.random(), color: "red", value: "?", isPlayable: false },
        startX: deckRect.left + deckRect.width / 2,
        startY: deckRect.top + deckRect.height / 2,
        endX: handRect.left + handRect.width / 2,
        endY: handRect.top + handRect.height / 2,
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

      // Play card flip sound at start
      playSound("card-flip")

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    }

    // Delay game state update until animation completes
    setTimeout(() => {
      const drawnCard = gameEngine.drawCard("player_0")
      console.log("User draw result, New current player:", gameEngine.getCurrentPlayer().name)

      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      setPlayDelay(false)
    }, 1600) // Slightly longer than animation duration
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
    setTimeout(() => setFeedback(null), 3000)
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
    setTimeout(() => setFeedback(null), 3000)
  }

  useEffect(() => {
    if (!gameEngine || gameEngine.isGameOver()) return

    const currentPlayer = gameEngine.getCurrentPlayer()
    setCurrentPlayerId(currentPlayer.id)

    const isHumanTurn = currentPlayer.name === "You" || currentPlayer.id === "player_0"

    if (!isHumanTurn && !playDelay) {
      console.log("AI turn starting for:", currentPlayer.name)
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

    const aiSounds = ["play", "special"] as const
    const randomSound = aiSounds[Math.floor(Math.random() * aiSounds.length)]
    playSound(randomSound)

    // First, determine what card the AI will play (without actually playing it yet)
    const topCard = gameEngine.getTopCard()
    let cardToPlay: GameCard | null = null
    let chosenWildColor: string | undefined = undefined

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
    }

    const currentPlayerIndex = gameEngine.getPlayers().findIndex((p) => p.id === currentPlayer.id)
    const aiPlayerElement = document.querySelector(`[data-player="${currentPlayerIndex}"]`)
    const centerElement = document.querySelector("[data-center-pile]")

    if (aiPlayerElement && centerElement) {
      const aiPlayerRect = aiPlayerElement.getBoundingClientRect()
      const centerRect = centerElement.getBoundingClientRect()

      // Create AI card throwing animation with the actual card being played
      const animatedCard: AnimatedCard = {
        id: Date.now() + currentPlayerIndex,
        card: cardToPlay || { id: Math.random(), color: "red", value: 5, isPlayable: false }, // Use real card if available
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

      // Small delay to ensure animation is visible
      setTimeout(() => {
        setAnimatedCards((prev) => [...prev, animatedCard])

        // Play card flip sound at start
        playSound("card-flip")
      }, 100)

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    }

    // Don't execute AI turn yet - wait for animation to complete
    // The animation will show the card flying, then we'll execute the actual turn

    // Delay the actual AI turn execution until animation completes
    setTimeout(() => {
      const success = gameEngine.playAITurn()
      console.log("AI turn result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
      setIsAITurnAnimating(false)
    }, 3100) // Slightly longer than animation duration
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

        // Remove completed animations
        const completed = updated.filter(card => !card.isAnimating && card.type === 'land')
        if (completed.length > 0) {
          setTimeout(() => {
            setAnimatedCards(current => current.filter(card => card.isAnimating || card.type !== 'land'))
          }, 500)
        }

        return updated
      })
    }

    const intervalId = setInterval(animate, 16) // ~60fps

    return () => clearInterval(intervalId)
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
            <h2 className="text-4xl font-bold mb-4">🎉 Game Over! 🎉</h2>
            <p className="text-2xl font-semibold mb-6">{gameEngine.getRoundWinner()?.name || 'Unknown'} Wins!</p>
            <Button onClick={() => window.location.reload()} className="bg-black text-white hover:bg-gray-800">
              Play Again
            </Button>
          </Card>
        </div>
      )}

      {feedback && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none">
          <div
            className={`
            px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce text-center font-bold text-lg
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

      <div className="absolute top-4 left-4 flex items-center gap-4 z-10">
        <Badge
          variant="secondary"
          className="text-sm font-bold bg-black/50 text-white border-white/20 flex items-center gap-1"
        >
          <Trophy className="w-4 h-4" />
          {gameState.level}
        </Badge>
        <Badge variant="outline" className="text-sm bg-black/50 text-white border-white/20 flex items-center gap-1">
          <Coins className="w-4 h-4" />
          {gameState.coins}
        </Badge>

        {/* Debug Info Panel */}
        <div className="bg-black/70 text-white p-2 rounded-lg text-xs">
          <div>Draw Penalty: {gameEngine?.getDrawPenalty() || 0}</div>
          <div>Last Action: {gameEngine?.getLastActionCard()?.value || "None"}</div>
          <div>Playable Cards: {players[0]?.cards.filter(c => c.isPlayable).length || 0}</div>
          <div>Can Challenge UNO: {players.slice(1).some(p => gameEngine?.canChallengeUno(`player_${p.id}`)) ? "Yes" : "No"}</div>
        </div>
      </div>

      {players.slice(1).map((player) => (
        <div
          key={player.id}
          data-player={player.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-500"
          style={{
            top: player.position.top,
            left: player.position.left,
            transform: `translate(-50%, -50%) ${player.isActive ? "scale(1.1)" : "scale(1.0)"}`,
          }}
        >
          <div className={`flex flex-col items-center gap-2 ${player.isActive ? "animate-pulse" : ""}`}>
            {player.isActive && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
                <Card className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-2xl animate-bounce border border-white/30">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {player.name}'s Turn
                  </p>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <Clock className="w-2 h-2" />
                    {gameEngine?.getPhase() === "waiting" ? "Thinking..." : "Playing..."}
                  </p>
                </Card>
              </div>
            )}
            <div
              className={`relative transition-all duration-300 ${player.isActive ? "ring-4 ring-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 scale-110" : ""
                }`}
            >
              <Avatar
                className={`border-2 border-white/30 shadow-lg transition-all duration-300 ${player.isActive ? "w-16 h-16" : "w-14 h-14"
                  }`}
              >
                <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                  {player.name[0]}
                </AvatarFallback>
              </Avatar>
              {player.isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/40 rounded-full animate-ping shadow-lg"></div>
              )}
            </div>
            <div className="text-center">
              <p
                className={`font-semibold text-white drop-shadow-lg transition-all duration-300 ${player.isActive ? "text-sm" : "text-xs"
                  }`}
              >
                {player.name}
              </p>
              <Badge
                variant="secondary"
                className={`bg-black/50 text-white border-white/20 transition-all duration-300 ${player.isActive ? "text-sm" : "text-xs"
                  }`}
              >
                {player.cardCount} cards
              </Badge>
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

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center gap-8">
          <div className="relative" data-deck>
            <Card
              className={`w-20 h-28 bg-gradient-to-br from-red-600 to-red-800 border-2 border-white/30 shadow-2xl transform rotate-2 cursor-pointer transition-transform ${playDelay ? "opacity-50" : "hover:scale-105"
                }`}
              onClick={drawCard}
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
                <UnoCard
                  color={currentCard.color}
                  value={currentCard.value}
                  size="medium"
                  className="shadow-2xl border-white/30"
                />
              )}
              {isAnimating && (
                <div className="w-20 h-28 bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/30 shadow-2xl rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-400 text-black animate-bounce font-bold shadow-lg flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Active
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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20" data-user-hand>
        <div className="flex items-end gap-2 p-4 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
          {(players[0]?.cards || []).map((card, index) => (
            <div
              key={card.id}
              data-card-id={card.id}
              className={`transition-all duration-300 ${card.isPlayable && players[0]?.isActive && !playDelay
                ? "hover:scale-110 hover:-translate-y-2 cursor-pointer"
                : card.isPlayable
                  ? "cursor-pointer"
                  : "opacity-60"
                }`}
              style={{ transform: `rotate(${(index - 2) * 3}deg)` }}
              onClick={() => {
                console.log(
                  "Card clicked:",
                  card.id,
                  "isPlayable:",
                  card.isPlayable,
                  "isActive:",
                  players[0]?.isActive,
                  "playDelay:",
                  playDelay,
                )
                if (card.isPlayable && players[0]?.isActive && !playDelay) {
                  playCard(card)
                }
              }}
            >
              <UnoCard
                color={card.color}
                value={card.value}
                size="small"
                isPlayable={card.isPlayable && players[0]?.isActive && !playDelay}
                className="shadow-lg"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold shadow-lg flex items-center gap-1 disabled:opacity-50"
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
                      : "Draw a card"
            }
          >
            <Plus className="w-4 h-4" />
            Draw Card
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-lg flex items-center gap-1"
            onClick={callUno}
            disabled={!players[0] || players[0].cardCount !== 1}
            title={
              !players[0]
                ? "No player data"
                : players[0].cardCount !== 1
                  ? `Call UNO when you have exactly 1 card (you have ${players[0].cardCount})`
                  : "Call UNO!"
            }
          >
            <Zap className="w-4 h-4" />
            UNO!
          </Button>
        </div>

        {/* Challenge buttons for other players */}
        {players.slice(1).map((player) => {
          const canChallengeUno = gameEngine?.canChallengeUno(`player_${player.id}`)
          const canChallengeWildDrawFour = gameEngine?.canChallengeWildDrawFour(`player_${player.id}`)

          if (!canChallengeUno && !canChallengeWildDrawFour) return null

          return (
            <div key={player.id} className="flex justify-center gap-2 mt-2">
              {canChallengeUno && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-yellow-500/20 text-yellow-300 border-yellow-500 hover:bg-yellow-500/30 text-xs"
                  onClick={() => challengeUno(`player_${player.id}`)}
                  disabled={playDelay}
                >
                  Challenge UNO
                </Button>
              )}
              {canChallengeWildDrawFour && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-purple-500/20 text-purple-300 border-purple-500 hover:bg-purple-500/30 text-xs"
                  onClick={() => challengeWildDrawFour(`player_${player.id}`)}
                  disabled={playDelay}
                >
                  Challenge +4
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {players[0]?.isActive && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
          <Card className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-2xl animate-bounce border border-white/30">
            <p className="text-xs font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Your Turn
            </p>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <Clock className="w-2 h-2" />
              Your move!
            </p>
            {gameEngine?.getWildColor() && (
              <p className="text-xs mt-1 font-semibold">
                Wild:{" "}
                <span className={`text-${gameEngine.getWildColor()}-600`}>
                  {gameEngine.getWildColor()?.toUpperCase()}
                </span>
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
