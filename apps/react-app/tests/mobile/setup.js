/**
 * Detox Mobile Test Setup
 * Global setup for mobile testing environment
 */

const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

// Set the default timeout for mobile tests
jest.setTimeout(300000);

// Setup Detox adapter
jasmine.getEnv().addReporter(adapter);

// Optional: Add spec reporter for better test output
jasmine.getEnv().addReporter(specReporter);

// Global test utilities
global.testUtils = {
  // Wait for element with retry logic
  async waitForElementWithRetry(element, timeout = 10000, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await waitFor(element).toBeVisible().withTimeout(timeout);
        return true;
      } catch (error) {
        if (i === retries - 1) throw error;
        await device.reloadReactNative();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  },

  // Take screenshot with timestamp
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await device.takeScreenshot(`${name}-${timestamp}`);
  },

  // Reset app to clean state
  async resetApp() {
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp({ newInstance: true });
  },

  // Common test data
  testUser: {
    email: 'mobile-test@example.com',
    password: 'MobileTest123!',
    username: 'mobiletestuser',
    displayName: 'Mobile Test User'
  },

  // Wait for network requests to complete
  async waitForNetworkIdle(timeout = 5000) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  },

  // Handle permissions
  async allowPermissions() {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({ permissions: { camera: 'YES', microphone: 'YES', notifications: 'YES' } });
    } else {
      // Android permissions handled differently
      await device.launchApp();
    }
  },

  // Generate unique test data
  generateTestData() {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      displayName: `Test User ${timestamp}`,
      password: 'TestPassword123!'
    };
  }
};

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Device orientation helpers
global.deviceHelpers = {
  async rotateToLandscape() {
    await device.setOrientation('landscape');
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  async rotateToPortrait() {
    await device.setOrientation('portrait');
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  async testBothOrientations(testFn) {
    // Test in portrait
    await device.setOrientation('portrait');
    await testFn('portrait');

    // Test in landscape
    await device.setOrientation('landscape');
    await testFn('landscape');

    // Reset to portrait
    await device.setOrientation('portrait');
  }
};

// Network simulation helpers
global.networkHelpers = {
  async simulateSlowNetwork() {
    if (device.getPlatform() === 'ios') {
      await device.setLocation(37.7749, -122.4194); // San Francisco
    }
    // Network throttling would be handled by external tools
  },

  async simulateOffline() {
    // This would need device-specific implementation
    console.warn('Offline simulation not implemented for this device type');
  },

  async restoreNetwork() {
    // Restore normal network conditions
    console.log('Network conditions restored');
  }
};

// Memory and performance helpers
global.performanceHelpers = {
  memoryUsage: [],

  async startMemoryMonitoring() {
    this.memoryInterval = setInterval(async () => {
      try {
        // This would need platform-specific implementation
        const usage = await device.getMemoryInfo?.();
        if (usage) {
          this.memoryUsage.push({
            timestamp: Date.now(),
            ...usage
          });
        }
      } catch (error) {
        // Memory monitoring not available on this platform
      }
    }, 1000);
  },

  async stopMemoryMonitoring() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  },

  getMemoryReport() {
    if (this.memoryUsage.length === 0) return null;

    const usage = this.memoryUsage.map(u => u.used || 0);
    return {
      samples: this.memoryUsage.length,
      avgMemory: usage.reduce((a, b) => a + b, 0) / usage.length,
      maxMemory: Math.max(...usage),
      minMemory: Math.min(...usage)
    };
  }
};