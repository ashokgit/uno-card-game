export type UnoColor = "red" | "blue" | "green" | "yellow" | "wild"
export type UnoValue =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | "Skip"
  | "Reverse"
  | "Draw Two"
  | "Wild"
  | "Wild Draw Four"

// Game rules configuration
export interface UnoRules {
  stackDrawTwo: boolean
  stackDrawFour: boolean
  mustPlayIfDrawable: boolean
  allowDrawWhenPlayable: boolean   // NEW: official = true
  targetScore: number
  debugMode: boolean
  aiDifficulty: 'easy' | 'normal' | 'hard' | 'expert'
  enableJumpIn: boolean      // Allow players to play identical cards out of turn
  enableSevenZero: boolean   // Enable 7-0 house rules (hand swapping and rotation)
  enableSwapHands: boolean   // Enable hand swapping house rule
  showDiscardPile: boolean   // If true, expose and allow viewing the full discard pile
  deadlockResolution: 'end_round' | 'force_reshuffle'  // How to handle deadlock scenarios
}

export const DEFAULT_RULES: UnoRules = {
  stackDrawTwo: false, // Official rules: no stacking
  stackDrawFour: false, // Official rules: no stacking
  mustPlayIfDrawable: false, // Official rules: player chooses
  allowDrawWhenPlayable: true,     // official behavior
  targetScore: 500,
  debugMode: false,
  aiDifficulty: 'expert',
  enableJumpIn: false,
  enableSevenZero: false,
  enableSwapHands: false,
  showDiscardPile: false,  // Official: only top card is relevant, but can enable for full visibility
  deadlockResolution: 'end_round',  // Default: end round when deadlock detected
}

// Event hooks for UI and multiplayer integration
export interface UnoGameEvents {
  onCardPlayed?: (player: UnoPlayer, card: UnoCard, chosenColor?: UnoColor) => void
  onTurnChange?: (nextPlayer: UnoPlayer, direction: GameDirection) => void
  onRoundEnd?: (winner: UnoPlayer, points: number, scores: Map<string, number>) => void
  onGameEnd?: (winner: UnoPlayer, finalScores: Map<string, number>) => void
  onUnoCalled?: (player: UnoPlayer) => void
  onUnoChallenged?: (challenger: UnoPlayer, target: UnoPlayer, success: boolean) => void
  onWildDrawFourChallenged?: (challenger: UnoPlayer, target: UnoPlayer, success: boolean) => void
  onCardDrawn?: (player: UnoPlayer, card: UnoCard, autoPlayed: boolean) => void
  onActionCardPlayed?: (player: UnoPlayer, card: UnoCard, effect: string) => void
  onDeckReshuffled?: (remainingCards: number) => void
}

// Enhanced AI Strategy System
export interface IAIGameState {
  players: Array<{ id: string; name: string; handSize: number; isHuman: boolean }>
  currentPlayerId: string
  topCard: UnoCard | null
  wildColor: UnoColor | null
  direction: GameDirection
}

export interface IAIStrategy {
  chooseCard(playableCards: UnoCard[], gameState: IAIGameState, player: UnoPlayer): UnoCard | null
  chooseWildColor(hand: UnoCard[], gameState: IAIGameState, player: UnoPlayer): UnoColor
}

// Game State Tracker for Advanced AI
export class GameStateTracker {
  private playedCards: Map<string, number> = new Map() // card key -> count
  private opponentColorProfiles: Map<string, Map<UnoColor, number>> = new Map() // playerId -> color confidence
  private opponentDrawPatterns: Map<string, { draws: number, skips: number }> = new Map()
  private lastPlayedCards: UnoCard[] = []
  private readonly MAX_HISTORY = 50

  constructor() {
    this.initializeCardTracking()
  }

  private initializeCardTracking(): void {
    // Initialize tracking for all possible cards
    const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow']
    const values: UnoValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'Skip', 'Reverse', 'Draw Two']

    // Regular cards
    colors.forEach(color => {
      values.forEach(value => {
        this.playedCards.set(`${color}-${value}`, 0)
      })
    })

    // Wild cards
    this.playedCards.set('wild-Wild', 0)
    this.playedCards.set('wild-Wild Draw Four', 0)
  }

  onCardPlayed(card: UnoCard, playerId: string): void {
    const cardKey = `${card.color}-${card.value}`
    this.playedCards.set(cardKey, (this.playedCards.get(cardKey) || 0) + 1)

    // Track recent plays for pattern analysis
    this.lastPlayedCards.push(card)
    if (this.lastPlayedCards.length > this.MAX_HISTORY) {
      this.lastPlayedCards.shift()
    }

    // Update opponent color profiles
    this.updateOpponentColorProfile(card, playerId)
  }

  onCardDrawn(playerId: string, card: UnoCard): void {
    // Track draw patterns
    const pattern = this.opponentDrawPatterns.get(playerId) || { draws: 0, skips: 0 }
    pattern.draws++
    this.opponentDrawPatterns.set(playerId, pattern)
  }

  onPlayerSkipped(playerId: string): void {
    // Track when players skip instead of playing
    const pattern = this.opponentDrawPatterns.get(playerId) || { draws: 0, skips: 0 }
    pattern.skips++
    this.opponentDrawPatterns.set(playerId, pattern)
  }

  private updateOpponentColorProfile(card: UnoCard, playerId: string): void {
    if (card.color === 'wild') return // Wild cards don't indicate color preference

    let profile = this.opponentColorProfiles.get(playerId)
    if (!profile) {
      profile = new Map()
      this.opponentColorProfiles.set(playerId, profile)
    }

    profile.set(card.color, (profile.get(card.color) || 0) + 1)
  }

  getProbabilityOfCard(color: UnoColor, value: UnoValue): number {
    const cardKey = `${color}-${value}`
    const playedCount = this.playedCards.get(cardKey) || 0

    // Calculate probability based on standard UNO deck composition
    let totalInDeck = 0
    if (color === 'wild') {
      totalInDeck = value === 'Wild' ? 4 : 4 // 4 Wild, 4 Wild Draw Four
    } else {
      if (value === 0) totalInDeck = 1
      else if (typeof value === 'number') totalInDeck = 2
      else totalInDeck = 2 // Skip, Reverse, Draw Two
    }

    const remaining = Math.max(0, totalInDeck - playedCount)
    return remaining / totalInDeck
  }

  getOpponentColorProfile(playerId: string): Map<UnoColor, number> {
    return this.opponentColorProfiles.get(playerId) || new Map()
  }

  getOpponentDrawPattern(playerId: string): { draws: number, skips: number } {
    return this.opponentDrawPatterns.get(playerId) || { draws: 0, skips: 0 }
  }

  getLeastLikelyColorForOpponent(playerId: string): UnoColor {
    const profile = this.getOpponentColorProfile(playerId)
    const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow']

    let leastLikely = colors[0]
    let lowestCount = profile.get(colors[0]) || 0

    colors.forEach(color => {
      const count = profile.get(color) || 0
      if (count < lowestCount) {
        lowestCount = count
        leastLikely = color
      }
    })

    return leastLikely
  }

  getMostLikelyColorForOpponent(playerId: string): UnoColor {
    const profile = this.getOpponentColorProfile(playerId)
    const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow']

    let mostLikely = colors[0]
    let highestCount = profile.get(colors[0]) || 0

    colors.forEach(color => {
      const count = profile.get(color) || 0
      if (count > highestCount) {
        highestCount = count
        mostLikely = color
      }
    })

    return mostLikely
  }

  reset(): void {
    this.playedCards.clear()
    this.opponentColorProfiles.clear()
    this.opponentDrawPatterns.clear()
    this.lastPlayedCards = []
    this.initializeCardTracking()
  }
}

// Move Scoring Interface
export interface MoveScore {
  card: UnoCard
  defensiveScore: number
  offensiveScore: number
  handValueScore: number
  resourceConservationScore: number
  totalScore: number
}

// Expert AI Strategy Implementation
export class ExpertAIStrategy implements IAIStrategy {
  private stateTracker: GameStateTracker

  // Scoring constants for AI behavior tuning
  private static readonly DEFENSIVE_SCORE_IMMINENT_THREAT = 100
  private static readonly DEFENSIVE_SCORE_MEDIUM_THREAT = 50
  private static readonly DEFENSIVE_SCORE_LOW_THREAT = 20
  private static readonly DEFENSIVE_SCORE_REVERSE_HIGH = 30
  private static readonly DEFENSIVE_SCORE_REVERSE_LOW = 10
  private static readonly DEFENSIVE_SCORE_WILD_D4_IMMINENT = 150
  private static readonly DEFENSIVE_SCORE_WILD_D4_MEDIUM = 80
  private static readonly DEFENSIVE_SCORE_WILD_D4_LOW = 40

  private static readonly OFFENSIVE_COLOR_MULTIPLIER = 5
  private static readonly OFFENSIVE_POINTS_MULTIPLIER = 2
  private static readonly OFFENSIVE_ACTION_BONUS = 15

  private static readonly HAND_VALUE_MULTIPLIER = 3

  private static readonly RESOURCE_CONSERVATION_PENALTY_WILD_D4 = -200
  private static readonly RESOURCE_CONSERVATION_PENALTY_WILD = -50
  private static readonly RESOURCE_CONSERVATION_PENALTY_ACTION = -10
  private static readonly RESOURCE_CONSERVATION_THREAT_REDUCTION = 150

  private static readonly SELF_INTEREST_COLOR_MULTIPLIER = 5
  private static readonly SELF_INTEREST_ACTION_MULTIPLIER = 10

  private static readonly DISRUPTION_BASE_SCORE = 100
  private static readonly DISRUPTION_THREAT_BONUS = 50
  private static readonly DISRUPTION_COLOR_PENALTY = 10

  private static readonly WILD_COLOR_DISRUPTION_WEIGHT = 0.7
  private static readonly WILD_COLOR_SELF_INTEREST_WEIGHT = 0.3

  constructor(stateTracker: GameStateTracker) {
    this.stateTracker = stateTracker
  }

  chooseCard(playableCards: UnoCard[], gameState: IAIGameState, player: UnoPlayer): UnoCard | null {
    if (playableCards.length === 0) return null

    // Score each playable card
    const scoredMoves = playableCards.map(card => this.scoreMove(card, gameState, player))

    // Sort by total score (highest first)
    scoredMoves.sort((a, b) => b.totalScore - a.totalScore)

    // Return the highest scoring card
    return scoredMoves[0].card
  }

  chooseWildColor(hand: UnoCard[], gameState: IAIGameState, player: UnoPlayer): UnoColor {
    const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow']
    const colorScores = new Map<UnoColor, number>()

    colors.forEach(color => {
      const selfInterestScore = this.calculateSelfInterestScore(color, hand)
      const disruptionScore = this.calculateDisruptionScore(color, gameState, player)

      // Combine scores with heavy weight on disruption for expert AI
      const totalScore = selfInterestScore * ExpertAIStrategy.WILD_COLOR_SELF_INTEREST_WEIGHT +
        disruptionScore * ExpertAIStrategy.WILD_COLOR_DISRUPTION_WEIGHT
      colorScores.set(color, totalScore)
    })

    // Find the color with the highest score
    let bestColor = colors[0]
    let bestScore = colorScores.get(colors[0]) || 0

    colors.forEach(color => {
      const score = colorScores.get(color) || 0
      if (score > bestScore) {
        bestScore = score
        bestColor = color
      }
    })

    return bestColor
  }

  private scoreMove(card: UnoCard, gameState: IAIGameState, player: UnoPlayer): MoveScore {
    const defensiveScore = this.calculateDefensiveScore(card, gameState, player)
    const offensiveScore = this.calculateOffensiveScore(card, gameState, player)
    const handValueScore = this.calculateHandValueScore(card, player)
    const resourceConservationScore = this.calculateResourceConservationScore(card, gameState, player)

    const totalScore = defensiveScore + offensiveScore + handValueScore + resourceConservationScore

    return {
      card,
      defensiveScore,
      offensiveScore,
      handValueScore,
      resourceConservationScore,
      totalScore
    }
  }

