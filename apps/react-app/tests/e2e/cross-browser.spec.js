import { test, expect, devices } from '@playwright/test'

test.describe('Cross-Browser Compatibility Testing', () => {
  const testCases = [
    {
      name: 'Chrome Desktop',
      device: devices['Desktop Chrome']
    },
    {
      name: 'Firefox Desktop', 
      device: devices['Desktop Firefox']
    },
    {
      name: 'Safari Desktop',
      device: devices['Desktop Safari']
    },
    {
      name: 'Edge Desktop',
      device: devices['Desktop Edge']
    },
    {
      name: 'Mobile Chrome',
      device: devices['Pixel 5']
    },
    {
      name: 'Mobile Safari',
      device: devices['iPhone 12']
    }
  ]

  for (const testCase of testCases) {
    test.describe(`${testCase.name} Tests`, () => {
      test.use(testCase.device)

      test(`should load landing page correctly on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Check page loads without errors
        await expect(page).toHaveTitle(/CRYB Platform/)
        
        // Check key elements are visible
        const loginButton = page.locator('button:has-text("Login")')
        await expect(loginButton).toBeVisible({ timeout: 10000 })
        
        // Check for hero section
        const heroSection = page.locator('.hero, .landing-hero, h1')
        await expect(heroSection).toBeVisible()
        
        // Check no console errors
        const errors = []
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text())
          }
        })
        
        await page.waitForTimeout(2000)
        expect(errors.length).toBe(0)
      })

      test(`should handle authentication flow on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Open login modal
        await page.click('button:has-text("Login")')
        
        // Check modal displays correctly
        const modal = page.locator('.modal-backdrop, .auth-modal')
        await expect(modal).toBeVisible()
        
        // Fill credentials
        await page.fill('input[type="email"]', 'demo@cryb.ai')
        await page.fill('input[type="password"]', 'demo123')
        
        // Submit form
        await page.click('button:has-text("Sign In")')
        await page.waitForTimeout(3000)
        
        // Check successful login
        const userMenu = page.locator('[data-testid="user-menu"]')
        await expect(userMenu).toBeVisible({ timeout: 10000 })
      })

      test(`should render main app features correctly on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Login first
        await page.click('button:has-text("Login")')
        await page.fill('input[type="email"]', 'demo@cryb.ai')
        await page.fill('input[type="password"]', 'demo123')
        await page.click('button:has-text("Sign In")')
        await page.waitForTimeout(3000)
        
        // Test navigation
        const routes = ['/home', '/communities', '/chat', '/profile']
        
        for (const route of routes) {
          await page.goto(route)
          
          // Check page loads
          await expect(page).toHaveURL(new RegExp(route))
          
          // Check no error boundaries
          const errorBoundary = page.locator('.error-boundary, .error-message')
          await expect(errorBoundary).not.toBeVisible()
          
          // Check main content loads
          const mainContent = page.locator('main, [role="main"], .main-content')
          await expect(mainContent).toBeVisible()
        }
      })

      test(`should handle responsive design on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Get viewport size
        const viewport = page.viewportSize()
        const isMobile = viewport.width < 768
        
        // Login
        await page.click('button:has-text("Login")')
        await page.fill('input[type="email"]', 'demo@cryb.ai')
        await page.fill('input[type="password"]', 'demo123')
        await page.click('button:has-text("Sign In")')
        await page.waitForTimeout(3000)
        
        if (isMobile) {
          // Test mobile navigation
          const mobileMenuButton = page.locator('.mobile-menu-button, .hamburger-menu, button[aria-label*="menu"]')
          if (await mobileMenuButton.isVisible()) {
            await mobileMenuButton.click()
            
            const mobileNav = page.locator('.mobile-nav, .nav-drawer')
            await expect(mobileNav).toBeVisible()
          }
        } else {
          // Test desktop navigation
          const desktopNav = page.locator('.desktop-nav, .header-nav')
          await expect(desktopNav).toBeVisible()
        }
      })

      test(`should handle touch interactions on ${testCase.name}`, async ({ page }) => {
        const viewport = page.viewportSize()
        const isMobile = viewport.width < 768
        
        if (!isMobile) {
          test.skip(true, 'Touch test only for mobile devices')
        }
        
        await page.goto('/')
        
        // Login
        await page.click('button:has-text("Login")')
        await page.fill('input[type="email"]', 'demo@cryb.ai')
        await page.fill('input[type="password"]', 'demo123')
        await page.click('button:has-text("Sign In")')
        await page.waitForTimeout(3000)
        
        // Test swipe gestures if implemented
        await page.goto('/communities')
        
        const scrollContainer = page.locator('.scrollable, .communities-list, main')
        if (await scrollContainer.isVisible()) {
          const box = await scrollContainer.boundingBox()
          if (box) {
            // Test vertical scroll
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
            await page.touchscreen.tap(box.x + box.width / 2, box.y + 50)
          }
        }
      })

      test(`should load CSS and fonts correctly on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Check if fonts are loaded
        const fontFamilies = await page.evaluate(() => {
          const computedStyle = window.getComputedStyle(document.body)
          return computedStyle.fontFamily
        })
        
        expect(fontFamilies).toBeTruthy()
        expect(fontFamilies).toContain('Inter')
        
        // Check if CSS variables are applied
        const cssVariables = await page.evaluate(() => {
          const computedStyle = window.getComputedStyle(document.documentElement)
          return {
            primary: computedStyle.getPropertyValue('--color-primary'),
            background: computedStyle.getPropertyValue('--bg-primary')
          }
        })
        
        expect(cssVariables.primary || cssVariables.background).toBeTruthy()
      })

      test(`should handle JavaScript features correctly on ${testCase.name}`, async ({ page }) => {
        await page.goto('/')
        
        // Check for modern JavaScript features
        const jsFeatures = await page.evaluate(() => {
          return {
            fetch: typeof fetch !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            promises: typeof Promise !== 'undefined',
            arrow: (() => true)(),
            destructuring: (([a]) => a)([true]),
            modules: typeof import !== 'undefined'
          }
        })
        
        expect(jsFeatures.fetch).toBe(true)
        expect(jsFeatures.localStorage).toBe(true)
        expect(jsFeatures.sessionStorage).toBe(true)
        expect(jsFeatures.promises).toBe(true)
        expect(jsFeatures.arrow).toBe(true)
        expect(jsFeatures.destructuring).toBe(true)
      })
    })
  }
})

test.describe('Browser-Specific Feature Tests', () => {
  test('Chrome - WebRTC and notifications', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')
    
    await page.goto('/')
    
    // Check WebRTC support
    const webrtcSupport = await page.evaluate(() => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    })
    expect(webrtcSupport).toBe(true)
    
    // Check notification API
    const notificationSupport = await page.evaluate(() => {
      return 'Notification' in window
    })
    expect(notificationSupport).toBe(true)
  })

  test('Firefox - CSS Grid and Flexbox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')
    
    await page.goto('/')
    
    // Check CSS Grid support
    const gridSupport = await page.evaluate(() => {
      return CSS.supports('display', 'grid')
    })
    expect(gridSupport).toBe(true)
    
    // Check Flexbox support
    const flexSupport = await page.evaluate(() => {
      return CSS.supports('display', 'flex')
    })
    expect(flexSupport).toBe(true)
  })

  test('Safari - Service Worker and PWA', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')
    
    await page.goto('/')
    
    // Check Service Worker support
    const swSupport = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(swSupport).toBe(true)
    
    // Check Web App Manifest
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestLink).toBe('/manifest.json')
  })
})

test.describe('Performance Across Browsers', () => {
  for (const testCase of [
    { name: 'Chrome', browser: 'chromium' },
    { name: 'Firefox', browser: 'firefox' },
    { name: 'Safari', browser: 'webkit' }
  ]) {
    test(`${testCase.name} - Page load performance`, async ({ page, browserName }) => {
      test.skip(browserName !== testCase.browser, `${testCase.name}-specific test`)
      
      const startTime = Date.now()
      await page.goto('/')
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
      
      // Check for Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries()
            const vitals = {}
            
            entries.forEach(entry => {
              if (entry.name === 'FCP') vitals.fcp = entry.value
              if (entry.name === 'LCP') vitals.lcp = entry.value
              if (entry.name === 'FID') vitals.fid = entry.value
              if (entry.name === 'CLS') vitals.cls = entry.value
            })
            
            resolve(vitals)
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
          
          // Fallback timeout
          setTimeout(() => resolve({}), 3000)
        })
      })
      
      console.log(`${testCase.name} Performance:`, vitals)
    })
  }
})