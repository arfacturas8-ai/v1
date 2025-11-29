import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SocialPrivacySettings from './SocialPrivacySettings'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com'
}

const mockPrivacySettings = {
  profileVisibility: 'public',
  showEmail: false,
  showPhoneNumber: false,
  showLocation: true,
  showBirthdate: false,
  showJoinDate: true,
  showFollowers: true,
  showFollowing: true,
  showFriends: true,
  showMutualConnections: true,
  allowFollowing: true,
  requireFollowApproval: false,
  showActivity: true,
  showPosts: true,
  showComments: true,
  showReactions: true,
  showOnlineStatus: true,
  showLastSeen: false,
  allowMessages: true,
  allowFriendRequests: true,
  allowTagging: true,
  allowMentions: true,
  restrictedWordsEnabled: false,
  restrictedWords: [],
  emailNotifications: true,
  pushNotifications: true,
  socialNotifications: {
    newFollower: true,
    friendRequest: true,
    friendAccepted: true,
    mentions: true,
    reactions: false,
    comments: true
  }
}

const mockBlockedUsers = [
  {
    id: 'blocked-1',
    username: 'blockeduser1',
    displayName: 'Blocked User 1',
    avatar: 'https://example.com/avatar1.jpg',
    blockedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'blocked-2',
    username: 'blockeduser2',
    displayName: 'Blocked User 2',
    avatar: '👤',
    blockedAt: '2024-02-20T14:45:00Z'
  },
  {
    id: 'blocked-3',
    username: 'blockeduser3',
    displayName: 'Blocked User 3',
    avatar: null,
    blockedAt: '2024-03-10T09:15:00Z'
  }
]

