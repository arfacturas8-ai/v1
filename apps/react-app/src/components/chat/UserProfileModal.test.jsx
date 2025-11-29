import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UserProfileModal from './UserProfileModal'

describe('UserProfileModal', () => {
  const mockOnClose = vi.fn()

  const mockUser = {
    username: 'testuser',
    displayName: 'Test User',
    avatar: '👤',
    status: 'online',
    role: 'member'
  }

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<UserProfileModal user={mockUser} isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('should not render when user is null', () => {
      render(<UserProfileModal user={null} isOpen={true} onClose={mockOnClose} />)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('should not render when user is undefined', () => {
      render(<UserProfileModal user={undefined} isOpen={true} onClose={mockOnClose} />)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('should render when both isOpen is true and user is provided', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('should render modal with correct structure', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render modal backdrop', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument()
    })

    it('should render modal content container', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const modal = container.querySelector('.bg-secondary')
      expect(modal).toBeInTheDocument()
    })

    it('should apply correct styling to modal container', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const modal = container.querySelector('.bg-secondary')
      expect(modal).toHaveClass('rounded-2xl', 'p-6', 'max-w-md', 'animate-slide-up', 'backdrop-blur-xl')
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button', { name: /close/i }) || screen.getAllByRole('button')[0]
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const backdrop = container.querySelector('.modal-backdrop')
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const modalContent = container.querySelector('.bg-secondary')
      fireEvent.click(modalContent)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should render close button with X icon', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getAllByRole('button')[0]
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('User Profile Data Display', () => {
    it('should display user displayName', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should display user username with @ prefix', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    it('should display username correctly when provided', () => {
      const user = { ...mockUser, username: 'johndoe' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('@johndoe')).toBeInTheDocument()
    })

    it('should display displayName correctly when provided', () => {
      const user = { ...mockUser, displayName: 'John Doe' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Avatar and Banner', () => {
    it('should display user avatar when provided', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('should display first letter of displayName when avatar is not provided', () => {
      const user = { ...mockUser, avatar: null }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('should display first letter of username when displayName and avatar are not provided', () => {
      const user = { ...mockUser, avatar: null, displayName: null }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('t')).toBeInTheDocument()
    })

    it('should render avatar container with correct styling', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const avatar = container.querySelector('.w-20.h-20.rounded-2xl.bg-gradient-primary')
      expect(avatar).toBeInTheDocument()
    })

    it('should render avatar with relative positioning for status indicator', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const avatarWrapper = container.querySelector('.relative')
      expect(avatarWrapper).toBeInTheDocument()
    })
  })

  describe('Activity Status', () => {
    it('should display online status', () => {
      const user = { ...mockUser, status: 'online' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('online')).toBeInTheDocument()
    })

    it('should display away status', () => {
      const user = { ...mockUser, status: 'away' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('away')).toBeInTheDocument()
    })

    it('should display busy status', () => {
      const user = { ...mockUser, status: 'busy' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('busy')).toBeInTheDocument()
    })

    it('should display offline status', () => {
      const user = { ...mockUser, status: 'offline' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('offline')).toBeInTheDocument()
    })

    it('should render online status with success color', () => {
      const user = { ...mockUser, status: 'online' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const statusIndicator = container.querySelector('.bg-success')
      expect(statusIndicator).toBeInTheDocument()
    })

    it('should render away status with warning color', () => {
      const user = { ...mockUser, status: 'away' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const statusIndicator = container.querySelector('.bg-warning')
      expect(statusIndicator).toBeInTheDocument()
    })

    it('should render busy status with error color', () => {
      const user = { ...mockUser, status: 'busy' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const statusIndicator = container.querySelector('.bg-error')
      expect(statusIndicator).toBeInTheDocument()
    })

    it('should render offline status with tertiary color', () => {
      const user = { ...mockUser, status: 'offline' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const statusIndicators = container.querySelectorAll('.bg-tertiary')
      expect(statusIndicators.length).toBeGreaterThan(0)
    })

    it('should display "Now" for last seen when user is online', () => {
      const user = { ...mockUser, status: 'online' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText(/Now/)).toBeInTheDocument()
    })

    it('should display time for last seen when user is not online', () => {
      const user = { ...mockUser, status: 'offline' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument()
    })
  })

  describe('User Roles and Badges', () => {
    it('should display admin role badge', () => {
      const user = { ...mockUser, role: 'admin' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should display moderator role badge', () => {
      const user = { ...mockUser, role: 'moderator' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Moderator')).toBeInTheDocument()
    })

    it('should display member role badge', () => {
      const user = { ...mockUser, role: 'member' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Member')).toBeInTheDocument()
    })

    it('should display member badge for unknown roles', () => {
      const user = { ...mockUser, role: 'unknown' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Member')).toBeInTheDocument()
    })

    it('should apply correct styling to admin badge', () => {
      const user = { ...mockUser, role: 'admin' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const badge = screen.getByText('Admin')
      expect(badge).toHaveClass('text-warning')
    })

    it('should apply correct styling to moderator badge', () => {
      const user = { ...mockUser, role: 'moderator' }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      const badge = screen.getByText('Moderator')
      expect(badge).toHaveClass('text-accent-cyan')
    })
  })

  describe('User Stats', () => {
    it('should display messages stat', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('127')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
    })

    it('should display reactions stat', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('Reactions')).toBeInTheDocument()
    })

    it('should display days active stat', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('Days Active')).toBeInTheDocument()
    })

    it('should render stats in a grid layout', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const statsGrid = container.querySelector('.grid.grid-cols-3')
      expect(statsGrid).toBeInTheDocument()
    })

    it('should render stats container with correct styling', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const statsContainer = container.querySelector('.grid.grid-cols-3.gap-4.p-4')
      expect(statsContainer).toBeInTheDocument()
    })
  })

  describe('Send Message Button', () => {
    it('should render send direct message button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Send Direct Message')).toBeInTheDocument()
    })

    it('should render message button with icon', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Send Direct Message').closest('button')
      expect(button).toBeInTheDocument()
    })

    it('should apply correct styling to send message button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Send Direct Message').closest('button')
      expect(button).toHaveClass('btn', 'btn-cta')
    })

    it('should render send message button as full width', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Send Direct Message').closest('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Add Friend Button', () => {
    it('should render add friend button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Add Friend')).toBeInTheDocument()
    })

    it('should render add friend button with icon', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Add Friend').closest('button')
      expect(button).toBeInTheDocument()
    })

    it('should apply correct styling to add friend button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Add Friend').closest('button')
      expect(button).toHaveClass('btn', 'btn-secondary')
    })
  })

  describe('Block User Button', () => {
    it('should render block user button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Block User')).toBeInTheDocument()
    })

    it('should apply correct styling to block user button', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const button = screen.getByText('Block User').closest('button')
      expect(button).toHaveClass('btn', 'btn-ghost')
    })

    it('should render block button in grid with add friend button', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const buttonGrid = container.querySelector('.grid.grid-cols-2')
      expect(buttonGrid).toBeInTheDocument()
    })
  })

  describe('Additional User Info', () => {
    it('should display join date', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText(/Joined: October 2024/)).toBeInTheDocument()
    })

    it('should display last seen info', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText(/Last seen:/)).toBeInTheDocument()
    })

    it('should render additional info section with border', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const infoSection = container.querySelector('.border-t.border-secondary\\/50')
      expect(infoSection).toBeInTheDocument()
    })

    it('should apply correct text styling to additional info', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      const infoText = container.querySelector('.text-xs.text-tertiary')
      expect(infoText).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with empty displayName', () => {
      const user = { ...mockUser, displayName: '' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    it('should handle user with empty username', () => {
      const user = { ...mockUser, username: '' }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should handle user with null status', () => {
      const user = { ...mockUser, status: null }
      const { container } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(container).toBeInTheDocument()
    })

    it('should handle user with null role', () => {
      const user = { ...mockUser, role: null }
      render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Member')).toBeInTheDocument()
    })

    it('should handle rapid open/close toggling', () => {
      const { rerender } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Profile')).toBeInTheDocument()

      rerender(<UserProfileModal user={mockUser} isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()

      rerender(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('should handle user object changes while modal is open', () => {
      const { rerender } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()

      const newUser = { ...mockUser, displayName: 'Updated User' }
      rerender(<UserProfileModal user={newUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Updated User')).toBeInTheDocument()
    })

    it('should handle missing onClose callback gracefully', () => {
      const { container } = render(<UserProfileModal user={mockUser} isOpen={true} onClose={undefined} />)
      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument()
    })

    it('should handle multiple status values correctly', () => {
      const statuses = ['online', 'away', 'busy', 'offline']
      statuses.forEach(status => {
        const user = { ...mockUser, status }
        const { unmount } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
        expect(screen.getByText(status)).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle multiple role values correctly', () => {
      const roles = [
        { role: 'admin', badge: 'Admin' },
        { role: 'moderator', badge: 'Moderator' },
        { role: 'member', badge: 'Member' }
      ]
      roles.forEach(({ role, badge }) => {
        const user = { ...mockUser, role }
        const { unmount } = render(<UserProfileModal user={user} isOpen={true} onClose={mockOnClose} />)
        expect(screen.getByText(badge)).toBeInTheDocument()
        unmount()
      })
    })

    it('should render all action buttons together', () => {
      render(<UserProfileModal user={mockUser} isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Send Direct Message')).toBeInTheDocument()
      expect(screen.getByText('Add Friend')).toBeInTheDocument()
      expect(screen.getByText('Block User')).toBeInTheDocument()
    })
  })
})

export default mockOnClose
