import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import FollowButton from './FollowButton'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

vi.mock('../../services/socialService')
vi.mock('../../contexts/AuthContext')
vi.mock('../ui/useToast')
vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, disabled, loading, leftIcon, variant, size, className }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-loading={loading}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {leftIcon}
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, disabled, variant, size, className, 'aria-label': ariaLabel }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}))
vi.mock('../ui/Card', () => ({
  Card: ({ children, variant, padding, className, onClick }) => (
    <div
      data-variant={variant}
      data-padding={padding}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  )
}))

describe('FollowButton', () => {
  const mockShowToast = vi.fn()
  const mockCurrentUser = { id: 'current-user-id' }
  const mockTargetUserId = 'target-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockCurrentUser })
    useToast.mockReturnValue({ showToast: mockShowToast })
  })

  describe('Rendering and Visibility', () => {
    it('should not render when userId matches current user id', () => {
      const { container } = render(
        <FollowButton userId={mockCurrentUser.id} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should not render when userId is not provided', () => {
      const { container } = render(<FollowButton userId={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render when current user is not authenticated', () => {
      useAuth.mockReturnValue({ user: null })
      const { container } = render(<FollowButton userId={mockTargetUserId} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render follow button when userId is different from current user', () => {
      render(<FollowButton userId={mockTargetUserId} />)
      expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument()
    })

    it('should render blocked button when user is blocked', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isBlocked: true }}
        />
      )
      expect(screen.getByRole('button', { name: /blocked/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /blocked/i })).toBeDisabled()
    })

    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <FollowButton userId={mockTargetUserId} className="custom-class" />
      )
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Initial State', () => {
    it('should show "Follow" button by default', () => {
      render(<FollowButton userId={mockTargetUserId} />)
      expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument()
    })

    it('should initialize with provided initialState', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )
      expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
    })

    it('should fetch relationship status when no initialState provided', async () => {
      socialService.getRelationshipStatus.mockResolvedValue({
        isFollowing: false,
        isFollower: true,
        isFriend: false,
        isBlocked: false,
        hasPendingRequest: false,
        mutualCount: 0
      })

      render(<FollowButton userId={mockTargetUserId} />)

      await waitFor(() => {
        expect(socialService.getRelationshipStatus).toHaveBeenCalledWith(mockTargetUserId)
      })
    })

    it('should not fetch relationship status when initialState is provided', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )
      expect(socialService.getRelationshipStatus).not.toHaveBeenCalled()
    })
  })

  describe('Button States and Text', () => {
    it('should show "Follow" when not following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false, isFollower: false }}
        />
      )
      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
    })

    it('should show "Follow Back" when user is a follower', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false, isFollower: true }}
        />
      )
      expect(screen.getByRole('button', { name: /follow back/i })).toBeInTheDocument()
    })

    it('should show "Following" when already following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )
      expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
    })

    it('should show "Friends" when users are friends', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: true }}
        />
      )
      expect(screen.getByRole('button', { name: /friends/i })).toBeInTheDocument()
    })

    it('should show "Pending" when there is a pending friend request', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ hasPendingRequest: true }}
        />
      )
      expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument()
    })

    it('should show "" during initial fetch', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ loading: true }}
        />
      )
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument()
    })

    it('should show "Following..." during optimistic follow update', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      expect(screen.getByRole('button', { name: /following\.\.\./i })).toBeInTheDocument()
    })

    it('should show "Unfollowing..." during optimistic unfollow update', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      expect(screen.getByRole('button', { name: /unfollowing\.\.\./i })).toBeInTheDocument()
    })
  })

  describe('Follow Functionality', () => {
    it('should successfully follow a user', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(socialService.followUser).toHaveBeenCalledWith(mockTargetUserId)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
      })

      expect(mockShowToast).toHaveBeenCalledWith('Started following user', 'success')
    })

    it('should not follow when user is not authenticated', async () => {
      const user = userEvent.setup()
      useAuth.mockReturnValue({ user: null })

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /follow/i })
      await user.click(followButton)

      expect(socialService.followUser).not.toHaveBeenCalled()
    })

    it('should not follow when button is disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
          disabled={true}
        />
      )

      const followButton = screen.getByRole('button', { name: /follow/i })
      await user.click(followButton)

      expect(socialService.followUser).not.toHaveBeenCalled()
    })

    it('should handle follow error and show error toast', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to follow user', 'error')
      })
    })

    it('should revert optimistic update on follow failure', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
      })
    })
  })

  describe('Unfollow Functionality', () => {
    it('should successfully unfollow a user', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      await waitFor(() => {
        expect(socialService.unfollowUser).toHaveBeenCalledWith(mockTargetUserId)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
      })

      expect(mockShowToast).toHaveBeenCalledWith('Unfollowed user', 'success')
    })

    it('should unfollow when users are friends', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: true }}
        />
      )

      const friendsButton = screen.getByRole('button', { name: /friends/i })
      await user.click(friendsButton)

      await waitFor(() => {
        expect(socialService.unfollowUser).toHaveBeenCalledWith(mockTargetUserId)
      })
    })

    it('should not unfollow when user is not authenticated', async () => {
      const user = userEvent.setup()
      useAuth.mockReturnValue({ user: null })

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      expect(socialService.unfollowUser).not.toHaveBeenCalled()
    })

    it('should not unfollow when button is disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
          disabled={true}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      expect(socialService.unfollowUser).not.toHaveBeenCalled()
    })

    it('should handle unfollow error and show error toast', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to unfollow user', 'error')
      })
    })

    it('should revert optimistic update on unfollow failure', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should disable button during loading', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ loading: true }}
        />
      )

      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
    })

    it('should disable button during optimistic update', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      const loadingButton = screen.getByRole('button', { name: /following\.\.\./i })
      expect(loadingButton).toBeDisabled()
    })

    it('should show loading attribute on button', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ loading: true }}
        />
      )

      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toHaveAttribute('data-loading', 'true')
    })

    it('should not prevent multiple clicks during loading', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)
      await user.click(followButton)
      await user.click(followButton)

      await waitFor(() => {
        expect(socialService.followUser).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Dropdown Menu', () => {
    it('should render dropdown button when showDropdown is true', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      expect(screen.getByRole('button', { name: /more options/i })).toBeInTheDocument()
    })

    it('should not render dropdown button when showDropdown is false', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={false}
        />
      )

      expect(screen.queryByRole('button', { name: /more options/i })).not.toBeInTheDocument()
    })

    it('should open dropdown menu when dropdown button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should close dropdown menu when dropdown button is clicked again', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)
      await user.click(dropdownButton)

      expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    })

    it('should show "Send Friend Request" option when not friends', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false, hasPendingRequest: false }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.getByText('Send Friend Request')).toBeInTheDocument()
    })

    it('should not show "Send Friend Request" when already friends', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: true }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.queryByText('Send Friend Request')).not.toBeInTheDocument()
    })

    it('should not show "Send Friend Request" when request is pending', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ hasPendingRequest: true }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.queryByText('Send Friend Request')).not.toBeInTheDocument()
    })

    it('should show mutual count in dropdown when available', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ mutualCount: 5 }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.getByText('5 mutual')).toBeInTheDocument()
    })

    it('should not show mutual count when zero', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ mutualCount: 0 }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      expect(screen.queryByText(/mutual/i)).not.toBeInTheDocument()
    })

    it('should not show dropdown button during loading', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ loading: true }}
          showDropdown={true}
        />
      )

      expect(screen.queryByRole('button', { name: /more options/i })).not.toBeInTheDocument()
    })

    it('should disable dropdown button when disabled prop is true', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
          disabled={true}
        />
      )

      expect(screen.getByRole('button', { name: /more options/i })).toBeDisabled()
    })
  })

  describe('Friend Request Functionality', () => {
    it('should successfully send friend request', async () => {
      const user = userEvent.setup()
      socialService.sendFriendRequest.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      await waitFor(() => {
        expect(socialService.sendFriendRequest).toHaveBeenCalledWith(mockTargetUserId)
      })

      expect(mockShowToast).toHaveBeenCalledWith('Friend request sent', 'success')
    })

    it('should close dropdown after sending friend request', async () => {
      const user = userEvent.setup()
      socialService.sendFriendRequest.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      await waitFor(() => {
        expect(screen.queryByText('Actions')).not.toBeInTheDocument()
      })
    })

    it('should handle friend request error', async () => {
      const user = userEvent.setup()
      socialService.sendFriendRequest.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to send friend request', 'error')
      })
    })

    it('should not send friend request when disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false }}
          showDropdown={true}
          disabled={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      expect(socialService.sendFriendRequest).not.toHaveBeenCalled()
    })

    it('should not send friend request when user is not authenticated', async () => {
      const user = userEvent.setup()
      useAuth.mockReturnValue({ user: null })

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: false }}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      expect(socialService.sendFriendRequest).not.toHaveBeenCalled()
    })
  })

  describe('Block User Functionality', () => {
    it('should successfully block a user', async () => {
      const user = userEvent.setup()
      socialService.blockUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      await waitFor(() => {
        expect(socialService.blockUser).toHaveBeenCalledWith(mockTargetUserId)
      })

      expect(mockShowToast).toHaveBeenCalledWith('User blocked', 'success')
    })

    it('should close dropdown after blocking user', async () => {
      const user = userEvent.setup()
      socialService.blockUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      await waitFor(() => {
        expect(screen.queryByText('Actions')).not.toBeInTheDocument()
      })
    })

    it('should handle block user error', async () => {
      const user = userEvent.setup()
      socialService.blockUser.mockRejectedValue(new Error('Network error'))

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to block user', 'error')
      })
    })

    it('should not block user when disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
          disabled={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      expect(socialService.blockUser).not.toHaveBeenCalled()
    })

    it('should not block user when user is not authenticated', async () => {
      const user = userEvent.setup()
      useAuth.mockReturnValue({ user: null })

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      expect(socialService.blockUser).not.toHaveBeenCalled()
    })
  })

  describe('Size Variants', () => {
    it('should render with small size', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          size="small"
        />
      )

      const button = screen.getByRole('button', { name: /follow/i })
      expect(button).toHaveAttribute('data-size', 'small')
    })

    it('should render with medium size by default', () => {
      render(<FollowButton userId={mockTargetUserId} />)

      const button = screen.getByRole('button', { name: /follow/i })
      expect(button).toHaveAttribute('data-size', 'medium')
    })

    it('should render with large size', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          size="large"
        />
      )

      const button = screen.getByRole('button', { name: /follow/i })
      expect(button).toHaveAttribute('data-size', 'large')
    })
  })

  describe('Button Variants', () => {
    it('should use primary variant when not following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
          variant="default"
        />
      )

      const button = screen.getByRole('button', { name: /follow/i })
      expect(button).toHaveAttribute('data-variant', 'primary')
    })

    it('should use secondary variant when following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const button = screen.getByRole('button', { name: /following/i })
      expect(button).toHaveAttribute('data-variant', 'secondary')
    })

    it('should use secondary variant when friends', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFriend: true }}
        />
      )

      const button = screen.getByRole('button', { name: /friends/i })
      expect(button).toHaveAttribute('data-variant', 'secondary')
    })

    it('should use custom variant when not following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
          variant="outline"
        />
      )

      const button = screen.getByRole('button', { name: /follow/i })
      expect(button).toHaveAttribute('data-variant', 'outline')
    })
  })

  describe('Follower Badge', () => {
    it('should show "Follows you" badge when user is follower but not following back', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollower: true, isFollowing: false }}
        />
      )

      expect(screen.getByText('Follows you')).toBeInTheDocument()
    })

    it('should not show "Follows you" badge when already following', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollower: true, isFollowing: true }}
        />
      )

      expect(screen.queryByText('Follows you')).not.toBeInTheDocument()
    })

    it('should not show "Follows you" badge when user is not follower', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollower: false, isFollowing: false }}
        />
      )

      expect(screen.queryByText('Follows you')).not.toBeInTheDocument()
    })
  })

  describe('State Change Callback', () => {
    it('should call onStateChange when relationship state changes', async () => {
      const onStateChange = vi.fn()
      const user = userEvent.setup()
      socialService.followUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
          onStateChange={onStateChange}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalled()
      })
    })

    it('should not call onStateChange when callback is not provided', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockResolvedValue({})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(socialService.followUser).toHaveBeenCalled()
      })
    })

    it('should call onStateChange with current state', () => {
      const onStateChange = vi.fn()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true, mutualCount: 3 }}
          onStateChange={onStateChange}
        />
      )

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isFollowing: true,
          mutualCount: 3
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle network error during relationship status fetch', async () => {
      socialService.getRelationshipStatus.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<FollowButton userId={mockTargetUserId} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching relationship status:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should log follow error to console', async () => {
      const user = userEvent.setup()
      socialService.followUser.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
        />
      )

      const followButton = screen.getByRole('button', { name: /^follow$/i })
      await user.click(followButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error following user:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should log unfollow error to console', async () => {
      const user = userEvent.setup()
      socialService.unfollowUser.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error unfollowing user:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should log friend request error to console', async () => {
      const user = userEvent.setup()
      socialService.sendFriendRequest.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const friendRequestButton = screen.getByText('Send Friend Request')
      await user.click(friendRequestButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error sending friend request:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should log block user error to console', async () => {
      const user = userEvent.setup()
      socialService.blockUser.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <FollowButton
          userId={mockTargetUserId}
          showDropdown={true}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more options/i })
      await user.click(dropdownButton)

      const blockButton = screen.getByText('Block User')
      await user.click(blockButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error blocking user:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(
        <FollowButton
          userId={mockTargetUserId}
          disabled={true}
          showDropdown={true}
        />
      )

      expect(screen.getByRole('button', { name: /follow/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /more options/i })).toBeDisabled()
    })

    it('should prevent follow action when disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: false }}
          disabled={true}
        />
      )

      const followButton = screen.getByRole('button', { name: /follow/i })
      await user.click(followButton)

      expect(socialService.followUser).not.toHaveBeenCalled()
    })

    it('should prevent unfollow action when disabled', async () => {
      const user = userEvent.setup()

      render(
        <FollowButton
          userId={mockTargetUserId}
          initialState={{ isFollowing: true }}
          disabled={true}
        />
      )

      const unfollowButton = screen.getByRole('button', { name: /following/i })
      await user.click(unfollowButton)

      expect(socialService.unfollowUser).not.toHaveBeenCalled()
    })
  })
})

export default mockShowToast
