import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flows', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const timestamp = Date.now();
      const newUser = {
        username: `newuser${timestamp}`,
        email: `newuser${timestamp}@example.com`,
        password: 'TestPassword123!',
        displayName: 'New Test User'
      };

      // Navigate to register page
      await page.click('text=Register');
      await expect(page).toHaveURL('/register');

      // Fill registration form
      await page.fill('[data-testid="username-input"]', newUser.username);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.fill('[data-testid="display-name-input"]', newUser.displayName);

      // Submit form
      await page.click('[data-testid="register-button"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL('/dashboard');
      
      // Should show welcome message or user info
      await expect(page.locator('text=' + newUser.displayName)).toBeVisible();
    });

    test('should show validation errors for invalid input', async () => {
      await page.click('text=Register');
      await expect(page).toHaveURL('/register');

      // Submit empty form
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should reject weak passwords', async () => {
      await page.click('text=Register');
      
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123'); // Weak password
      await page.fill('[data-testid="confirm-password-input"]', '123');

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="password-error"]')).toContainText('password must be at least');
    });

    test('should reject mismatched passwords', async () => {
      await page.click('text=Register');
      
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('passwords do not match');
    });

    test('should prevent duplicate email registration', async () => {
      await page.click('text=Register');
      
      // Try to register with existing email
      await page.fill('[data-testid="username-input"]', 'uniqueuser');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com'); // Existing email
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('email already exists');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async () => {
      await page.click('text=Login');
      await expect(page).toHaveURL('/login');

      // Use existing test user
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');

      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show user info in navigation
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should reject invalid credentials', async () => {
      await page.click('text=Login');
      
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');

      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="login-error"]')).toContainText('invalid credentials');
    });

    test('should show validation errors for empty fields', async () => {
      await page.click('text=Login');
      
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should support "Remember Me" functionality', async () => {
      await page.click('text=Login');
      
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.check('[data-testid="remember-me-checkbox"]');

      await page.click('[data-testid="login-button"]');

      // Should remember session after page reload
      await page.reload();
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset flow', async () => {
      await page.click('text=Login');
      await page.click('text=Forgot Password?');
      
      await expect(page).toHaveURL('/forgot-password');

      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.click('[data-testid="send-reset-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('reset email sent');
    });

    test('should not reveal if email exists', async () => {
      await page.click('text=Login');
      await page.click('text=Forgot Password?');
      
      // Try with non-existent email
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.click('[data-testid="send-reset-button"]');

      // Should show same success message to prevent email enumeration
      await expect(page.locator('[data-testid="success-message"]')).toContainText('reset email sent');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async () => {
      // Login first
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should not show authenticated content
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });

    test('should clear session data on logout', async () => {
      // Login
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');

      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Session Management', () => {
    test('should handle expired sessions gracefully', async () => {
      // Login
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Mock expired token by clearing storage
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      });

      // Try to access protected content
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should maintain session across page reloads', async () => {
      // Login
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Reload page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle concurrent sessions', async () => {
      // Login in first context
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Create second context with same user
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (page2) {
        await page2.goto('/');
        await page2.click('text=Login');
        await page2.fill('[data-testid="email-input"]', 'testuser1@example.com');
        await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page2.click('[data-testid="login-button"]');

        // Both sessions should work
        await expect(page).toHaveURL('/dashboard');
        await expect(page2).toHaveURL('/dashboard');

        await context2?.close();
      }
    });
  });

  test.describe('Two-Factor Authentication', () => {
    test('should enable 2FA for user account', async () => {
      // Login first
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Go to security settings
      await page.goto('/settings/security');
      
      // Enable 2FA
      await page.click('[data-testid="enable-2fa-button"]');
      
      // Should show QR code
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
    });

    test('should require 2FA code after enabling', async () => {
      // Note: This test assumes 2FA is already enabled for testuser2
      // In a real test, you'd set this up in the database
      
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser2@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Should show 2FA verification page
      await expect(page).toHaveURL('/login/2fa');
      await expect(page.locator('[data-testid="2fa-code-input"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should enforce rate limiting on login attempts', async () => {
      await page.click('text=Login');
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
        await page.fill('[data-testid="password-input"]', 'WrongPassword');
        await page.click('[data-testid="login-button"]');
        
        if (i < 5) {
          await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
        }
      }

      // Should show rate limit error
      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('too many attempts');
    });

    test('should sanitize input fields', async () => {
      await page.click('text=Register');
      
      // Try to inject script
      await page.fill('[data-testid="username-input"]', '<script>alert("xss")</script>');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');

      await page.click('[data-testid="register-button"]');

      // Script should not execute
      const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
      const dialog = await dialogPromise;
      
      expect(dialog).toBeNull(); // No alert should have appeared
    });

    test('should protect against CSRF attacks', async () => {
      // Login
      await page.click('text=Login');
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Try to make cross-origin request (this would be blocked by CSRF protection)
      const response = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ displayName: 'Hacked Name' }),
          });
          return response.status;
        } catch (error) {
          return 'error';
        }
      });

      // Request should either fail or require proper CSRF token
      expect(response).not.toBe(200);
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      await page.click('text=Login');
      
      // Tab through form elements
      await page.keyboard.press('Tab'); // Email input
      await page.keyboard.type('testuser1@example.com');
      
      await page.keyboard.press('Tab'); // Password input
      await page.keyboard.type('TestPassword123!');
      
      await page.keyboard.press('Tab'); // Login button
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL('/dashboard');
    });

    test('should have proper ARIA labels', async () => {
      await page.click('text=Login');
      
      // Check for ARIA labels
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      await expect(emailInput).toHaveAttribute('aria-label');
      await expect(passwordInput).toHaveAttribute('aria-label');
    });

    test('should support screen readers', async () => {
      await page.click('text=Register');
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toContainText('Register');
      
      // Check for form labels
      await expect(page.locator('label[for="username"]')).toBeVisible();
      await expect(page.locator('label[for="email"]')).toBeVisible();
    });
  });
});