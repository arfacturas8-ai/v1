/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config) {
  console.log('🚀 Starting global test setup...');
  
  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Create screenshots directory
  const screenshotsDir = path.join(testResultsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create videos directory
  const videosDir = path.join(testResultsDir, 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // Create traces directory
  const tracesDir = path.join(testResultsDir, 'traces');
  if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
  }

  // Verify server availability
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const baseURL = config.use?.baseURL || 'https://platform.cryb.ai';
    console.log(`🔍 Checking server availability at ${baseURL}...`);
    
    const response = await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (response && response.ok()) {
      console.log('✅ Server is available and responding');
    } else {
      console.warn('⚠️ Server may not be fully ready');
    }
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error during server health check:', error.message);
    // Don't fail setup if server check fails - tests may still pass
  }

  // Create test data
  const testData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    baseURL: config.use?.baseURL || 'https://platform.cryb.ai',
    userAgent: config.use?.userAgent,
    viewport: config.use?.viewport,
  };

  fs.writeFileSync(
    path.join(testResultsDir, 'test-metadata.json'),
    JSON.stringify(testData, null, 2)
  );

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;