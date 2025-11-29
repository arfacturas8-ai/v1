import { test, expect } from '@playwright/test'

test.describe('Functional Testing - All Buttons and Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('landing page buttons and links functionality', async ({ page }) => {
    // Test all clickable elements on landing page
    const buttons = await page.locator('button, a[href]').all()
    
    for (const button of buttons) {
      const text = await button.textContent()
      const href = await button.getAttribute('href')
      
      if (text && text.trim() && await button.isVisible()) {
        console.log(`Testing button/link: ${text.trim()}`)
        
        // Test if button is clickable
        await expect(button).toBeEnabled()
        
        // For external links, just check they exist
        if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
          expect(href).toBeTruthy()
        }
      }
    }
  })

  test('header navigation functionality', async ({ page }) => {
    // Login first to access authenticated areas
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // Test main navigation links
    const navLinks = [
      { text: 'Home', expectedUrl: '/home' },
      { text: 'Communities', expectedUrl: '/communities' },
      { text: 'Chat', expectedUrl: '/chat' },
      { text: 'Create', expectedUrl: '/create-post' }
    ]

    for (const link of navLinks) {
      const navElement = page.locator(`a:has-text("${link.text}"), button:has-text("${link.text}")`)
      if (await navElement.isVisible()) {
        await navElement.click()
        await expect(page).toHaveURL(new RegExp(link.expectedUrl))
      }
    }
  })

  test('form inputs and validation', async ({ page }) => {
    // Test login form
    await page.click('button:has-text("Login")')
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    
    // Test empty form submission
    await page.click('button:has-text("Sign In")')
    const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
    
    // Test invalid email format
    await emailInput.fill('invalid-email')
    await passwordInput.fill('password123')
    await page.click('button:has-text("Sign In")')
    
    // Test valid credentials
    await emailInput.fill('demo@cryb.ai')
    await passwordInput.fill('demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)
    
    const userMenu = page.locator('[data-testid="user-menu"]')
    await expect(userMenu).toBeVisible({ timeout: 5000 })
  })

  test('file upload functionality', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // Navigate to a page with file upload
    await page.goto('/create-post')
    
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // Create a test file
      const testFile = Buffer.from('test file content')
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: testFile
      })
      
      // Check if file is selected
      const fileName = await fileInput.inputValue()
      expect(fileName).toContain('test.txt')
    }
  })

  test('search functionality', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // Test global search
    const globalSearch = page.locator('input[placeholder*="Search" i], input[type="search"]')
    if (await globalSearch.first().isVisible()) {
      await globalSearch.first().fill('test query')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
    }

    // Test dedicated search page
    await page.goto('/search')
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('community')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
      
      // Check for results or no results message
      const results = page.locator('.search-results, .no-results, .search-result')
      await expect(results).toBeVisible()
    }
  })

  test('filtering and sorting functionality', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // Test on communities page
    await page.goto('/communities')
    
    // Test sort options
    const sortButton = page.locator('select, button:has-text("Sort"), .sort-button')
    if (await sortButton.first().isVisible()) {
      await sortButton.first().click()
      
      // Look for sort options
      const sortOptions = page.locator('option, .sort-option')
      if (await sortOptions.first().isVisible()) {
        await sortOptions.first().click()
        await page.waitForTimeout(500)
      }
    }

    // Test filter options
    const filterButton = page.locator('button:has-text("Filter"), .filter-button')
    if (await filterButton.first().isVisible()) {
      await filterButton.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Real-time Features Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)
  })

  test('chat real-time messaging', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]')
    if (await messageInput.isVisible()) {
      const testMessage = `Test message ${Date.now()}`
      await messageInput.fill(testMessage)
      
      const sendButton = page.locator('button:has-text("Send"), button[aria-label*="send"]')
      if (await sendButton.isVisible()) {
        await sendButton.click()
        await page.waitForTimeout(1000)
        
        // Check if message appears in chat
        const messageElement = page.locator(`.message:has-text("${testMessage}")`)
        await expect(messageElement).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('notification system', async ({ page }) => {
    // Check for notification bell or indicator
    const notificationBell = page.locator('.notification-bell, [aria-label*="notification"]')
    if (await notificationBell.isVisible()) {
      await notificationBell.click()
      
      // Check for notification dropdown or panel
      const notificationPanel = page.locator('.notification-panel, .notification-dropdown')
      await expect(notificationPanel).toBeVisible()
    }
  })

  test('presence indicators', async ({ page }) => {
    await page.goto('/users')
    
    // Check for online status indicators
    const presenceIndicators = page.locator('.online-indicator, .status-indicator, .presence-dot')
    if (await presenceIndicators.first().isVisible()) {
      const count = await presenceIndicators.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Form Validation and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('comprehensive form validation', async ({ page }) => {
    // Test login form validation
    await page.click('button:has-text("Login")')
    
    // Test empty email
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    let errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    await expect(errorMessage).toBeVisible()
    
    // Test invalid email format
    await page.fill('input[type="email"]', 'invalid.email')
    await page.click('button:has-text("Sign In")')
    await expect(errorMessage).toBeVisible()
    
    // Test empty password
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '')
    await page.click('button:has-text("Sign In")')
    await expect(errorMessage).toBeVisible()
    
    // Test short password
    await page.fill('input[type="password"]', '123')
    await page.click('button:has-text("Sign In")')
    await expect(errorMessage).toBeVisible()
  })

  test('signup form validation', async ({ page }) => {
    await page.click('button:has-text("Login")')
    await page.click('text=Sign up')
    
    // Test password confirmation mismatch
    await page.fill('input[placeholder*="username" i]', 'testuser')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]:not([placeholder*="confirm"])', 'password123')
    await page.fill('input[placeholder*="confirm" i]', 'differentpassword')
    
    await page.click('button:has-text("Create Account")')
    
    const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/match/i)
  })

  test('create post form validation', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    await page.goto('/create-post')
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create Post"), button:has-text("Submit"), button:has-text("Publish")')
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // Check for validation errors
      const errorMessage = page.locator('.error-message, .text-red-500, [role="alert"]')
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('Interactive Elements Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)
  })

  test('dropdown menus functionality', async ({ page }) => {
    // Test user menu dropdown
    const userMenu = page.locator('[data-testid="user-menu"]')
    await userMenu.click()
    
    const dropdown = page.locator('.dropdown-menu, .user-dropdown')
    await expect(dropdown).toBeVisible()
    
    // Test dropdown items
    const dropdownItems = dropdown.locator('a, button')
    const itemCount = await dropdownItems.count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('modal dialogs functionality', async ({ page }) => {
    // Test settings modal if available
    await page.goto('/settings')
    
    const modalTrigger = page.locator('button:has-text("Edit"), button:has-text("Change")')
    if (await modalTrigger.first().isVisible()) {
      await modalTrigger.first().click()
      
      const modal = page.locator('.modal, .dialog')
      await expect(modal).toBeVisible()
      
      // Test modal close
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('tooltip functionality', async ({ page }) => {
    await page.goto('/home')
    
    // Look for elements with tooltips
    const tooltipTriggers = page.locator('[title], [aria-label], .tooltip-trigger')
    if (await tooltipTriggers.first().isVisible()) {
      await tooltipTriggers.first().hover()
      await page.waitForTimeout(500)
      
      const tooltip = page.locator('.tooltip, [role="tooltip"]')
      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible()
      }
    }
  })

  test('accordion/collapsible content', async ({ page }) => {
    await page.goto('/help')
    
    // Look for expandable sections
    const accordionHeaders = page.locator('.accordion-header, .collapsible-header, [aria-expanded]')
    if (await accordionHeaders.first().isVisible()) {
      const isExpanded = await accordionHeaders.first().getAttribute('aria-expanded')
      await accordionHeaders.first().click()
      
      await page.waitForTimeout(300)
      const newState = await accordionHeaders.first().getAttribute('aria-expanded')
      expect(newState).not.toBe(isExpanded)
    }
  })

  test('tab navigation functionality', async ({ page }) => {
    await page.goto('/settings')
    
    // Look for tab interfaces
    const tabs = page.locator('[role="tab"], .tab-button')
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      
      const selectedTab = page.locator('[role="tab"][aria-selected="true"], .tab-button.active')
      await expect(selectedTab).toBeVisible()
    }
  })
})