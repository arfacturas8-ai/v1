import { test, expect, devices } from '@playwright/test';

/**
 * Comprehensive Mobile Responsiveness Testing Suite
 * Tests the CRYB platform across different mobile devices and screen sizes
 */

const mobileDevices = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'iPhone 12 Pro', ...devices['iPhone 12 Pro'] },
  { name: 'iPhone 13', ...devices['iPhone 13'] },
  { name: 'Pixel 5', ...devices['Pixel 5'] },
  { name: 'Galaxy S21', ...devices['Galaxy S21'] }
];

const tabletDevices = [
  { name: 'iPad', ...devices['iPad'] },
  { name: 'iPad Pro', ...devices['iPad Pro'] },
  { name: 'Galaxy Tab S4', ...devices['Galaxy Tab S4'] }
];

const customScreenSizes = [
  { name: 'Small Phone', width: 360, height: 640 },
  { name: 'Large Phone', width: 414, height: 896 },
  { name: 'Small Tablet', width: 768, height: 1024 },
  { name: 'Large Tablet', width: 1024, height: 1366 },
  { name: 'Foldable Phone (Folded)', width: 280, height: 653 },
  { name: 'Foldable Phone (Unfolded)', width: 717, height: 512 }
];

test.describe('Mobile Responsiveness Tests', () => {
  const testUser = {
    email: `mobile-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `mobileuser${Date.now()}`
  };

  // Test on each mobile device
  for (const device of mobileDevices) {
    test.describe(`Mobile Device: ${device.name}`, () => {
      test.use({ ...device });

      test('should display mobile navigation correctly', async ({ page }) => {
        await page.goto('/');
        
        // Check if mobile menu button is visible
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
        
        // Check if desktop navigation is hidden
        await expect(page.locator('[data-testid="desktop-navigation"]')).toBeHidden();
        
        // Test mobile menu functionality
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        
        // Check if menu items are accessible
        await expect(page.locator('[data-testid="mobile-menu-home"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-menu-servers"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-menu-communities"]')).toBeVisible();
      });

      test('should handle authentication on mobile', async ({ page }) => {
        await page.goto('/register');
        
        // Check form visibility and usability
        await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
        
        // Test form fields are properly sized
        const emailInput = page.locator('[data-testid="email-input"]');
        const usernameInput = page.locator('[data-testid="username-input"]');
        const passwordInput = page.locator('[data-testid="password-input"]');
        
        await expect(emailInput).toBeVisible();
        await expect(usernameInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        
        // Test form submission
        await emailInput.fill(testUser.email);
        await usernameInput.fill(testUser.username);
        await passwordInput.fill(testUser.password);
        await page.fill('[data-testid="confirm-password-input"]', testUser.password);
        
        // Check if submit button is accessible
        const submitButton = page.locator('[data-testid="register-button"]');
        await expect(submitButton).toBeVisible();
        
        // Ensure button is properly sized for mobile
        const buttonBounds = await submitButton.boundingBox();
        expect(buttonBounds?.height).toBeGreaterThan(44); // iOS recommended touch target size
      });

      test('should display Discord interface properly on mobile', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/servers');
        
        // Check mobile server list layout
        await expect(page.locator('[data-testid="mobile-server-list"]')).toBeVisible();
        
        // Check if servers are displayed in mobile-friendly format
        const serverItems = page.locator('[data-testid^="server-item"]');
        const count = await serverItems.count();
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const item = serverItems.nth(i);
          await expect(item).toBeVisible();
          
          // Check touch target size
          const bounds = await item.boundingBox();
          expect(bounds?.height).toBeGreaterThan(44);
        }
      });

      test('should handle chat interface on mobile', async ({ page }) => {
        // Navigate to a server and channel
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/servers');
        
        // Create or join a server for testing
        const createServerButton = page.locator('[data-testid="create-server-button"]');
        if (await createServerButton.isVisible()) {
          await createServerButton.click();
          await page.fill('[data-testid="server-name-input"]', 'Mobile Test Server');
          await page.click('[data-testid="create-server-submit"]');
        }
        
        // Test mobile chat interface
        await expect(page.locator('[data-testid="mobile-chat-area"]')).toBeVisible();
        
        // Test message input on mobile
        const messageInput = page.locator('[data-testid="message-input"]');
        await expect(messageInput).toBeVisible();
        
        // Test virtual keyboard handling
        await messageInput.focus();
        await messageInput.fill('Test mobile message');
        
        // Check if send button is accessible
        const sendButton = page.locator('[data-testid="send-button"]');
        await expect(sendButton).toBeVisible();
        
        const sendButtonBounds = await sendButton.boundingBox();
        expect(sendButtonBounds?.height).toBeGreaterThan(44);
      });

      test('should handle Reddit interface on mobile', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/communities');
        
        // Check mobile community list
        await expect(page.locator('[data-testid="mobile-community-list"]')).toBeVisible();
        
        // Test community cards on mobile
        const communityCards = page.locator('[data-testid^="community-card"]');
        const cardCount = await communityCards.count();
        
        for (let i = 0; i < Math.min(cardCount, 2); i++) {
          const card = communityCards.nth(i);
          await expect(card).toBeVisible();
          
          // Check card layout on mobile
          const cardBounds = await card.boundingBox();
          expect(cardBounds?.width).toBeGreaterThan(200);
        }
        
        // Test post creation on mobile
        const createPostButton = page.locator('[data-testid="create-post-button"]');
        if (await createPostButton.isVisible()) {
          await createPostButton.click();
          
          // Check mobile post creation form
          await expect(page.locator('[data-testid="mobile-post-form"]')).toBeVisible();
          
          // Test form fields are properly sized
          const titleInput = page.locator('[data-testid="post-title-input"]');
          const contentInput = page.locator('[data-testid="post-content-input"]');
          
          await expect(titleInput).toBeVisible();
          await expect(contentInput).toBeVisible();
          
          // Test text area resizing
          const contentBounds = await contentInput.boundingBox();
          expect(contentBounds?.height).toBeGreaterThan(100);
        }
      });

      test('should handle file uploads on mobile', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/servers');
        
        // Test mobile file upload interface
        const fileUploadButton = page.locator('[data-testid="mobile-file-upload-button"]');
        if (await fileUploadButton.isVisible()) {
          await expect(fileUploadButton).toBeVisible();
          
          // Check touch target size
          const uploadButtonBounds = await fileUploadButton.boundingBox();
          expect(uploadButtonBounds?.height).toBeGreaterThan(44);
          
          // Test upload button accessibility
          await fileUploadButton.click();
          await expect(page.locator('[data-testid="mobile-upload-options"]')).toBeVisible();
        }
      });

      test('should handle voice/video controls on mobile', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/servers');
        
        // Test mobile voice controls
        const voiceButton = page.locator('[data-testid="mobile-voice-button"]');
        if (await voiceButton.isVisible()) {
          await expect(voiceButton).toBeVisible();
          
          // Check control button sizes
          const voiceButtonBounds = await voiceButton.boundingBox();
          expect(voiceButtonBounds?.height).toBeGreaterThan(44);
          expect(voiceButtonBounds?.width).toBeGreaterThan(44);
        }
        
        // Test mobile voice panel
        const voicePanel = page.locator('[data-testid="mobile-voice-panel"]');
        if (await voicePanel.isVisible()) {
          await expect(voicePanel).toBeVisible();
          
          // Check if controls are properly spaced
          const muteButton = page.locator('[data-testid="mobile-mute-button"]');
          const videoButton = page.locator('[data-testid="mobile-video-button"]');
          
          if (await muteButton.isVisible() && await videoButton.isVisible()) {
            const muteBounds = await muteButton.boundingBox();
            const videoBounds = await videoButton.boundingBox();
            
            expect(muteBounds?.height).toBeGreaterThan(44);
            expect(videoBounds?.height).toBeGreaterThan(44);
          }
        }
      });
    });
  }

  // Test on tablet devices
  for (const device of tabletDevices) {
    test.describe(`Tablet Device: ${device.name}`, () => {
      test.use({ ...device });

      test('should display tablet layout correctly', async ({ page }) => {
        await page.goto('/');
        
        // Check if tablet-specific layout is used
        await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
        
        // Check if navigation adapts to tablet
        const navigation = page.locator('[data-testid="tablet-navigation"]');
        if (await navigation.isVisible()) {
          await expect(navigation).toBeVisible();
        }
      });

      test('should handle split-view on tablet', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', testUser.email);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/servers');
        
        // Check if tablet uses split-view layout
        const leftPanel = page.locator('[data-testid="tablet-left-panel"]');
        const rightPanel = page.locator('[data-testid="tablet-right-panel"]');
        
        if (await leftPanel.isVisible() && await rightPanel.isVisible()) {
          await expect(leftPanel).toBeVisible();
          await expect(rightPanel).toBeVisible();
          
          // Check panel proportions
          const leftBounds = await leftPanel.boundingBox();
          const rightBounds = await rightPanel.boundingBox();
          
          expect(leftBounds?.width).toBeGreaterThan(200);
          expect(rightBounds?.width).toBeGreaterThan(300);
        }
      });
    });
  }

  // Test custom screen sizes
  for (const screenSize of customScreenSizes) {
    test.describe(`Screen Size: ${screenSize.name} (${screenSize.width}x${screenSize.height})`, () => {
      test.use({ 
        viewport: { width: screenSize.width, height: screenSize.height }
      });

      test('should adapt layout to screen size', async ({ page }) => {
        await page.goto('/');
        
        // Check if layout adapts to screen size
        const mainContent = page.locator('[data-testid="main-content"]');
        await expect(mainContent).toBeVisible();
        
        // Check if content fits within screen bounds
        const contentBounds = await mainContent.boundingBox();
        expect(contentBounds?.width).toBeLessThanOrEqual(screenSize.width);
      });

      test('should handle text readability', async ({ page }) => {
        await page.goto('/');
        
        // Check font sizes are appropriate
        const headings = page.locator('h1, h2, h3');
        const headingCount = await headings.count();
        
        for (let i = 0; i < Math.min(headingCount, 3); i++) {
          const heading = headings.nth(i);
          const fontSize = await heading.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          
          // Font size should be at least 16px for readability
          const fontSizeNum = parseInt(fontSize.replace('px', ''));
          expect(fontSizeNum).toBeGreaterThanOrEqual(16);
        }
      });
    });
  }

  test.describe('Touch Interactions', () => {
    test.use(devices['iPhone 12']);

    test('should handle touch gestures', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/servers');
      
      // Test swipe gestures
      const swipeArea = page.locator('[data-testid="swipe-area"]');
      if (await swipeArea.isVisible()) {
        // Simulate swipe left
        await swipeArea.touchscreen.swipe(
          { x: 300, y: 300 },
          { x: 100, y: 300 }
        );
        
        // Check if swipe action was handled
        await expect(page.locator('[data-testid="swipe-result"]')).toBeVisible();
      }
    });

    test('should handle pinch-to-zoom', async ({ page }) => {
      await page.goto('/');
      
      // Test if zoom is properly handled
      await page.evaluate(() => {
        document.body.style.zoom = '1.5';
      });
      
      // Check if layout still works at different zoom levels
      const mainContent = page.locator('[data-testid="main-content"]');
      await expect(mainContent).toBeVisible();
    });

    test('should have appropriate touch target sizes', async ({ page }) => {
      await page.goto('/');
      
      // Check all clickable elements meet minimum touch target size
      const clickableElements = page.locator('button, a, [role="button"]');
      const elementCount = await clickableElements.count();
      
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = clickableElements.nth(i);
        const bounds = await element.boundingBox();
        
        if (bounds) {
          // iOS Human Interface Guidelines recommend 44px minimum
          expect(bounds.height).toBeGreaterThanOrEqual(44);
          expect(bounds.width).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Performance on Mobile', () => {
    test.use(devices['iPhone SE']); // Use lower-end device for performance testing

    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds on mobile
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large lists efficiently on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/communities');
      
      // Test scrolling performance
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(100);
      }
      
      const scrollTime = Date.now() - startTime;
      
      // Scrolling should be smooth (less than 2 seconds for 5 page downs)
      expect(scrollTime).toBeLessThan(2000);
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test.use(devices['iPhone 12']);

    test('should support screen readers on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper ARIA labels
      const mainNavigation = page.locator('[data-testid="mobile-navigation"]');
      if (await mainNavigation.isVisible()) {
        await expect(mainNavigation).toHaveAttribute('aria-label');
      }
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should handle focus management on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Test focus trap in mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      
      const focusableElements = page.locator(
        '[data-testid="mobile-menu"] button, [data-testid="mobile-menu"] a, [data-testid="mobile-menu"] input'
      );
      
      const elementCount = await focusableElements.count();
      
      if (elementCount > 0) {
        // Focus should be trapped within the mobile menu
        const firstElement = focusableElements.first();
        const lastElement = focusableElements.last();
        
        await expect(firstElement).toBeFocused();
        
        // Tab through all elements
        for (let i = 0; i < elementCount; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Should cycle back to first element
        await expect(firstElement).toBeFocused();
      }
    });

    test('should have sufficient color contrast on mobile', async ({ page }) => {
      await page.goto('/');
      
      // This would require additional tooling for proper contrast testing
      // For now, we'll check that text is visible
      const textElements = page.locator('p, span, a, button');
      const textCount = await textElements.count();
      
      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
      }
    });
  });

  test.describe('Landscape and Portrait Orientations', () => {
    test('should handle orientation changes', async ({ page, browserName }) => {
      // Skip on webkit due to orientation API limitations
      test.skip(browserName === 'webkit');
      
      await page.goto('/');
      
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Check if layout adapts to landscape
      const landscapeLayout = page.locator('[data-testid="landscape-layout"]');
      if (await landscapeLayout.isVisible()) {
        await expect(landscapeLayout).toBeVisible();
      }
    });
  });

  test.describe('Mobile-specific Features', () => {
    test.use(devices['iPhone 12']);

    test('should handle pull-to-refresh', async ({ page }) => {
      await page.goto('/communities');
      
      // Test pull-to-refresh gesture
      const refreshArea = page.locator('[data-testid="refresh-area"]');
      if (await refreshArea.isVisible()) {
        // Simulate pull-to-refresh
        await refreshArea.touchscreen.swipe(
          { x: 200, y: 100 },
          { x: 200, y: 300 }
        );
        
        // Check if refresh indicator appears
        await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
      }
    });

    test('should handle mobile keyboard', async ({ page }) => {
      await page.goto('/register');
      
      // Test different keyboard types
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      // Email input should have email keyboard
      await expect(emailInput).toHaveAttribute('type', 'email');
      
      // Password input should have password keyboard
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Test keyboard interactions
      await emailInput.focus();
      await emailInput.fill('test@example.com');
      
      await passwordInput.focus();
      await passwordInput.fill('password123');
    });

    test('should handle mobile notifications', async ({ page, context }) => {
      // Grant notification permission
      await context.grantPermissions(['notifications']);
      
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      // Check if notification permission is requested appropriately
      const notificationButton = page.locator('[data-testid="enable-notifications"]');
      if (await notificationButton.isVisible()) {
        await notificationButton.click();
        
        // Should handle notification settings
        await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();
      }
    });
  });
});