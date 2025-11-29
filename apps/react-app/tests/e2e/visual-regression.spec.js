/**
 * Visual Regression Tests
 * Captures and compares screenshots to detect visual changes
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addInitScript(() => {
      // Disable CSS animations
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('homepage visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('authentication pages visual regression', async ({ page }) => {
    // Login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png');

    // Register page
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register-page.png');
  });

  test('dashboard visual regression', async ({ page }) => {
    // This would need authentication setup
    // For now, we'll skip if not authenticated
    await page.goto('/dashboard');
    
    // Check if redirected to login (not authenticated)
    if (page.url().includes('/auth/login')) {
      test.skip('Dashboard requires authentication');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: true,
    });
  });

  test('chat interface visual regression', async ({ page }) => {
    await page.goto('/chat');
    
    if (page.url().includes('/auth/login')) {
      test.skip('Chat requires authentication');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Wait for chat interface to fully load
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 10000 });
    
    await expect(page).toHaveScreenshot('chat-interface.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });

  test('responsive design - tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });

  test('dark mode visual regression', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(1000); // Wait for theme transition
    }
    
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
    });
  });

  test('error pages visual regression', async ({ page }) => {
    // 404 page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('404-page.png');
  });

  test('component interactions visual regression', async ({ page }) => {
    await page.goto('/');
    
    // Test modal if available
    const modalTrigger = page.locator('[data-testid="modal-trigger"]');
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForSelector('[data-testid="modal"]');
      await expect(page).toHaveScreenshot('modal-open.png');
    }
    
    // Test dropdown if available
    const dropdownTrigger = page.locator('[data-testid="dropdown-trigger"]');
    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForSelector('[data-testid="dropdown-menu"]');
      await expect(page).toHaveScreenshot('dropdown-open.png');
    }
  });

  test('form states visual regression', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Empty form state
    await expect(page).toHaveScreenshot('form-empty.png');
    
    // Fill form with valid data
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await expect(page).toHaveScreenshot('form-filled.png');
    
    // Trigger validation errors
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.blur('[data-testid="email-input"]');
    await page.waitForTimeout(500); // Wait for validation
    await expect(page).toHaveScreenshot('form-validation-errors.png');
  });

  test('loading states visual regression', async ({ page }) => {
    await page.goto('/');
    
    // Intercept API calls to simulate loading state
    await page.route('**/api/**', async (route) => {
      // Delay the response to capture loading state
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Navigate to a page that triggers API calls
    await page.goto('/dashboard');
    
    // Capture loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page).toHaveScreenshot('loading-state.png');
  });
});