import { test, expect, Page } from '@playwright/test';

// Test data
const testUser = {
  email: 'e2e.test@cryb.app',
  password: 'TestPassword123!',
  username: 'e2eTestUser',
  displayName: 'E2E Test User'
};

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('user registration flow', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="displayName"]', testUser.displayName);
    
    // Accept terms and conditions
    await page.check('input[name="acceptTerms"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to email verification page
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('user login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Reset link sent')).toBeVisible();
  });

  test('logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('protected route access without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('OAuth login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Click OAuth provider button
    await page.click('button:has-text("Continue with Google")');
    
    // Should navigate to OAuth provider (we'll mock this in CI)
    await expect(page).toHaveURL(/accounts\.google\.com|localhost/);
  });

  test('two-factor authentication setup', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Navigate to settings
    await page.goto('/settings');
    await page.click('text=Security');
    
    // Enable 2FA
    await page.click('button:has-text("Enable Two-Factor Authentication")');
    
    // Should show QR code
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('input[name="totpCode"]')).toBeVisible();
  });

  test('session persistence', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Create new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should still be logged in
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});

test.describe('Authentication Security', () => {
  test('rate limiting on login attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@cryb.app');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Should show rate limit message
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });

  test('CSRF protection', async ({ page }) => {
    await page.goto('/login');
    
    // Check for CSRF token in form
    const csrfInput = page.locator('input[name="_token"]');
    await expect(csrfInput).toBeAttached();
  });

  test('secure headers present', async ({ page }) => {
    const response = await page.goto('/login');
    const headers = response?.headers();
    
    expect(headers).toBeDefined();
    expect(headers?.['x-frame-options']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-xss-protection']).toBeTruthy();
  });
});