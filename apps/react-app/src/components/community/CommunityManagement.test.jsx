import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CommunityManagement from './CommunityManagement'
import communityService, { COMMUNITY_ROLES, COMMUNITY_PERMISSIONS } from '../../services/communityService'
import socketService from '../../services/socket'

jest.mock('../../services/communityService')
jest.mock('../../services/socket')

describe('CommunityManagement', () => {
  const mockCommunityId = 'community-123'
  const mockCurrentUser = {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User'
  }
  const mockOnClose = jest.fn()

  const mockCommunity = {
    id: mockCommunityId,
    name: 'testcommunity',
    displayName: 'Test Community',
    icon: '/test-icon.png',
    createdAt: '2024-01-01T00:00:00.000Z'
  }

  const mockMembers = [
    {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
      role: COMMUNITY_ROLES.OWNER,
      avatar: '/avatar1.png',
      joinedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      username: 'member1',
      displayName: 'Member One',
      role: COMMUNITY_ROLES.MEMBER,
      avatar: '/avatar2.png',
      joinedAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: 'user-3',
      username: 'moderator1',
      displayName: 'Moderator One',
      role: COMMUNITY_ROLES.MODERATOR,
      avatar: '/avatar3.png',
      joinedAt: '2024-01-10T00:00:00.000Z'
    }
  ]

  const mockAnalytics = {
    totalPosts: 150,
    memberGrowth: 15,
    postGrowth: 25,
    dailyActive: 42,
    activeChange: 10,
    engagementRate: 68,
    engagementGrowth: 12,
    recentActivity: [
      { type: 'join', description: 'User joined', time: '2 hours ago' },
      { type: 'post', description: 'New post created', time: '3 hours ago' },
      { type: 'like', description: 'Post liked', time: '5 hours ago' }
    ]
  }

  const mockModerationQueue = [
    {
      id: 'mod-1',
      type: 'post',
      content: 'Reported post content',
      author: 'baduser',
      createdAt: '2024-01-20T00:00:00.000Z',
      reports: 3
    },
    {
      id: 'mod-2',
      type: 'comment',
      content: 'Reported comment',
      author: 'anotheruser',
      createdAt: '2024-01-21T00:00:00.000Z',
      reports: 1
    }
  ]

  const mockEvents = [
    {
      id: 'event-1',
      title: 'Community Meetup',
      description: 'Monthly community gathering',
      startDate: '2024-02-15T18:00:00.000Z',
      attendees: 25
    },
    {
      id: 'event-2',
      title: 'Game Night',
      description: 'Weekly game night',
      startDate: '2024-02-10T20:00:00.000Z',
      attendees: 12
    }
  ]

  const mockPermissions = {
    [COMMUNITY_PERMISSIONS.MANAGE_COMMUNITY]: true,
    [COMMUNITY_PERMISSIONS.MANAGE_MEMBERS]: true,
    [COMMUNITY_PERMISSIONS.MODERATE_CONTENT]: true
  }

  beforeEach(() => {
    jest.clearAllMocks()

    communityService.getCommunity.mockResolvedValue({
      success: true,
      community: mockCommunity
    })
    communityService.getCommunityMembers.mockResolvedValue({
      success: true,
      members: mockMembers
    })
    communityService.getCommunityAnalytics.mockResolvedValue({
      success: true,
      analytics: mockAnalytics
    })
    communityService.getCommunityEvents.mockResolvedValue({
      success: true,
      events: mockEvents
    })
    communityService.getCommunityPermissions.mockResolvedValue({
      success: true,
      permissions: mockPermissions
    })
    communityService.getModerationQueue.mockResolvedValue({
      success: true,
      queue: mockModerationQueue
    })

    socketService.on = jest.fn()
    socketService.off = jest.fn()
  })

  describe('Component Initialization', () => {
    test('renders loading state initially', () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Loading community management...')).toBeInTheDocument()
    })

    test('loads community data on mount', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunity).toHaveBeenCalledWith(mockCommunityId)
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(mockCommunityId)
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith(mockCommunityId)
        expect(communityService.getCommunityEvents).toHaveBeenCalledWith(mockCommunityId)
      })
    })

    test('loads permissions on mount', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunityPermissions).toHaveBeenCalledWith(mockCommunityId)
      })
    })

    test('sets up socket listeners on mount', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      expect(socketService.on).toHaveBeenCalledWith('community_updated', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('member_joined', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('member_left', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('moderation_queue_updated', expect.any(Function))
    })

    test('cleans up socket listeners on unmount', async () => {
      const { unmount } = render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('community_updated', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('member_joined', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('member_left', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('moderation_queue_updated', expect.any(Function))
    })

    test('loads moderation queue when user has moderate content permission', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(communityService.getModerationQueue).toHaveBeenCalledWith(mockCommunityId)
      })
    })

    test('does not load moderation queue when user lacks permission', async () => {
      communityService.getCommunityPermissions.mockResolvedValue({
        success: true,
        permissions: {
          ...mockPermissions,
          [COMMUNITY_PERMISSIONS.MODERATE_CONTENT]: false
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunity).toHaveBeenCalled()
      })

      expect(communityService.getModerationQueue).not.toHaveBeenCalled()
    })
  })

  describe('Management Dashboard Header', () => {
    test('displays community information in header', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeInTheDocument()
      })

      expect(screen.getByText('c/testcommunity')).toBeInTheDocument()
      expect(screen.getByText(/3 members/)).toBeInTheDocument()
      expect(screen.getByText(/150 posts/)).toBeInTheDocument()
    })

    test('displays community icon', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const img = screen.getByAltText('Test Community')
        expect(img).toHaveAttribute('src', '/test-icon.png')
      })
    })

    test('displays default icon when community has no icon', async () => {
      communityService.getCommunity.mockResolvedValue({
        success: true,
        community: { ...mockCommunity, icon: null }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const img = screen.getByAltText('Test Community')
        expect(img).toHaveAttribute('src', '/default-community.png')
      })
    })

    test('close button calls onClose callback', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: '' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Tab Navigation', () => {
    test('renders all tabs', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Moderation')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    test('overview tab is active by default', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const overviewTab = screen.getByText('Overview').closest('button')
        expect(overviewTab).toHaveClass('active')
      })
    })

    test('switches to members tab when clicked', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      const membersTab = screen.getByText('Members').closest('button')
      expect(membersTab).toHaveClass('active')
    })

    test('displays badge counts on tabs', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // members count
      })

      expect(screen.getByText('2')).toBeInTheDocument() // moderation queue count
      expect(screen.getByText(/2/)).toBeInTheDocument() // events count
    })
  })

  describe('Overview Tab', () => {
    test('displays member statistics', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Total Members')).toBeInTheDocument()
      })

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('+15% this month')).toBeInTheDocument()
    })

    test('displays post statistics', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument()
      })

      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('+25% this week')).toBeInTheDocument()
    })

    test('displays daily active users', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Daily Active')).toBeInTheDocument()
      })

      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('+10%')).toBeInTheDocument()
    })

    test('displays engagement rate', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
      })

      expect(screen.getByText('68%')).toBeInTheDocument()
      expect(screen.getByText('+12% this week')).toBeInTheDocument()
    })

    test('displays recent activity list', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      })

      expect(screen.getByText('User joined')).toBeInTheDocument()
      expect(screen.getByText('New post created')).toBeInTheDocument()
      expect(screen.getByText('Post liked')).toBeInTheDocument()
    })

    test('handles missing analytics gracefully', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: null
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Total Members')).toBeInTheDocument()
      })

      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Members Tab', () => {
    beforeEach(async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))
    })

    test('displays members list', async () => {
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })

      expect(screen.getByText('Member One')).toBeInTheDocument()
      expect(screen.getByText('Moderator One')).toBeInTheDocument()
    })

    test('displays member usernames', async () => {
      await waitFor(() => {
        expect(screen.getByText('@testuser', { exact: false })).toBeInTheDocument()
      })

      expect(screen.getByText('@member1', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('@moderator1', { exact: false })).toBeInTheDocument()
    })

    test('displays member avatars', async () => {
      await waitFor(() => {
        const avatar = screen.getByAltText('testuser')
        expect(avatar).toHaveAttribute('src', '/avatar1.png')
      })
    })

    test('displays member role icons', async () => {
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })

      const roleIcons = document.querySelectorAll('.role-icon')
      expect(roleIcons.length).toBeGreaterThan(0)
    })

    test('search filters members by username', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'member1')

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
        expect(screen.queryByText('Moderator One')).not.toBeInTheDocument()
      })
    })

    test('search filters members by display name', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'Moderator')

      await waitFor(() => {
        expect(screen.getByText('Moderator One')).toBeInTheDocument()
        expect(screen.queryByText('Member One')).not.toBeInTheDocument()
      })
    })

    test('search is case insensitive', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'MEMBER')

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })
    })

    test('role filter shows all roles by default', async () => {
      await waitFor(() => {
        const select = screen.getByDisplayValue('All Roles')
        expect(select).toBeInTheDocument()
      })
    })

    test('role filter filters by specific role', async () => {
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      fireEvent.change(roleFilter, { target: { value: COMMUNITY_ROLES.MODERATOR } })

      await waitFor(() => {
        expect(screen.getByText('Moderator One')).toBeInTheDocument()
        expect(screen.queryByText('Member One')).not.toBeInTheDocument()
      })
    })

    test('displays invite button when user has manage members permission', async () => {
      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })
    })

    test('hides invite button when user lacks permission', async () => {
      communityService.getCommunityPermissions.mockResolvedValue({
        success: true,
        permissions: {
          ...mockPermissions,
          [COMMUNITY_PERMISSIONS.MANAGE_MEMBERS]: false
        }
      })

      const { rerender } = render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      await waitFor(() => {
        expect(screen.queryByText('Invite Members')).not.toBeInTheDocument()
      })
    })
  })

  describe('Member Management', () => {
    beforeEach(async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))
    })

    test('displays role select for other members when user has permission', async () => {
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox')
        expect(roleSelects.length).toBeGreaterThan(1)
      })
    })

    test('does not display actions for current user', async () => {
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })

      const currentUserCard = screen.getByText('Test User').closest('.member-card')
      const banButton = within(currentUserCard).queryByRole('button')

      expect(banButton).not.toBeInTheDocument()
    })

    test('updates member role when role select changes', async () => {
      communityService.updateMemberRole.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const roleSelect = within(memberCard).getByRole('combobox')

      fireEvent.change(roleSelect, { target: { value: COMMUNITY_ROLES.MODERATOR } })

      await waitFor(() => {
        expect(communityService.updateMemberRole).toHaveBeenCalledWith(
          mockCommunityId,
          'user-2',
          COMMUNITY_ROLES.MODERATOR
        )
      })
    })

    test('updates local state after successful role update', async () => {
      communityService.updateMemberRole.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const roleSelect = within(memberCard).getByRole('combobox')

      fireEvent.change(roleSelect, { target: { value: COMMUNITY_ROLES.MODERATOR } })

      await waitFor(() => {
        expect(communityService.updateMemberRole).toHaveBeenCalled()
      })
    })

    test('displays ban button for members', async () => {
      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const banButton = within(memberCard).getByRole('button', { name: '' })

      expect(banButton).toBeInTheDocument()
    })

    test('bans member when ban button clicked', async () => {
      communityService.banMember.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const banButton = within(memberCard).getByRole('button', { name: '' })

      fireEvent.click(banButton)

      await waitFor(() => {
        expect(communityService.banMember).toHaveBeenCalledWith(
          mockCommunityId,
          'user-2',
          'Banned by administrator'
        )
      })
    })

    test('removes member from list after successful ban', async () => {
      communityService.banMember.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const banButton = within(memberCard).getByRole('button', { name: '' })

      fireEvent.click(banButton)

      await waitFor(() => {
        expect(screen.queryByText('Member One')).not.toBeInTheDocument()
      })
    })

    test('handles ban member error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.banMember.mockRejectedValue(new Error('Ban failed'))

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const banButton = within(memberCard).getByRole('button', { name: '' })

      fireEvent.click(banButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to ban member:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Moderation Queue', () => {
    beforeEach(async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))
    })

    test('displays moderation queue when user has permission', async () => {
      await waitFor(() => {
        expect(screen.getByText('Moderation Queue')).toBeInTheDocument()
      })
    })

    test('displays pending items count', async () => {
      await waitFor(() => {
        expect(screen.getByText('2 items pending')).toBeInTheDocument()
      })
    })

    test('displays moderation items', async () => {
      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      expect(screen.getByText('Reported comment')).toBeInTheDocument()
    })

    test('displays item author and metadata', async () => {
      await waitFor(() => {
        expect(screen.getByText(/@baduser/, { exact: false })).toBeInTheDocument()
      })

      expect(screen.getByText(/@anotheruser/, { exact: false })).toBeInTheDocument()
    })

    test('displays report count for items', async () => {
      await waitFor(() => {
        expect(screen.getByText(/3 reports/, { exact: false })).toBeInTheDocument()
      })

      expect(screen.getByText(/1 reports/, { exact: false })).toBeInTheDocument()
    })

    test('displays approve button for each item', async () => {
      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve')
        expect(approveButtons).toHaveLength(2)
      })
    })

    test('displays remove button for each item', async () => {
      await waitFor(() => {
        const removeButtons = screen.getAllByText('Remove')
        expect(removeButtons).toHaveLength(2)
      })
    })

    test('approves content when approve button clicked', async () => {
      communityService.moderateContent.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      const approveButtons = screen.getAllByText('Approve')
      fireEvent.click(approveButtons[0])

      await waitFor(() => {
        expect(communityService.moderateContent).toHaveBeenCalledWith(
          mockCommunityId,
          'mod-1',
          'approve',
          ''
        )
      })
    })

    test('removes content when remove button clicked', async () => {
      communityService.moderateContent.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(communityService.moderateContent).toHaveBeenCalledWith(
          mockCommunityId,
          'mod-1',
          'remove',
          'Removed by moderator'
        )
      })
    })

    test('removes item from queue after moderation action', async () => {
      communityService.moderateContent.mockResolvedValue({ success: true })

      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      const approveButtons = screen.getAllByText('Approve')
      fireEvent.click(approveButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Reported post content')).not.toBeInTheDocument()
      })
    })

    test('displays empty state when queue is empty', async () => {
      communityService.getModerationQueue.mockResolvedValue({
        success: true,
        queue: []
      })

      const { rerender } = render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))

      await waitFor(() => {
        expect(screen.getByText('No items in moderation queue')).toBeInTheDocument()
      })
    })

    test('does not show moderation tab content without permission', async () => {
      communityService.getCommunityPermissions.mockResolvedValue({
        success: true,
        permissions: {
          ...mockPermissions,
          [COMMUNITY_PERMISSIONS.MODERATE_CONTENT]: false
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))

      await waitFor(() => {
        expect(screen.queryByText('Moderation Queue')).not.toBeInTheDocument()
      })
    })
  })

  describe('Events Tab', () => {
    beforeEach(async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Events'))
    })

    test('displays events tab content', async () => {
      await waitFor(() => {
        expect(screen.getByText('Community Events')).toBeInTheDocument()
      })
    })

    test('displays create event button', async () => {
      await waitFor(() => {
        expect(screen.getByText('Create Event')).toBeInTheDocument()
      })
    })

    test('displays list of events', async () => {
      await waitFor(() => {
        expect(screen.getByText('Community Meetup')).toBeInTheDocument()
      })

      expect(screen.getByText('Game Night')).toBeInTheDocument()
    })

    test('displays event descriptions', async () => {
      await waitFor(() => {
        expect(screen.getByText('Monthly community gathering')).toBeInTheDocument()
      })

      expect(screen.getByText('Weekly game night')).toBeInTheDocument()
    })

    test('displays event attendee count', async () => {
      await waitFor(() => {
        expect(screen.getByText(/25 attending/, { exact: false })).toBeInTheDocument()
      })

      expect(screen.getByText(/12 attending/, { exact: false })).toBeInTheDocument()
    })

    test('displays empty state when no events exist', async () => {
      communityService.getCommunityEvents.mockResolvedValue({
        success: true,
        events: []
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Events'))

      await waitFor(() => {
        expect(screen.getByText('No events scheduled')).toBeInTheDocument()
      })
    })
  })

  describe('Settings Tab', () => {
    test('displays settings when user has permission', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Settings'))

      await waitFor(() => {
        expect(screen.getByText('Community Settings')).toBeInTheDocument()
      })
    })

    test('displays all settings sections', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Settings'))

      await waitFor(() => {
        expect(screen.getByText('Privacy & Access')).toBeInTheDocument()
      })

      expect(screen.getByText('Rules & Guidelines')).toBeInTheDocument()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
    })

    test('displays settings buttons', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Settings'))

      await waitFor(() => {
        expect(screen.getByText('Edit Community Info')).toBeInTheDocument()
      })

      expect(screen.getByText('Manage Privacy')).toBeInTheDocument()
      expect(screen.getByText('Edit Rules')).toBeInTheDocument()
      expect(screen.getByText('Customize Appearance')).toBeInTheDocument()
    })

    test('does not show settings without permission', async () => {
      communityService.getCommunityPermissions.mockResolvedValue({
        success: true,
        permissions: {
          ...mockPermissions,
          [COMMUNITY_PERMISSIONS.MANAGE_COMMUNITY]: false
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Settings'))

      await waitFor(() => {
        expect(screen.queryByText('Community Settings')).not.toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    test('updates community when socket event received', async () => {
      let communityUpdateHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_updated') {
          communityUpdateHandler = handler
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeInTheDocument()
      })

      const updatedCommunity = {
        ...mockCommunity,
        displayName: 'Updated Community Name'
      }

      communityUpdateHandler(updatedCommunity)

      await waitFor(() => {
        expect(screen.getByText('Updated Community Name')).toBeInTheDocument()
      })
    })

    test('adds member when member_joined event received', async () => {
      let memberJoinedHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_joined') {
          memberJoinedHandler = handler
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      const newMember = {
        id: 'user-4',
        username: 'newuser',
        displayName: 'New User',
        role: COMMUNITY_ROLES.MEMBER,
        avatar: '/avatar4.png',
        joinedAt: '2024-01-25T00:00:00.000Z'
      }

      memberJoinedHandler({
        communityId: mockCommunityId,
        member: newMember
      })

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })
    })

    test('removes member when member_left event received', async () => {
      let memberLeftHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_left') {
          memberLeftHandler = handler
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      memberLeftHandler({
        communityId: mockCommunityId,
        userId: 'user-2'
      })

      await waitFor(() => {
        expect(screen.queryByText('Member One')).not.toBeInTheDocument()
      })
    })

    test('removes item from moderation queue when moderation_queue_updated event received', async () => {
      let moderationUpdateHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'moderation_queue_updated') {
          moderationUpdateHandler = handler
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))

      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      moderationUpdateHandler({
        communityId: mockCommunityId,
        itemId: 'mod-1'
      })

      await waitFor(() => {
        expect(screen.queryByText('Reported post content')).not.toBeInTheDocument()
      })
    })

    test('ignores socket events for different communities', async () => {
      let memberJoinedHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_joined') {
          memberJoinedHandler = handler
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      const newMember = {
        id: 'user-4',
        username: 'newuser',
        displayName: 'New User',
        role: COMMUNITY_ROLES.MEMBER,
        avatar: '/avatar4.png',
        joinedAt: '2024-01-25T00:00:00.000Z'
      }

      memberJoinedHandler({
        communityId: 'different-community',
        member: newMember
      })

      await waitFor(() => {
        expect(screen.queryByText('New User')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('displays error message when community data fails to load', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunity.mockRejectedValue(new Error('Load failed'))

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load community data:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('handles permissions load failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunityPermissions.mockRejectedValue(new Error('Permission load failed'))

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load permissions:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('handles role update failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.updateMemberRole.mockRejectedValue(new Error('Role update failed'))

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      await waitFor(() => {
        expect(screen.getByText('Member One')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Member One').closest('.member-card')
      const roleSelect = within(memberCard).getByRole('combobox')

      fireEvent.change(roleSelect, { target: { value: COMMUNITY_ROLES.MODERATOR } })

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update role:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('handles moderation action failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.moderateContent.mockRejectedValue(new Error('Moderation failed'))

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))

      await waitFor(() => {
        expect(screen.getByText('Reported post content')).toBeInTheDocument()
      })

      const approveButtons = screen.getAllByText('Approve')
      fireEvent.click(approveButtons[0])

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to moderate content:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Loading States', () => {
    test('sets loading to false after data loads successfully', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Loading community management...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Loading community management...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Test Community')).toBeInTheDocument()
    })

    test('sets loading to false even when data load fails', async () => {
      communityService.getCommunity.mockRejectedValue(new Error('Load failed'))

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Loading community management...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Loading community management...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Permissions Checks', () => {
    test('shows member management controls with MANAGE_MEMBERS permission', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const roleSelects = screen.getAllByRole('combobox')
      expect(roleSelects.length).toBeGreaterThan(0)
    })

    test('hides member management controls without MANAGE_MEMBERS permission', async () => {
      communityService.getCommunityPermissions.mockResolvedValue({
        success: true,
        permissions: {
          ...mockPermissions,
          [COMMUNITY_PERMISSIONS.MANAGE_MEMBERS]: false
        }
      })

      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Members'))

      await waitFor(() => {
        expect(screen.queryByText('Invite Members')).not.toBeInTheDocument()
      })
    })

    test('shows settings tab with MANAGE_COMMUNITY permission', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Settings'))

      await waitFor(() => {
        expect(screen.getByText('Community Settings')).toBeInTheDocument()
      })
    })

    test('shows moderation tab with MODERATE_CONTENT permission', async () => {
      render(
        <CommunityManagement
          communityId={mockCommunityId}
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Moderation'))

      await waitFor(() => {
        expect(screen.getByText('Moderation Queue')).toBeInTheDocument()
      })
    })
  })
})

export default mockCommunityId