  private calculateDefensiveScore(card: UnoCard, gameState: IAIGameState, player: UnoPlayer): number {
    if (!card.isActionCard()) return 0

    const players = gameState.players
    const currentPlayerId = gameState.currentPlayerId

    // Find the biggest threat (player with fewest cards)
    let biggestThreat: { id: string, handSize: number } | null = null
    let lowestCardCount = Infinity

    players.forEach((p) => {
      if (p.id !== currentPlayerId && p.handSize < lowestCardCount) {
        lowestCardCount = p.handSize
        biggestThreat = p
      }
    })

    if (!biggestThreat) return 0

    // Score based on how much this move disrupts the biggest threat
    let score = 0

    if (card.value === 'Skip' || card.value === 'Draw Two') {
      // High score for blocking players close to winning
      if (biggestThreat.handSize <= 2) {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_IMMINENT_THREAT
      } else if (biggestThreat.handSize <= 4) {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_MEDIUM_THREAT
      } else {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_LOW_THREAT
      }
    } else if (card.value === 'Reverse') {
      // Reverse is less effective but still valuable
      if (biggestThreat.handSize <= 3) {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_REVERSE_HIGH
      } else {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_REVERSE_LOW
      }
    } else if (card.value === 'Wild Draw Four') {
      // Wild Draw Four is very powerful for disruption
      if (biggestThreat.handSize <= 2) {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_WILD_D4_IMMINENT
      } else if (biggestThreat.handSize <= 4) {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_WILD_D4_MEDIUM
      } else {
        score += ExpertAIStrategy.DEFENSIVE_SCORE_WILD_D4_LOW
      }
    }

    return score
  }

  private calculateOffensiveScore(card: UnoCard, gameState: IAIGameState, player: UnoPlayer): number {
    let score = 0
    const hand = player.getHand()

    // Prefer playing cards that match colors we have many of
    if (card.color !== 'wild') {
      const colorCount = hand.filter(c => c.color === card.color).length
      score += colorCount * ExpertAIStrategy.OFFENSIVE_COLOR_MULTIPLIER
    }

    // Prefer playing high-point cards to reduce hand value
    score += card.points * ExpertAIStrategy.OFFENSIVE_POINTS_MULTIPLIER

    // Prefer playing action cards that give us control
    if (card.isActionCard()) {
      score += ExpertAIStrategy.OFFENSIVE_ACTION_BONUS
    }

    return score
  }

  private calculateHandValueScore(card: UnoCard, player: UnoPlayer): number {
    // Positive score for reducing hand value
    return card.points * ExpertAIStrategy.HAND_VALUE_MULTIPLIER
  }

  private calculateResourceConservationScore(card: UnoCard, gameState: IAIGameState, player: UnoPlayer): number {
    // Negative score for using valuable cards when not necessary
    let score = 0

    if (card.value === 'Wild Draw Four') {
      // Very high negative score - save for critical moments
      score += ExpertAIStrategy.RESOURCE_CONSERVATION_PENALTY_WILD_D4

      // Reduce penalty if we're in a critical situation
      const players = gameState.players
      const hasImmediateThreat = players.some((p) =>
        p.id !== player.id && p.handSize <= 2
      )

      if (hasImmediateThreat) {
        score += ExpertAIStrategy.RESOURCE_CONSERVATION_THREAT_REDUCTION // Still negative but less so
      }
    } else if (card.value === 'Wild') {
      // Moderate negative score
      score += ExpertAIStrategy.RESOURCE_CONSERVATION_PENALTY_WILD
    } else if (card.isActionCard()) {
      // Small negative score for action cards
      score += ExpertAIStrategy.RESOURCE_CONSERVATION_PENALTY_ACTION
    }

    return score
  }

  private calculateSelfInterestScore(color: UnoColor, hand: UnoCard[]): number {
    // Count how many cards we have of this color
    const colorCount = hand.filter(card => card.color === color).length

    // Also consider action cards of this color
    const actionCardCount = hand.filter(card =>
      card.color === color && card.isActionCard()
    ).length

    return colorCount * ExpertAIStrategy.SELF_INTEREST_COLOR_MULTIPLIER +
      actionCardCount * ExpertAIStrategy.SELF_INTEREST_ACTION_MULTIPLIER
  }

  private calculateDisruptionScore(color: UnoColor, gameState: IAIGameState, player: UnoPlayer): number {
    const players = gameState.players
    let totalDisruptionScore = 0

    players.forEach((p) => {
      if (p.id === player.id) return // Skip self

      // Get the least likely color for this opponent
      const leastLikelyColor = this.stateTracker.getLeastLikelyColorForOpponent(p.id)

      if (color === leastLikelyColor) {
        // High score for choosing colors opponents are unlikely to have
        totalDisruptionScore += ExpertAIStrategy.DISRUPTION_BASE_SCORE

        // Bonus if this opponent is close to winning
        if (p.handSize <= 3) {
          totalDisruptionScore += ExpertAIStrategy.DISRUPTION_THREAT_BONUS
        }
      } else {
        // Lower score for colors they might have
        const profile = this.stateTracker.getOpponentColorProfile(p.id)
        const colorCount = profile.get(color) || 0
        totalDisruptionScore += Math.max(0, 50 - colorCount * ExpertAIStrategy.DISRUPTION_COLOR_PENALTY)
      }
    })

    return totalDisruptionScore
  }
}

export class UnoCard {
  constructor(
    public id: string,
    public color: UnoColor,
    public value: UnoValue,
    public points = 0,
  ) {
    this.points = this.calculatePoints()
  }

  private calculatePoints(): number {
    if (typeof this.value === "number") return this.value
    if (this.value === "Skip" || this.value === "Reverse" || this.value === "Draw Two") return 20
    if (this.value === "Wild" || this.value === "Wild Draw Four") return 50
    return 0
  }

  canPlayOn(topCard: UnoCard, wildColor?: UnoColor, playerHand?: UnoCard[]): boolean {
    // Wild Draw Four restriction check
    if (this.color === "wild" && this.value === "Wild Draw Four" && playerHand) {
      const currentActiveColor = wildColor || topCard.color
      const hasMatchingColor = playerHand.some((c) =>
        c.color === currentActiveColor && c.id !== this.id
      )
      if (hasMatchingColor) {
        return false // Cannot play Wild Draw Four if player has matching color cards
      }
    }

    // Wild cards can always be played (except Wild Draw Four with restrictions)
    if (this.color === "wild") return true

    // If there's a wild color choice, match that
    if (wildColor && this.color === wildColor) return true

    // Standard matching: same color or same value
    return this.color === topCard.color || this.value === topCard.value
  }

  isActionCard(): boolean {
    return ["Skip", "Reverse", "Draw Two", "Wild", "Wild Draw Four"].includes(this.value as string)
  }

  isWildCard(): boolean {
    return this.color === "wild"
  }
}

export class UnoDeck {
  private cards: UnoCard[] = []
  private discardPile: UnoCard[] = []
  private debugMode: boolean = false

  constructor(private onReshuffle?: (remaining: number) => void, debugMode: boolean = false) {
    this.debugMode = debugMode
    this.initializeDeck()
    this.shuffle()
  }

