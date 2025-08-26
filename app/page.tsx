"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UnoCard } from "@/components/uno-cards"
import { EnhancedDeck } from "@/components/enhanced-deck"
import { EnhancedDiscardPile } from "@/components/enhanced-discard-pile"
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
  Settings,
  Home,
} from "lucide-react"
import { UnoGame as GameEngine, type UnoCard as EngineCard, type GameDirection, type UnoColor, type UnoRules } from "@/lib/uno-engine"
import { GameLog } from "@/components/game-log"
import { MainMenu } from "@/components/main-menu"
import { ColorPicker } from "@/components/color-picker"
import { SettingsProvider, useSettings } from "@/contexts/settings-context"

interface Player {
  id: number
  name: string
  cardCount: number
  avatar: string
  isActive: boolean
  isNextPlayer: boolean
  position: { top: string; left: string; transform?: string; position?: string }
  cards: GameCard[]
  score: number
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
  type: 'throw' | 'draw' | 'deal' | 'land' | 'distribute'
  rotation: number
  scale: number
  zIndex: number
  trajectory: 'arc' | 'straight' | 'bounce'
  duration: number
  delay: number
  startTime: number
  // Enhanced physics properties
  velocity: { x: number; y: number }
  gravity: number
  bounce: number
  spin: number
  airResistance: number
  maxBounces: number
  bounceCount: number
}

