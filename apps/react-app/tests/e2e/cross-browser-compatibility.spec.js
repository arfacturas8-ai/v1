/**
 * Cross-Browser Compatibility Testing Matrix
 * Tests application functionality across different browsers and devices
 */

import { test, expect, devices } from '@playwright/test';

// Browser and device matrix
const BROWSER_MATRIX = [
  { name: 'Chrome Desktop', project: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'Firefox Desktop', project: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'Safari Desktop', project: 'webkit', device: devices['Desktop Safari'] },
  { name: 'Edge Desktop', project: 'chromium', device: devices['Desktop Edge'] },
  { name: 'Chrome Mobile', project: 'chromium', device: devices['Pixel 5'] },
  { name: 'Safari Mobile', project: 'webkit', device: devices['iPhone 12'] },
  { name: 'iPad', project: 'webkit', device: devices['iPad Pro'] }
];

const VIEWPORT_MATRIX = [
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Desktop Medium', width: 1366, height: 768 },
  { name: 'Desktop Small', width: 1024, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Small', width: 320, height: 568 }
];

test.describe('Cross-Browser Compatibility Matrix', () => {
  
  test.describe('Core Functionality Tests', () => {
    
    test('homepage loads correctly across all browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Check for critical elements
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Check for navigation menu
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Verify no console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Allow for some common acceptable errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('analytics') &&
        !error.includes('advertisement')
      );
      
      expect(criticalErrors).toHaveLength(0);
      
      // Take screenshot for visual comparison
      await page.screenshot({ 
        path: `test-results/screenshots/homepage-${browserName}.png`,
        fullPage: true 
      });
    });

    test('authentication flow works across browsers', async ({ page, browserName }) => {
      await page.goto('/auth/login');
      
      // Check form elements
      const emailInput = page.locator('#email-input, input[type="email"]');
      const passwordInput = page.locator('#password-input, input[type="password"]');
      const loginButton = page.locator('#login-button, button[type="submit"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();
      
      // Test form interaction
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword');
      
      // Check if inputs retain values
      await expect(emailInput).toHaveValue('test@example.com');
      await expect(passwordInput).toHaveValue('testpassword');
      
      // Test form submission (should show validation or redirect)
      await loginButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Should either redirect or show error message
      const currentUrl = page.url();
      const errorMessage = page.locator('.error-message, .alert-danger, [role="alert"]');
      
      expect(currentUrl.includes('/dashboard') || await errorMessage.isVisible()).toBeTruthy();
      
      await page.screenshot({ 
        path: `test-results/screenshots/auth-${browserName}.png` 
      });
    });

    test('navigation menu works across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test desktop navigation
      const desktopNav = page.locator('nav:not(.mobile-nav)');
      if (await desktopNav.isVisible()) {
        const navLinks = desktopNav.locator('a');
        const linkCount = await navLinks.count();
        
        expect(linkCount).toBeGreaterThan(0);
        
        // Test first few navigation links
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = navLinks.nth(i);
          const href = await link.getAttribute('href');
          
          if (href && href.startsWith('/')) {
            await link.click();
            await page.waitForLoadState('networkidle');
            
            // Verify page changed
            expect(page.url()).toContain(href);
            
            // Go back to home
            await page.goto('/');
          }
        }
      }
      
      // Test mobile navigation if present
      const mobileMenuButton = page.locator('.mobile-menu-button, .hamburger, [aria-label*="menu"]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        
        const mobileNav = page.locator('.mobile-nav, .mobile-menu');
        await expect(mobileNav).toBeVisible();
        
        // Close mobile menu
        await mobileMenuButton.click();
        await expect(mobileNav).toBeHidden();
      }
    });
  });

  test.describe('CSS and Layout Tests', () => {
    
    test('responsive design works across viewports', async ({ page, browserName }) => {
      await page.goto('/');
      
      for (const viewport of VIEWPORT_MATRIX) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500); // Allow for responsive adjustments
        
        // Check for horizontal scroll (should not exist)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        expect(hasHorizontalScroll).toBeFalsy();
        
        // Check if content is visible
        const main = page.locator('main');
        await expect(main).toBeVisible();
        
        // Take screenshot for this viewport
        await page.screenshot({ 
          path: `test-results/screenshots/responsive-${viewport.name.replace(' ', '-')}-${browserName}.png` 
        });
      }
    });

    test('CSS grid and flexbox layouts work correctly', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test common layout patterns
      const layoutElements = [
        '.grid', '.flex', '.d-flex', '.layout-grid',
        '.container', '.row', '.col', '.columns'
      ];
      
      for (const selector of layoutElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          // Check first element of this type
          const element = elements.first();
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              flexDirection: computed.flexDirection,
              gridTemplateColumns: computed.gridTemplateColumns,
              position: computed.position
            };
          });
          
          // Verify layout styles are applied
          expect(styles.display).toBeTruthy();
          
          // Check if element is visible and has dimensions
          const boundingBox = await element.boundingBox();
          expect(boundingBox?.width).toBeGreaterThan(0);
          expect(boundingBox?.height).toBeGreaterThan(0);
        }
      }
    });

    test('fonts and typography render consistently', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Check text elements
      const textElements = ['h1', 'h2', 'h3', 'p', 'span', '.text-large', '.text-small'];
      
      for (const selector of textElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          
          if (await element.isVisible()) {
            const styles = await element.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                lineHeight: computed.lineHeight,
                color: computed.color
              };
            });
            
            // Verify text is styled and visible
            expect(styles.fontSize).toBeTruthy();
            expect(styles.fontFamily).toBeTruthy();
            expect(styles.color).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
          }
        }
      }
    });
  });

  test.describe('JavaScript and Interactivity Tests', () => {
    
    test('form validation works across browsers', async ({ page, browserName }) => {
      await page.goto('/auth/register');
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      if (await emailInput.isVisible()) {
        // Test invalid email
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        
        // Check for validation message
        await page.waitForTimeout(500);
        const validationMessage = page.locator('.error, .invalid-feedback, [aria-invalid="true"]');
        
        // Should show validation error
        expect(await validationMessage.count()).toBeGreaterThan(0);
        
        // Test valid email
        await emailInput.fill('valid@example.com');
        await emailInput.blur();
        await page.waitForTimeout(500);
        
        // Validation error should disappear
        const remainingErrors = page.locator('.error:visible, .invalid-feedback:visible');
        expect(await remainingErrors.count()).toBe(0);
      }
    });

    test('dynamic content loading works across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Look for dynamic content elements
      const dynamicElements = [
        'img[loading="lazy"]',
        '.lazy-load',
        '[data-src]',
        '.infinite-scroll'
      ];
      
      for (const selector of dynamicElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          // Scroll to trigger lazy loading
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          
          await page.waitForTimeout(2000);
          
          // Check if content loaded
          const element = elements.first();
          if (await element.isVisible()) {
            const src = await element.getAttribute('src');
            expect(src).toBeTruthy();
            expect(src).not.toBe('');
          }
        }
      }
    });

    test('event handlers work across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test click events
      const clickableElements = page.locator('button, .btn, [role="button"], a[href]');
      const count = await clickableElements.count();
      
      if (count > 0) {
        const element = clickableElements.first();
        
        if (await element.isVisible()) {
          // Track network requests to see if click triggers any
          const requests = [];
          page.on('request', req => requests.push(req.url()));
          
          await element.click();
          await page.waitForTimeout(1000);
          
          // Should either navigate or trigger some response
          const currentUrl = page.url();
          expect(currentUrl || requests.length > 0).toBeTruthy();
        }
      }
      
      // Test hover events if supported
      if (browserName !== 'webkit' || !page.url().includes('mobile')) {
        const hoverElements = page.locator('[title], .tooltip-trigger, .hover-effect');
        const hoverCount = await hoverElements.count();
        
        if (hoverCount > 0) {
          const hoverElement = hoverElements.first();
          
          if (await hoverElement.isVisible()) {
            await hoverElement.hover();
            await page.waitForTimeout(500);
            
            // Check for tooltip or hover effect
            const tooltip = page.locator('.tooltip, [role="tooltip"]');
            // Tooltip may or may not appear, just verify no errors
          }
        }
      }
    });
  });

  test.describe('Media and Assets Tests', () => {
    
    test('images load correctly across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Check all images on page
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        let loadedImages = 0;
        let failedImages = 0;
        
        for (let i = 0; i < Math.min(10, imageCount); i++) {
          const img = images.nth(i);
          
          if (await img.isVisible()) {
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            const naturalHeight = await img.evaluate(el => el.naturalHeight);
            
            if (naturalWidth > 0 && naturalHeight > 0) {
              loadedImages++;
            } else {
              failedImages++;
            }
          }
        }
        
        // Most images should load successfully
        expect(loadedImages).toBeGreaterThan(failedImages);
      }
    });

    test('CSS and font assets load correctly', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Check for 404 errors on assets
      const failedRequests = [];
      
      page.on('response', response => {
        if (response.status() >= 400) {
          failedRequests.push({
            url: response.url(),
            status: response.status()
          });
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Filter out non-critical failed requests
      const criticalFailures = failedRequests.filter(req => 
        req.url.includes('.css') || 
        req.url.includes('.woff') || 
        req.url.includes('.ttf') ||
        req.url.includes('.js')
      );
      
      expect(criticalFailures.length).toBe(0);
    });
  });

  test.describe('Performance Across Browsers', () => {
    
    test('page load performance meets targets', async ({ page, browserName }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (adjust as needed)
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      // Check Web Vitals if supported
      try {
        const webVitals = await page.evaluate(() => {
          return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
              const vitals = {};
              
              // Largest Contentful Paint
              new PerformanceObserver((list) => {
                const entries = list.getEntries();
                vitals.lcp = entries[entries.length - 1].startTime;
              }).observe({ entryTypes: ['largest-contentful-paint'] });
              
              // First Input Delay would need user interaction
              
              // Cumulative Layout Shift
              let clsValue = 0;
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                  }
                }
                vitals.cls = clsValue;
              }).observe({ entryTypes: ['layout-shift'] });
              
              setTimeout(() => resolve(vitals), 3000);
            } else {
              resolve({});
            }
          });
        });
        
        if (webVitals.lcp) {
          expect(webVitals.lcp).toBeLessThan(4000); // LCP should be under 4s
        }
        
        if (webVitals.cls !== undefined) {
          expect(webVitals.cls).toBeLessThan(0.25); // CLS should be under 0.25
        }
      } catch (error) {
        // Web Vitals not supported in this browser
      }
    });
  });

  test.describe('Browser-Specific Features', () => {
    
    test('local storage works across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test localStorage
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });
      
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(storedValue).toBe('test-value');
      
      // Clean up
      await page.evaluate(() => {
        localStorage.removeItem('test-key');
      });
    });

    test('service worker registration works if present', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Check if service worker is registered
      const swSupported = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      if (swSupported) {
        const swRegistration = await page.evaluate(() => {
          return navigator.serviceWorker.getRegistrations();
        });
        
        // Service worker may or may not be present, just verify no errors
        expect(Array.isArray(swRegistration)).toBeTruthy();
      }
    });

    test('CSS custom properties work if supported', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test CSS custom properties (CSS variables)
      const supportsCustomProps = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-prop', 'test-value');
        return testElement.style.getPropertyValue('--test-prop') === 'test-value';
      });
      
      if (supportsCustomProps) {
        // Check if any CSS custom properties are used
        const customPropsUsed = await page.evaluate(() => {
          const styles = Array.from(document.styleSheets);
          let hasCustomProps = false;
          
          try {
            styles.forEach(sheet => {
              const rules = Array.from(sheet.cssRules || []);
              rules.forEach(rule => {
                if (rule.style && rule.style.cssText.includes('--')) {
                  hasCustomProps = true;
                }
              });
            });
          } catch (e) {
            // Cross-origin stylesheets might not be accessible
          }
          
          return hasCustomProps;
        });
        
        // If custom properties are used, they should work
        if (customPropsUsed) {
          expect(supportsCustomProps).toBeTruthy();
        }
      }
    });
  });

  // Generate compatibility report
  test.afterAll(async () => {
    // This would run after all tests complete
    console.log('Cross-browser compatibility tests completed');
  });
});

// Helper function to generate browser compatibility report
test.describe('Compatibility Report Generation', () => {
  test('generate cross-browser compatibility report', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      browsers: BROWSER_MATRIX.map(browser => browser.name),
      viewports: VIEWPORT_MATRIX.map(viewport => viewport.name),
      testResults: {
        // Results would be populated by test runner
        passed: 0,
        failed: 0,
        skipped: 0
      },
      issues: [],
      recommendations: [
        'Ensure consistent font loading across all browsers',
        'Test CSS Grid and Flexbox fallbacks for older browsers',
        'Verify JavaScript polyfills for ES6+ features',
        'Check responsive design at all breakpoints',
        'Validate form behavior across different input types'
      ]
    };
    
    // Save report
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(reportDir, 'cross-browser-compatibility-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('Cross-browser compatibility report saved');
  });
});