  private initializeDeck(): void {
    const colors: UnoColor[] = ["red", "blue", "green", "yellow"]
    let cardId = 0

    // Number cards: 76 total (one 0 per color, two 1-9 per color)
    colors.forEach((color) => {
      // One 0 per color
      this.cards.push(new UnoCard(`${cardId++}`, color, 0))

      // Two of each 1-9 per color
      for (let value = 1; value <= 9; value++) {
        this.cards.push(new UnoCard(`${cardId++}`, color, value as UnoValue))
        this.cards.push(new UnoCard(`${cardId++}`, color, value as UnoValue))
      }
    })

    // Action cards: 24 total (2 per color for Skip, Reverse, Draw Two)
    colors.forEach((color) => {
      const actionCards: UnoValue[] = ["Skip", "Reverse", "Draw Two"]
      actionCards.forEach((action) => {
        this.cards.push(new UnoCard(`${cardId++}`, color, action))
        this.cards.push(new UnoCard(`${cardId++}`, color, action))
      })
    })

    // Wild cards: 8 total (4 Wild, 4 Wild Draw Four)
    for (let i = 0; i < 4; i++) {
      this.cards.push(new UnoCard(`${cardId++}`, "wild", "Wild"))
      this.cards.push(new UnoCard(`${cardId++}`, "wild", "Wild Draw Four"))
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  drawCard(): UnoCard | null {
    if (this.cards.length === 0) {
      if (this.debugMode) {
        console.log(`[DECK] Deck empty, attempting to reshuffle discard pile`)
        console.log(`[DECK] Current state - deck: ${this.cards.length}, discard: ${this.discardPile.length}`)
      }
      this.reshuffleDiscardPile()
      if (this.debugMode) {
        console.log(`[DECK] After reshuffle attempt - deck: ${this.cards.length}, discard: ${this.discardPile.length}`)
      }
    }

    const card = this.cards.pop()
    if (this.debugMode) {
      if (card) {
        console.log(`[DECK] Card drawn: ${card.color} ${card.value}. Remaining: ${this.cards.length}`)
      } else {
        console.log(`[DECK] No card drawn - deck empty after reshuffle attempt`)
      }
    }
    return card || null
  }

  drawCards(count: number): { drawnCards: UnoCard[], isExhausted: boolean } {
    const drawnCards: UnoCard[] = []
    let isExhausted = false

    for (let i = 0; i < count; i++) {
      const card = this.drawCard()
      if (card) {
        drawnCards.push(card)
      } else {
        // Deck was exhausted during the draw
        isExhausted = true
        break
      }
    }

    return { drawnCards, isExhausted }
  }

  public reshuffleDiscardPile(): void {
    if (this.debugMode) {
      console.log(`[DECK] Attempting reshuffle - deck: ${this.cards.length} cards, discard: ${this.discardPile.length} cards`)
    }

    if (this.discardPile.length <= 1) {
      if (this.debugMode) {
        console.log(`[DECK] Cannot reshuffle - discard pile has ${this.discardPile.length} cards.`)
      }
      return
    }

    // Keep top card, shuffle rest back into deck
    const topCard = this.discardPile.pop()!
    const cardsToReshuffle = this.discardPile.length
    this.cards = [...this.discardPile]
    this.discardPile = [topCard]
    this.shuffle()

    if (this.debugMode) {
      console.log(`[DECK] Reshuffled ${cardsToReshuffle} cards back into deck. Top card: ${topCard.color} ${topCard.value}. New deck size: ${this.cards.length}`)
    }

    // Notify parent about reshuffle
    this.onReshuffle?.(this.cards.length)
  }

  // Force reshuffle even with 1 card (for deadlock resolution)
  public forceReshuffle(): void {
    if (this.discardPile.length === 0) return

    // If only 1 card, create a new deck with that card and shuffle
    if (this.discardPile.length === 1) {
      const topCard = this.discardPile[0]
      this.cards = [topCard]
      this.shuffle()
    } else {
      // Normal reshuffle
      const topCard = this.discardPile.pop()!
      this.cards = [...this.discardPile]
      this.discardPile = [topCard]
      this.shuffle()
    }

    // Notify parent about reshuffle
    this.onReshuffle?.(this.cards.length)
  }

  playCard(card: UnoCard): void {
    this.discardPile.push(card)
  }

  getTopCard(): UnoCard | null {
    return this.discardPile[this.discardPile.length - 1] || null
  }

  getRemainingCount(): number {
    return this.cards.length
  }

  getDiscardPile(): UnoCard[] {
    return [...this.discardPile]
  }
}

export class UnoPlayer {
  private hand: UnoCard[] = []
  private hasCalledUno = false
  private score = 0
  private unoCallTime: number | null = null // Track when UNO was called

  constructor(
    public id: string,
    public name: string,
    public isHuman = false,
  ) { }

  addCards(cards: UnoCard[]): void {
    this.hand.push(...cards)
    // Reset UNO call if cards are added (penalty for not calling UNO)
    if (this.hasOneCard() && !this.hasCalledUno) {
      this.resetUnoCall()
    }
  }

  removeCard(cardId: string): UnoCard | null {
    const cardIndex = this.hand.findIndex((card) => card.id === cardId)
    if (cardIndex === -1) return null
    const removedCard = this.hand.splice(cardIndex, 1)[0]

    // If this was the second-to-last card, reset UNO call
    if (this.hand.length === 1) {
      this.resetUnoCall()
    }

    return removedCard
  }

  getHand(): UnoCard[] {
    return [...this.hand]
  }

  getHandSize(): number {
    return this.hand.length
  }

  hasCard(cardId: string): boolean {
    return this.hand.some((card) => card.id === cardId)
  }

  getPlayableCards(topCard: UnoCard, wildColor?: UnoColor): UnoCard[] {
    return this.hand.filter((card) => card.canPlayOn(topCard, wildColor, this.hand))
  }

  callUno(): void {
    if (this.hasOneCard()) {
      this.hasCalledUno = true
      this.unoCallTime = Date.now()
    }
  }

  resetUnoCall(): void {
    this.hasCalledUno = false
    this.unoCallTime = null
  }

  getHasCalledUno(): boolean {
    return this.hasCalledUno
  }

  getUnoCallTime(): number | null {
    return this.unoCallTime
  }

  // Check if UNO call is valid (called when having exactly 1 card)
  isUnoCallValid(): boolean {
    return this.hasOneCard() && this.hasCalledUno
  }

  // Check if player should be penalized for not calling UNO
  shouldBePenalizedForUno(): boolean {
    return this.hasOneCard() && !this.hasCalledUno
  }

  calculateHandPoints(): number {
    return this.hand.reduce((total, card) => total + card.points, 0)
  }

  addScore(points: number): void {
    this.score += points
  }

  getScore(): number {
    return this.score
  }

  isEmpty(): boolean {
    return this.hand.length === 0
  }

  hasOneCard(): boolean {
    return this.hand.length === 1
  }

  // Set hand directly (for efficient hand swapping/rotation)
  setHand(cards: UnoCard[]): void {
    this.hand = [...cards]
    this.resetUnoCall()
  }

  // Enhanced AI color choice strategy
  chooseWildColor(): UnoColor {
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 }

    // Count cards for each color
    this.hand.forEach((card) => {
      if (card.color !== "wild") {
        colorCounts[card.color as keyof typeof colorCounts]++
      }
    })

    // Strategy 1: Prefer colors with high-point action cards (Draw Two, Skip, Reverse)
    const actionCardColors = { red: 0, blue: 0, green: 0, yellow: 0 }
    this.hand.forEach((card) => {
      if (card.color !== "wild" && card.isActionCard()) {
        actionCardColors[card.color as keyof typeof actionCardColors]++
      }
    })

    // Find colors with action cards
    const colorsWithActionCards = Object.entries(actionCardColors)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => actionCardColors[b[0] as keyof typeof actionCardColors] - actionCardColors[a[0] as keyof typeof actionCardColors])

    if (colorsWithActionCards.length > 0) {
      // Prefer colors with the most action cards
      return colorsWithActionCards[0][0] as UnoColor
    }

    // Strategy 2: Prefer colors with the most cards (original strategy)
    const maxColor = Object.entries(colorCounts).reduce((a, b) =>
      colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b,
    )[0] as keyof typeof colorCounts

    if (colorCounts[maxColor] > 0) {
      return maxColor
    }

    // Strategy 3: If no preference, choose randomly
    const colors: UnoColor[] = ["red", "blue", "green", "yellow"]
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

export type GameDirection = "clockwise" | "counterclockwise"
export type GamePhase = "playing" | "waiting" | "drawing" | "choosing_color" | "choosing_player" | "game_over"

export class UnoGame {
  private players: UnoPlayer[] = []
  private deck: UnoDeck
  private currentPlayerIndex = 0
  private direction: GameDirection = "clockwise"
  private wildColor: UnoColor | null = null
  private previousActiveColor: UnoColor | null = null // Track color before Wild+4 was played
  private phase: GamePhase = "playing"
  private winner: UnoPlayer | null = null
  private roundWinner: UnoPlayer | null = null
  private skipNext = false
  private drawPenalty = 0
  private lastPlayerWithOneCard: UnoPlayer | null = null // Track who had one card for UNO challenges
  private unoChallengeWindow = 2000 // 2 seconds to challenge UNO call
  private lastActionCard: UnoCard | null = null // Track the last action card for stacking
  private rules: UnoRules
  private unoChallengeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map() // Track UNO challenge timers
  private events: UnoGameEvents
  private eventLog: Array<{ timestamp: number; event: string; data: any }> = [] // Event log for replay/debug
  // Deadlock detection properties
  private consecutiveSkips = 0 // Track consecutive skips to detect deadlock
  private lastPlayerWhoSkipped: string | null = null // Track who last skipped to detect full cycle
  private turnCount = 0 // Track total turns for timeout mechanism
  // Enhanced state-based deadlock detection
  private gameStateHistory: string[] = [] // Store recent game state hashes for play-loop detection
  private resourceStateHistory: string[] = [] // Store recent resource state hashes for resource exhaustion detection
  private readonly MAX_STATE_HISTORY = 20 // Maximum number of states to track
  private readonly DEADLOCK_CYCLE_THRESHOLD = 3 // Number of times a state must repeat to indicate deadlock
  // Enhanced AI Strategy System
  private stateTracker: GameStateTracker
  private enhancedAIStrategy: ExpertAIStrategy | null = null

  constructor(playerNames: string[], humanPlayerIndex = 0, rules: Partial<UnoRules> = {}, events: UnoGameEvents = {}, skipInitialDeal = false) {
    this.rules = { ...DEFAULT_RULES, ...rules }
    this.events = events
    this.deck = new UnoDeck((remaining) => {
      this.emitEvent('onDeckReshuffled', remaining)
    }, this.rules.debugMode)

    // Initialize enhanced AI strategy system
    this.stateTracker = new GameStateTracker()
    this.enhancedAIStrategy = new ExpertAIStrategy(this.stateTracker)

    this.initializePlayers(playerNames, humanPlayerIndex)
    if (!skipInitialDeal) {
      this.dealInitialCards()
      this.startGame()
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.rules.debugMode) {
      console.log(`[UNO] ${message}`, ...args)
    }
  }

  // Enhanced debug logging for microscopic analysis
  private debugLog(category: string, message: string, data?: any): void {
    if (this.rules.debugMode) {
      const timestamp = new Date().toISOString()
      const playerName = this.getCurrentPlayer()?.name || 'Unknown'
      const turnInfo = `[Turn ${this.turnCount}] [${playerName}]`
      const categoryTag = `[${category.toUpperCase()}]`

      console.log(`${timestamp} ${turnInfo} ${categoryTag} ${message}`, data || '')
    }
  }

  // Log game state for debugging
  private logGameState(context: string): void {
    if (!this.rules.debugMode) return

    const state = {
      currentPlayer: this.getCurrentPlayer()?.name,
      turnCount: this.turnCount,
      phase: this.phase,
      direction: this.direction,
      deckCount: this.deck.getRemainingCount(),
      discardPileCount: this.deck.getDiscardPile().length,
      topCard: this.getTopCard() ? `${this.getTopCard()!.color} ${this.getTopCard()!.value}` : 'None',
      wildColor: this.wildColor,
      drawPenalty: this.drawPenalty,
      skipNext: this.skipNext,
      consecutiveSkips: this.consecutiveSkips,
      lastPlayerWhoSkipped: this.lastPlayerWhoSkipped,
      playerHandSizes: this.players.map(p => `${p.name}: ${p.getHandSize()} cards`),
      playerHands: this.players.map(p => ({
        name: p.name,
        handSize: p.getHandSize(),
        cards: p.getHand().map(c => `${c.color} ${c.value}`),
        playableCards: this.getTopCard() ? p.getPlayableCards(this.getTopCard()!, this.wildColor || undefined).map(c => `${c.color} ${c.value}`) : []
      })),
      isDeadlock: this.isDeadlock()
    }

    this.debugLog('STATE', `Game state at ${context}:`, state)
  }

  private logEvent(event: string, data: any = {}): void {
    const logEntry = {
      timestamp: Date.now(),
      event,
      data,
    }
    this.eventLog.push(logEntry)

    // Cap event log to prevent unbounded growth
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000)
    }

    this.log(`EVENT: ${event}`, data)
  }

  private emitEvent<K extends keyof UnoGameEvents>(eventName: K, ...args: Parameters<NonNullable<UnoGameEvents[K]>>): void {
    const handler = this.events[eventName]
    if (handler) {
      try {
        (handler as any)(...args)
      } catch (error) {
        this.log(`Error in event handler ${eventName}:`, error)
      }
    }

    // Log the event
    this.logEvent(eventName as string, args)
  }

  private initializePlayers(playerNames: string[], humanPlayerIndex: number): void {
    this.players = playerNames.map((name, index) => new UnoPlayer(`player_${index}`, name, index === humanPlayerIndex))
  }

  private dealInitialCards(): void {
    // Deal 7 cards to each player
    for (let i = 0; i < 7; i++) {
      this.players.forEach((player) => {
        const card = this.deck.drawCard()
        if (card) player.addCards([card])
      })
    }
  }

  // Public method to deal one card to a specific player for animated distribution
  public dealOneCardToPlayer(playerIndex: number): UnoCard | null {
    if (playerIndex < 0 || playerIndex >= this.players.length) {
      return null
    }

    const card = this.deck.drawCard()
    if (card) {
      this.players[playerIndex].addCards([card])
      return card
    }
    return null
  }

  // Public method to start the game after initial distribution
  public startGameAfterDistribution(): void {
    this.startGame()
  }

  private startGame(): void {
    // Draw first card for discard pile
    let firstCard = this.deck.drawCard()

    // Handle all action cards as first card according to official rules
    while (firstCard?.isActionCard()) {
      if (firstCard.value === "Wild Draw Four") {
        // Wild Draw Four cannot be the first card - return to deck, shuffle, and draw new card
        this.log("Wild Draw Four as first card - returning to deck and reshuffling")
        this.deck.playCard(firstCard) // Add it back to the discard pile temporarily
        this.deck.reshuffleDiscardPile() // This will shuffle it back into the deck
        firstCard = this.deck.drawCard()
      } else {
        // Apply effect to first player for other action cards
        this.log("Action card as first card - applying effect to first player")
        this.handleFirstCardEffect(firstCard)
        break
      }
    }

    if (firstCard) {
      this.deck.playCard(firstCard)
      this.previousActiveColor = firstCard.color // Store initial active color
      this.log("Game started with card:", firstCard.color, firstCard.value)
    }
  }

  private handleFirstCardEffect(card: UnoCard): void {
    // Apply first card effects to the first player
    switch (card.value) {
      case "Skip":
        this.skipNext = true
        this.log("First card is Skip - first player is skipped")
        break
      case "Reverse":
        this.direction = "counterclockwise"
        this.log("First card is Reverse - play direction reversed")
        break
      case "Draw Two":
        this.drawPenalty = 2
        this.log("First card is Draw Two - first player draws 2")
        break
      case "Wild":
        // First player chooses color
        this.phase = "choosing_color"
        this.log("First card is Wild - first player must choose color")
        break
    }
  }

  private startUnoChallengeTimer(player: UnoPlayer): void {
    // Clear any existing timer for this player
    this.clearUnoChallengeTimer(player.id)

    // Start new timer
    const timer = setTimeout(() => {
      if (player.hasOneCard() && !player.getHasCalledUno()) {
        // Auto-penalty if UNO not called within time window
        this.log("UNO challenge timer expired - applying penalty to", player.name)
        const result = this.deck.drawCards(2)
        player.addCards(result.drawnCards)
        player.resetUnoCall()
      }
      this.unoChallengeTimers.delete(player.id)
    }, this.unoChallengeWindow)

    this.unoChallengeTimers.set(player.id, timer)
  }

  private clearUnoChallengeTimer(playerId: string): void {
    const timer = this.unoChallengeTimers.get(playerId)
    if (timer) {
      clearTimeout(timer)
      this.unoChallengeTimers.delete(playerId)
    }
  }

  // Choose color for Wild card (used when phase is "choosing_color")
  chooseColor(color: UnoColor): boolean {
    if (this.phase !== "choosing_color") return false

    this.wildColor = color
    this.phase = "playing"

    const topCard = this.getTopCard()
    if (topCard) {
      this.emitEvent('onActionCardPlayed', this.getCurrentPlayer(), topCard, `Color chosen: ${color}`)
    }

    this.log("Color chosen:", color)
    return true
  }

