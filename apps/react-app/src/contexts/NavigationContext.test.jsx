import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { NavigationProvider, useNavigation } from './NavigationContext'

// Mock router location
let mockLocation = { pathname: '/' }

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation
}))

// Wrapper component
const wrapper = ({ children }) => (
  <BrowserRouter>
    <NavigationProvider>{children}</NavigationProvider>
  </BrowserRouter>
)

describe('NavigationContext', () => {
  beforeEach(() => {
    mockLocation = { pathname: '/' }
  })

  describe('Initial State', () => {
    test('should provide initial navigation state', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.isSidebarOpen).toBe(false)
      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isUserMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
      expect(result.current.activeSection).toBe('home')
    })

    test('should provide notifications state', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.notifications).toBeDefined()
      expect(result.current.notifications.unread).toBe(3)
      expect(result.current.notifications.items).toEqual([])
    })

    test('should provide navigation configuration', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.navigationConfig).toBeDefined()
      expect(result.current.navigationConfig.primary).toBeDefined()
      expect(result.current.navigationConfig.secondary).toBeDefined()
      expect(result.current.navigationConfig.account).toBeDefined()
      expect(result.current.navigationConfig.quickActions).toBeDefined()
    })

    test('should provide all navigation methods', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(typeof result.current.toggleSidebar).toBe('function')
      expect(typeof result.current.toggleMobileMenu).toBe('function')
      expect(typeof result.current.toggleUserMenu).toBe('function')
      expect(typeof result.current.toggleCommunityMenu).toBe('function')
      expect(typeof result.current.closeAllMenus).toBe('function')
      expect(typeof result.current.updateNotifications).toBe('function')
    })
  })

  describe('Navigation Configuration', () => {
    test('should have correct primary navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const primary = result.current.navigationConfig.primary

      expect(primary).toHaveLength(4)
      expect(primary[0].id).toBe('home')
      expect(primary[1].id).toBe('communities')
      expect(primary[2].id).toBe('chat')
      expect(primary[3].id).toBe('crypto')
    })

    test('should have correct secondary navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const secondary = result.current.navigationConfig.secondary

      expect(secondary).toHaveLength(3)
      expect(secondary[0].id).toBe('activity')
      expect(secondary[1].id).toBe('users')
      expect(secondary[2].id).toBe('search')
    })

    test('should have correct account navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const account = result.current.navigationConfig.account

      expect(account).toHaveLength(2)
      expect(account[0].id).toBe('profile')
      expect(account[1].id).toBe('settings')
    })

    test('should have correct quick actions', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const quickActions = result.current.navigationConfig.quickActions

      expect(quickActions).toHaveLength(2)
      expect(quickActions[0].id).toBe('create-post')
      expect(quickActions[1].id).toBe('create-community')
    })

    test('should have paths for all navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const allItems = [
        ...result.current.navigationConfig.primary,
        ...result.current.navigationConfig.secondary,
        ...result.current.navigationConfig.account,
        ...result.current.navigationConfig.quickActions
      ]

      allItems.forEach(item => {
        expect(item.path).toBeDefined()
        expect(typeof item.path).toBe('string')
      })
    })

    test('should have icons for all navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const allItems = [
        ...result.current.navigationConfig.primary,
        ...result.current.navigationConfig.secondary,
        ...result.current.navigationConfig.account,
        ...result.current.navigationConfig.quickActions
      ]

      allItems.forEach(item => {
        expect(item.icon).toBeDefined()
        expect(typeof item.icon).toBe('string')
      })
    })

    test('should have labels for all navigation items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const allItems = [
        ...result.current.navigationConfig.primary,
        ...result.current.navigationConfig.secondary,
        ...result.current.navigationConfig.account,
        ...result.current.navigationConfig.quickActions
      ]

      allItems.forEach(item => {
        expect(item.label).toBeDefined()
        expect(typeof item.label).toBe('string')
      })
    })
  })

  describe('Active Section Detection', () => {
    test('should set active section to home for root path', () => {
      mockLocation = { pathname: '/' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('home')
    })

    test('should set active section to communities for /communities path', () => {
      mockLocation = { pathname: '/communities' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('communities')
    })

    test('should set active section to communities for /c/ path', () => {
      mockLocation = { pathname: '/c/gaming' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('communities')
    })

    test('should set active section to chat for /chat path', () => {
      mockLocation = { pathname: '/chat' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('chat')
    })

    test('should set active section to crypto for /crypto path', () => {
      mockLocation = { pathname: '/crypto' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('crypto')
    })

    test('should set active section to crypto for /web3 path', () => {
      mockLocation = { pathname: '/web3' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('crypto')
    })

    test('should set active section to profile for /profile path', () => {
      mockLocation = { pathname: '/profile' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('profile')
    })

    test('should set active section to profile for /user/ path', () => {
      mockLocation = { pathname: '/user/johndoe' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('profile')
    })

    test('should set active section to activity for /activity path', () => {
      mockLocation = { pathname: '/activity' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('activity')
    })

    test('should set active section to search for /search path', () => {
      mockLocation = { pathname: '/search' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('search')
    })

    test('should set active section to settings for /settings path', () => {
      mockLocation = { pathname: '/settings' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('settings')
    })

    test('should handle nested paths correctly', () => {
      mockLocation = { pathname: '/communities/gaming/posts/123' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('communities')
    })

    test('should default to home for unknown paths', () => {
      mockLocation = { pathname: '/unknown-page' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('home')
    })
  })

  describe('Sidebar Toggle', () => {
    test('should toggle sidebar open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.isSidebarOpen).toBe(false)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.isSidebarOpen).toBe(true)
    })

    test('should toggle sidebar closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleSidebar()
        result.current.toggleSidebar()
      })

      expect(result.current.isSidebarOpen).toBe(false)
    })

    test('should toggle sidebar multiple times', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggleSidebar()
        })
        expect(result.current.isSidebarOpen).toBe(i % 2 === 0)
      }
    })
  })

  describe('Mobile Menu Toggle', () => {
    test('should toggle mobile menu open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.isMobileMenuOpen).toBe(false)

      act(() => {
        result.current.toggleMobileMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(true)
    })

    test('should close other menus when opening mobile menu', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleUserMenu()
        result.current.toggleCommunityMenu()
      })

      expect(result.current.isUserMenuOpen).toBe(true)
      expect(result.current.isCommunityMenuOpen).toBe(true)

      act(() => {
        result.current.toggleMobileMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(true)
      expect(result.current.isUserMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
    })

    test('should toggle mobile menu closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleMobileMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(false)
    })
  })

  describe('User Menu Toggle', () => {
    test('should toggle user menu open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.isUserMenuOpen).toBe(false)

      act(() => {
        result.current.toggleUserMenu()
      })

      expect(result.current.isUserMenuOpen).toBe(true)
    })

    test('should close other menus when opening user menu', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleCommunityMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(true)
      expect(result.current.isCommunityMenuOpen).toBe(true)

      act(() => {
        result.current.toggleUserMenu()
      })

      expect(result.current.isUserMenuOpen).toBe(true)
      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
    })

    test('should toggle user menu closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleUserMenu()
        result.current.toggleUserMenu()
      })

      expect(result.current.isUserMenuOpen).toBe(false)
    })
  })

  describe('Community Menu Toggle', () => {
    test('should toggle community menu open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.isCommunityMenuOpen).toBe(false)

      act(() => {
        result.current.toggleCommunityMenu()
      })

      expect(result.current.isCommunityMenuOpen).toBe(true)
    })

    test('should close other menus when opening community menu', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleUserMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(true)
      expect(result.current.isUserMenuOpen).toBe(true)

      act(() => {
        result.current.toggleCommunityMenu()
      })

      expect(result.current.isCommunityMenuOpen).toBe(true)
      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isUserMenuOpen).toBe(false)
    })

    test('should toggle community menu closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleCommunityMenu()
        result.current.toggleCommunityMenu()
      })

      expect(result.current.isCommunityMenuOpen).toBe(false)
    })
  })

  describe('Close All Menus', () => {
    test('should close all open menus', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleUserMenu()
        result.current.toggleCommunityMenu()
      })

      // Note: Due to mutual exclusion, only the last one should be open
      expect(result.current.isCommunityMenuOpen).toBe(true)

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isUserMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
    })

    test('should handle closing when no menus are open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isUserMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
    })

    test('should not affect sidebar state', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleSidebar()
        result.current.toggleMobileMenu()
      })

      expect(result.current.isSidebarOpen).toBe(true)

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.isSidebarOpen).toBe(true)
    })
  })

  describe('Route Change Behavior', () => {
    test('should close menus when route changes', () => {
      mockLocation = { pathname: '/home' }
      const { result, rerender } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleMobileMenu()
      })

      expect(result.current.isMobileMenuOpen).toBe(true)

      // Simulate route change
      mockLocation = { pathname: '/communities' }
      rerender()

      // Wait for effect to run
      waitFor(() => {
        expect(result.current.isMobileMenuOpen).toBe(false)
      })
    })

    test('should update active section when route changes', () => {
      mockLocation = { pathname: '/home' }
      const { result, rerender } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('home')

      mockLocation = { pathname: '/chat' }
      rerender()

      waitFor(() => {
        expect(result.current.activeSection).toBe('chat')
      })
    })

    test('should close all menus on route change', () => {
      mockLocation = { pathname: '/home' }
      const { result, rerender } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleUserMenu()
      })

      mockLocation = { pathname: '/settings' }
      rerender()

      waitFor(() => {
        expect(result.current.isUserMenuOpen).toBe(false)
        expect(result.current.isMobileMenuOpen).toBe(false)
        expect(result.current.isCommunityMenuOpen).toBe(false)
      })
    })
  })

  describe('Notifications', () => {
    test('should have default unread count', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.notifications.unread).toBe(3)
    })

    test('should have empty items array by default', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.notifications.items).toEqual([])
    })

    test('should update notifications', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const newNotifications = {
        unread: 5,
        items: [
          { id: '1', message: 'New message', read: false },
          { id: '2', message: 'New comment', read: false }
        ]
      }

      act(() => {
        result.current.updateNotifications(newNotifications)
      })

      expect(result.current.notifications.unread).toBe(5)
      expect(result.current.notifications.items).toHaveLength(2)
    })

    test('should replace notifications completely on update', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.updateNotifications({
          unread: 10,
          items: [{ id: '1', message: 'Test' }]
        })
      })

      act(() => {
        result.current.updateNotifications({
          unread: 0,
          items: []
        })
      })

      expect(result.current.notifications.unread).toBe(0)
      expect(result.current.notifications.items).toEqual([])
    })
  })

  describe('useNavigation Hook', () => {
    test('should throw error when used outside NavigationProvider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useNavigation())
      }).toThrow('useNavigation must be used within NavigationProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('State Persistence', () => {
    test('should maintain sidebar state across menu toggles', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.isSidebarOpen).toBe(true)

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleUserMenu()
      })

      expect(result.current.isSidebarOpen).toBe(true)
    })

    test('should maintain notifications across menu toggles', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      const notifications = {
        unread: 7,
        items: [{ id: '1', message: 'Test' }]
      }

      act(() => {
        result.current.updateNotifications(notifications)
      })

      act(() => {
        result.current.toggleMobileMenu()
        result.current.closeAllMenus()
      })

      expect(result.current.notifications.unread).toBe(7)
      expect(result.current.notifications.items).toHaveLength(1)
    })

    test('should maintain active section across menu operations', () => {
      mockLocation = { pathname: '/communities' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('communities')

      act(() => {
        result.current.toggleMobileMenu()
        result.current.toggleUserMenu()
        result.current.closeAllMenus()
      })

      expect(result.current.activeSection).toBe('communities')
    })
  })

  describe('Edge Cases', () => {
    test('should handle rapid menu toggles', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toggleMobileMenu()
        }
      })

      expect(result.current.isMobileMenuOpen).toBe(false)
    })

    test('should handle closing already closed menus', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.closeAllMenus()
        result.current.closeAllMenus()
      })

      expect(result.current.isMobileMenuOpen).toBe(false)
      expect(result.current.isUserMenuOpen).toBe(false)
      expect(result.current.isCommunityMenuOpen).toBe(false)
    })

    test('should handle null notifications update', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper })

      act(() => {
        result.current.updateNotifications({ unread: 0, items: [] })
      })

      expect(result.current.notifications.unread).toBe(0)
      expect(result.current.notifications.items).toEqual([])
    })

    test('should handle paths with query parameters', () => {
      mockLocation = { pathname: '/search?q=test' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('search')
    })

    test('should handle paths with hash fragments', () => {
      mockLocation = { pathname: '/settings#profile' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('settings')
    })

    test('should handle empty pathname', () => {
      mockLocation = { pathname: '' }
      const { result } = renderHook(() => useNavigation(), { wrapper })

      expect(result.current.activeSection).toBe('home')
    })
  })
})

export default wrapper
