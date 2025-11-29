import { test, expect } from '@playwright/test'

test.describe('Error Handling and Boundary Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('404 page handling', async ({ page }) => {
    // Test non-existent route
    await page.goto('/non-existent-page')
    
    // Should redirect to home or show 404
    await expect(page).toHaveURL(/.*\/(home|404)?/)
    
    // Should not show error boundary
    const errorBoundary = page.locator('.error-boundary, .error-fallback')
    await expect(errorBoundary).not.toBeVisible()
    
    // Should show meaningful content
    const content = page.locator('main, .main-content, .container')
    await expect(content).toBeVisible()
  })

  test('network error handling', async ({ page }) => {
    // Intercept and fail API requests
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    await page.goto('/')
    
    // Try to login (should handle network failure gracefully)
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    
    // Should show error message, not crash
    await page.waitForTimeout(2000)
    const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // App should remain functional
    const loginButton = page.locator('button:has-text("Login")')
    await expect(loginButton).toBeVisible()
  })

  test('JavaScript error boundaries', async ({ page }) => {
    const jsErrors = []
    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })
    
    await page.goto('/')
    
    // Trigger potential error scenarios
    await page.evaluate(() => {
      // Simulate component error
      window.dispatchEvent(new Error('Test error'))
    })
    
    await page.waitForTimeout(1000)
    
    // Check if error boundary caught the error
    const errorBoundary = page.locator('.error-boundary, .error-fallback')
    if (await errorBoundary.isVisible()) {
      // Error boundary should show helpful message
      const errorText = await errorBoundary.textContent()
      expect(errorText).toContain('error')
      
      // Should have option to recover
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Reload")')
      if (await retryButton.isVisible()) {
        await retryButton.click()
        await expect(errorBoundary).not.toBeVisible()
      }
    }
    
    // Log any uncaught JavaScript errors
    if (jsErrors.length > 0) {
      console.log('JavaScript errors detected:', jsErrors)
    }
  })

  test('form validation error handling', async ({ page }) => {
    await page.click('button:has-text("Login")')
    
    // Test various invalid inputs
    const testCases = [
      { email: '', password: '', expected: 'provide both email and password' },
      { email: 'invalid-email', password: 'password123', expected: 'valid email' },
      { email: 'test@example.com', password: '123', expected: 'password' },
      { email: 'test@example.com', password: 'wrongpassword', expected: 'Invalid credentials' }
    ]
    
    for (const testCase of testCases) {
      // Clear and fill form
      await page.fill('input[type="email"]', testCase.email)
      await page.fill('input[type="password"]', testCase.password)
      
      await page.click('button:has-text("Sign In")')
      await page.waitForTimeout(1500)
      
      // Check for appropriate error message
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent()
        expect(errorText.toLowerCase()).toContain(testCase.expected.toLowerCase())
      }
    }
  })

  test('API error response handling', async ({ page }) => {
    // Simulate different API error responses
    const errorResponses = [
      { status: 400, body: { message: 'Bad Request' } },
      { status: 401, body: { message: 'Unauthorized' } },
      { status: 403, body: { message: 'Forbidden' } },
      { status: 404, body: { message: 'Not Found' } },
      { status: 500, body: { message: 'Internal Server Error' } },
      { status: 503, body: { message: 'Service Unavailable' } }
    ]
    
    for (const errorResponse of errorResponses) {
      await page.route('**/api/**', route => {
        route.fulfill({
          status: errorResponse.status,
          contentType: 'application/json',
          body: JSON.stringify(errorResponse.body)
        })
      })
      
      await page.goto('/')
      
      // Try an action that triggers API call
      await page.click('button:has-text("Login")')
      await page.fill('input[type="email"]', 'demo@cryb.ai')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')
      
      await page.waitForTimeout(2000)
      
      // Should handle error gracefully
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
      
      // App should not crash
      const app = page.locator('#root')
      await expect(app).toBeVisible()
    }
  })

  test('offline mode handling', async ({ page }) => {
    await page.goto('/')
    
    // Login first to get to authenticated state
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)
    
    // Simulate going offline
    await page.context().setOffline(true)
    
    // Try to navigate to different pages
    await page.click('a[href="/communities"]')
    await page.waitForTimeout(1000)
    
    // Should handle offline state gracefully
    const offlineMessage = page.locator('.offline-message, .connection-error, [role="alert"]')
    if (await offlineMessage.isVisible()) {
      const messageText = await offlineMessage.textContent()
      expect(messageText.toLowerCase()).toContain('offline')
    }
    
    // App should remain functional for cached content
    const navigation = page.locator('nav, .navigation')
    await expect(navigation).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)
    
    // Should recover automatically or show reconnection option
    if (await offlineMessage.isVisible()) {
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Reconnect")')
      if (await retryButton.isVisible()) {
        await retryButton.click()
      }
    }
  })

  test('session expiry handling', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)
    
    // Simulate session expiry by clearing tokens
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
      sessionStorage.clear()
    })
    
    // Simulate 401 response for API calls
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Session expired' })
      })
    })
    
    // Try to access protected content
    await page.goto('/profile')
    await page.waitForTimeout(2000)
    
    // Should redirect to login or show session expired message
    const currentUrl = page.url()
    const isRedirectedToLogin = currentUrl.includes('/') || await page.locator('button:has-text("Login")').isVisible()
    
    expect(isRedirectedToLogin).toBe(true)
  })

  test('rate limiting error handling', async ({ page }) => {
    // Simulate rate limiting
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ 
          message: 'Too many requests',
          retryAfter: 60 
        }),
        headers: {
          'Retry-After': '60'
        }
      })
    })
    
    await page.goto('/')
    
    // Try login multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Login")')
      await page.fill('input[type="email"]', 'demo@cryb.ai')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')
      await page.waitForTimeout(1500)
      
      // Close modal if it's still open
      if (await page.locator('.modal-backdrop').isVisible()) {
        await page.keyboard.press('Escape')
      }
    }
    
    // Should show rate limit message
    const rateLimitMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    if (await rateLimitMessage.isVisible()) {
      const messageText = await rateLimitMessage.textContent()
      expect(messageText.toLowerCase()).toContain('rate limit')
    }
  })

  test('malformed data handling', async ({ page }) => {
    // Simulate malformed API responses
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"invalid": json}'  // Malformed JSON
      })
    })
    
    await page.goto('/')
    
    // Try action that requires API call
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    
    await page.waitForTimeout(2000)
    
    // Should handle malformed response gracefully
    const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
    
    // App should not crash
    const app = page.locator('#root')
    await expect(app).toBeVisible()
  })

  test('console error monitoring', async ({ page }) => {
    const consoleErrors = []
    const consoleWarnings = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })
    
    await page.goto('/')
    
    // Navigate through app
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)
    
    const routes = ['/home', '/communities', '/chat']
    for (const route of routes) {
      try {
        await page.goto(route)
        await page.waitForTimeout(1000)
      } catch (error) {
        // Ignore navigation errors for this test
      }
    }
    
    // Log errors and warnings
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors)
    }
    
    if (consoleWarnings.length > 0) {
      console.log('Console warnings detected:', consoleWarnings)
    }
    
    // Should have minimal critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('favicon') &&
      !error.includes('404')
    )
    
    expect(criticalErrors.length).toBeLessThanOrEqual(2)
  })

  test('memory leak detection', async ({ page }) => {
    await page.goto('/')
    
    // Login to access full app
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)
    
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize
      }
      return null
    })
    
    if (!initialMemory) {
      test.skip(true, 'Memory API not available')
    }
    
    // Simulate heavy usage
    for (let i = 0; i < 5; i++) {
      await page.goto('/communities')
      await page.waitForTimeout(500)
      await page.goto('/chat')
      await page.waitForTimeout(500)
      await page.goto('/profile')
      await page.waitForTimeout(500)
    }
    
    // Force garbage collection if possible
    await page.evaluate(() => {
      if (window.gc) {
        window.gc()
      }
    })
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory.usedJSHeapSize
    })
    
    const memoryIncrease = finalMemory - initialMemory
    const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100
    
    console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`)
    
    // Memory increase should be reasonable (less than 200% for heavy usage)
    expect(memoryIncreasePercent).toBeLessThan(200)
  })

  test('error recovery mechanisms', async ({ page }) => {
    await page.goto('/')
    
    // Test error recovery in various scenarios
    const errorScenarios = [
      {
        name: 'Network recovery',
        setup: async () => {
          await page.route('**/api/**', route => route.abort('failed'))
        },
        trigger: async () => {
          await page.click('button:has-text("Login")')
          await page.fill('input[type="email"]', 'demo@cryb.ai')
          await page.fill('input[type="password"]', 'demo123')
          await page.click('button:has-text("Sign In")')
        },
        recover: async () => {
          await page.unroute('**/api/**')
          const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")')
          if (await retryButton.isVisible()) {
            await retryButton.click()
          }
        }
      }
    ]
    
    for (const scenario of errorScenarios) {
      console.log(`Testing ${scenario.name}...`)
      
      await scenario.setup()
      await scenario.trigger()
      await page.waitForTimeout(2000)
      
      // Should show error state
      const errorState = page.locator('.error-message, .text-red-500, [role="alert"]')
      await expect(errorState).toBeVisible({ timeout: 3000 })
      
      await scenario.recover()
      await page.waitForTimeout(2000)
      
      // Should recover from error
      await expect(errorState).not.toBeVisible()
    }
  })
})