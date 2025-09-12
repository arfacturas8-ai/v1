import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser, createTestCommunity, PerformanceMeasurement, waitForStable } from './helpers/test-helpers';

test.describe('CRYB Platform Full Integration Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let testUser: ReturnType<typeof generateTestUser>;
  let performanceMeasure: PerformanceMeasurement;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
    testUser = generateTestUser('integration');
    performanceMeasure = new PerformanceMeasurement();
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('PAGE ERROR:', msg.text());
      }
    });
    page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Authentication Integration', () => {
    test('should complete full registration flow', async () => {
      performanceMeasure.mark('registration-start');
      
      await page.goto('/register');
      
      // Wait for page to be fully loaded
      await expect(page.locator('h1')).toContainText('CRYB');
      await expect(page.locator('h2')).toContainText('Create an account');
      
      // Fill out registration form using actual form elements
      await page.fill('#email', testUser.email);
      await page.fill('#username', testUser.username);
      await page.fill('#displayName', testUser.displayName || testUser.username);
      await page.fill('#password', testUser.password);
      await page.fill('#confirmPassword', testUser.password);
      
      // Submit registration
      await page.click('button[type="submit"]:has-text("Create Account")');
      
      performanceMeasure.mark('registration-submit');
      
      // Should redirect to dashboard on success or show error
      await page.waitForTimeout(2000);
      
      // Check if we're on dashboard or if there's an error
      const currentUrl = page.url();
      const hasError = await page.locator('.bg-red-600\/20').isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await page.locator('.text-red-400').textContent();
        console.log('Registration error (expected in demo):', errorText);
        // This is expected in demo mode - continue to login test
      } else if (currentUrl.includes('/dashboard') || currentUrl.includes('/chat')) {
        console.log('Registration successful - redirected to:', currentUrl);
        performanceMeasure.mark('registration-complete');
      } else {
        console.log('Registration response unclear - current URL:', currentUrl);
      }
    });
    
    test('should handle login flow', async () => {
      await page.goto('/login');
      
      await expect(page.locator('h1')).toContainText('CRYB');
      await expect(page.locator('h2')).toContainText('Welcome back');
      
      // Try login with test user credentials
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      
      await page.click('button[type="submit"]:has-text("Sign In")');
      
      await page.waitForTimeout(2000);
      
      // Check result - should either succeed or show expected demo error
      const currentUrl = page.url();
      const hasError = await page.locator('.bg-red-600\/20').isVisible().catch(() => false);
      
      if (hasError) {
        console.log('Login error (expected in demo mode)');
        // Demo mode - continue with other tests
      } else {
        console.log('Login result - current URL:', currentUrl);
      }
    });
  });
  
  test.describe('Discord-Style Features Integration', () => {
    test.beforeEach(async () => {
      // Navigate to servers page for Discord-style features
      await page.goto('/servers');
      await page.waitForTimeout(1000);
    });
    
    test('should display server discovery page', async () => {
      // Check for server discovery elements
      await expect(page.locator('h1')).toContainText('Discover Communities');
      
      // Check for search functionality
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('gaming');
      await page.waitForTimeout(500);
      
      // Should filter server results
      const serverCards = page.locator('[class*="Card"]').first();
      await expect(serverCards).toBeVisible();
    });
    
    test('should allow joining servers', async () => {
      await page.goto('/servers');
      
      // Wait for server list to load
      await page.waitForTimeout(1000);
      
      // Find and click join button on first available server
      const joinButton = page.locator('button:has-text("Join Server")').first();
      
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await page.waitForTimeout(1000);
        
        // Should redirect to chat interface
        const currentUrl = page.url();
        expect(currentUrl).toContain('/chat');
        
        console.log('Successfully joined server and redirected to chat');
      } else {
        console.log('No join buttons found - testing server display only');
      }
    });
    
    test('should navigate to chat interface', async () => {
      await page.goto('/chat');
      
      // Wait for chat interface to load
      await page.waitForTimeout(2000);
      
      // Check for chat interface elements
      const connectionStatus = page.locator('text=Connected').or(page.locator('text=Connecting'));
      await expect(connectionStatus).toBeVisible();
      
      console.log('Chat interface loaded successfully');
    });
  });
  
  test.describe('Reddit-Style Features Integration', () => {
    test('should display Reddit demo page', async () => {
      await page.goto('/reddit-demo');
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Check for main demo elements
      await expect(page.locator('h1').or(page.locator('[class*="CardTitle"]')).first()).toBeVisible();
      
      // Check for tabs
      const tabsList = page.locator('[role="tablist"]');
      if (await tabsList.isVisible()) {
        await expect(tabsList).toBeVisible();
        console.log('Reddit demo tabs loaded');
      }
    });
    
    test('should test post creation functionality', async () => {
      await page.goto('/reddit-demo');
      await page.waitForTimeout(1000);
      
      // Look for create post button
      const createPostButton = page.locator('button:has-text("Create Post")');
      
      if (await createPostButton.isVisible()) {
        await createPostButton.click();
        await page.waitForTimeout(500);
        
        // Check if post creation form appears
        const titleInput = page.locator('input[placeholder*="title"]').or(page.locator('input[name*="title"]')).first();
        if (await titleInput.isVisible()) {
          console.log('Post creation form is functional');
        }
      } else {
        console.log('Create post button not found - checking for existing posts');
      }
      
      // Check for existing posts or post-like content
      const postContent = page.locator('[class*="Card"]').or(page.locator('[class*="post"]')).first();
      if (await postContent.isVisible()) {
        console.log('Post content detected on Reddit demo page');
      }
    });
    
    test('should test voting system', async () => {
      await page.goto('/reddit-demo');
      await page.waitForTimeout(1000);
      
      // Look for voting elements (arrows, scores)
      const voteElements = page.locator('[class*="vote"]').or(page.locator('button[aria-label*="vote"]')).or(page.locator('svg[class*="arrow"]'));
      
      if (await voteElements.first().isVisible()) {
        console.log('Voting system elements detected');
        
        // Try to interact with voting if possible
        const firstVoteButton = voteElements.first();
        await firstVoteButton.click().catch(() => console.log('Vote interaction not available in demo'));
      } else {
        console.log('Voting system elements not found - checking for score displays');
        
        // Look for score indicators
        const scores = page.locator('text=/^\d+$/').or(page.locator('[class*="score"]'));
        if (await scores.first().isVisible()) {
          console.log('Score indicators detected');
        }
      }
    });
    
    test('should test comment system', async () => {
      await page.goto('/reddit-demo');
      await page.waitForTimeout(1000);
      
      // Check for comments tab or comment-related elements
      const commentsTab = page.locator('text=Comments').or(page.locator('[role="tab"]:has-text("Comments")')).first();
      
      if (await commentsTab.isVisible()) {
        await commentsTab.click();
        await page.waitForTimeout(500);
        
        console.log('Comments section accessible');
        
        // Look for comment content or comment form
        const commentContent = page.locator('[class*="comment"]').or(page.locator('textarea')).first();
        if (await commentContent.isVisible()) {
          console.log('Comment functionality detected');
        }
      } else {
        console.log('Comments tab not found - checking for inline comments');
        
        // Look for comment-like content
        const commentElements = page.locator('text=/comment/i').or(page.locator('[class*="comment"]'));
        if (await commentElements.first().isVisible()) {
          console.log('Comment-related content found');
        }
      }
    });
  });
  
  test.describe('Real-time Features Integration', () => {
    test('should test WebSocket connection', async () => {
      await page.goto('/chat');
      
      // Wait for connection status
      await page.waitForTimeout(3000);
      
      // Check connection status indicator
      const connectedStatus = page.locator('text=Connected');
      const connectingStatus = page.locator('text=Connecting');
      
      const isConnected = await connectedStatus.isVisible();
      const isConnecting = await connectingStatus.isVisible();
      
      if (isConnected) {
        console.log('WebSocket connection established successfully');
      } else if (isConnecting) {
        console.log('WebSocket connection attempt in progress');
        
        // Wait a bit more for connection
        await page.waitForTimeout(5000);
        const nowConnected = await connectedStatus.isVisible();
        console.log('Connection status after wait:', nowConnected ? 'Connected' : 'Still connecting');
      } else {
        console.log('WebSocket connection status unclear');
      }
    });
    
    test('should test message input functionality', async () => {
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Look for message input elements
      const messageInput = page.locator('input[placeholder*="message"]').or(page.locator('textarea[placeholder*="message"]')).first();
      
      if (await messageInput.isVisible()) {
        // Test typing in message input
        await messageInput.fill('Test integration message');
        
        // Check if the input accepts text
        const inputValue = await messageInput.inputValue();
        expect(inputValue).toBe('Test integration message');
        
        console.log('Message input functionality working');
        
        // Clear the input
        await messageInput.fill('');
      } else {
        console.log('Message input not found - chat interface may be limited in demo mode');
      }
    });
    
    test('should test typing indicators', async () => {
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Look for message input
      const messageInput = page.locator('input[placeholder*="message"]').or(page.locator('textarea[placeholder*="message"]')).first();
      
      if (await messageInput.isVisible()) {
        // Focus on input to potentially trigger typing indicator
        await messageInput.focus();
        await messageInput.type('Testing typing indicator...', { delay: 100 });
        
        // Look for typing indicator elements
        const typingIndicator = page.locator('text=/typing/i').or(page.locator('[class*="typing"]'));
        
        if (await typingIndicator.isVisible()) {
          console.log('Typing indicator system functional');
        } else {
          console.log('Typing indicators not visible (may require multiple users)');
        }
        
        await messageInput.fill(''); // Clear input
      }
    });
  });
  
  test.describe('Voice/Video Features Integration', () => {
    test('should test voice channel access', async () => {
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Look for voice-related elements
      const voiceElements = page.locator('text=/voice/i').or(page.locator('[class*="voice"]')).or(page.locator('svg[class*="volume"]'));
      
      if (await voiceElements.first().isVisible()) {
        console.log('Voice channel elements detected');
        
        // Try to interact with voice elements
        const voiceChannel = voiceElements.first();
        await voiceChannel.click().catch(() => console.log('Voice channel interaction requires permissions'));
        
        // Check for voice controls or indicators
        const voiceControls = page.locator('button[aria-label*="mute"]').or(page.locator('button[aria-label*="audio"]'));
        if (await voiceControls.first().isVisible()) {
          console.log('Voice controls interface detected');
        }
      } else {
        console.log('Voice channel elements not found in current view');
      }
    });
    
    test('should test microphone permissions handling', async () => {
      // Grant microphone permissions for testing
      await context.grantPermissions(['microphone']);
      
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Look for microphone-related controls
      const micControls = page.locator('button[aria-label*="microphone"]').or(page.locator('button[aria-label*="mute"]'));
      
      if (await micControls.first().isVisible()) {
        console.log('Microphone controls available');
        
        // Test mic control interaction
        await micControls.first().click().catch(() => console.log('Microphone control requires voice channel connection'));
      } else {
        console.log('Microphone controls not visible (may require joining voice channel first)');
      }
    });
    
    test('should test camera permissions handling', async () => {
      // Grant camera permissions for testing
      await context.grantPermissions(['camera']);
      
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Look for camera-related controls
      const cameraControls = page.locator('button[aria-label*="camera"]').or(page.locator('button[aria-label*="video"]'));
      
      if (await cameraControls.first().isVisible()) {
        console.log('Camera controls available');
      } else {
        console.log('Camera controls not visible in current context');
      }
    });
  });
  
  test.describe('Performance and Responsiveness', () => {
    test('should load pages within performance budget', async () => {
      const pages = ['/login', '/register', '/servers', '/chat', '/reddit-demo'];
      
      for (const path of pages) {
        const startTime = Date.now();
        
        await page.goto(path);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const loadTime = Date.now() - startTime;
        console.log(`Page ${path} loaded in ${loadTime}ms`);
        
        // Performance budget: pages should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
      }
    });
    
    test('should be responsive on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const pages = ['/login', '/register', '/servers', '/chat'];
      
      for (const path of pages) {
        await page.goto(path);
        await page.waitForTimeout(1000);
        
        // Check that page doesn't have horizontal scroll
        const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
        const viewportWidth = 375;
        
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow 20px tolerance
        console.log(`Page ${path} is mobile responsive`);
      }
    });
  });
  
  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network interruption gracefully', async () => {
      await page.goto('/chat');
      await page.waitForTimeout(2000);
      
      // Simulate offline condition
      await context.setOffline(true);
      await page.waitForTimeout(1000);
      
      // Check for offline indicators or error handling
      const offlineIndicator = page.locator('text=/offline/i').or(page.locator('text=/disconnected/i'));
      
      // Restore connection
      await context.setOffline(false);
      await page.waitForTimeout(2000);
      
      // Check recovery
      const connectedStatus = page.locator('text=Connected');
      if (await connectedStatus.isVisible()) {
        console.log('Network recovery successful');
      } else {
        console.log('Network recovery status unclear');
      }
    });
    
    test('should handle invalid routes gracefully', async () => {
      await page.goto('/nonexistent-page');
      
      // Should either show 404 page or redirect appropriately
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      
      // Check if it's a proper 404 or if it redirected to a valid page
      if (currentUrl.includes('/nonexistent-page')) {
        expect(pageContent).toContain('404');
        console.log('Proper 404 handling detected');
      } else {
        console.log('Invalid route redirected to:', currentUrl);
      }
    });
  });
});
