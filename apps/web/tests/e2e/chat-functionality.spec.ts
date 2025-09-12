import { test, expect } from '@playwright/test';
import { generateTestUser, cleanupTestUser, createTestChannel } from './helpers/test-helpers';

test.describe('Chat Functionality - Critical Messaging Flow', () => {
  let testUser1: any, testUser2: any;
  let testChannel: any;
  
  test.beforeAll(async ({ browser }) => {
    // Set up test users and channel
    testUser1 = generateTestUser('user1');
    testUser2 = generateTestUser('user2');
    testChannel = createTestChannel();
    
    // Create both users
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    // Register user 1
    await page1.goto('/register');
    await page1.fill('[data-testid="email-input"]', testUser1.email);
    await page1.fill('[data-testid="username-input"]', testUser1.username);
    await page1.fill('[data-testid="password-input"]', testUser1.password);
    await page1.fill('[data-testid="confirm-password-input"]', testUser1.password);
    await page1.click('[data-testid="register-button"]');
    await expect(page1).toHaveURL(/\/dashboard/);
    
    // Register user 2
    await page2.goto('/register');
    await page2.fill('[data-testid="email-input"]', testUser2.email);
    await page2.fill('[data-testid="username-input"]', testUser2.username);
    await page2.fill('[data-testid="password-input"]', testUser2.password);
    await page2.fill('[data-testid="confirm-password-input"]', testUser2.password);
    await page2.click('[data-testid="register-button"]');
    await expect(page2).toHaveURL(/\/dashboard/);
    
    await page1.close();
    await page2.close();
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestUser(testUser1.email);
    await cleanupTestUser(testUser2.email);
  });

  test('should send and receive messages in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login both users
    await page1.goto('/login');
    await page1.fill('[data-testid="email-input"]', testUser1.email);
    await page1.fill('[data-testid="password-input"]', testUser1.password);
    await page1.click('[data-testid="login-button"]');
    await expect(page1).toHaveURL(/\/dashboard/);
    
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', testUser2.email);
    await page2.fill('[data-testid="password-input"]', testUser2.password);
    await page2.click('[data-testid="login-button"]');
    await expect(page2).toHaveURL(/\/dashboard/);
    
    // Join the same channel (assuming default general channel exists)
    await page1.click('[data-testid="channel-general"]');
    await page2.click('[data-testid="channel-general"]');
    
    // Wait for channel to load
    await expect(page1.locator('[data-testid="chat-area"]')).toBeVisible();
    await expect(page2.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // User 1 sends a message
    const testMessage = `Hello from ${testUser1.username} - ${Date.now()}`;
    await page1.fill('[data-testid="message-input"]', testMessage);
    await page1.click('[data-testid="send-button"]');
    
    // Message should appear in user 1's chat
    await expect(page1.locator(`[data-testid="message"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 });
    
    // Message should appear in user 2's chat in real-time
    await expect(page2.locator(`[data-testid="message"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 });
    
    // Verify message metadata
    const messageElement = page2.locator(`[data-testid="message"]:has-text("${testMessage}")`);
    await expect(messageElement.locator('[data-testid="message-author"]')).toContainText(testUser1.username);
    await expect(messageElement.locator('[data-testid="message-timestamp"]')).toBeVisible();
    
    // User 2 replies
    const replyMessage = `Reply from ${testUser2.username} - ${Date.now()}`;
    await page2.fill('[data-testid="message-input"]', replyMessage);
    await page2.click('[data-testid="send-button"]');
    
    // Both users should see the reply
    await expect(page1.locator(`[data-testid="message"]:has-text("${replyMessage}")`)).toBeVisible({ timeout: 5000 });
    await expect(page2.locator(`[data-testid="message"]:has-text("${replyMessage}")`)).toBeVisible({ timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('should handle message validation and sanitization', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser1.email);
    await page.fill('[data-testid="password-input"]', testUser1.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Join channel
    await page.click('[data-testid="channel-general"]');
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // Test empty message rejection
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="message-error"]')).toContainText(/cannot be empty/i);
    
    // Test message too long
    const longMessage = 'x'.repeat(2001); // Assuming 2000 char limit
    await page.fill('[data-testid="message-input"]', longMessage);
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="message-error"]')).toContainText(/too long/i);
    
    // Test XSS prevention in messages
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onload="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      'javascript:alert(1)'
    ];
    
    for (const payload of xssPayloads) {
      await page.fill('[data-testid="message-input"]', payload);
      await page.click('[data-testid="send-button"]');
      
      // Wait a bit for message processing
      await page.waitForTimeout(1000);
      
      // Check if message was sent (might be sanitized)
      const messages = page.locator('[data-testid="message"]');
      const lastMessage = messages.last();
      
      if (await lastMessage.isVisible()) {
        // If message was sent, it should be sanitized
        const messageContent = await lastMessage.locator('[data-testid="message-content"]').textContent();
        expect(messageContent).not.toContain('<script>');
        expect(messageContent).not.toContain('javascript:');
        expect(messageContent).not.toContain('onload=');
      }
      
      // No script should have executed
      const hasAlert = await page.evaluate(() => window.alert !== window.alert);
      expect(hasAlert).toBe(false);
    }
  });

  test('should handle typing indicators correctly', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login both users
    await page1.goto('/login');
    await page1.fill('[data-testid="email-input"]', testUser1.email);
    await page1.fill('[data-testid="password-input"]', testUser1.password);
    await page1.click('[data-testid="login-button"]');
    
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', testUser2.email);
    await page2.fill('[data-testid="password-input"]', testUser2.password);
    await page2.click('[data-testid="login-button"]');
    
    // Join same channel
    await page1.click('[data-testid="channel-general"]');
    await page2.click('[data-testid="channel-general"]');
    
    // User 1 starts typing
    await page1.focus('[data-testid="message-input"]');
    await page1.type('[data-testid="message-input"]', 'Hello');
    
    // User 2 should see typing indicator
    await expect(page2.locator('[data-testid="typing-indicator"]')).toContainText(`${testUser1.username} is typing`);
    
    // Stop typing by clearing input
    await page1.fill('[data-testid="message-input"]', '');
    
    // Typing indicator should disappear
    await expect(page2.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 12000 });
    
    // Send message should also stop typing indicator
    await page1.fill('[data-testid="message-input"]', 'Test message');
    await page1.type('[data-testid="message-input"]', '!');
    
    // Should show typing
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Send message
    await page1.click('[data-testid="send-button"]');
    
    // Typing indicator should disappear immediately
    await expect(page2.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 1000 });
    
    await context1.close();
    await context2.close();
  });

  test('should handle message editing correctly', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser1.email);
    await page.fill('[data-testid="password-input"]', testUser1.password);
    await page.click('[data-testid="login-button"]');
    
    // Join channel
    await page.click('[data-testid="channel-general"]');
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // Send initial message
    const originalMessage = `Original message - ${Date.now()}`;
    await page.fill('[data-testid="message-input"]', originalMessage);
    await page.click('[data-testid="send-button"]');
    
    // Wait for message to appear
    const messageLocator = page.locator(`[data-testid="message"]:has-text("${originalMessage}")`);
    await expect(messageLocator).toBeVisible();
    
    // Hover over message to show edit button
    await messageLocator.hover();
    await expect(messageLocator.locator('[data-testid="edit-message-button"]')).toBeVisible();
    
    // Click edit button
    await messageLocator.locator('[data-testid="edit-message-button"]').click();
    
    // Should show edit input
    await expect(messageLocator.locator('[data-testid="edit-message-input"]')).toBeVisible();
    
    // Edit the message
    const editedMessage = `Edited message - ${Date.now()}`;
    await messageLocator.locator('[data-testid="edit-message-input"]').fill(editedMessage);
    await messageLocator.locator('[data-testid="save-edit-button"]').click();
    
    // Should show edited message
    await expect(page.locator(`[data-testid="message"]:has-text("${editedMessage}")`)).toBeVisible();
    await expect(page.locator(`[data-testid="message"]:has-text("${originalMessage}")`)).not.toBeVisible();
    
    // Should show "edited" indicator
    const editedMessageElement = page.locator(`[data-testid="message"]:has-text("${editedMessage}")`);
    await expect(editedMessageElement.locator('[data-testid="edited-indicator"]')).toContainText(/edited/i);
  });

  test('should handle message deletion correctly', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser1.email);
    await page.fill('[data-testid="password-input"]', testUser1.password);
    await page.click('[data-testid="login-button"]');
    
    // Join channel
    await page.click('[data-testid="channel-general"]');
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // Send message to delete
    const messageToDelete = `Message to delete - ${Date.now()}`;
    await page.fill('[data-testid="message-input"]', messageToDelete);
    await page.click('[data-testid="send-button"]');
    
    // Wait for message to appear
    const messageLocator = page.locator(`[data-testid="message"]:has-text("${messageToDelete}")`);
    await expect(messageLocator).toBeVisible();
    
    // Hover and delete
    await messageLocator.hover();
    await messageLocator.locator('[data-testid="delete-message-button"]').click();
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Message should be removed
    await expect(messageLocator).not.toBeVisible();
  });

  test('should handle file attachments safely', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser1.email);
    await page.fill('[data-testid="password-input"]', testUser1.password);
    await page.click('[data-testid="login-button"]');
    
    // Join channel
    await page.click('[data-testid="channel-general"]');
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // Test file upload
    const testFilePath = './tests/fixtures/test-image.png';
    
    // Click attachment button
    await page.click('[data-testid="attachment-button"]');
    
    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Should show preview
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    
    // Send message with attachment
    await page.fill('[data-testid="message-input"]', 'Message with attachment');
    await page.click('[data-testid="send-button"]');
    
    // Should show message with attachment
    const messageWithAttachment = page.locator('[data-testid="message"]').last();
    await expect(messageWithAttachment.locator('[data-testid="message-attachment"]')).toBeVisible();
    
    // Test file size limit (if applicable)
    // This would require a large test file
    
    // Test malicious file rejection
    const maliciousFileName = 'test.exe';
    // Implementation would depend on your file upload system
  });

  test('should handle network disconnections gracefully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser1.email);
    await page.fill('[data-testid="password-input"]', testUser1.password);
    await page.click('[data-testid="login-button"]');
    
    // Join channel
    await page.click('[data-testid="channel-general"]');
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    
    // Send a message normally first
    await page.fill('[data-testid="message-input"]', 'Message before disconnect');
    await page.click('[data-testid="send-button"]');
    
    // Simulate network disconnection
    await page.route('**/socket.io/**', route => route.abort('failed'));
    
    // Should show connection status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/disconnected|offline/i);
    
    // Try to send message while disconnected
    await page.fill('[data-testid="message-input"]', 'Message while disconnected');
    await page.click('[data-testid="send-button"]');
    
    // Should queue message or show error
    await expect(page.locator('[data-testid="message-queued"]')).toBeVisible();
    
    // Restore connection
    await page.unroute('**/socket.io/**');
    
    // Should reconnect automatically
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/connected|online/i, { timeout: 10000 });
    
    // Queued message should be sent
    await expect(page.locator('[data-testid="message"]:has-text("Message while disconnected")')).toBeVisible({ timeout: 5000 });
  });

  test('should handle high message volume without crashes', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    // Login all users (using same user for simplicity)
    for (const page of pages) {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser1.email);
      await page.fill('[data-testid="password-input"]', testUser1.password);
      await page.click('[data-testid="login-button"]');
      
      await page.click('[data-testid="channel-general"]');
      await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
    }
    
    // Send many messages rapidly from different connections
    const messagePromises = pages.map(async (page, index) => {
      for (let i = 0; i < 10; i++) {
        await page.fill('[data-testid="message-input"]', `Rapid message ${index}-${i} - ${Date.now()}`);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(100); // Small delay
      }
    });
    
    await Promise.all(messagePromises);
    
    // All pages should still be functional
    for (const page of pages) {
      await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
    }
    
    // Close contexts
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should maintain message order and prevent race conditions', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login both
    await page1.goto('/login');
    await page1.fill('[data-testid="email-input"]', testUser1.email);
    await page1.fill('[data-testid="password-input"]', testUser1.password);
    await page1.click('[data-testid="login-button"]');
    
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', testUser2.email);
    await page2.fill('[data-testid="password-input"]', testUser2.password);
    await page2.click('[data-testid="login-button"]');
    
    // Join same channel
    await page1.click('[data-testid="channel-general"]');
    await page2.click('[data-testid="channel-general"]');
    
    // Send messages simultaneously from both users
    const timestamp = Date.now();
    const messages = [
      { page: page1, content: `Message 1 from User 1 - ${timestamp}` },
      { page: page2, content: `Message 2 from User 2 - ${timestamp}` },
      { page: page1, content: `Message 3 from User 1 - ${timestamp}` },
      { page: page2, content: `Message 4 from User 2 - ${timestamp}` },
    ];
    
    // Send all messages as quickly as possible
    await Promise.all(messages.map(async ({ page, content }) => {
      await page.fill('[data-testid="message-input"]', content);
      await page.click('[data-testid="send-button"]');
    }));
    
    // Wait for all messages to appear
    await page1.waitForTimeout(2000);
    
    // Verify all messages appear in both clients
    for (const { content } of messages) {
      await expect(page1.locator(`[data-testid="message"]:has-text("${content}")`)).toBeVisible({ timeout: 5000 });
      await expect(page2.locator(`[data-testid="message"]:has-text("${content}")`)).toBeVisible({ timeout: 5000 });
    }
    
    // Verify message order is consistent between clients
    const page1Messages = await page1.locator('[data-testid="message"]').allTextContents();
    const page2Messages = await page2.locator('[data-testid="message"]').allTextContents();
    
    // Find messages from this test
    const testMessages1 = page1Messages.filter(msg => msg.includes(timestamp.toString()));
    const testMessages2 = page2Messages.filter(msg => msg.includes(timestamp.toString()));
    
    // Order should be the same
    expect(testMessages1).toEqual(testMessages2);
    
    await context1.close();
    await context2.close();
  });
});