# 🎮 UNO Card Game

A modern, interactive UNO card game built with Next.js, TypeScript, and Tailwind CSS. Experience the classic card game with beautiful animations, sound effects, and AI opponents.

![UNO Game Screenshot](https://img.shields.io/badge/Status-Active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC)

## ✨ Features

### 🎯 Core Gameplay
- **Complete UNO Rules**: Full implementation of official UNO card game rules
- **AI Opponents**: Play against intelligent AI players with realistic decision-making
- **Multiplayer Setup**: Support for up to 6 players (1 human + 5 AI)
- **Real-time Game State**: Dynamic game state management with turn-based gameplay

### 🎨 Visual Experience
- **Beautiful UI**: Modern, responsive design with gradient backgrounds and smooth animations
- **Card Animations**: Realistic card throwing, drawing, and dealing animations
- **Visual Feedback**: Hover effects, playable card highlighting, and turn indicators
- **Avatar System**: Unique avatars for each player with active state indicators

### 🔊 Audio Experience
- **Sound Effects**: Procedurally generated audio for card actions, wins, and special events
- **Audio Types**: Card play, draw, win, UNO call, special cards, shuffle, and landing sounds
- **Dynamic Audio**: Different sounds for different card types and game events

### 🎮 Game Mechanics
- **Action Cards**: Skip, Reverse, Draw Two, Wild, and Wild Draw Four cards
- **UNO Calling**: Call UNO when you have one card left
- **Challenge System**: Challenge other players' UNO calls and Wild Draw Four plays
- **Stacking**: Support for stacking Draw Two and Wild Draw Four cards
- **Direction Control**: Game direction changes with Reverse cards

### 🏆 Advanced Features
- **Move Evaluation**: AI-powered feedback on your card plays
- **Performance Tracking**: Level and coin system for progression
- **Debug Panel**: Real-time game state information for development
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uno-card-game.git
   cd uno-card-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to start playing!

## 🎯 How to Play

### Basic Rules
1. **Objective**: Be the first player to get rid of all your cards
2. **Matching**: Play a card that matches the top card's color, number, or symbol
3. **Special Cards**: Use action cards to skip turns, reverse direction, or make opponents draw
4. **UNO Call**: When you have one card left, call "UNO!" to avoid penalties
5. **Winning**: The first player to play their last card wins the round

### Controls
- **Click a card** to play it (if it's playable)
- **Click "Draw Card"** when you can't play any cards
- **Click "UNO!"** when you have exactly one card left
- **Use challenge buttons** to challenge other players' UNO calls or Wild Draw Four plays

### Game Features
- **Playable Cards**: Highlighted cards can be played
- **Turn Indicators**: Active player is highlighted with animations
- **Direction Display**: Shows current game direction (clockwise/counterclockwise)
- **Card Count**: Each player's remaining cards are displayed
- **Action Feedback**: Real-time feedback on your moves and game events

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.2.4**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4.1.9**: Utility-first CSS framework

### UI Components
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Beautiful, customizable icons
- **Class Variance Authority**: Type-safe component variants
- **Tailwind Merge**: Utility for merging Tailwind classes

### Game Engine
- **Custom UNO Engine**: TypeScript-based game logic
- **State Management**: React hooks for game state
- **Animation System**: Custom animation framework with requestAnimationFrame

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📁 Project Structure

```
uno-card-game/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main game page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── uno-cards.tsx     # UNO card components
├── lib/                  # Utility libraries
│   ├── uno-engine.ts     # Game logic engine
│   └── utils.ts          # Helper utilities
├── hooks/                # Custom React hooks
├── public/               # Static assets
│   └── *.png             # Player avatars
├── styles/               # Additional styles
└── tests/                # Test files
    ├── README.md         # Test documentation
    ├── run-tests.js      # Test runner
    └── uno-game-simulation.js # Game simulation test
```

## 🧪 Testing

### Running Tests
The project includes comprehensive tests to ensure the game engine works correctly.

**Run all tests:**
```bash
node tests/run-tests.js
```

**Run specific test:**
```bash
node tests/uno-game-simulation.js
```

### Test Coverage
- **Game Simulation**: Complete UNO game simulation with proper completion
- **AI Behavior**: Tests AI player decision-making and card playing
- **Game Mechanics**: Validates special card effects and scoring
- **Engine Issues**: Identifies and demonstrates known engine problems

For detailed test documentation, see [tests/README.md](tests/README.md).

## 🎨 Customization

### Adding New Players
Edit the `playerNames` array in `app/page.tsx`:
```typescript
const playerNames = ["You", "Alice", "Bob", "Carol", "Dave", "Eve"]
```

### Modifying Game Rules
Update the game logic in `lib/uno-engine.ts`:
- Card matching rules
- Action card effects
- Scoring system
- AI behavior

### Styling Changes
- Modify `components/uno-cards.tsx` for card appearance
- Update `app/globals.css` for global styles
- Customize Tailwind classes in components

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution
- **New Features**: Additional game modes, themes, or mechanics
- **Bug Fixes**: Report and fix issues
- **Performance**: Optimize animations and game logic
- **Accessibility**: Improve keyboard navigation and screen reader support
- **Documentation**: Enhance README, add code comments
- **Testing**: Add unit tests and integration tests

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting with Prettier

## 🐛 Known Issues

- **AI Turn Issue**: The `playAITurn()` method in the engine uses asynchronous `setTimeout()` which prevents proper game completion in simulation scenarios
- Mobile responsiveness could be improved for very small screens
- Some edge cases in AI decision-making
- Audio context may require user interaction on some browsers

### Engine Issue Details
The UNO engine has a critical issue where AI players never actually play cards in synchronous simulations because the `playAITurn()` method schedules AI decisions with `setTimeout()` but doesn't wait for them to complete. This causes:
- Hand sizes to grow exponentially (players only draw, never play)
- Games to never reach completion
- Infinite loops in simulation scenarios

The test suite demonstrates the correct behavior when AI players properly make their moves.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **UNO**: Official UNO card game rules and mechanics
- **Next.js Team**: Amazing React framework
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI primitives
- **Lucide**: Beautiful icon library

## 📞 Support

If you encounter any issues or have questions:

1. **Check Issues**: Look for existing issues in the GitHub repository
2. **Create Issue**: Open a new issue with detailed description
3. **Discussions**: Use GitHub Discussions for general questions

---

**Enjoy playing UNO! 🎉**

*Built with ❤️ using Next.js, TypeScript, and Tailwind CSS*
