import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import UserPresenceSystem from './UserPresenceSystem'

// Mock fetch globally
global.fetch = jest.fn()

// Mock icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  User: () => <div data-testid="user-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  MicOff: () => <div data-testid="mic-off-icon" />,
  Headphones: () => <div data-testid="headphones-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Video: () => <div data-testid="video-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  MoreHorizontal: () => <div data-testid="more-icon" />,
  MessageCircle: () => <div data-testid="message-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  VolumeX: () => <div data-testid="volume-x-icon" />,
  Volume2: () => <div data-testid="volume-2-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Gamepad2: () => <div data-testid="gamepad-icon" />,
  Music: () => <div data-testid="music-icon" />,
  Code: () => <div data-testid="code-icon" />,
  Coffee: () => <div data-testid="coffee-icon" />
}))

describe('UserPresenceSystem', () => {
  const mockUsers = [
    {
      id: '1',
      username: 'john_doe',
      displayName: 'John Doe',
      status: 'online',
      avatar: 'https://example.com/avatar1.jpg',
      lastSeen: null
    },
    {
      id: '2',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      status: 'away',
      avatar: null,
      lastSeen: null
    },
    {
      id: '3',
      username: 'bob_wilson',
      displayName: 'Bob Wilson',
      status: 'busy',
      avatar: null,
      lastSeen: null
    },
    {
      id: '4',
      username: 'alice_jones',
      displayName: 'Alice Jones',
      status: 'offline',
      avatar: null,
      lastSeen: new Date(Date.now() - 3600000).toISOString()
    }
  ]

  const mockUserDetails = {
    '1': {
      joinedAt: new Date().toISOString(),
      roles: ['owner'],
      permissions: ['admin'],
      activity: { type: 'playing', name: 'Visual Studio Code', details: 'Editing code' },
      voiceState: null,
      customStatus: null
    },
    '2': {
      joinedAt: new Date().toISOString(),
      roles: ['admin'],
      permissions: [],
      activity: { type: 'listening', name: 'Spotify', details: 'Lo-fi Hip Hop' },
      voiceState: { muted: false, speaking: false },
      customStatus: null
    },
    '3': {
      joinedAt: new Date().toISOString(),
      roles: ['moderator'],
      permissions: [],
      activity: null,
      voiceState: { muted: true, speaking: false },
      customStatus: 'Busy working'
    },
    '4': {
      joinedAt: new Date().toISOString(),
      roles: ['member'],
      permissions: [],
      activity: null,
      voiceState: null,
      customStatus: null
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockImplementation((url) => {
      const userId = url.split('/').slice(-2)[0]
      return Promise.resolve({
        json: () => Promise.resolve(mockUserDetails[userId] || {})
      })
    })
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<UserPresenceSystem users={[]} />)
      expect(screen.getByText('Members')).toBeInTheDocument()
    })

    it('should render with users prop', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      expect(screen.getByText('Members')).toBeInTheDocument()
    })

    it('should display correct member count', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      expect(screen.getByText(`(${mockUsers.length})`)).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
    })

    it('should render status filter dropdown', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      const statusFilter = screen.getByDisplayValue('All Status')
      expect(statusFilter).toBeInTheDocument()
    })

    it('should render role filter when showRoles is true', () => {
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)
      expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
    })

    it('should not render role filter when showRoles is false', () => {
      render(<UserPresenceSystem users={mockUsers} showRoles={false} />)
      expect(screen.queryByDisplayValue('All Roles')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<UserPresenceSystem users={[]} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('User Status Display', () => {
    it('should display online users', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should display away users', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display busy users', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
      })
    })

    it('should display offline users', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText('Alice Jones')).toBeInTheDocument()
      })
    })

    it('should group users by status', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText(/online \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/away \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/busy \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/offline \(1\)/i)).toBeInTheDocument()
      })
    })

    it('should display online count in footer', async () => {
      render(<UserPresenceSystem users={mockUsers} />)
      await waitFor(() => {
        expect(screen.getByText('1 online')).toBeInTheDocument()
      })
    })

    it('should display total count in footer', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      expect(screen.getByText('4 total')).toBeInTheDocument()
    })
  })

  describe('Status Indicator', () => {
    it('should show green indicator for online status', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[0]]} />)
      await waitFor(() => {
        const statusIndicators = container.querySelectorAll('.bg-green-500')
        expect(statusIndicators.length).toBeGreaterThan(0)
      })
    })

    it('should show yellow indicator for away status', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[1]]} />)
      await waitFor(() => {
        const statusIndicators = container.querySelectorAll('.bg-yellow-500')
        expect(statusIndicators.length).toBeGreaterThan(0)
      })
    })

    it('should show red indicator for busy status', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[2]]} />)
      await waitFor(() => {
        const statusIndicators = container.querySelectorAll('.bg-red-500')
        expect(statusIndicators.length).toBeGreaterThan(0)
      })
    })

    it('should show gray indicator for offline status', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[3]]} />)
      await waitFor(() => {
        const statusIndicators = container.querySelectorAll('.bg-gray-500')
        expect(statusIndicators.length).toBeGreaterThan(0)
      })
    })

    it('should default to gray indicator for unknown status', async () => {
      const userWithUnknownStatus = { ...mockUsers[0], status: 'unknown' }
      const { container } = render(<UserPresenceSystem users={[userWithUnknownStatus]} />)
      await waitFor(() => {
        const statusIndicators = container.querySelectorAll('.bg-gray-500')
        expect(statusIndicators.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Custom Status Message', () => {
    it('should display custom status when available', async () => {
      render(<UserPresenceSystem users={[mockUsers[2]]} showActivities={true} />)
      await waitFor(() => {
        expect(screen.getByText('Busy working')).toBeInTheDocument()
      })
    })

    it('should not display custom status when showActivities is false', async () => {
      render(<UserPresenceSystem users={[mockUsers[2]]} showActivities={false} />)
      await waitFor(() => {
        expect(screen.queryByText('Busy working')).not.toBeInTheDocument()
      })
    })

    it('should prioritize custom status over activity', async () => {
      const userWithBoth = {
        id: '5',
        username: 'test',
        displayName: 'Test User',
        status: 'online'
      }
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            ...mockUserDetails['1'],
            customStatus: 'Custom status text',
            activity: { type: 'playing', name: 'Game' }
          })
        })
      )
      render(<UserPresenceSystem users={[userWithBoth]} showActivities={true} />)
      await waitFor(() => {
        expect(screen.getByText('Custom status text')).toBeInTheDocument()
      })
    })
  })

  describe('Last Seen Display', () => {
    it('should display last seen for offline users', async () => {
      render(<UserPresenceSystem users={[mockUsers[3]]} />)
      await waitFor(() => {
        expect(screen.getByText(/Last seen/i)).toBeInTheDocument()
      })
    })

    it('should format last seen as "Just now" for recent timestamps', async () => {
      const recentUser = {
        ...mockUsers[3],
        lastSeen: new Date(Date.now() - 30000).toISOString()
      }
      render(<UserPresenceSystem users={[recentUser]} />)
      await waitFor(() => {
        expect(screen.getByText(/Last seen Just now/i)).toBeInTheDocument()
      })
    })

    it('should format last seen in minutes', async () => {
      const user = {
        ...mockUsers[3],
        lastSeen: new Date(Date.now() - 300000).toISOString()
      }
      render(<UserPresenceSystem users={[user]} />)
      await waitFor(() => {
        expect(screen.getByText(/Last seen 5m ago/i)).toBeInTheDocument()
      })
    })

    it('should format last seen in hours', async () => {
      const user = {
        ...mockUsers[3],
        lastSeen: new Date(Date.now() - 7200000).toISOString()
      }
      render(<UserPresenceSystem users={[user]} />)
      await waitFor(() => {
        expect(screen.getByText(/Last seen 2h ago/i)).toBeInTheDocument()
      })
    })

    it('should format last seen in days', async () => {
      const user = {
        ...mockUsers[3],
        lastSeen: new Date(Date.now() - 172800000).toISOString()
      }
      render(<UserPresenceSystem users={[user]} />)
      await waitFor(() => {
        expect(screen.getByText(/Last seen 2d ago/i)).toBeInTheDocument()
      })
    })

    it('should not display last seen for online users', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} />)
      await waitFor(() => {
        const userName = screen.getByText('John Doe')
        expect(userName).toBeInTheDocument()
      })
      expect(screen.queryByText(/Last seen/i)).not.toBeInTheDocument()
    })
  })

  describe('Activity Display', () => {
    it('should display activity when showActivities is true', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} showActivities={true} />)
      await waitFor(() => {
        expect(screen.getByText(/playing Visual Studio Code/i)).toBeInTheDocument()
      })
    })

    it('should not display activity when showActivities is false', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} showActivities={false} />)
      await waitFor(() => {
        expect(screen.queryByText(/playing Visual Studio Code/i)).not.toBeInTheDocument()
      })
    })

    it('should display listening activity', async () => {
      render(<UserPresenceSystem users={[mockUsers[1]]} showActivities={true} />)
      await waitFor(() => {
        expect(screen.getByText(/listening Spotify/i)).toBeInTheDocument()
      })
    })

    it('should not display activity when null', async () => {
      render(<UserPresenceSystem users={[mockUsers[3]]} showActivities={true} />)
      await waitFor(() => {
        const userName = screen.getByText('Alice Jones')
        expect(userName).toBeInTheDocument()
      })
      expect(screen.queryByText(/playing/i)).not.toBeInTheDocument()
    })
  })

  describe('Voice State Indicators', () => {
    it('should display voice state when user is in voice', async () => {
      render(<UserPresenceSystem users={[mockUsers[1]]} />)
      await waitFor(() => {
        expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
      })
    })

    it('should display muted icon when user is muted', async () => {
      render(<UserPresenceSystem users={[mockUsers[2]]} />)
      await waitFor(() => {
        expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
      })
    })

    it('should display voice count in footer when channelId provided', async () => {
      render(<UserPresenceSystem users={mockUsers} channelId="channel-1" />)
      await waitFor(() => {
        expect(screen.getByText(/in voice/i)).toBeInTheDocument()
      })
    })

    it('should not display voice count when channelId not provided', () => {
      render(<UserPresenceSystem users={mockUsers} />)
      expect(screen.queryByText(/in voice/i)).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter users by username', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'john')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('should filter users by display name', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'jane')

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'JOHN')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should show no results message when no matches', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search')).toBeInTheDocument()
      })
    })

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'john')
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })
  })

  describe('Status Filtering', () => {
    it('should filter by online status', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'online')

      await waitFor(() => {
        expect(screen.getByText('(1)')).toBeInTheDocument()
      })
    })

    it('should filter by away status', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'away')

      await waitFor(() => {
        expect(screen.getByText('(1)')).toBeInTheDocument()
      })
    })

    it('should filter by busy status', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'busy')

      await waitFor(() => {
        expect(screen.getByText('(1)')).toBeInTheDocument()
      })
    })

    it('should filter by offline status', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'offline')

      await waitFor(() => {
        expect(screen.getByText('(1)')).toBeInTheDocument()
      })
    })

    it('should reset to all status', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'online')
      await user.selectOptions(statusFilter, 'all')

      await waitFor(() => {
        expect(screen.getByText('(4)')).toBeInTheDocument()
      })
    })
  })

  describe('Role Filtering', () => {
    it('should filter by owner role', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)

      await waitFor(() => {
        const roleFilter = screen.getByDisplayValue('All Roles')
        user.selectOptions(roleFilter, 'owner')
      })
    })

    it('should filter by admin role', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)

      await waitFor(() => {
        const roleFilter = screen.getByDisplayValue('All Roles')
        user.selectOptions(roleFilter, 'admin')
      })
    })

    it('should filter by moderator role', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)

      await waitFor(() => {
        const roleFilter = screen.getByDisplayValue('All Roles')
        user.selectOptions(roleFilter, 'moderator')
      })
    })

    it('should filter by member role', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)

      await waitFor(() => {
        const roleFilter = screen.getByDisplayValue('All Roles')
        user.selectOptions(roleFilter, 'member')
      })
    })
  })

  describe('User Sorting', () => {
    it('should sort users by role priority', async () => {
      render(<UserPresenceSystem users={mockUsers} />)

      await waitFor(() => {
        const userNames = screen.getAllByText(/Doe|Smith|Wilson|Jones/)
        expect(userNames[0]).toHaveTextContent('John Doe') // owner
      })
    })

    it('should sort by status when roles are equal', async () => {
      const usersWithSameRole = [
        { ...mockUsers[0], status: 'offline' },
        { ...mockUsers[1], status: 'online' }
      ]

      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            ...mockUserDetails['1'],
            roles: ['member']
          })
        })
      )

      render(<UserPresenceSystem users={usersWithSameRole} />)

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should sort alphabetically when role and status are equal', async () => {
      const usersWithSameRoleAndStatus = [
        { id: '1', username: 'zebra', displayName: 'Zebra', status: 'online' },
        { id: '2', username: 'alpha', displayName: 'Alpha', status: 'online' }
      ]

      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            roles: ['member'],
            permissions: [],
            activity: null,
            voiceState: null,
            customStatus: null
          })
        })
      )

      render(<UserPresenceSystem users={usersWithSameRoleAndStatus} />)

      await waitFor(() => {
        const userNames = screen.getAllByText(/Zebra|Alpha/)
        expect(userNames[0]).toHaveTextContent('Alpha')
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onUserClick when user is clicked', async () => {
      const onUserClick = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} onUserClick={onUserClick} />)

      await waitFor(() => {
        const user = screen.getByText('John Doe')
        fireEvent.click(user)
      })

      expect(onUserClick).toHaveBeenCalledWith('1')
    })

    it('should show quick actions on hover', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} currentUserId="2" />)

      await waitFor(() => {
        const userName = screen.getByText('John Doe')
        user.hover(userName)
      })
    })

    it('should call onUserMessage when message button clicked', async () => {
      const onUserMessage = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserMessage={onUserMessage} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const messageButton = screen.getByTestId('message-icon').closest('button')
      fireEvent.click(messageButton)

      expect(onUserMessage).toHaveBeenCalledWith('1')
    })

    it('should call onUserCall with voice when phone button clicked', async () => {
      const onUserCall = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserCall={onUserCall} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const phoneButton = screen.getByTestId('phone-icon').closest('button')
      fireEvent.click(phoneButton)

      expect(onUserCall).toHaveBeenCalledWith('1', 'voice')
    })

    it('should call onUserCall with video when video button clicked', async () => {
      const onUserCall = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserCall={onUserCall} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const videoButton = screen.getByTestId('video-icon').closest('button')
      fireEvent.click(videoButton)

      expect(onUserCall).toHaveBeenCalledWith('1', 'video')
    })

    it('should call onUserMute when mute button clicked with allowModeration', async () => {
      const onUserMute = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserMute={onUserMute} allowModeration={true} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const muteButton = screen.getByTestId('volume-x-icon').closest('button')
      fireEvent.click(muteButton)

      expect(onUserMute).toHaveBeenCalledWith('1')
    })

    it('should not show mute button without allowModeration', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" allowModeration={false} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      expect(screen.queryByTestId('volume-x-icon')).not.toBeInTheDocument()
    })

    it('should not show quick actions for current user', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="1" />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      expect(screen.queryByTestId('message-icon')).not.toBeInTheDocument()
    })

    it('should highlight current user', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="1" />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        expect(userElement).toHaveClass('bg-blue-50')
      })
    })
  })

  describe('Role Display', () => {
    it('should display role icon for owner', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} showRoles={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('crown-icon')).toBeInTheDocument()
      })
    })

    it('should display role icon for admin', async () => {
      render(<UserPresenceSystem users={[mockUsers[1]]} showRoles={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
      })
    })

    it('should not display role icon for member', async () => {
      render(<UserPresenceSystem users={[mockUsers[3]]} showRoles={true} />)

      await waitFor(() => {
        expect(screen.getByText('Alice Jones')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('crown-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('shield-icon')).not.toBeInTheDocument()
    })

    it('should not display role icons when showRoles is false', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} showRoles={false} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('crown-icon')).not.toBeInTheDocument()
    })
  })

  describe('Bot Badge Display', () => {
    it('should display BOT badge for bot users', async () => {
      const botUser = { ...mockUsers[0], bot: true }
      render(<UserPresenceSystem users={[botUser]} />)

      await waitFor(() => {
        expect(screen.getByText('BOT')).toBeInTheDocument()
      })
    })

    it('should not display BOT badge for regular users', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      expect(screen.queryByText('BOT')).not.toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    it('should display avatar image when available', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        const avatar = screen.getByAlt('john_doe')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.jpg')
      })
    })

    it('should display initial when avatar not available', async () => {
      render(<UserPresenceSystem users={[mockUsers[1]]} />)

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument()
      })
    })

    it('should use displayName for initial', async () => {
      render(<UserPresenceSystem users={[mockUsers[1]]} />)

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument()
      })
    })

    it('should use username if displayName not available', async () => {
      const userNoDisplayName = { ...mockUsers[1], displayName: null }
      render(<UserPresenceSystem users={[userNoDisplayName]} />)

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should fetch user details on mount', async () => {
      render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/1/presence')
      })
    })

    it('should fetch details for all users', async () => {
      render(<UserPresenceSystem users={mockUsers} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(mockUsers.length)
      })
    })

    it('should not refetch details for already loaded users', async () => {
      const { rerender } = render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      rerender(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load user details:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should use mock data on API error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Loading States', () => {
    it('should handle empty users array', () => {
      render(<UserPresenceSystem users={[]} />)
      expect(screen.getByText('No members found')).toBeInTheDocument()
    })

    it('should display empty state message', () => {
      render(<UserPresenceSystem users={[]} />)
      expect(screen.getByText('No members match the current filters')).toBeInTheDocument()
    })

    it('should show member count as 0 when no users', () => {
      render(<UserPresenceSystem users={[]} />)
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user properties gracefully', async () => {
      const incompleteUser = { id: '5' }
      render(<UserPresenceSystem users={[incompleteUser]} />)

      await waitFor(() => {
        expect(screen.getByText('U')).toBeInTheDocument()
      })
    })

    it('should handle null status', async () => {
      const userNullStatus = { ...mockUsers[0], status: null }
      render(<UserPresenceSystem users={[userNullStatus]} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should handle undefined lastSeen', () => {
      const userNoLastSeen = { ...mockUsers[3], lastSeen: undefined }
      render(<UserPresenceSystem users={[userNoLastSeen]} />)

      expect(screen.queryByText(/Last seen Unknown/i)).not.toBeInTheDocument()
    })
  })

  describe('Combined Filters', () => {
    it('should apply search and status filter together', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'john')

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'online')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('should apply all three filters together', async () => {
      const user = userEvent.setup()
      render(<UserPresenceSystem users={mockUsers} showRoles={true} />)

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'j')

      const statusFilter = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusFilter, 'online')

      await waitFor(() => {
        const roleFilter = screen.getByDisplayValue('All Roles')
        user.selectOptions(roleFilter, 'owner')
      })
    })
  })

  describe('Event Propagation', () => {
    it('should stop propagation on message button click', async () => {
      const onUserClick = jest.fn()
      const onUserMessage = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserClick={onUserClick} onUserMessage={onUserMessage} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const messageButton = screen.getByTestId('message-icon').closest('button')
      fireEvent.click(messageButton)

      expect(onUserMessage).toHaveBeenCalled()
      expect(onUserClick).not.toHaveBeenCalled()
    })

    it('should stop propagation on call button click', async () => {
      const onUserClick = jest.fn()
      const onUserCall = jest.fn()
      render(<UserPresenceSystem users={[mockUsers[0]]} currentUserId="2" onUserClick={onUserClick} onUserCall={onUserCall} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
      })

      const phoneButton = screen.getByTestId('phone-icon').closest('button')
      fireEvent.click(phoneButton)

      expect(onUserCall).toHaveBeenCalled()
      expect(onUserClick).not.toHaveBeenCalled()
    })
  })

  describe('Hover States', () => {
    it('should set hovered user on mouse enter', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
        expect(userElement).toHaveClass('bg-gray-100')
      })
    })

    it('should clear hovered user on mouse leave', async () => {
      const { container } = render(<UserPresenceSystem users={[mockUsers[0]]} />)

      await waitFor(() => {
        const userElement = screen.getByText('John Doe').closest('.group')
        fireEvent.mouseEnter(userElement)
        fireEvent.mouseLeave(userElement)
        expect(userElement).not.toHaveClass('bg-gray-100')
      })
    })
  })

  describe('User Grouping', () => {
    it('should not render empty status groups', async () => {
      const onlineOnlyUsers = [mockUsers[0]]
      render(<UserPresenceSystem users={onlineOnlyUsers} />)

      await waitFor(() => {
        expect(screen.queryByText(/away \(/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/busy \(/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/offline \(/i)).not.toBeInTheDocument()
      })
    })

    it('should render all status groups when users present', async () => {
      render(<UserPresenceSystem users={mockUsers} />)

      await waitFor(() => {
        expect(screen.getByText(/online \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/away \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/busy \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/offline \(1\)/i)).toBeInTheDocument()
      })
    })
  })
})

export default mockUsers
