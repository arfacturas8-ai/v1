import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for services to be ready
    console.log('🚀 Setting up test environment...');
    
    // Check if API server is running
    await page.goto(`${baseURL?.replace(':3001', ':3000')}/health`);
    await page.waitForResponse(response => response.status() === 200, { timeout: 30000 });
    
    // Check if web server is running
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Create test users
    await createTestUsers(page, baseURL);
    
    console.log('✅ Test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestUsers(page: any, baseURL: string | undefined) {
  const testUsers = [
    {
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: 'TestPassword123!',
      displayName: 'Test User 1'
    },
    {
      username: 'testuser2', 
      email: 'testuser2@example.com',
      password: 'TestPassword123!',
      displayName: 'Test User 2'
    },
    {
      username: 'admin',
      email: 'admin@example.com', 
      password: 'AdminPassword123!',
      displayName: 'Admin User'
    }
  ];

  for (const user of testUsers) {
    try {
      // Register test user
      const response = await page.request.post(`${baseURL?.replace(':3001', ':3000')}/api/auth/register`, {
        data: user
      });
      
      if (response.status() === 201 || response.status() === 409) {
        // 409 = user already exists, which is fine for tests
        console.log(`✅ Test user ${user.username} ready`);
      } else {
        console.warn(`⚠️ Failed to create test user ${user.username}: ${response.status()}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error creating test user ${user.username}:`, error);
    }
  }
}

export default globalSetup;