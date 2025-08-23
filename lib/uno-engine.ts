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
  private phase: GamePhase = "playing"
  private winner: UnoPlayer | null = null
  private roundWinner: UnoPlayer | null = null
  private skipNext = false
  private drawPenalty = 0
  private lastPlayerWithOneCard: UnoPlayer | null = null // Track who had one card for UNO challenges
  private unoChallengeWindow = 2000 // 2 seconds to challenge UNO call
  private lastActionCard: UnoCard | null = null // Track the last action card for stacking

  constructor(playerNames: string[], humanPlayerIndex = 0) {
    this.deck = new UnoDeck()
    this.initializePlayers(playerNames, humanPlayerIndex)
    this.dealInitialCards()
    this.startGame()
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

    // If first card is Wild Draw Four, reshuffle
    while (firstCard?.value === "Wild Draw Four") {
      // Put card back and reshuffle
      this.deck = new UnoDeck()
      firstCard = this.deck.drawCard()
    }

    if (firstCard) {
      this.deck.playCard(firstCard)

      // Handle special first card effects
      if (firstCard.value === "Skip") {
        this.skipNext = true
      } else if (firstCard.value === "Reverse") {
        this.direction = "counterclockwise"
      } else if (firstCard.value === "Draw Two") {
        this.drawPenalty = 2
      }
    }
  }

  playCard(playerId: string, cardId: string, chosenWildColor?: UnoColor): boolean {
    const player = this.players.find((p) => p.id === playerId)
    const topCard = this.deck.getTopCard()

    if (!player || !topCard || this.phase !== "playing") return false
    if (this.getCurrentPlayer().id !== playerId) return false

    const card = player.getHand().find((c) => c.id === cardId)
    if (!card || !card.canPlayOn(topCard, this.wildColor || undefined)) return false

    // Check if card can be stacked on previous action card
    if (this.lastActionCard && this.drawPenalty > 0) {
      const canStack = (this.lastActionCard.value === "Draw Two" && card.value === "Draw Two") ||
        (this.lastActionCard.value === "Wild Draw Four" && card.value === "Wild Draw Four")

      if (!canStack) {
        // Cannot play non-stackable card when draw penalty is active
        return false
      }
    }

    // Handle Wild Draw Four challenge rule
    if (card.value === "Wild Draw Four") {
      const hasMatchingColor = player.getHand().some((c) => c.color === topCard.color && c.id !== cardId)
      if (hasMatchingColor) {
        // Player has a matching color card - they shouldn't play Wild Draw Four
        // In a real game, this would be challenged, but for now we'll allow it
        // TODO: Implement proper challenge mechanism
      }
    }

    // Remove card from player's hand and play it
    const playedCard = player.removeCard(cardId)
    if (!playedCard) return false

    this.deck.playCard(playedCard)
    this.wildColor = null

    // Handle UNO call
    if (player.hasOneCard()) {
      if (!player.getHasCalledUno()) {
        // Player should have called UNO - penalty
        const penaltyCards = this.deck.drawCards(2)
        player.addCards(penaltyCards)
        player.resetUnoCall()
      } else {
        // Player called UNO correctly
        this.lastPlayerWithOneCard = player
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
    switch (card.value) {
      case "Skip":
        this.skipNext = true
        this.lastActionCard = card
        break

      case "Reverse":
        this.direction = this.direction === "clockwise" ? "counterclockwise" : "clockwise"
        if (this.players.length === 2) {
          // In 2-player game, Reverse acts like Skip
          this.skipNext = true
        }
        this.lastActionCard = card
        break

      case "Draw Two":
        // Check if we can stack on previous Draw Two
        if (this.lastActionCard?.value === "Draw Two") {
          this.drawPenalty += 2
        } else {
          this.drawPenalty = 2
        }
        this.skipNext = true
        this.lastActionCard = card
        break

      case "Wild":
        this.wildColor = chosenWildColor || "red"
        this.lastActionCard = null // Reset action card tracking
        break

      case "Wild Draw Four":
        // Check if we can stack on previous Wild Draw Four
        if (this.lastActionCard?.value === "Wild Draw Four") {
          this.drawPenalty += 4
        } else {
          this.drawPenalty = 4
        }
        this.wildColor = chosenWildColor || "red"
        this.skipNext = true
        this.lastActionCard = card
        break
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
      return null // Cannot draw when playable cards exist
    }

    const card = this.deck.drawCard()
    if (card) {
      player.addCards([card])

      // Check if the drawn card is playable
      const drawnCardPlayable = card.canPlayOn(topCard, this.wildColor || undefined)

      // If drawn card is playable, player can choose to play it immediately
      if (drawnCardPlayable) {
        // For now, we'll automatically play it if it's playable
        // In a real implementation, the player should have the choice
        const playedCard = player.removeCard(card.id)
        if (playedCard) {
          this.deck.playCard(playedCard)

          // Handle UNO call for drawn card
          if (player.hasOneCard()) {
            if (!player.getHasCalledUno()) {
              const penaltyCards = this.deck.drawCards(2)
              player.addCards(penaltyCards)
              player.resetUnoCall()
            } else {
              this.lastPlayerWithOneCard = player
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
      }
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
      return true
    }

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
    const topCard = this.getTopCard()

    if (!challenger || !targetPlayer || !topCard) return false

    // Check if target player has a matching color card
    const hasMatchingColor = targetPlayer.getHand().some((c) => c.color === topCard.color)

    if (hasMatchingColor) {
      // Target player had a matching color - they get penalty (draw 4 cards)
      const penaltyCards = this.deck.drawCards(4)
      targetPlayer.addCards(penaltyCards)
      return true
    } else {
      // Challenger was wrong - they get penalty (draw 6 cards: 4 + 2)
      const penaltyCards = this.deck.drawCards(6)
      challenger.addCards(penaltyCards)
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
    console.log(
      "[v0] nextTurn() called - current player:",
      this.players[this.currentPlayerIndex].name,
      "index:",
      this.currentPlayerIndex,
    )

    let nextPlayerIndex = this.getNextPlayerIndex()
    console.log("[v0] Initial next player index:", nextPlayerIndex, "player:", this.players[nextPlayerIndex].name)

    // Handle draw penalty first
    if (this.drawPenalty > 0) {
      console.log("[v0] Draw penalty active:", this.drawPenalty)
      const nextPlayer = this.players[nextPlayerIndex]
      const penaltyCards = this.deck.drawCards(this.drawPenalty)
      nextPlayer.addCards(penaltyCards)
      this.drawPenalty = 0
    }

    // Handle skip - if we need to skip, advance one more time
    if (this.skipNext) {
      console.log("[v0] Skip next is active")
      this.skipNext = false
      nextPlayerIndex = this.getNextPlayerIndex(nextPlayerIndex)
      console.log("[v0] After skip, next player index:", nextPlayerIndex, "player:", this.players[nextPlayerIndex].name)
    }

    // Always update to the calculated next player
    console.log("[v0] Setting currentPlayerIndex from", this.currentPlayerIndex, "to", nextPlayerIndex)
    this.currentPlayerIndex = nextPlayerIndex
    console.log("[v0] New current player:", this.players[this.currentPlayerIndex].name)

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
    console.log(
      "[v0] getNextPlayerIndex - from:",
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

    console.log("[v0] Calculated next index:", nextIndex)
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

    // Check for game winner (500 points)
    if (winner.getScore() >= 500) {
      this.winner = winner
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

  isGameOver(): boolean {
    return this.phase === "game_over"
  }

  // AI turn logic
  playAITurn(): boolean {
    const currentPlayer = this.getCurrentPlayer()
    console.log(
      "[v0] playAITurn - current player:",
      currentPlayer.name,
      "isHuman:",
      currentPlayer.isHuman,
      "phase:",
      this.phase,
    )

    if (currentPlayer.isHuman || this.phase !== "playing") {
      console.log("[v0] playAITurn early return - isHuman:", currentPlayer.isHuman, "phase:", this.phase)
      return false
    }

    const topCard = this.getTopCard()
    if (!topCard) {
      console.log("[v0] playAITurn - no top card")
      return false
    }

    console.log("[v0] playAITurn - attempting to choose card for:", currentPlayer.name)

    // Try to play a card
    const cardToPlay = currentPlayer.chooseCardToPlay(topCard, this.wildColor || undefined)

    if (cardToPlay) {
      console.log("[v0] playAITurn - chosen card:", cardToPlay.id, cardToPlay.color, cardToPlay.value)
      let chosenColor: UnoColor | undefined
      if (cardToPlay.isWildCard()) {
        chosenColor = currentPlayer.chooseWildColor()
        console.log("[v0] playAITurn - chosen wild color:", chosenColor)
      }

      const result = this.playCard(currentPlayer.id, cardToPlay.id, chosenColor)
      console.log("[v0] playAITurn - playCard result:", result)
      return result
    } else {
      console.log("[v0] playAITurn - no playable card, drawing")
      const drawnCard = this.drawCard(currentPlayer.id)
      console.log("[v0] playAITurn - drawCard result:", drawnCard?.id || "null")

      // The AI will get another chance on their next turn if the card is still playable
      return drawnCard !== null
    }
  }
}
