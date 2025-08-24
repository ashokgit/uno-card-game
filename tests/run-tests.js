/**
 * Test Runner for UNO Game Tests
 * 
 * This script runs all tests in the tests folder.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 UNO Game Test Runner');
console.log('='.repeat(50));

// Get all test files
const testFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'run-tests.js');

console.log(`Found ${testFiles.length} test file(s):`);
testFiles.forEach(file => console.log(`  - ${file}`));
console.log('');

// Run each test
testFiles.forEach((testFile, index) => {
  console.log(`\n${'='.repeat(20)} Test ${index + 1}: ${testFile} ${'='.repeat(20)}`);
  
  try {
    require(path.join(__dirname, testFile));
    console.log(`✅ ${testFile} completed successfully`);
  } catch (error) {
    console.error(`❌ ${testFile} failed:`, error.message);
  }
});

console.log('\n🎯 All tests completed!');
