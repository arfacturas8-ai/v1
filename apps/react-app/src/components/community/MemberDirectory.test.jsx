import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import MemberDirectory from './MemberDirectory'
import communityService, { COMMUNITY_ROLES } from '../../services/communityService'
import socketService from '../../services/socket'
import { useConfirmationDialog } from '../ui/modal'

jest.mock('../../services/communityService')
jest.mock('../../services/socket')
jest.mock('../ui/modal')

const mockMembers = [
  {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice Smith',
    avatar: '/avatars/alice.png',
    role: COMMUNITY_ROLES.OWNER,
    joinedAt: '2024-01-01T00:00:00Z',
    postCount: 150,
    karma: 500
  },
  {
    id: 'user-2',
    username: 'bob',
    displayName: 'Bob Jones',
    avatar: '/avatars/bob.png',
    role: COMMUNITY_ROLES.ADMIN,
    joinedAt: '2024-01-15T00:00:00Z',
    postCount: 100,
    karma: 300
  },
  {
    id: 'user-3',
    username: 'charlie',
    displayName: 'Charlie Brown',
    avatar: '/avatars/charlie.png',
    role: COMMUNITY_ROLES.MODERATOR,
    joinedAt: '2024-02-01T00:00:00Z',
    postCount: 75,
    karma: 200
  },
  {
    id: 'user-4',
    username: 'david',
    displayName: 'David Wilson',
    avatar: '/avatars/david.png',
    role: COMMUNITY_ROLES.MEMBER,
    joinedAt: '2024-03-01T00:00:00Z',
    postCount: 25,
    karma: 50
  },
  {
    id: 'user-5',
    username: 'eve',
    displayName: null,
    avatar: null,
    role: COMMUNITY_ROLES.MEMBER,
    joinedAt: '2024-03-15T00:00:00Z',
    postCount: 10,
    karma: 20
  }
]

const mockCurrentUser = {
  id: 'user-1',
  username: 'alice',
  role: COMMUNITY_ROLES.OWNER
}