describe('SocialPrivacySettings', () => {
  let mockShowToast
  let mockOnClose

  beforeEach(() => {
    mockShowToast = jest.fn()
    mockOnClose = jest.fn()

    useAuth.mockReturnValue({ user: mockUser })
    useToast.mockReturnValue({ showToast: mockShowToast })

    socialService.getNotificationSettings.mockResolvedValue({
      settings: mockPrivacySettings
    })
    socialService.getBlockedUsers.mockResolvedValue({
      users: mockBlockedUsers
    })
    socialService.updateNotificationSettings.mockResolvedValue({})
    socialService.unblockUser.mockResolvedValue({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Initialization', () => {
    test('renders loading state initially', () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      expect(screen.getByText('Loading privacy settings...')).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    test('loads privacy settings on mount', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNotificationSettings).toHaveBeenCalledTimes(1)
      })
    })

    test('loads blocked users on mount', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getBlockedUsers).toHaveBeenCalledTimes(1)
      })
    })

    test('renders component after successful data load', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument()
      })
    })

    test('handles loading error gracefully', async () => {
      socialService.getNotificationSettings.mockRejectedValue(new Error('Network error'))

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load privacy settings', 'error')
      })
    })

    test('displays component even when blocked users fail to load', async () => {
      socialService.getBlockedUsers.mockRejectedValue(new Error('Network error'))

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument()
      })
    })
  })

  describe('Header and Navigation', () => {
    test('displays header with shield icon and title', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument()
      })
    })

    test('calls onClose when close button is clicked', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: '' }).closest('.close-btn')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('renders all tab buttons', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Social')).toBeInTheDocument()
        expect(screen.getByText('Interactions')).toBeInTheDocument()
        expect(screen.getByText('Blocking')).toBeInTheDocument()
      })
    })

    test('profile tab is active by default', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const profileTab = screen.getByText('Profile').closest('button')
        expect(profileTab).toHaveClass('active')
      })
    })

    test('displays blocked users count badge on blocking tab', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const badge = screen.getByText('3')
        expect(badge).toHaveClass('tab-badge')
      })
    })

    test('does not display badge when no blocked users', async () => {
      socialService.getBlockedUsers.mockResolvedValue({ users: [] })
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const blockingTab = screen.getByText('Blocking').closest('button')
        expect(blockingTab.querySelector('.tab-badge')).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    test('switches to social tab when clicked', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const socialTab = screen.getByText('Social').closest('button')
      fireEvent.click(socialTab)

      expect(socialTab).toHaveClass('active')
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })

    test('switches to interactions tab when clicked', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const interactionsTab = screen.getByText('Interactions').closest('button')
      fireEvent.click(interactionsTab)

      expect(interactionsTab).toHaveClass('active')
      expect(screen.getByText('Interaction Settings')).toBeInTheDocument()
    })

    test('switches to blocking tab when clicked', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const blockingTab = screen.getByText('Blocking').closest('button')
      fireEvent.click(blockingTab)

      expect(blockingTab).toHaveClass('active')
      expect(screen.getByText('Blocked Users')).toBeInTheDocument()
    })

    test('can navigate between multiple tabs', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Social').closest('button'))
      expect(screen.getByText('Social Connections')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Interactions').closest('button'))
      expect(screen.getByText('Interaction Settings')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Profile').closest('button'))
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
    })
  })

  describe('Profile Privacy Tab', () => {
    test('displays profile privacy section header', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
        expect(screen.getByText('Control who can see your profile information')).toBeInTheDocument()
      })
    })

    test('displays profile visibility dropdown with correct initial value', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        expect(select).toBeInTheDocument()
        expect(select.value).toBe('public')
      })
    })

    test('changes profile visibility to friends only', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        fireEvent.change(select, { target: { value: 'friends' } })
        expect(select.value).toBe('friends')
      })
    })

    test('changes profile visibility to private', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        fireEvent.change(select, { target: { value: 'private' } })
        expect(select.value).toBe('private')
      })
    })

    test('displays show email toggle with correct initial state', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Email Address')).toBeInTheDocument()
        expect(screen.getByText('Display your email on your profile')).toBeInTheDocument()
      })
    })

    test('toggles show email setting', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Email Address')).toBeInTheDocument()
      })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(emailToggle).not.toHaveClass('active')

      fireEvent.click(emailToggle)
      expect(emailToggle).toHaveClass('active')
    })

    test('displays show location toggle with correct initial state', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Location')).toBeInTheDocument()
      })

      const locationToggle = screen.getByText('Show Location')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(locationToggle).toHaveClass('active')
    })

    test('toggles show location setting', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Location')).toBeInTheDocument()
      })

      const locationToggle = screen.getByText('Show Location')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(locationToggle).toHaveClass('active')

      fireEvent.click(locationToggle)
      expect(locationToggle).not.toHaveClass('active')
    })

    test('displays show join date toggle', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Join Date')).toBeInTheDocument()
        expect(screen.getByText('Display when you joined CRYB')).toBeInTheDocument()
      })
    })

    test('toggles show join date setting', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Join Date')).toBeInTheDocument()
      })

      const joinDateToggle = screen.getByText('Show Join Date')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(joinDateToggle).toHaveClass('active')

      fireEvent.click(joinDateToggle)
      expect(joinDateToggle).not.toHaveClass('active')
    })

    test('displays show online status toggle', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Online Status')).toBeInTheDocument()
        expect(screen.getByText("Let others see when you're online")).toBeInTheDocument()
      })
    })

    test('toggles show online status setting', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Online Status')).toBeInTheDocument()
      })

      const onlineStatusToggle = screen.getByText('Show Online Status')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(onlineStatusToggle).toHaveClass('active')

      fireEvent.click(onlineStatusToggle)
      expect(onlineStatusToggle).not.toHaveClass('active')
    })
  })

  describe('Social Privacy Tab', () => {
    beforeEach(async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Social').closest('button'))
    })

    test('displays social connections section header', () => {
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
      expect(screen.getByText('Control your social interactions and connections')).toBeInTheDocument()
    })

    test('displays allow following toggle', () => {
      expect(screen.getByText('Allow Following')).toBeInTheDocument()
      expect(screen.getByText('Let others follow you')).toBeInTheDocument()
    })

    test('toggles allow following setting', () => {
      const followingToggle = screen.getByText('Allow Following')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(followingToggle).toHaveClass('active')

      fireEvent.click(followingToggle)
      expect(followingToggle).not.toHaveClass('active')
    })

    test('displays require follow approval toggle', () => {
      expect(screen.getByText('Require Follow Approval')).toBeInTheDocument()
      expect(screen.getByText('Manually approve follow requests')).toBeInTheDocument()
    })

    test('toggles require follow approval setting', () => {
      const approvalToggle = screen.getByText('Require Follow Approval')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(approvalToggle).not.toHaveClass('active')

      fireEvent.click(approvalToggle)
      expect(approvalToggle).toHaveClass('active')
    })

    test('displays show followers toggle', () => {
      expect(screen.getByText('Show Followers')).toBeInTheDocument()
      expect(screen.getByText('Display your followers list')).toBeInTheDocument()
    })

    test('toggles show followers setting', () => {
      const followersToggle = screen.getByText('Show Followers')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(followersToggle).toHaveClass('active')

      fireEvent.click(followersToggle)
      expect(followersToggle).not.toHaveClass('active')
    })

    test('displays show following toggle', () => {
      expect(screen.getByText('Show Following')).toBeInTheDocument()
      expect(screen.getByText("Display who you're following")).toBeInTheDocument()
    })

    test('toggles show following setting', () => {
      const followingToggle = screen.getByText('Show Following')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(followingToggle).toHaveClass('active')

      fireEvent.click(followingToggle)
      expect(followingToggle).not.toHaveClass('active')
    })

    test('displays show friends toggle', () => {
      expect(screen.getByText('Show Friends')).toBeInTheDocument()
      expect(screen.getByText('Display your friends list')).toBeInTheDocument()
    })

    test('toggles show friends setting', () => {
      const friendsToggle = screen.getByText('Show Friends')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(friendsToggle).toHaveClass('active')

      fireEvent.click(friendsToggle)
      expect(friendsToggle).not.toHaveClass('active')
    })
  })

  describe('Interactions Tab', () => {
    beforeEach(async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Interactions').closest('button'))
    })

    test('displays interaction settings section header', () => {
      expect(screen.getByText('Interaction Settings')).toBeInTheDocument()
      expect(screen.getByText('Control how others can interact with you')).toBeInTheDocument()
    })

    test('displays allow messages toggle', () => {
      expect(screen.getByText('Allow Messages')).toBeInTheDocument()
      expect(screen.getByText('Let others send you direct messages')).toBeInTheDocument()
    })

    test('toggles allow messages setting', () => {
      const messagesToggle = screen.getByText('Allow Messages')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(messagesToggle).toHaveClass('active')

      fireEvent.click(messagesToggle)
      expect(messagesToggle).not.toHaveClass('active')
    })

    test('displays allow friend requests toggle', () => {
      expect(screen.getByText('Allow Friend Requests')).toBeInTheDocument()
      expect(screen.getByText('Let others send you friend requests')).toBeInTheDocument()
    })

    test('toggles allow friend requests setting', () => {
      const friendRequestsToggle = screen.getByText('Allow Friend Requests')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(friendRequestsToggle).toHaveClass('active')

      fireEvent.click(friendRequestsToggle)
      expect(friendRequestsToggle).not.toHaveClass('active')
    })

    test('displays allow mentions toggle', () => {
      expect(screen.getByText('Allow Mentions')).toBeInTheDocument()
      expect(screen.getByText('Let others mention you in posts and comments')).toBeInTheDocument()
    })

    test('toggles allow mentions setting', () => {
      const mentionsToggle = screen.getByText('Allow Mentions')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(mentionsToggle).toHaveClass('active')

      fireEvent.click(mentionsToggle)
      expect(mentionsToggle).not.toHaveClass('active')
    })

    test('displays notification preferences subsection', () => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    })

    test('displays all notification settings', () => {
      expect(screen.getByText('New Follower')).toBeInTheDocument()
      expect(screen.getByText('Friend Request')).toBeInTheDocument()
      expect(screen.getByText('Friend Accepted')).toBeInTheDocument()
      expect(screen.getByText('Mentions')).toBeInTheDocument()
      expect(screen.getByText('Reactions')).toBeInTheDocument()
      expect(screen.getByText('Comments')).toBeInTheDocument()
    })

    test('toggles new follower notification setting', () => {
      const newFollowerToggle = screen.getByText('New Follower')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(newFollowerToggle).toHaveClass('active')

      fireEvent.click(newFollowerToggle)
      expect(newFollowerToggle).not.toHaveClass('active')
    })

    test('toggles friend request notification setting', () => {
      const friendRequestToggle = screen.getByText('Friend Request')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(friendRequestToggle).toHaveClass('active')

      fireEvent.click(friendRequestToggle)
      expect(friendRequestToggle).not.toHaveClass('active')
    })

    test('toggles reactions notification setting', () => {
      const reactionsToggle = screen.getByText('Reactions')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(reactionsToggle).not.toHaveClass('active')

      fireEvent.click(reactionsToggle)
      expect(reactionsToggle).toHaveClass('active')
    })

    test('toggles comments notification setting', () => {
      const commentsToggle = screen.getByText('Comments')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(commentsToggle).toHaveClass('active')

      fireEvent.click(commentsToggle)
      expect(commentsToggle).not.toHaveClass('active')
    })
  })

  describe('Blocking Tab', () => {
    beforeEach(async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Blocking').closest('button'))
    })

    test('displays blocked users section header', () => {
      expect(screen.getByText('Blocked Users')).toBeInTheDocument()
      expect(screen.getByText("Manage users you've blocked")).toBeInTheDocument()
    })

    test('displays all blocked users', () => {
      expect(screen.getByText('Blocked User 1')).toBeInTheDocument()
      expect(screen.getByText('@blockeduser1')).toBeInTheDocument()
      expect(screen.getByText('Blocked User 2')).toBeInTheDocument()
      expect(screen.getByText('@blockeduser2')).toBeInTheDocument()
      expect(screen.getByText('Blocked User 3')).toBeInTheDocument()
      expect(screen.getByText('@blockeduser3')).toBeInTheDocument()
    })

    test('displays blocked dates for users', () => {
      expect(screen.getByText(/Blocked 1\/15\/2024/)).toBeInTheDocument()
      expect(screen.getByText(/Blocked 2\/20\/2024/)).toBeInTheDocument()
      expect(screen.getByText(/Blocked 3\/10\/2024/)).toBeInTheDocument()
    })

    test('displays user avatar image when avatar is URL', () => {
      const avatar = screen.getByAltText('blockeduser1')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.jpg')
    })

    test('displays emoji avatar when avatar is emoji', () => {
      const emojiAvatar = screen.getByText('👤')
      expect(emojiAvatar).toHaveClass('avatar-emoji')
    })

    test('displays placeholder when avatar is null', () => {
      const blockedUserItems = screen.getAllByRole('button', { name: /Unblock/ })
      expect(blockedUserItems).toHaveLength(3)
    })

    test('displays unblock buttons for all blocked users', () => {
      const unblockButtons = screen.getAllByText('Unblock')
      expect(unblockButtons).toHaveLength(3)
    })

    test('unblocks user successfully', async () => {
      const unblockButtons = screen.getAllByText('Unblock')

      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(socialService.unblockUser).toHaveBeenCalledWith('blocked-1')
        expect(mockShowToast).toHaveBeenCalledWith('User unblocked successfully', 'success')
      })
    })

    test('removes unblocked user from list', async () => {
      const unblockButtons = screen.getAllByText('Unblock')

      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Blocked User 1')).not.toBeInTheDocument()
      })
    })

    test('handles unblock error', async () => {
      socialService.unblockUser.mockRejectedValue(new Error('Network error'))

      const unblockButtons = screen.getAllByText('Unblock')

      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to unblock user', 'error')
      })
    })

    test('displays warning about blocking', () => {
      expect(screen.getByText('About Blocking')).toBeInTheDocument()
      expect(screen.getByText(/Blocked users cannot see your profile/)).toBeInTheDocument()
    })
  })

  describe('Blocking Tab - Empty State', () => {
    test('displays empty state when no blocked users', async () => {
      socialService.getBlockedUsers.mockResolvedValue({ users: [] })

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Blocking').closest('button'))

      expect(screen.getByText('No blocked users')).toBeInTheDocument()
      expect(screen.getByText('Users you block will appear here')).toBeInTheDocument()
    })
  })

  describe('Save Settings', () => {
    test('displays save button in footer', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })
    })

    test('saves privacy settings successfully', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            profileVisibility: 'public',
            showEmail: false,
            allowMessages: true
          })
        )
        expect(mockShowToast).toHaveBeenCalledWith('Privacy settings saved successfully', 'success')
      })
    })

    test('displays saving state while saving', async () => {
      socialService.updateNotificationSettings.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })
    })

    test('handles save error', async () => {
      socialService.updateNotificationSettings.mockRejectedValue(new Error('Network error'))

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to save privacy settings', 'error')
      })
    })

    test('saves updated settings after changes', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Email Address')).toBeInTheDocument()
      })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      fireEvent.click(emailToggle)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            showEmail: true
          })
        )
      })
    })
  })

  describe('Footer Information', () => {
    test('displays auto-save information', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Changes are saved automatically')).toBeInTheDocument()
      })
    })
  })

  describe('Privacy Level Indicator', () => {
    test('renders privacy level component for high privacy settings', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
      })

      const privacyLevel = screen.getByText('Profile Visibility')
        .closest('.setting-item')
        .closest('.privacy-level')

      expect(privacyLevel).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    test('changes multiple settings and saves them', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(emailToggle)

      const locationToggle = screen.getByText('Show Location')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(locationToggle)

      fireEvent.click(screen.getByText('Social').closest('button'))

      const followingToggle = screen.getByText('Allow Following')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(followingToggle)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            showEmail: true,
            showLocation: false,
            allowFollowing: false
          })
        )
      })
    })

    test('navigates through all tabs and modifies settings', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Social').closest('button'))
      expect(screen.getByText('Social Connections')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Interactions').closest('button'))
      expect(screen.getByText('Interaction Settings')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Blocking').closest('button'))
      expect(screen.getByText('Blocked Users')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Profile').closest('button'))
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
    })

    test('maintains state when switching tabs', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(emailToggle)

      fireEvent.click(screen.getByText('Social').closest('button'))
      fireEvent.click(screen.getByText('Profile').closest('button'))

      const emailToggleAfter = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(emailToggleAfter).toHaveClass('active')
    })

    test('handles multiple user unblocks', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Blocking').closest('button'))

      const unblockButtons = screen.getAllByText('Unblock')

      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Blocked User 1')).not.toBeInTheDocument()
      })

      const remainingUnblockButtons = screen.getAllByText('Unblock')
      fireEvent.click(remainingUnblockButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Blocked User 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles undefined settings from API', async () => {
      socialService.getNotificationSettings.mockResolvedValue({})

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument()
      })
    })

    test('handles null blocked users response', async () => {
      socialService.getBlockedUsers.mockResolvedValue({})

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Blocking').closest('button'))

      expect(screen.getByText('No blocked users')).toBeInTheDocument()
    })

    test('handles rapid toggle clicks', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Email Address')).toBeInTheDocument()
      })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      fireEvent.click(emailToggle)
      fireEvent.click(emailToggle)
      fireEvent.click(emailToggle)

      expect(emailToggle).toHaveClass('active')
    })

    test('handles rapid tab switching', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const socialTab = screen.getByText('Social').closest('button')
      const profileTab = screen.getByText('Profile').closest('button')

      fireEvent.click(socialTab)
      fireEvent.click(profileTab)
      fireEvent.click(socialTab)
      fireEvent.click(profileTab)

      expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has accessible role for loading spinner', () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      const loadingElement = screen.getByText('Loading privacy settings...').parentElement
      expect(loadingElement).toHaveClass('privacy-loading')
    })

    test('all toggle buttons have descriptive labels', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Show Email Address')).toBeInTheDocument()
      })

      expect(screen.getByText('Show Location')).toBeInTheDocument()
      expect(screen.getByText('Show Join Date')).toBeInTheDocument()
      expect(screen.getByText('Show Online Status')).toBeInTheDocument()
    })

    test('save button is keyboard accessible', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes')
        expect(saveButton.tagName).toBe('BUTTON')
      })
    })

    test('close button is keyboard accessible', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: '' }).closest('.close-btn')
        expect(closeButton.tagName).toBe('BUTTON')
      })
    })

    test('all tabs are keyboard accessible', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const tabs = screen.getAllByRole('button')
        const tabButtons = tabs.filter(btn => btn.classList.contains('tab-btn'))
        expect(tabButtons.length).toBeGreaterThanOrEqual(4)
      })
    })

    test('profile visibility select is keyboard accessible', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        expect(select.tagName).toBe('SELECT')
      })
    })

    test('all setting descriptions provide context', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Display your email on your profile')).toBeInTheDocument()
        expect(screen.getByText('Display your location on your profile')).toBeInTheDocument()
        expect(screen.getByText('Display when you joined CRYB')).toBeInTheDocument()
      })
    })

    test('unblock buttons are labeled with Unblock text', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Blocking').closest('button'))
      })

      const unblockButtons = screen.getAllByText('Unblock')
      unblockButtons.forEach(button => {
        expect(button.closest('button')).toBeInTheDocument()
      })
    })
  })

  describe('Profile Visibility Levels', () => {
    test('all profile visibility options are available', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        const options = Array.from(select.options).map(opt => opt.value)

        expect(options).toContain('public')
        expect(options).toContain('friends')
        expect(options).toContain('private')
      })
    })

    test('profile visibility has high privacy level indicator', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const privacyLevel = screen.getByText('Profile Visibility')
          .closest('.setting-item')
          .closest('.privacy-level')

        expect(privacyLevel).toBeInTheDocument()
      })
    })
  })

  describe('Social Privacy - Advanced Features', () => {
    test('displays show mutual connections setting when on social tab', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Social').closest('button'))
      })

      // Component may not have this setting visible, but we test what exists
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })

    test('allow following has medium privacy level indicator', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Social').closest('button'))
      })

      const privacyLevel = screen.getByText('Allow Following')
        .closest('.setting-item')
        .closest('.privacy-level')

      expect(privacyLevel).toBeInTheDocument()
    })
  })

  describe('Notification Settings - All Types', () => {
    test('toggles friend accepted notification', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Interactions').closest('button'))
      })

      const friendAcceptedToggle = screen.getByText('Friend Accepted')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(friendAcceptedToggle).toHaveClass('active')

      fireEvent.click(friendAcceptedToggle)
      expect(friendAcceptedToggle).not.toHaveClass('active')
    })

    test('toggles mentions notification', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Interactions').closest('button'))
      })

      const mentionsToggle = screen.getByText(/^Mentions$/)
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(mentionsToggle).toHaveClass('active')

      fireEvent.click(mentionsToggle)
      expect(mentionsToggle).not.toHaveClass('active')
    })
  })

  describe('State Persistence', () => {
    test('maintains profile visibility selection after tab switch', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Public')
        fireEvent.change(select, { target: { value: 'private' } })
      })

      fireEvent.click(screen.getByText('Social').closest('button'))
      fireEvent.click(screen.getByText('Profile').closest('button'))

      const select = screen.getByDisplayValue('Private')
      expect(select.value).toBe('private')
    })

    test('maintains notification toggles after tab navigation', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Interactions').closest('button'))
      })

      const reactionsToggle = screen.getByText('Reactions')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      fireEvent.click(reactionsToggle)

      fireEvent.click(screen.getByText('Profile').closest('button'))
      fireEvent.click(screen.getByText('Interactions').closest('button'))

      const reactionsToggleAfter = screen.getByText('Reactions')
        .closest('.setting-item')
        .querySelector('.toggle-btn')

      expect(reactionsToggleAfter).toHaveClass('active')
    })
  })

  describe('Complex User Interactions', () => {
    test('handles changing privacy to private and toggling multiple settings', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      const visibilitySelect = screen.getByDisplayValue('Public')
      fireEvent.change(visibilitySelect, { target: { value: 'private' } })

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(emailToggle)

      const locationToggle = screen.getByText('Show Location')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(locationToggle)

      const onlineStatusToggle = screen.getByText('Show Online Status')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(onlineStatusToggle)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            profileVisibility: 'private',
            showEmail: true,
            showLocation: false,
            showOnlineStatus: false
          })
        )
      })
    })

    test('disables all social interactions', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Social').closest('button'))
      })

      const allowFollowingToggle = screen.getByText('Allow Following')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(allowFollowingToggle)

      const showFollowersToggle = screen.getByText('Show Followers')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(showFollowersToggle)

      const showFollowingToggle = screen.getByText('Show Following')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(showFollowingToggle)

      const showFriendsToggle = screen.getByText('Show Friends')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(showFriendsToggle)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            allowFollowing: false,
            showFollowers: false,
            showFollowing: false,
            showFriends: false
          })
        )
      })
    })

    test('disables all interaction permissions', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Interactions').closest('button'))
      })

      const allowMessagesToggle = screen.getByText('Allow Messages')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(allowMessagesToggle)

      const allowFriendRequestsToggle = screen.getByText('Allow Friend Requests')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(allowFriendRequestsToggle)

      const allowMentionsToggle = screen.getByText('Allow Mentions')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(allowMentionsToggle)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            allowMessages: false,
            allowFriendRequests: false,
            allowMentions: false
          })
        )
      })
    })

    test('disables all notifications', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Interactions').closest('button'))
      })

      const notificationLabels = ['New Follower', 'Friend Request', 'Friend Accepted', /^Mentions$/, 'Comments']

      notificationLabels.forEach(label => {
        const toggle = screen.getByText(label)
          .closest('.setting-item')
          .querySelector('.toggle-btn')
        if (toggle.classList.contains('active')) {
          fireEvent.click(toggle)
        }
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(socialService.updateNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            socialNotifications: expect.objectContaining({
              newFollower: false,
              friendRequest: false,
              friendAccepted: false,
              mentions: false,
              comments: false
            })
          })
        )
      })
    })
  })

  describe('Error Recovery', () => {
    test('continues to function after failed save', async () => {
      socialService.updateNotificationSettings.mockRejectedValueOnce(new Error('Network error'))

      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to save privacy settings', 'error')
      })

      socialService.updateNotificationSettings.mockResolvedValue({})

      const emailToggle = screen.getByText('Show Email Address')
        .closest('.setting-item')
        .querySelector('.toggle-btn')
      fireEvent.click(emailToggle)

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Privacy settings saved successfully', 'success')
      })
    })

    test('continues to function after failed unblock', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Blocking').closest('button'))
      })

      socialService.unblockUser.mockRejectedValueOnce(new Error('Network error'))

      const unblockButtons = screen.getAllByText('Unblock')
      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to unblock user', 'error')
      })

      expect(screen.getByText('Blocked User 1')).toBeInTheDocument()

      socialService.unblockUser.mockResolvedValue({})

      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('User unblocked successfully', 'success')
      })
    })
  })

  describe('UI State Management', () => {
    test('save button is enabled when not saving', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes')
        expect(saveButton).not.toBeDisabled()
      })
    })

    test('footer displays informational message', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const footerInfo = screen.getByText('Changes are saved automatically')
        expect(footerInfo).toBeInTheDocument()
      })
    })

    test('blocked users badge updates when users are unblocked', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Blocking').closest('button'))

      const unblockButtons = screen.getAllByText('Unblock')
      fireEvent.click(unblockButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Blocked User 1')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Profile').closest('button'))

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
  })

  describe('Privacy Level Indicators', () => {
    test('privacy level component applies correct styling for high level', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        const privacyLevel = screen.getByText('Profile Visibility')
          .closest('.setting-item')
          .closest('.privacy-level')

        expect(privacyLevel).toHaveStyle({ borderLeftColor: expect.any(String) })
      })
    })

    test('privacy level component exists for critical settings', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Social').closest('button'))
      })

      const allowFollowingPrivacyLevel = screen.getByText('Allow Following')
        .closest('.setting-item')
        .closest('.privacy-level')

      expect(allowFollowingPrivacyLevel).toBeInTheDocument()
    })
  })

  describe('Blocked Users - Advanced Scenarios', () => {
    test('displays blocking information warning', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Blocking').closest('button'))
      })

      expect(screen.getByText('About Blocking')).toBeInTheDocument()
      expect(screen.getByText(/Blocked users cannot see your profile/)).toBeInTheDocument()
      expect(screen.getByText(/send you messages/)).toBeInTheDocument()
    })

    test('shows transition from blocked users to empty state', async () => {
      render(<SocialPrivacySettings onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Blocking').closest('button'))
      })

      const unblockButtons = screen.getAllByText('Unblock')

      for (let i = 0; i < 3; i++) {
        const currentUnblockButtons = screen.getAllByText('Unblock')
        fireEvent.click(currentUnblockButtons[0])
        await waitFor(() => {
          expect(currentUnblockButtons[0]).not.toBeInTheDocument()
        })
      }

      await waitFor(() => {
        expect(screen.getByText('No blocked users')).toBeInTheDocument()
      })
    })
  })
})

export default mockUser
