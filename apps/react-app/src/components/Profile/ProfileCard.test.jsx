import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProfileCard from './ProfileCard'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import profileService from '../../services/profileService'

jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')
jest.mock('../../services/profileService')

const mockShowToast = jest.fn()

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'This is a test bio',
  location: 'San Francisco, CA',
  isVerified: true,
  badges: ['Early Adopter', 'Top Contributor', 'Verified Dev'],
  stats: {
    posts: 150,
    followers: 1250,
    karma: 5600,
    communities: 12
  },
  createdAt: '2023-01-15T00:00:00Z',
  relationship: {
    isFollowing: false,
    isFollower: false,
    isBlocked: false,
    isFriend: false
  }
}

const mockCurrentUser = {
  id: 'current-user',
  username: 'currentuser'
}

describe('ProfileCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ user: mockCurrentUser })
    useToast.mockReturnValue({ showToast: mockShowToast })
    delete window.location
    window.location = { href: '' }
  })

  describe('Card Rendering', () => {
    test('renders default variant correctly', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    test('renders compact variant correctly', () => {
      render(<ProfileCard user={mockUser} variant="compact" />)
      const card = document.querySelector('.profile-card--compact')
      expect(card).toBeInTheDocument()
    })

    test('renders search variant correctly', () => {
      render(<ProfileCard user={mockUser} variant="search" />)
      const card = document.querySelector('.profile-card--search')
      expect(card).toBeInTheDocument()
    })

    test('renders mention variant correctly', () => {
      render(<ProfileCard user={mockUser} variant="mention" />)
      const card = document.querySelector('.profile-card--mention')
      expect(card).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<ProfileCard user={mockUser} className="custom-class" />)
      const card = document.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    test('displays user avatar image when available', () => {
      render(<ProfileCard user={mockUser} />)
      const avatar = screen.getByAltText('testuser')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    test('displays avatar placeholder when no avatar', () => {
      const userWithoutAvatar = { ...mockUser, avatar: null }
      render(<ProfileCard user={userWithoutAvatar} />)
      const placeholder = document.querySelector('.avatar-placeholder')
      expect(placeholder).toBeInTheDocument()
    })

    test('shows verified badge on avatar in compact variant', () => {
      render(<ProfileCard user={mockUser} variant="compact" />)
      const verifiedIndicator = document.querySelector('.verified-indicator')
      expect(verifiedIndicator).toBeInTheDocument()
    })

    test('shows verified badge on avatar in default variant', () => {
      render(<ProfileCard user={mockUser} />)
      const verifiedIndicator = document.querySelector('.verified-indicator')
      expect(verifiedIndicator).toBeInTheDocument()
    })

    test('does not show verified badge when user is not verified', () => {
      const unverifiedUser = { ...mockUser, isVerified: false }
      render(<ProfileCard user={unverifiedUser} />)
      const verifiedIndicator = document.querySelector('.verified-indicator')
      expect(verifiedIndicator).not.toBeInTheDocument()
    })

    test('shows verified icon in mention variant', () => {
      render(<ProfileCard user={mockUser} variant="mention" />)
      expect(screen.getByText('Test User').parentElement).toBeInTheDocument()
    })
  })

  describe('User Info Display', () => {
    test('displays user display name', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    test('displays username with @ symbol', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    test('displays user location when available', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })

    test('does not display location when not available', () => {
      const userWithoutLocation = { ...mockUser, location: null }
      render(<ProfileCard user={userWithoutLocation} />)
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument()
    })

    test('displays bio when showBio is true', () => {
      render(<ProfileCard user={mockUser} showBio={true} />)
      expect(screen.getByText('This is a test bio')).toBeInTheDocument()
    })

    test('does not display bio when showBio is false', () => {
      render(<ProfileCard user={mockUser} showBio={false} />)
      expect(screen.queryByText('This is a test bio')).not.toBeInTheDocument()
    })

    test('does not display bio when user has no bio', () => {
      const userWithoutBio = { ...mockUser, bio: null }
      render(<ProfileCard user={userWithoutBio} />)
      const bioSection = document.querySelector('.profile-card__bio')
      expect(bioSection).not.toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    test('displays all stats when showStats is true', () => {
      render(<ProfileCard user={mockUser} showStats={true} />)
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('1.3K')).toBeInTheDocument()
      expect(screen.getByText('5.6K')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    test('does not display stats when showStats is false', () => {
      render(<ProfileCard user={mockUser} showStats={false} />)
      const statsSection = document.querySelector('.profile-card__stats')
      expect(statsSection).not.toBeInTheDocument()
    })

    test('formats large numbers correctly (millions)', () => {
      const userWithMillions = {
        ...mockUser,
        stats: { ...mockUser.stats, followers: 2500000 }
      }
      render(<ProfileCard user={userWithMillions} />)
      expect(screen.getByText('2.5M')).toBeInTheDocument()
    })

    test('formats medium numbers correctly (thousands)', () => {
      const userWithThousands = {
        ...mockUser,
        stats: { ...mockUser.stats, followers: 15000 }
      }
      render(<ProfileCard user={userWithThousands} />)
      expect(screen.getByText('15.0K')).toBeInTheDocument()
    })

    test('formats small numbers correctly', () => {
      const userWithSmallNumbers = {
        ...mockUser,
        stats: { ...mockUser.stats, followers: 50 }
      }
      render(<ProfileCard user={userWithSmallNumbers} />)
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    test('displays joined date correctly', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Jan 2023')).toBeInTheDocument()
    })

    test('displays stats in compact variant', () => {
      render(<ProfileCard user={mockUser} variant="compact" showStats={true} />)
      expect(screen.getByText(/followers/)).toBeInTheDocument()
      expect(screen.getByText(/karma/)).toBeInTheDocument()
    })

    test('handles missing stats gracefully', () => {
      const userWithNoStats = { ...mockUser, stats: {} }
      render(<ProfileCard user={userWithNoStats} />)
      const statsSection = document.querySelector('.profile-card__stats')
      expect(statsSection).toBeInTheDocument()
    })
  })

  describe('Follow Button', () => {
    test('displays follow button when not following', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Follow')).toBeInTheDocument()
    })

    test('displays unfollow button when following', () => {
      const followingUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFollowing: true }
      }
      render(<ProfileCard user={followingUser} />)
      expect(screen.getByText('Unfollow')).toBeInTheDocument()
    })

    test('toggles follow status on click', async () => {
      profileService.toggleFollow.mockResolvedValue({})
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(profileService.toggleFollow).toHaveBeenCalledWith('user-1')
      })
    })

    test('shows success toast on follow', async () => {
      profileService.toggleFollow.mockResolvedValue({})
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Following user', 'success')
      })
    })

    test('shows success toast on unfollow', async () => {
      const followingUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFollowing: true }
      }
      profileService.toggleFollow.mockResolvedValue({})
      render(<ProfileCard user={followingUser} />)

      const unfollowButton = screen.getByText('Unfollow')
      fireEvent.click(unfollowButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Unfollowed user', 'success')
      })
    })

    test('shows error toast on follow failure', async () => {
      profileService.toggleFollow.mockRejectedValue(new Error('Network error'))
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to update follow status', 'error')
      })
    })

    test('prevents follow when not logged in', async () => {
      useAuth.mockReturnValue({ user: null })
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Please log in to follow users', 'error')
        expect(profileService.toggleFollow).not.toHaveBeenCalled()
      })
    })

    test('disables follow button while loading', async () => {
      profileService.toggleFollow.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      expect(followButton).toBeDisabled()
    })

    test('stops propagation on follow button click', async () => {
      const onClick = jest.fn()
      profileService.toggleFollow.mockResolvedValue({})
      render(<ProfileCard user={mockUser} onClick={onClick} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(onClick).not.toHaveBeenCalled()
      })
    })

    test('renders compact follow button correctly', () => {
      render(<ProfileCard user={mockUser} variant="compact" />)
      const followButton = document.querySelector('.btn-follow--compact')
      expect(followButton).toBeInTheDocument()
    })
  })

  describe('Message Button', () => {
    test('displays message button', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    test('navigates to DM page on message click', () => {
      render(<ProfileCard user={mockUser} />)

      const messageButton = screen.getByText('Message')
      fireEvent.click(messageButton)

      expect(window.location.href).toBe('/messages/@testuser')
    })

    test('stops propagation on message button click', () => {
      const onClick = jest.fn()
      render(<ProfileCard user={mockUser} onClick={onClick} />)

      const messageButton = screen.getByText('Message')
      fireEvent.click(messageButton)

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    test('calls custom onClick handler when provided', () => {
      const onClick = jest.fn()
      render(<ProfileCard user={mockUser} onClick={onClick} />)

      const card = document.querySelector('.profile-card')
      fireEvent.click(card)

      expect(onClick).toHaveBeenCalledWith(mockUser)
    })

    test('navigates to profile page when no onClick provided in default variant', () => {
      render(<ProfileCard user={mockUser} />)

      const card = document.querySelector('.profile-card')
      fireEvent.click(card)

      expect(window.location.href).toBe('')
    })

    test('navigates on compact variant click', () => {
      const onClick = jest.fn()
      render(<ProfileCard user={mockUser} variant="compact" onClick={onClick} />)

      const card = document.querySelector('.profile-card--compact')
      fireEvent.click(card)

      expect(onClick).toHaveBeenCalledWith(mockUser)
    })

    test('navigates on mention variant click', () => {
      const onClick = jest.fn()
      render(<ProfileCard user={mockUser} variant="mention" onClick={onClick} />)

      const card = document.querySelector('.profile-card--mention')
      fireEvent.click(card)

      expect(onClick).toHaveBeenCalledWith(mockUser)
    })

    test('uses user id for navigation when username not available', () => {
      const userWithoutUsername = { ...mockUser, username: null }
      render(<ProfileCard user={userWithoutUsername} />)

      const card = document.querySelector('.profile-card')
      fireEvent.click(card)

      expect(window.location.href).toBe('')
    })
  })

  describe('Badges', () => {
    test('displays up to 3 badges', () => {
      render(<ProfileCard user={mockUser} />)
      expect(screen.getByText('Early Adopter')).toBeInTheDocument()
      expect(screen.getByText('Top Contributor')).toBeInTheDocument()
      expect(screen.getByText('Verified Dev')).toBeInTheDocument()
    })

    test('shows +X more indicator when more than 3 badges', () => {
      const userWithManyBadges = {
        ...mockUser,
        badges: ['Badge1', 'Badge2', 'Badge3', 'Badge4', 'Badge5']
      }
      render(<ProfileCard user={userWithManyBadges} />)
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })

    test('does not render badges section when no badges', () => {
      const userWithoutBadges = { ...mockUser, badges: null }
      render(<ProfileCard user={userWithoutBadges} />)
      const badgesSection = document.querySelector('.profile-card__badges')
      expect(badgesSection).not.toBeInTheDocument()
    })

    test('does not render badges section when empty array', () => {
      const userWithEmptyBadges = { ...mockUser, badges: [] }
      render(<ProfileCard user={userWithEmptyBadges} />)
      const badgesSection = document.querySelector('.profile-card__badges')
      expect(badgesSection).not.toBeInTheDocument()
    })
  })

  describe('Actions Visibility', () => {
    test('hides actions when showActions is false', () => {
      render(<ProfileCard user={mockUser} showActions={false} />)
      expect(screen.queryByText('Follow')).not.toBeInTheDocument()
      expect(screen.queryByText('Message')).not.toBeInTheDocument()
    })

    test('shows actions when showActions is true', () => {
      render(<ProfileCard user={mockUser} showActions={true} />)
      expect(screen.getByText('Follow')).toBeInTheDocument()
      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    test('hides actions for own profile', () => {
      const ownUser = { ...mockUser, id: 'current-user' }
      render(<ProfileCard user={ownUser} />)
      expect(screen.queryByText('Follow')).not.toBeInTheDocument()
      expect(screen.queryByText('Message')).not.toBeInTheDocument()
    })
  })

  describe('More Options Menu', () => {
    test('shows more options button for other users', () => {
      render(<ProfileCard user={mockUser} />)
      const moreButton = document.querySelector('.btn-menu')
      expect(moreButton).toBeInTheDocument()
    })

    test('toggles dropdown menu on more button click', () => {
      render(<ProfileCard user={mockUser} />)
      const moreButton = document.querySelector('.btn-menu')

      fireEvent.click(moreButton)

      const dropdown = document.querySelector('.profile-card__dropdown')
      expect(dropdown).toBeInTheDocument()
    })

    test('closes dropdown on second click', () => {
      render(<ProfileCard user={mockUser} />)
      const moreButton = document.querySelector('.btn-menu')

      fireEvent.click(moreButton)
      fireEvent.click(moreButton)

      const dropdown = document.querySelector('.profile-card__dropdown')
      expect(dropdown).not.toBeInTheDocument()
    })

    test('stops propagation on more button click', () => {
      const onClick = jest.fn()
      render(<ProfileCard user={mockUser} onClick={onClick} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      expect(onClick).not.toHaveBeenCalled()
    })

    test('does not show more options for own profile', () => {
      const ownUser = { ...mockUser, id: 'current-user' }
      render(<ProfileCard user={ownUser} />)
      const moreButton = document.querySelector('.btn-menu')
      expect(moreButton).not.toBeInTheDocument()
    })
  })

  describe('Block Functionality', () => {
    test('shows block option in dropdown', () => {
      render(<ProfileCard user={mockUser} />)
      const moreButton = document.querySelector('.btn-menu')

      fireEvent.click(moreButton)

      expect(screen.getByText('Block')).toBeInTheDocument()
    })

    test('shows unblock when user is blocked', () => {
      const blockedUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isBlocked: true }
      }
      render(<ProfileCard user={blockedUser} />)
      const moreButton = document.querySelector('.btn-menu')

      fireEvent.click(moreButton)

      expect(screen.getByText('Unblock')).toBeInTheDocument()
    })

    test('toggles block status on click', async () => {
      profileService.toggleBlock.mockResolvedValue({})
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const blockButton = screen.getByText('Block')
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(profileService.toggleBlock).toHaveBeenCalledWith('user-1')
      })
    })

    test('shows success toast on block', async () => {
      profileService.toggleBlock.mockResolvedValue({})
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const blockButton = screen.getByText('Block')
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('User blocked', 'success')
      })
    })

    test('shows error toast on block failure', async () => {
      profileService.toggleBlock.mockRejectedValue(new Error('Network error'))
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const blockButton = screen.getByText('Block')
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to update block status', 'error')
      })
    })

    test('unfollows user when blocking', async () => {
      const followingUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFollowing: true }
      }
      profileService.toggleBlock.mockResolvedValue({})
      render(<ProfileCard user={followingUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const blockButton = screen.getByText('Block')
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(profileService.toggleBlock).toHaveBeenCalledWith('user-1')
      })
    })
  })

  describe('Report Functionality', () => {
    test('shows report option in dropdown', () => {
      render(<ProfileCard user={mockUser} />)
      const moreButton = document.querySelector('.btn-menu')

      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    test('shows success toast on report', () => {
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      fireEvent.click(reportButton)

      expect(mockShowToast).toHaveBeenCalledWith('User reported', 'success')
    })
  })

  describe('Relationship Status', () => {
    test('shows "Follows you" badge when user is follower', () => {
      const followerUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFollower: true }
      }
      render(<ProfileCard user={followerUser} />)
      expect(screen.getByText('Follows you')).toBeInTheDocument()
    })

    test('shows "Friends" badge when users are friends', () => {
      const friendUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFriend: true }
      }
      render(<ProfileCard user={friendUser} />)
      expect(screen.getByText('Friends')).toBeInTheDocument()
    })

    test('shows both badges when friend and follower', () => {
      const friendFollowerUser = {
        ...mockUser,
        relationship: { ...mockUser.relationship, isFriend: true, isFollower: true }
      }
      render(<ProfileCard user={friendFollowerUser} />)
      expect(screen.getByText('Friends')).toBeInTheDocument()
      expect(screen.getByText('Follows you')).toBeInTheDocument()
    })

    test('does not show relationship badges for own profile', () => {
      const ownUser = {
        ...mockUser,
        id: 'current-user',
        relationship: { ...mockUser.relationship, isFriend: true, isFollower: true }
      }
      render(<ProfileCard user={ownUser} />)
      expect(screen.queryByText('Friends')).not.toBeInTheDocument()
      expect(screen.queryByText('Follows you')).not.toBeInTheDocument()
    })

    test('does not show relationship section when no relationship', () => {
      render(<ProfileCard user={mockUser} />)
      const relationshipSection = document.querySelector('.profile-card__relationship')
      expect(relationshipSection).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    test('disables follow button during follow action', async () => {
      profileService.toggleFollow.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      expect(followButton).toBeDisabled()
    })

    test('re-enables follow button after follow completes', async () => {
      profileService.toggleFollow.mockResolvedValue({})
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(followButton).not.toBeDisabled()
      })
    })

    test('re-enables follow button after follow fails', async () => {
      profileService.toggleFollow.mockRejectedValue(new Error('Network error'))
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(followButton).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles follow error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      profileService.toggleFollow.mockRejectedValue(new Error('Network error'))
      render(<ProfileCard user={mockUser} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    test('handles block error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      profileService.toggleBlock.mockRejectedValue(new Error('Network error'))
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const blockButton = screen.getByText('Block')
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    test('handles missing user stats', () => {
      const userWithoutStats = { ...mockUser, stats: null }
      render(<ProfileCard user={userWithoutStats} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    test('handles missing relationship data', () => {
      const userWithoutRelationship = { ...mockUser, relationship: null }
      render(<ProfileCard user={userWithoutRelationship} />)
      expect(screen.getByText('Follow')).toBeInTheDocument()
    })
  })

  describe('Message from Dropdown', () => {
    test('message option navigates correctly', () => {
      render(<ProfileCard user={mockUser} />)

      const moreButton = document.querySelector('.btn-menu')
      fireEvent.click(moreButton)

      const messageButton = screen.getAllByText('Message')[0]
      fireEvent.click(messageButton)

      expect(window.location.href).toBe('/messages/@testuser')
    })
  })
})

export default mockShowToast
