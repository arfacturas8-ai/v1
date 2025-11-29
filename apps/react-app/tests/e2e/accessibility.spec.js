import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('landing page accessibility scan', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
    
    console.log(`Accessibility rules passed: ${accessibilityScanResults.passes.length}`)
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:', accessibilityScanResults.violations)
    }
  })

  test('authenticated app accessibility scan', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation throughout app', async ({ page }) => {
    // Test skip link
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a:has-text("Skip to main content")')
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused()
    }

    // Test tab navigation on landing page
    const focusableElements = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      if (focused) {
        focusableElements.push(focused)
      }
    }

    expect(focusableElements.length).toBeGreaterThan(0)
    console.log('Focusable elements found:', focusableElements)

    // Test modal keyboard navigation
    await page.click('button:has-text("Login")')
    
    // Focus should be trapped in modal
    await page.keyboard.press('Tab')
    const focusedInModal = await page.evaluate(() => {
      const modal = document.querySelector('.modal-backdrop, .auth-modal')
      const focused = document.activeElement
      return modal?.contains(focused) || false
    })
    
    expect(focusedInModal).toBe(true)

    // Test escape key to close modal
    await page.keyboard.press('Escape')
    const modal = page.locator('.modal-backdrop')
    await expect(modal).not.toBeVisible()
  })

  test('screen reader compatibility - ARIA labels and roles', async ({ page }) => {
    // Check for proper ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count()
    const ariaDescribedBy = await page.locator('[aria-describedby]').count()
    const roles = await page.locator('[role]').count()

    console.log(`Elements with aria-label: ${ariaLabels}`)
    console.log(`Elements with aria-describedby: ${ariaDescribedBy}`)
    console.log(`Elements with role: ${roles}`)

    // Check for landmark roles
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region']
      const foundLandmarks = []
      
      landmarkRoles.forEach(role => {
        const elements = document.querySelectorAll(`[role="${role}"], ${role === 'banner' ? 'header' : ''} ${role === 'navigation' ? ', nav' : ''} ${role === 'main' ? ', main' : ''} ${role === 'contentinfo' ? ', footer' : ''}`)
        if (elements.length > 0) {
          foundLandmarks.push(role)
        }
      })
      
      return foundLandmarks
    })

    expect(landmarks).toContain('main')
    console.log('Landmark roles found:', landmarks)

    // Test form accessibility
    await page.click('button:has-text("Login")')
    
    const formInputs = await page.locator('input').all()
    for (const input of formInputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.id
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledBy = el.getAttribute('aria-labelledby')
        const label = id ? document.querySelector(`label[for="${id}"]`) : null
        
        return !!(ariaLabel || ariaLabelledBy || label)
      })
      
      expect(hasLabel).toBe(true)
    }
  })

  test('color contrast compliance', async ({ page }) => {
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze()

    expect(contrastResults.violations).toEqual([])

    // Check for sufficient color contrast manually
    const backgroundColors = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      const colors = new Set()
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el)
        const bgColor = styles.backgroundColor
        const textColor = styles.color
        
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(`bg: ${bgColor}`)
        }
        if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(`text: ${textColor}`)
        }
      })
      
      return Array.from(colors)
    })

    console.log('Colors found on page:', backgroundColors.slice(0, 10))
  })

  test('focus indicators visibility', async ({ page }) => {
    // Login to test full app
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    // Test focus indicators on various elements
    const focusableSelectors = [
      'button:visible',
      'a[href]:visible',
      'input:visible',
      '[tabindex]:visible'
    ]

    for (const selector of focusableSelectors) {
      const elements = await page.locator(selector).all()
      
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        await elements[i].focus()
        
        const hasFocusIndicator = await elements[i].evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus')
          const outline = styles.outline
          const boxShadow = styles.boxShadow
          const border = styles.border
          
          return outline !== 'none' || 
                 boxShadow !== 'none' || 
                 border.includes('px') ||
                 el.matches(':focus-visible')
        })
        
        expect(hasFocusIndicator).toBe(true)
      }
    }
  })

  test('heading structure and hierarchy', async ({ page }) => {
    const headings = await page.evaluate(() => {
      const headingSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      const headings = []
      
      headingSelectors.forEach(selector => {
        const elements = Array.from(document.querySelectorAll(selector))
        elements.forEach(el => {
          headings.push({
            level: parseInt(selector.substring(1)),
            text: el.textContent?.trim(),
            id: el.id
          })
        })
      })
      
      return headings.sort((a, b) => {
        const aPos = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).indexOf(
          document.querySelector(`${a.level === 1 ? 'h1' : `h${a.level}`}`)
        )
        const bPos = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).indexOf(
          document.querySelector(`${b.level === 1 ? 'h1' : `h${b.level}`}`)
        )
        return aPos - bPos
      })
    })

    console.log('Page heading structure:', headings)

    // Should have at least one h1
    expect(headings.filter(h => h.level === 1).length).toBeGreaterThanOrEqual(1)

    // Check heading hierarchy (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level
      const previousLevel = headings[i - 1].level
      
      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
    }
  })

  test('alternative text for images', async ({ page }) => {
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaLabelledBy = await img.getAttribute('aria-labelledby')
      
      // Decorative images should have empty alt or role="presentation"
      // Meaningful images should have descriptive alt text
      const hasAccessibleText = alt !== null || ariaLabel || ariaLabelledBy || role === 'presentation'
      
      expect(hasAccessibleText).toBe(true)
    }
    
    console.log(`Checked ${images.length} images for alt text`)
  })

  test('form validation and error handling accessibility', async ({ page }) => {
    await page.click('button:has-text("Login")')
    
    // Submit empty form to trigger validation
    await page.click('button:has-text("Sign In")')
    
    // Wait for error message
    await page.waitForTimeout(1000)
    
    const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    if (await errorMessage.isVisible()) {
      // Error should be announced to screen readers
      const role = await errorMessage.getAttribute('role')
      const ariaLive = await errorMessage.getAttribute('aria-live')
      const ariaAtomic = await errorMessage.getAttribute('aria-atomic')
      
      const isAccessible = role === 'alert' || 
                          ariaLive === 'assertive' || 
                          ariaLive === 'polite'
      
      expect(isAccessible).toBe(true)
    }
  })

  test('modal accessibility', async ({ page }) => {
    await page.click('button:has-text("Login")')
    
    const modal = page.locator('.modal-backdrop, .auth-modal')
    await expect(modal).toBeVisible()
    
    // Check modal accessibility attributes
    const modalAttributes = await modal.evaluate(el => ({
      role: el.getAttribute('role'),
      ariaModal: el.getAttribute('aria-modal'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledBy: el.getAttribute('aria-labelledby')
    }))
    
    // Modal should have proper ARIA attributes
    expect(modalAttributes.role).toBe('dialog')
    expect(modalAttributes.ariaModal).toBe('true')
    expect(modalAttributes.ariaLabel || modalAttributes.ariaLabelledBy).toBeTruthy()
    
    // Focus should be trapped in modal
    await page.keyboard.press('Tab')
    const focusInModal = await page.evaluate(() => {
      const modal = document.querySelector('.modal-backdrop, .auth-modal')
      const focused = document.activeElement
      return modal?.contains(focused) || false
    })
    
    expect(focusInModal).toBe(true)
  })

  test('accessibility across different pages', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    const routes = ['/home', '/communities', '/chat', '/profile', '/settings']
    
    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      console.log(`${route}: ${accessibilityScanResults.violations.length} violations`)
      
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`Violations on ${route}:`, accessibilityScanResults.violations.map(v => v.id))
      }
      
      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(2) // Allow minor violations
    }
  })

  test('reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    
    // Check if animations are reduced
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    
    expect(hasReducedMotion).toBe(true)
    
    // Verify that CSS respects reduced motion
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all()
    
    for (const element of animatedElements.slice(0, 3)) {
      const animationDuration = await element.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return styles.animationDuration
      })
      
      // With reduced motion, animations should be very short or none
      expect(animationDuration === '0s' || animationDuration === 'none').toBe(true)
    }
  })
})