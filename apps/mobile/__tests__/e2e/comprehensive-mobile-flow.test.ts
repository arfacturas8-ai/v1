import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

const TEST_USER = {
  username: 'mobiletest_' + Date.now(),
  email: `mobiletest_${Date.now()}@example.com`,
  password: 'MobileTest123!',
};

const TEST_COMMUNITY = {
  name: 'Mobile Test Community ' + Date.now(),
  description: 'A community for testing mobile functionality',
};

describe('CRYB Mobile App - Comprehensive E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        camera: 'YES',
        microphone: 'YES',
        notifications: 'YES',
        photos: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('App Launch and Initial Setup', () => {
    it('should launch app and show splash screen', async () => {
      await detoxExpected(element(by.id('splash-screen'))).toBeVisible();
      await waitFor(element(by.id('welcome-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show onboarding flow for new users', async () => {
      await detoxExpected(element(by.id('onboarding-step-1'))).toBeVisible();
      
      // Navigate through onboarding
      await element(by.id('onboarding-next-button')).tap();
      await detoxExpected(element(by.id('onboarding-step-2'))).toBeVisible();
      
      await element(by.id('onboarding-next-button')).tap();
      await detoxExpected(element(by.id('onboarding-step-3'))).toBeVisible();
      
      await element(by.id('onboarding-finish-button')).tap();
      await detoxExpected(element(by.id('auth-screen'))).toBeVisible();
    });

    it('should handle network connectivity changes', async () => {
      // Simulate network disconnect
      await device.setURLBlacklist(['*']);
      
      await detoxExpected(element(by.id('network-error-message'))).toBeVisible();
      await detoxExpected(element(by.text('No internet connection'))).toBeVisible();
      
      // Restore network
      await device.setURLBlacklist([]);
      
      await waitFor(element(by.id('network-error-message')))
        .not.toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('User Authentication Flow', () => {
    it('should register new user successfully', async () => {
      await element(by.id('register-tab')).tap();
      
      await element(by.id('username-input')).typeText(TEST_USER.username);
      await element(by.id('email-input')).typeText(TEST_USER.email);
      await element(by.id('password-input')).typeText(TEST_USER.password);
      await element(by.id('confirm-password-input')).typeText(TEST_USER.password);
      
      await element(by.id('register-button')).tap();
      
      await waitFor(element(by.id('registration-success')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should login user successfully', async () => {
      await element(by.id('login-tab')).tap();
      
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText(TEST_USER.email);
      await element(by.id('password-input')).clearText();
      await element(by.id('password-input')).typeText(TEST_USER.password);
      
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.id('main-tab-navigator')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle biometric authentication if available', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('security-settings')).tap();
      
      // Check if biometric option is available
      const biometricToggle = element(by.id('biometric-toggle'));
      try {
        await detoxExpected(biometricToggle).toBeVisible();
        await biometricToggle.tap();
        
        // Simulate biometric authentication
        await device.setBiometricEnrollment(true);
        await detoxExpected(element(by.text('Biometric authentication enabled'))).toBeVisible();
      } catch (error) {
        // Biometric not available on this device/simulator
        console.log('Biometric authentication not available');
      }
    });
  });

  describe('Navigation and UI', () => {
    it('should navigate through main tabs', async () => {
      await element(by.id('home-tab')).tap();
      await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      
      await element(by.id('communities-tab')).tap();
      await detoxExpected(element(by.id('communities-screen'))).toBeVisible();
      
      await element(by.id('chat-tab')).tap();
      await detoxExpected(element(by.id('chat-screen'))).toBeVisible();
      
      await element(by.id('profile-tab')).tap();
      await detoxExpected(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should open and close drawer navigation', async () => {
      await element(by.id('drawer-menu-button')).tap();
      await detoxExpected(element(by.id('drawer-content'))).toBeVisible();
      
      await element(by.id('drawer-overlay')).tap();
      await detoxExpected(element(by.id('drawer-content'))).not.toBeVisible();
    });

    it('should handle device rotation', async () => {
      await device.setOrientation('landscape');
      await detoxExpected(element(by.id('main-tab-navigator'))).toBeVisible();
      
      await device.setOrientation('portrait');
      await detoxExpected(element(by.id('main-tab-navigator'))).toBeVisible();
    });
  });

  describe('Community Features', () => {
    it('should create new community', async () => {
      await element(by.id('communities-tab')).tap();
      await element(by.id('create-community-fab')).tap();
      
      await element(by.id('community-name-input')).typeText(TEST_COMMUNITY.name);
      await element(by.id('community-description-input')).typeText(TEST_COMMUNITY.description);
      await element(by.id('community-type-picker')).tap();
      await element(by.text('Public')).tap();
      
      await element(by.id('create-community-button')).tap();
      
      await waitFor(element(by.text(TEST_COMMUNITY.name)))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should join and leave communities', async () => {
      // Find a community to join
      await element(by.id('communities-list')).scrollTo('top');
      await element(by.id('community-item-0')).tap();
      
      // Join community
      await element(by.id('join-community-button')).tap();
      await detoxExpected(element(by.id('leave-community-button'))).toBeVisible();
      
      // Leave community
      await element(by.id('leave-community-button')).tap();
      await element(by.text('Confirm')).tap();
      await detoxExpected(element(by.id('join-community-button'))).toBeVisible();
    });

    it('should search communities', async () => {
      await element(by.id('communities-tab')).tap();
      await element(by.id('search-communities-input')).typeText('test');
      
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('search-communities-input')).clearText();
    });
  });

  describe('Post Creation and Interaction', () => {
    it('should create text post', async () => {
      await element(by.id('home-tab')).tap();
      await element(by.id('create-post-fab')).tap();
      
      await element(by.id('post-title-input')).typeText('Mobile Test Post');
      await element(by.id('post-content-input')).typeText('This is a test post created from mobile app');
      await element(by.id('post-type-text')).tap();
      
      await element(by.id('submit-post-button')).tap();
      
      await waitFor(element(by.text('Post created successfully')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should create image post with camera', async () => {
      await element(by.id('create-post-fab')).tap();
      await element(by.id('post-type-image')).tap();
      
      await element(by.id('add-image-camera')).tap();
      
      // Simulate camera usage
      await device.takeScreenshot('camera-test');
      await element(by.id('capture-photo-button')).tap();
      await element(by.id('use-photo-button')).tap();
      
      await element(by.id('post-title-input')).typeText('Camera Test Post');
      await element(by.id('submit-post-button')).tap();
      
      await waitFor(element(by.text('Post created successfully')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should vote on posts using swipe gestures', async () => {
      await element(by.id('home-tab')).tap();
      
      // Find first post
      const firstPost = element(by.id('post-item-0'));
      await detoxExpected(firstPost).toBeVisible();
      
      // Swipe right for upvote
      await firstPost.swipe('right', 'fast');
      await detoxExpected(element(by.id('upvote-animation'))).toBeVisible();
      
      // Wait for animation to complete
      await waitFor(element(by.id('upvote-animation')))
        .not.toBeVisible()
        .withTimeout(3000);
      
      // Swipe left for downvote
      await firstPost.swipe('left', 'fast');
      await detoxExpected(element(by.id('downvote-animation'))).toBeVisible();
    });

    it('should add and view comments', async () => {
      const firstPost = element(by.id('post-item-0'));
      await firstPost.tap();
      
      await detoxExpected(element(by.id('post-detail-screen'))).toBeVisible();
      
      await element(by.id('add-comment-input')).typeText('This is a test comment from mobile');
      await element(by.id('submit-comment-button')).tap();
      
      await waitFor(element(by.text('This is a test comment from mobile')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Real-time Chat', () => {
    it('should join chat room and send messages', async () => {
      await element(by.id('chat-tab')).tap();
      
      // Join general chat
      await element(by.id('general-chat-room')).tap();
      
      await detoxExpected(element(by.id('chat-room-screen'))).toBeVisible();
      
      // Send text message
      await element(by.id('message-input')).typeText('Hello from mobile app!');
      await element(by.id('send-message-button')).tap();
      
      await waitFor(element(by.text('Hello from mobile app!')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should send voice message', async () => {
      // Ensure we're in chat room
      await detoxExpected(element(by.id('chat-room-screen'))).toBeVisible();
      
      // Long press on mic button to record
      await element(by.id('voice-message-button')).longPress();
      await detoxExpected(element(by.id('recording-indicator'))).toBeVisible();
      
      // Wait for recording
      await device.sleep(2000);
      
      // Release to send
      await element(by.id('voice-message-button')).tap();
      
      await waitFor(element(by.id('voice-message-sent')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show typing indicators', async () => {
      // Start typing
      await element(by.id('message-input')).typeText('Testing typing indicator...');
      
      // Should show typing indicator for current user
      await detoxExpected(element(by.id('typing-indicator-self'))).toBeVisible();
      
      // Clear input
      await element(by.id('message-input')).clearText();
      
      // Typing indicator should disappear
      await waitFor(element(by.id('typing-indicator-self')))
        .not.toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Voice and Video Calls', () => {
    it('should initiate voice call', async () => {
      await element(by.id('chat-tab')).tap();
      await element(by.id('voice-channel-1')).tap();
      
      await element(by.id('join-voice-call-button')).tap();
      
      // Grant microphone permission if prompted
      try {
        await element(by.text('Allow')).tap();
      } catch (error) {
        // Permission already granted
      }
      
      await waitFor(element(by.id('voice-call-connected')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Test mute/unmute
      await element(by.id('mute-button')).tap();
      await detoxExpected(element(by.id('muted-indicator'))).toBeVisible();
      
      await element(by.id('mute-button')).tap();
      await detoxExpected(element(by.id('muted-indicator'))).not.toBeVisible();
      
      // Leave call
      await element(by.id('leave-call-button')).tap();
    });

    it('should handle video call features', async () => {
      await element(by.id('video-channel-1')).tap();
      await element(by.id('join-video-call-button')).tap();
      
      await waitFor(element(by.id('video-call-connected')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Toggle video
      await element(by.id('video-toggle-button')).tap();
      await detoxExpected(element(by.id('video-preview'))).toBeVisible();
      
      await element(by.id('video-toggle-button')).tap();
      await detoxExpected(element(by.id('video-preview'))).not.toBeVisible();
      
      // Switch camera
      await element(by.id('video-toggle-button')).tap();
      await element(by.id('switch-camera-button')).tap();
      
      await element(by.id('leave-call-button')).tap();
    });
  });

  describe('Push Notifications', () => {
    it('should handle push notification permissions', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('notification-settings')).tap();
      
      // Enable push notifications
      await element(by.id('push-notifications-toggle')).tap();
      
      // Grant permission if prompted
      try {
        await element(by.text('Allow')).tap();
      } catch (error) {
        // Permission already granted or denied
      }
      
      await detoxExpected(element(by.id('notifications-enabled-message'))).toBeVisible();
    });

    it('should receive and display notification', async () => {
      // Simulate receiving a push notification
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'New Message',
        subtitle: 'CRYB',
        body: 'You have a new message in Test Community',
        badge: 1,
        payload: {
          type: 'message',
          communityId: 'test-community-id',
        },
      });
      
      // Tap on notification
      await device.launchApp({ newInstance: false });
      
      // Should navigate to the relevant screen
      await waitFor(element(by.id('chat-room-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Offline Mode', () => {
    it('should handle offline state gracefully', async () => {
      // Disable network
      await device.setURLBlacklist(['*']);
      
      await element(by.id('home-tab')).tap();
      
      // Should show offline indicator
      await detoxExpected(element(by.id('offline-indicator'))).toBeVisible();
      
      // Try to create post offline
      await element(by.id('create-post-fab')).tap();
      await element(by.id('post-title-input')).typeText('Offline Post');
      await element(by.id('post-content-input')).typeText('This post was created offline');
      await element(by.id('submit-post-button')).tap();
      
      // Should show queued for upload message
      await detoxExpected(element(by.text('Post queued for upload'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      
      // Should sync offline content
      await waitFor(element(by.text('Content synced successfully')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should cache content for offline viewing', async () => {
      // Load content while online
      await element(by.id('home-tab')).tap();
      await element(by.id('posts-list')).scrollTo('bottom');
      
      // Go offline
      await device.setURLBlacklist(['*']);
      
      // Should still be able to view cached posts
      await element(by.id('posts-list')).scrollTo('top');
      await detoxExpected(element(by.id('post-item-0'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
    });
  });

  describe('Profile and Settings', () => {
    it('should update user profile', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('edit-profile-button')).tap();
      
      await element(by.id('display-name-input')).clearText();
      await element(by.id('display-name-input')).typeText('Updated Mobile User');
      await element(by.id('bio-input')).typeText('Updated bio from mobile app');
      
      await element(by.id('save-profile-button')).tap();
      
      await waitFor(element(by.text('Profile updated successfully')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should change app theme', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('appearance-settings')).tap();
      
      await element(by.id('dark-theme-option')).tap();
      
      // Verify dark theme is applied
      await detoxExpected(element(by.id('dark-theme-container'))).toBeVisible();
      
      // Switch back to light theme
      await element(by.id('light-theme-option')).tap();
      await detoxExpected(element(by.id('light-theme-container'))).toBeVisible();
    });

    it('should handle app permissions', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('privacy-settings')).tap();
      
      // Review camera permission
      await element(by.id('camera-permission-setting')).tap();
      await detoxExpected(element(by.text('Camera access is required for photo and video features'))).toBeVisible();
      
      // Review microphone permission
      await element(by.id('microphone-permission-setting')).tap();
      await detoxExpected(element(by.text('Microphone access is required for voice messages and calls'))).toBeVisible();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle app backgrounding and foregrounding', async () => {
      await device.sendToHome();
      await device.sleep(2000);
      await device.launchApp({ newInstance: false });
      
      // App should resume from where it left off
      await detoxExpected(element(by.id('main-tab-navigator'))).toBeVisible();
    });

    it('should handle memory warnings gracefully', async () => {
      // Simulate memory pressure
      await device.setMemoryWarningLevel('critical');
      
      // App should still function
      await element(by.id('home-tab')).tap();
      await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      
      // Reset memory warning
      await device.setMemoryWarningLevel('normal');
    });

    it('should handle rapid user interactions', async () => {
      // Rapidly tap multiple UI elements
      for (let i = 0; i < 10; i++) {
        await element(by.id('home-tab')).tap();
        await element(by.id('communities-tab')).tap();
      }
      
      // App should remain stable
      await detoxExpected(element(by.id('communities-screen'))).toBeVisible();
    });

    it('should handle form validation errors', async () => {
      await element(by.id('create-post-fab')).tap();
      
      // Try to submit empty form
      await element(by.id('submit-post-button')).tap();
      
      // Should show validation errors
      await detoxExpected(element(by.text('Title is required'))).toBeVisible();
      await detoxExpected(element(by.text('Content is required'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should support screen reader navigation', async () => {
      await device.setAccessibilityState(true);
      
      // Navigate using accessibility
      await element(by.id('home-tab')).tap();
      
      // Verify accessibility labels are present
      await detoxExpected(element(by.traits(['button']))).toBeVisible();
      await detoxExpected(element(by.traits(['header']))).toBeVisible();
      
      await device.setAccessibilityState(false);
    });

    it('should support dynamic text sizing', async () => {
      // Set large text size
      await device.setTextSize('XXXL');
      
      await element(by.id('home-tab')).tap();
      
      // Verify text is still readable and UI is not broken
      await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      
      // Reset text size
      await device.setTextSize('M');
    });

    it('should support high contrast mode', async () => {
      await device.setAccessibilityState(true, 'highContrast');
      
      await element(by.id('home-tab')).tap();
      
      // Verify app adapts to high contrast
      await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      
      await device.setAccessibilityState(false, 'highContrast');
    });
  });
});