describe('MemberDirectory Component', () => {
  let mockConfirm
  let mockConfirmationDialog

  beforeEach(() => {
    jest.clearAllMocks()

    mockConfirm = jest.fn()
    mockConfirmationDialog = <div data-testid="confirmation-dialog" />

    useConfirmationDialog.mockReturnValue({
      confirm: mockConfirm,
      ConfirmationDialog: mockConfirmationDialog
    })

    communityService.getCommunityMembers.mockResolvedValue({
      success: true,
      members: mockMembers,
      pagination: { hasMore: false }
    })

    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()

    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    })

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
  })

  describe('Initial Rendering', () => {
    test('renders loading state initially', () => {
      communityService.getCommunityMembers.mockReturnValue(new Promise(() => {}))

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      expect(screen.getByText('Loading members...')).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    test('renders directory header', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Community Members')).toBeInTheDocument()
      })
    })

    test('displays member count', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5 members')).toBeInTheDocument()
      })
    })

    test('loads members on mount', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            page: 1,
            limit: 50,
            sort: 'joinDate'
          })
        )
      })
    })
  })

  describe('Member List Display', () => {
    test('renders all members', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
        expect(screen.getByText('David Wilson')).toBeInTheDocument()
      })
    })

    test('displays member usernames', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('@alice')).toBeInTheDocument()
        expect(screen.getByText('@bob')).toBeInTheDocument()
        expect(screen.getByText('@charlie')).toBeInTheDocument()
      })
    })

    test('displays member avatars', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const aliceAvatar = screen.getByAltText('alice')
        expect(aliceAvatar).toHaveAttribute('src', '/avatars/alice.png')
      })
    })

    test('uses default avatar when avatar is null', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const eveAvatar = screen.getByAltText('eve')
        expect(eveAvatar).toHaveAttribute('src', '/default-avatar.png')
      })
    })

    test('handles avatar error by showing default', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const aliceAvatar = screen.getByAltText('alice')
        fireEvent.error(aliceAvatar)
        expect(aliceAvatar).toHaveAttribute('src', '/default-avatar.png')
      })
    })

    test('displays username when displayName is null', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('eve')).toBeInTheDocument()
      })
    })
  })

  describe('Member Card Information', () => {
    test('displays member role', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(COMMUNITY_ROLES.OWNER)).toBeInTheDocument()
        expect(screen.getByText(COMMUNITY_ROLES.ADMIN)).toBeInTheDocument()
        expect(screen.getByText(COMMUNITY_ROLES.MODERATOR)).toBeInTheDocument()
      })
    })

    test('displays join date', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const joinDate = new Date('2024-01-01T00:00:00Z').toLocaleDateString()
        expect(screen.getByText(new RegExp(`Joined ${joinDate}`))).toBeInTheDocument()
      })
    })

    test('displays post count', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('75')).toBeInTheDocument()
      })
    })

    test('displays karma', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument()
        expect(screen.getByText('300')).toBeInTheDocument()
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })

    test('displays zero for missing post count', async () => {
      const membersWithoutPosts = [{
        ...mockMembers[0],
        postCount: undefined
      }]

      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: membersWithoutPosts,
        pagination: { hasMore: false }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })

    test('displays message button for all members', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const messageButtons = screen.getAllByTitle('Send Message')
        expect(messageButtons).toHaveLength(5)
      })
    })
  })

  describe('Role Badges', () => {
    test('displays owner role badge', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const roleBadges = document.querySelectorAll('.role-badge')
        expect(roleBadges.length).toBeGreaterThan(0)
      })
    })

    test('applies correct color to owner role badge', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const ownerBadge = document.querySelector('.role-badge')
        expect(ownerBadge).toHaveStyle({ backgroundColor: '#f59e0b' })
      })
    })

    test('displays admin role icon', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const adminIcon = document.querySelector('.role-icon.admin')
        expect(adminIcon).toBeInTheDocument()
      })
    })

    test('displays moderator role icon', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const modIcon = document.querySelector('.role-icon.moderator')
        expect(modIcon).toBeInTheDocument()
      })
    })

    test('displays member role icon', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        const memberIcons = document.querySelectorAll('.role-icon.member')
        expect(memberIcons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Functionality', () => {
    test('renders search input', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })
    })

    test('updates search query on input', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'alice')

      expect(searchInput).toHaveValue('alice')
    })

    test('triggers API call when searching', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledTimes(1)
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'alice')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            search: 'alice'
          })
        )
      })
    })

    test('resets pagination when searching', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'alice')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            page: 1,
            search: 'alice'
          })
        )
      })
    })
  })

  describe('Role Filter', () => {
    test('renders role filter dropdown', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })
    })

    test('filters by owner role', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.OWNER)

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            role: COMMUNITY_ROLES.OWNER
          })
        )
      })
    })

    test('filters by admin role', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.ADMIN)

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            role: COMMUNITY_ROLES.ADMIN
          })
        )
      })
    })

    test('filters by moderator role', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.MODERATOR)

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            role: COMMUNITY_ROLES.MODERATOR
          })
        )
      })
    })

    test('filters by member role', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.MEMBER)

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            role: COMMUNITY_ROLES.MEMBER
          })
        )
      })
    })

    test('shows all roles when filter is set to all', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.ADMIN)
      await user.selectOptions(roleFilter, 'all')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenLastCalledWith(
          'community-1',
          expect.objectContaining({
            role: undefined
          })
        )
      })
    })
  })

  describe('Sort Functionality', () => {
    test('renders sort dropdown', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Join Date')).toBeInTheDocument()
      })
    })

    test('sorts by name', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Join Date')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Join Date')
      await user.selectOptions(sortSelect, 'name')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            sort: 'name'
          })
        )
      })
    })

    test('sorts by role', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Join Date')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Join Date')
      await user.selectOptions(sortSelect, 'role')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            sort: 'role'
          })
        )
      })
    })

    test('sorts by activity', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Join Date')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Join Date')
      await user.selectOptions(sortSelect, 'activity')

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            sort: 'activity'
          })
        )
      })
    })

    test('defaults to sorting by join date', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            sort: 'joinDate'
          })
        )
      })
    })
  })

  describe('Pagination', () => {
    test('displays load more button when hasMore is true', async () => {
      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: mockMembers,
        pagination: { hasMore: true }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Members')).toBeInTheDocument()
      })
    })

    test('hides load more button when hasMore is false', async () => {
      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: mockMembers,
        pagination: { hasMore: false }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Load More Members')).not.toBeInTheDocument()
      })
    })

    test('loads more members when clicking load more', async () => {
      const user = userEvent.setup()
      const additionalMembers = [
        { ...mockMembers[0], id: 'user-6', username: 'frank' }
      ]

      communityService.getCommunityMembers
        .mockResolvedValueOnce({
          success: true,
          members: mockMembers,
          pagination: { hasMore: true }
        })
        .mockResolvedValueOnce({
          success: true,
          members: additionalMembers,
          pagination: { hasMore: false }
        })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Members')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Members')
      await user.click(loadMoreBtn)

      await waitFor(() => {
        expect(communityService.getCommunityMembers).toHaveBeenCalledWith(
          'community-1',
          expect.objectContaining({
            page: 1
          })
        )
      })
    })

    test('appends new members to existing list', async () => {
      const user = userEvent.setup()
      const additionalMembers = [
        { ...mockMembers[0], id: 'user-6', username: 'frank', displayName: 'Frank' }
      ]

      communityService.getCommunityMembers
        .mockResolvedValueOnce({
          success: true,
          members: mockMembers,
          pagination: { hasMore: true }
        })
        .mockResolvedValueOnce({
          success: true,
          members: additionalMembers,
          pagination: { hasMore: false }
        })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Members')
      await user.click(loadMoreBtn)

      await waitFor(() => {
        expect(screen.getByText('Frank')).toBeInTheDocument()
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })

    test('disables load more button while loading', async () => {
      const user = userEvent.setup()
      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: mockMembers,
        pagination: { hasMore: true }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Members')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Members')

      communityService.getCommunityMembers.mockReturnValue(new Promise(() => {}))
      await user.click(loadMoreBtn)

      expect(loadMoreBtn).toBeDisabled()
    })

    test('shows loading text on load more button when loading', async () => {
      const user = userEvent.setup()
      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: mockMembers,
        pagination: { hasMore: true }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Members')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Members')

      communityService.getCommunityMembers.mockReturnValue(new Promise(() => {}))
      await user.click(loadMoreBtn)

      await waitFor(() => {
        expect(screen.getByText('')).toBeInTheDocument()
      })
    })
  })

  describe('Member Management', () => {
    test('shows invite button when canManageMembers is true', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })
    })

    test('hides invite button when canManageMembers is false', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={false}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Invite Members')).not.toBeInTheDocument()
      })
    })

    test('shows action menu for manageable members', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        const actionButtons = document.querySelectorAll('.action-btn.more')
        expect(actionButtons.length).toBeGreaterThan(0)
      })
    })

    test('does not show action menu for current user', async () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        const memberCards = screen.getAllByText('@alice')[0].closest('.member-card')
        const actionBtn = within(memberCards).queryByRole('button', { name: /more/i })
        expect(actionBtn).not.toBeInTheDocument()
      })
    })

    test('shows action menu when clicking more button', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument()
      })
    })

    test('closes action menu when clicking more button again', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument()
      })

      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Change Role')).not.toBeInTheDocument()
      })
    })
  })

  describe('Role Update', () => {
    test('updates member role successfully', async () => {
      const user = userEvent.setup()
      communityService.updateMemberRole.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument()
      })

      const moderatorOption = screen.getByText('Moderator')
      await user.click(moderatorOption)

      await waitFor(() => {
        expect(communityService.updateMemberRole).toHaveBeenCalledWith(
          'community-1',
          'user-2',
          COMMUNITY_ROLES.MODERATOR
        )
      })
    })

    test('closes action menu after role update', async () => {
      const user = userEvent.setup()
      communityService.updateMemberRole.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const moderatorOption = screen.getByText('Moderator')
      await user.click(moderatorOption)

      await waitFor(() => {
        expect(screen.queryByText('Change Role')).not.toBeInTheDocument()
      })
    })

    test('handles role update error', async () => {
      const user = userEvent.setup()
      communityService.updateMemberRole.mockResolvedValue({
        success: false,
        error: 'Failed to update role'
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const moderatorOption = screen.getByText('Moderator')
      await user.click(moderatorOption)

      await waitFor(() => {
        expect(screen.getByText('Failed to update role')).toBeInTheDocument()
      })
    })

    test('updates local state after successful role update', async () => {
      const user = userEvent.setup()
      communityService.updateMemberRole.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const memberOption = screen.getByText('Member')
      await user.click(memberOption)

      await waitFor(() => {
        const bobCard = screen.getByText('Bob Jones').closest('.member-card')
        expect(within(bobCard).getAllByText(COMMUNITY_ROLES.MEMBER)).toHaveLength(1)
      })
    })
  })

  describe('Remove Member', () => {
    test('shows remove member option in action menu', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Remove from Community')).toBeInTheDocument()
      })
    })

    test('shows confirmation dialog when removing member', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.removeMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const removeBtn = screen.getByText('Remove from Community')
      await user.click(removeBtn)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            title: 'Remove Member'
          })
        )
      })
    })

    test('removes member when confirmed', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.removeMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const removeBtn = screen.getByText('Remove from Community')
      await user.click(removeBtn)

      await waitFor(() => {
        expect(communityService.removeMember).toHaveBeenCalledWith('community-1', 'user-2')
      })
    })

    test('does not remove member when cancelled', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(false)

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const removeBtn = screen.getByText('Remove from Community')
      await user.click(removeBtn)

      await waitFor(() => {
        expect(communityService.removeMember).not.toHaveBeenCalled()
      })
    })

    test('removes member from list after successful removal', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.removeMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const removeBtn = screen.getByText('Remove from Community')
      await user.click(removeBtn)

      await waitFor(() => {
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
      })
    })
  })

  describe('Ban Member', () => {
    test('shows ban member option when canBanMembers is true', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Ban Member')).toBeInTheDocument()
      })
    })

    test('hides ban member option when canBanMembers is false', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Ban Member')).not.toBeInTheDocument()
      })
    })

    test('shows confirmation dialog when banning member', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.banMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const banBtn = screen.getByText('Ban Member')
      await user.click(banBtn)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Ban Member'
          })
        )
      })
    })

    test('bans member when confirmed', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.banMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const banBtn = screen.getByText('Ban Member')
      await user.click(banBtn)

      await waitFor(() => {
        expect(communityService.banMember).toHaveBeenCalledWith(
          'community-1',
          'user-2',
          'Banned by moderator'
        )
      })
    })

    test('does not ban member when cancelled', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(false)

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const banBtn = screen.getByText('Ban Member')
      await user.click(banBtn)

      await waitFor(() => {
        expect(communityService.banMember).not.toHaveBeenCalled()
      })
    })

    test('removes member from list after successful ban', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.banMember.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const banBtn = screen.getByText('Ban Member')
      await user.click(banBtn)

      await waitFor(() => {
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    test('sets up socket event listeners on mount', () => {
      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      expect(socketService.on).toHaveBeenCalledWith('member_joined', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('member_left', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('member_role_updated', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('member_banned', expect.any(Function))
    })

    test('removes socket event listeners on unmount', () => {
      const { unmount } = render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('member_joined', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('member_left', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('member_role_updated', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('member_banned', expect.any(Function))
    })

    test('adds new member when member_joined event is received', async () => {
      let memberJoinedHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_joined') {
          memberJoinedHandler = handler
        }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })

      const newMember = {
        id: 'user-6',
        username: 'frank',
        displayName: 'Frank',
        avatar: '/avatars/frank.png',
        role: COMMUNITY_ROLES.MEMBER,
        joinedAt: '2024-04-01T00:00:00Z',
        postCount: 0,
        karma: 0
      }

      memberJoinedHandler({
        communityId: 'community-1',
        member: newMember
      })

      await waitFor(() => {
        expect(screen.getByText('Frank')).toBeInTheDocument()
      })
    })

    test('removes member when member_left event is received', async () => {
      let memberLeftHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_left') {
          memberLeftHandler = handler
        }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      memberLeftHandler({
        communityId: 'community-1',
        userId: 'user-2'
      })

      await waitFor(() => {
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
      })
    })

    test('updates member role when member_role_updated event is received', async () => {
      let memberRoleUpdatedHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_role_updated') {
          memberRoleUpdatedHandler = handler
        }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      memberRoleUpdatedHandler({
        communityId: 'community-1',
        userId: 'user-2',
        newRole: COMMUNITY_ROLES.MODERATOR
      })

      await waitFor(() => {
        const bobCard = screen.getByText('Bob Jones').closest('.member-card')
        expect(within(bobCard).getAllByText(COMMUNITY_ROLES.MODERATOR)).toHaveLength(1)
      })
    })

    test('removes member when member_banned event is received', async () => {
      let memberBannedHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_banned') {
          memberBannedHandler = handler
        }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      memberBannedHandler({
        communityId: 'community-1',
        userId: 'user-2'
      })

      await waitFor(() => {
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
      })
    })

    test('ignores events from other communities', async () => {
      let memberLeftHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'member_left') {
          memberLeftHandler = handler
        }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      memberLeftHandler({
        communityId: 'community-2',
        userId: 'user-2'
      })

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      communityService.getCommunityMembers.mockResolvedValue({
        success: false,
        error: 'Failed to load members'
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load members')).toBeInTheDocument()
      })
    })

    test('displays error message when API throws exception', async () => {
      communityService.getCommunityMembers.mockRejectedValue(new Error('Network error'))

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load members')).toBeInTheDocument()
      })
    })

    test('shows retry button on error', async () => {
      communityService.getCommunityMembers.mockResolvedValue({
        success: false,
        error: 'Failed to load members'
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    test('retries loading members when clicking retry', async () => {
      const user = userEvent.setup()
      communityService.getCommunityMembers
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed to load members'
        })
        .mockResolvedValueOnce({
          success: true,
          members: mockMembers,
          pagination: { hasMore: false }
        })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      const retryBtn = screen.getByText('Retry')
      await user.click(retryBtn)

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })

    test('handles error when updating member role', async () => {
      const user = userEvent.setup()
      communityService.updateMemberRole.mockRejectedValue(new Error('Network error'))

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const moderatorOption = screen.getByText('Moderator')
      await user.click(moderatorOption)

      await waitFor(() => {
        expect(screen.getByText('Failed to update member role')).toBeInTheDocument()
      })
    })

    test('handles error when removing member', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.removeMember.mockRejectedValue(new Error('Network error'))

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const removeBtn = screen.getByText('Remove from Community')
      await user.click(removeBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to remove member')).toBeInTheDocument()
      })
    })

    test('handles error when banning member', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.banMember.mockRejectedValue(new Error('Network error'))

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
          canBanMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      })

      const actionButtons = document.querySelectorAll('.action-btn.more')
      await user.click(actionButtons[0])

      const banBtn = screen.getByText('Ban Member')
      await user.click(banBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to ban member')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    test('displays empty member list', async () => {
      communityService.getCommunityMembers.mockResolvedValue({
        success: true,
        members: [],
        pagination: { hasMore: false }
      })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument()
      })
    })

    test('shows no members when search returns empty results', async () => {
      const user = userEvent.setup()
      communityService.getCommunityMembers
        .mockResolvedValueOnce({
          success: true,
          members: mockMembers,
          pagination: { hasMore: false }
        })
        .mockResolvedValueOnce({
          success: true,
          members: [],
          pagination: { hasMore: false }
        })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument()
      })
    })

    test('shows no members when filter returns empty results', async () => {
      const user = userEvent.setup()
      communityService.getCommunityMembers
        .mockResolvedValueOnce({
          success: true,
          members: mockMembers,
          pagination: { hasMore: false }
        })
        .mockResolvedValueOnce({
          success: true,
          members: [],
          pagination: { hasMore: false }
        })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })

      const roleFilter = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleFilter, COMMUNITY_ROLES.ADMIN)

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument()
      })
    })
  })

  describe('Invite Modal', () => {
    test('opens invite modal when clicking invite button', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Invite Members' })).toBeInTheDocument()
      })
    })

    test('displays invite link by default', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        const linkInput = screen.getByDisplayValue(/\/communities\/community-1\/join/)
        expect(linkInput).toBeInTheDocument()
      })
    })

    test('copies invite link to clipboard', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument()
      })

      const copyBtn = screen.getByText('Copy')
      await user.click(copyBtn)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    test('switches to email invite method', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByText('Email Invites')).toBeInTheDocument()
      })

      const emailMethodBtn = screen.getByText('Email Invites')
      await user.click(emailMethodBtn)

      await waitFor(() => {
        expect(screen.getByLabelText('Email Addresses')).toBeInTheDocument()
      })
    })

    test('switches to username invite method', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByText('By Username')).toBeInTheDocument()
      })

      const usernameMethodBtn = screen.getByText('By Username')
      await user.click(usernameMethodBtn)

      await waitFor(() => {
        expect(screen.getByLabelText('Usernames')).toBeInTheDocument()
      })
    })

    test('sends email invites', async () => {
      const user = userEvent.setup()
      communityService.inviteMembers.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      const emailMethodBtn = screen.getByText('Email Invites')
      await user.click(emailMethodBtn)

      const emailInput = screen.getByLabelText('Email Addresses')
      await user.type(emailInput, 'test1@example.com, test2@example.com')

      const sendBtn = screen.getByText('Send Invites')
      await user.click(sendBtn)

      await waitFor(() => {
        expect(communityService.inviteMembers).toHaveBeenCalledWith(
          'community-1',
          { emails: ['test1@example.com', 'test2@example.com'] }
        )
      })
    })

    test('sends username invites', async () => {
      const user = userEvent.setup()
      communityService.inviteMembers.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      const usernameMethodBtn = screen.getByText('By Username')
      await user.click(usernameMethodBtn)

      const usernameInput = screen.getByLabelText('Usernames')
      await user.type(usernameInput, 'user1, user2')

      const sendBtn = screen.getByText('Send Invites')
      await user.click(sendBtn)

      await waitFor(() => {
        expect(communityService.inviteMembers).toHaveBeenCalledWith(
          'community-1',
          { usernames: ['user1', 'user2'] }
        )
      })
    })

    test('closes modal when clicking cancel', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Invite Members' })).toBeInTheDocument()
      })

      const cancelBtn = screen.getByText('Cancel')
      await user.click(cancelBtn)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Invite Members' })).not.toBeInTheDocument()
      })
    })

    test('closes modal when clicking close button', async () => {
      const user = userEvent.setup()

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Invite Members' })).toBeInTheDocument()
      })

      const closeBtn = screen.getByText('×')
      await user.click(closeBtn)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Invite Members' })).not.toBeInTheDocument()
      })
    })

    test('closes modal after successful invite', async () => {
      const user = userEvent.setup()
      communityService.inviteMembers.mockResolvedValue({ success: true })

      render(
        <MemberDirectory
          communityId="community-1"
          currentUser={mockCurrentUser}
          canManageMembers={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Invite Members')).toBeInTheDocument()
      })

      const inviteBtn = screen.getByText('Invite Members')
      await user.click(inviteBtn)

      const emailMethodBtn = screen.getByText('Email Invites')
      await user.click(emailMethodBtn)

      const emailInput = screen.getByLabelText('Email Addresses')
      await user.type(emailInput, 'test@example.com')

      const sendBtn = screen.getByText('Send Invites')
      await user.click(sendBtn)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Invite Members' })).not.toBeInTheDocument()
      })
    })
  })
})

export default mockMembers
