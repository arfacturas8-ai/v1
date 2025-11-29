const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = Array.from(tests);
    
    // Run unit tests first (fastest)
    const unitTests = copyTests.filter(test => test.path.includes('/unit/'));
    const integrationTests = copyTests.filter(test => test.path.includes('/integration/'));
    const comprehensiveTests = copyTests.filter(test => test.path.includes('/comprehensive/'));
    const otherTests = copyTests.filter(test => 
      !test.path.includes('/unit/') && 
      !test.path.includes('/integration/') && 
      !test.path.includes('/comprehensive/')
    );

    // Sort by test size/complexity
    return [
      ...unitTests.sort((a, b) => a.path.localeCompare(b.path)),
      ...otherTests.sort((a, b) => a.path.localeCompare(b.path)),
      ...integrationTests.sort((a, b) => a.path.localeCompare(b.path)),
      ...comprehensiveTests.sort((a, b) => a.path.localeCompare(b.path))
    ];
  }
}

module.exports = CustomSequencer;