// test-setup.js
const { scanFile } = require('../src/scanner');
const { checkAgainstBaseline } = require('../src/baselineCheck');

console.log('🧪 Testing Basic Scanner...');

// Test with your existing test.js file
const features = scanFile('./test.js');
console.log('Detected features:', features);

// Test baseline checking
const result = checkAgainstBaseline(features, '2023');
console.log('Baseline 2023 check:', result);

console.log('✅ Basic test completed!');