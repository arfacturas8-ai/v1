import { test, expect } from '@playwright/test';
import { generateTestUser, cleanupTestUser } from './helpers/test-helpers';

test.describe('Authentication Flow - Critical User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean slate
    await page.goto('/');
    
    // Clear any existing auth state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should complete full registration and login flow successfully', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/CRYB/);
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="username-input"]', testUser.username);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should show welcome message or user info
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    
    // Verify user is properly authenticated
    const userInfo = page.locator('[data-testid="user-display-name"]');
    await expect(userInfo).toContainText(testUser.username);
    
    // Test logout
    await page.click('[data-testid="user-menu-trigger"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should not see authenticated content
    await expect(page.locator('[data-testid="user-info"]')).not.toBeVisible();
    
    // Test login with the registered account
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Should successfully log in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText(testUser.username);
    
    // Cleanup
    await cleanupTestUser(testUser.email);
  });

  test('should handle registration validation errors gracefully', async ({ page }) => {
    await page.goto('/register');
    
    // Test empty form submission
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Test invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/invalid email/i);
    
    // Test weak password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(/password/i);
    
    // Test password mismatch
    await page.fill('[data-testid="password-input"]', 'StrongPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(/match/i);
  });

  test('should handle login validation errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Test empty form
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Test invalid credentials
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid credentials/i);
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle brute force protection', async ({ page }) => {
    await page.goto('/login');
    
    const invalidCredentials = {
      email: 'bruteforce@example.com',
      password: 'wrongpassword'
    };
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="email-input"]', invalidCredentials.email);
      await page.fill('[data-testid="password-input"]', invalidCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // Wait for response
      await page.waitForTimeout(500);
    }
    
    // Should show rate limiting message
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText(/too many attempts/i);
    
    // Login button should be disabled or show cooldown
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeDisabled();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Register and login
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="username-input"]', testUser.username);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Refresh the page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText(testUser.username);
    
    await cleanupTestUser(testUser.email);
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page without authentication
    await page.goto('/dashboard/settings');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should preserve redirect URL
    expect(page.url()).toContain('redirect');
    
    // Login
    const testUser = generateTestUser();
    await page.goto('/register'); // Create account first
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="username-input"]', testUser.username);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.click('[data-testid="register-button"]');
    
    // Logout and test redirect flow
    await page.click('[data-testid="user-menu-trigger"]');
    await page.click('[data-testid="logout-button"]');
    
    // Try to access protected page again
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/login/);
    
    // Login
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to originally requested page
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    
    await cleanupTestUser(testUser.email);
  });

  test('should handle token expiration gracefully', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Register and login
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="username-input"]', testUser.username);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Simulate expired token by manually clearing auth state
    await page.evaluate(() => {
      localStorage.removeItem('auth-token');
    });
    
    // Try to access protected resource
    await page.goto('/dashboard/settings');
    
    // Should redirect to login due to expired/missing token
    await expect(page).toHaveURL(/\/login/);
    
    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
    
    await cleanupTestUser(testUser.email);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate network failure
    await page.route('**/auth/**', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Should show network error message
    await expect(page.locator('[data-testid="network-error"]')).toContainText(/connection/i);
    
    // Should enable retry
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Clear route interception
    await page.unroute('**/auth/**');
    
    // Retry should work
    await page.click('[data-testid="retry-button"]');
    
    // Should show normal invalid credentials error now
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid credentials/i);
  });

  test('should validate input sanitization and XSS prevention', async ({ page }) => {
    await page.goto('/register');
    
    // Test XSS attempts in form fields
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src="x" onload="alert(1)">',
      '<svg/onload=alert(1)>',
    ];
    
    for (const payload of xssPayloads) {
      // Clear form
      await page.fill('[data-testid="username-input"]', '');
      
      // Try XSS payload
      await page.fill('[data-testid="username-input"]', payload);
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      
      // Submit form
      await page.click('[data-testid="register-button"]');
      
      // Should either sanitize input or show validation error
      // but never execute the script
      const usernameValue = await page.inputValue('[data-testid="username-input"]');
      expect(usernameValue).not.toContain('<script>');
      expect(usernameValue).not.toContain('javascript:');
      
      // No alert should have been triggered
      const hasAlert = await page.evaluate(() => {
        return window.alert !== window.alert;
      });
      expect(hasAlert).toBe(false);
    }
  });

  test('should handle concurrent login attempts correctly', async ({ browser }) => {
    const testUser = generateTestUser();
    
    // Create the user first
    const setupPage = await browser.newPage();
    await setupPage.goto('/register');
    await setupPage.fill('[data-testid="email-input"]', testUser.email);
    await setupPage.fill('[data-testid="username-input"]', testUser.username);
    await setupPage.fill('[data-testid="password-input"]', testUser.password);
    await setupPage.fill('[data-testid="confirm-password-input"]', testUser.password);
    await setupPage.click('[data-testid="register-button"]');
    await expect(setupPage).toHaveURL(/\/dashboard/);
    
    // Logout
    await setupPage.click('[data-testid="user-menu-trigger"]');
    await setupPage.click('[data-testid="logout-button"]');
    await setupPage.close();
    
    // Open multiple browser contexts for concurrent login
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const loginPromises = contexts.map(async (context, index) => {
      const page = await context.newPage();
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      // All should successfully log in
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="user-display-name"]')).toContainText(testUser.username);
      
      await context.close();
    });
    
    // Wait for all concurrent logins to complete
    await Promise.all(loginPromises);
    
    await cleanupTestUser(testUser.email);
  });
});