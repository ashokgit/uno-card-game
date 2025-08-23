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
  targetScore: number
  debugMode: boolean
  aiDifficulty: 'easy' | 'normal' | 'hard' | 'expert'
  enableJumpIn: boolean
  enableSevenZero: boolean
  enableSwapHands: boolean
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

export const DEFAULT_RULES: UnoRules = {
  stackDrawTwo: false, // Official rules: no stacking
  stackDrawFour: false, // Official rules: no stacking
  mustPlayIfDrawable: false, // Official rules: player chooses
  targetScore: 500,
  debugMode: false,
  aiDifficulty: 'normal',
  enableJumpIn: false,
  enableSevenZero: false,
  enableSwapHands: false,
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

  canPlayOn(topCard: UnoCard, wildColor?: UnoColor): boolean {
    // Wild cards can always be played
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

  constructor() {
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
      this.reshuffleDiscardPile()
    }
    return this.cards.pop() || null
  }

  drawCards(count: number): UnoCard[] {
    const drawnCards: UnoCard[] = []
    for (let i = 0; i < count; i++) {
      const card = this.drawCard()
      if (card) drawnCards.push(card)
    }
    return drawnCards
  }

  private reshuffleDiscardPile(): void {
    if (this.discardPile.length <= 1) return

    // Keep top card, shuffle rest back into deck
    const topCard = this.discardPile.pop()!
    this.cards = [...this.discardPile]
    this.discardPile = [topCard]
    this.shuffle()

    // Note: We can't emit events from here since UnoDeck doesn't have access to events
    // The parent UnoGame will need to handle this if needed
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
    return this.hand.filter((card) => card.canPlayOn(topCard, wildColor))
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

  // AI logic for computer players
  chooseCardToPlay(topCard: UnoCard, wildColor?: UnoColor): UnoCard | null {
    const playableCards = this.getPlayableCards(topCard, wildColor)
    if (playableCards.length === 0) return null

    // AI strategy: prefer action cards, then matching color, then matching number
    const actionCards = playableCards.filter((card) => card.isActionCard() && !card.isWildCard())
    if (actionCards.length > 0) {
      return actionCards[Math.floor(Math.random() * actionCards.length)]
    }

    const colorMatches = playableCards.filter((card) => card.color === topCard.color)
    if (colorMatches.length > 0) {
      return colorMatches[Math.floor(Math.random() * colorMatches.length)]
    }

    return playableCards[Math.floor(Math.random() * playableCards.length)]
  }

  chooseWildColor(): UnoColor {
    // AI chooses color based on most cards in hand
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 }
    this.hand.forEach((card) => {
      if (card.color !== "wild") {
        colorCounts[card.color as keyof typeof colorCounts]++
      }
    })

    const maxColor = Object.entries(colorCounts).reduce((a, b) =>
      colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b,
    )[0] as UnoColor

    return maxColor
  }
}

