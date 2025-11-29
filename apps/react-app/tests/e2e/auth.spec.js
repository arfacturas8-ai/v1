import { test, expect } from '@playwright/test';

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Login Flow', () => {
    test('should open login modal from header', async ({ page }) => {
      await page.goto('/');
      
      // Look for login button in header
      const loginButton = page.locator('button:has-text("Login")').first();
      await expect(loginButton).toBeVisible();
      
      await loginButton.click();
      
      // Check if auth modal opens
      const authModal = page.locator('.modal-backdrop');
      await expect(authModal).toBeVisible();
      
      // Check if login form is displayed
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Fill in login credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Click login button
      await page.click('button:has-text("Sign In")');
      
      // Wait for login to complete
      await page.waitForTimeout(1500);
      
      // Check if modal closes and user is logged in
      const authModal = page.locator('.modal-backdrop');
      await expect(authModal).not.toBeVisible();
      
      // Check for user indicator in header
      const userIndicator = page.locator('[data-testid="user-menu"]');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123'); // Too short
      
      // Click login button
      await page.click('button:has-text("Sign In")');
      
      // Wait for error message
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/Invalid credentials|Password/i);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Try to submit empty form
      await page.click('button:has-text("Sign In")');
      
      // Check for validation errors
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/provide both email and password/i);
    });

    test('should remember me functionality work', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Fill credentials and check remember me
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      const rememberCheckbox = page.locator('input[type="checkbox"]');
      if (await rememberCheckbox.isVisible()) {
        await rememberCheckbox.check();
      }
      
      // Login
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(1500);
      
      // Refresh page and check if still logged in
      await page.reload();
      await page.waitForTimeout(2000);
      
      const userIndicator = page.locator('[data-testid="user-menu"]');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Signup Flow', () => {
    test('should switch to signup form', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Switch to signup
      const signupLink = page.locator('text=Sign up').first();
      await signupLink.click();
      
      // Check if signup form is displayed
      const usernameInput = page.locator('input[placeholder*="username" i]');
      const confirmPasswordInput = page.locator('input[placeholder*="confirm" i]');
      await expect(usernameInput).toBeVisible({ timeout: 2000 });
      await expect(confirmPasswordInput).toBeVisible({ timeout: 2000 });
    });

    test('should successfully signup with valid data', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to signup
      await page.click('button:has-text("Login")');
      await page.click('text=Sign up');
      
      // Fill signup form
      await page.fill('input[placeholder*="username" i]', 'testuser123');
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input[type="password"]:not([placeholder*="confirm"])', 'password123456');
      await page.fill('input[placeholder*="confirm" i]', 'password123456');
      
      // Submit signup
      await page.click('button:has-text("Create Account")');
      
      // Wait for signup to complete
      await page.waitForTimeout(2000);
      
      // Check if user is logged in
      const userIndicator = page.locator('[data-testid="user-menu"]');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to signup
      await page.click('button:has-text("Login")');
      await page.click('text=Sign up');
      
      // Fill form with mismatched passwords
      await page.fill('input[placeholder*="username" i]', 'testuser123');
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input[type="password"]:not([placeholder*="confirm"])', 'password123456');
      await page.fill('input[placeholder*="confirm" i]', 'differentpassword');
      
      // Submit signup
      await page.click('button:has-text("Create Account")');
      
      // Check for error message
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/do not match/i);
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to signup
      await page.click('button:has-text("Login")');
      await page.click('text=Sign up');
      
      // Fill form with short password
      await page.fill('input[placeholder*="username" i]', 'testuser123');
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input[type="password"]:not([placeholder*="confirm"])', '123');
      await page.fill('input[placeholder*="confirm" i]', '123');
      
      // Submit signup
      await page.click('button:has-text("Create Account")');
      
      // Check for error message
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/8 characters/i);
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should switch to password reset form', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Click forgot password link
      const forgotLink = page.locator('text=Forgot password').first();
      await forgotLink.click();
      
      // Check if password reset form is displayed
      const resetEmailInput = page.locator('input[type="email"]');
      const resetButton = page.locator('button:has-text("Reset Password")');
      await expect(resetEmailInput).toBeVisible();
      await expect(resetButton).toBeVisible();
    });

    test('should send password reset email', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to password reset
      await page.click('button:has-text("Login")');
      await page.click('text=Forgot password');
      
      // Fill email and submit
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button:has-text("Reset Password")');
      
      // Check for success message
      await page.waitForTimeout(1500);
      const successMessage = page.locator('text=Password reset email sent');
      await expect(successMessage).toBeVisible({ timeout: 3000 });
    });

    test('should validate email field', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to password reset
      await page.click('button:has-text("Login")');
      await page.click('text=Forgot password');
      
      // Submit without email
      await page.click('button:has-text("Reset Password")');
      
      // Check for error message
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/provide your email/i);
    });

    test('should navigate back to login', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to password reset
      await page.click('button:has-text("Login")');
      await page.click('text=Forgot password');
      
      // Click back button
      const backButton = page.locator('button[aria-label*="back" i], .back-btn, text=Back').first();
      await backButton.click();
      
      // Check if back to login form
      const loginButton = page.locator('button:has-text("Sign In")');
      await expect(loginButton).toBeVisible();
    });
  });

  test.describe('Web3 Authentication', () => {
    test('should show Web3 login option', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Check for Web3 login button
      const web3Button = page.locator('button:has-text("Connect Wallet"), button:has-text("Web3")');
      await expect(web3Button).toBeVisible();
    });

    test('should handle Web3 connection error gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Click Web3 login
      const web3Button = page.locator('button:has-text("Connect Wallet"), button:has-text("Web3")').first();
      await web3Button.click();
      
      // Wait for error message (Web3 is disabled)
      await page.waitForTimeout(1500);
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
      await expect(errorMessage).toContainText(/temporarily disabled/i);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after page reload', async ({ page }) => {
      await page.goto('/');
      
      // Login
      await page.click('button:has-text("Login")');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(1500);
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if still logged in
      const userIndicator = page.locator('[data-testid="user-menu"]');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should successfully logout', async ({ page }) => {
      await page.goto('/');
      
      // Login first
      await page.click('button:has-text("Login")');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(1500);
      
      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu"]');
      await userMenu.click();
      
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
      
      // Check if logged out
      const loginButton = page.locator('button:has-text("Login")');
      await expect(loginButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Modal Behavior', () => {
    test('should close modal with close button', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Click close button
      const closeButton = page.locator('button[aria-label*="close" i], .modal-backdrop button:has(svg)').first();
      await closeButton.click();
      
      // Check if modal is closed
      const authModal = page.locator('.modal-backdrop');
      await expect(authModal).not.toBeVisible();
    });

    test('should close modal with escape key', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Press escape key
      await page.keyboard.press('Escape');
      
      // Check if modal is closed
      const authModal = page.locator('.modal-backdrop');
      await expect(authModal).not.toBeVisible();
    });

    test('should close modal when clicking backdrop', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Click backdrop
      await page.click('.modal-backdrop');
      
      // Check if modal is closed
      const authModal = page.locator('.modal-backdrop');
      await expect(authModal).not.toBeVisible();
    });

    test('should prevent body scroll when modal is open', async ({ page }) => {
      await page.goto('/');
      
      // Check initial body overflow
      const initialOverflow = await page.evaluate(() => document.body.style.overflow);
      
      // Open modal
      await page.click('button:has-text("Login")');
      
      // Check if body scroll is prevented
      const modalOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(modalOverflow).toBe('hidden');
      
      // Close modal
      await page.keyboard.press('Escape');
      
      // Check if body scroll is restored
      await page.waitForTimeout(100);
      const finalOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(finalOverflow).toBe('unset');
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during login', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal
      await page.click('button:has-text("Login")');
      
      // Fill credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Click login and immediately check for loading state
      await page.click('button:has-text("Sign In")');
      
      // Check for loading indicator
      const loadingIndicator = page.locator('.loading, .spinner, button[disabled]:has-text("Sign In")');
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    });

    test('should show loading state during signup', async ({ page }) => {
      await page.goto('/');
      
      // Open login modal and switch to signup
      await page.click('button:has-text("Login")');
      await page.click('text=Sign up');
      
      // Fill signup form
      await page.fill('input[placeholder*="username" i]', 'testuser123');
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input[type="password"]:not([placeholder*="confirm"])', 'password123456');
      await page.fill('input[placeholder*="confirm" i]', 'password123456');
      
      // Click signup and check for loading state
      await page.click('button:has-text("Create Account")');
      
      const loadingIndicator = page.locator('.loading, .spinner, button[disabled]:has-text("Create Account")');
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    });
  });
});