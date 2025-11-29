/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */

import fs from 'fs';
import path from 'path';

async function globalTeardown(config) {
  console.log('🧹 Starting global test cleanup...');
  
  const testResultsDir = path.join(process.cwd(), 'test-results');
  
  try {
    // Generate test summary
    const metadataPath = path.join(testResultsDir, 'test-metadata.json');
    const summaryPath = path.join(testResultsDir, 'test-summary.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      const summary = {
        ...metadata,
        completedAt: new Date().toISOString(),
        duration: new Date() - new Date(metadata.timestamp),
        resultFiles: {
          htmlReport: 'playwright-report/index.html',
          jsonResults: 'playwright-results.json',
          junitResults: 'playwright-junit.xml',
          allureResults: 'allure-results/',
        }
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log('📊 Test summary generated');
    }
    
    // Clean up temporary files if needed
    const tempDir = path.join(testResultsDir, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🗑️ Temporary files cleaned up');
    }
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Error during global teardown:', error.message);
  }
}

export default globalTeardown;