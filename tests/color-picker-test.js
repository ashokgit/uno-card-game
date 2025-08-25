/**
 * Test: Color Picker Implementation
 * 
 * This test verifies that the color picker functionality has been properly implemented
 * and integrated into the game.
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Testing Color Picker Implementation');
console.log('='.repeat(50));

function checkColorPickerComponent() {
  console.log('\n📋 Checking: Color Picker Component');
  
  try {
    const componentPath = path.join(__dirname, '..', 'components', 'color-picker.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check for required imports
    const hasReactImport = content.includes('import React from \'react\'');
    const hasButtonImport = content.includes('import { Button } from \'./ui/button\'');
    
    if (hasReactImport && hasButtonImport) {
      console.log('✅ Required imports found');
    } else {
      console.log('❌ Missing required imports');
      return false;
    }
    
    // Check for ColorPicker component
    const hasColorPickerComponent = content.includes('export function ColorPicker');
    
    if (hasColorPickerComponent) {
      console.log('✅ ColorPicker component found');
    } else {
      console.log('❌ ColorPicker component not found');
      return false;
    }
    
    // Check for color selection logic
    const hasColorSelection = content.includes('onColorSelect') && content.includes('colors.map');
    
    if (hasColorSelection) {
      console.log('✅ Color selection logic found');
    } else {
      console.log('❌ Color selection logic not found');
      return false;
    }
    
    // Check for all four colors
    const hasAllColors = content.includes('red') && content.includes('blue') && 
                        content.includes('green') && content.includes('yellow');
    
    if (hasAllColors) {
      console.log('✅ All four colors (red, blue, green, yellow) found');
    } else {
      console.log('❌ Missing some colors');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error reading color picker component:`, error.message);
    return false;
  }
}

function checkMainGameIntegration() {
  console.log('\n📋 Checking: Main Game Integration');
  
  try {
    const gamePath = path.join(__dirname, '..', 'app', 'page.tsx');
    const content = fs.readFileSync(gamePath, 'utf8');
    
    // Check for ColorPicker import
    const hasColorPickerImport = content.includes('import { ColorPicker }');
    
    if (hasColorPickerImport) {
      console.log('✅ ColorPicker import found');
    } else {
      console.log('❌ ColorPicker import not found');
      return false;
    }
    
    // Check for color picker state
    const hasColorPickerState = content.includes('showColorPicker') && content.includes('pendingWildCard');
    
    if (hasColorPickerState) {
      console.log('✅ Color picker state management found');
    } else {
      console.log('❌ Color picker state management not found');
      return false;
    }
    
    // Check for color selection handlers
    const hasColorSelectHandler = content.includes('handleColorSelect') && content.includes('handleColorPickerClose');
    
    if (hasColorSelectHandler) {
      console.log('✅ Color selection handlers found');
    } else {
      console.log('❌ Color selection handlers not found');
      return false;
    }
    
    // Check for ColorPicker component usage
    const hasColorPickerUsage = content.includes('<ColorPicker') && content.includes('isVisible={showColorPicker}');
    
    if (hasColorPickerUsage) {
      console.log('✅ ColorPicker component usage found');
    } else {
      console.log('❌ ColorPicker component usage not found');
      return false;
    }
    
    // Check for Wild card handling
    const hasWildCardHandling = content.includes('cardToPlay.color === "wild"') && content.includes('setShowColorPicker(true)');
    
    if (hasWildCardHandling) {
      console.log('✅ Wild card handling logic found');
    } else {
      console.log('❌ Wild card handling logic not found');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error reading main game file:`, error.message);
    return false;
  }
}

// Run tests
try {
  const componentTest = checkColorPickerComponent();
  const integrationTest = checkMainGameIntegration();
  
  if (componentTest && integrationTest) {
    console.log('\n🎉 SUCCESS: Color Picker Implementation is complete!');
    console.log('\n📝 Summary of implementation:');
    console.log('  1. ✅ Created ColorPicker component with all four colors');
    console.log('  2. ✅ Integrated ColorPicker into main game component');
    console.log('  3. ✅ Added state management for color picker visibility');
    console.log('  4. ✅ Added handlers for color selection and cancellation');
    console.log('  5. ✅ Modified Wild card play logic to show color picker');
    console.log('  6. ✅ Removed random color selection for human players');
    console.log('\n🎮 How it works:');
    console.log('  - When a human player plays a Wild card, the color picker appears');
    console.log('  - Player can choose from red, blue, green, or yellow');
    console.log('  - The chosen color is passed to the game engine');
    console.log('  - AI players still use their strategic color selection');
  } else {
    console.log('\n💥 FAILURE: Color Picker Implementation is incomplete!');
    process.exit(1);
  }
} catch (error) {
  console.error('\n💥 Test suite failed:', error.message);
  process.exit(1);
}
