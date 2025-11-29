import { test, expect, Page } from '@playwright/test';

test.describe('Complete User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Content Creation Flow', () => {
    test('should create and publish a new post', async () => {
      // Navigate to create post
      await page.click('[data-testid="create-post-button"]');
      await expect(page).toHaveURL('/submit');

      // Fill post form
      const postTitle = `Test Post ${Date.now()}`;
      const postContent = 'This is a test post created by E2E tests.';

      await page.fill('[data-testid="post-title-input"]', postTitle);
      await page.fill('[data-testid="post-content-input"]', postContent);
      
      // Select community
      await page.click('[data-testid="community-select"]');
      await page.click('[data-testid="community-option-general"]');
      
      // Add tags
      await page.fill('[data-testid="tags-input"]', 'test,e2e,automation');
      
      // Submit post
      await page.click('[data-testid="submit-post-button"]');

      // Should redirect to post page
      await expect(page.url()).toMatch(/\/posts\/\w+/);
      
      // Verify post content
      await expect(page.locator('[data-testid="post-title"]')).toContainText(postTitle);
      await expect(page.locator('[data-testid="post-content"]')).toContainText(postContent);
    });

    test('should create post with image upload', async () => {
      await page.click('[data-testid="create-post-button"]');
      
      await page.fill('[data-testid="post-title-input"]', 'Post with Image');
      
      // Upload image
      const fileInput = page.locator('[data-testid="image-upload-input"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });

      // Wait for upload to complete
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      await page.click('[data-testid="submit-post-button"]');

      // Verify image is displayed in post
      await expect(page.locator('[data-testid="post-image"]')).toBeVisible();
    });

    test('should validate post form fields', async () => {
      await page.click('[data-testid="create-post-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-post-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="title-error"]')).toContainText('required');
      await expect(page.locator('[data-testid="content-error"]')).toContainText('required');
    });

    test('should save post as draft', async () => {
      await page.click('[data-testid="create-post-button"]');
      
      await page.fill('[data-testid="post-title-input"]', 'Draft Post');
      await page.fill('[data-testid="post-content-input"]', 'This is a draft post.');
      
      // Save as draft
      await page.click('[data-testid="save-draft-button"]');
      
      await expect(page.locator('[data-testid="draft-saved-message"]')).toBeVisible();
      
      // Go to drafts page
      await page.click('[data-testid="user-menu"]');
      await page.click('text=My Drafts');
      
      // Should see draft post
      await expect(page.locator('text=Draft Post')).toBeVisible();
    });
  });

  test.describe('Community Interaction Flow', () => {
    test('should join and interact with communities', async () => {
      // Go to communities page
      await page.click('[data-testid="communities-nav"]');
      await expect(page).toHaveURL('/communities');

      // Find a community to join
      const communityCard = page.locator('[data-testid="community-card"]').first();
      const communityName = await communityCard.locator('[data-testid="community-name"]').textContent();
      
      // Join community
      await communityCard.locator('[data-testid="join-button"]').click();
      
      // Should show as joined
      await expect(communityCard.locator('[data-testid="join-button"]')).toContainText('Joined');
      
      // Visit community page
      await communityCard.click();
      
      // Should be on community page
      await expect(page.locator('[data-testid="community-header"]')).toContainText(communityName || '');
      
      // Create post in community
      await page.click('[data-testid="create-post-button"]');
      await page.fill('[data-testid="post-title-input"]', 'Community Post');
      await page.fill('[data-testid="post-content-input"]', 'This is a post in the community.');
      await page.click('[data-testid="submit-post-button"]');
      
      // Should appear in community feed
      await page.goBack();
      await expect(page.locator('text=Community Post')).toBeVisible();
    });

    test('should browse community content', async () => {
      await page.click('[data-testid="communities-nav"]');
      
      // Click on first community
      const firstCommunity = page.locator('[data-testid="community-card"]').first();
      await firstCommunity.click();
      
      // Should show community posts
      await expect(page.locator('[data-testid="community-posts"]')).toBeVisible();
      
      // Should be able to sort posts
      await page.click('[data-testid="sort-dropdown"]');
      await page.click('[data-testid="sort-new"]');
      
      await expect(page.url()).toContain('sort=new');
      
      // Should be able to filter by time
      await page.click('[data-testid="time-filter"]');
      await page.click('[data-testid="time-week"]');
      
      await expect(page.url()).toContain('time=week');
    });

    test('should search communities', async () => {
      await page.click('[data-testid="communities-nav"]');
      
      // Search for communities
      await page.fill('[data-testid="community-search"]', 'technology');
      await page.press('[data-testid="community-search"]', 'Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Results should contain search term
      const results = page.locator('[data-testid="community-card"]');
      const count = await results.count();
      
      for (let i = 0; i < count; i++) {
        const text = await results.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('tech');
      }
    });
  });

  test.describe('Messaging and Chat Flow', () => {
    test('should send and receive messages in channel', async () => {
      // Go to a channel
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="channel-general"]');
      
      // Send a message
      const testMessage = `Test message ${Date.now()}`;
      await page.fill('[data-testid="message-input"]', testMessage);
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // Should appear in chat
      await expect(page.locator(`text=${testMessage}`)).toBeVisible();
      
      // Message should have timestamp and author
      const messageElement = page.locator(`[data-testid="message"]:has-text("${testMessage}")`);
      await expect(messageElement.locator('[data-testid="message-author"]')).toBeVisible();
      await expect(messageElement.locator('[data-testid="message-timestamp"]')).toBeVisible();
    });

    test('should react to messages', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="channel-general"]');
      
      // Find a message to react to
      const firstMessage = page.locator('[data-testid="message"]').first();
      
      // Hover to show reaction button
      await firstMessage.hover();
      await firstMessage.locator('[data-testid="react-button"]').click();
      
      // Select emoji
      await page.click('[data-testid="emoji-👍"]');
      
      // Should show reaction
      await expect(firstMessage.locator('[data-testid="reaction-👍"]')).toBeVisible();
    });

    test('should reply to messages', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="channel-general"]');
      
      // Find a message to reply to
      const firstMessage = page.locator('[data-testid="message"]').first();
      
      // Click reply
      await firstMessage.hover();
      await firstMessage.locator('[data-testid="reply-button"]').click();
      
      // Should show reply interface
      await expect(page.locator('[data-testid="reply-to-indicator"]')).toBeVisible();
      
      // Send reply
      const replyText = `Reply ${Date.now()}`;
      await page.fill('[data-testid="message-input"]', replyText);
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // Should show as reply
      const replyMessage = page.locator(`[data-testid="message"]:has-text("${replyText}")`);
      await expect(replyMessage.locator('[data-testid="reply-indicator"]')).toBeVisible();
    });

    test('should handle file uploads in chat', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="channel-general"]');
      
      // Upload file
      const fileInput = page.locator('[data-testid="file-upload-input"]');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake-pdf-data')
      });
      
      // Should show file preview
      await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
      
      // Send file
      await page.click('[data-testid="send-file-button"]');
      
      // Should appear in chat as file message
      await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
    });

    test('should show typing indicators', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="channel-general"]');
      
      // Start typing
      await page.fill('[data-testid="message-input"]', 'Typing a message...');
      
      // In a real test with multiple users, this would show typing indicator
      // For now, just verify input works
      await expect(page.locator('[data-testid="message-input"]')).toHaveValue('Typing a message...');
    });
  });

  test.describe('Voice and Video Features', () => {
    test('should join voice channel', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="voice-channel-general"]');
      
      // Should show voice channel interface
      await expect(page.locator('[data-testid="voice-channel-ui"]')).toBeVisible();
      
      // Join voice
      await page.click('[data-testid="join-voice-button"]');
      
      // Should request microphone permission and show voice controls
      await expect(page.locator('[data-testid="voice-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="mute-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="leave-voice-button"]')).toBeVisible();
    });

    test('should start video call', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="voice-channel-general"]');
      
      await page.click('[data-testid="join-voice-button"]');
      
      // Start video
      await page.click('[data-testid="start-video-button"]');
      
      // Should show video interface
      await expect(page.locator('[data-testid="video-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="video-controls"]')).toBeVisible();
    });

    test('should handle voice controls', async () => {
      await page.click('[data-testid="channels-nav"]');
      await page.click('[data-testid="voice-channel-general"]');
      await page.click('[data-testid="join-voice-button"]');
      
      // Test mute/unmute
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-button"]')).toHaveClass(/muted/);
      
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-button"]')).not.toHaveClass(/muted/);
      
      // Test volume control
      const volumeSlider = page.locator('[data-testid="volume-slider"]');
      await volumeSlider.click();
      
      // Leave voice
      await page.click('[data-testid="leave-voice-button"]');
      await expect(page.locator('[data-testid="voice-controls"]')).not.toBeVisible();
    });
  });

  test.describe('Notification Flow', () => {
    test('should receive and manage notifications', async () => {
      // Go to notifications
      await page.click('[data-testid="notifications-nav"]');
      await expect(page).toHaveURL('/notifications');
      
      // Should show notifications list
      await expect(page.locator('[data-testid="notifications-list"]')).toBeVisible();
      
      // Mark notification as read
      const firstNotification = page.locator('[data-testid="notification"]').first();
      await firstNotification.locator('[data-testid="mark-read-button"]').click();
      
      // Should be marked as read
      await expect(firstNotification).toHaveClass(/read/);
      
      // Mark all as read
      await page.click('[data-testid="mark-all-read-button"]');
      
      // All notifications should be marked as read
      const notifications = page.locator('[data-testid="notification"]');
      const count = await notifications.count();
      
      for (let i = 0; i < count; i++) {
        await expect(notifications.nth(i)).toHaveClass(/read/);
      }
    });

    test('should filter notifications by type', async () => {
      await page.click('[data-testid="notifications-nav"]');
      
      // Filter by mentions
      await page.click('[data-testid="filter-mentions"]');
      
      // Should only show mention notifications
      const notifications = page.locator('[data-testid="notification"]');
      const count = await notifications.count();
      
      for (let i = 0; i < count; i++) {
        await expect(notifications.nth(i)).toHaveAttribute('data-type', 'mention');
      }
    });
  });

  test.describe('Search and Discovery', () => {
    test('should search across platform content', async () => {
      // Use global search
      await page.fill('[data-testid="global-search-input"]', 'test content');
      await page.press('[data-testid="global-search-input"]', 'Enter');
      
      await expect(page).toHaveURL(/\/search\?q=test\+content/);
      
      // Should show search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Should have different content types
      await expect(page.locator('[data-testid="posts-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="communities-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="users-results"]')).toBeVisible();
    });

    test('should filter search results', async () => {
      await page.fill('[data-testid="global-search-input"]', 'technology');
      await page.press('[data-testid="global-search-input"]', 'Enter');
      
      // Filter by posts only
      await page.click('[data-testid="filter-posts"]');
      
      await expect(page.locator('[data-testid="posts-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="communities-results"]')).not.toBeVisible();
      
      // Filter by time range
      await page.click('[data-testid="time-filter"]');
      await page.click('[data-testid="time-week"]');
      
      await expect(page.url()).toContain('time=week');
    });

    test('should search within communities', async () => {
      await page.click('[data-testid="communities-nav"]');
      await page.click('[data-testid="community-card"]');
      
      // Search within community
      await page.fill('[data-testid="community-search"]', 'discussion');
      await page.press('[data-testid="community-search"]', 'Enter');
      
      // Should show community-specific results
      await expect(page.locator('[data-testid="community-search-results"]')).toBeVisible();
    });
  });

  test.describe('User Profile and Settings', () => {
    test('should update user profile', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Profile');
      
      await expect(page).toHaveURL('/profile');
      
      // Edit profile
      await page.click('[data-testid="edit-profile-button"]');
      
      const newDisplayName = `Updated User ${Date.now()}`;
      await page.fill('[data-testid="display-name-input"]', newDisplayName);
      await page.fill('[data-testid="bio-input"]', 'Updated bio text');
      
      await page.click('[data-testid="save-profile-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Should display updated information
      await expect(page.locator('[data-testid="display-name"]')).toContainText(newDisplayName);
    });

    test('should change user preferences', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Settings');
      
      await expect(page).toHaveURL('/settings');
      
      // Change theme
      await page.click('[data-testid="theme-dark"]');
      
      // Should apply dark theme
      await expect(page.locator('body')).toHaveClass(/dark-theme/);
      
      // Change notification preferences
      await page.click('[data-testid="notifications-tab"]');
      await page.uncheck('[data-testid="email-notifications"]');
      
      await page.click('[data-testid="save-settings-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    });

    test('should manage privacy settings', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Settings');
      await page.click('[data-testid="privacy-tab"]');
      
      // Change profile visibility
      await page.selectOption('[data-testid="profile-visibility"]', 'private');
      
      // Disable message requests
      await page.uncheck('[data-testid="allow-message-requests"]');
      
      await page.click('[data-testid="save-privacy-button"]');
      
      await expect(page.locator('[data-testid="privacy-saved"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      
      // Try to load content
      await page.click('[data-testid="refresh-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle invalid routes', async () => {
      await page.goto('/invalid-route-12345');
      
      // Should show 404 page
      await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
      await expect(page.locator('text=Page not found')).toBeVisible();
      
      // Should offer navigation back
      await expect(page.locator('[data-testid="home-link"]')).toBeVisible();
    });

    test('should handle session expiration', async () => {
      // Clear auth token to simulate expiration
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
      });
      
      // Try to access protected content
      await page.click('[data-testid="create-post-button"]');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
      
      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
    });

    test('should handle malformed data gracefully', async () => {
      // Mock malformed API response
      await page.route('**/api/posts', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ invalid: 'data' })
        });
      });
      
      await page.goto('/');
      
      // Should show fallback UI or error state
      await expect(page.locator('[data-testid="data-error"]')).toBeVisible();
    });
  });
});