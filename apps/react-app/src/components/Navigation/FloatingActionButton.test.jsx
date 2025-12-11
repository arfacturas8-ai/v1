import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import FloatingActionButton from './FloatingActionButton'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn()
  }
})

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn()
}))

vi.mock('../ui', () => ({
  Button: ({ children, onClick, className, 'aria-label': ariaLabel, ...props }) => (
    <button onClick={onClick} className={className} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  )
}))

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  X: () => <span data-testid="x-icon">X</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Hash: () => <span data-testid="hash-icon">Hash</span>,
  MessageCircle: () => <span data-testid="message-icon">MessageCircle</span>,
  Users: () => <span data-testid="users-icon">Users</span>
}))

vi.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' ')
}))

const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()
const mockUseAuth = vi.fn()

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

describe('FloatingActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(mockNavigate)
    mockUseLocation.mockReturnValue({ pathname: '/' })
    useLocation.mockImplementation(mockUseLocation)
    mockUseAuth.mockReturnValue({ user: { id: '1', username: 'testuser' } })
    useAuth.mockImplementation(mockUseAuth)
    window.scrollY = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render the FAB button when user is authenticated', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      expect(fabButton).toBeInTheDocument()
    })

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null })
      render(<FloatingActionButton />)
      const fabButton = screen.queryByLabelText('Quick actions')
      expect(fabButton).not.toBeInTheDocument()
    })

    it('should render with Plus icon initially', () => {
      render(<FloatingActionButton />)
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('should render with correct initial classes', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      expect(fabButton.className).toContain('w-16 h-16')
      expect(fabButton.className).toContain('rounded-full')
    })

    it('should render with fixed positioning', () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild
      expect(fabContainer.className).toContain('fixed')
      expect(fabContainer.className).toContain('bottom-20')
      expect(fabContainer.className).toContain('right-4')
    })
  })

  describe('Hidden Paths', () => {
    it('should not render on /submit path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/submit' })
      render(<FloatingActionButton />)
      expect(screen.queryByLabelText('Quick actions')).not.toBeInTheDocument()
    })

    it('should not render on /create-post path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/create-post' })
      render(<FloatingActionButton />)
      expect(screen.queryByLabelText('Quick actions')).not.toBeInTheDocument()
    })

    it('should not render on /create-community path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/create-community' })
      render(<FloatingActionButton />)
      expect(screen.queryByLabelText('Quick actions')).not.toBeInTheDocument()
    })

    it('should not render on nested hidden path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/submit/new' })
      render(<FloatingActionButton />)
      expect(screen.queryByLabelText('Quick actions')).not.toBeInTheDocument()
    })

    it('should render on other paths', () => {
      mockUseLocation.mockReturnValue({ pathname: '/home' })
      render(<FloatingActionButton />)
      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should expand when FAB is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('should collapse when FAB is clicked again', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)
      fireEvent.click(fabButton)
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('should show all action items when expanded', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByLabelText('Create Post')).toBeInTheDocument()
      expect(screen.getByLabelText('New Community')).toBeInTheDocument()
      expect(screen.getByLabelText('Direct Message')).toBeInTheDocument()
      expect(screen.getByLabelText('Find Friends')).toBeInTheDocument()
    })

    it('should apply rotate-45 class when expanded', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      expect(fabButton.className).not.toContain('rotate-45')
      fireEvent.click(fabButton)
      expect(screen.getByLabelText('Close menu').className).toContain('rotate-45')
    })

    it('should update aria-label when expanded', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
    })

    it('should render backdrop when expanded', () => {
      const { container } = render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/10')
      expect(backdrop).toBeInTheDocument()
    })

    it('should close when backdrop is clicked', () => {
      const { container } = render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/10')
      fireEvent.click(backdrop)

      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to /submit when Create Post is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const createPostButton = screen.getByLabelText('Create Post')
      fireEvent.click(createPostButton)

      expect(mockNavigate).toHaveBeenCalledWith('/submit')
    })

    it('should navigate to /create-community when New Community is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const newCommunityButton = screen.getByLabelText('New Community')
      fireEvent.click(newCommunityButton)

      expect(mockNavigate).toHaveBeenCalledWith('/create-community')
    })

    it('should navigate to /chat when Direct Message is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const directMessageButton = screen.getByLabelText('Direct Message')
      fireEvent.click(directMessageButton)

      expect(mockNavigate).toHaveBeenCalledWith('/chat')
    })

    it('should navigate to /users when Find Friends is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const findFriendsButton = screen.getByLabelText('Find Friends')
      fireEvent.click(findFriendsButton)

      expect(mockNavigate).toHaveBeenCalledWith('/users')
    })

    it('should close menu after action is clicked', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const createPostButton = screen.getByLabelText('Create Post')
      fireEvent.click(createPostButton)

      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('should render correct icon for each action', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument()
      expect(screen.getByTestId('message-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('should display action labels', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByText('Create Post')).toBeInTheDocument()
      expect(screen.getByText('New Community')).toBeInTheDocument()
      expect(screen.getByText('Direct Message')).toBeInTheDocument()
      expect(screen.getByText('Find Friends')).toBeInTheDocument()
    })

    it('should display action descriptions', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByText('Share your thoughts')).toBeInTheDocument()
      expect(screen.getByText('Start a community')).toBeInTheDocument()
      expect(screen.getByText('Send a message')).toBeInTheDocument()
      expect(screen.getByText('Connect with others')).toBeInTheDocument()
    })
  })

  describe('Scroll Behavior', () => {
    it('should hide FAB when scrolling down past 100px', async () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild

      Object.defineProperty(window, 'scrollY', { value: 150, writable: true })
      fireEvent.scroll(window)

      await waitFor(() => {
        expect(fabContainer.className).toContain('translate-y-16')
        expect(fabContainer.className).toContain('opacity-0')
      })
    })

    it('should show FAB when scrolling up', async () => {
      const { container, rerender } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild

      Object.defineProperty(window, 'scrollY', { value: 150, writable: true })
      fireEvent.scroll(window)

      await waitFor(() => {
        expect(fabContainer.className).toContain('opacity-0')
      })

      Object.defineProperty(window, 'scrollY', { value: 50, writable: true })
      fireEvent.scroll(window)

      await waitFor(() => {
        expect(fabContainer.className).toContain('translate-y-0')
        expect(fabContainer.className).toContain('opacity-100')
      })
    })

    it('should not hide FAB when scrolling down less than 100px', async () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild

      Object.defineProperty(window, 'scrollY', { value: 50, writable: true })
      fireEvent.scroll(window)

      await waitFor(() => {
        expect(fabContainer.className).toContain('translate-y-0')
        expect(fabContainer.className).toContain('opacity-100')
      })
    })

    it('should clean up scroll listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<FloatingActionButton />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('should add scroll listener with passive option', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      render(<FloatingActionButton />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })
  })

  describe('Route Change Behavior', () => {
    it('should close expanded menu when route changes', () => {
      const { rerender } = render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByLabelText('Close menu')).toBeInTheDocument()

      mockUseLocation.mockReturnValue({ pathname: '/different-path' })
      rerender(<FloatingActionButton />)

      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
    })

    it('should keep menu closed if already closed on route change', () => {
      const { rerender } = render(<FloatingActionButton />)

      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()

      mockUseLocation.mockReturnValue({ pathname: '/different-path' })
      rerender(<FloatingActionButton />)

      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
    })
  })

  describe('Visual Effects', () => {
    it('should render sparkle effect element', () => {
      const { container } = render(<FloatingActionButton />)
      const sparkleEffect = container.querySelector('.')
      expect(sparkleEffect).toBeInTheDocument()
    })

    it('should render glow effect element', () => {
      const { container } = render(<FloatingActionButton />)
      const glowEffect = container.querySelector('.blur-lg')
      expect(glowEffect).toBeInTheDocument()
    })

    it('should apply gradient classes to main button', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      expect(fabButton.className).toContain('bg-gradient-to-r')
      expect(fabButton.className).toContain('from-blue-9')
      expect(fabButton.className).toContain('to-violet-9')
    })

    it('should apply correct gradient to Create Post action', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const createPostButton = screen.getByLabelText('Create Post')
      expect(createPostButton.className).toContain('from-blue-500')
      expect(createPostButton.className).toContain('to-blue-600')
    })

    it('should apply correct gradient to New Community action', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const newCommunityButton = screen.getByLabelText('New Community')
      expect(newCommunityButton.className).toContain('from-green-500')
      expect(newCommunityButton.className).toContain('to-green-600')
    })

    it('should apply correct gradient to Direct Message action', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const directMessageButton = screen.getByLabelText('Direct Message')
      expect(directMessageButton.className).toContain('from-purple-500')
      expect(directMessageButton.className).toContain('to-purple-600')
    })

    it('should apply correct gradient to Find Friends action', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const findFriendsButton = screen.getByLabelText('Find Friends')
      expect(findFriendsButton.className).toContain('from-orange-500')
      expect(findFriendsButton.className).toContain('to-orange-600')
    })

    it('should apply animation delay to action items', () => {
      const { container } = render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const actionItems = container.querySelectorAll('.animate-in')
      expect(actionItems[0].style.animationDelay).toBe('0ms')
      expect(actionItems[1].style.animationDelay).toBe('100ms')
      expect(actionItems[2].style.animationDelay).toBe('200ms')
      expect(actionItems[3].style.animationDelay).toBe('300ms')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on main button', () => {
      render(<FloatingActionButton />)
      expect(screen.getByLabelText('Quick actions')).toBeInTheDocument()
    })

    it('should update aria-label when expanded', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
    })

    it('should have proper aria-labels on all action buttons', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      expect(screen.getByLabelText('Create Post')).toBeInTheDocument()
      expect(screen.getByLabelText('New Community')).toBeInTheDocument()
      expect(screen.getByLabelText('Direct Message')).toBeInTheDocument()
      expect(screen.getByLabelText('Find Friends')).toBeInTheDocument()
    })

    it('should render action buttons as button elements', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')
      fireEvent.click(fabButton)

      const createPostButton = screen.getByLabelText('Create Post')
      expect(createPostButton.tagName).toBe('BUTTON')
    })

    it('should be keyboard accessible', () => {
      render(<FloatingActionButton />)
      const fabButton = screen.getByLabelText('Quick actions')

      fabButton.focus()
      expect(document.activeElement).toBe(fabButton)
    })
  })

  describe('Responsive Behavior', () => {
    it('should apply lg:bottom-6 class for desktop positioning', () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild
      expect(fabContainer.className).toContain('lg:bottom-6')
    })

    it('should apply bottom-20 class for mobile positioning', () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild
      expect(fabContainer.className).toContain('bottom-20')
    })

    it('should maintain z-40 for proper layering', () => {
      const { container } = render(<FloatingActionButton />)
      const fabContainer = container.firstChild
      expect(fabContainer.className).toContain('z-40')
    })
  })
})

export default actual
