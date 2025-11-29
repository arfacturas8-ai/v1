import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const location = useLocation()
  const [state, setState] = useState({
    isSidebarOpen: false,
    isMobileMenuOpen: false,
    isUserMenuOpen: false,
    isCommunityMenuOpen: false,
    activeSection: 'home',
    notifications: {
      unread: 3,
      items: []
    }
  })

  // Close menus when route changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isMobileMenuOpen: false,
      isUserMenuOpen: false,
      isCommunityMenuOpen: false
    }))
  }, [location.pathname])

  // Determine active section based on current path
  useEffect(() => {
    const path = location.pathname
    let activeSection = 'home'
    
    if (path.startsWith('/communities') || path.startsWith('/c/')) {
      activeSection = 'communities'
    } else if (path.startsWith('/chat')) {
      activeSection = 'chat'
    } else if (path.startsWith('/crypto') || path.startsWith('/web3')) {
      activeSection = 'crypto'
    } else if (path.startsWith('/profile') || path.startsWith('/user/')) {
      activeSection = 'profile'
    } else if (path.startsWith('/activity')) {
      activeSection = 'activity'
    } else if (path.startsWith('/search')) {
      activeSection = 'search'
    } else if (path.startsWith('/settings')) {
      activeSection = 'settings'
    }
    
    setState(prev => ({ ...prev, activeSection }))
  }, [location.pathname])

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))
  }

  const toggleMobileMenu = () => {
    setState(prev => ({ 
      ...prev, 
      isMobileMenuOpen: !prev.isMobileMenuOpen,
      isUserMenuOpen: false,
      isCommunityMenuOpen: false
    }))
  }

  const toggleUserMenu = () => {
    setState(prev => ({ 
      ...prev, 
      isUserMenuOpen: !prev.isUserMenuOpen,
      isMobileMenuOpen: false,
      isCommunityMenuOpen: false
    }))
  }

  const toggleCommunityMenu = () => {
    setState(prev => ({ 
      ...prev, 
      isCommunityMenuOpen: !prev.isCommunityMenuOpen,
      isMobileMenuOpen: false,
      isUserMenuOpen: false
    }))
  }

  const closeAllMenus = () => {
    setState(prev => ({
      ...prev,
      isMobileMenuOpen: false,
      isUserMenuOpen: false,
      isCommunityMenuOpen: false
    }))
  }

  const updateNotifications = (notifications) => {
    setState(prev => ({ ...prev, notifications }))
  }

  // Navigation items configuration
  const navigationConfig = {
    primary: [
      { 
        id: 'home', 
        path: '/home', 
        label: 'Home', 
        icon: 'Home', 
        description: 'Your personalized feed'
      },
      { 
        id: 'communities', 
        path: '/communities', 
        label: 'Communities', 
        icon: 'Hash', 
        description: 'Discover and join communities'
      },
      { 
        id: 'chat', 
        path: '/chat', 
        label: 'Chat', 
        icon: 'MessageCircle', 
        description: 'Real-time messaging'
      },
      { 
        id: 'crypto', 
        path: '/crypto', 
        label: 'Crypto', 
        icon: 'Coins', 
        description: 'Web3 and cryptocurrency hub'
      }
    ],
    secondary: [
      { 
        id: 'activity', 
        path: '/activity', 
        label: 'Activity', 
        icon: 'Activity', 
        description: 'Your activity timeline'
      },
      { 
        id: 'users', 
        path: '/users', 
        label: 'Users', 
        icon: 'Users', 
        description: 'Find and connect with users'
      },
      { 
        id: 'search', 
        path: '/search', 
        label: 'Search', 
        icon: 'Search', 
        description: 'Search everything'
      }
    ],
    account: [
      { 
        id: 'profile', 
        path: '/profile', 
        label: 'Profile', 
        icon: 'User', 
        description: 'Your profile and posts'
      },
      { 
        id: 'settings', 
        path: '/settings', 
        label: 'Settings', 
        icon: 'Settings', 
        description: 'Account and app settings'
      }
    ],
    quickActions: [
      { 
        id: 'create-post', 
        path: '/submit', 
        label: 'Create Post', 
        icon: 'Plus', 
        color: 'accent-cyan'
      },
      { 
        id: 'create-community', 
        path: '/create-community', 
        label: 'New Community', 
        icon: 'Hash', 
        color: 'success'
      }
    ]
  }

  const value = {
    ...state,
    navigationConfig,
    toggleSidebar,
    toggleMobileMenu,
    toggleUserMenu,
    toggleCommunityMenu,
    closeAllMenus,
    updateNotifications
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
export default NavigationContext
