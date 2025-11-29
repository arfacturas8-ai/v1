import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 2,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Global timeout for each test */
  timeout: 60000,
  /* Global timeout for expect assertions */
  expect: {
    timeout: 10000,
    toHaveScreenshot: { threshold: 0.2, mode: 'percent' },
    toMatchSnapshot: { threshold: 0.2, mode: 'percent' },
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'test-results/allure-results' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://platform.cryb.ai',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 30000,
    
    /* Global navigation timeout */
    navigationTimeout: 30000,
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Permissions */
    permissions: ['camera', 'microphone', 'notifications'],
    
    /* Color scheme */
    colorScheme: 'light',
    
    /* Viewport size */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Bypass CSP */
    bypassCSP: true,
    
    /* User agent */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup',
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.js/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 7'],
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Firefox',
      use: { 
        ...devices['Mobile Firefox'],
      },
      dependencies: ['setup'],
    },

    // Tablet devices
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'iPad landscape',
      use: { 
        ...devices['iPad Pro landscape'],
      },
      dependencies: ['setup'],
    },

    // Branded browsers
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
      },
      dependencies: ['setup'],
    },

    // Visual regression testing
    {
      name: 'visual-chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*visual.*\.spec\.js/,
      dependencies: ['setup'],
    },

    // Performance testing
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*performance.*\.spec\.js/,
      dependencies: ['setup'],
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*accessibility.*\.spec\.js/,
      dependencies: ['setup'],
    },

    // Security testing
    {
      name: 'security',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*security.*\.spec\.js/,
      dependencies: ['setup'],
    },

    // API testing
    {
      name: 'api',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*api.*\.spec\.js/,
      dependencies: ['setup'],
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/config/global-setup.js'),
  globalTeardown: require.resolve('./tests/config/global-teardown.js'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run serve',
    url: 'http://localhost:3007',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Metadata */
  metadata: {
    'test-environment': process.env.NODE_ENV || 'development',
    'test-runner': 'playwright',
    'browser-versions': 'latest',
    'platform': process.platform,
  },
});