export type GameDirection = "clockwise" | "counterclockwise"
export type GamePhase = "playing" | "waiting" | "drawing" | "choosing_color" | "game_over"

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
  private unoChallengeTimers: Map<string, NodeJS.Timeout> = new Map() // Track UNO challenge timers
  private events: UnoGameEvents

  constructor(playerNames: string[], humanPlayerIndex = 0, rules: Partial<UnoRules> = {}, events: UnoGameEvents = {}) {
    this.rules = { ...DEFAULT_RULES, ...rules }
    this.events = events
    this.deck = new UnoDeck()
    this.initializePlayers(playerNames, humanPlayerIndex)
    this.dealInitialCards()
    this.startGame()
  }

  private log(message: string, ...args: any[]): void {
    if (this.rules.debugMode) {
      console.log(`[UNO] ${message}`, ...args)
    }
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

  private startGame(): void {
    // Draw first card for discard pile
    let firstCard = this.deck.drawCard()

    // Handle all action cards as first card according to official rules
    while (firstCard?.isActionCard()) {
      if (firstCard.value === "Wild Draw Four") {
        // Wild Draw Four cannot be the first card - reshuffle
        this.log("Wild Draw Four as first card - reshuffling")
        this.deck = new UnoDeck()
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
        const penaltyCards = this.deck.drawCards(2)
        player.addCards(penaltyCards)
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

  playCard(playerId: string, cardId: string, chosenWildColor?: UnoColor): boolean {
    const player = this.players.find((p) => p.id === playerId)
    const topCard = this.deck.getTopCard()

    if (!player || !topCard || this.phase !== "playing") return false
    if (this.getCurrentPlayer().id !== playerId) return false

    const card = player.getHand().find((c) => c.id === cardId)
    if (!card || !card.canPlayOn(topCard, this.wildColor || undefined)) return false

    // Store the current active color before playing the card
    this.previousActiveColor = this.wildColor || topCard.color

    // Check if card can be stacked on previous action card (configurable)
    if (this.lastActionCard && this.drawPenalty > 0) {
      const canStack = (this.rules.stackDrawTwo && this.lastActionCard.value === "Draw Two" && card.value === "Draw Two") ||
        (this.rules.stackDrawFour && this.lastActionCard.value === "Wild Draw Four" && card.value === "Wild Draw Four")

      if (!canStack) {
        // Cannot play non-stackable card when draw penalty is active
        this.log("Cannot play non-stackable card when draw penalty is active")
        return false
      }
    }

    // Handle Wild Draw Four challenge rule
    if (card.value === "Wild Draw Four") {
      const hasMatchingColor = player.getHand().some((c) =>
        c.color === this.previousActiveColor && c.id !== cardId
      )
      if (hasMatchingColor) {
        // Player has a matching color card - they shouldn't play Wild Draw Four
        // This will be challenged by the next player
        this.log("Wild Draw Four played but player has matching color - challengeable")
      }
    }

    // Remove card from player's hand and play it
    const playedCard = player.removeCard(cardId)
    if (!playedCard) return false

    this.deck.playCard(playedCard)
    this.wildColor = null

    // Emit card played event
    this.emitEvent('onCardPlayed', player, playedCard, chosenWildColor)

    // Handle UNO call with proper timing
    if (player.hasOneCard()) {
      if (!player.getHasCalledUno()) {
        // Start UNO challenge timer instead of immediate penalty
        this.startUnoChallengeTimer(player)
      } else {
        // Player called UNO correctly
        this.lastPlayerWithOneCard = player
        this.clearUnoChallengeTimer(player.id)
        this.emitEvent('onUnoCalled', player)
      }
    }

    // Check for win
    if (player.isEmpty()) {
      this.endRound(player)
      return true
    }

    // Handle special card effects
    this.handleCardEffect(playedCard, chosenWildColor)

    // Move to next player
    this.nextTurn()

    return true
  }

  private handleCardEffect(card: UnoCard, chosenWildColor?: UnoColor): void {
    let effect = ""

    switch (card.value) {
      case "Skip":
        this.skipNext = true
        this.lastActionCard = card
        effect = "Skip next player"
        break

      case "Reverse":
        this.direction = this.direction === "clockwise" ? "counterclockwise" : "clockwise"
        if (this.players.length === 2) {
          // In 2-player game, Reverse acts like Skip
          this.skipNext = true
          effect = "Skip next player (2-player Reverse)"
        } else {
          effect = "Reverse direction"
        }
        this.lastActionCard = card
        break

      case "Draw Two":
        // Check if we can stack on previous Draw Two
        if (this.lastActionCard?.value === "Draw Two") {
          this.drawPenalty += 2
          effect = "Stack Draw Two (+" + this.drawPenalty + ")"
        } else {
          this.drawPenalty = 2
          effect = "Draw Two"
        }
        this.skipNext = true
        this.lastActionCard = card
        break

      case "Wild":
        this.wildColor = chosenWildColor || "red"
        this.lastActionCard = null // Reset action card tracking
        effect = "Wild - color changed to " + this.wildColor
        break

      case "Wild Draw Four":
        // Check if we can stack on previous Wild Draw Four
        if (this.lastActionCard?.value === "Wild Draw Four") {
          this.drawPenalty += 4
          effect = "Stack Wild Draw Four (+" + this.drawPenalty + ")"
        } else {
          this.drawPenalty = 4
          effect = "Wild Draw Four"
        }
        this.wildColor = chosenWildColor || "red"
        this.skipNext = true
        this.lastActionCard = card
        break
    }

    // Emit action card event
    if (effect) {
      this.emitEvent('onActionCardPlayed', this.getCurrentPlayer(), card, effect)
    }
  }

  drawCard(playerId: string): UnoCard | null {
    const player = this.players.find((p) => p.id === playerId)
    if (!player || this.getCurrentPlayer().id !== playerId) return null

    const topCard = this.getTopCard()
    if (!topCard) return null

    // Check if player has playable cards
    const playableCards = player.getPlayableCards(topCard, this.wildColor || undefined)

    // Only allow drawing if no playable cards exist
    if (playableCards.length > 0) {
      this.log("Cannot draw - player has playable cards:", playableCards.length)
      return null // Cannot draw when playable cards exist
    }

    const card = this.deck.drawCard()
    if (card) {
      player.addCards([card])

      // Check if the drawn card is playable
      const drawnCardPlayable = card.canPlayOn(topCard, this.wildColor || undefined)

      // Handle drawn card according to rules
      if (drawnCardPlayable && this.rules.mustPlayIfDrawable) {
        // Auto-play the drawn card if rule is enabled
        this.log("Auto-playing drawn card due to mustPlayIfDrawable rule")
        const playedCard = player.removeCard(card.id)
        if (playedCard) {
          this.deck.playCard(playedCard)

          // Emit card drawn and auto-played event
          this.emitEvent('onCardDrawn', player, card, true)

          // Handle UNO call for drawn card
          if (player.hasOneCard()) {
            if (!player.getHasCalledUno()) {
              this.startUnoChallengeTimer(player)
            } else {
              this.lastPlayerWithOneCard = player
              this.clearUnoChallengeTimer(player.id)
            }
          }

          // Check for win
          if (player.isEmpty()) {
            this.endRound(player)
            return card
          }

          // Handle special card effects
          this.handleCardEffect(playedCard)

          // Move to next player
          this.nextTurn()
          return card
        }
      } else {
        // Emit card drawn but not auto-played event
        this.emitEvent('onCardDrawn', player, card, false)
      }
    } else {
      // Handle reshuffle edge case - no cards can be drawn
      this.log("No cards can be drawn - skipping turn")
      this.nextTurn()
      return null
    }

    this.nextTurn()
    return card
  }

  callUno(playerId: string): boolean {
    const player = this.players.find((p) => p.id === playerId)
    if (!player || !player.hasOneCard()) return false

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
      const penaltyCards = this.deck.drawCards(2)
      targetPlayer.addCards(penaltyCards)
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

  // Check if a player can be challenged for UNO
  canChallengeUno(targetPlayerId: string): boolean {
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)
    if (!targetPlayer) return false

    return targetPlayer.shouldBePenalizedForUno()
  }

  // Challenge a Wild Draw Four play
  challengeWildDrawFour(challengerId: string, targetPlayerId: string): boolean {
    const challenger = this.players.find((p) => p.id === challengerId)
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)

    if (!challenger || !targetPlayer || !this.previousActiveColor) return false

    // Check if target player has a matching color card against the PREVIOUS active color
    const hasMatchingColor = targetPlayer.getHand().some((c) => c.color === this.previousActiveColor)

    if (hasMatchingColor) {
      // Target player had a matching color - they get penalty (draw 4 cards)
      this.log("Wild Draw Four challenge successful - target player had matching color")
      const penaltyCards = this.deck.drawCards(4)
      targetPlayer.addCards(penaltyCards)

      // Emit Wild Draw Four challenge event (successful)
      this.emitEvent('onWildDrawFourChallenged', challenger, targetPlayer, true)

      return true
    } else {
      // Challenger was wrong - they get penalty (draw 6 cards: 4 + 2)
      this.log("Wild Draw Four challenge failed - challenger was wrong")
      const penaltyCards = this.deck.drawCards(6)
      challenger.addCards(penaltyCards)

      // Emit Wild Draw Four challenge event (failed)
      this.emitEvent('onWildDrawFourChallenged', challenger, targetPlayer, false)

      return false
    }
  }

  // Check if Wild Draw Four can be challenged
  canChallengeWildDrawFour(targetPlayerId: string): boolean {
    const targetPlayer = this.players.find((p) => p.id === targetPlayerId)
    const topCard = this.getTopCard()

    if (!targetPlayer || !topCard) return false

    // Can only challenge if the last played card was Wild Draw Four
    return topCard.value === "Wild Draw Four"
  }

  private nextTurn(): void {
    this.log(
      "nextTurn() called - current player:",
      this.players[this.currentPlayerIndex].name,
      "index:",
      this.currentPlayerIndex,
    )

    let nextPlayerIndex = this.getNextPlayerIndex()
    this.log("Initial next player index:", nextPlayerIndex, "player:", this.players[nextPlayerIndex].name)

    // Handle draw penalty first
    if (this.drawPenalty > 0) {
      this.log("Draw penalty active:", this.drawPenalty)
      const nextPlayer = this.players[nextPlayerIndex]
      const penaltyCards = this.deck.drawCards(this.drawPenalty)
      nextPlayer.addCards(penaltyCards)
      this.drawPenalty = 0
    }

    // Handle skip - if we need to skip, advance one more time
    if (this.skipNext) {
      this.log("Skip next is active")
      this.skipNext = false
      nextPlayerIndex = this.getNextPlayerIndex(nextPlayerIndex)
      this.log("After skip, next player index:", nextPlayerIndex, "player:", this.players[nextPlayerIndex].name)
    }

    // Always update to the calculated next player
    this.log("Setting currentPlayerIndex from", this.currentPlayerIndex, "to", nextPlayerIndex)
    this.currentPlayerIndex = nextPlayerIndex
    this.log("New current player:", this.players[this.currentPlayerIndex].name)

    // Emit turn change event
    this.emitEvent('onTurnChange', this.getCurrentPlayer(), this.direction)

    // Reset UNO calls for all players except those with one card
    this.players.forEach((player) => {
      if (!player.hasOneCard()) {
        player.resetUnoCall()
      }
    })

    // Reset action card tracking if no draw penalty is active
    if (this.drawPenalty === 0) {
      this.lastActionCard = null
    }
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

  getDirection(): GameDirection {
    return this.direction
  }

  getWildColor(): UnoColor | null {
    return this.wildColor
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
    this.log(
      "playAITurn - current player:",
      currentPlayer.name,
      "isHuman:",
      currentPlayer.isHuman,
      "phase:",
      this.phase,
    )

    if (currentPlayer.isHuman || this.phase !== "playing") {
      this.log("playAITurn early return - isHuman:", currentPlayer.isHuman, "phase:", this.phase)
      return false
    }

    const topCard = this.getTopCard()
    if (!topCard) {
      this.log("playAITurn - no top card")
      return false
    }

    this.log("playAITurn - attempting to choose card for:", currentPlayer.name)

    // Use difficulty-based AI strategy
    const cardToPlay = this.chooseAICard(currentPlayer, topCard)

    if (cardToPlay) {
      this.log("playAITurn - chosen card:", cardToPlay.id, cardToPlay.color, cardToPlay.value)
      let chosenColor: UnoColor | undefined
      if (cardToPlay.isWildCard()) {
        chosenColor = currentPlayer.chooseWildColor()
        this.log("playAITurn - chosen wild color:", chosenColor)
      }

      const result = this.playCard(currentPlayer.id, cardToPlay.id, chosenColor)
      this.log("playAITurn - playCard result:", result)
      return result
    } else {
      this.log("playAITurn - no playable card, drawing")
      const drawnCard = this.drawCard(currentPlayer.id)
      this.log("playAITurn - drawCard result:", drawnCard?.id || "null")

      // The AI will get another chance on their next turn if the card is still playable
      return drawnCard !== null
    }
  }

  // Enhanced AI card selection based on difficulty
  private chooseAICard(player: UnoPlayer, topCard: UnoCard): UnoCard | null {
    const playableCards = player.getPlayableCards(topCard, this.wildColor || undefined)
    if (playableCards.length === 0) return null

    switch (this.rules.aiDifficulty) {
      case 'easy':
        return this.easyAIStrategy(playableCards)
      case 'normal':
        return this.normalAIStrategy(playableCards, topCard)
      case 'hard':
        return this.hardAIStrategy(playableCards, topCard, player)
      case 'expert':
        return this.expertAIStrategy(playableCards, topCard, player)
      default:
        return this.normalAIStrategy(playableCards, topCard)
    }
  }

  private easyAIStrategy(playableCards: UnoCard[]): UnoCard | null {
    // Random selection
    return playableCards[Math.floor(Math.random() * playableCards.length)]
  }

  private normalAIStrategy(playableCards: UnoCard[], topCard: UnoCard): UnoCard | null {
    // Basic strategy: prefer action cards, then matching color, then matching number
    const actionCards = playableCards.filter((card) => card.isActionCard() && !card.isWildCard())
    if (actionCards.length > 0) {
      return actionCards[Math.floor(Math.random() * actionCards.length)]
    }

    const colorMatches = playableCards.filter((card) => card.color === topCard.color)
    if (colorMatches.length > 0) {
      return colorMatches[Math.floor(Math.random() * colorMatches.length)]
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

  private getNextPlayer(): UnoPlayer {
    const nextIndex = this.getNextPlayerIndex()
    return this.players[nextIndex]
  }
}
