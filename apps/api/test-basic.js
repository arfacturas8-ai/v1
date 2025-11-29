console.log('Starting basic test...');

// Simple test without Jest
const assert = require('assert');

// Test 1: Basic math
assert.strictEqual(2 + 2, 4, 'Basic math test failed');
console.log('✓ Basic math test passed');

// Test 2: String operations
const str = 'Hello World';
assert.strictEqual(str.length, 11, 'String length test failed');
console.log('✓ String length test passed');

// Test 3: Array operations
const arr = [1, 2, 3, 4, 5];
assert.strictEqual(arr.reduce((a, b) => a + b, 0), 15, 'Array sum test failed');
console.log('✓ Array sum test passed');

// Test 4: Object operations
const obj = { name: 'CRYB', type: 'platform' };
assert.strictEqual(obj.name, 'CRYB', 'Object property test failed');
console.log('✓ Object property test passed');

// Test 5: Async operation
async function testAsync() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('done');
    }, 100);
  });
}

testAsync().then(result => {
  assert.strictEqual(result, 'done', 'Async test failed');
  console.log('✓ Async test passed');
  console.log('\nAll basic tests passed! ✅');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});