  /**
   * Play a card from a player's hand
   * @param playerId - ID of the player playing the card
   * @param cardId - ID of the card to play
   * @param chosenWildColor - Color chosen for wild cards
   * @param isUnoCall - Whether the player is calling UNO with this play (for smoother UX)
   * @returns true if the card was played successfully
   */
  playCard(playerId: string, cardId: string, chosenWildColor?: UnoColor, isUnoCall: boolean = false): boolean {
    this.debugLog('PLAY', `Player ${playerId} attempting to play card ${cardId}`)
    this.logGameState('before play')

    // Validate the play attempt
    const validation = this._validatePlay(playerId, cardId)
    if (!validation.isValid) {
      this.debugLog('PLAY', `Play validation failed: ${validation.reason}`)
      this.log("Play validation failed:", validation.reason)
      return false
    }

    const { player, card, isJumpIn } = validation

    // Capture the active color BEFORE any mutations for Wild Draw Four challenges
    const activeColorBeforePlay = this.wildColor || this.getTopCard()!.color

    // Remove card from player's hand and play it
    const playedCard = player!.removeCard(cardId)
    if (!playedCard) return false

    this.deck.playCard(playedCard)

    // Store the active color ONLY when playing a Wild Draw Four
    // This ensures previousActiveColor is accurate for challenge validation
    if (playedCard.value === "Wild Draw Four") {
      this.previousActiveColor = activeColorBeforePlay
    }

    // Clear wild color BEFORE applying effects to ensure previousActiveColor is accurate
    this.wildColor = null

    // Emit card played event
    this.emitEvent('onCardPlayed', player!, playedCard, chosenWildColor)

    // Update state tracker for enhanced AI
    this.stateTracker.onCardPlayed(playedCard, player!.id)

    // Handle UNO state
    this._handleUnoState(player!, isUnoCall)

    // Handle special card effects FIRST (even if this is the winning card)
    this.handleCardEffect(playedCard, chosenWildColor)

    // Check for win AFTER applying effects
    if (player!.isEmpty()) {
      this.endRound(player!)
      return true
    }

    // Reset consecutive skips counter since a card was played
    this.consecutiveSkips = 0
    this.lastPlayerWhoSkipped = null

    // Handle turn management
    this._handleTurnManagement(playerId, isJumpIn || false)

    return true
  }

  /**
   * Validate if a card can be played
   * @private
   */
  private _validatePlay(playerId: string, cardId: string): {
    isValid: boolean;
    reason?: string;
    player?: UnoPlayer;
    card?: UnoCard;
    isJumpIn?: boolean
  } {
    const player = this.players.find((p) => p.id === playerId)
    const topCard = this.deck.getTopCard()

    if (!player || !topCard) {
      return { isValid: false, reason: "Player or top card not found" }
    }

    // Check if this is a valid play (either current player's turn or jump-in)
    const isCurrentPlayer = this.getCurrentPlayer().id === playerId
    const isJumpIn = this.rules.enableJumpIn && !isCurrentPlayer && this.phase === "playing"

    if (!isCurrentPlayer && !isJumpIn) {
      return { isValid: false, reason: "Not player's turn and jump-in not allowed" }
    }

    if (this.phase !== "playing") {
      return { isValid: false, reason: `Invalid phase: ${this.phase}` }
    }

    const card = player.getHand().find((c) => c.id === cardId)
    if (!card) {
      return { isValid: false, reason: "Card not found in player's hand" }
    }

    // For jump-in, verify the card is an exact match to the top card
    if (isJumpIn) {
      if (card.color !== topCard.color || card.value !== topCard.value) {
        return { isValid: false, reason: "Jump-in failed - card must be exact match" }
      }
      this.log("Jump-in successful -", player.name, "jumps in with", card.color, card.value)
    }

    if (!card.canPlayOn(topCard, this.wildColor || undefined, player.getHand())) {
      return { isValid: false, reason: "Card cannot be played on top card" }
    }

    // Check if card can be stacked on previous action card (configurable)
    if (this.lastActionCard && this.drawPenalty > 0) {
      const canStack = (this.rules.stackDrawTwo && this.lastActionCard.value === "Draw Two" && card.value === "Draw Two") ||
        (this.rules.stackDrawFour && this.lastActionCard.value === "Wild Draw Four" && card.value === "Wild Draw Four")

      if (!canStack) {
        return { isValid: false, reason: "Cannot play non-stackable card when draw penalty is active" }
      }
    }

    // Handle Wild Draw Four challenge rule (backup verification)
    if (card.value === "Wild Draw Four") {
      // Check against the current active color (not previousActiveColor which is for challenges)
      const currentActiveColor = this.wildColor || topCard.color
      const hasMatchingColor = player.getHand().some((c) =>
        c.color === currentActiveColor && c.id !== cardId
      )
      if (hasMatchingColor) {
        return { isValid: false, reason: "Wild Draw Four validation failed - player has matching color cards" }
      }
      this.log("Wild Draw Four played legally - no matching color cards found")
    }

    return { isValid: true, player, card, isJumpIn }
  }

  /**
   * Handle UNO state when a player plays a card
   * @private
   */
  private _handleUnoState(player: UnoPlayer, isUnoCall: boolean): void {
    if (player.hasOneCard()) {
      // Check if the AI should be calling UNO on this turn.
      const shouldAutoCallUno = !player.isHuman && isUnoCall;

      if (shouldAutoCallUno || player.getHasCalledUno()) {
        // If the AI should call UNO, update its state now.
        if (shouldAutoCallUno) {
          player.callUno(); // <-- This line is the fix.
        }
        this.lastPlayerWithOneCard = player
        this.clearUnoChallengeTimer(player.id)
        this.emitEvent('onUnoCalled', player)
      } else {
        // This path is now correctly reserved for human players who forget to call UNO.
        this.startUnoChallengeTimer(player)
      }
    }
  }

  /**
   * Handle turn management after playing a card
   * @private
   */
  private _handleTurnManagement(playerId: string, isJumpIn: boolean): void {
    if (this.phase === "playing") {
      if (isJumpIn) {
        // For jump-in, set the jumping player as the current player
        const jumpInPlayerIndex = this.players.findIndex(p => p.id === playerId)
        if (jumpInPlayerIndex !== -1) {
          this.currentPlayerIndex = jumpInPlayerIndex
          this.log("Turn transferred to jumping player:", this.getCurrentPlayer().name)
        }
      } else {
        // Normal turn progression
        this.nextTurn()
      }
    }
  }

  private handleCardEffect(card: UnoCard, chosenWildColor?: UnoColor): void {
    this.debugLog('EFFECT', `Handling card effect for ${card.color} ${card.value}`)
    let effect = ""

    switch (card.value) {
      case "Skip":
        this.skipNext = true
        this.lastActionCard = card
        effect = "Skip next player"
        this.debugLog('EFFECT', 'Skip effect applied - next player will be skipped')
        break

      case "Reverse":
        this.direction = this.direction === "clockwise" ? "counterclockwise" : "clockwise"
        if (this.players.length === 2) {
          // In 2-player game, Reverse acts like Skip
          this.skipNext = true
          effect = "Skip next player (2-player Reverse)"
          this.debugLog('EFFECT', 'Reverse effect in 2-player game - next player will be skipped')
        } else {
          effect = "Reverse direction"
          this.debugLog('EFFECT', `Direction reversed to ${this.direction}`)
        }
        this.lastActionCard = card
        break

      case "Draw Two":
        // Check if we can stack on previous Draw Two
        if (this.lastActionCard?.value === "Draw Two") {
          this.drawPenalty += 2
          effect = "Stack Draw Two (+" + this.drawPenalty + ")"
          this.debugLog('EFFECT', `Draw Two stacked - penalty increased to ${this.drawPenalty}`)
        } else {
          this.drawPenalty = 2
          effect = "Draw Two"
          this.debugLog('EFFECT', 'Draw Two effect applied - penalty set to 2')
        }
        this.skipNext = true
        this.lastActionCard = card
        break

      case "Wild":
        this.wildColor = chosenWildColor || this.chooseWildColorForCurrentPlayer()
        this.lastActionCard = null // Reset action card tracking
        effect = "Wild - color changed to " + this.wildColor
        this.debugLog('EFFECT', `Wild card played - color changed to ${this.wildColor}`)
        break

      case "Wild Draw Four":
        // Check if we can stack on previous Wild Draw Four
        if (this.lastActionCard?.value === "Wild Draw Four") {
          this.drawPenalty += 4
          effect = "Stack Wild Draw Four (+" + this.drawPenalty + ")"
          this.debugLog('EFFECT', `Wild Draw Four stacked - penalty increased to ${this.drawPenalty}`)
        } else {
          this.drawPenalty = 4
          effect = "Wild Draw Four"
          this.debugLog('EFFECT', 'Wild Draw Four effect applied - penalty set to 4')
        }
        this.wildColor = chosenWildColor || this.chooseWildColorForCurrentPlayer()
        this.skipNext = true
        this.lastActionCard = card
        break

      // House Rules
      case 7:
        if (this.rules.enableSevenZero) {
          // Seven rule: current player chooses another player to swap hands with
          this.phase = "choosing_player" // Set phase to indicate player selection needed
          effect = "Seven - choose player to swap hands"
          this.debugLog('EFFECT', 'Seven effect applied - waiting for player selection')
        }
        break

      case 0:
        if (this.rules.enableSevenZero) {
          // Zero rule: rotate hands in play direction
          this.rotateHands()
          effect = "Zero - rotate hands in play direction"
          this.debugLog('EFFECT', `Zero effect applied - hands rotated in ${this.direction} direction`)
        }
        break
    }

    // Emit action card event
    if (effect) {
      this.debugLog('EFFECT', `Card effect: ${effect}`)
      this.emitEvent('onActionCardPlayed', this.getCurrentPlayer(), card, effect)
    }
  }

  // House rule: rotate hands in play direction
  private rotateHands(): void {
    const hands = this.players.map(player => [...player.getHand()])

    // Rotate hands based on direction
    if (this.direction === "clockwise") {
      // Pass hands clockwise
      for (let i = 0; i < this.players.length; i++) {
        const nextIndex = (i + 1) % this.players.length
        this.players[nextIndex].setHand(hands[i])
      }
    } else {
      // Pass hands counterclockwise
      for (let i = 0; i < this.players.length; i++) {
        const prevIndex = i === 0 ? this.players.length - 1 : i - 1
        this.players[prevIndex].setHand(hands[i])
      }
    }

    this.log("Hands rotated in", this.direction, "direction")

    const topCard = this.getTopCard()
    if (topCard) {
      this.emitEvent('onActionCardPlayed', this.getCurrentPlayer(), topCard, "Zero - rotate hands")
    }
  }

  // House rule: swap hands between two players
  swapHands(player1Id: string, player2Id: string): boolean {
    if (!this.rules.enableSevenZero || this.phase !== "choosing_player") return false
    if (player1Id === player2Id) return false

    const player1 = this.players.find((p) => p.id === player1Id)
    const player2 = this.players.find((p) => p.id === player2Id)

    if (!player1 || !player2) return false

    // Store hands
    const hand1 = [...player1.getHand()]
    const hand2 = [...player2.getHand()]

    // Swap hands
    player1.setHand(hand2)
    player2.setHand(hand1)

    // Reset phase
    this.phase = "playing"

    this.log("Hands swapped between", player1.name, "and", player2.name)

    const topCard = this.getTopCard()
    if (topCard) {
      this.emitEvent('onActionCardPlayed', this.getCurrentPlayer(), topCard, `Seven - swapped ${player1.name} & ${player2.name}`)
    }

    return true
  }

