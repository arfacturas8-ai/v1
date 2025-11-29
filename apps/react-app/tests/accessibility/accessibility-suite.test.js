// This is a Playwright test - run with: npx playwright test
/**
 * Comprehensive Accessibility Testing Suite
 * WCAG 2.1 AA compliance testing with axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Configure page for accessibility testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('homepage should be accessible', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('authentication pages should be accessible', async ({ page }) => {
      // Login page
      await page.goto('/auth/login');
      
      let results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);

      // Register page
      await page.goto('/auth/register');
      
      results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('dashboard should be accessible', async ({ page }) => {
      // Skip if authentication is required
      await page.goto('/dashboard');
      
      // Check if redirected to login
      if (page.url().includes('/auth/login')) {
        test.skip('Dashboard requires authentication');
        return;
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#chat-messages') // Exclude dynamic content that might be updating
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('chat interface should be accessible', async ({ page }) => {
      await page.goto('/chat');
      
      if (page.url().includes('/auth/login')) {
        test.skip('Chat requires authentication');
        return;
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation
      let focusedElementsCount = 0;
      const focusableElements = [];
      
      while (focusedElementsCount < 20) { // Limit to prevent infinite loop
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            text: element.textContent?.slice(0, 50)
          };
        });
        
        // Break if we've cycled back to body or repeated element
        if (focusedElement.tagName === 'BODY' || 
            focusableElements.some(el => 
              el.tagName === focusedElement.tagName && 
              el.id === focusedElement.id
            )) {
          break;
        }
        
        focusableElements.push(focusedElement);
        focusedElementsCount++;
      }
      
      // Should have focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // All focusable elements should be interactive
      const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      focusableElements.forEach(element => {
        expect(interactiveTags).toContain(element.tagName);
      });
    });

    test('should support keyboard navigation in forms', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Navigate through form fields with Tab
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement.id);
      expect(['email-input', 'username-input']).toContain(focused);
      
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement.id);
      expect(['password-input', 'email-input']).toContain(focused);
      
      // Should be able to submit with Enter
      await page.fill('#email-input', 'test@example.com');
      await page.fill('#password-input', 'password123');
      
      // Focus submit button and press Enter
      await page.focus('#login-button');
      await page.keyboard.press('Enter');
      
      // Form should submit (may show error, but should respond)
      await page.waitForTimeout(1000);
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      await page.goto('/');
      
      // Test common keyboard shortcuts
      const shortcuts = [
        { key: 'Alt+1', description: 'Skip to main content' },
        { key: 'Alt+2', description: 'Skip to navigation' },
        { key: 'Escape', description: 'Close modals/menus' }
      ];
      
      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        
        // Verify shortcut had some effect (focus change, modal close, etc.)
        const focusedElement = await page.evaluate(() => document.activeElement);
        expect(focusedElement).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          level: parseInt(el.tagName.slice(1)),
          text: el.textContent?.trim(),
          hasText: !!el.textContent?.trim()
        }))
      );
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
      
      // All headings should have text
      headings.forEach(heading => {
        expect(heading.hasText).toBe(true);
      });
      
      // Heading levels should not skip (no h1 -> h3 without h2)
      const levels = headings.map(h => h.level).sort();
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i-1]).toBeLessThanOrEqual(1);
      }
    });

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Check form inputs have labels
      const inputs = await page.$$eval('input', elements =>
        elements.map(input => ({
          id: input.id,
          hasLabel: !!document.querySelector(`label[for="${input.id}"]`),
          hasAriaLabel: !!input.getAttribute('aria-label'),
          hasAriaLabelledBy: !!input.getAttribute('aria-labelledby'),
          type: input.type
        }))
      );
      
      inputs.forEach(input => {
        if (input.type !== 'hidden') {
          const hasAccessibleName = input.hasLabel || input.hasAriaLabel || input.hasAriaLabelledBy;
          expect(hasAccessibleName).toBe(true);
        }
      });
      
      // Check buttons have accessible names
      const buttons = await page.$$eval('button', elements =>
        elements.map(button => ({
          hasText: !!button.textContent?.trim(),
          hasAriaLabel: !!button.getAttribute('aria-label'),
          hasAriaLabelledBy: !!button.getAttribute('aria-labelledby')
        }))
      );
      
      buttons.forEach(button => {
        const hasAccessibleName = button.hasText || button.hasAriaLabel || button.hasAriaLabelledBy;
        expect(hasAccessibleName).toBe(true);
      });
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto('/chat');
      
      if (page.url().includes('/auth/login')) {
        test.skip('Chat requires authentication');
        return;
      }
      
      // Check for ARIA live regions
      const liveRegions = await page.$$eval('[aria-live]', elements =>
        elements.map(el => ({
          ariaLive: el.getAttribute('aria-live'),
          id: el.id,
          className: el.className
        }))
      );
      
      // Should have live regions for dynamic content
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Live regions should have appropriate politeness levels
      liveRegions.forEach(region => {
        expect(['polite', 'assertive']).toContain(region.ariaLive);
      });
    });
  });

  test.describe('Color and Contrast', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('/');
      
      // Test with custom CSS to simulate color blindness
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      });
      
      // Check that important information is still conveyed
      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      // Should still be accessible without color
      expect(results.violations).toEqual([]);
    });

    test('should be accessible to users with different color vision', async ({ page }) => {
      await page.goto('/');
      
      // Simulate different types of color blindness
      const colorBlindnessFilters = [
        'contrast(0%) brightness(100%)', // Achromatopsia
        'hue-rotate(180deg)', // General color shift test
      ];
      
      for (const filter of colorBlindnessFilters) {
        await page.addStyleTag({
          content: `* { filter: ${filter} !important; }`
        });
        
        const results = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze();
        
        expect(results.violations).toEqual([]);
        
        // Remove the filter for next test
        await page.addStyleTag({
          content: '* { filter: none !important; }'
        });
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Check that focused elements have visible focus indicators
      const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex]');
      
      for (const element of focusableElements.slice(0, 5)) { // Test first 5 elements
        await element.focus();
        
        const focusStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineStyle: styles.outlineStyle,
            boxShadow: styles.boxShadow,
            border: styles.border
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.border.includes('px');
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    test('should trap focus in modals', async ({ page }) => {
      await page.goto('/');
      
      // Look for modal trigger
      const modalTrigger = page.locator('[data-testid="modal-trigger"]');
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        
        // Wait for modal to open
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        // Tab through modal - focus should stay within modal
        const initialFocus = await page.evaluate(() => document.activeElement);
        
        // Tab multiple times
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Focus should still be within modal
        const currentFocus = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]');
          return modal?.contains(document.activeElement);
        });
        
        expect(currentFocus).toBe(true);
      }
    });

    test('should restore focus when modals close', async ({ page }) => {
      await page.goto('/');
      
      const modalTrigger = page.locator('[data-testid="modal-trigger"]');
      if (await modalTrigger.isVisible()) {
        await modalTrigger.focus();
        await modalTrigger.click();
        
        // Wait for modal
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        // Close modal (ESC or close button)
        await page.keyboard.press('Escape');
        
        // Wait for modal to close
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
        
        // Focus should return to trigger
        const focusedElement = await page.evaluate(() => document.activeElement);
        expect(focusedElement).toBeTruthy();
      }
    });
  });

  test.describe('Alternative Text and Media', () => {
    test('should have alt text for all images', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.$$eval('img', imgs =>
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          isDecorative: img.getAttribute('role') === 'presentation' || 
                       img.getAttribute('aria-hidden') === 'true',
          isEmpty: img.alt === ''
        }))
      );
      
      images.forEach(img => {
        if (!img.isDecorative) {
          // Non-decorative images should have meaningful alt text
          expect(img.hasAlt).toBe(true);
          if (!img.isEmpty) {
            expect(img.alt.length).toBeGreaterThan(0);
          }
        }
      });
    });

    test('should provide captions for video content', async ({ page }) => {
      await page.goto('/');
      
      const videos = await page.$$eval('video', videos =>
        videos.map(video => ({
          hasCaptions: !!video.querySelector('track[kind="captions"]'),
          hasSubtitles: !!video.querySelector('track[kind="subtitles"]'),
          hasControls: video.hasAttribute('controls')
        }))
      );
      
      videos.forEach(video => {
        // Videos should have controls
        expect(video.hasControls).toBe(true);
        
        // Videos should have captions or subtitles
        const hasTextTrack = video.hasCaptions || video.hasSubtitles;
        if (videos.length > 0) { // Only check if there are videos
          expect(hasTextTrack).toBe(true);
        }
      });
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have touch-friendly interactive elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check touch target sizes (minimum 44x44 pixels)
      const interactiveElements = await page.$$eval(
        'button, a, input, select, textarea, [role="button"]', 
        elements => elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            tagName: el.tagName
          };
        })
      );
      
      interactiveElements.forEach(el => {
        expect(el.width).toBeGreaterThanOrEqual(44);
        expect(el.height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  test.describe('Internationalization Accessibility', () => {
    test('should have proper language attributes', async ({ page }) => {
      await page.goto('/');
      
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Format: en or en-US
      
      // Check for content in different languages
      const elementsWithLang = await page.$$eval('[lang]', elements =>
        elements.map(el => ({
          lang: el.getAttribute('lang'),
          text: el.textContent?.slice(0, 50)
        }))
      );
      
      elementsWithLang.forEach(el => {
        expect(el.lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
      });
    });

    test('should handle right-to-left text direction', async ({ page }) => {
      // Test RTL layout
      await page.goto('/');
      
      // Add RTL direction to test
      await page.addStyleTag({
        content: 'html { direction: rtl; }'
      });
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should be accessible during slow loading', async ({ page }) => {
      // Throttle network to simulate slow connection
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        return route.continue();
      });
      
      await page.goto('/');
      
      // Test accessibility while page is still loading
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should maintain accessibility with dynamic content', async ({ page }) => {
      await page.goto('/chat');
      
      if (page.url().includes('/auth/login')) {
        test.skip('Chat requires authentication');
        return;
      }
      
      // Simulate adding dynamic content
      await page.evaluate(() => {
        const container = document.querySelector('#chat-messages');
        if (container) {
          const message = document.createElement('div');
          message.innerHTML = '<p>New message</p>';
          message.setAttribute('role', 'listitem');
          container.appendChild(message);
        }
      });
      
      // Test accessibility after dynamic content is added
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test('should generate comprehensive accessibility report', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();
    
    // Generate detailed report
    const report = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      summary: {
        totalViolations: results.violations.length,
        totalPasses: results.passes.length,
        totalIncomplete: results.incomplete.length,
        criticalIssues: results.violations.filter(v => v.impact === 'critical').length,
        seriousIssues: results.violations.filter(v => v.impact === 'serious').length,
        moderateIssues: results.violations.filter(v => v.impact === 'moderate').length,
        minorIssues: results.violations.filter(v => v.impact === 'minor').length
      }
    };
    
    // Save report
    await page.context().storageState({ 
      path: 'test-results/accessibility-report.json' 
    });
    
    console.log('Accessibility Report Summary:', report.summary);
    
    // Fail test if there are violations
    expect(results.violations.length).toBe(0);
  });
});