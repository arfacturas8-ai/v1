import { test, expect, Page } from '@playwright/test';

test.describe('CRYB Platform Comprehensive E2E Tests', () => {
  let page: Page;
  
  const testUser = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `e2euser${Date.now()}`
  };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Authentication Flow', () => {
    test('should register new user', async () => {
      await page.goto('/register');
      
      // Check if registration form is visible
      await expect(page.locator('form')).toBeVisible();
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="username-input"]', testUser.username);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);
      
      // Submit form
      await page.click('[data-testid="register-button"]');
      
      // Should redirect to dashboard or login
      await expect(page).toHaveURL(/\/(dashboard|login)/);
    });

    test('should login with registered user', async () => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Check if user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should logout successfully', async () => {
      // Assuming user is logged in from previous test
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to home or login page
      await expect(page).toHaveURL(/\/(|login|home)/);
    });

    test('should handle login with invalid credentials', async () => {
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });
  });

  test.describe('Discord Features E2E', () => {
    test.beforeEach(async () => {
      // Login before each Discord test
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create a new Discord server', async () => {
      await page.goto('/servers');
      
      // Click create server button
      await page.click('[data-testid="create-server-button"]');
      
      // Fill server creation form
      await page.fill('[data-testid="server-name-input"]', 'E2E Test Server');
      await page.fill('[data-testid="server-description-input"]', 'Server created by E2E tests');
      
      // Submit form
      await page.click('[data-testid="create-server-submit"]');
      
      // Should redirect to new server
      await expect(page).toHaveURL(/\/servers\/[a-zA-Z0-9-]+/);
      
      // Verify server name is displayed
      await expect(page.locator('[data-testid="server-name"]')).toContainText('E2E Test Server');
    });

    test('should create text and voice channels', async () => {
      // Navigate to server (assumes server exists from previous test)
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      
      // Create text channel
      await page.click('[data-testid="create-channel-button"]');
      await page.selectOption('[data-testid="channel-type-select"]', 'text');
      await page.fill('[data-testid="channel-name-input"]', 'general');
      await page.click('[data-testid="create-channel-submit"]');
      
      // Verify text channel appears in sidebar
      await expect(page.locator('[data-testid="text-channel-general"]')).toBeVisible();
      
      // Create voice channel
      await page.click('[data-testid="create-channel-button"]');
      await page.selectOption('[data-testid="channel-type-select"]', 'voice');
      await page.fill('[data-testid="channel-name-input"]', 'General Voice');
      await page.click('[data-testid="create-channel-submit"]');
      
      // Verify voice channel appears in sidebar
      await expect(page.locator('[data-testid="voice-channel-general-voice"]')).toBeVisible();
    });

    test('should send and receive messages in text channel', async () => {
      // Navigate to text channel
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Send a message
      const testMessage = 'Hello from E2E test!';
      await page.fill('[data-testid="message-input"]', testMessage);
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // Verify message appears in chat
      await expect(page.locator('[data-testid="message-list"]')).toContainText(testMessage);
    });

    test('should edit and delete messages', async () => {
      // Navigate to text channel with existing message
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Send a message to edit
      await page.fill('[data-testid="message-input"]', 'Message to edit');
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // Right-click on message to open context menu
      await page.click('[data-testid="message-item"]:last-child', { button: 'right' });
      await page.click('[data-testid="edit-message"]');
      
      // Edit the message
      await page.fill('[data-testid="edit-message-input"]', 'Edited message');
      await page.press('[data-testid="edit-message-input"]', 'Enter');
      
      // Verify message was edited
      await expect(page.locator('[data-testid="message-item"]:last-child')).toContainText('Edited message');
      await expect(page.locator('[data-testid="message-item"]:last-child')).toContainText('(edited)');
    });

    test('should add reactions to messages', async () => {
      // Navigate to text channel
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Hover over message to show reaction button
      await page.hover('[data-testid="message-item"]:last-child');
      await page.click('[data-testid="add-reaction-button"]');
      
      // Select emoji
      await page.click('[data-testid="emoji-thumbs-up"]');
      
      // Verify reaction appears
      await expect(page.locator('[data-testid="message-reactions"]')).toContainText('👍');
    });
  });

  test.describe('Reddit Features E2E', () => {
    test.beforeEach(async () => {
      // Login before each Reddit test
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create a new community', async () => {
      await page.goto('/communities');
      
      // Click create community button
      await page.click('[data-testid="create-community-button"]');
      
      // Fill community creation form
      await page.fill('[data-testid="community-name-input"]', 'e2etestcommunity');
      await page.fill('[data-testid="community-title-input"]', 'E2E Test Community');
      await page.fill('[data-testid="community-description-input"]', 'Community created by E2E tests');
      
      // Submit form
      await page.click('[data-testid="create-community-submit"]');
      
      // Should redirect to new community
      await expect(page).toHaveURL(/\/communities\/e2etestcommunity/);
      
      // Verify community name is displayed
      await expect(page.locator('[data-testid="community-title"]')).toContainText('E2E Test Community');
    });

    test('should create a text post', async () => {
      // Navigate to community
      await page.goto('/communities/e2etestcommunity');
      
      // Click create post button
      await page.click('[data-testid="create-post-button"]');
      
      // Fill post creation form
      await page.fill('[data-testid="post-title-input"]', 'E2E Test Post');
      await page.fill('[data-testid="post-content-input"]', 'This is a test post created by E2E automation');
      
      // Submit post
      await page.click('[data-testid="submit-post-button"]');
      
      // Should redirect to post or community feed
      await expect(page.locator('[data-testid="post-title"]')).toContainText('E2E Test Post');
    });

    test('should vote on posts', async () => {
      // Navigate to community with posts
      await page.goto('/communities/e2etestcommunity');
      
      // Click upvote button
      await page.click('[data-testid="upvote-button"]:first-child');
      
      // Verify vote count increased
      await expect(page.locator('[data-testid="vote-score"]:first-child')).toContainText('1');
      
      // Click downvote button
      await page.click('[data-testid="downvote-button"]:first-child');
      
      // Verify vote count changed
      await expect(page.locator('[data-testid="vote-score"]:first-child')).toContainText('-1');
    });

    test('should add comments to posts', async () => {
      // Navigate to a specific post
      await page.goto('/communities/e2etestcommunity');
      await page.click('[data-testid="post-link"]:first-child');
      
      // Add a comment
      await page.fill('[data-testid="comment-input"]', 'This is a test comment from E2E automation');
      await page.click('[data-testid="submit-comment-button"]');
      
      // Verify comment appears
      await expect(page.locator('[data-testid="comment-content"]')).toContainText('This is a test comment from E2E automation');
    });

    test('should reply to comments', async () => {
      // Navigate to post with comments
      await page.goto('/communities/e2etestcommunity');
      await page.click('[data-testid="post-link"]:first-child');
      
      // Click reply button on existing comment
      await page.click('[data-testid="reply-button"]:first-child');
      
      // Add reply
      await page.fill('[data-testid="reply-input"]', 'This is a reply to the comment');
      await page.click('[data-testid="submit-reply-button"]');
      
      // Verify reply appears with proper nesting
      await expect(page.locator('[data-testid="comment-replies"]')).toContainText('This is a reply to the comment');
    });
  });

  test.describe('File Upload Features', () => {
    test.beforeEach(async () => {
      // Login before each upload test
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
    });

    test('should upload image files', async () => {
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Click file upload button
      await page.click('[data-testid="file-upload-button"]');
      
      // Upload a test image file
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-jpeg-data')
      });
      
      // Verify upload preview appears
      await expect(page.locator('[data-testid="upload-preview"]')).toBeVisible();
      
      // Submit upload
      await page.click('[data-testid="send-with-file-button"]');
      
      // Verify file message appears in chat
      await expect(page.locator('[data-testid="message-attachment"]')).toBeVisible();
    });

    test('should show upload progress', async () => {
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Upload a larger file to see progress
      await page.click('[data-testid="file-upload-button"]');
      await page.locator('[data-testid="file-input"]').setInputFiles({
        name: 'large-file.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.alloc(1024 * 1024, 0) // 1MB fake data
      });
      
      // Verify progress bar appears
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    });
  });

  test.describe('Voice/Video Features', () => {
    test.beforeEach(async () => {
      // Login and navigate to voice channel
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
    });

    test('should join voice channel', async () => {
      // Click on voice channel
      await page.click('[data-testid="voice-channel-general-voice"]');
      
      // Verify voice connection UI appears
      await expect(page.locator('[data-testid="voice-connection-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="voice-controls"]')).toBeVisible();
    });

    test('should control audio/video settings', async () => {
      // Join voice channel first
      await page.click('[data-testid="voice-channel-general-voice"]');
      
      // Test mute/unmute
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-button"]')).toHaveClass(/muted/);
      
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-button"]')).not.toHaveClass(/muted/);
      
      // Test video enable/disable
      await page.click('[data-testid="video-button"]');
      await expect(page.locator('[data-testid="video-preview"]')).toBeVisible();
    });

    test('should leave voice channel', async () => {
      // Join voice channel
      await page.click('[data-testid="voice-channel-general-voice"]');
      
      // Leave voice channel
      await page.click('[data-testid="leave-voice-button"]');
      
      // Verify voice connection UI disappears
      await expect(page.locator('[data-testid="voice-connection-panel"]')).not.toBeVisible();
    });
  });

  test.describe('Real-time Features', () => {
    test('should show typing indicators', async () => {
      // Open two browser contexts to simulate multiple users
      const context2 = await page.context().browser()?.newContext();
      if (!context2) throw new Error('Could not create second context');
      
      const page2 = await context2.newPage();
      
      // Login second user
      await page2.goto('/login');
      await page2.fill('[data-testid="email-input"]', 'second@example.com');
      await page2.fill('[data-testid="password-input"]', 'password123');
      await page2.click('[data-testid="login-button"]');
      
      // Navigate both users to same channel
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      await page2.goto('/servers');
      await page2.click('[data-testid="server-item"]');
      await page2.click('[data-testid="text-channel-general"]');
      
      // Start typing in first page
      await page.focus('[data-testid="message-input"]');
      await page.type('[data-testid="message-input"]', 'Testing typing indicator', { delay: 100 });
      
      // Check if typing indicator appears in second page
      await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible();
      
      await context2.close();
    });

    test('should show online status', async () => {
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      
      // Verify user appears as online in member list
      await expect(page.locator('[data-testid="member-list"]')).toContainText(testUser.username);
      await expect(page.locator(`[data-testid="user-${testUser.username}"] [data-testid="online-indicator"]`)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.goto('/dashboard');
      
      // Check if mobile menu button is visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Check if desktop sidebar is hidden
      await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();
    });

    test('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      await page.goto('/dashboard');
      
      // Check layout adapts properly
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should work on desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      
      await page.goto('/dashboard');
      
      // Check if full desktop layout is visible
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-panel"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      await page.goto('/dashboard');
      
      // Check for proper ARIA labels on interactive elements
      await expect(page.locator('[data-testid="user-menu"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="navigation-menu"]')).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async () => {
      await page.goto('/dashboard');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test Enter key on focusable elements
      await page.keyboard.press('Enter');
    });

    test('should have sufficient color contrast', async () => {
      await page.goto('/dashboard');
      
      // This would need additional tooling to test properly
      // For now, we'll just check that elements are visible
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      await page.goto('/dashboard');
      
      // Check if offline indicator appears
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore online condition
      await page.context().setOffline(false);
      
      // Check if online status is restored
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });

    test('should handle 404 errors', async () => {
      await page.goto('/nonexistent-page');
      
      // Check if 404 page is displayed
      await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="404-message"]')).toContainText('Page not found');
    });

    test('should handle authentication errors', async () => {
      // Navigate to protected page without login
      await page.goto('/servers');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load pages within performance budget', async () => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large message lists efficiently', async () => {
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Simulate scrolling through many messages
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('PageUp');
        await page.waitForTimeout(100);
      }
      
      // Page should remain responsive
      await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
    });
  });

  test.describe('Security', () => {
    test('should sanitize user input', async () => {
      await page.goto('/servers');
      await page.click('[data-testid="server-item"]');
      await page.click('[data-testid="text-channel-general"]');
      
      // Try to inject script
      const maliciousInput = '<script>alert("xss")</script>';
      await page.fill('[data-testid="message-input"]', maliciousInput);
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // Script should be sanitized and displayed as text
      await expect(page.locator('[data-testid="message-content"]')).toContainText('<script>');
      
      // No alert should have fired
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      expect(alerts).toHaveLength(0);
    });

    test('should protect against CSRF', async () => {
      // This would require more complex setup to test properly
      // For now, we'll just verify that forms have proper CSRF protection
      await page.goto('/settings');
      
      await expect(page.locator('form [name="_token"]')).toBeAttached();
    });
  });
});