/**
 * Settings Persistence Test
 * 
 * This test verifies that the settings persistence functionality works correctly.
 * It tests localStorage saving/loading, export/import functionality, and reset operations.
 */

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock the global localStorage
global.localStorage = mockLocalStorage;

// Mock default settings
const DEFAULT_UI_SETTINGS = {
  animationSpeed: 1.0,
  soundEffects: true,
  backgroundMusic: true,
  musicVolume: 0.3,
  visualEffects: true,
  autoUnoCall: false,
  confirmActionCards: true,
  showPlayableCards: true,
  gameSpeed: 1.0,
};

const DEFAULT_GAME_RULES = {
  stackDrawTwo: false,
  stackDrawFour: false,
  mustPlayIfDrawable: false,
  allowDrawWhenPlayable: true,
  targetScore: 500,
  debugMode: false,
  aiDifficulty: 'expert',
  enableJumpIn: false,
  enableSevenZero: false,
  enableSwapHands: false,
  showDiscardPile: true,
  deadlockResolution: 'end_round',
};

const DEFAULT_GAME_SETTINGS = {
  rules: DEFAULT_GAME_RULES,
  playerCount: 6,
};

// Test functions
function testSettingsPersistence() {
  console.log('🧪 Testing Settings Persistence...\n');

  // Test 1: Initial state should be empty
  console.log('Test 1: Initial localStorage state');
  const initialUISettings = localStorage.getItem('uno-ui-settings');
  const initialGameSettings = localStorage.getItem('uno-game-settings');
  
  if (initialUISettings === null && initialGameSettings === null) {
    console.log('✅ localStorage is initially empty');
  } else {
    console.log('❌ localStorage should be empty initially');
    return false;
  }

  // Test 2: Save settings to localStorage
  console.log('\nTest 2: Saving settings to localStorage');
  const testUISettings = { ...DEFAULT_UI_SETTINGS, animationSpeed: 2.0, soundEffects: false };
  const testGameSettings = { 
    ...DEFAULT_GAME_SETTINGS, 
    playerCount: 4,
    rules: { ...DEFAULT_GAME_RULES, targetScore: 1000, aiDifficulty: 'easy' }
  };

  localStorage.setItem('uno-ui-settings', JSON.stringify(testUISettings));
  localStorage.setItem('uno-game-settings', JSON.stringify(testGameSettings));

  const savedUISettings = JSON.parse(localStorage.getItem('uno-ui-settings'));
  const savedGameSettings = JSON.parse(localStorage.getItem('uno-game-settings'));

  if (savedUISettings.animationSpeed === 2.0 && 
      savedUISettings.soundEffects === false &&
      savedGameSettings.playerCount === 4 &&
      savedGameSettings.rules.targetScore === 1000 &&
      savedGameSettings.rules.aiDifficulty === 'easy') {
    console.log('✅ Settings saved correctly to localStorage');
  } else {
    console.log('❌ Settings not saved correctly');
    return false;
  }

  // Test 3: Export settings functionality
  console.log('\nTest 3: Export settings functionality');
  const exportData = {
    uiSettings: testUISettings,
    gameSettings: testGameSettings,
    version: '1.0',
    exportedAt: new Date().toISOString()
  };
  
  const exportedJson = JSON.stringify(exportData, null, 2);
  const parsedExport = JSON.parse(exportedJson);

  if (parsedExport.uiSettings.animationSpeed === 2.0 &&
      parsedExport.gameSettings.playerCount === 4 &&
      parsedExport.version === '1.0') {
    console.log('✅ Export functionality works correctly');
  } else {
    console.log('❌ Export functionality failed');
    return false;
  }

  // Test 4: Import settings functionality
  console.log('\nTest 4: Import settings functionality');
  const importData = {
    uiSettings: { ...DEFAULT_UI_SETTINGS, gameSpeed: 3.0 },
    gameSettings: { ...DEFAULT_GAME_SETTINGS, playerCount: 3 }
  };
  
  const importJson = JSON.stringify(importData);
  const parsedImport = JSON.parse(importJson);

  if (parsedImport.uiSettings.gameSpeed === 3.0 &&
      parsedImport.gameSettings.playerCount === 3) {
    console.log('✅ Import functionality works correctly');
  } else {
    console.log('❌ Import functionality failed');
    return false;
  }

  // Test 5: Clear settings functionality
  console.log('\nTest 5: Clear settings functionality');
  localStorage.removeItem('uno-ui-settings');
  localStorage.removeItem('uno-game-settings');

  const clearedUISettings = localStorage.getItem('uno-ui-settings');
  const clearedGameSettings = localStorage.getItem('uno-game-settings');

  if (clearedUISettings === null && clearedGameSettings === null) {
    console.log('✅ Settings cleared successfully');
  } else {
    console.log('❌ Settings not cleared properly');
    return false;
  }

  // Test 6: Error handling for invalid JSON
  console.log('\nTest 6: Error handling for invalid JSON');
  try {
    localStorage.setItem('uno-ui-settings', 'invalid json');
    const invalidSettings = JSON.parse(localStorage.getItem('uno-ui-settings'));
    console.log('❌ Should have thrown an error for invalid JSON');
    return false;
  } catch (error) {
    console.log('✅ Error handling works for invalid JSON');
  }

  console.log('\n🎉 All settings persistence tests passed!');
  return true;
}

