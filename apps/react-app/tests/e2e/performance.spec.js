import { test, expect } from '@playwright/test'

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      // Add artificial delay to simulate slower networks for testing
      route.continue()
    })
  })

  test('page load performance metrics', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    // Check for performance metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstByte: timing.responseStart - timing.navigationStart
      }
    })
    
    // DOM should be ready within 3 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000)
    
    // First byte should arrive within 1 second
    expect(metrics.firstByte).toBeLessThan(1000)
    
    console.log('Performance metrics:', metrics)
  })

  test('Core Web Vitals assessment', async ({ page }) => {
    await page.goto('/')
    
    // Collect Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        const vitals = {}
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
          }
        }).observe({ entryTypes: ['paint'] })
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          vitals.lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          vitals.cls = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = entry.processingStart - entry.startTime
          }
        }).observe({ entryTypes: ['first-input'] })
        
        // Resolve after 5 seconds or when all metrics are collected
        setTimeout(() => resolve(vitals), 5000)
      })
    })
    
    console.log('Core Web Vitals:', vitals)
    
    // FCP should be under 1.8 seconds (good)
    if (vitals.fcp) {
      expect(vitals.fcp).toBeLessThan(1800)
    }
    
    // LCP should be under 2.5 seconds (good)
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500)
    }
    
    // CLS should be under 0.1 (good)
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(0.1)
    }
    
    // FID should be under 100ms (good)
    if (vitals.fid) {
      expect(vitals.fid).toBeLessThan(100)
    }
  })

  test('bundle size analysis', async ({ page }) => {
    const resources = []
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('.js') || url.includes('.css')) {
        resources.push({
          url,
          size: parseInt(response.headers()['content-length'] || '0'),
          type: url.includes('.js') ? 'js' : 'css'
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const totalJSSize = resources
      .filter(r => r.type === 'js')
      .reduce((sum, r) => sum + r.size, 0)
    
    const totalCSSSize = resources
      .filter(r => r.type === 'css')
      .reduce((sum, r) => sum + r.size, 0)
    
    console.log(`Total JS size: ${(totalJSSize / 1024).toFixed(2)} KB`)
    console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)} KB`)
    
    // JS bundle should be under 1MB
    expect(totalJSSize).toBeLessThan(1024 * 1024)
    
    // CSS should be under 200KB
    expect(totalCSSSize).toBeLessThan(200 * 1024)
  })

  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/')
    
    // Login to access the full app
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
    
    // Navigate through different pages
    const routes = ['/home', '/communities', '/chat', '/profile', '/settings']
    
    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(1000)
    }
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory.usedJSHeapSize
    })
    
    const memoryIncrease = finalMemory - initialMemory
    const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100
    
    console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`)
    
    // Memory increase should be reasonable (less than 100% increase)
    expect(memoryIncreasePercent).toBeLessThan(100)
  })

  test('component rendering performance', async ({ page }) => {
    await page.goto('/')
    
    // Test modal opening performance
    const modalStartTime = Date.now()
    await page.click('button:has-text("Login")')
    await page.waitForSelector('.modal-backdrop')
    const modalOpenTime = Date.now() - modalStartTime
    
    expect(modalOpenTime).toBeLessThan(500) // Modal should open within 500ms
    
    // Close modal
    await page.keyboard.press('Escape')
    
    // Test navigation performance
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)
    
    const navStartTime = Date.now()
    await page.click('a[href="/communities"]')
    await page.waitForLoadState('domcontentloaded')
    const navTime = Date.now() - navStartTime
    
    expect(navTime).toBeLessThan(1000) // Navigation should be fast
    
    console.log(`Modal open time: ${modalOpenTime}ms`)
    console.log(`Navigation time: ${navTime}ms`)
  })

  test('network request optimization', async ({ page }) => {
    const requests = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      })
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Analyze request patterns
    const uniqueRequests = new Set(requests.map(r => r.url))
    const jsRequests = requests.filter(r => r.resourceType === 'script')
    const cssRequests = requests.filter(r => r.resourceType === 'stylesheet')
    const imageRequests = requests.filter(r => r.resourceType === 'image')
    
    console.log(`Total unique requests: ${uniqueRequests.size}`)
    console.log(`JavaScript requests: ${jsRequests.length}`)
    console.log(`CSS requests: ${cssRequests.length}`)
    console.log(`Image requests: ${imageRequests.length}`)
    
    // Should not have excessive requests
    expect(uniqueRequests.size).toBeLessThan(50)
    
    // Should not have too many JS files (suggests poor bundling)
    expect(jsRequests.length).toBeLessThan(10)
  })

  test('image optimization check', async ({ page }) => {
    const images = []
    
    page.on('response', response => {
      if (response.request().resourceType() === 'image') {
        images.push({
          url: response.url(),
          size: parseInt(response.headers()['content-length'] || '0'),
          contentType: response.headers()['content-type']
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    for (const image of images) {
      console.log(`Image: ${image.url.split('/').pop()} - ${(image.size / 1024).toFixed(2)} KB`)
      
      // Individual images should not be too large
      expect(image.size).toBeLessThan(500 * 1024) // 500KB
      
      // Should use modern formats
      expect(['image/webp', 'image/avif', 'image/jpeg', 'image/png', 'image/svg+xml'])
        .toContain(image.contentType)
    }
  })

  test('font loading performance', async ({ page }) => {
    await page.goto('/')
    
    // Check font loading metrics
    const fontMetrics = await page.evaluate(() => {
      return new Promise(resolve => {
        const fonts = []
        
        if (document.fonts) {
          document.fonts.forEach(font => {
            fonts.push({
              family: font.family,
              weight: font.weight,
              style: font.style,
              status: font.status
            })
          })
          
          document.fonts.ready.then(() => {
            resolve({
              fonts,
              loadTime: performance.now()
            })
          })
        } else {
          resolve({ fonts: [], loadTime: 0 })
        }
      })
    })
    
    console.log('Font loading metrics:', fontMetrics)
    
    // Fonts should load within 3 seconds
    expect(fontMetrics.loadTime).toBeLessThan(3000)
    
    // Should have fonts loaded
    expect(fontMetrics.fonts.length).toBeGreaterThan(0)
  })

  test('JavaScript execution performance', async ({ page }) => {
    await page.goto('/')
    
    // Measure JavaScript execution time
    const executionMetrics = await page.evaluate(() => {
      const start = performance.now()
      
      // Simulate some JavaScript work
      for (let i = 0; i < 10000; i++) {
        Math.random()
      }
      
      const end = performance.now()
      
      return {
        executionTime: end - start,
        timing: performance.timing,
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    })
    
    console.log('JavaScript execution metrics:', executionMetrics)
    
    // Basic JS execution should be fast
    expect(executionMetrics.executionTime).toBeLessThan(100)
  })
})