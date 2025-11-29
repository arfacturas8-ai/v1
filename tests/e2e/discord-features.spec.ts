import { test, expect, Page } from '@playwright/test';

test.describe('Discord-style Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('Server Management', () => {
    test('create new server', async ({ page }) => {
      await page.goto('/servers');
      
      await page.click('[data-testid="create-server-button"]');
      
      // Fill server details
      await page.fill('input[name="serverName"]', 'Test Server');
      await page.fill('textarea[name="description"]', 'A test server for automation');
      
      // Upload server icon
      const fileInput = page.locator('input[type="file"][name="serverIcon"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles('./tests/fixtures/server-icon.png');
      }
      
      // Select server template
      await page.click('[data-testid="template-gaming"]');
      
      await page.click('button[type="submit"]');
      
      // Should navigate to new server
      await expect(page).toHaveURL(/\/servers\/\d+/);
      await expect(page.locator('h1:has-text("Test Server")')).toBeVisible();
    });

    test('join server via invite link', async ({ page }) => {
      // Navigate to an invite link (mock)
      await page.goto('/invite/testinvite123');
      
      await expect(page.locator('[data-testid="server-preview"]')).toBeVisible();
      await expect(page.locator('button:has-text("Join Server")')).toBeVisible();
      
      await page.click('button:has-text("Join Server")');
      
      // Should navigate to server
      await expect(page).toHaveURL(/\/servers\/\d+/);
      await expect(page.locator('[data-testid="server-sidebar"]')).toBeVisible();
    });

    test('leave server', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Open server menu
      await page.click('[data-testid="server-menu"]');
      await page.click('text=Leave Server');
      
      // Confirm leaving
      await page.click('button:has-text("Confirm Leave")');
      
      // Should redirect to servers list
      await expect(page).toHaveURL('/servers');
      await expect(page.locator('text=You have left the server')).toBeVisible();
    });

    test('server settings (admin only)', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Check if user is admin
      const settingsButton = page.locator('[data-testid="server-settings"]');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        await expect(page.locator('h2:has-text("Server Settings")')).toBeVisible();
        
        // Test updating server name
        await page.fill('input[name="serverName"]', 'Updated Server Name');
        await page.click('button:has-text("Save Changes")');
        
        await expect(page.locator('text=Settings saved')).toBeVisible();
      }
    });
  });

  test.describe('Channel Management', () => {
    test('create text channel', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Right-click on channel category or use + button
      await page.click('[data-testid="add-channel-button"]');
      
      await page.click('[data-testid="channel-type-text"]');
      await page.fill('input[name="channelName"]', 'test-channel');
      await page.fill('textarea[name="description"]', 'A test channel');
      
      await page.click('button:has-text("Create Channel")');
      
      // Should see new channel in sidebar
      await expect(page.locator('text=test-channel')).toBeVisible();
    });

    test('create voice channel', async ({ page }) => {
      await page.goto('/servers/1');
      
      await page.click('[data-testid="add-channel-button"]');
      await page.click('[data-testid="channel-type-voice"]');
      await page.fill('input[name="channelName"]', 'Test Voice');
      
      await page.click('button:has-text("Create Channel")');
      
      await expect(page.locator('text=Test Voice')).toBeVisible();
      await expect(page.locator('[data-testid="voice-channel-icon"]')).toBeVisible();
    });

    test('delete channel', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Right-click on channel
      await page.click('[data-testid="channel-item"]:first-child', { button: 'right' });
      await page.click('text=Delete Channel');
      
      // Confirm deletion
      await page.fill('input[name="confirmChannelName"]', 'general');
      await page.click('button:has-text("Delete Channel")');
      
      await expect(page.locator('text=Channel deleted')).toBeVisible();
    });

    test('channel permissions', async ({ page }) => {
      await page.goto('/servers/1');
      
      await page.click('[data-testid="channel-item"]:first-child', { button: 'right' });
      await page.click('text=Edit Channel');
      
      await page.click('tab:has-text("Permissions")');
      
      // Add role permission
      await page.click('button:has-text("Add Role")');
      await page.click('text=@everyone');
      
      // Set specific permissions
      await page.click('[data-testid="permission-send-messages"]');
      await page.click('[data-testid="permission-read-history"]');
      
      await page.click('button:has-text("Save Changes")');
      
      await expect(page.locator('text=Permissions updated')).toBeVisible();
    });
  });

  test.describe('Real-time Messaging', () => {
    test('send message in channel', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Hello, this is a test message!');
      await messageInput.press('Enter');
      
      // Should see message appear
      await expect(page.locator('text=Hello, this is a test message!')).toBeVisible();
      
      // Check message timestamp
      await expect(page.locator('[data-testid="message-timestamp"]')).toBeVisible();
    });

    test('send message with mentions', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Hey @testuser, check this out!');
      
      // Should show mention autocomplete
      await expect(page.locator('[data-testid="mention-autocomplete"]')).toBeVisible();
      
      await page.press('[data-testid="message-input"]', 'Tab');
      await page.press('[data-testid="message-input"]', 'Enter');
      
      await expect(page.locator('text=Hey @testuser, check this out!')).toBeVisible();
    });

    test('send message with emojis', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      // Open emoji picker
      await page.click('[data-testid="emoji-picker-button"]');
      await expect(page.locator('[data-testid="emoji-picker"]')).toBeVisible();
      
      // Select emoji
      await page.click('[data-testid="emoji-😀"]');
      
      // Type additional text
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill(' Great message!');
      await messageInput.press('Enter');
      
      await expect(page.locator('text=😀 Great message!')).toBeVisible();
    });

    test('edit message', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      // Send a message first
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Original message');
      await messageInput.press('Enter');
      
      // Wait for message to appear
      await expect(page.locator('text=Original message')).toBeVisible();
      
      // Right-click to edit
      await page.click('text=Original message', { button: 'right' });
      await page.click('text=Edit Message');
      
      // Edit the message
      await page.fill('[data-testid="edit-message-input"]', 'Edited message');
      await page.press('[data-testid="edit-message-input"]', 'Enter');
      
      await expect(page.locator('text=Edited message')).toBeVisible();
      await expect(page.locator('text=(edited)')).toBeVisible();
    });

    test('delete message', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      // Send a message first
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Message to delete');
      await messageInput.press('Enter');
      
      await expect(page.locator('text=Message to delete')).toBeVisible();
      
      // Right-click to delete
      await page.click('text=Message to delete', { button: 'right' });
      await page.click('text=Delete Message');
      
      // Confirm deletion
      await page.click('button:has-text("Delete")');
      
      await expect(page.locator('text=Message to delete')).not.toBeVisible();
    });

    test('message reactions', async ({ page }) => {
      await page.goto('/servers/1/channels/1');
      
      // Find existing message or send one
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('React to this message!');
      await messageInput.press('Enter');
      
      await expect(page.locator('text=React to this message!')).toBeVisible();
      
      // Add reaction
      await page.hover('text=React to this message!');
      await page.click('[data-testid="add-reaction-button"]');
      await page.click('[data-testid="emoji-👍"]');
      
      // Check reaction appears
      await expect(page.locator('[data-testid="reaction-👍"]')).toBeVisible();
      await expect(page.locator('[data-testid="reaction-count"]')).toContainText('1');
    });

    test('typing indicators', async ({ page, context }) => {
      await page.goto('/servers/1/channels/1');
      
      // Open second page to simulate another user
      const page2 = await context.newPage();
      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'test2@cryb.app');
      await page2.fill('input[name="password"]', 'TestPassword123!');
      await page2.click('button[type="submit"]');
      await page2.goto('/servers/1/channels/1');
      
      // Start typing on page2
      const messageInput2 = page2.locator('[data-testid="message-input"]');
      await messageInput2.fill('User is typing...');
      
      // Should see typing indicator on page1
      await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
      await expect(page.locator('text=is typing...')).toBeVisible();
      
      // Clear input, typing indicator should disappear
      await messageInput2.clear();
      await page.waitForTimeout(3000);
      await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
    });
  });

  test.describe('Voice and Video Calls', () => {
    test('join voice channel', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Click on voice channel
      await page.click('[data-testid="voice-channel"]:first-child');
      
      // Should show voice connection UI
      await expect(page.locator('[data-testid="voice-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="mute-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="deafen-button"]')).toBeVisible();
    });

    test('voice controls (mute/unmute)', async ({ page }) => {
      await page.goto('/servers/1');
      await page.click('[data-testid="voice-channel"]:first-child');
      
      // Test mute button
      const muteButton = page.locator('[data-testid="mute-button"]');
      await muteButton.click();
      
      await expect(muteButton).toHaveClass(/muted/);
      
      // Unmute
      await muteButton.click();
      await expect(muteButton).not.toHaveClass(/muted/);
    });

    test('screen sharing', async ({ page }) => {
      await page.goto('/servers/1');
      await page.click('[data-testid="voice-channel"]:first-child');
      
      const screenShareButton = page.locator('[data-testid="screen-share-button"]');
      
      // Note: Actual screen sharing requires browser permissions
      // In real tests, you would mock this
      if (await screenShareButton.isVisible()) {
        await screenShareButton.click();
        
        // Should show screen sharing UI
        await expect(page.locator('[data-testid="screen-share-preview"]')).toBeVisible();
      }
    });

    test('leave voice channel', async ({ page }) => {
      await page.goto('/servers/1');
      await page.click('[data-testid="voice-channel"]:first-child');
      
      // Leave voice channel
      await page.click('[data-testid="leave-voice-button"]');
      
      await expect(page.locator('[data-testid="voice-controls"]')).not.toBeVisible();
    });
  });

  test.describe('Direct Messages', () => {
    test('send direct message', async ({ page }) => {
      await page.goto('/messages');
      
      // Start new DM
      await page.click('[data-testid="new-dm-button"]');
      await page.fill('[data-testid="user-search"]', 'testuser2');
      await page.click('[data-testid="user-result"]:first-child');
      
      // Send message
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Hello! This is a direct message.');
      await messageInput.press('Enter');
      
      await expect(page.locator('text=Hello! This is a direct message.')).toBeVisible();
    });

    test('create group DM', async ({ page }) => {
      await page.goto('/messages');
      
      await page.click('[data-testid="new-group-dm-button"]');
      
      // Add multiple users
      await page.fill('[data-testid="user-search"]', 'user1');
      await page.click('[data-testid="add-user-button"]');
      
      await page.fill('[data-testid="user-search"]', 'user2');
      await page.click('[data-testid="add-user-button"]');
      
      await page.fill('input[name="groupName"]', 'Test Group');
      await page.click('button:has-text("Create Group")');
      
      await expect(page.locator('h2:has-text("Test Group")')).toBeVisible();
    });
  });

  test.describe('Server Features', () => {
    test('server boost status', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Check boost status
      await expect(page.locator('[data-testid="boost-level"]')).toBeVisible();
      
      // Test boost button if available
      const boostButton = page.locator('[data-testid="boost-server-button"]');
      if (await boostButton.isVisible()) {
        await boostButton.click();
        await expect(page.locator('[data-testid="boost-modal"]')).toBeVisible();
      }
    });

    test('server roles and permissions', async ({ page }) => {
      await page.goto('/servers/1');
      
      const settingsButton = page.locator('[data-testid="server-settings"]');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.click('text=Roles');
        
        // Create new role
        await page.click('button:has-text("Create Role")');
        await page.fill('input[name="roleName"]', 'Test Role');
        await page.fill('input[name="roleColor"]', '#ff0000');
        
        // Set permissions
        await page.check('input[name="manageMessages"]');
        await page.check('input[name="kickMembers"]');
        
        await page.click('button:has-text("Save Role")');
        
        await expect(page.locator('text=Test Role')).toBeVisible();
      }
    });

    test('server member list', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Toggle member list
      await page.click('[data-testid="toggle-member-list"]');
      
      await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="online-members"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-members"]')).toBeVisible();
    });

    test('server search', async ({ page }) => {
      await page.goto('/servers/1');
      
      // Open search
      await page.press('body', 'Control+k');
      await expect(page.locator('[data-testid="server-search"]')).toBeVisible();
      
      // Search for messages
      await page.fill('[data-testid="search-input"]', 'test message');
      await page.press('[data-testid="search-input"]', 'Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });
});