import { chromium } from 'playwright'
import { performance } from 'perf_hooks'

class PerformanceAuditor {
  constructor() {
    this.results = {
      loadTimes: {},
      bundleSizes: {},
      memoryUsage: {},
      coreWebVitals: {},
      networkAnalysis: {},
      renderingMetrics: {}
    }
  }

  async runFullAudit() {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()

    console.log('🚀 Starting Performance Audit...\n')

    try {
      await this.measurePageLoadTimes(page)
      await this.analyzeBundleSizes(page)
      await this.measureMemoryUsage(page)
      await this.collectCoreWebVitals(page)
      await this.analyzeNetworkPerformance(page)
      await this.measureRenderingMetrics(page)
      await this.testComponentPerformance(page)
      
      this.generateReport()
    } catch (error) {
      console.error('Performance audit failed:', error)
    } finally {
      await browser.close()
    }
  }

  async measurePageLoadTimes(page) {
    console.log('📊 Measuring page load times...')
    
    const routes = [
      '/',
      '/home', 
      '/communities',
      '/chat',
      '/profile',
      '/settings'
    ]

    for (const route of routes) {
      const startTime = performance.now()
      
      try {
        await page.goto(`https://platform.cryb.ai${route}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        })
        
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        // Get detailed timing metrics
        const timingMetrics = await page.evaluate(() => {
          const timing = performance.timing
          const navigation = performance.getEntriesByType('navigation')[0]
          
          return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            firstContentfulPaint: navigation?.duration || 0,
            timeToInteractive: timing.domInteractive - timing.navigationStart
          }
        })
        
        this.results.loadTimes[route] = {
          totalTime: loadTime,
          ...timingMetrics
        }
        
        console.log(`  ${route}: ${loadTime.toFixed(2)}ms`)
      } catch (error) {
        console.log(`  ${route}: Failed to load (${error.message})`)
        this.results.loadTimes[route] = { error: error.message }
      }
    }
  }

  async analyzeBundleSizes(page) {
    console.log('\n📦 Analyzing bundle sizes...')
    
    const responses = []
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'] || 0
        })
      }
    })

    await page.goto('https://platform.cryb.ai/')
    await page.waitForLoadState('networkidle')

    let totalJSSize = 0
    let totalCSSSize = 0
    const assets = []

    responses.forEach(response => {
      const size = parseInt(response.size) || 0
      const fileName = response.url.split('/').pop()
      
      assets.push({
        name: fileName,
        size: size,
        type: response.url.includes('.js') ? 'JavaScript' : 'CSS'
      })

      if (response.url.includes('.js')) {
        totalJSSize += size
      } else if (response.url.includes('.css')) {
        totalCSSSize += size
      }
    })

    this.results.bundleSizes = {
      totalJS: totalJSSize,
      totalCSS: totalCSSSize,
      assets: assets.sort((a, b) => b.size - a.size)
    }

    console.log(`  Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`)
    console.log(`  Total CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`)
    console.log(`  Total Assets: ${assets.length}`)
  }

  async measureMemoryUsage(page) {
    console.log('\n🧠 Measuring memory usage...')
    
    await page.goto('https://platform.cryb.ai/')
    
    // Login to test authenticated app memory usage
    try {
      await page.click('button:has-text("Login")', { timeout: 5000 })
      await page.fill('input[type="email"]', 'demo@cryb.ai')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')
      await page.waitForTimeout(3000)
    } catch (error) {
      console.log('  Warning: Could not login for memory test')
    }

    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        }
      }
      return null
    })

    // Navigate through app to test memory leaks
    const routes = ['/home', '/communities', '/chat', '/profile']
    const memorySnapshots = []

    for (const route of routes) {
      try {
        await page.goto(`https://platform.cryb.ai${route}`)
        await page.waitForTimeout(2000)
        
        const memory = await page.evaluate(() => {
          if (performance.memory) {
            return performance.memory.usedJSHeapSize
          }
          return null
        })
        
        if (memory) {
          memorySnapshots.push({ route, memory })
        }
      } catch (error) {
        console.log(`  Memory test failed for ${route}`)
      }
    }

    this.results.memoryUsage = {
      initial: initialMemory,
      snapshots: memorySnapshots,
      potential_leak: memorySnapshots.length > 1 && 
        memorySnapshots[memorySnapshots.length - 1].memory > memorySnapshots[0].memory * 1.5
    }

    if (initialMemory) {
      console.log(`  Initial heap: ${(initialMemory.used / 1024 / 1024).toFixed(2)} MB`)
      console.log(`  Memory limit: ${(initialMemory.limit / 1024 / 1024).toFixed(2)} MB`)
    }
  }

  async collectCoreWebVitals(page) {
    console.log('\n⚡ Collecting Core Web Vitals...')
    
    await page.goto('https://platform.cryb.ai/')
    
    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        const vitals = {}
        
        // Collect FCP, LCP, FID, CLS
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              vitals.cls = (vitals.cls || 0) + entry.value
            }
          }
        }).observe({ 
          entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
        })

        // Timeout after 10 seconds
        setTimeout(() => resolve(vitals), 10000)
      })
    })

    this.results.coreWebVitals = vitals

    console.log(`  FCP: ${vitals.fcp ? vitals.fcp.toFixed(2) + 'ms' : 'Not measured'}`)
    console.log(`  LCP: ${vitals.lcp ? vitals.lcp.toFixed(2) + 'ms' : 'Not measured'}`)
    console.log(`  FID: ${vitals.fid ? vitals.fid.toFixed(2) + 'ms' : 'Not measured'}`)
    console.log(`  CLS: ${vitals.cls ? vitals.cls.toFixed(3) : 'Not measured'}`)
  }

  async analyzeNetworkPerformance(page) {
    console.log('\n🌐 Analyzing network performance...')
    
    const requests = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      })
    })

    page.on('response', response => {
      const request = requests.find(req => req.url === response.url())
      if (request) {
        request.status = response.status()
        request.size = response.headers()['content-length'] || 0
        request.timing = response.timing()
      }
    })

    await page.goto('https://platform.cryb.ai/')
    await page.waitForLoadState('networkidle')

    const analysis = {
      totalRequests: requests.length,
      failedRequests: requests.filter(req => req.status >= 400).length,
      largestRequests: requests
        .filter(req => req.size > 0)
        .sort((a, b) => b.size - a.size)
        .slice(0, 5),
      resourceTypes: {}
    }

    requests.forEach(req => {
      analysis.resourceTypes[req.resourceType] = 
        (analysis.resourceTypes[req.resourceType] || 0) + 1
    })

    this.results.networkAnalysis = analysis

    console.log(`  Total requests: ${analysis.totalRequests}`)
    console.log(`  Failed requests: ${analysis.failedRequests}`)
    console.log(`  Resource types: ${Object.keys(analysis.resourceTypes).join(', ')}`)
  }

  async measureRenderingMetrics(page) {
    console.log('\n🎨 Measuring rendering metrics...')
    
    await page.goto('https://platform.cryb.ai/')
    
    const renderingMetrics = await page.evaluate(() => {
      const observer = new PerformanceObserver((list) => {
        // Collect rendering-related metrics
      })
      
      const paintMetrics = performance.getEntriesByType('paint')
      const navigationMetrics = performance.getEntriesByType('navigation')[0]
      
      return {
        firstPaint: paintMetrics.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintMetrics.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        domComplete: navigationMetrics?.domComplete || 0,
        loadEventEnd: navigationMetrics?.loadEventEnd || 0
      }
    })

    this.results.renderingMetrics = renderingMetrics

    console.log(`  First Paint: ${renderingMetrics.firstPaint.toFixed(2)}ms`)
    console.log(`  First Contentful Paint: ${renderingMetrics.firstContentfulPaint.toFixed(2)}ms`)
    console.log(`  DOM Complete: ${renderingMetrics.domComplete.toFixed(2)}ms`)
  }

  async testComponentPerformance(page) {
    console.log('\n🔧 Testing component performance...')
    
    await page.goto('https://platform.cryb.ai/')
    
    // Test component rendering times
    const componentTests = [
      {
        name: 'Modal Opening',
        action: async () => {
          const start = performance.now()
          await page.click('button:has-text("Login")')
          await page.waitForSelector('.modal-backdrop', { timeout: 5000 })
          return performance.now() - start
        }
      },
      {
        name: 'Navigation',
        action: async () => {
          try {
            await page.fill('input[type="email"]', 'demo@cryb.ai')
            await page.fill('input[type="password"]', 'demo123')
            await page.click('button:has-text("Sign In")')
            await page.waitForTimeout(3000)
            
            const start = performance.now()
            await page.goto('https://platform.cryb.ai/communities')
            await page.waitForLoadState('networkidle')
            return performance.now() - start
          } catch (error) {
            return null
          }
        }
      }
    ]

    const componentResults = {}
    
    for (const test of componentTests) {
      try {
        const time = await test.action()
        componentResults[test.name] = time
        console.log(`  ${test.name}: ${time ? time.toFixed(2) + 'ms' : 'Failed'}`)
      } catch (error) {
        componentResults[test.name] = null
        console.log(`  ${test.name}: Failed`)
      }
    }

    this.results.componentPerformance = componentResults
  }

  generateReport() {
    console.log('\n📋 Performance Audit Report')
    console.log('=' + '='.repeat(50))
    
    // Overall Score
    let score = 100
    const issues = []

    // Check load times
    Object.entries(this.results.loadTimes).forEach(([route, metrics]) => {
      if (metrics.error) {
        score -= 10
        issues.push(`❌ ${route}: Failed to load`)
      } else if (metrics.totalTime > 3000) {
        score -= 5
        issues.push(`⚠️  ${route}: Slow load time (${metrics.totalTime.toFixed(2)}ms)`)
      }
    })

    // Check bundle sizes
    if (this.results.bundleSizes.totalJS > 1024 * 1024) { // 1MB
      score -= 10
      issues.push(`⚠️  Large JavaScript bundle: ${(this.results.bundleSizes.totalJS / 1024).toFixed(2)} KB`)
    }

    // Check Core Web Vitals
    const vitals = this.results.coreWebVitals
    if (vitals.lcp > 2500) {
      score -= 15
      issues.push(`❌ Poor LCP: ${vitals.lcp.toFixed(2)}ms (should be < 2500ms)`)
    }
    if (vitals.fid > 100) {
      score -= 10
      issues.push(`❌ Poor FID: ${vitals.fid.toFixed(2)}ms (should be < 100ms)`)
    }
    if (vitals.cls > 0.1) {
      score -= 10
      issues.push(`❌ Poor CLS: ${vitals.cls.toFixed(3)} (should be < 0.1)`)
    }

    // Check memory usage
    if (this.results.memoryUsage.potential_leak) {
      score -= 20
      issues.push(`❌ Potential memory leak detected`)
    }

    console.log(`\n🎯 Overall Performance Score: ${Math.max(0, score)}/100`)
    
    if (issues.length > 0) {
      console.log(`\n🚨 Issues Found:`)
      issues.forEach(issue => console.log(`  ${issue}`))
    } else {
      console.log(`\n✅ No major performance issues detected!`)
    }

    // Detailed metrics
    console.log(`\n📊 Detailed Metrics:`)
    console.log(`  Load Times:`, JSON.stringify(this.results.loadTimes, null, 2))
    console.log(`  Bundle Sizes:`, JSON.stringify(this.results.bundleSizes, null, 2))
    console.log(`  Core Web Vitals:`, JSON.stringify(this.results.coreWebVitals, null, 2))
    console.log(`  Memory Usage:`, JSON.stringify(this.results.memoryUsage, null, 2))

    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (score < 80) {
      console.log(`  - Consider code splitting for large bundles`)
      console.log(`  - Implement lazy loading for components`)
      console.log(`  - Optimize images and assets`)
      console.log(`  - Review and optimize API calls`)
      console.log(`  - Consider caching strategies`)
    } else {
      console.log(`  - Performance is good! Consider minor optimizations`)
      console.log(`  - Monitor Core Web Vitals regularly`)
      console.log(`  - Consider implementing performance budgets`)
    }

    return { score, issues, results: this.results }
  }
}

// Run performance audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new PerformanceAuditor()
  auditor.runFullAudit().catch(console.error)
}

export default PerformanceAuditor