# UNO Game Tests

This folder contains tests for the UNO card game engine and simulation.

## Test Files

### `uno-game-simulation.js`
A complete UNO game simulation that demonstrates proper game completion. This test shows how the game should work when AI players properly play cards instead of just drawing them.

**Features:**
- 3-player game simulation
- Proper card playing logic (80% play, 20% draw)
- Hand size management
- Special card effects (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
- Round completion and scoring
- Game completion detection

**Usage:**
```bash
node tests/uno-game-simulation.js
```

### `run-tests.js`
Test runner that executes all test files in the tests folder.

**Usage:**
```bash
node tests/run-tests.js
```

## Running Tests

### Run a specific test:
```bash
node tests/uno-game-simulation.js
```

### Run all tests:
```bash
node tests/run-tests.js
```

## Test Results

The simulation test should demonstrate:
- ✅ Game reaches completion (player wins with 0 cards)
- ✅ Proper hand size management
- ✅ Special card effects working correctly
- ✅ Round and game completion
- ✅ Final scores calculated correctly

## Issues Identified

The original UNO engine has an issue with asynchronous AI turns that prevents proper game completion in simulation scenarios. The `playAITurn()` method uses `setTimeout()` which doesn't work in synchronous game loops, causing AI players to never actually play cards.

This test demonstrates the correct behavior when AI players properly make their moves.
