import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test data if needed
    // In a real setup, you might want to clean up test users, posts, etc.
    console.log('✅ Test environment cleaned up');
  } catch (error) {
    console.error('❌ Failed to clean up test environment:', error);
  }
}

export default globalTeardown;