function UnoGameInner() {
  const { uiSettings } = useSettings()
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [gameState, setGameState] = useState({
    level: 3,
    coins: 1250,
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [playDelay, setPlayDelay] = useState(false)
  const [animatedCards, setAnimatedCards] = useState<AnimatedCard[]>([])
  const [animationPool, setAnimationPool] = useState<AnimatedCard[]>([])
  const nextAnimationId = useRef(1)
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null)
  const [direction, setDirection] = useState<GameDirection>("clockwise")
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("")
  const [feedback, setFeedback] = useState<{ message: string; type: "good" | "bad" | "great" | "perfect" } | null>(null)
  const [isAITurnAnimating, setIsAITurnAnimating] = useState(false)
  const [isLogVisible, setIsLogVisible] = useState(false)
  const [isDiscardPileVisible, setIsDiscardPileVisible] = useState(false)
  const [showActionConfirm, setShowActionConfirm] = useState<{ card: GameCard; confirmed: () => void } | null>(null)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [pendingWildCard, setPendingWildCard] = useState<GameCard | null>(null)
  const [showMainMenu, setShowMainMenu] = useState(true)
  const [aiThinking, setAiThinking] = useState<{ playerName: string; startTime: number } | null>(null)
  const [colorConfirmation, setColorConfirmation] = useState<{ color: string; playerName: string; duration: number } | null>(null)
  const [isGamePaused, setIsGamePaused] = useState(false)
  const [drawPenalty, setDrawPenalty] = useState(0)
  const { gameSettings } = useSettings()

  // Background music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const backgroundMusicRef = useRef<HTMLAudioElement>(null)

  // Initialize background music
  useEffect(() => {
    const audio = new Audio('/heartbeat-01-brvhrtz-225058.mp3')
    audio.loop = true
    audio.volume = uiSettings.musicVolume
    audio.preload = 'auto'
    backgroundMusicRef.current = audio

    // Start playing when user interacts with the page
    const startMusic = () => {
      if (backgroundMusicRef.current && !isMusicPlaying) {
        backgroundMusicRef.current.play().then(() => {
          setIsMusicPlaying(true)
        }).catch((error) => {
          console.log('Background music autoplay prevented:', error)
        })
        // Remove event listeners after first interaction
        document.removeEventListener('click', startMusic)
        document.removeEventListener('keydown', startMusic)
        document.removeEventListener('touchstart', startMusic)
      }
    }

    // Add event listeners for user interaction
    document.addEventListener('click', startMusic)
    document.addEventListener('keydown', startMusic)
    document.addEventListener('touchstart', startMusic)

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current = null
      }
      document.removeEventListener('click', startMusic)
      document.removeEventListener('keydown', startMusic)
      document.removeEventListener('touchstart', startMusic)
    }
  }, [])

  // Update music volume when it changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = uiSettings.musicVolume
    }
  }, [uiSettings.musicVolume])

  // Handle background music setting changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (!uiSettings.backgroundMusic && isMusicPlaying) {
        backgroundMusicRef.current.pause()
        setIsMusicPlaying(false)
      } else if (uiSettings.backgroundMusic && !isMusicPlaying) {
        // Only auto-play if user has interacted with the page
        backgroundMusicRef.current.play().then(() => {
          setIsMusicPlaying(true)
        }).catch((error) => {
          console.log('Background music autoplay prevented:', error)
        })
      }
    }
  }, [uiSettings.backgroundMusic, isMusicPlaying])

  // Initialize game engine with event handlers
  const initializeGameEngine = (playerNames: string[], rules: UnoRules) => {
    const engine = new GameEngine(playerNames, 0, rules, {
      onRoundEnd: (winner, points, scores) => {
        console.log(`🏆 Round ended! ${winner.name} earned ${points} points`)
        // Update UI immediately when round ends
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(engine.getCurrentPlayer().id)
      },
      onGameEnd: (winner, finalScores) => {
        console.log(`🎉 Game ended! ${winner.name} wins with ${winner.getScore()} points`)
        // Update UI immediately when game ends
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(engine.getCurrentPlayer().id)
      }
    }, true) // Skip initial deal for animated distribution
    setGameEngine(engine)
  }

  const startGame = (rules: UnoRules, playerCount: number) => {
    // Get active AI players from settings
    const activeAIPlayers = gameSettings.aiPlayers.filter(player => player.isActive)

    // Create player names array: "You" + active AI players
    const playerNames = ["You", ...activeAIPlayers.map(player => player.name)].slice(0, playerCount)

    // If we don't have enough active AI players, fill with default names
    if (playerNames.length < playerCount) {
      const defaultNames = ["Alice", "Bob", "Carol", "Dave", "Eve"]
      for (let i = playerNames.length; i < playerCount; i++) {
        playerNames.push(defaultNames[i - 1] || `AI-${i}`)
      }
    }

    initializeGameEngine(playerNames, rules)
    setShowMainMenu(false)
  }

  const returnToMainMenu = () => {
    setGameEngine(null)
    setShowMainMenu(true)
    setPlayers([])
    setCurrentCard(null)
    setDirection("clockwise")
    setCurrentPlayerId("")
    setFeedback(null)
    setIsAITurnAnimating(false)
    setIsLogVisible(false)
    setIsDiscardPileVisible(false)
    setShowActionConfirm(null)
    setIsAnimating(false)
    setPlayDelay(false)
    setAnimatedCards([])
    setAnimationPool([])
    nextAnimationId.current = 1
  }

  // Initialize game state when engine is ready
  useEffect(() => {
    if (gameEngine) {
      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      // Update playable cards after initial state is set
      setTimeout(() => updatePlayableCards(), 0)

      // Start initial card distribution animation
      startInitialCardDistribution()
    }
  }, [gameEngine])

  // Initial card distribution animation
  const startInitialCardDistribution = () => {
    if (!gameEngine) return

    setIsDistributing(true)
    setIsAnimating(true)
    playSound("shuffle")

    // Distribute 7 cards to each player with animation
    let cardIndex = 0
    const totalCards = gameEngine.getPlayers().length * 7
    const distributionDelay = 150 // Faster than regular animations

    const distributeNextCard = () => {
      if (cardIndex >= totalCards) {
        // Distribution complete, start the game
        gameEngine.startGameAfterDistribution()
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

        // Update playable cards after initial state is set
        setTimeout(() => {
          updatePlayableCards()
          setIsAnimating(false)
          setIsDistributing(false)
        }, 500)
        return
      }

      const playerIndex = cardIndex % gameEngine.getPlayers().length
      const round = Math.floor(cardIndex / gameEngine.getPlayers().length)

      // Deal one card to the player
      const dealtCard = gameEngine.dealOneCardToPlayer(playerIndex)

      if (dealtCard) {
        // Create distribution animation
        createDistributionAnimation(dealtCard, playerIndex, round)

        // Play a subtle sound for distribution
        if (playerIndex === 0) { // Only play sound for human player to avoid too much noise
          playSound("card-flip")
        }

        // Update UI to show the new card
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
      }

      cardIndex++
      setTimeout(distributeNextCard, distributionDelay)
    }

    // Start distribution
    setTimeout(distributeNextCard, 500)
  }

  // Create distribution animation for a single card
  const createDistributionAnimation = (card: EngineCard, playerIndex: number, round: number) => {
    const deckElement = document.querySelector("[data-deck]")
    const playerElement = document.querySelector(`[data-player="${playerIndex}"]`)

    if (!deckElement || !playerElement) return

    const deckRect = deckElement.getBoundingClientRect()
    const playerRect = playerElement.getBoundingClientRect()

    // Check animation limit
    if (animatedCards.filter(card => card.isAnimating).length >= 3) {
      return
    }

    const animatedCard = getAnimationFromPool()
    animatedCard.card = {
      ...convertEngineCard(card),
      id: animatedCard.id + 1000000 + Date.now() // Use a large offset + timestamp to ensure uniqueness
    }
    animatedCard.startX = deckRect.left + deckRect.width / 2
    animatedCard.startY = deckRect.top + deckRect.height / 2
    animatedCard.endX = playerRect.left + playerRect.width / 2
    animatedCard.endY = playerRect.top + playerRect.height / 2
    animatedCard.currentX = deckRect.left + deckRect.width / 2
    animatedCard.currentY = deckRect.top + deckRect.height / 2
    animatedCard.isAnimating = true
    animatedCard.type = 'distribute'
    animatedCard.rotation = 0
    animatedCard.scale = 1
    animatedCard.zIndex = 9999
    animatedCard.trajectory = 'straight'
    animatedCard.duration = 400 // Faster than regular animations
    animatedCard.delay = round * 50 + playerIndex * 20 // Stagger based on round and player position
    animatedCard.startTime = Date.now() + animatedCard.delay
    // Enhanced physics properties for distribution animation
    animatedCard.velocity = { x: 0, y: 0 }
    animatedCard.gravity = 0
    animatedCard.bounce = 0
    animatedCard.spin = Math.random() * 4 - 2 // Subtle spin
    animatedCard.airResistance = 1
    animatedCard.maxBounces = 0
    animatedCard.bounceCount = 0

    setAnimatedCards(prev => [...prev, animatedCard])
  }



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
      } else if (key === 'm') {
        // Toggle background music
        if (backgroundMusicRef.current) {
          if (isMusicPlaying) {
            backgroundMusicRef.current.pause()
            setIsMusicPlaying(false)
          } else {
            backgroundMusicRef.current.play()
            setIsMusicPlaying(true)
          }
        }
      } else if (key === ' ' || key === 'p') {
        // Pause/Resume game (spacebar or 'p' key)
        if (gameEngine && !gameEngine.isGameOver()) {
          if (isGamePaused) {
            resumeGame()
          } else {
            pauseGame()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [players, playDelay, gameEngine, isMusicPlaying])

  // Object pooling for animations
  const getAnimationFromPool = (): AnimatedCard => {
    if (animationPool.length > 0) {
      const pooled = animationPool[0]
      setAnimationPool(prev => prev.slice(1))
      return {
        ...pooled,
        id: nextAnimationId.current++,
        isAnimating: false,
        currentX: 0,
        currentY: 0,
        startTime: 0
      }
    }

    // Create new animation object if pool is empty
    const newAnimation: AnimatedCard = {
      id: nextAnimationId.current++,
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
      startTime: 0,
      // Enhanced physics properties
      velocity: { x: 0, y: 0 },
      gravity: 0.5,
      bounce: 0.7,
      spin: 0,
      airResistance: 0.98,
      maxBounces: 2,
      bounceCount: 0
    }

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
        score: player.getScore(),
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
    const drawPenalty = gameEngine.getDrawPenalty()

    // If there's a draw penalty, no cards are playable
    if (drawPenalty > 0) {
      console.log("[DEBUG] Draw penalty active - no cards are playable")
      // Don't call setPlayers here to avoid infinite loop
      // The cards will be marked as not playable when the game state is updated
      return
    }

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

    // Check for draw penalty before attempting to play
    const drawPenalty = gameEngine.getDrawPenalty()
    if (drawPenalty > 0) {
      console.log("[DEBUG] Draw penalty active - cannot play card, must draw first")
      return
    }

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

      // Show immediate feedback for +2 cards
      if (cardToPlay.value === "Draw Two") {
        setFeedback({
          message: "⚡ Draw Two played! Next player draws 2!",
          type: "great"
        })
        setTimeout(() => setFeedback(null), 3000)
      }
    } else {
      playSound("play")
      // Add subtle particle effects for number cards
      createParticleEffect(cardToPlay, "number")
    }

    const moveEvaluation = evaluateMove(cardToPlay, { currentCard, direction, players })
    setFeedback(moveEvaluation)

    setTimeout(() => setFeedback(null), 5000)

    const userHandElement = document.querySelector("[data-user-hand]")
    const centerElement = document.querySelector("[data-center-pile]")
    const playedCardElement = document.querySelector(`[data-card-id="${cardToPlay.id}"]`)

    // Define userThrowDuration at the function level so it's available everywhere
    const baseUserThrowDuration = Math.random() * 300 + 700 // 700ms to 1000ms for user throws - reduced from 1000-1400ms
    const userThrowDuration = baseUserThrowDuration / uiSettings.animationSpeed

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
        // Still use the randomized timing even when skipping animation
        const userGameUpdateDelay = userThrowDuration + Math.random() * 200 + 200
        setTimeout(() => {
          const success = gameEngine.playCard("player_0", cardToPlay.id.toString())
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
        }, userGameUpdateDelay)
        return
      } else {
        // Create enhanced physics-based throwing animation using object pooling
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
        animatedCard.duration = userThrowDuration
        animatedCard.delay = animatedCards.filter(card => card.isAnimating).length * 150 // Stagger delay of 150ms
        animatedCard.startTime = Date.now() + animatedCard.delay
        // Enhanced physics properties for user throw
        animatedCard.velocity = { x: 0, y: 0 }
        animatedCard.gravity = 0.5
        animatedCard.bounce = 0.7
        animatedCard.spin = (Math.random() - 0.5) * 5 // Reduced from 20 to 5 for more subtle rotation
        animatedCard.airResistance = 0.98
        animatedCard.maxBounces = 2
        animatedCard.bounceCount = 0

        setAnimatedCards((prev) => [...prev, animatedCard])
      }

      // Play card flip sound at start
      playSound("card-flip")

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    }

    // Handle Wild card color selection
    if (cardToPlay.color === "wild") {
      setPendingWildCard(cardToPlay)
      setShowColorPicker(true)
      setIsAnimating(false)
      setPlayDelay(false)
      return
    }

    // --- CORE CHANGE: IMMEDIATE STATE UPDATE ---
    console.log("[DEBUG] User card play attempt:")
    console.log("  - Card:", cardToPlay.color, cardToPlay.value)
    console.log("  - Top card:", currentCard ? `${currentCard.color} ${currentCard.value}` : 'None')
    console.log("  - Wild color:", gameEngine.getWildColor())

    const success = gameEngine.playCard("player_0", cardToPlay.id.toString())
    console.log("[v0] User card play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

    if (!success) {
      console.log("[ERROR] User card play failed!")
      // Don't proceed with turn change if play failed
      setIsAnimating(false)
      setPlayDelay(false)
      return
    }

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

    // Reset delay after a short duration to allow animations to feel natural
    setTimeout(() => {
      setIsAnimating(false)
      setPlayDelay(false)
    }, 500); // A small delay is fine here
  }

  // Add action card particle effect function
  const createActionCardParticleEffect = (playerRect: DOMRect, penaltyCount: number, cardType: string) => {
    // Limit particle effects to prevent performance issues
    const existingParticles = document.querySelectorAll('.animate-particle-sparkle')
    if (existingParticles.length > 10) {
      console.log("Too many particles, skipping action card particle effect")
      return
    }

    const centerX = playerRect.left + playerRect.width / 2
    const centerY = playerRect.top + playerRect.height / 2

    // Create action card-specific particle elements
    const particleCount = penaltyCount * 1.5 // Fewer particles for action card effects
    const colors = cardType === 'Draw Two'
      ? ["#ff6b6b", "#ff8e8e", "#ffb3b3", "#ffd6d6", "#ff4444"] // Red tones for +2
      : ["#ff6b6b", "#ff8e8e", "#ffb3b3", "#ffd6d6", "#ff0000", "#cc0000", "#990000"] // More intense red for +4

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "fixed pointer-events-none rounded-full animate-particle-sparkle"
      particle.style.cssText = `
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        z-index: 10003;
        --sparkle-x: ${(Math.random() - 0.5) * 120}px;
        --sparkle-y: ${(Math.random() - 0.5) * 120}px;
        --sparkle-x2: ${(Math.random() - 0.5) * 240}px;
        --sparkle-y2: ${(Math.random() - 0.5) * 240}px;
      `
      document.body.appendChild(particle)

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 1200)
    }
  }

  // Add penalty particle effect function
  const createPenaltyParticleEffect = (playerRect: DOMRect, penaltyCount: number) => {
    // Limit particle effects to prevent performance issues
    const existingParticles = document.querySelectorAll('.animate-particle-sparkle')
    if (existingParticles.length > 10) {
      console.log("Too many particles, skipping penalty particle effect")
      return
    }

    const centerX = playerRect.left + playerRect.width / 2
    const centerY = playerRect.top + playerRect.height / 2

    // Create penalty-specific particle elements
    const particleCount = penaltyCount * 2 // More particles for penalty effects
    const colors = penaltyCount === 2
      ? ["#ff6b6b", "#ff8e8e", "#ffb3b3", "#ffd6d6"] // Red tones for +2
      : ["#ff6b6b", "#ff8e8e", "#ffb3b3", "#ffd6d6", "#ff0000", "#cc0000"] // More intense red for +4

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "fixed pointer-events-none rounded-full animate-particle-sparkle"
      particle.style.cssText = `
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${Math.random() * 10 + 6}px;
        height: ${Math.random() * 10 + 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        z-index: 10002;
        --sparkle-x: ${(Math.random() - 0.5) * 150}px;
        --sparkle-y: ${(Math.random() - 0.5) * 150}px;
        --sparkle-x2: ${(Math.random() - 0.5) * 300}px;
        --sparkle-y2: ${(Math.random() - 0.5) * 300}px;
      `
      document.body.appendChild(particle)

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 1500)
    }
  }

  // Add particle effect function
  const createParticleEffect = (card: GameCard, type: "wild" | "action" | "number") => {
    // Check if visual effects are enabled
    if (!uiSettings.visualEffects) {
      return
    }

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

    // Check for draw penalty first - if there's a penalty, allow drawing regardless of playable cards
    const penalty = gameEngine.getDrawPenalty()
    console.log(`[DEBUG] Human draw penalty check - Penalty: ${penalty}`)

    if (penalty > 0) {
      console.log(`[PENALTY] Human player must draw ${penalty} cards as penalty`)
      setPlayDelay(true) // Prevent multiple clicks during penalty

      // Draw penalty cards immediately without animation
      if (gameEngine) {
        for (let i = 0; i < penalty; i++) {
          const drawnCard = gameEngine.drawCard("player_0")
          console.log(`[PENALTY] Drew penalty card ${i + 1}/${penalty}:`, drawnCard)
        }

        // Update game state
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

        // Show penalty feedback
        setFeedback({
          message: penalty === 2 ? "😱 Draw Two penalty! You drew 2 cards!" : "💀 Wild Draw Four penalty! You drew 4 cards!",
          type: "bad"
        })
        setTimeout(() => setFeedback(null), 3000)

        // Reset play delay
        setPlayDelay(false)
      }
      return // Exit early - penalty drawing is handled separately
    }

    // Only check for playable cards if there's no penalty
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

    // Define userDrawDuration at the function level so it's available everywhere
    const baseUserDrawDuration = Math.random() * 200 + 600 // 600ms to 800ms for user draws - reduced from 1000-1300ms
    const userDrawDuration = baseUserDrawDuration / uiSettings.animationSpeed

    // This part handles the animation for the *single* card the player is choosing to draw for their turn
    if (deckElement && userHandElement) { // Only animate the single draw if there is NO penalty
      const deckRect = deckElement.getBoundingClientRect()
      const handRect = userHandElement.getBoundingClientRect()

      // Check if we can add more animations (limit to 3 concurrent)
      if (animatedCards.filter(card => card.isAnimating).length >= 3) {
        // Skip animation if too many are running
        console.log("Animation limit reached, skipping draw animation")
        // Still use the randomized timing even when skipping animation
        const userDrawUpdateDelay = userDrawDuration + Math.random() * 200 + 200
        setTimeout(() => {
          const drawnCard = gameEngine.drawCard("player_0")
          console.log("[v0] User draw result, New current player:", gameEngine.getCurrentPlayer().name)

          // Enhanced draw card feedback
          if (drawnCard) {
            const drawMessages = [
              "🎴 Card drawn! Let's see what you got!",
              "📚 New card in hand! Time to strategize!",
              "🃏 Fresh card! Make it count!",
              "✨ New addition to your arsenal!",
              "🎯 Card acquired! Plan your next move!"
            ]
            setFeedback({
              message: drawMessages[Math.floor(Math.random() * drawMessages.length)],
              type: "good"
            })
            setTimeout(() => setFeedback(null), 5000)
          }

          const gameData = convertToUIFormat()
          setPlayers(gameData.players)
          setCurrentCard(gameData.currentCard)
          setDirection(gameData.direction)
          setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

          setPlayDelay(false)
        }, userDrawUpdateDelay)
        return
      } else {
        // Create drawing animation using object pooling with randomized duration
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
        animatedCard.duration = userDrawDuration
        animatedCard.delay = animatedCards.filter(card => card.isAnimating).length * 150 // Stagger delay of 150ms
        animatedCard.startTime = Date.now() + animatedCard.delay
        // Enhanced physics properties for draw animation
        animatedCard.velocity = { x: 0, y: 0 }
        animatedCard.gravity = 0.3
        animatedCard.bounce = 0.5
        animatedCard.spin = Math.random() * 10 - 5
        animatedCard.airResistance = 0.99
        animatedCard.maxBounces = 1
        animatedCard.bounceCount = 0

        setAnimatedCards((prev) => [...prev, animatedCard])
      }

      // Play card flip sound at start
      playSound("card-flip")

      // Animation will be handled by the useEffect animation frame
      // Cards will be removed automatically when animation completes
    } else {
      // If there's a penalty, we've already triggered the penalty animation,
      // so we can skip the single-card draw animation to avoid visual clutter.
      console.log("Skipping single draw animation due to active penalty.")
    }

    // Delay game state update until animation completes with randomized timing
    // The delay should be long enough for the penalty animation to at least start
    const userDrawUpdateDelay = (penalty > 0 ? 800 : userDrawDuration) + Math.random() * 200 + 200
    setTimeout(() => {
      const drawnCard = gameEngine.drawCard("player_0")
      console.log("[v0] User draw result, New current player:", gameEngine.getCurrentPlayer().name)

      // Enhanced draw card feedback
      if (drawnCard) {
        const drawMessages = [
          "🎴 Card drawn! Let's see what you got!",
          "📚 New card in hand! Time to strategize!",
          "🃏 Fresh card! Make it count!",
          "✨ New addition to your arsenal!",
          "🎯 Card acquired! Plan your next move!"
        ]
        setFeedback({
          message: drawMessages[Math.floor(Math.random() * drawMessages.length)],
          type: "good"
        })
        setTimeout(() => setFeedback(null), 5000)
      }

      const gameData = convertToUIFormat()
      setPlayers(gameData.players)
      setCurrentCard(gameData.currentCard)
      setDirection(gameData.direction)
      setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

      setPlayDelay(false)
    }, userDrawUpdateDelay)
  }

  const callUno = () => {
    if (!gameEngine || players[0]?.cardCount !== 1) return
    playSound("uno")
    gameEngine.callUno("player_0")

    // Enhanced UNO call feedback
    const unoMessages = [
      "🎉 UNO! You're almost there!",
      "🔥 UNO! The heat is on!",
      "⚡ UNO! Lightning fast!",
      "🌟 UNO! You're shining bright!",
      "💪 UNO! Show them your power!"
    ]
    setFeedback({
      message: unoMessages[Math.floor(Math.random() * unoMessages.length)],
      type: "perfect"
    })
    setTimeout(() => setFeedback(null), 5000)
  }

  const handleColorSelect = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!gameEngine || !pendingWildCard) return

    console.log("[DEBUG] Color selected:", color)
    console.log("  - Pending card:", pendingWildCard.color, pendingWildCard.value)

    // Check for draw penalty before attempting to play
    const drawPenalty = gameEngine.getDrawPenalty()
    console.log("[DEBUG] Current draw penalty:", drawPenalty)

    // If there's a draw penalty, force the player to draw instead of playing
    if (drawPenalty > 0) {
      console.log("[DEBUG] Draw penalty active - forcing draw instead of Wild card play")
      setShowColorPicker(false)
      setPendingWildCard(null)
      setIsAnimating(false)
      setPlayDelay(false)

      // Force the draw action
      drawCard()
      return
    }

    // Play color selection sound
    playSound("special")

    // Add color-specific feedback
    const colorEmojis = { red: '🔥', blue: '💙', green: '🌿', yellow: '⭐' }
    const colorMessages = {
      red: "🔥 RED POWER ACTIVATED! 🔥",
      blue: "💙 BLUE FORCE ENGAGED! 💙",
      green: "🌿 GREEN ENERGY FLOWING! 🌿",
      yellow: "⭐ YELLOW LIGHTNING STRIKE! ⭐"
    }

    // Show prominent color confirmation overlay
    setColorConfirmation({
      color,
      playerName: "You",
      duration: 500
    })

    setFeedback({
      message: colorMessages[color],
      type: "perfect"
    })

    // Show immediate feedback for Wild Draw Four cards
    if (pendingWildCard.value === "Wild Draw Four") {
      setTimeout(() => {
        setFeedback({
          message: "💀 Wild Draw Four played! Next player draws 4!",
          type: "bad"
        })
        setTimeout(() => setFeedback(null), 3000)
      }, 600) // Delay to show after color confirmation
    }

    // Play the Wild card with the chosen color
    const success = gameEngine.playCard("player_0", pendingWildCard.id.toString(), color)
    console.log("[v0] Wild card play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

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

      // Auto UNO call if enabled and player has one card left
      if (uiSettings.autoUnoCall && players[0]?.cardCount === 1) {
        setTimeout(() => {
          callUno()
        }, 500) // Small delay to let the card play animation complete
      }
    }

    // Close color picker and reset state
    setShowColorPicker(false)
    setPendingWildCard(null)
    setIsAnimating(false)
    setPlayDelay(false)

    // Clear feedback and color confirmation after a delay
    setTimeout(() => {
      setFeedback(null)
      setColorConfirmation(null)
    }, 500)
  }

  const handleColorPickerClose = () => {
    setShowColorPicker(false)
    setPendingWildCard(null)
    setIsAnimating(false)
    setPlayDelay(false)
  }

  const challengeUno = (targetPlayerId: string) => {
    if (!gameEngine) return

    console.log(`[DEBUG] UNO challenge attempt - Target: ${targetPlayerId}`)

    const success = gameEngine.challengeFalseUno("player_0", targetPlayerId)

    if (success) {
      playSound("special")
      setFeedback({ message: "🎯 UNO Challenge Successful! Target player draws 2 cards!", type: "great" })
    } else {
      setFeedback({ message: "❌ UNO Challenge Failed!", type: "bad" })
    }

    // Update game state after challenge
    const gameData = convertToUIFormat()
    setPlayers(gameData.players)
    setCurrentCard(gameData.currentCard)
    setDirection(gameData.direction)
    setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

    setTimeout(() => setFeedback(null), 5000)
  }

  const challengeWildDrawFour = (targetPlayerId: string) => {
    if (!gameEngine) return

    console.log(`[DEBUG] Wild Draw Four challenge attempt - Challenger: player_0, Target: ${targetPlayerId}`)

    const success = gameEngine.challengeWildDrawFour("player_0", targetPlayerId)

    if (success) {
      playSound("special")
      setFeedback({ message: "🎯 Wild Draw Four Challenge Successful! Target player draws 4 cards!", type: "great" })
    } else {
      playSound("draw")
      setFeedback({ message: "❌ Wild Draw Four Challenge Failed! You draw 6 cards as penalty!", type: "bad" })
    }

    // Update game state after challenge
    const gameData = convertToUIFormat()
    setPlayers(gameData.players)
    setCurrentCard(gameData.currentCard)
    setDirection(gameData.direction)
    setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

    setTimeout(() => setFeedback(null), 5000)
  }

  // AI Challenge Logic
  const handleAIChallenges = (currentPlayer: any): boolean => {
    if (!gameEngine) return false

    console.log(`[DEBUG] Checking AI challenges for ${currentPlayer.name}`)

    // Check if AI can challenge any Wild Draw Four plays
    const allPlayers = gameEngine.getPlayers()
    let madeChallenge = false

    for (const player of allPlayers) {
      if (player.id === currentPlayer.id) continue // Skip self

      const canChallenge = gameEngine.canChallengeWildDrawFour(player.id)
      if (canChallenge) {
        console.log(`[DEBUG] ${currentPlayer.name} can challenge ${player.name}'s Wild Draw Four`)

        // AI challenge strategy: 70% chance to challenge if they suspect the player had matching cards
        // This is a simple heuristic - in a real implementation, you'd want more sophisticated logic
        const shouldChallenge = Math.random() < 0.7

        if (shouldChallenge) {
          console.log(`[DEBUG] ${currentPlayer.name} decides to challenge ${player.name}`)

          const success = gameEngine.challengeWildDrawFour(currentPlayer.id, player.id)

          if (success) {
            console.log(`[DEBUG] ${currentPlayer.name}'s challenge SUCCEEDED - ${player.name} draws 4 cards`)
            playSound("special")
            setFeedback({
              message: `🎯 ${currentPlayer.name} successfully challenged ${player.name}! +4 cards penalty!`,
              type: "great"
            })
          } else {
            console.log(`[DEBUG] ${currentPlayer.name}'s challenge FAILED - ${currentPlayer.name} draws 6 cards`)
            playSound("draw")
            setFeedback({
              message: `❌ ${currentPlayer.name}'s challenge failed! They draw 6 cards!`,
              type: "bad"
            })
          }

          setTimeout(() => setFeedback(null), 5000)
          madeChallenge = true
          break // Only make one challenge per turn
        } else {
          console.log(`[DEBUG] ${currentPlayer.name} decides NOT to challenge ${player.name}`)
        }
      }
    }

    return madeChallenge
  }

  useEffect(() => {
    if (!gameEngine || gameEngine.isGameOver() || isGamePaused) return

    const currentPlayer = gameEngine.getCurrentPlayer()
    console.log("[DEBUG] Turn detection - Current player:", currentPlayer.name, "ID:", currentPlayer.id)
    console.log("[DEBUG] Turn detection - playDelay:", playDelay, "isAITurnAnimating:", isAITurnAnimating, "isPaused:", isGamePaused)

    setCurrentPlayerId(currentPlayer.id)

    const isHumanTurn = currentPlayer.name === "You" || currentPlayer.id === "player_0"
    console.log("[DEBUG] Turn detection - isHumanTurn:", isHumanTurn)

    if (!isHumanTurn && !playDelay && !isAITurnAnimating) {
      console.log("[v0] AI turn starting for:", currentPlayer.name)
      setAiThinking({ playerName: currentPlayer.name, startTime: Date.now() })
      const timer = setTimeout(() => {
        playAITurn()
      }, 500) // Reduced from 3500ms to 500ms for faster response

      return () => clearTimeout(timer)
    } else if (!isHumanTurn && !playDelay && isAITurnAnimating) {
      console.log("[DEBUG] AI turn blocked - already animating for:", currentPlayer.name)
    } else if (!isHumanTurn && playDelay) {
      console.log("[DEBUG] AI turn blocked - play delay active")
    } else if (isGamePaused) {
      console.log("[DEBUG] AI turn blocked - game is paused")
    }
  }, [currentPlayerId, playDelay, gameEngine, isAITurnAnimating, isGamePaused])

  // Track draw penalty state
  useEffect(() => {
    if (gameEngine) {
      const penalty = gameEngine.getDrawPenalty()
      setDrawPenalty(penalty)

      if (penalty > 0) {
        console.log("[DEBUG] Draw penalty detected:", penalty)
        // Don't call updatePlayableCards here to avoid infinite loop
        // The playable cards will be updated when the game state changes
      }
    }
  }, [gameEngine, currentPlayerId])

  // Pause and resume functions
  const pauseGame = () => {
    if (gameEngine && !gameEngine.isGameOver()) {
      gameEngine.pause()
      setIsGamePaused(true)
      console.log("Game paused")
    }
  }

  const resumeGame = () => {
    if (gameEngine && gameEngine.isGamePaused()) {
      gameEngine.resume()
      setIsGamePaused(false)
      console.log("Game resumed")
    }
  }

  // Handle pause state changes
  useEffect(() => {
    if (gameEngine) {
      setIsGamePaused(gameEngine.isGamePaused())
    }
  }, [gameEngine])

  const playAITurn = () => {
    if (!gameEngine || isAITurnAnimating || isGamePaused) return

    const currentPlayer = gameEngine.getCurrentPlayer()
    console.log("Playing AI turn for:", currentPlayer.name)
    console.log("Game state before AI turn:", {
      currentPlayer: currentPlayer.name,
      isHuman: currentPlayer.isHuman,
      handSize: currentPlayer.getHandSize(),
      gamePhase: gameEngine.getPhase(),
      isGameOver: gameEngine.isGameOver(),
      drawPenalty: gameEngine.getDrawPenalty()
    })

    setIsAITurnAnimating(true)

    // ADD THIS SECTION: Check for and animate penalty before the AI acts
    const penalty = gameEngine.getDrawPenalty()
    const currentPlayerIndex = gameEngine.getPlayers().findIndex((p) => p.id === currentPlayer.id)

    console.log(`[DEBUG] AI turn penalty check - Player: ${currentPlayer.name}, Penalty: ${penalty}, PlayerIndex: ${currentPlayerIndex}`)

    if (penalty > 0 && currentPlayerIndex !== -1) {
      console.log(`[ANIMATION] Triggering penalty animation for ${currentPlayer.name} (${penalty} cards)`)
      createPenaltyDrawingAnimation(currentPlayerIndex.toString(), penalty)
    } else if (penalty > 0) {
      console.log(`[DEBUG] Penalty exists (${penalty}) but player index not found (${currentPlayerIndex})`)
    } else {
      console.log(`[DEBUG] No penalty found for ${currentPlayer.name}`)
    }
    // END of new section

    // Reduced AI thinking time (100 to 500ms) - much faster response
    const baseThinkingTime = Math.random() * 400 + 100
    const thinkingTime = baseThinkingTime / uiSettings.gameSpeed
    console.log(`AI ${currentPlayer.name} thinking for ${thinkingTime.toFixed(0)}ms`)

    // Execute AI turn after thinking time
    setTimeout(() => {
      try {
        console.log("[DEBUG] AI turn execution starting for:", currentPlayer.name)

        // First, check if AI should challenge any Wild Draw Four plays
        const shouldChallenge = handleAIChallenges(currentPlayer)

        if (shouldChallenge) {
          // AI made a challenge, update game state and continue
          const gameData = convertToUIFormat()
          setPlayers(gameData.players)
          setCurrentCard(gameData.currentCard)
          setDirection(gameData.direction)
          setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

          setIsAITurnAnimating(false)
          setAiThinking(null)
          return
        }

        // Then, determine what the AI will do using the game engine's authoritative logic
        const topCard = gameEngine.getTopCard()
        let cardToPlay: GameCard | null = null
        let chosenWildColor: string | undefined = undefined
        let shouldDraw = false

        if (topCard) {
          // Use the game engine's getPlayableCards method as the single source of truth
          const playableCards = currentPlayer.getPlayableCards(topCard, gameEngine.getWildColor() || undefined)

          console.log("[DEBUG] AI playable cards check:")
          console.log("  - Top card:", topCard.color, topCard.value)
          console.log("  - Wild color:", gameEngine.getWildColor())
          console.log("  - AI hand:", currentPlayer.getHand().map(c => `${c.color} ${c.value}`))
          console.log("  - Playable cards:", playableCards.map(c => `${c.color} ${c.value}`))

          if (playableCards.length > 0) {
            // AI has playable cards - choose one using strategy
            const chosenCard = playableCards[0] // Simple strategy: play first playable card

            cardToPlay = {
              id: Number.parseInt(chosenCard.id),
              color: chosenCard.color,
              value: chosenCard.value,
              isPlayable: false
            }

            if (chosenCard.isWildCard()) {
              // AI chooses color based on most cards in hand
              const aiHand = currentPlayer.getHand()
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

              // Show AI color selection confirmation
              setColorConfirmation({
                color: maxColor as 'red' | 'blue' | 'green' | 'yellow',
                playerName: currentPlayer.name,
                duration: 500
              })

              // Clear AI color confirmation after delay
              setTimeout(() => {
                setColorConfirmation(null)
              }, 500)
            }
          } else {
            // No playable cards - AI should draw
            shouldDraw = true
          }
        }

        const currentPlayerIndex = gameEngine.getPlayers().findIndex((p) => p.id === currentPlayer.id)
        const aiPlayerElement = document.querySelector(`[data-player="${currentPlayerIndex}"]`)
        const centerElement = document.querySelector("[data-center-pile]")
        const deckElement = document.querySelector("[data-deck]")

        // Randomize animation durations for more natural feel
        const getRandomAnimationDuration = (baseDuration: number, variance: number = 0.3) => {
          const minDuration = baseDuration * (1 - variance)
          const maxDuration = baseDuration * (1 + variance)
          const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration
          // Apply animation speed setting
          return randomDuration / uiSettings.animationSpeed
        }

        if (aiPlayerElement && centerElement) {
          if (shouldDraw && deckElement) {
            // AI needs to draw a card
            console.log("AI drawing card")
            playSound("draw")

            const aiPlayerRect = aiPlayerElement.getBoundingClientRect()
            const deckRect = deckElement.getBoundingClientRect()

            // Reduced drawing animation duration (200-400ms)
            const drawDuration = getRandomAnimationDuration(300, 0.3)
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
              duration: drawDuration,
              delay: 0,
              startTime: Date.now(),
              // Enhanced physics properties for AI draw
              velocity: { x: 0, y: 0 },
              gravity: 0.2,
              bounce: 0.4,
              spin: Math.random() * 8 - 4,
              airResistance: 0.99,
              maxBounces: 1,
              bounceCount: 0
            }

            setAnimatedCards((prev) => [...prev, animatedCard])
            playSound("card-flip")

            // Reduced draw delay (50-150ms)
            const drawDelay = drawDuration + Math.random() * 100 + 50
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
              setAiThinking(null)
            }, drawDelay)
          } else if (cardToPlay) {
            // AI will play a card
            console.log("AI playing card:", cardToPlay)
            const aiSounds = ["play", "special"] as const
            const randomSound = aiSounds[Math.floor(Math.random() * aiSounds.length)]
            playSound(randomSound)

            // Show immediate feedback for +2 and +4 cards played by AI
            if (cardToPlay.value === "Draw Two") {
              setFeedback({
                message: `⚡ ${currentPlayer.name} played Draw Two! You must draw 2!`,
                type: "great"
              })
              setTimeout(() => setFeedback(null), 3000)
            } else if (cardToPlay.value === "Wild Draw Four") {
              setFeedback({
                message: `💀 ${currentPlayer.name} played Wild Draw Four! You must draw 4!`,
                type: "bad"
              })
              setTimeout(() => setFeedback(null), 3000)
            }

            const aiPlayerRect = aiPlayerElement.getBoundingClientRect()
            const centerRect = centerElement.getBoundingClientRect()

            // Reduced card throwing animation duration (400-800ms)
            const throwDuration = getRandomAnimationDuration(600, 0.3)
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
              duration: throwDuration,
              delay: 0,
              startTime: Date.now(),
              // Enhanced physics properties for AI throw
              velocity: { x: 0, y: 0 },
              gravity: 0.6,
              bounce: 0.8,
              spin: (Math.random() - 0.5) * 8, // Reduced from 30 to 8 for more subtle rotation
              airResistance: 0.97,
              maxBounces: 3,
              bounceCount: 0
            }

            setAnimatedCards((prev) => [...prev, animatedCard])
            playSound("card-flip")

            // Reduced throw delay (100-200ms)
            const throwDelay = throwDuration + Math.random() * 100 + 100
            setTimeout(() => {
              // For AI playing, we need to call playCard directly with the chosen card

              // Add debugging for Wild Draw Four plays
              if (cardToPlay.color === 'wild' && cardToPlay.value === 'Wild Draw Four') {
                console.log("[DEBUG] Wild Draw Four play attempt (animation path):")
                console.log("  - Card:", cardToPlay.color, cardToPlay.value)
                console.log("  - Player hand:", currentPlayer.getHand().map(c => `${c.color} ${c.value}`))
                console.log("  - Top card:", gameEngine.getTopCard() ? `${gameEngine.getTopCard()!.color} ${gameEngine.getTopCard()!.value}` : 'None')
                console.log("  - Wild color:", gameEngine.getWildColor())

                // Check if player has matching color cards
                const topCard = gameEngine.getTopCard()
                if (topCard) {
                  const hasMatchingColor = currentPlayer.getHand().some(c =>
                    c.color === topCard.color && c.id !== cardToPlay.id.toString()
                  )
                  console.log("  - Has matching color cards:", hasMatchingColor)
                }
              }

              const success = gameEngine.playCard(currentPlayer.id, cardToPlay.id.toString(), chosenWildColor as UnoColor | undefined)
              console.log("AI play result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

              // Check if penalty was set by this play
              const penaltyAfterPlay = gameEngine.getDrawPenalty()
              console.log(`[DEBUG] Penalty after AI play: ${penaltyAfterPlay}`)

              // Additional debugging for Wild Draw Four
              if (cardToPlay.value === 'Wild Draw Four') {
                console.log(`[DEBUG] Wild Draw Four played by ${currentPlayer.name}`)
                console.log(`[DEBUG] Penalty before play: ${gameEngine.getDrawPenalty()}`)
                console.log(`[DEBUG] Penalty after play: ${penaltyAfterPlay}`)
                console.log(`[DEBUG] Next player: ${gameEngine.getCurrentPlayer().name}`)
              }

              if (!success) {
                console.log("[ERROR] AI action failed - this might cause infinite loop!")
                // Force AI to draw a card if play fails to prevent infinite loop
                console.log("[FIX] Forcing AI to draw a card to prevent infinite loop")
                const drawSuccess = gameEngine.drawCard(currentPlayer.id)
                console.log("Forced draw result:", drawSuccess ? "success" : "failed")
              }

              const gameData = convertToUIFormat()
              setPlayers(gameData.players)
              setCurrentCard(gameData.currentCard)
              setDirection(gameData.direction)
              setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

              setIsAITurnAnimating(false)
              setAiThinking(null)
            }, throwDelay)
          } else {
            // Fallback: just execute AI turn without animation
            console.log("AI turn fallback - no animation")

            // Use synchronous AI decision instead of async playAITurn
            const decision = gameEngine.decideAITurn()
            console.log("AI decision:", decision)
            if (decision) {
              // Add detailed debugging for Wild Draw Four plays
              if (decision.action === 'play' && decision.cardId) {
                const card = currentPlayer.getHand().find(c => c.id === decision.cardId)
                if (card && card.value === 'Wild Draw Four') {
                  console.log("[DEBUG] Wild Draw Four play attempt:")
                  console.log("  - Card:", card.color, card.value)
                  console.log("  - Player hand:", currentPlayer.getHand().map(c => `${c.color} ${c.value}`))
                  console.log("  - Top card:", gameEngine.getTopCard() ? `${gameEngine.getTopCard()!.color} ${gameEngine.getTopCard()!.value}` : 'None')
                  console.log("  - Wild color:", gameEngine.getWildColor())

                  // Check if player has matching color cards
                  const topCard = gameEngine.getTopCard()
                  if (topCard) {
                    const hasMatchingColor = currentPlayer.getHand().some(c =>
                      c.color === topCard.color && c.id !== decision.cardId
                    )
                    console.log("  - Has matching color cards:", hasMatchingColor)
                  }
                }
              }

              const success = gameEngine.applyAIAction(decision)
              console.log("AI turn result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

              if (!success) {
                console.log("[ERROR] AI action failed - this might cause infinite loop!")
                // Force AI to draw a card if play fails to prevent infinite loop
                console.log("[FIX] Forcing AI to draw a card to prevent infinite loop")
                const drawSuccess = gameEngine.drawCard(currentPlayer.id)
                console.log("Forced draw result:", drawSuccess ? "success" : "failed")
              }
            } else {
              console.log("AI could not decide on action")
              // CRITICAL FIX: Force AI to draw a card when it can't decide to prevent infinite loop
              console.log("[FIX] Forcing AI to draw a card to prevent infinite loop")
              const drawSuccess = gameEngine.drawCard(currentPlayer.id)
              console.log("Forced draw result:", drawSuccess ? "success" : "failed")
            }

            const gameData = convertToUIFormat()
            setPlayers(gameData.players)
            setCurrentCard(gameData.currentCard)
            setDirection(gameData.direction)
            setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

            setIsAITurnAnimating(false)
            setAiThinking(null)
          }
        } else {
          // Fallback: just execute AI turn without animation
          console.log("AI turn fallback - no DOM elements")

          // Use synchronous AI decision instead of async playAITurn
          const decision = gameEngine.decideAITurn()
          console.log("AI decision:", decision)
          console.log("[DEBUG] AI decision context - Top card:", gameEngine.getTopCard()?.color, gameEngine.getTopCard()?.value)
          console.log("[DEBUG] AI decision context - Current player:", currentPlayer.name, "hand size:", currentPlayer.getHandSize())
          if (decision) {
            // Add detailed debugging for Wild Draw Four plays
            if (decision.action === 'play' && decision.cardId) {
              const card = currentPlayer.getHand().find(c => c.id === decision.cardId)
              if (card && card.value === 'Wild Draw Four') {
                console.log("[DEBUG] Wild Draw Four play attempt:")
                console.log("  - Card:", card.color, card.value)
                console.log("  - Player hand:", currentPlayer.getHand().map(c => `${c.color} ${c.value}`))
                console.log("  - Top card:", gameEngine.getTopCard() ? `${gameEngine.getTopCard()!.color} ${gameEngine.getTopCard()!.value}` : 'None')
                console.log("  - Wild color:", gameEngine.getWildColor())

                // Check if player has matching color cards
                const topCard = gameEngine.getTopCard()
                if (topCard) {
                  const hasMatchingColor = currentPlayer.getHand().some(c =>
                    c.color === topCard.color && c.id !== decision.cardId
                  )
                  console.log("  - Has matching color cards:", hasMatchingColor)
                }
              }
            }

            const success = gameEngine.applyAIAction(decision)
            console.log("AI turn result:", success, "New current player:", gameEngine.getCurrentPlayer().name)

            if (!success) {
              console.log("[ERROR] AI action failed - this might cause infinite loop!")
              // Force AI to draw a card if play fails to prevent infinite loop
              console.log("[FIX] Forcing AI to draw a card to prevent infinite loop")
              const drawSuccess = gameEngine.drawCard(currentPlayer.id)
              console.log("Forced draw result:", drawSuccess ? "success" : "failed")
            }
          } else {
            console.log("AI could not decide on action")
            // CRITICAL FIX: Force AI to draw a card when it can't decide to prevent infinite loop
            console.log("[FIX] Forcing AI to draw a card to prevent infinite loop")
            const drawSuccess = gameEngine.drawCard(currentPlayer.id)
            console.log("Forced draw result:", drawSuccess ? "success" : "failed")
          }

          const gameData = convertToUIFormat()
          setPlayers(gameData.players)
          setCurrentCard(gameData.currentCard)
          setDirection(gameData.direction)
          setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

          setIsAITurnAnimating(false)
          setAiThinking(null)
        }
      } catch (error) {
        console.error("[ERROR] AI turn execution failed:", error)
        setIsAITurnAnimating(false)
        setAiThinking(null)
      }
    }, thinkingTime) // Close the setTimeout with thinking time
  }

  const canPlayCard = (card: GameCard, topCard: GameCard): boolean => {
    // Use the game engine's authoritative logic instead of duplicating it
    if (!gameEngine) return false

    // Check for draw penalty first - no cards can be played if there's a penalty
    const drawPenalty = gameEngine.getDrawPenalty()
    if (drawPenalty > 0) {
      return false
    }

    // Get the current player to use their getPlayableCards method
    const currentPlayer = gameEngine.getCurrentPlayer()
    const engineTopCard = gameEngine.getTopCard()

    if (!engineTopCard) return false

    // Check if this card is in the player's playable cards
    const playableCards = currentPlayer.getPlayableCards(engineTopCard, gameEngine.getWildColor() || undefined)
    return playableCards.some(playableCard => playableCard.id === card.id.toString())
  }

  const playSound = (type: "play" | "draw" | "win" | "uno" | "special" | "shuffle" | "card-flip" | "card-land") => {
    // Check if sound effects are enabled
    if (!uiSettings.soundEffects) {
      return
    }

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

      // Start background music when game initializes (only if enabled)
      if (backgroundMusicRef.current && !isMusicPlaying && uiSettings.backgroundMusic) {
        backgroundMusicRef.current.play().then(() => {
          setIsMusicPlaying(true)
        }).catch((error) => {
          console.log('Background music autoplay prevented:', error)
        })
      }
    }
  }, [gameEngine])

  useEffect(() => {
    if (gameEngine && currentCard) {
      updatePlayableCards()
    }
  }, [gameEngine, currentCard])

  // Enhanced physics-based animation frame update
  useEffect(() => {
    if (animatedCards.length === 0) return

    let animationId: number
    let lastTime = Date.now()

    const animate = () => {
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to 60fps
      lastTime = currentTime

      setAnimatedCards(prev => {
        const updated = prev.map(card => {
          if (!card.isAnimating) return card

          const elapsed = currentTime - card.startTime
          const progress = Math.min(elapsed / card.duration, 1)

          if (progress >= 1) {
            // Animation complete
            if (card.type === 'throw' || card.type === 'draw') {
              playSound("card-land")
            } else if (card.type === 'distribute') {
              playSound("card-land")
            }
            return { ...card, isAnimating: false, currentX: card.endX, currentY: card.endY, type: 'land' as any }
          }

          // Enhanced physics-based movement
          let currentX = card.currentX
          let currentY = card.currentY
          let currentRotation = card.rotation

          if (card.trajectory === 'arc') {
            // Arc trajectory with physics
            const arcProgress = Math.sin(progress * Math.PI)
            const height = -100 * arcProgress // Arc height
            currentX = card.startX + (card.endX - card.startX) * progress
            currentY = card.startY + (card.endY - card.startY) * progress + height

            // Apply spin rotation (reduced for more subtle effect)
            currentRotation = card.spin * progress * 90
          } else if (card.trajectory === 'bounce') {
            // Bounce trajectory with physics
            if (card.bounceCount < card.maxBounces) {
              const bounceProgress = progress * (card.maxBounces + 1)
              const bounceIndex = Math.floor(bounceProgress)
              const bounceLocalProgress = bounceProgress - bounceIndex

              if (bounceLocalProgress < 1) {
                const arcHeight = 50 * Math.sin(bounceLocalProgress * Math.PI)
                currentX = card.startX + (card.endX - card.startX) * (bounceIndex / (card.maxBounces + 1))
                currentY = card.startY + (card.endY - card.startY) * (bounceIndex / (card.maxBounces + 1)) - arcHeight
              }
            } else {
              // Final approach to target
              const finalProgress = (progress - (card.maxBounces / (card.maxBounces + 1))) * (card.maxBounces + 1)
              currentX = card.startX + (card.endX - card.startX) * (0.8 + finalProgress * 0.2)
              currentY = card.startY + (card.endY - card.startY) * (0.8 + finalProgress * 0.2)
            }
          } else {
            // Straight trajectory with subtle physics
            currentX = card.startX + (card.endX - card.startX) * progress
            currentY = card.startY + (card.endY - card.startY) * progress

            // Add subtle wobble for draw animations
            if (card.type === 'draw') {
              const wobble = Math.sin(progress * Math.PI * 4) * 3
              currentY += wobble
              currentRotation = card.spin * progress * 45 // Reduced from 180 to 45 for more subtle rotation
            }

            // Add subtle wobble for distribution animations
            if (card.type === 'distribute') {
              const wobble = Math.sin(progress * Math.PI * 6) * 2 // Faster, smaller wobble
              currentY += wobble
              currentRotation = card.spin * progress * 30 // Subtle rotation
            }
          }

          // Apply gravity effect for arc trajectories
          if (card.trajectory === 'arc' && progress > 0.5) {
            const gravityEffect = card.gravity * (progress - 0.5) * 20
            currentY += gravityEffect
          }

          return {
            ...card,
            currentX,
            currentY,
            rotation: currentRotation
          }
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
      return { message: "🏆 PERFECT! You won the round! 🏆", type: "perfect" }
    }

    if (remainingCards === 1) {
      return { message: "🔥 AMAZING! One card left - don't forget UNO! 🔥", type: "perfect" }
    }

    if (cardPlayed.color === "wild") {
      const wildMessages = [
        "🌟 PERFECT WILD! Masterful color choice!",
        "🌈 WILD GENIUS! You control the game now!",
        "✨ WILD MASTER! Perfect timing and strategy!",
        "🎨 WILD ARTIST! Beautiful color selection!"
      ]
      return {
        message: wildMessages[Math.floor(Math.random() * wildMessages.length)],
        type: "perfect"
      }
    }

    if (cardPlayed.value === "Skip") {
      const skipMessages = [
        "⏭️ SKIP MASTER! Opponent's turn denied!",
        "🚫 SKIP GENIUS! Perfect defensive play!",
        "⚡ SKIP STRIKE! Lightning-fast strategy!"
      ]
      return {
        message: skipMessages[Math.floor(Math.random() * skipMessages.length)],
        type: "great"
      }
    }

    if (cardPlayed.value === "Draw Two") {
      const drawTwoMessages = [
        "➕2 MASTER! Opponent draws the penalty!",
        "🎯 DRAW TWO! Perfect offensive move!",
        "💥 DOUBLE STRIKE! They're in trouble now!"
      ]
      return {
        message: drawTwoMessages[Math.floor(Math.random() * drawTwoMessages.length)],
        type: "great"
      }
    }

    if (cardPlayed.value === "Reverse") {
      const reverseMessages = [
        "🔄 REVERSE MASTER! Game flow changed!",
        "↩️ REVERSE GENIUS! Perfect timing!",
        "🎭 REVERSE DRAMA! The tables have turned!"
      ]
      return {
        message: reverseMessages[Math.floor(Math.random() * reverseMessages.length)],
        type: "great"
      }
    }

    const playableCards = userCards.filter((card) => card.isPlayable)
    if (playableCards.length > 3) {
      const smartMessages = [
        "🎯 SMART CHOICE! Selected from many options!",
        "🧠 STRATEGIC MOVE! Great decision making!",
        "💡 BRILLIANT! Perfect card selection!"
      ]
      return {
        message: smartMessages[Math.floor(Math.random() * smartMessages.length)],
        type: "great"
      }
    }

    const goodMessages = [
      "✨ SOLID MOVE! Keep it up!",
      "👌 NICE PLAY! You're doing great!",
      "🎮 GOOD STRATEGY! Well played!",
      "⚡ SMOOTH! That works perfectly!",
      "🎯 PRECISE! Excellent timing!",
      "🔥 HOT STREAK! You're on fire!",
      "💪 STRONG MOVE! Keep the momentum!",
      "🌟 SHINING! Great gameplay!"
    ]

    return {
      message: goodMessages[Math.floor(Math.random() * goodMessages.length)],
      type: "good",
    }
  }

  // Create action card animation for +2 and +4 cards (when played)
  const createActionCardAnimation = (playerId: string, penaltyCount: number, cardType: string) => {
    const playerElement = document.querySelector(`[data-player="${playerId}"]`)

    if (!playerElement) {
      console.log("Action card animation: DOM elements not found")
      return
    }

    const playerRect = playerElement.getBoundingClientRect()

    // Check if this is the human player (index 0)
    const isHumanPlayer = playerId === "0"

    // Show action card feedback with different messages for human vs AI
    const actionMessages = {
      'Draw Two': isHumanPlayer
        ? ["⚡ Draw Two played! Next player draws 2!", "💥 +2 Strike! Next player takes 2 cards!", "🔥 Draw Two effect! 2 cards penalty!"]
        : ["⚡ Draw Two played! You must draw 2!", "💥 +2 Strike! You take 2 cards!", "🔥 Draw Two effect! 2 cards penalty!"],
      'Wild Draw Four': isHumanPlayer
        ? ["💀 Wild Draw Four played! Next player draws 4!", "💣 +4 Explosion! Next player takes 4 cards!", "🔥 Wild Draw Four! 4 cards penalty!"]
        : ["💀 Wild Draw Four played! You must draw 4!", "💣 +4 Explosion! You take 4 cards!", "🔥 Wild Draw Four! 4 cards penalty!"]
    }

    const messages = actionMessages[cardType as keyof typeof actionMessages] || ["📚 Action card played!"]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    setFeedback({
      message: randomMessage,
      type: cardType === 'Wild Draw Four' ? "bad" : "great"
    })
    setTimeout(() => setFeedback(null), 3000)

    // Add action card particle effects
    if (uiSettings.visualEffects) {
      createActionCardParticleEffect(playerRect, penaltyCount, cardType)
    }
  }

  // Create penalty drawing animation for +2 and +4 cards
  const createPenaltyDrawingAnimation = (playerId: string, penaltyCount: number) => {
    const deckElement = document.querySelector("[data-deck]")

    // For human player (playerId === "0"), use the user hand element instead
    let playerElement: Element | null
    if (playerId === "0") {
      playerElement = document.querySelector("[data-user-hand]")
    } else {
      playerElement = document.querySelector(`[data-player="${playerId}"]`)
    }

    if (!deckElement || !playerElement) {
      console.log("Penalty animation: DOM elements not found, using fallback")
      console.log(`[DEBUG] Looking for elements: deckElement=${!!deckElement}, playerElement=${!!playerElement}`)
      console.log(`[DEBUG] Player ID: ${playerId}, Penalty count: ${penaltyCount}`)

      // Fallback: Just draw the cards without animation
      if (gameEngine) {
        const actualPlayerId = playerId === "0" ? "player_0" : `player_${playerId}`
        console.log(`[DEBUG] Using actual player ID: ${actualPlayerId}`)

        // Draw all penalty cards
        for (let i = 0; i < penaltyCount; i++) {
          console.log(`[DEBUG] Attempting to draw penalty card ${i + 1}/${penaltyCount}`)
          const drawnCard = gameEngine.drawCard(actualPlayerId)
          console.log(`[FALLBACK] Drew penalty card ${i + 1}/${penaltyCount} for player ${actualPlayerId}:`, drawnCard)

          if (!drawnCard) {
            console.log(`[ERROR] Failed to draw penalty card ${i + 1}/${penaltyCount}`)
          }
        }

        // Update game state
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

        // Reset play delay for human player
        if (playerId === "0") {
          setPlayDelay(false)
        }

        console.log(`[DEBUG] Fallback completed. New draw penalty: ${gameEngine.getDrawPenalty()}`)
      } else {
        console.log(`[ERROR] Game engine not available for fallback`)
      }
      return
    }

    const deckRect = deckElement.getBoundingClientRect()
    const playerRect = playerElement.getBoundingClientRect()

    // Check if this is the human player (index 0)
    const isHumanPlayer = playerId === "0"

    // Create multiple card animations for penalty drawing
    for (let i = 0; i < penaltyCount; i++) {
      // Check animation limit
      if (animatedCards.filter(card => card.isAnimating).length >= 3) {
        console.log("Penalty animation: Animation limit reached")
        break
      }

      const animatedCard = getAnimationFromPool()
      animatedCard.card = {
        id: Math.random() + i * 1000,
        color: "red",
        value: "?",
        isPlayable: false
      }
      animatedCard.startX = deckRect.left + deckRect.width / 2
      animatedCard.startY = deckRect.top + deckRect.height / 2
      animatedCard.endX = playerRect.left + playerRect.width / 2
      animatedCard.endY = playerRect.top + playerRect.height / 2
      animatedCard.currentX = deckRect.left + deckRect.width / 2
      animatedCard.currentY = deckRect.top + deckRect.height / 2
      animatedCard.isAnimating = true
      animatedCard.type = 'draw'
      animatedCard.rotation = 0
      animatedCard.scale = isHumanPlayer ? 1.2 : 1 // Slightly larger for human player
      animatedCard.zIndex = 9999 + i // Higher z-index for penalty cards
      animatedCard.trajectory = 'straight'
      animatedCard.duration = isHumanPlayer ? 800 + Math.random() * 200 : 600 + Math.random() * 200 // Slightly slower for human player
      animatedCard.delay = i * 150 // Stagger delay of 150ms between cards
      animatedCard.startTime = Date.now() + animatedCard.delay
      // Enhanced physics properties for penalty draw animation
      animatedCard.velocity = { x: 0, y: 0 }
      animatedCard.gravity = 0.3
      animatedCard.bounce = 0.5
      animatedCard.spin = Math.random() * 10 - 5
      animatedCard.airResistance = 0.99
      animatedCard.maxBounces = 1
      animatedCard.bounceCount = 0

      setAnimatedCards((prev) => [...prev, animatedCard])
    }

    // Play penalty drawing sound
    playSound("card-flip")

    // Add penalty particle effects
    if (uiSettings.visualEffects) {
      createPenaltyParticleEffect(playerRect, penaltyCount)
    }

    // Show penalty feedback with different messages for human vs AI
    const penaltyMessages = {
      2: isHumanPlayer
        ? ["😱 You must draw 2 cards!", "💥 Draw Two penalty! Take 2 cards!", "⚡ +2 Strike! You draw 2 cards!"]
        : ["😱 +2 Penalty! Draw 2 cards!", "💥 Draw Two effect! Take 2 cards!", "⚡ +2 Strike! Draw 2 cards!"],
      4: isHumanPlayer
        ? ["💀 You must draw 4 cards!", "🔥 Wild Draw Four penalty! Take 4 cards!", "💣 +4 Explosion! You draw 4 cards!"]
        : ["💀 +4 Penalty! Draw 4 cards!", "🔥 Wild Draw Four! Take 4 cards!", "💣 +4 Explosion! Draw 4 cards!"]
    }

    const messages = penaltyMessages[penaltyCount as keyof typeof penaltyMessages] || ["📚 Penalty cards drawn!"]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    setFeedback({
      message: randomMessage,
      type: "bad"
    })
    setTimeout(() => setFeedback(null), 4000)

    // Set up completion handler for penalty animation
    const totalAnimationTime = penaltyCount * 150 + (isHumanPlayer ? 1000 : 800) // Delay + duration
    setTimeout(() => {
      // Actually draw the penalty cards
      if (gameEngine) {
        const actualPlayerId = playerId === "0" ? "player_0" : `player_${playerId}`

        // Draw all penalty cards
        for (let i = 0; i < penaltyCount; i++) {
          const drawnCard = gameEngine.drawCard(actualPlayerId)
          console.log(`[ANIMATION] Drew penalty card ${i + 1}/${penaltyCount} for player ${actualPlayerId}:`, drawnCard)
        }

        // Update game state after animation completes
        const gameData = convertToUIFormat()
        setPlayers(gameData.players)
        setCurrentCard(gameData.currentCard)
        setDirection(gameData.direction)
        setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

        // Reset play delay for human player
        if (playerId === "0") {
          setPlayDelay(false)
        }
      }
    }, totalAnimationTime)
  }

  // ❌ REMOVED: checkAndAnimatePenaltyDrawing function
  // This function is no longer needed as penalties are now handled proactively
  // at the beginning of each player's turn in playAITurn() and drawCard()

  if (showMainMenu) {
    return <MainMenu onStartGame={startGame} />
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
      {/* Enhanced casino background with ambient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-red-900 to-green-900"></div>

      {/* Casino table surface with enhanced effects */}
      <div className="absolute inset-0 table-surface-enhanced">
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-green-800/90 via-green-700/70 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 bg-green-800/20 rounded-full blur-3xl"></div>
      </div>

      {/* Ambient casino lighting effects */}
      <div className="absolute inset-0">
        <div className="lighting-effect"></div>
        <div className="lighting-effect"></div>
        <div className="lighting-effect"></div>
      </div>

      {/* Floating casino elements */}
      <div className="floating-casino-elements"></div>

      {/* Casino ambiance overlay */}
      <div className="casino-ambiance"></div>

      {/* Draw Penalty Indicator */}
      {drawPenalty > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-600/90 backdrop-blur-sm border-2 border-red-400/50 rounded-lg px-6 py-3 shadow-2xl animate-pulse">
            <div className="flex items-center gap-3 text-white font-bold">
              <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-sm">!</span>
              </div>
              <span className="text-lg">
                {drawPenalty === 2 ? "😱 Draw Two Penalty!" : "💀 Wild Draw Four Penalty!"}
              </span>
              <span className="text-sm bg-red-500/50 px-2 py-1 rounded">
                Draw {drawPenalty} cards
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Initial card distribution overlay */}
      {isDistributing && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9994]">
          <Card className="p-8 bg-black/70 text-white text-center border-2 border-yellow-400/50">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-24 bg-gradient-to-br from-red-600 to-red-400 rounded-lg border-2 border-white/20 animate-pulse"></div>
                <div className="absolute -top-2 -right-2 w-6 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg border-2 border-white/20 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-7 bg-gradient-to-br from-green-600 to-green-400 rounded-lg border-2 border-white/20 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400">Dealing Cards...</h2>
              <p className="text-white/80">Preparing your hand for battle!</p>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </Card>
        </div>
      )}

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
            } else if (animatedCard.type === 'distribute') {
              rotation = Math.sin(progress * Math.PI * 6) * 10
              scale = (animatedCard.scale || 1) + Math.sin(progress * Math.PI) * 0.1
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
            case 'distribute':
              return 'shadow-lg border-2 border-purple-400 animate-pulse drop-shadow-lg'
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
                className={`uno-card-enhanced card-physics-enhanced ${getGlowEffect()}`}
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

              {animatedCard.type === 'distribute' && (
                <>
                  <div className="absolute inset-0 bg-purple-400/30 rounded-lg blur-lg animate-pulse"></div>
                  <div className="absolute inset-0 bg-pink-300/20 rounded-lg blur-md animate-ping"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/40 to-pink-400/40 rounded-lg blur-xl animate-pulse"></div>
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

              {animatedCard.type === 'distribute' && (
                <>
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400/50 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute top-1/2 -left-1 w-1 h-1 bg-purple-300/30 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {gameEngine?.isGameOver() && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[9998]">
          <Card className="p-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-center shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 font-gaming">🎉 Game Over! 🎉</h2>
            <p className="text-2xl font-semibold mb-6 font-gaming-secondary">{gameEngine.getRoundWinner()?.name || 'Unknown'} {(gameEngine.getRoundWinner()?.name === 'You' || gameEngine.getRoundWinner()?.name === 'Unknown') ? 'Win!' : 'Wins!'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-black text-white hover:bg-gray-800 font-gaming-secondary">
                Play Again
              </Button>
              <Button onClick={returnToMainMenu} className="bg-blue-600 text-white hover:bg-blue-700 font-gaming-secondary">
                Main Menu
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Pause Overlay */}
      {isGamePaused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center shadow-2xl border-2 border-white/20">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-2 h-8 bg-white mr-1"></div>
                    <div className="w-2 h-8 bg-white"></div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-black text-xs font-bold">⏸️</span>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2 font-gaming">Game Paused</h2>
                <p className="text-lg opacity-90 font-gaming-secondary">Take a break or review the game state</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={resumeGame}
                  className="bg-green-600 text-white hover:bg-green-500 font-gaming-secondary px-6 py-2"
                >
                  Resume Game
                </Button>
                <Button
                  onClick={returnToMainMenu}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-gaming-secondary px-6 py-2"
                >
                  Main Menu
                </Button>
              </div>
              <div className="text-sm opacity-70 mt-4">
                Press <kbd className="px-2 py-1 bg-white/20 rounded text-xs">Space</kbd> or <kbd className="px-2 py-1 bg-white/20 rounded text-xs">P</kbd> to resume
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Card Confirmation Dialog */}
      {showActionConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[9997]">
          <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center shadow-2xl max-w-md">
            <h3 className="text-xl font-bold mb-4">Confirm Action Card</h3>
            <div className="mb-4">
              <UnoCard
                color={showActionConfirm.card.color}
                value={showActionConfirm.card.value}
                size="medium"
                className="uno-card-enhanced mx-auto"
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
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div className={`
            px-8 py-4 rounded-2xl shadow-2xl border-2 text-center font-bold text-xl
            transform transition-all duration-500 ease-out
            animate-[slideInDown_0.5s_ease-out,fadeOut_0.5s_ease-in_4s_forwards]
            ${feedback.type === "perfect" ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-300 scale-110" : ""}
            ${feedback.type === "great" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 scale-105" : ""}
            ${feedback.type === "good" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-300" : ""}
            ${feedback.type === "bad" ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300" : ""}
          `}>
            <p className="drop-shadow-lg font-gaming-secondary">{feedback.message}</p>

            {/* Particle effects for perfect moves */}
            {feedback.type === "perfect" && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`feedback-particle-${i}`}
                    className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Selection Confirmation Overlay */}
      {colorConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none">
          {/* Background blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          {/* Color confirmation card */}
          <div className={`
            relative px-12 py-8 rounded-3xl shadow-2xl border-4 text-center font-bold text-4xl
            transform transition-all duration-700 ease-out
            animate-[zoomIn_0.5s_ease-out,fadeOut_0.5s_ease-in_2.5s_forwards]
            ${colorConfirmation.color === "red" ? "bg-gradient-to-r from-red-500 to-red-700 text-white border-red-300 shadow-red-500/50" : ""}
            ${colorConfirmation.color === "blue" ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-300 shadow-blue-500/50" : ""}
            ${colorConfirmation.color === "green" ? "bg-gradient-to-r from-green-500 to-green-700 text-white border-green-300 shadow-green-500/50" : ""}
            ${colorConfirmation.color === "yellow" ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-300 shadow-yellow-500/50" : ""}
          `}>
            {/* Glowing border effect */}
            <div className={`
              absolute inset-0 rounded-3xl blur-xl animate-pulse
              ${colorConfirmation.color === "red" ? "bg-red-400/50" : ""}
              ${colorConfirmation.color === "blue" ? "bg-blue-400/50" : ""}
              ${colorConfirmation.color === "green" ? "bg-green-400/50" : ""}
              ${colorConfirmation.color === "yellow" ? "bg-yellow-400/50" : ""}
            `}></div>

            {/* Color icon */}
            <div className="text-6xl mb-4 animate-bounce">
              {colorConfirmation.color === "red" && "🔥"}
              {colorConfirmation.color === "blue" && "💙"}
              {colorConfirmation.color === "green" && "🌿"}
              {colorConfirmation.color === "yellow" && "⭐"}
            </div>

            {/* Color name */}
            <div className="text-5xl font-black tracking-wider drop-shadow-2xl mb-2">
              {colorConfirmation.color.toUpperCase()}
            </div>

            {/* Player name */}
            <div className="text-2xl font-semibold opacity-90">
              {colorConfirmation.playerName} chose {colorConfirmation.color}!
            </div>

            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {[...Array(12)].map((_, i) => (
                <div
                  key={`color-particle-${i}`}
                  className={`
                    absolute w-3 h-3 rounded-full animate-ping
                    ${colorConfirmation.color === "red" ? "bg-red-300" : ""}
                    ${colorConfirmation.color === "blue" ? "bg-blue-300" : ""}
                    ${colorConfirmation.color === "green" ? "bg-green-300" : ""}
                    ${colorConfirmation.color === "yellow" ? "bg-yellow-300" : ""}
                  `}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>

            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {[...Array(6)].map((_, i) => (
                <div
                  key={`sparkle-${i}`}
                  className="absolute text-white animate-ping"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 3) * 20}%`,
                    animationDelay: `${i * 0.2}s`,
                    fontSize: `${16 + Math.random() * 8}px`
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 flex items-center gap-4 z-10">
        {/* Return to Main Menu */}
        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/20 hover:bg-white/10 flex items-center gap-1"
          onClick={returnToMainMenu}
        >
          <Home className="w-4 h-4" />
          Menu
        </Button>
        {/* Background Music Controls */}
        <div className={`bg-black/50 text-white p-2 rounded-lg border border-white/20 flex items-center gap-2 transition-all duration-300 ${isMusicPlaying && uiSettings.backgroundMusic ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/20' : ''}`}>
          <Button
            size="sm"
            variant="ghost"
            className={`text-white hover:text-gray-300 p-1 transition-all duration-300 ${isMusicPlaying && uiSettings.backgroundMusic ? 'animate-pulse' : ''}`}
            onClick={() => {
              if (backgroundMusicRef.current) {
                if (isMusicPlaying) {
                  backgroundMusicRef.current.pause()
                  setIsMusicPlaying(false)
                } else if (uiSettings.backgroundMusic) {
                  backgroundMusicRef.current.play()
                  setIsMusicPlaying(true)
                }
              }
            }}
            title={!uiSettings.backgroundMusic ? "Background Music Disabled" : isMusicPlaying ? "Pause Music" : "Play Music"}
            disabled={!uiSettings.backgroundMusic}
          >
            {!uiSettings.backgroundMusic ? "🔇" : isMusicPlaying ? "🔊" : "🔇"}
          </Button>
          <div className="flex flex-col items-center gap-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={uiSettings.musicVolume}
              onChange={(e) => {
                // This would need to be connected to the settings context
                // For now, just update the audio directly
                if (backgroundMusicRef.current) {
                  backgroundMusicRef.current.volume = parseFloat(e.target.value)
                }
              }}
              className="w-16 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              title="Music Volume"
            />
            <span className="text-xs text-white/70 font-gaming-secondary">
              {Math.round(uiSettings.musicVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Pause/Resume Game Button */}
        {!gameEngine?.isGameOver() && (
          <Button
            size="sm"
            variant="outline"
            className={`flex items-center gap-1 transition-all duration-300 ${isGamePaused
              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500 hover:bg-yellow-500/30 shadow-lg shadow-yellow-400/20"
              : "bg-black/50 text-white border-white/20 hover:bg-white/10"
              }`}
            onClick={isGamePaused ? resumeGame : pauseGame}
            title={isGamePaused ? "Resume Game" : "Pause Game"}
          >
            {isGamePaused ? (
              <>
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
                </div>
                Resume
              </>
            ) : (
              <>
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-1 h-4 bg-white mr-1"></div>
                  <div className="w-1 h-4 bg-white"></div>
                </div>
                Pause
              </>
            )}
          </Button>
        )}

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
          <div className="text-blue-400">
            M - Toggle Music
          </div>
          <div className="text-purple-400">
            P/Space - Pause/Resume
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
        {/* Uno Arena Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <img
              src="/uno-arena.png"
              alt="UNO Arena Logo"
              className="w-48 h-48 object-contain drop-shadow-2xl animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            {/* Enhanced glow effect for the logo */}
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse scale-150"></div>
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-ping scale-125"></div>
          </div>
          {/* <div className="uno-arena-text fascinate-regular text-3xl">
            UNO ARENA
          </div> */}
        </div>

        <div className="flex items-center gap-8 mt-4">
          <div data-deck>
            <EnhancedDeck
              deckCount={gameEngine?.getDeckCount() || 0}
              isDrawable={!playDelay && (gameEngine?.getDeckCount() || 0) > 0}
              isPlayerTurn={players[0]?.isActive || false}
              onClick={drawCard}
            />
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
            <div className={`
              flex flex-col items-center gap-3 transition-all duration-500 pointer-events-auto
              ${player.isActive ? "scale-110" : "scale-100"}
            `}>
              {/* Active player spotlight */}
              {player.isActive && (
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-yellow-300/30 to-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
              )}



              {/* Opponent Cards Display - Only for Active Player */}
              {player.isActive && (
                <div className="flex gap-[-15px] transform-origin-center mb-2">
                  {Array.from({ length: Math.min(player.cardCount, 5) }, (_, i) => (
                    <div
                      key={`${player.id}-card-${i}`}
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
                        className="uno-card-enhanced shadow-lg"
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

              {/* Enhanced avatar with turn indicators */}
              <div className={`
                relative transition-all duration-500
                ${player.isActive
                  ? "ring-4 ring-yellow-400 shadow-2xl shadow-yellow-400/50"
                  : player.isNextPlayer
                    ? "ring-2 ring-blue-400/60 shadow-lg shadow-blue-400/30"
                    : "ring-1 ring-white/20"
                }
                rounded-full
              `}>
                <Avatar className={`
                  border-2 transition-all duration-500
                  ${player.isActive ? "w-20 h-20 border-yellow-400" : "w-16 h-16 border-white/30"}
                `}>
                  <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                    {player.name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Active player indicator */}
                {player.isActive && (
                  <>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 ring-2 ring-yellow-300/50 rounded-full animate-ping"></div>
                  </>
                )}

                {/* Next player indicator */}
                {player.isNextPlayer && !player.isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-blue-600 rounded-full m-1"></div>
                  </div>
                )}

                {/* AI Thinking indicator */}
                {aiThinking && aiThinking.playerName === player.name && (
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-spin">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Enhanced player info */}
              <div className="text-center">
                <p className={`
                  font-semibold drop-shadow-lg transition-all duration-300 font-gaming-secondary
                  ${player.isActive ? "text-yellow-300 text-lg" : "text-white text-sm"}
                `}>
                  {player.name}
                  {player.isActive && <span className="ml-2 text-yellow-200 crown-animation">👑</span>}
                  {aiThinking && aiThinking.playerName === player.name && (
                    <span className="ml-2 text-purple-300 animate-pulse">🤔</span>
                  )}
                </p>
                <Badge className={`
                  transition-all duration-300
                  ${player.isActive
                    ? "bg-yellow-400 text-black font-bold"
                    : "bg-black/50 text-white/80"
                  }
                `}>
                  {player.cardCount} {player.cardCount === 1 ? 'card' : 'cards'}
                </Badge>
                {/* Score display */}
                {/* <Badge className={`
                  mt-1 transition-all duration-300
                  ${player.isActive
                    ? "bg-green-500 text-white font-bold"
                    : "bg-blue-500/70 text-white/90"
                  }
                `}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {player.score} pts
                </Badge> */}
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
          {/* Current Player Indicator */}
          {players[0] && (
            <div className={`
              flex flex-col items-center gap-3 mb-6 transition-all duration-500
              ${players[0].isActive ? "scale-110" : "scale-100"}
            `}>
              {/* Active player spotlight */}
              {players[0].isActive && (
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-yellow-300/30 to-yellow-400/20 rounded-full blur-xl animate-pulse z-0"></div>
              )}

              {/* Enhanced avatar with buttons positioned behind */}
              <div className={`
                relative transition-all duration-500 flex items-center justify-center
                ${players[0].isActive
                  ? "ring-4 ring-yellow-400 shadow-2xl shadow-yellow-400/50"
                  : "ring-1 ring-white/20"
                }
                rounded-full
              `}>
                {/* Draw Card Button - Behind Left */}
                <Button
                  className="absolute left-[-90px] h-14 w-24 px-3 py-2 justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold shadow-lg hover:shadow-xl flex-row items-center gap-1 disabled:opacity-50 transition-all duration-300 transform hover:scale-102 disabled:hover:scale-100 rounded-full border-2 border-white/20 z-10"
                  onClick={drawCard}
                  disabled={
                    !players[0]?.isActive ||
                    gameEngine?.getDeckCount() <= 0 ||
                    playDelay ||
                    isGamePaused ||
                    (players[0]?.cards.some(card => card.isPlayable) || false)
                  }
                  title={
                    !players[0]?.isActive
                      ? "Not your turn"
                      : gameEngine?.getDeckCount() <= 0
                        ? "No cards left to draw"
                        : playDelay
                          ? "Please wait"
                          : isGamePaused
                            ? "Game is paused"
                            : (players[0]?.cards.some(card => card.isPlayable) || false)
                              ? "You have playable cards - play them first!"
                              : "Draw a card (Press D)"
                  }
                >
                  <Plus className="w-5 h-5 text-white drop-shadow-2xl stroke-2" />
                  <span className="text-sm bg-white text-blue-600 px-2 py-1 rounded-md font-black shadow-2xl border-2 border-blue-600">D</span>
                </Button>

                {/* UNO Button - Behind Right */}
                <Button
                  className="absolute right-[-90px] h-14 w-24 px-3 py-2 justify-center bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold shadow-lg hover:shadow-xl flex-row items-center gap-1 transition-all duration-300 transform hover:scale-102 disabled:hover:scale-100 rounded-full border-2 border-white/20 disabled:opacity-50 disabled:transform-none z-10"
                  onClick={callUno}
                  disabled={!players[0] || players[0].cardCount !== 1 || isGamePaused}
                  title={
                    !players[0]
                      ? "No player data"
                      : players[0].cardCount !== 1
                        ? `Call UNO when you have exactly 1 card (you have ${players[0].cardCount})`
                        : isGamePaused
                          ? "Game is paused"
                          : "Call UNO! (Press U)"
                  }
                >
                  <Zap className="w-5 h-5 text-white drop-shadow-2xl stroke-2" />
                  <span className="text-sm bg-white text-red-600 px-2 py-1 rounded-md font-black shadow-2xl border-2 border-red-600">U</span>
                </Button>

                {/* Avatar Center - Positioned above buttons */}
                <Avatar className={`
                  border-2 transition-all duration-500 relative z-20
                  ${players[0].isActive ? "w-20 h-20 border-yellow-400" : "w-16 h-16 border-white/30"}
                `}>
                  <AvatarImage src="/human-avatar.png" alt={players[0].name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                    {players[0].name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Active player indicator - repositioned */}
                {players[0].isActive && (
                  <>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce z-30">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 ring-2 ring-yellow-300/50 rounded-full animate-ping z-10"></div>
                  </>
                )}
              </div>

              {/* Enhanced player info */}
              <div className="text-center">
                <p className={`
                  font-semibold drop-shadow-lg transition-all duration-300 font-gaming-secondary
                  ${players[0].isActive ? "text-yellow-300 text-lg" : "text-white text-sm"}
                `}>
                  {players[0].name}
                  {players[0].isActive && <span className="ml-2 text-yellow-200 crown-animation">👑</span>}
                </p>
                <Badge className={`
                  transition-all duration-300
                  ${players[0].isActive
                    ? "bg-yellow-400 text-black font-bold"
                    : "bg-black/50 text-white/80"
                  }
                `}>
                  {players[0].cardCount} {players[0].cardCount === 1 ? 'card' : 'cards'}
                </Badge>
                {/* Score display for current player */}
                {/* <Badge className={`
                  mt-1 transition-all duration-300
                  ${players[0].isActive
                    ? "bg-green-500 text-white font-bold"
                    : "bg-blue-500/70 text-white/90"
                  }
                `}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {players[0].score} pts
                </Badge> */}
              </div>
            </div>
          )}

          {/* Player Hand - Positioned at the bottom of the curved board */}
          <div className="flex items-end gap-4 p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-4">
            {(players[0]?.cards || []).map((card, index) => (
              <div
                key={card.id}
                data-card-id={card.id}
                className={`transition-all duration-300 transform hover:scale-110 hover:-translate-y-4 ${card.isPlayable && players[0]?.isActive && !playDelay && !isGamePaused && uiSettings.showPlayableCards
                  ? "cursor-pointer hover:shadow-2xl hover:shadow-green-400/50 hover:rotate-0"
                  : card.isPlayable && uiSettings.showPlayableCards
                    ? "cursor-pointer hover:scale-105"
                    : "opacity-60"
                  }`}
                style={{
                  transform: `rotate(${(index - 3) * 3}deg) translateY(${index % 2 === 0 ? '0px' : '-10px'})`,
                  zIndex: card.isPlayable && players[0]?.isActive && !playDelay && !isGamePaused ? 10 : 1
                }}
                onClick={() => {
                  if (card.isPlayable && players[0]?.isActive && !playDelay && !isGamePaused) {
                    // Show confirmation for action cards if enabled
                    if (uiSettings.confirmActionCards && (card.value === "Skip" || card.value === "Draw Two" || card.value === "Reverse" || card.color === "wild")) {
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
                  isPlayable={card.isPlayable && players[0]?.isActive && !playDelay && !isGamePaused && uiSettings.showPlayableCards}
                  className={`uno-card-enhanced ${card.isPlayable && players[0]?.isActive && !playDelay && !isGamePaused && uiSettings.showPlayableCards ? "uno-card-playable" : ""}`}
                />
              </div>
            ))}
          </div>




        </div>
      </div>





      {/* Challenge Buttons - Fixed Position Above Player Hand */}
      <div className="absolute bottom-[45vh] left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {players.slice(1).map((player) => {
            const canChallengeUno = gameEngine?.canChallengeUno(`player_${player.id}`)
            const canChallengeWildDrawFour = gameEngine?.canChallengeWildDrawFour(`player_${player.id}`)
            const isHumanTurn = currentPlayerId === "player_0"

            // Debug logging
            if (canChallengeWildDrawFour && isHumanTurn) {
              console.log(`[DEBUG] Challenge available for ${player.name}:`, {
                playerId: `player_${player.id}`,
                canChallengeUno,
                canChallengeWildDrawFour,
                topCard: gameEngine?.getTopCard(),
                previousActiveColor: gameEngine?.getPreviousActiveColor(),
                playDelay,
                isGamePaused,
                isHumanTurn
              })
            }

            // Only show challenge buttons if it's human's turn AND challenges are available
            if ((!canChallengeUno && !canChallengeWildDrawFour) || !isHumanTurn) return null

            return (
              <div key={player.id} className="flex gap-2">
                {canChallengeUno && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-yellow-500/80 text-yellow-100 border-yellow-400 hover:bg-yellow-500 text-sm font-semibold hover:shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 px-4 py-2"
                    onClick={() => challengeUno(`player_${player.id}`)}
                    disabled={playDelay || isGamePaused}
                  >
                    🎯 Challenge {player.name} UNO
                  </Button>
                )}
                {canChallengeWildDrawFour && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-purple-500/80 text-purple-100 border-purple-400 hover:bg-purple-500 text-sm font-semibold hover:shadow-lg hover:shadow-purple-400/50 transition-all duration-300 px-4 py-2"
                    onClick={() => challengeWildDrawFour(`player_${player.id}`)}
                    disabled={playDelay || isGamePaused}
                  >
                    ⚡ Challenge {player.name} +4
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>



      {/* View Logs Button - Top Right Corner */}
      <div className="absolute top-8 right-8 z-[9991]">
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
        <div className="absolute bottom-4 right-4 w-80 h-96 bg-black/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-4 z-[9993] overflow-y-auto">
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
                className="uno-card-enhanced shadow-md"
              />
            ))}
          </div>
          {gameEngine.getDiscardPile().length === 0 && (
            <p className="text-white/70 text-center mt-8">Discard pile is empty</p>
          )}
        </div>
      )}

      {/* Debug Panel - Only visible in developer mode */}
      {isDeveloperMode && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg z-[9992]">
          <h3 className="font-bold mb-2">Debug Panel</h3>
          <div className="space-y-2 text-xs">
            <div>Game Engine: {gameEngine ? "Active" : "Null"}</div>
            <div>Current Player: {gameEngine?.getCurrentPlayer()?.name || "None"}</div>
            <div>Game Phase: {gameEngine?.getPhase() || "None"}</div>
            <div>Is Game Over: {gameEngine?.isGameOver() ? "Yes" : "No"}</div>
            <div>AI Thinking: {aiThinking ? `${aiThinking.playerName} (${Date.now() - aiThinking.startTime}ms)` : "None"}</div>
            <div>AI Turn Animating: {isAITurnAnimating ? "Yes" : "No"}</div>
            <div>Play Delay: {playDelay ? "Yes" : "No"}</div>
            <div>Game Paused: {isGamePaused ? "Yes" : "No"}</div>
          </div>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== DEBUG GAME STATE ===")
                console.log("Current Player:", gameEngine.getCurrentPlayer())
                console.log("Game Phase:", gameEngine.getPhase())
                console.log("Is Game Over:", gameEngine.isGameOver())
                console.log("Players:", gameEngine.getPlayers().map(p => ({ name: p.name, handSize: p.getHandSize(), isHuman: p.isHuman })))
                console.log("Top Card:", gameEngine.getTopCard())
                console.log("Direction:", gameEngine.getDirection())
                console.log("Draw Penalty:", gameEngine.getDrawPenalty())
                console.log("Skip Next:", gameEngine.getState().gameState.skipNext)
                console.log("========================")
              }
            }}
          >
            Log Game State
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== FORCING AI TURN ===")
                const currentPlayer = gameEngine.getCurrentPlayer()
                console.log("Current player before force:", currentPlayer.name)
                const decision = gameEngine.decideAITurn()
                console.log("AI decision:", decision)
                if (decision) {
                  const success = gameEngine.applyAIAction(decision)
                  console.log("Force AI turn result:", success)
                  const gameData = convertToUIFormat()
                  setPlayers(gameData.players)
                  setCurrentCard(gameData.currentCard)
                  setDirection(gameData.direction)
                  setCurrentPlayerId(gameEngine.getCurrentPlayer().id)
                  setIsAITurnAnimating(false)
                  setAiThinking(null)
                }
              }
            }}
          >
            Force AI Turn
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== CONTINUE GAME ===")
                // Reset any stuck states
                setIsAITurnAnimating(false)
                setAiThinking(null)
                setPlayDelay(false)

                // Force a turn change if needed
                const currentPlayer = gameEngine.getCurrentPlayer()
                console.log("Current player:", currentPlayer.name)

                // Trigger the turn detection useEffect
                setCurrentPlayerId(currentPlayer.id)
              }
            }}
          >
            Continue Game
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== MANUAL TURN ADVANCE ===")
                // Force the game engine to advance to the next turn
                const currentPlayer = gameEngine.getCurrentPlayer()
                console.log("Current player before advance:", currentPlayer.name)

                // Try to manually trigger the next turn
                const players = gameEngine.getPlayers()
                const currentIndex = players.findIndex(p => p.id === currentPlayer.id)
                const nextIndex = (currentIndex + 1) % players.length
                const nextPlayer = players[nextIndex]

                console.log("Next player should be:", nextPlayer.name)

                // Force the turn change by updating the current player ID
                setCurrentPlayerId(nextPlayer.id)

                // Reset states
                setIsAITurnAnimating(false)
                setAiThinking(null)
                setPlayDelay(false)
              }
            }}
          >
            Manual Turn Advance
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== CHECK TURN PROGRESSION ===")
                const state = gameEngine.getState()
                console.log("Current player index:", state.currentPlayer.turnOrder)
                console.log("Skip next:", state.gameState.skipNext)
                console.log("Direction:", state.gameState.direction)
                console.log("Phase:", state.gameState.phase)

                // Calculate who should be next
                const players = gameEngine.getPlayers()
                const currentIndex = state.currentPlayer.turnOrder
                const direction = state.gameState.direction
                const skipNext = state.gameState.skipNext

                let nextIndex = currentIndex
                if (skipNext) {
                  nextIndex = direction === "clockwise" ? (currentIndex + 2) % players.length : (currentIndex - 2 + players.length) % players.length
                } else {
                  nextIndex = direction === "clockwise" ? (currentIndex + 1) % players.length : (currentIndex - 1 + players.length) % players.length
                }

                console.log("Next player should be:", players[nextIndex].name)
                console.log("Current player is:", players[currentIndex].name)

                if (players[nextIndex].name === players[currentIndex].name) {
                  console.log("⚠️ TURN PROGRESSION ISSUE: Next player is same as current!")
                }
              }
            }}
          >
            Check Turn Progression
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== FORCE UI SYNC ===")
                // Force the UI to sync with the game engine state
                const gameData = convertToUIFormat()
                setPlayers(gameData.players)
                setCurrentCard(gameData.currentCard)
                setDirection(gameData.direction)
                setCurrentPlayerId(gameEngine.getCurrentPlayer().id)

                // Reset any stuck states
                setIsAITurnAnimating(false)
                setAiThinking(null)
                setPlayDelay(false)

                console.log("UI synced with game engine")
                console.log("Current player:", gameEngine.getCurrentPlayer().name)
              }
            }}
          >
            Force UI Sync
          </Button>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (gameEngine) {
                console.log("=== CHECK PLAYABLE CARDS ===")
                const currentPlayer = gameEngine.getCurrentPlayer()
                const topCard = gameEngine.getTopCard()

                console.log("Current player:", currentPlayer.name)
                console.log("Top card:", topCard ? `${topCard.color} ${topCard.value}` : 'None')
                console.log("Wild color:", gameEngine.getWildColor())
                console.log("Player hand:", currentPlayer.getHand().map(c => `${c.color} ${c.value}`))

                if (topCard) {
                  const playableCards = currentPlayer.getPlayableCards(topCard, gameEngine.getWildColor() || undefined)
                  console.log("Playable cards:", playableCards.map(c => `${c.color} ${c.value}`))

                  // Check each card with canPlayCard
                  currentPlayer.getHand().forEach(card => {
                    const gameCard: GameCard = {
                      id: Number.parseInt(card.id),
                      color: card.color,
                      value: card.value,
                      isPlayable: false
                    }
                    const topGameCard: GameCard = {
                      id: Number.parseInt(topCard.id),
                      color: topCard.color,
                      value: topCard.value,
                      isPlayable: false
                    }
                    const canPlay = canPlayCard(gameCard, topGameCard)
                    console.log(`  ${card.color} ${card.value}: canPlayCard = ${canPlay}, engine says = ${playableCards.some(c => c.id === card.id)}`)
                  })
                }
              }
            }}
          >
            Check Playable Cards
          </Button>
        </div>
      )}

      {/* Color Picker for Wild Cards */}
      <ColorPicker
        isVisible={showColorPicker}
        onColorSelect={handleColorSelect}
        onClose={handleColorPickerClose}
      />
    </div>
  )
}

export default function UnoGame() {
  return (
    <SettingsProvider>
      <UnoGameInner />
    </SettingsProvider>
  )
}
