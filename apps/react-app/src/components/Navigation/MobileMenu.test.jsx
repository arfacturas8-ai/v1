import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import MobileMenu from './MobileMenu.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useNavigation } from '../../contexts/NavigationContext'

// Mock the contexts
vi.mock('../../contexts/AuthContext.jsx')
vi.mock('../../contexts/NavigationContext')

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ pathname: '/home' }),
    useNavigate: () => mockNavigate
  }
})

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

const mockUser = {
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com'
}

const mockNavigationConfig = {
  primary: [
    { id: 'home', label: 'Home', path: '/home', icon: 'Home' },
    { id: 'communities', label: 'Communities', path: '/communities', icon: 'Hash' },
    { id: 'messages', label: 'Messages', path: '/messages', icon: 'MessageCircle', description: 'Chat with friends' }
  ],
  secondary: [
    { id: 'trending', label: 'Trending', path: '/trending', icon: 'TrendingUp' },
    { id: 'search', label: 'Search', path: '/search', icon: 'Search' }
  ],
  quickActions: [
    { id: 'create-post', label: 'Create Post', path: '/create', icon: 'Plus' },
    { id: 'bookmarks', label: 'Bookmarks', path: '/bookmarks', icon: 'Bookmark' }
  ],
  account: [
    { id: 'profile', label: 'Profile', path: '/profile', icon: 'User' },
    { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' }
  ]
}

describe('MobileMenu', () => {
  const mockLogout = vi.fn()
  const mockToggleMobileMenu = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout
    })
    useNavigation.mockReturnValue({
      isMobileMenuOpen: true,
      toggleMobileMenu: mockToggleMobileMenu,
      navigationConfig: mockNavigationConfig,
      notifications: { unread: 5 }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render nothing when menu is closed', () => {
      useNavigation.mockReturnValue({
        isMobileMenuOpen: false,
        toggleMobileMenu: mockToggleMobileMenu,
        navigationConfig: mockNavigationConfig,
        notifications: { unread: 5 }
      })

      const { container } = renderWithRouter(<MobileMenu />)
      expect(container.firstChild).toBeNull()
    })

    it('should render overlay when menu is open', () => {
      renderWithRouter(<MobileMenu />)
      const overlay = screen.getByRole('generic', { hidden: true })
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black/50')
    })

    it('should render mobile menu drawer when open', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('fixed', 'left-0', 'top-0', 'bottom-0')
    })

    it('should render CRYB logo and branding', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('CRYB')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('should render close button', () => {
      renderWithRouter(<MobileMenu />)
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should apply correct drawer width classes', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('w-80', 'max-w-[85vw]')
    })

    it('should apply shadow to drawer', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('shadow-2xl')
    })
  })

  describe('User Profile Section', () => {
    it('should render user info when user is logged in', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should render user avatar with first letter of username', () => {
      renderWithRouter(<MobileMenu />)
      const avatar = screen.getByText('T')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveClass('w-12', 'h-12', 'rounded-full')
    })

    it('should render fallback username when displayName is not available', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', email: 'test@example.com' },
        logout: mockLogout
      })
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should render fallback email when email is not available', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', displayName: 'Test User' },
        logout: mockLogout
      })
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('user@cryb.com')).toBeInTheDocument()
    })

    it('should render user avatar fallback when username is not available', () => {
      useAuth.mockReturnValue({
        user: { displayName: 'Test User', email: 'test@example.com' },
        logout: mockLogout
      })
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('U')).toBeInTheDocument()
    })

    it('should render quick stats section', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Karma')).toBeInTheDocument()
      expect(screen.getByText('Awards')).toBeInTheDocument()
    })

    it('should display correct post count', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('24')).toBeInTheDocument()
    })

    it('should display correct karma count', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('1.2k')).toBeInTheDocument()
    })

    it('should display correct awards count', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('should not render user section when user is null', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      })
      renderWithRouter(<MobileMenu />)
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Sections', () => {
    it('should render Main Navigation section header', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Main Navigation')).toBeInTheDocument()
    })

    it('should render Discover section header', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Discover')).toBeInTheDocument()
    })

    it('should render Quick Actions section header', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })

    it('should render Recent Communities section header', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Recent Communities')).toBeInTheDocument()
    })

    it('should render Notifications section header', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })

    it('should render all primary navigation items', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Communities')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
    })

    it('should render all secondary navigation items', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Trending')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('should render all quick action items', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Create Post')).toBeInTheDocument()
      expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    })

    it('should render all account navigation items', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should render navigation item description when available', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Chat with friends')).toBeInTheDocument()
    })
  })

  describe('Communities List', () => {
    it('should render technology community', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
      expect(screen.getByText('125k members')).toBeInTheDocument()
    })

    it('should render gaming community', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('c/gaming')).toBeInTheDocument()
      expect(screen.getByText('89k members')).toBeInTheDocument()
    })

    it('should render crypto community', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('c/crypto')).toBeInTheDocument()
      expect(screen.getByText('67k members')).toBeInTheDocument()
    })

    it('should render defi community', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('c/defi')).toBeInTheDocument()
      expect(screen.getByText('43k members')).toBeInTheDocument()
    })

    it('should show active indicator for active communities', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const activeIndicators = container.querySelectorAll('.bg-success')
      expect(activeIndicators.length).toBeGreaterThan(0)
    })

    it('should render Browse All Communities link', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Browse All Communities')).toBeInTheDocument()
    })

    it('should have correct path for Browse All Communities', () => {
      renderWithRouter(<MobileMenu />)
      const link = screen.getByText('Browse All Communities').closest('a')
      expect(link).toHaveAttribute('href', '/communities')
    })
  })

  describe('Notifications Section', () => {
    it('should display unread notifications count', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Unread notifications')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should render view all notifications link', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('View all notifications')).toBeInTheDocument()
    })

    it('should have correct path for notifications link', () => {
      renderWithRouter(<MobileMenu />)
      const link = screen.getByText('View all notifications').closest('a')
      expect(link).toHaveAttribute('href', '/notifications')
    })

    it('should display zero notifications when count is zero', () => {
      useNavigation.mockReturnValue({
        isMobileMenuOpen: true,
        toggleMobileMenu: mockToggleMobileMenu,
        navigationConfig: mockNavigationConfig,
        notifications: { unread: 0 }
      })
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Logout Button', () => {
    it('should render sign out button', () => {
      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('should call logout when sign out button is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('should toggle menu when sign out button is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should have error styling on sign out button', () => {
      renderWithRouter(<MobileMenu />)
      const signOutButton = screen.getByText('Sign Out').closest('button')
      expect(signOutButton).toHaveClass('text-error', 'hover:bg-error/10')
    })
  })

  describe('Close Functionality', () => {
    it('should call toggleMobileMenu when close button is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      fireEvent.click(closeButton)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMobileMenu when overlay is clicked', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const overlay = container.querySelector('.bg-black\\/50')
      fireEvent.click(overlay)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMobileMenu when navigation item is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const homeLink = screen.getByText('Home').closest('a')
      fireEvent.click(homeLink)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMobileMenu when community link is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const communityLink = screen.getByText('c/technology').closest('a')
      fireEvent.click(communityLink)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMobileMenu when notifications link is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const notificationsLink = screen.getByText('View all notifications')
      fireEvent.click(notificationsLink)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMobileMenu when Browse All Communities is clicked', () => {
      renderWithRouter(<MobileMenu />)
      const browseLink = screen.getByText('Browse All Communities')
      fireEvent.click(browseLink)
      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })
  })

  describe('Active State Styling', () => {
    it('should highlight active navigation item with correct classes', () => {
      renderWithRouter(<MobileMenu />)
      const homeLink = screen.getByText('Home').closest('a')
      expect(homeLink).toHaveClass('bg-primary-trust/10', 'text-primary-trust', 'border-r-2', 'border-primary-trust')
    })

    it('should show active indicator dot for active items', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const homeLink = screen.getByText('Home').closest('a')
      const activeDot = homeLink.querySelector('.bg-primary-trust.rounded-full')
      expect(activeDot).toBeInTheDocument()
    })

    it('should not highlight inactive navigation items', () => {
      renderWithRouter(<MobileMenu />)
      const communitiesLink = screen.getByText('Communities').closest('a')
      expect(communitiesLink).toHaveClass('text-secondary', 'hover:text-primary', 'hover:bg-hover')
      expect(communitiesLink).not.toHaveClass('bg-primary-trust/10')
    })

    it('should apply correct icon color for active items', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const homeLink = screen.getByText('Home').closest('a')
      const icon = homeLink.querySelector('svg')
      expect(icon).toHaveClass('text-primary-trust')
    })

    it('should apply correct icon color for inactive items', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const communitiesLink = screen.getByText('Communities').closest('a')
      const icon = communitiesLink.querySelector('svg')
      expect(icon).toHaveClass('text-tertiary')
    })
  })

  describe('Drawer Animation', () => {
    it('should have transition classes for drawer animation', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('transition-transform', 'duration-300', 'ease-in-out')
    })

    it('should be positioned fixed for overlay behavior', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('fixed')
    })
  })

  describe('Responsive Behavior', () => {
    it('should hide menu on large screens with lg:hidden class', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('lg:hidden')
    })

    it('should hide overlay on large screens', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const overlay = container.querySelector('.bg-black\\/50')
      expect(overlay).toHaveClass('lg:hidden')
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href for home link', () => {
      renderWithRouter(<MobileMenu />)
      const homeLink = screen.getByText('Home').closest('a')
      expect(homeLink).toHaveAttribute('href', '/home')
    })

    it('should have correct href for communities link', () => {
      renderWithRouter(<MobileMenu />)
      const communitiesLink = screen.getByText('Communities').closest('a')
      expect(communitiesLink).toHaveAttribute('href', '/communities')
    })

    it('should have correct href for messages link', () => {
      renderWithRouter(<MobileMenu />)
      const messagesLink = screen.getByText('Messages').closest('a')
      expect(messagesLink).toHaveAttribute('href', '/messages')
    })

    it('should have correct href for settings link', () => {
      renderWithRouter(<MobileMenu />)
      const settingsLink = screen.getByText('Settings').closest('a')
      expect(settingsLink).toHaveAttribute('href', '/settings')
    })

    it('should have correct href for profile link', () => {
      renderWithRouter(<MobileMenu />)
      const profileLink = screen.getByText('Profile').closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })

    it('should have correct href for technology community', () => {
      renderWithRouter(<MobileMenu />)
      const technologyLink = screen.getByText('c/technology').closest('a')
      expect(technologyLink).toHaveAttribute('href', '/c/technology')
    })

    it('should have correct href for gaming community', () => {
      renderWithRouter(<MobileMenu />)
      const gamingLink = screen.getByText('c/gaming').closest('a')
      expect(gamingLink).toHaveAttribute('href', '/c/gaming')
    })
  })

  describe('Quick Actions Styling', () => {
    it('should apply special border styling to quick actions', () => {
      renderWithRouter(<MobileMenu />)
      const createPostLink = screen.getByText('Create Post').closest('a')
      expect(createPostLink).toHaveClass('border-l-4', 'border-transparent', 'hover:border-accent-cyan')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty navigation config gracefully', () => {
      useNavigation.mockReturnValue({
        isMobileMenuOpen: true,
        toggleMobileMenu: mockToggleMobileMenu,
        navigationConfig: {
          primary: [],
          secondary: [],
          quickActions: [],
          account: []
        },
        notifications: { unread: 0 }
      })

      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Main Navigation')).toBeInTheDocument()
    })

    it('should handle large notification counts', () => {
      useNavigation.mockReturnValue({
        isMobileMenuOpen: true,
        toggleMobileMenu: mockToggleMobileMenu,
        navigationConfig: mockNavigationConfig,
        notifications: { unread: 999 }
      })

      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('999')).toBeInTheDocument()
    })

    it('should handle user with very long username', () => {
      useAuth.mockReturnValue({
        user: {
          username: 'verylongusernamethatmightoverflow',
          displayName: 'Very Long Display Name That Might Overflow',
          email: 'verylongemail@example.com'
        },
        logout: mockLogout
      })

      renderWithRouter(<MobileMenu />)
      expect(screen.getByText('Very Long Display Name That Might Overflow')).toBeInTheDocument()
    })

    it('should truncate long text with truncate class', () => {
      renderWithRouter(<MobileMenu />)
      const userInfo = screen.getByText('Test User')
      expect(userInfo).toHaveClass('truncate')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on close button', () => {
      renderWithRouter(<MobileMenu />)
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close menu')
    })

    it('should use semantic nav elements', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const navElements = container.querySelectorAll('nav')
      expect(navElements.length).toBeGreaterThan(0)
    })

    it('should have proper button elements for interactive actions', () => {
      renderWithRouter(<MobileMenu />)
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton.tagName).toBe('BUTTON')
    })
  })

  describe('z-index Layering', () => {
    it('should have correct z-index for overlay', () => {
      const { container } = renderWithRouter(<MobileMenu />)
      const overlay = container.querySelector('.bg-black\\/50')
      expect(overlay).toHaveClass('z-50')
    })

    it('should have correct z-index for drawer', () => {
      renderWithRouter(<MobileMenu />)
      const drawer = screen.getByText('CRYB').closest('div').parentElement
      expect(drawer).toHaveClass('z-50')
    })
  })
})

export default mockNavigate
