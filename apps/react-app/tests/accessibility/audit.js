/**
 * Accessibility Audit Script
 * Automated accessibility testing with detailed reporting
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import pa11y from 'pa11y';
import fs from 'fs';
import path from 'path';

class AccessibilityAuditor {
  constructor(baseURL = 'https://platform.cryb.ai') {
    this.baseURL = baseURL;
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      baseURL,
      pages: [],
      summary: {
        totalPages: 0,
        totalViolations: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        wcagLevelAA: { passed: 0, failed: 0 },
        wcagLevel21AA: { passed: 0, failed: 0 }
      }
    };
  }

  async runFullAudit() {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()

    console.log('♿ Starting Accessibility Audit...\n')

    try {
      await this.auditLandingPage(page)
      await this.auditAuthenticatedPages(page)
      await this.testKeyboardNavigation(page)
      await this.testScreenReaderCompatibility(page)
      await this.testColorContrast(page)
      await this.testFocusManagement(page)
      
      this.generateReport()
    } catch (error) {
      console.error('Accessibility audit failed:', error)
    } finally {
      await browser.close()
    }
  }

  async auditLandingPage(page) {
    console.log('🏠 Auditing landing page...')
    
    await page.goto('https://platform.cryb.ai/')
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    this.results.pages['/'] = {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete
    }
    
    console.log(`  Violations: ${results.violations.length}`)
    console.log(`  Passes: ${results.passes.length}`)
    
    if (results.violations.length > 0) {
      console.log('  Issues found:')
      results.violations.forEach(violation => {
        console.log(`    - ${violation.id}: ${violation.description}`)
      })
    }
  }

  async auditAuthenticatedPages(page) {
    console.log('\n🔐 Auditing authenticated pages...')
    
    // Login first
    try {
      await page.goto('https://platform.cryb.ai/')
      await page.click('button:has-text("Login")')
      await page.fill('input[type="email"]', 'demo@cryb.ai')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')
      await page.waitForTimeout(3000)
    } catch (error) {
      console.log('  Warning: Could not login, skipping authenticated pages')
      return
    }

    const routes = ['/home', '/communities', '/chat', '/profile', '/settings']
    
    for (const route of routes) {
      try {
        await page.goto(`https://platform.cryb.ai${route}`)
        await page.waitForLoadState('domcontentloaded')
        
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
        
        this.results.pages[route] = {
          violations: results.violations,
          passes: results.passes,
          incomplete: results.incomplete
        }
        
        console.log(`  ${route}: ${results.violations.length} violations, ${results.passes.length} passes`)
        
        if (results.violations.length > 0) {
          results.violations.forEach(violation => {
            console.log(`    - ${violation.id}: ${violation.description}`)
          })
        }
      } catch (error) {
        console.log(`  ${route}: Failed to audit (${error.message})`)
        this.results.pages[route] = { error: error.message }
      }
    }
  }

  async testKeyboardNavigation(page) {
    console.log('\n⌨️  Testing keyboard navigation...')
    
    await page.goto('https://platform.cryb.ai/')
    
    // Test tab navigation
    const focusableElements = []
    
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          text: el.textContent?.slice(0, 30),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label')
        }
      })
      
      if (focusedElement.tagName !== 'BODY') {
        focusableElements.push(focusedElement)
      }
    }
    
    console.log(`  Found ${focusableElements.length} focusable elements`)
    
    // Test skip link
    await page.keyboard.press('Tab')
    const skipLinkVisible = await page.locator('a:has-text("Skip to main content")').isVisible()
    if (skipLinkVisible) {
      console.log('  ✅ Skip link found')
    } else {
      console.log('  ⚠️  Skip link not found')
      this.results.overall.issues.push('Missing skip link')
    }
    
    // Test modal keyboard trap
    try {
      await page.click('button:has-text("Login")')
      await page.keyboard.press('Tab')
      
      const focusTrapped = await page.evaluate(() => {
        const modal = document.querySelector('.modal-backdrop, .auth-modal')
        const focused = document.activeElement
        return modal?.contains(focused) || false
      })
      
      if (focusTrapped) {
        console.log('  ✅ Modal focus trap working')
      } else {
        console.log('  ⚠️  Modal focus trap not working')
        this.results.overall.issues.push('Modal focus not trapped')
      }
      
      await page.keyboard.press('Escape')
    } catch (error) {
      console.log('  Could not test modal focus trap')
    }
  }

  async testScreenReaderCompatibility(page) {
    console.log('\n👀 Testing screen reader compatibility...')
    
    await page.goto('https://platform.cryb.ai/')
    
    // Check for semantic HTML
    const semanticElements = await page.evaluate(() => {
      const semantic = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer']
      const found = {}
      
      semantic.forEach(tag => {
        found[tag] = document.querySelectorAll(tag).length
      })
      
      return found
    })
    
    console.log('  Semantic elements found:', semanticElements)
    
    if (semanticElements.main === 0) {
      this.results.overall.issues.push('No <main> element found')
    }
    
    // Check heading structure
    const headings = await page.evaluate(() => {
      const headingSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      const headings = []
      
      headingSelectors.forEach(selector => {
        const elements = Array.from(document.querySelectorAll(selector))
        elements.forEach(el => {
          headings.push({
            level: parseInt(selector.substring(1)),
            text: el.textContent?.trim()
          })
        })
      })
      
      return headings
    })
    
    const h1Count = headings.filter(h => h.level === 1).length
    console.log(`  Headings: ${headings.length} total, ${h1Count} h1 elements`)
    
    if (h1Count === 0) {
      this.results.overall.issues.push('No h1 heading found')
    } else if (h1Count > 1) {
      this.results.overall.issues.push('Multiple h1 headings found')
    }
    
    // Check ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region']
      const found = {}
      
      landmarkRoles.forEach(role => {
        found[role] = document.querySelectorAll(`[role="${role}"]`).length
      })
      
      // Also check semantic equivalents
      found.banner += document.querySelectorAll('header').length
      found.navigation += document.querySelectorAll('nav').length
      found.main += document.querySelectorAll('main').length
      found.contentinfo += document.querySelectorAll('footer').length
      
      return found
    })
    
    console.log('  ARIA landmarks:', landmarks)
    
    if (landmarks.main === 0) {
      this.results.overall.issues.push('No main landmark found')
    }
  }

  async testColorContrast(page) {
    console.log('\n🎨 Testing color contrast...')
    
    await page.goto('https://platform.cryb.ai/')
    
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze()
    
    console.log(`  Color contrast violations: ${contrastResults.violations.length}`)
    
    if (contrastResults.violations.length > 0) {
      contrastResults.violations.forEach(violation => {
        console.log(`    - ${violation.help}`)
        this.results.overall.issues.push(`Color contrast: ${violation.help}`)
      })
    }
    
    // Test in dark mode if available
    try {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.reload()
      
      const darkModeResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze()
      
      console.log(`  Dark mode contrast violations: ${darkModeResults.violations.length}`)
    } catch (error) {
      console.log('  Could not test dark mode contrast')
    }
  }

  async testFocusManagement(page) {
    console.log('\n🎯 Testing focus management...')
    
    await page.goto('https://platform.cryb.ai/')
    
    // Test focus indicators
    const focusIndicatorTest = await page.evaluate(() => {
      const focusableElements = Array.from(document.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).slice(0, 5)
      
      const results = []
      
      focusableElements.forEach(el => {
        el.focus()
        const styles = window.getComputedStyle(el, ':focus')
        const hasFocusIndicator = styles.outline !== 'none' || 
                                 styles.boxShadow !== 'none' ||
                                 styles.border.includes('px')
        
        results.push({
          tagName: el.tagName,
          hasFocusIndicator
        })
      })
      
      return results
    })
    
    const elementsWithoutFocus = focusIndicatorTest.filter(el => !el.hasFocusIndicator)
    
    console.log(`  Elements tested: ${focusIndicatorTest.length}`)
    console.log(`  Elements without focus indicators: ${elementsWithoutFocus.length}`)
    
    if (elementsWithoutFocus.length > 0) {
      this.results.overall.issues.push(`${elementsWithoutFocus.length} elements lack focus indicators`)
    }
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    const respectsReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    
    if (respectsReducedMotion) {
      console.log('  ✅ Reduced motion preference detected')
    } else {
      console.log('  ⚠️  Reduced motion preference not detected')
    }
  }

  generateReport() {
    console.log('\n📋 Accessibility Audit Report')
    console.log('=' + '='.repeat(50))
    
    // Calculate overall score
    let totalViolations = 0
    let totalPasses = 0
    let totalPages = 0
    
    Object.entries(this.results.pages).forEach(([route, results]) => {
      if (!results.error) {
        totalViolations += results.violations.length
        totalPasses += results.passes.length
        totalPages++
      }
    })
    
    const score = totalPages > 0 ? Math.max(0, 100 - (totalViolations * 5)) : 0
    
    console.log(`\n♿ Overall Accessibility Score: ${score}/100`)
    console.log(`📊 Summary:`)
    console.log(`  - Pages audited: ${totalPages}`)
    console.log(`  - Total violations: ${totalViolations}`)
    console.log(`  - Total passes: ${totalPasses}`)
    console.log(`  - Issues found: ${this.results.overall.issues.length}`)
    
    if (this.results.overall.issues.length > 0) {
      console.log(`\n🚨 Issues Found:`)
      this.results.overall.issues.forEach(issue => {
        console.log(`  - ${issue}`)
      })
    }
    
    // Page-by-page breakdown
    console.log(`\n📄 Page-by-Page Results:`)
    Object.entries(this.results.pages).forEach(([route, results]) => {
      if (results.error) {
        console.log(`  ${route}: Error - ${results.error}`)
      } else {
        console.log(`  ${route}: ${results.violations.length} violations, ${results.passes.length} passes`)
        
        if (results.violations.length > 0) {
          results.violations.forEach(violation => {
            console.log(`    ❌ ${violation.id}: ${violation.description}`)
          })
        }
      }
    })
    
    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (score >= 90) {
      console.log(`  - Excellent accessibility! Continue monitoring`)
      console.log(`  - Consider user testing with assistive technologies`)
      console.log(`  - Regular accessibility audits recommended`)
    } else if (score >= 70) {
      console.log(`  - Good foundation, but improvements needed`)
      console.log(`  - Focus on fixing WCAG AA violations`)
      console.log(`  - Improve keyboard navigation`)
      console.log(`  - Enhance focus management`)
    } else {
      console.log(`  - Significant accessibility improvements required`)
      console.log(`  - Fix critical WCAG violations immediately`)
      console.log(`  - Implement proper semantic HTML`)
      console.log(`  - Add missing ARIA labels and landmarks`)
      console.log(`  - Ensure keyboard accessibility`)
      console.log(`  - Fix color contrast issues`)
    }
    
    // WCAG compliance level
    const criticalViolations = totalViolations
    let complianceLevel = 'None'
    
    if (criticalViolations === 0) {
      complianceLevel = 'WCAG 2.1 AA'
    } else if (criticalViolations < 5) {
      complianceLevel = 'Near WCAG 2.1 AA'
    } else if (criticalViolations < 10) {
      complianceLevel = 'Partial WCAG 2.1 A'
    }
    
    console.log(`\n🏆 WCAG Compliance Level: ${complianceLevel}`)
    
    return { score, issues: this.results.overall.issues, results: this.results }
  }
}

// Run accessibility audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new AccessibilityAuditor()
  auditor.runFullAudit().catch(console.error)
}

export default AccessibilityAuditor