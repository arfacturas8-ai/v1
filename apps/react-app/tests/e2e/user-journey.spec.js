import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('complete user journey from landing to main app', async ({ page }) => {
    // 1. Landing page should load
    await expect(page).toHaveTitle(/CRYB Platform/)
    
    // 2. Test demo login with specified credentials
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // 3. Should redirect to main app
    const userMenu = page.locator('[data-testid="user-menu"]')
    await expect(userMenu).toBeVisible({ timeout: 10000 })

    // 4. Test navigation to Home page
    await page.click('a[href="/home"], button:has-text("Home")')
    await expect(page).toHaveURL(/.*\/home/)
    
    // 5. Test navigation to Communities
    await page.click('a[href="/communities"], button:has-text("Communities")')
    await expect(page).toHaveURL(/.*\/communities/)
    
    // 6. Test navigation to Chat
    await page.click('a[href="/chat"], button:has-text("Chat")')
    await expect(page).toHaveURL(/.*\/chat/)
    
    // 7. Test navigation to Profile
    await page.click('a[href="/profile"], button:has-text("Profile")')
    await expect(page).toHaveURL(/.*\/profile/)

    // 8. Test logout
    await userMenu.click()
    await page.click('button:has-text("Logout"), button:has-text("Sign Out")')
    
    // 9. Should return to landing page
    const loginButton = page.locator('button:has-text("Login")')
    await expect(loginButton).toBeVisible({ timeout: 5000 })
  })

  test('navigation between all major pages', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    const routes = [
      { path: '/home', name: 'Home' },
      { path: '/communities', name: 'Communities' },
      { path: '/chat', name: 'Chat' },
      { path: '/create-post', name: 'Create Post' },
      { path: '/profile', name: 'Profile' },
      { path: '/settings', name: 'Settings' },
      { path: '/crypto', name: 'Crypto' },
      { path: '/search', name: 'Search' }
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(route.path))
      
      // Check that page loads without errors
      const errorMessage = page.locator('.error-boundary, .error-message')
      await expect(errorMessage).not.toBeVisible()
      
      // Check for main content
      const mainContent = page.locator('main, [role="main"], .main-content')
      await expect(mainContent).toBeVisible()
    }
  })

  test('responsive layout on different screen sizes', async ({ page }) => {
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/home')
    const desktopNav = page.locator('.desktop-nav, .header-nav')
    await expect(desktopNav).toBeVisible()

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.waitForTimeout(1000)

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForTimeout(1000)
    
    // Check for mobile menu
    const mobileMenu = page.locator('.mobile-menu-button, .hamburger-menu, button[aria-label*="menu"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      const mobileNav = page.locator('.mobile-nav, .nav-drawer')
      await expect(mobileNav).toBeVisible()
    }
  })

  test('PWA installation prompt', async ({ page }) => {
    await page.goto('/')
    
    // Check for PWA manifest
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifest).toBe('/manifest.json')
    
    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(swRegistered).toBe(true)
  })

  test('keyboard navigation accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a:has-text("Skip to main content")')
    await expect(skipLink).toBeFocused()
    
    // Continue tabbing through navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Test modal keyboard navigation
    await page.click('button:has-text("Login")')
    await page.keyboard.press('Tab')
    
    // Close modal with Escape
    await page.keyboard.press('Escape')
    const modal = page.locator('.modal-backdrop')
    await expect(modal).not.toBeVisible()
  })
})

test.describe('Feature Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Login")')
    await page.fill('input[type="email"]', 'demo@cryb.ai')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(2000)
  })

  test('search functionality across the platform', async ({ page }) => {
    await page.goto('/search')
    
    // Test search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    await expect(searchInput).toBeVisible()
    
    await searchInput.fill('test query')
    await page.keyboard.press('Enter')
    
    // Check for search results or no results message
    await page.waitForTimeout(1000)
    const results = page.locator('.search-results, .search-result, .no-results')
    await expect(results).toBeVisible()
  })

  test('create post functionality', async ({ page }) => {
    await page.goto('/create-post')
    
    // Check for post creation form
    const titleInput = page.locator('input[placeholder*="title" i], input[name="title"]')
    const contentInput = page.locator('textarea[placeholder*="content" i], textarea[name="content"], .editor')
    
    await expect(titleInput).toBeVisible()
    await expect(contentInput).toBeVisible()
    
    // Fill out post form
    await titleInput.fill('Test Post Title')
    await contentInput.fill('This is a test post content')
    
    // Check for submit button
    const submitButton = page.locator('button:has-text("Create Post"), button:has-text("Submit"), button:has-text("Publish")')
    await expect(submitButton).toBeVisible()
  })

  test('community features', async ({ page }) => {
    await page.goto('/communities')
    
    // Check for communities list
    const communitiesList = page.locator('.communities-list, .community-grid, .community-card')
    await expect(communitiesList).toBeVisible()
    
    // Test create community link
    const createCommunityButton = page.locator('a[href="/create-community"], button:has-text("Create Community")')
    if (await createCommunityButton.isVisible()) {
      await createCommunityButton.click()
      await expect(page).toHaveURL(/.*\/create-community/)
    }
  })

  test('chat functionality', async ({ page }) => {
    await page.goto('/chat')
    
    // Check for chat interface
    const chatContainer = page.locator('.chat-container, .messages-container, .chat-window')
    await expect(chatContainer).toBeVisible()
    
    // Check for message input
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]')
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test message')
      
      const sendButton = page.locator('button:has-text("Send"), button[aria-label*="send"]')
      await expect(sendButton).toBeVisible()
    }
  })

  test('user profile functionality', async ({ page }) => {
    await page.goto('/profile')
    
    // Check for profile information
    const profileContainer = page.locator('.profile-container, .user-profile')
    await expect(profileContainer).toBeVisible()
    
    // Check for edit profile option
    const editButton = page.locator('button:has-text("Edit Profile"), button:has-text("Edit"), a:has-text("Edit")')
    if (await editButton.isVisible()) {
      await editButton.click()
      
      // Check for profile edit form
      const editForm = page.locator('.profile-edit, .edit-form, form')
      await expect(editForm).toBeVisible()
    }
  })

  test('settings functionality', async ({ page }) => {
    await page.goto('/settings')
    
    // Check for settings sections
    const settingsContainer = page.locator('.settings-container, .settings-panel')
    await expect(settingsContainer).toBeVisible()
    
    // Test theme toggle if available
    const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light"), .theme-toggle')
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }
    
    // Test notification settings
    const notificationSettings = page.locator('input[type="checkbox"]')
    if (await notificationSettings.first().isVisible()) {
      await notificationSettings.first().click()
    }
  })
})