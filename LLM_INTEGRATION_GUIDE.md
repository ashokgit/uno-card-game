# LLM Integration Guide

## Overview

The UNO game now supports a hybrid AI system where you can choose between the existing hardcoded AI (Basic AI) and LLM-powered AI for each player. This gives you the best of both worlds: reliable gameplay with the existing AI, plus the ability to experiment with LLM-powered players.

## Default Players

The game comes with 5 default AI players pre-configured:

1. **Alice** - Strategic and analytical player who thinks several moves ahead
2. **Bob** - Aggressive player who likes to use action cards frequently  
3. **Carol** - Defensive player who prefers to hold onto cards until the right moment
4. **Dave** - Balanced player who adapts strategy based on the game situation
5. **Eve** - Creative player who makes unexpected moves and takes calculated risks

All default players start with **Basic AI** (the existing hardcoded AI system).

## Player Types

### Basic AI (Default)
- Uses the existing game AI engine
- Reliable and fast gameplay
- No API calls or external dependencies
- Good for consistent, predictable opponents

### LLM-Powered AI
- Uses configured LLM providers (OpenAI, Anthropic, etc.)
- Enhanced gameplay with personality-driven decisions
- Requires API keys and internet connection
- More dynamic and human-like behavior

## How to Use

### 1. Access LLM Settings
1. Open the game at http://localhost:3091
2. Click "Customize Game" → "Settings"
3. Navigate to the "LLM" tab

### 2. Configure LLM Providers
1. In the "LLM Providers" section, click "Add Provider"
2. Configure your provider:
   - **Name**: Give it a descriptive name
   - **API Key**: Enter your API key
   - **Base URL**: Optional custom endpoint
   - **Model**: Specify the model to use
   - **Active**: Toggle to enable

### 3. Assign LLM to Players
1. In the "AI Players" section, find the player you want to upgrade
2. In the dropdown next to their name, select your LLM provider
3. The player will now show an "LLM" badge instead of "Basic AI"
4. You can also customize their personality description

### 4. Start a Game
1. The game will automatically use your configured players
2. Players with LLM assigned will use LLM-powered AI
3. Players without LLM will use Basic AI
4. You can mix and match - some players with LLM, others with Basic AI

## Visual Indicators

- **Blue "D" badge**: Default player (cannot be removed)
- **Blue "Basic AI" badge**: Using existing AI engine
- **Green "LLM" badge**: Using LLM provider
- **Blue border**: Default player card
- **Gray border**: Custom player card

## Example Configuration

### Scenario 1: Start with Basic AI
- All players use Basic AI by default
- No configuration needed
- Reliable, fast gameplay

### Scenario 2: Upgrade One Player
- Assign OpenAI to Alice
- Keep Bob, Carol, Dave, Eve as Basic AI
- Alice becomes more dynamic while others remain predictable

### Scenario 3: Full LLM Experience
- Assign different LLM providers to all players
- Each player gets unique personality and strategy
- Most dynamic gameplay experience

## Tips

1. **Start Small**: Begin with one or two LLM players to test the system
2. **Mix Players**: Combine LLM and Basic AI players for varied gameplay
3. **Personality Matters**: Customize player personalities to create distinct playing styles
4. **API Costs**: Be mindful of API usage costs when using LLM providers
5. **Fallback**: If LLM calls fail, the system can fall back to Basic AI

## Troubleshooting

### LLM Not Working
- Check your API key is valid
- Verify the provider is active
- Check your internet connection
- Review the browser console for errors

### Game Performance
- LLM calls may add delay to AI turns
- Consider using faster models for better performance
- Basic AI players will always be fast

### Player Management
- Default players cannot be removed (marked with "D")
- Custom players can be added and removed freely
- All players can have their names, avatars, and personalities customized

## Next Steps

This foundation allows you to:
- Experiment with different LLM providers
- Create custom AI personalities
- Mix Basic AI and LLM players
- Gradually upgrade your gaming experience

The system is designed to be flexible and extensible, so you can start simple and add complexity as needed!
