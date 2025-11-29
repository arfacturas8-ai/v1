/**
 * Mobile Authentication Tests
 * Tests login, registration, and authentication flows on mobile
 */

describe('Mobile Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('App Launch and Onboarding', () => {
    it('should show splash screen and navigate to onboarding', async () => {
      // Wait for splash screen
      await expect(element(by.id('splash-screen'))).toBeVisible();
      
      // Wait for onboarding or login screen
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await testUtils.takeScreenshot('app-launch');
    });

    it('should complete onboarding flow', async () => {
      // Skip if already onboarded
      const skipButton = element(by.id('skip-onboarding'));
      try {
        await expect(skipButton).toBeVisible();
        await skipButton.tap();
        return;
      } catch (error) {
        // Continue with onboarding
      }

      // First onboarding step
      await expect(element(by.id('welcome-title'))).toBeVisible();
      await element(by.id('next-button')).tap();

      // Features overview
      await expect(element(by.id('features-overview'))).toBeVisible();
      await element(by.id('next-button')).tap();

      // Permissions request
      await expect(element(by.id('permissions-screen'))).toBeVisible();
      await element(by.id('allow-permissions')).tap();

      // Complete onboarding
      await element(by.id('get-started-button')).tap();
      
      await expect(element(by.id('auth-screen'))).toBeVisible();
    });
  });

  describe('User Registration', () => {
    beforeEach(async () => {
      // Navigate to registration
      await element(by.id('register-tab')).tap();
      await expect(element(by.id('register-form'))).toBeVisible();
    });

    it('should register a new user successfully', async () => {
      const testData = testUtils.generateTestData();

      // Fill registration form
      await element(by.id('email-input')).typeText(testData.email);
      await element(by.id('username-input')).typeText(testData.username);
      await element(by.id('display-name-input')).typeText(testData.displayName);
      await element(by.id('password-input')).typeText(testData.password);
      await element(by.id('confirm-password-input')).typeText(testData.password);

      // Agree to terms
      await element(by.id('terms-checkbox')).tap();

      await testUtils.takeScreenshot('registration-form-filled');

      // Submit registration
      await element(by.id('register-button')).tap();

      // Wait for registration success
      await waitFor(element(by.id('registration-success')))
        .toBeVisible()
        .withTimeout(15000);

      await testUtils.takeScreenshot('registration-success');
    });

    it('should show validation errors for invalid input', async () => {
      // Submit empty form
      await element(by.id('register-button')).tap();

      // Check for validation errors
      await expect(element(by.id('email-error'))).toBeVisible();
      await expect(element(by.id('password-error'))).toBeVisible();

      // Test invalid email
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('email-input')).tapReturnKey();
      
      await expect(element(by.text('Please enter a valid email address'))).toBeVisible();

      await testUtils.takeScreenshot('validation-errors');
    });

    it('should handle network errors gracefully', async () => {
      // Simulate network failure
      await networkHelpers.simulateOffline();

      const testData = testUtils.generateTestData();
      
      // Fill form
      await element(by.id('email-input')).typeText(testData.email);
      await element(by.id('password-input')).typeText(testData.password);
      await element(by.id('terms-checkbox')).tap();
      
      // Attempt registration
      await element(by.id('register-button')).tap();

      // Should show network error
      await expect(element(by.id('network-error'))).toBeVisible();

      await networkHelpers.restoreNetwork();
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await element(by.id('login-tab')).tap();
      await expect(element(by.id('login-form'))).toBeVisible();
    });

    it('should login with valid credentials', async () => {
      // Use test user credentials
      await element(by.id('email-input')).typeText(testUtils.testUser.email);
      await element(by.id('password-input')).typeText(testUtils.testUser.password);

      await testUtils.takeScreenshot('login-form-filled');

      await element(by.id('login-button')).tap();

      // Wait for dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(15000);

      await testUtils.takeScreenshot('login-success');
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('wrong@email.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      
      await element(by.id('login-button')).tap();

      await expect(element(by.id('login-error'))).toBeVisible();
      await expect(element(by.text('Invalid email or password'))).toBeVisible();
    });

    it('should remember login state', async () => {
      // Login first
      await element(by.id('email-input')).typeText(testUtils.testUser.email);
      await element(by.id('password-input')).typeText(testUtils.testUser.password);
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should go directly to dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(async () => {
      // Ensure user is logged in
      await element(by.id('login-tab')).tap();
      await element(by.id('email-input')).typeText(testUtils.testUser.email);
      await element(by.id('password-input')).typeText(testUtils.testUser.password);
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should enable biometric authentication', async () => {
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      await element(by.id('security-settings')).tap();

      // Enable biometric auth
      await element(by.id('biometric-toggle')).tap();

      // Should show biometric setup
      await expect(element(by.id('biometric-setup'))).toBeVisible();
      
      if (device.getPlatform() === 'ios') {
        await element(by.id('enable-face-id')).tap();
      } else {
        await element(by.id('enable-fingerprint')).tap();
      }

      await testUtils.takeScreenshot('biometric-enabled');
    });

    it('should login with biometric authentication', async () => {
      // Logout first
      await element(by.id('settings-tab')).tap();
      await element(by.id('logout-button')).tap();

      // Should be back to auth screen
      await expect(element(by.id('auth-screen'))).toBeVisible();

      // Should show biometric login option
      await expect(element(by.id('biometric-login'))).toBeVisible();
      await element(by.id('biometric-login')).tap();

      // Simulate biometric success
      if (device.getPlatform() === 'ios') {
        await device.matchFace();
      } else {
        await device.matchFinger();
      }

      // Should login successfully
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      await element(by.id('login-tab')).tap();
      await element(by.id('forgot-password-link')).tap();

      await expect(element(by.id('forgot-password-screen'))).toBeVisible();

      await element(by.id('email-input')).typeText(testUtils.testUser.email);
      await element(by.id('reset-password-button')).tap();

      await expect(element(by.id('reset-email-sent'))).toBeVisible();
      await testUtils.takeScreenshot('password-reset-sent');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', async () => {
      await device.launchApp({ 
        permissions: { notifications: 'YES' },
        userNotification: { isVoiceOverRunning: true }
      });

      // Check accessibility labels
      await expect(element(by.id('email-input'))).toHaveAccessibilityLabel('Email address');
      await expect(element(by.id('password-input'))).toHaveAccessibilityLabel('Password');
      await expect(element(by.id('login-button'))).toHaveAccessibilityLabel('Log in');
    });

    it('should support large text sizes', async () => {
      await device.launchApp({ 
        permissions: { notifications: 'YES' },
        userNotification: { contentSizeCategoryName: 'UICTContentSizeCategoryAccessibilityExtraExtraExtraLarge' }
      });

      // Elements should still be visible and functional
      await expect(element(by.id('login-form'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      
      await testUtils.takeScreenshot('large-text-support');
    });
  });

  describe('Orientation Support', () => {
    it('should work in both portrait and landscape', async () => {
      await deviceHelpers.testBothOrientations(async (orientation) => {
        await expect(element(by.id('auth-screen'))).toBeVisible();
        await expect(element(by.id('email-input'))).toBeVisible();
        await expect(element(by.id('password-input'))).toBeVisible();
        await expect(element(by.id('login-button'))).toBeVisible();
        
        await testUtils.takeScreenshot(`auth-${orientation}`);
      });
    });
  });
});