  drawCard(playerId: string): UnoCard | null {
    this.debugLog('DRAW', `Player ${playerId} attempting to draw card`)
    this.logGameState('before draw')

    const player = this.players.find((p) => p.id === playerId)
    if (!player || this.getCurrentPlayer().id !== playerId) {
      this.debugLog('DRAW', `Draw failed: invalid player or not player's turn`)
      return null
    }

    const topCard = this.getTopCard()
    if (!topCard) {
      this.debugLog('DRAW', `Draw failed: no top card available`)
      return null
    }

    this.debugLog('DRAW', `Top card: ${topCard.color} ${topCard.value}`)

    // Check if player has playable cards
    const playableCards = player.getPlayableCards(topCard, this.wildColor || undefined)
    this.debugLog('DRAW', `${player.name} has ${playableCards.length} playable cards:`,
      playableCards.map(c => `${c.color} ${c.value}`))

    // Log why player is drawing (no playable cards vs choice)
    if (playableCards.length === 0) {
      this.debugLog('DRAW', `${player.name} must draw - no playable cards available`)
    } else {
      this.debugLog('DRAW', `${player.name} choosing to draw despite having ${playableCards.length} playable cards`)
    }

    // Only forbid drawing if that house rule is enabled
    if (!this.rules.allowDrawWhenPlayable && playableCards.length > 0) {
      this.debugLog('DRAW', `Draw blocked: player has playable cards and allowDrawWhenPlayable=false`)
      this.log("Cannot draw - player has playable cards and allowDrawWhenPlayable=false")
      return null // Cannot draw when playable cards exist
    }

    const card = this.deck.drawCard()
    if (this.rules.debugMode) {
      console.log(`[DECK] Draw result: ${card ? `${card.color} ${card.value}` : 'null'}`)
    }
    if (card) {
      this.debugLog('DRAW', `${player.name} successfully drew: ${card.color} ${card.value}`)
      player.addCards([card])

      // Log updated hand after drawing
      this.debugLog('DRAW', `${player.name} hand after drawing:`, {
        handSize: player.getHandSize(),
        cards: player.getHand().map(c => `${c.color} ${c.value}`),
        newlyDrawnCard: `${card.color} ${card.value}`,
        isPlayable: card.canPlayOn(topCard, this.wildColor || undefined, [])
      })

      // Check if the drawn card is playable
      const drawnCardPlayable = card.canPlayOn(topCard, this.wildColor || undefined, [])
      this.debugLog('DRAW', `Drawn card playable: ${drawnCardPlayable}`)

      // Handle drawn card according to rules
      if (drawnCardPlayable && this.rules.mustPlayIfDrawable) {
        // Auto-play the drawn card if rule is enabled
        this.log("Auto-playing drawn card due to mustPlayIfDrawable rule")

        // Capture the active color BEFORE any mutations for Wild Draw Four challenges
        const activeColorBeforePlay = this.wildColor || this.getTopCard()!.color

        const playedCard = player.removeCard(card.id)
        if (playedCard) {
          this.deck.playCard(playedCard)

          // Store the active color ONLY when playing a Wild Draw Four
          // This ensures previousActiveColor is accurate for challenge validation
          if (playedCard.value === "Wild Draw Four") {
            this.previousActiveColor = activeColorBeforePlay
          }

          // Emit card drawn and auto-played event
          this.emitEvent('onCardDrawn', player, card, true)

          // Update state tracker for enhanced AI
          this.stateTracker.onCardDrawn(player.id, card)

          // Handle UNO call for drawn card
          if (player.hasOneCard()) {
            // For AI players, automatically call UNO when they have one card
            const shouldAutoCallUno = !player.isHuman
            if (shouldAutoCallUno || player.getHasCalledUno()) {
              this.lastPlayerWithOneCard = player
              this.clearUnoChallengeTimer(player.id)
              if (shouldAutoCallUno) {
                player.callUno()
                this.emitEvent('onUnoCalled', player)
              }
            } else {
              this.startUnoChallengeTimer(player)
            }
          }

          // Check for win
          if (player.isEmpty()) {
            this.endRound(player)
            return card
          }

          // Reset consecutive skips counter since a card was auto-played
          this.consecutiveSkips = 0
          this.lastPlayerWhoSkipped = null

          // Handle special card effects
          if (playedCard.isWildCard()) {
            // For auto-played Wild cards, we need to handle color choice
            if (player.isHuman) {
              // Human player - set phase to choosing_color and wait for input
              this.phase = "choosing_color"
              this.debugLog('DRAW', 'Auto-played Wild card - waiting for human color choice')
              return card
            } else {
              // AI player - use AI's color choice
              const aiChosenColor = player.chooseWildColor()
              this.handleCardEffect(playedCard, aiChosenColor)
            }
          } else {
            // Non-Wild card - handle normally
            this.handleCardEffect(playedCard)
          }

          // Move to next player (only if not waiting for color choice)
          if (this.phase !== "choosing_color") {
            this.nextTurn()
          }
          return card
        }
      } else {
        // Emit card drawn but not auto-played event
        this.emitEvent('onCardDrawn', player, card, false)

        // Update state tracker for enhanced AI
        this.stateTracker.onCardDrawn(player.id, card)
      }
    } else {
      // CRITICAL FIX: Handle reshuffle edge case - no cards can be drawn
      this.debugLog('DRAW', `No cards can be drawn - deck empty and cannot reshuffle`)
      this.log("No cards can be drawn - checking for deadlock immediately")

      // Track consecutive skips for deadlock detection
      this.consecutiveSkips++
      this.lastPlayerWhoSkipped = playerId
      this.debugLog('DEADLOCK', `Consecutive skips increased to ${this.consecutiveSkips}, last player who skipped: ${playerId}`)

      // CRITICAL FIX: Check for deadlock immediately and resolve it before any turn progression
      this.debugLog('DEADLOCK', 'Checking for deadlock after failed draw...')
      if (this.isDeadlock()) {
        this.debugLog('DEADLOCK', `Deadlock detected, using resolution strategy: ${this.rules.deadlockResolution}`)
        this.logGameSituation() // Log detailed game situation when deadlock is detected

        // CRITICAL FIX: Resolve deadlock immediately and return null to prevent any further processing
        if (this.rules.deadlockResolution === 'force_reshuffle') {
          this.resolveDeadlockWithReshuffle()
        } else {
          this.resolveDeadlock()
        }

        // CRITICAL FIX: Return null immediately after deadlock resolution to prevent any loop
        return null
      }

      // CRITICAL FIX: Only proceed to next turn if no deadlock was detected
      this.debugLog('DRAW', 'No deadlock detected, proceeding to next turn')
      this.nextTurn()
      return null
    }

    this.nextTurn()
    return card
  }

  callUno(playerId: string): boolean {
    const player = this.players.find((p) => p.id === playerId)
    if (!player) return false

    // Allow calling UNO even if player has more than one card (for false UNO challenges)
    player.callUno()
    return true
  }

  // Challenge a player for not calling UNO
  challengeUno(challengerId: string, targetPlayerId: string): boolean {
    const challenger = this.players.find((p) => p.id === challengerId)
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)

    if (!challenger || !targetPlayer) return false

    // Check if target player has one card and didn't call UNO
    if (targetPlayer.shouldBePenalizedForUno()) {
      // Target player gets penalty (draw 2 cards)
      const result = this.deck.drawCards(2)
      targetPlayer.addCards(result.drawnCards)
      targetPlayer.resetUnoCall()

      // Cancel the timer to prevent double penalty
      this.clearUnoChallengeTimer(targetPlayerId)

      this.log("UNO challenge successful - penalty applied to", targetPlayer.name)

      // Emit UNO challenge event
      this.emitEvent('onUnoChallenged', challenger, targetPlayer, true)

      return true
    }

    this.log("UNO challenge failed - no penalty applied")

    // Emit UNO challenge event (failed)
    this.emitEvent('onUnoChallenged', challenger, targetPlayer, false)