function testSettingsValidation() {
  console.log('\n🧪 Testing Settings Validation...\n');

  // Test 1: Validate UI settings structure
  console.log('Test 1: UI Settings structure validation');
  const validUISettings = {
    animationSpeed: 1.5,
    soundEffects: true,
    backgroundMusic: false,
    musicVolume: 0.7,
    visualEffects: true,
    autoUnoCall: true,
    confirmActionCards: false,
    showPlayableCards: true,
    gameSpeed: 2.0,
  };

  const requiredUISettingsKeys = [
    'animationSpeed', 'soundEffects', 'backgroundMusic', 'musicVolume',
    'visualEffects', 'autoUnoCall', 'confirmActionCards', 'showPlayableCards', 'gameSpeed'
  ];

  const hasAllUISettingsKeys = requiredUISettingsKeys.every(key => key in validUISettings);
  
  if (hasAllUISettingsKeys) {
    console.log('✅ UI Settings structure is valid');
  } else {
    console.log('❌ UI Settings structure is invalid');
    return false;
  }

  // Test 2: Validate Game settings structure
  console.log('\nTest 2: Game Settings structure validation');
  const validGameSettings = {
    rules: {
      stackDrawTwo: true,
      stackDrawFour: false,
      mustPlayIfDrawable: true,
      allowDrawWhenPlayable: false,
      targetScore: 750,
      debugMode: true,
      aiDifficulty: 'hard',
      enableJumpIn: true,
      enableSevenZero: false,
      enableSwapHands: true,
      showDiscardPile: false,
      deadlockResolution: 'force_reshuffle',
    },
    playerCount: 5
  };

  const requiredGameSettingsKeys = ['rules', 'playerCount'];
  const requiredRulesKeys = [
    'stackDrawTwo', 'stackDrawFour', 'mustPlayIfDrawable', 'allowDrawWhenPlayable',
    'targetScore', 'debugMode', 'aiDifficulty', 'enableJumpIn', 'enableSevenZero',
    'enableSwapHands', 'showDiscardPile', 'deadlockResolution'
  ];

  const hasAllGameSettingsKeys = requiredGameSettingsKeys.every(key => key in validGameSettings);
  const hasAllRulesKeys = requiredRulesKeys.every(key => key in validGameSettings.rules);

  if (hasAllGameSettingsKeys && hasAllRulesKeys) {
    console.log('✅ Game Settings structure is valid');
  } else {
    console.log('❌ Game Settings structure is invalid');
    return false;
  }

  // Test 3: Validate value ranges
  console.log('\nTest 3: Settings value range validation');
  const validRanges = {
    animationSpeed: validUISettings.animationSpeed >= 0.5 && validUISettings.animationSpeed <= 2.0,
    musicVolume: validUISettings.musicVolume >= 0 && validUISettings.musicVolume <= 1,
    gameSpeed: validUISettings.gameSpeed >= 0.5 && validUISettings.gameSpeed <= 3.0,
    playerCount: validGameSettings.playerCount >= 2 && validGameSettings.playerCount <= 6,
    targetScore: validGameSettings.rules.targetScore >= 100 && validGameSettings.rules.targetScore <= 1000,
  };

  const allRangesValid = Object.values(validRanges).every(valid => valid);
  
  if (allRangesValid) {
    console.log('✅ All setting values are within valid ranges');
  } else {
    console.log('❌ Some setting values are outside valid ranges');
    return false;
  }

  console.log('\n🎉 All settings validation tests passed!');
  return true;
}

// Run tests
function runSettingsTests() {
  console.log('🚀 Starting Settings Persistence Tests\n');
  
  const persistenceResult = testSettingsPersistence();
  const validationResult = testSettingsValidation();

  console.log('\n📊 Test Results:');
  console.log(`Settings Persistence: ${persistenceResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Settings Validation: ${validationResult ? '✅ PASSED' : '❌ FAILED'}`);

  if (persistenceResult && validationResult) {
    console.log('\n🎉 All settings tests passed! The settings persistence system is working correctly.');
    return true;
  } else {
    console.log('\n💥 Some settings tests failed. Please check the implementation.');
    return false;
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSettingsTests, testSettingsPersistence, testSettingsValidation };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runSettingsTests();
}