    return false
  }

  // Challenge a player for making a false UNO call (calling UNO when they have more than one card)
  challengeFalseUno(challengerId: string, targetPlayerId: string): boolean {
    const challenger = this.players.find((p) => p.id === challengerId)
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)

    if (!challenger || !targetPlayer) return false

    // Check if target player called UNO but has more than one card
    if (targetPlayer.getHasCalledUno() && !targetPlayer.hasOneCard()) {
      // Target player gets penalty (draw 2 cards) for false UNO call
      const result = this.deck.drawCards(2)
      targetPlayer.addCards(result.drawnCards)
      targetPlayer.resetUnoCall()

      this.log("False UNO challenge successful - penalty applied to", targetPlayer.name)

      // Emit UNO challenge event (successful false UNO challenge)
      this.emitEvent('onUnoChallenged', challenger, targetPlayer, true)

      return true
    }

    this.log("False UNO challenge failed - no penalty applied")

    // Emit UNO challenge event (failed false UNO challenge)
    this.emitEvent('onUnoChallenged', challenger, targetPlayer, false)

    return false
  }

  // Check if a player can be challenged for UNO
  canChallengeUno(targetPlayerId: string): boolean {
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)
    if (!targetPlayer) return false

    return targetPlayer.shouldBePenalizedForUno()
  }

  // Check if a player can be challenged for false UNO call
  canChallengeFalseUno(targetPlayerId: string): boolean {
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)
    if (!targetPlayer) return false

    return targetPlayer.getHasCalledUno() && !targetPlayer.hasOneCard()
  }

  // Challenge a Wild Draw Four play
  challengeWildDrawFour(challengerId: string, targetPlayerId: string): boolean {
    const challenger = this.players.find((p) => p.id === challengerId)
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)
    const topCard = this.getTopCard()

    if (!challenger || !targetPlayer) return false
    if (!topCard || topCard.value !== "Wild Draw Four") return false
    if (!this.previousActiveColor) return false

    // Check if target still has any card matching the *previous* active color
    const hasMatchingColor = targetPlayer.getHand().some(
      (c) => c.color === this.previousActiveColor
    )

    if (hasMatchingColor) {
      // Challenge succeeds: target player penalized
      const result = this.deck.drawCards(4)
      targetPlayer.addCards(result.drawnCards)
      // Clear the draw penalty since the challenge resolved it
      this.drawPenalty = 0
      // Reset skipNext so the challenger can play next (they successfully challenged)
      this.skipNext = false
      this.emitEvent("onWildDrawFourChallenged", challenger, targetPlayer, true)
      this.log("Wild Draw Four challenge SUCCESS -", targetPlayer.name, "penalized")
      return true
    } else {
      // Challenge fails: challenger penalized
      const result = this.deck.drawCards(6)
      challenger.addCards(result.drawnCards)
      // Clear the draw penalty since the 6-card penalty fulfills the original 4-card penalty
      this.drawPenalty = 0
      // Keep skipNext = true so the challenger's turn is skipped (they failed the challenge)
      this.emitEvent("onWildDrawFourChallenged", challenger, targetPlayer, false)
      this.log("Wild Draw Four challenge FAILED -", challenger.name, "penalized")
      return false
    }
  }

  // Check if Wild Draw Four can be challenged
  canChallengeWildDrawFour(targetPlayerId: string): boolean {
    const targetPlayer = this.players.find(p => p.id === targetPlayerId)
    const topCard = this.getTopCard()
    return !!(targetPlayer && topCard?.value === "Wild Draw Four" && this.previousActiveColor)
  }

  // Check if a player can jump in with a specific card
  canJumpIn(playerId: string, cardId: string): boolean {
    if (!this.rules.enableJumpIn || this.phase !== "playing") return false

    const player = this.players.find(p => p.id === playerId)
    const topCard = this.getTopCard()

    if (!player || !topCard) return false

    // Can't jump in on Wild cards - their state is unresolved until a color is chosen
    if (topCard.color === 'wild') return false

    // Can't jump in on your own turn
    if (this.getCurrentPlayer().id === playerId) return false

    const card = player.getHand().find(c => c.id === cardId)
    if (!card) return false

    // Card must be an exact match (same color and value)
    return card.color === topCard.color && card.value === topCard.value
  }

  // Get all cards a player can use to jump in
  getJumpInCards(playerId: string): UnoCard[] {
    if (!this.rules.enableJumpIn || this.phase !== "playing") return []

    const player = this.players.find(p => p.id === playerId)
    const topCard = this.getTopCard()

    if (!player || !topCard || this.getCurrentPlayer().id === playerId) return []

    // Can't jump in on Wild cards - their state is unresolved until a color is chosen
    if (topCard.color === 'wild') return []

    return player.getHand().filter(card =>
      card.color === topCard.color && card.value === topCard.value
    )
  }

  private nextTurn(): void {
    this.debugLog('TURN', 'Processing next turn')

    if (this.phase === "game_over") {
      this.debugLog('TURN', 'Game over, cannot proceed to next turn')
      return
    }

    const previousPlayer = this.getCurrentPlayer()
    let step = this.direction === "clockwise" ? 1 : -1

    if (this.skipNext) {
      this.debugLog('TURN', `Skipping next player due to skip effect`)
      const skippedPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length
      const skippedPlayer = this.players[skippedPlayerIndex]

      // Update state tracker for enhanced AI
      this.stateTracker.onPlayerSkipped(skippedPlayer.id)

      this.currentPlayerIndex = skippedPlayerIndex
      this.skipNext = false
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + step + this.players.length) % this.players.length
    const current = this.getCurrentPlayer()

    this.debugLog('TURN', `Turn changed from ${previousPlayer.name} to ${current.name} (direction: ${this.direction})`)

    // Apply pending draw penalty
    if (this.drawPenalty > 0) {
      this.debugLog('TURN', `${current.name} must draw ${this.drawPenalty} cards as penalty`)
      const result = this.deck.drawCards(this.drawPenalty)
      current.addCards(result.drawnCards)
      this.log(`${current.name} drew ${result.drawnCards.length} as penalty (requested: ${this.drawPenalty})`)
      this.debugLog('TURN', `Penalty cards drawn: ${result.drawnCards.map(c => `${c.color} ${c.value}`).join(', ')}`)

      // FIX: Update state tracker for penalty draws
      result.drawnCards.forEach(card => {
        this.stateTracker.onCardDrawn(current.id, card)
      })

      // Check if deck was exhausted during penalty
      if (result.isExhausted && result.drawnCards.length < this.drawPenalty) {
        this.debugLog('DEADLOCK', `Deck exhausted during penalty draw. Drew ${result.drawnCards.length}/${this.drawPenalty} cards.`)
        this.log(`Deck exhausted during penalty - resolving deadlock`)

        // Resolve deadlock immediately since no more cards can be drawn
        if (this.rules.deadlockResolution === 'force_reshuffle') {
          this.resolveDeadlockWithReshuffle()
        } else {
          this.resolveDeadlock()
        }
        return // Exit early to prevent further processing
      }

      this.drawPenalty = 0
    }

    // Increment turn counter for deadlock detection
    this.turnCount++
    this.debugLog('TURN', `Turn counter incremented to ${this.turnCount}`)

    // Update game state history for enhanced deadlock detection
    this.updateGameStateHistory()

    this.phase = "playing"
    this.emitEvent("onTurnChange", current, this.direction)

    this.logGameState('after turn change')
  }

  private endRound(winner: UnoPlayer): void {
    this.roundWinner = winner
    this.phase = "game_over"

    // Calculate points
    let totalPoints = 0
    this.players.forEach((player) => {
      if (player.id !== winner.id) {
        totalPoints += player.calculateHandPoints()
      }
    })

    winner.addScore(totalPoints)
    this.log("Round ended - winner:", winner.name, "points earned:", totalPoints)

    // Create scores map for event
    const scores = new Map<string, number>()
    this.players.forEach(player => {
      scores.set(player.id, player.getScore())
    })

    // Emit round end event
    this.emitEvent('onRoundEnd', winner, totalPoints, scores)

    // Check for game winner (configurable target score)
    if (winner.getScore() >= this.rules.targetScore) {
      this.winner = winner
      this.log("Game won by:", winner.name, "final score:", winner.getScore())

      // Emit game end event
      this.emitEvent('onGameEnd', winner, scores)
    } else {
      // Start new round if target score not reached
      this.log("Target score not reached, starting new round")
      setTimeout(() => {
        this.startNewRound()
      }, 1000) // Small delay for UI to show round results
    }
  }

  // Getters
  getCurrentPlayer(): UnoPlayer {
    return this.players[this.currentPlayerIndex]
  }

  getPlayers(): UnoPlayer[] {
    return [...this.players]
  }

  getTopCard(): UnoCard | null {
    return this.deck.getTopCard()
  }

  getDeckCount(): number {
    return this.deck.getRemainingCount()
  }

  getDiscardPile(): UnoCard[] {
    return this.deck.getDiscardPile()
  }

  getDirection(): GameDirection {
    return this.direction
  }

  getWildColor(): UnoColor | null {
    return this.wildColor
  }

  getPreviousActiveColor(): UnoColor | null {
    return this.previousActiveColor
  }

  getPhase(): GamePhase {
    return this.phase
  }

  getDrawPenalty(): number {
    return this.drawPenalty
  }

  getLastActionCard(): UnoCard | null {
    return this.lastActionCard
  }

  getLastPlayerWithOneCard(): UnoPlayer | null {
    return this.lastPlayerWithOneCard
  }

  getWinner(): UnoPlayer | null {
    return this.winner
  }

  getRoundWinner(): UnoPlayer | null {
    return this.roundWinner
  }

  getRules(): UnoRules {
    return { ...this.rules }
  }

  // Get deadlock detection information for debugging
  getDeadlockInfo(): {
    consecutiveSkips: number;
    lastPlayerWhoSkipped: string | null;
    turnCount: number;
    isDeadlock: boolean;
    deckCount: number;
    discardPileCount: number;
    stateHistoryLength: number;
    currentStateHash: string;
    playLoopCycleDetected: boolean;
    resourceExhaustionCycleDetected: boolean;
  } {
    return {
      consecutiveSkips: this.consecutiveSkips,
      lastPlayerWhoSkipped: this.lastPlayerWhoSkipped,
      turnCount: this.turnCount,
      isDeadlock: this.isDeadlock(),
      deckCount: this.deck.getRemainingCount(),
      discardPileCount: this.deck.getDiscardPile().length,
      stateHistoryLength: this.gameStateHistory.length,
      currentStateHash: this.gameStateHistory.length > 0 ? this.gameStateHistory[this.gameStateHistory.length - 1] : 'none',
      playLoopCycleDetected: this.detectPlayLoopCycle(),
      resourceExhaustionCycleDetected: this.detectResourceExhaustionCycle(),
    }
  }

  // Get detailed game statistics for analysis
  getDetailedGameStats(): {
    gameDuration: string;
    totalTurns: number;
    cardsPlayed: number;
    cardsDrawn: number;
    actionCards: number;
    wildCards: number;
    unoCalls: number;
    challenges: number;
    currentDirection: GameDirection;
    topCard: string;
    players: number;
    playerDetails: Array<{
      name: string;
      handSize: number;
      cards: string[];
      playableCards: string[];
      score: number;
    }>;
    deckInfo: {
      remainingCards: number;
      discardPileCount: number;
      topCard: string;
    };
    deadlockInfo: {
      consecutiveSkips: number;
      isDeadlock: boolean;
      lastPlayerWhoSkipped: string | null;
      stateHistoryLength: number;
      currentStateHash: string;
      playLoopCycleDetected: boolean;
      resourceExhaustionCycleDetected: boolean;
    };
  } {
    const topCard = this.getTopCard()
    const actionCards = this.eventLog.filter(log => log.event === 'onActionCardPlayed').length
    const wildCards = this.eventLog.filter(log =>
      log.event === 'onCardPlayed' && log.data && log.data[1] && log.data[1].color === 'wild'
    ).length
    const unoCalls = this.eventLog.filter(log => log.event === 'onUnoCalled').length
    const challenges = this.eventLog.filter(log =>
      log.event === 'onUnoChallenged' || log.event === 'onWildDrawFourChallenged'
    ).length

    return {
      gameDuration: this.calculateGameDuration(),
      totalTurns: this.turnCount,
      cardsPlayed: this.eventLog.filter(log => log.event === 'onCardPlayed').length,
      cardsDrawn: this.eventLog.filter(log => log.event === 'onCardDrawn').length,
      actionCards,
      wildCards,
      unoCalls,
      challenges,
      currentDirection: this.direction,
      topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None',
      players: this.players.length,
      playerDetails: this.players.map(p => ({
        name: p.name,
        handSize: p.getHandSize(),
        cards: p.getHand().map(c => `${c.color} ${c.value}`),
        playableCards: topCard ? p.getPlayableCards(topCard, this.wildColor || undefined).map(c => `${c.color} ${c.value}`) : [],
        score: p.getScore()
      })),
      deckInfo: {
        remainingCards: this.deck.getRemainingCount(),
        discardPileCount: this.deck.getDiscardPile().length,
        topCard: topCard ? `${topCard.color} ${topCard.value}` : 'None'
      },
      deadlockInfo: this.getDeadlockInfo()
    }
  }

  // Calculate game duration (placeholder - would need start time tracking)
  private calculateGameDuration(): string {
    // This would need to be implemented with actual start time tracking
    return "Unknown"
  }

  // Log current game situation for analysis
  logGameSituation(): void {
    if (!this.rules.debugMode) return

    const stats = this.getDetailedGameStats()
    console.log('\n=== GAME SITUATION ANALYSIS ===')
    console.log(`Turn: ${stats.totalTurns}`)
    console.log(`Current Player: ${this.getCurrentPlayer().name}`)
    console.log(`Direction: ${stats.currentDirection}`)
    console.log(`Top Card: ${stats.topCard}`)
    console.log(`Deck: ${stats.deckInfo.remainingCards} cards remaining`)
    console.log(`Discard Pile: ${stats.deckInfo.discardPileCount} cards`)
    console.log(`Consecutive Skips: ${stats.deadlockInfo.consecutiveSkips}`)
    console.log(`Is Deadlock: ${stats.deadlockInfo.isDeadlock}`)
    console.log(`State History Length: ${stats.deadlockInfo.stateHistoryLength}`)
    console.log(`Current State Hash: ${stats.deadlockInfo.currentStateHash}`)
    console.log(`Play Loop Cycle Detected: ${stats.deadlockInfo.playLoopCycleDetected}`)
    console.log(`Resource Exhaustion Cycle Detected: ${stats.deadlockInfo.resourceExhaustionCycleDetected}`)

    console.log('\n=== PLAYER DETAILS ===')
    stats.playerDetails.forEach(player => {
      console.log(`${player.name}: ${player.handSize} cards`)
      console.log(`  Cards: ${player.cards.join(', ')}`)
      console.log(`  Playable: ${player.playableCards.join(', ')}`)
      console.log(`  Score: ${player.score}`)
    })

    console.log('\n=== GAME STATISTICS ===')
    console.log(`Cards Played: ${stats.cardsPlayed}`)
    console.log(`Cards Drawn: ${stats.cardsDrawn}`)
    console.log(`Action Cards: ${stats.actionCards}`)
    console.log(`Wild Cards: ${stats.wildCards}`)
    console.log(`UNO Calls: ${stats.unoCalls}`)
    console.log(`Challenges: ${stats.challenges}`)
    console.log('================================\n')
  }

  // Generate a hash representing the current strategic game state
  // This focuses on the strategic aspects that matter for deadlock detection:
  // - Player hand sizes (sorted to be order-independent)
  // - Top card color and value
  // - Current player index
  // - Game direction
  // - Wild color (if any)
  private generateGameStateHash(): string {
    const topCard = this.getTopCard()
    const topCardInfo = topCard ? `${topCard.color}-${topCard.value}` : 'none'

    // Sort hand sizes to make the hash order-independent
    const handSizes = this.players.map(p => p.getHandSize()).sort((a, b) => a - b)

    const stateComponents = [
      `hands:${handSizes.join(',')}`,
      `top:${topCardInfo}`,
      `player:${this.currentPlayerIndex}`,
      `dir:${this.direction}`,
      `wild:${this.wildColor || 'none'}`
    ]

    return stateComponents.join('|')
  }

  // Generate a hash for resource exhaustion detection (includes deck/discard counts)
  private generateResourceStateHash(): string {
    const topCard = this.getTopCard()
    const topCardInfo = topCard ? `${topCard.color}-${topCard.value}` : 'none'

    // Sort hand sizes to make the hash order-independent
    const handSizes = this.players.map(p => p.getHandSize()).sort((a, b) => a - b)

    const stateComponents = [
      `hands:${handSizes.join(',')}`,
      `top:${topCardInfo}`,
      `player:${this.currentPlayerIndex}`,
      `dir:${this.direction}`,
      `wild:${this.wildColor || 'none'}`,
      `deck:${this.deck.getRemainingCount()}`,
      `discard:${this.deck.getDiscardPile().length}`
    ]

    return stateComponents.join('|')
  }

  // Add current game state to history and check for cycles
  private updateGameStateHistory(): void {
    const currentStateHash = this.generateGameStateHash()
    const currentResourceHash = this.generateResourceStateHash()

    // Add to play-loop detection history (strategic state only)
    this.gameStateHistory.push(currentStateHash)

    // Add to resource exhaustion detection history (includes deck/discard counts)
    this.resourceStateHistory.push(currentResourceHash)

    // Keep only the most recent states
    if (this.gameStateHistory.length > this.MAX_STATE_HISTORY) {
      this.gameStateHistory = this.gameStateHistory.slice(-this.MAX_STATE_HISTORY)
    }

    if (this.resourceStateHistory.length > this.MAX_STATE_HISTORY) {
      this.resourceStateHistory = this.resourceStateHistory.slice(-this.MAX_STATE_HISTORY)
    }

    this.debugLog('STATE_HASH', `Current strategic state hash: ${currentStateHash}`)
    this.debugLog('RESOURCE_HASH', `Current resource state hash: ${currentResourceHash}`)
  }

  // Check if the current strategic state indicates a play-loop cycle
  private detectPlayLoopCycle(): boolean {
    if (this.gameStateHistory.length < this.DEADLOCK_CYCLE_THRESHOLD) {
      return false
    }

    const currentState = this.gameStateHistory[this.gameStateHistory.length - 1]
    const occurrences = this.gameStateHistory.filter(state => state === currentState).length

    if (occurrences >= this.DEADLOCK_CYCLE_THRESHOLD) {
      this.debugLog('DEADLOCK', `Play-loop cycle detected: strategic state ${currentState} has appeared ${occurrences} times`)
      return true
    }

    return false
  }

  // Check if the current resource state indicates a resource exhaustion cycle
  private detectResourceExhaustionCycle(): boolean {
    if (this.resourceStateHistory.length < this.DEADLOCK_CYCLE_THRESHOLD) {
      return false
    }

    const currentResourceState = this.resourceStateHistory[this.resourceStateHistory.length - 1]
    const occurrences = this.resourceStateHistory.filter(state => state === currentResourceState).length

    if (occurrences >= this.DEADLOCK_CYCLE_THRESHOLD) {
      this.debugLog('DEADLOCK', `Resource exhaustion cycle detected: resource state ${currentResourceState} has appeared ${occurrences} times`)
      return true
    }

    return false
  }

  // Check for deadlock conditions
  private isDeadlock(): boolean {
    this.debugLog('DEADLOCK', 'Checking for deadlock conditions...')

    // ENHANCEMENT: Check for play-loop cycles (strategic state only)
    // This catches scenarios where players are trading the same cards back and forth
    if (this.detectPlayLoopCycle()) {
      this.debugLog('DEADLOCK', 'DEADLOCK DETECTED: Play-loop cycle detected - players are stuck in a strategic loop')
      this.log("DEADLOCK DETECTED: Play-loop cycle detected - players are stuck in a strategic loop")
      return true
    }

    // ENHANCEMENT: Check for resource exhaustion cycles (includes deck/discard counts)
    // This catches scenarios where the game is stuck due to resource constraints
    if (this.detectResourceExhaustionCycle()) {
      this.debugLog('DEADLOCK', 'DEADLOCK DETECTED: Resource exhaustion cycle detected - game is stuck due to resource constraints')
      this.log("DEADLOCK DETECTED: Resource exhaustion cycle detected - game is stuck due to resource constraints")
      return true
    }

    // CRITICAL FIX: Enhanced deadlock detection for the specific AI loop scenario
    // Check if deck is empty and discard pile has ≤1 card (the exact scenario from the bug report)
    if (this.deck.getRemainingCount() === 0 && this.deck.getDiscardPile().length <= 1) {
      this.debugLog('DEADLOCK', 'Empty deck detected, checking if any player can play top card')

      // Check if any player can play the top card
      const topCard = this.getTopCard()
      if (!topCard) {
        // CRITICAL FIX: If there's no top card and deck is empty, this is a deadlock
        // This handles the case where both deck and discard pile are empty
        this.debugLog('DEADLOCK', 'DEADLOCK DETECTED: No top card available, deck empty, discard pile empty')
        this.log("DEADLOCK DETECTED: No top card available, deck empty, discard pile empty")
        return true
      }

      const playerPlayability = this.players.map(player => {
        const playableCards = player.getPlayableCards(topCard, this.wildColor || undefined)
        return {
          player: player.name,
          canPlay: playableCards.length > 0,
          playableCount: playableCards.length,
          playableCards: playableCards.map(c => `${c.color} ${c.value}`)
        }
      })

      this.debugLog('DEADLOCK', 'Player playability analysis:', playerPlayability)

      const canAnyPlayerPlay = playerPlayability.some(p => p.canPlay)

      // CRITICAL FIX: If no player can play and deck is empty, we have a deadlock
      // This is the exact scenario described in the bug report
      if (!canAnyPlayerPlay) {
        this.debugLog('DEADLOCK', 'DEADLOCK DETECTED: No players can play, deck empty, discard pile has ≤1 card')
        this.log("DEADLOCK DETECTED: No players can play, deck empty, discard pile has ≤1 card")
        return true
      } else {
        this.debugLog('DEADLOCK', 'At least one player can play, no deadlock')
      }
    }

    // CRITICAL FIX: Enhanced consecutive skips detection
    // Check for consecutive skips equal to number of players (full cycle with no progress)
    if (this.consecutiveSkips >= this.players.length) {
      this.debugLog('DEADLOCK', `DEADLOCK DETECTED: Full cycle completed with no cards played (${this.consecutiveSkips} skips >= ${this.players.length} players)`)
      this.log("DEADLOCK DETECTED: Full cycle completed with no cards played")
      return true
    }

    // CRITICAL FIX: Enhanced timeout detection for AI loop prevention
    // Check for turn timeout (safety mechanism) - reduced from 200 to 100 for faster detection
    if (this.turnCount > 100) {
      this.debugLog('DEADLOCK', `DEADLOCK DETECTED: Turn count exceeded 100 (current: ${this.turnCount})`)
      this.log("DEADLOCK DETECTED: Turn count exceeded 100")
      return true
    }

    // CRITICAL FIX: Additional check for rapid consecutive failed draws
    // If the same player has been the last to skip multiple times in a row, it might indicate a loop
    if (this.consecutiveSkips >= 3 && this.lastPlayerWhoSkipped) {
      const currentPlayer = this.getCurrentPlayer()
      if (currentPlayer.id === this.lastPlayerWhoSkipped) {
        this.debugLog('DEADLOCK', `DEADLOCK DETECTED: Same player (${currentPlayer.name}) has been skipping repeatedly`)
        this.log("DEADLOCK DETECTED: Same player has been skipping repeatedly")
        return true
      }
    }

    this.debugLog('DEADLOCK', 'No deadlock conditions detected')
    return false
  }

  // Resolve deadlock by ending the round
  private resolveDeadlock(): void {
    this.debugLog('RESOLUTION', 'Resolving deadlock by ending round')
    this.log("Resolving deadlock - ending round")

    // Analyze all players for winner selection
    const playerAnalysis = this.players.map(player => ({
      name: player.name,
      handSize: player.getHandSize(),
      score: player.getScore(),
      handCards: player.getHand().map(c => `${c.color} ${c.value}`)
    }))

    this.debugLog('RESOLUTION', 'Player analysis for winner selection:', playerAnalysis)

    // Find player with fewest cards (winner)
    let winner = this.players[0]
    let minCards = winner.getHandSize()

    for (const player of this.players) {
      const handSize = player.getHandSize()
      if (handSize < minCards) {
        minCards = handSize
        winner = player
      }
    }

    this.debugLog('RESOLUTION', `Initial winner candidate: ${winner.name} with ${minCards} cards`)

    // If tied, choose player with lowest points
    const tiedPlayers = this.players.filter(player => player.getHandSize() === minCards)
    if (tiedPlayers.length > 1) {
      this.debugLog('RESOLUTION', `Tie detected with ${tiedPlayers.length} players having ${minCards} cards each`)
      const tieAnalysis = tiedPlayers.map(p => ({ name: p.name, score: p.getScore() }))
      this.debugLog('RESOLUTION', 'Tie analysis:', tieAnalysis)

      winner = tiedPlayers.reduce((a, b) => a.getScore() < b.getScore() ? a : b)
      this.debugLog('RESOLUTION', `Tie broken: ${winner.name} wins with lowest score (${winner.getScore()})`)
    }

    this.debugLog('RESOLUTION', `Final winner: ${winner.name} with ${minCards} cards`)
    this.log(`Deadlock resolved: ${winner.name} wins with ${minCards} cards`)
    this.endRound(winner)
  }

  // Alternative deadlock resolution: force reshuffle and continue
  private resolveDeadlockWithReshuffle(): void {
    this.log("Resolving deadlock with force reshuffle")

    // Force reshuffle the discard pile
    this.deck.forceReshuffle()

    // Reset deadlock counters
    this.consecutiveSkips = 0
    this.lastPlayerWhoSkipped = null

    // Reset state history for enhanced deadlock detection
    this.gameStateHistory = []
    this.resourceStateHistory = []

    this.log("Deadlock resolved with force reshuffle - game continues")
  }

  // Get complete game state snapshot for UI/multiplayer sync
  getState(): any {
    return {
      players: this.players.map((player, index) => ({
        id: player.id,
        name: player.name,
        isHuman: player.isHuman,
        handSize: player.getHandSize(),
        score: player.getScore(),
        hasCalledUno: player.getHasCalledUno(),
        hasOneCard: player.hasOneCard(),
        turnOrder: index, // Add turn order for easier UI
      })),
      currentPlayer: {
        id: this.getCurrentPlayer().id,
        name: this.getCurrentPlayer().name,
        turnOrder: this.currentPlayerIndex,
      },
      gameState: {
        phase: this.phase,
        direction: this.direction,
        wildColor: this.wildColor,
        drawPenalty: this.drawPenalty,
        skipNext: this.skipNext,
        deckCount: this.getDeckCount(),
        topCard: this.getTopCard() ? {
          color: this.getTopCard()!.color,
          value: this.getTopCard()!.value,
        } : null,
        lastActionCard: this.lastActionCard ? {
          color: this.lastActionCard.color,
          value: this.lastActionCard.value,
        } : null,
        discardPile: this.rules.showDiscardPile ? this.deck.getDiscardPile().map(card => ({
          color: card.color,
          value: card.value,
        })) : [],
        jumpInEnabled: this.rules.enableJumpIn,
      },
      roundInfo: {
        roundWinner: this.roundWinner ? {
          id: this.roundWinner.id,
          name: this.roundWinner.name,
        } : null,
        gameWinner: this.winner ? {
          id: this.winner.id,
          name: this.winner.name,
        } : null,
        isGameOver: this.isGameOver(),
      },
      rules: this.getRules(),
    }
  }

  // Simplified state export for AI/clients
  getSimpleState() {
    return {
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        handSize: p.getHandSize(),
        score: p.getScore(),
        isHuman: p.isHuman,
      })),
      currentPlayerId: this.getCurrentPlayer().id,
      direction: this.direction,
      topCard: this.getTopCard(),
      wildColor: this.wildColor,
      phase: this.phase,
      discardPile: this.rules.showDiscardPile ? this.deck.getDiscardPile().map(card => ({
        color: card.color,
        value: card.value,
      })) : [],
    }
  }

  // Get player's hand for UI sync
  getPlayerHand(playerId: string): UnoCard[] | null {
    const player = this.players.find(p => p.id === playerId)
    return player ? player.getHand() : null
  }

  // Get event log for replay/debugging
  getEventLog(): Array<{ timestamp: number; event: string; data: any }> {
    return [...this.eventLog]
  }

  // Clear event log (useful for new games)
  clearEventLog(): void {
    this.eventLog = []
  }

  isGameOver(): boolean {
    return this.phase === "game_over"
  }

  // Start a new round (keep scores, reset hands and deck)
  startNewRound(): void {
    this.log("Starting new round")

    // Reset game state
    this.deck = new UnoDeck()
    this.currentPlayerIndex = 0
    this.direction = "clockwise"
    this.wildColor = null
    this.previousActiveColor = null
    this.phase = "playing"
    this.roundWinner = null
    this.skipNext = false
    this.drawPenalty = 0
    this.lastPlayerWithOneCard = null
    this.lastActionCard = null

    // Reset deadlock detection counters
    this.consecutiveSkips = 0
    this.lastPlayerWhoSkipped = null
    this.turnCount = 0

    // Reset state history for enhanced deadlock detection
    this.gameStateHistory = []

    // Reset enhanced AI state tracker
    this.stateTracker.reset()

    // Clear all UNO challenge timers
    this.unoChallengeTimers.forEach((timer) => clearTimeout(timer))
    this.unoChallengeTimers.clear()

    // Reset all players
    this.players.forEach((player) => {
      player.resetUnoCall()
    })

    // Deal new hands
    this.dealInitialCards()
    this.startGame()

    this.log("New round started")
  }

  // Restart the entire game (reset scores too)
  restartGame(): void {
    this.log("Restarting entire game")

    // Reset all player scores
    this.players.forEach((player) => {
      player.addScore(-player.getScore()) // Reset score to 0
    })

    this.winner = null
    this.startNewRound()

    this.log("Game restarted")
  }

  // AI turn logic
  playAITurn(): boolean {
    const currentPlayer = this.getCurrentPlayer()
    this.debugLog('AI', `AI turn initiated for ${currentPlayer.name}`)
    this.log(
      "playAITurn - current player:",
      currentPlayer.name,
      "isHuman:",
      currentPlayer.isHuman,
      "phase:",
      this.phase,
    )

    if (currentPlayer.isHuman || this.phase !== "playing") {
      this.debugLog('AI', `AI turn blocked - isHuman: ${currentPlayer.isHuman}, phase: ${this.phase}`)
      this.log("playAITurn early return - isHuman:", currentPlayer.isHuman, "phase:", this.phase)
      return false
    }

    // Add realistic AI delay based on difficulty
    const delay = this.getAIDelay()
    this.debugLog('AI', `AI thinking for ${delay}ms (difficulty: ${this.rules.aiDifficulty})`)
    this.log("AI thinking for", delay, "ms...")

    setTimeout(() => {
      this.executeAITurn(currentPlayer)
    }, delay)

    return true // Return true to indicate AI turn is in progress
  }

  // Pure AI decision function (for testing/simulation)
  decideAITurn(): { action: 'play' | 'draw'; cardId?: string; chosenColor?: UnoColor } | null {
    const currentPlayer = this.getCurrentPlayer()
    const topCard = this.getTopCard()

    if (!topCard) return null

    // Try to play a card
    const cardToPlay = this.chooseAICard(currentPlayer, topCard)
    if (cardToPlay) {
      let chosenColor: UnoColor | undefined
      if (cardToPlay.isWildCard()) {
        chosenColor = currentPlayer.chooseWildColor()
      }
      return { action: 'play', cardId: cardToPlay.id, chosenColor }
    }

    // Must draw
    return { action: 'draw' }
  }

  // Apply AI decision (pure function)
  applyAIAction(action: { action: 'play' | 'draw'; cardId?: string; chosenColor?: UnoColor }): boolean {
    if (action.action === 'play' && action.cardId) {
      const currentPlayer = this.getCurrentPlayer()
      // Check if this play will leave the AI with exactly one card (should call UNO)
      const willHaveOneCard = currentPlayer.getHandSize() === 2
      return this.playCard(this.getCurrentPlayer().id, action.cardId, action.chosenColor, willHaveOneCard)
    } else if (action.action === 'draw') {
      return this.drawCard(this.getCurrentPlayer().id) !== null
    }
    return false
  }

  private getAIDelay(): number {
    // Base delay with some randomness for realism
    const baseDelays = {
      easy: 1000,
      normal: 1500,
      hard: 2000,
      expert: 2500,
    }

    const baseDelay = baseDelays[this.rules.aiDifficulty] || 1500
    const randomFactor = 0.5 + Math.random() * 1.0 // 0.5x to 1.5x base delay

    return Math.floor(baseDelay * randomFactor)
  }

  private executeAITurn(currentPlayer: UnoPlayer): void {
    this.debugLog('AI', `${currentPlayer.name} making AI decision...`)

    // Log current hand and playable cards before decision
    const topCard = this.getTopCard()
    if (topCard) {
      const playableCards = currentPlayer.getPlayableCards(topCard, this.wildColor || undefined)
      this.debugLog('AI', `${currentPlayer.name} decision analysis:`, {
        handSize: currentPlayer.getHandSize(),
        handCards: currentPlayer.getHand().map(c => `${c.color} ${c.value}`),
        topCard: `${topCard.color} ${topCard.value}`,
        wildColor: this.wildColor,
        playableCards: playableCards.map(c => `${c.color} ${c.value}`),
        playableCount: playableCards.length
      })
    }

    const decision = this.decideAITurn()
    if (!decision) {
      this.debugLog('AI', `${currentPlayer.name} could not decide on action - no playable cards and must draw`)
      this.log("AI could not decide on action")
      return
    }

    this.debugLog('AI', `${currentPlayer.name} decided to ${decision.action}`, decision)
    const success = this.applyAIAction(decision)
    this.debugLog('AI', `${currentPlayer.name} action result: ${success}`)
    this.log("AI action result:", success, "action:", decision.action)
  }

  // Enhanced AI card selection based on difficulty
  private chooseAICard(player: UnoPlayer, topCard: UnoCard): UnoCard | null {
    const playableCards = player.getPlayableCards(topCard, this.wildColor || undefined)
    this.debugLog('AI', `${player.name} has ${playableCards.length} playable cards:`,
      playableCards.map(c => `${c.color} ${c.value}`))

    if (playableCards.length === 0) {
      this.debugLog('AI', `${player.name} has no playable cards`)
      return null
    }

    let selectedCard: UnoCard | null = null
    switch (this.rules.aiDifficulty) {
      case 'easy':
        selectedCard = this.easyAIStrategy(playableCards)
        this.debugLog('AI', `${player.name} using easy strategy`)
        break
      case 'normal':
        selectedCard = this.normalAIStrategy(playableCards, topCard)
        this.debugLog('AI', `${player.name} using normal strategy`)
        break
      case 'hard':
        selectedCard = this.hardAIStrategy(playableCards, topCard, player)
        this.debugLog('AI', `${player.name} using hard strategy`)
        break
      case 'expert':
        selectedCard = this.enhancedExpertAIStrategy(playableCards, topCard, player)
        this.debugLog('AI', `${player.name} using enhanced expert strategy`)
        break
      default:
        selectedCard = this.normalAIStrategy(playableCards, topCard)
        this.debugLog('AI', `${player.name} using default normal strategy`)
    }

    if (selectedCard) {
      this.debugLog('AI', `${player.name} selected: ${selectedCard.color} ${selectedCard.value}`)
    }

    return selectedCard
  }

  // Consolidated AI strategy methods with enhanced context awareness
  private easyAIStrategy(playableCards: UnoCard[]): UnoCard | null {
    // Random selection
    return playableCards[Math.floor(Math.random() * playableCards.length)]
  }

  private normalAIStrategy(playableCards: UnoCard[], topCard: UnoCard): UnoCard | null {
    // Enhanced strategy with better prioritization
    const normalCards = playableCards.filter((card) => !card.isActionCard() && !card.isWildCard())
    const actionCards = playableCards.filter((card) => card.isActionCard() && !card.isWildCard())
    const wildCards = playableCards.filter((card) => card.isWildCard())

    // 1. Prefer normal cards (numbers) over action cards and wilds
    if (normalCards.length > 0) {
      // Prefer color matches over number matches
      const colorMatches = normalCards.filter((card) => card.color === (this.wildColor || topCard.color))
      if (colorMatches.length > 0) {
        return colorMatches[Math.floor(Math.random() * colorMatches.length)]
      }
      return normalCards[Math.floor(Math.random() * normalCards.length)]
    }

    // 2. Prefer action cards over wilds (but be strategic about it)
    if (actionCards.length > 0) {
      // Prefer color matches for action cards
      const colorMatches = actionCards.filter((card) => card.color === (this.wildColor || topCard.color))
      if (colorMatches.length > 0) {
        return colorMatches[Math.floor(Math.random() * colorMatches.length)]
      }
      return actionCards[Math.floor(Math.random() * actionCards.length)]
    }

    // 3. Wild cards as last resort - choose best color strategically
    if (wildCards.length > 0) {
      return wildCards[Math.floor(Math.random() * wildCards.length)]
    }

    return playableCards[Math.floor(Math.random() * playableCards.length)]
  }

  private hardAIStrategy(playableCards: UnoCard[], topCard: UnoCard, player: UnoPlayer): UnoCard | null {
    const nextPlayer = this.getNextPlayer()

    // Check if next player is close to winning
    const nextPlayerCardCount = nextPlayer.getHandSize()
    const shouldBlock = nextPlayerCardCount <= 2

    // Prefer action cards if next player is close to winning
    if (shouldBlock) {
      const actionCards = playableCards.filter((card) => card.isActionCard() && !card.isWildCard())
      if (actionCards.length > 0) {
        return actionCards[Math.floor(Math.random() * actionCards.length)]
      }
    }

    // Otherwise use normal strategy with some randomness
    const randomFactor = Math.random()
    if (randomFactor < 0.7) {
      return this.normalAIStrategy(playableCards, topCard)
    } else {
      return this.easyAIStrategy(playableCards)
    }
  }

  private expertAIStrategy(playableCards: UnoCard[], topCard: UnoCard, player: UnoPlayer): UnoCard | null {
    const nextPlayer = this.getNextPlayer()
    const nextPlayerCardCount = nextPlayer.getHandSize()

    // Expert strategy: consider multiple factors
    const shouldBlock = nextPlayerCardCount <= 2
    const shouldConserveActionCards = player.getHandSize() > 5
    const hasMultipleOptions = playableCards.length > 3

    // If next player is close to winning, prioritize blocking
    if (shouldBlock) {
      const actionCards = playableCards.filter((card) => card.isActionCard() && !card.isWildCard())
      if (actionCards.length > 0) {
        // Prefer Skip over Draw Two if we have both
        const skipCards = actionCards.filter(card => card.value === "Skip")
        if (skipCards.length > 0) return skipCards[0]
        return actionCards[0]
      }
    }

    // If we have many cards and many options, conserve action cards
    if (shouldConserveActionCards && hasMultipleOptions) {
      const nonActionCards = playableCards.filter((card) => !card.isActionCard())
      if (nonActionCards.length > 0) {
        // Prefer color matches to reduce hand variety
        const colorMatches = nonActionCards.filter((card) => card.color === topCard.color)
        if (colorMatches.length > 0) return colorMatches[0]
        return nonActionCards[0]
      }
    }

    // Default to hard strategy
    return this.hardAIStrategy(playableCards, topCard, player)
  }

  // Enhanced Expert AI Strategy using the new strategy system
  private enhancedExpertAIStrategy(playableCards: UnoCard[], topCard: UnoCard, player: UnoPlayer): UnoCard | null {
    if (!this.enhancedAIStrategy) {
      // Fallback to original expert strategy if enhanced strategy is not available
      return this.expertAIStrategy(playableCards, topCard, player)
    }

    // Get current game state for the enhanced AI using the new interface
    const gameStateForAI: IAIGameState = {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handSize: p.getHandSize(),
        isHuman: p.isHuman
      })),
      currentPlayerId: this.getCurrentPlayer().id,
      topCard: this.getTopCard(),
      wildColor: this.wildColor,
      direction: this.direction,
    }

    // Use the enhanced AI strategy
    return this.enhancedAIStrategy.chooseCard(playableCards, gameStateForAI, player)
  }

  // Enhanced wild color selection for AI players
  private chooseWildColorForCurrentPlayer(): UnoColor {
    const currentPlayer = this.getCurrentPlayer()

    // Use enhanced AI strategy for expert difficulty AI players
    if (!currentPlayer.isHuman && this.rules.aiDifficulty === 'expert' && this.enhancedAIStrategy) {
      const gameStateForAI: IAIGameState = {
        players: this.players.map(p => ({
          id: p.id,
          name: p.name,
          handSize: p.getHandSize(),
          isHuman: p.isHuman
        })),
        currentPlayerId: this.getCurrentPlayer().id,
        topCard: this.getTopCard(),
        wildColor: this.wildColor,
        direction: this.direction,
      }
      return this.enhancedAIStrategy.chooseWildColor(currentPlayer.getHand(), gameStateForAI, currentPlayer)
    }

    // Fallback to original player method
    return currentPlayer.chooseWildColor()
  }

  public getNextPlayer(): UnoPlayer {
    const nextIndex = this.getNextPlayerIndex()
    return this.players[nextIndex]
  }

  private getNextPlayerIndex(fromIndex?: number): number {
    const currentIndex = fromIndex ?? this.currentPlayerIndex
    const playerCount = this.players.length
    this.log(
      "getNextPlayerIndex - from:",
      currentIndex,
      "direction:",
      this.direction,
      "playerCount:",
      playerCount,
    )

    let nextIndex: number
    if (this.direction === "clockwise") {
      nextIndex = (currentIndex + 1) % playerCount
    } else {
      nextIndex = currentIndex === 0 ? playerCount - 1 : currentIndex - 1
    }

    this.log("Calculated next index:", nextIndex)
    return nextIndex
  }
}
