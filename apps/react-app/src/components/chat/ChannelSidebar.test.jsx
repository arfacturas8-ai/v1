import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ChannelSidebar from './ChannelSidebar'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Hash: ({ className }) => <span className={className} data-testid="icon-hash" />,
  Volume2: ({ className }) => <span className={className} data-testid="icon-volume2" />,
  Lock: ({ className }) => <span className={className} data-testid="icon-lock" />,
  Users: ({ className }) => <span className={className} data-testid="icon-users" />,
  Settings: ({ className }) => <span className={className} data-testid="icon-settings" />,
  Plus: ({ className }) => <span className={className} data-testid="icon-plus" />,
  ChevronDown: ({ className }) => <span className={className} data-testid="icon-chevron-down" />,
  ChevronRight: ({ className }) => <span className={className} data-testid="icon-chevron-right" />,
  Mic: ({ className }) => <span className={className} data-testid="icon-mic" />,
  MicOff: ({ className }) => <span className={className} data-testid="icon-mic-off" />,
  Headphones: ({ className }) => <span className={className} data-testid="icon-headphones" />,
  Phone: ({ className }) => <span className={className} data-testid="icon-phone" />,
  Video: ({ className }) => <span className={className} data-testid="icon-video" />,
  Crown: ({ className }) => <span className={className} data-testid="icon-crown" />,
  Shield: ({ className }) => <span className={className} data-testid="icon-shield" />,
  User: ({ className }) => <span className={className} data-testid="icon-user" />,
  MessageCircle: ({ className }) => <span className={className} data-testid="icon-message-circle" />,
  Search: ({ className }) => <span className={className} data-testid="icon-search" />,
  Bell: ({ className }) => <span className={className} data-testid="icon-bell" />,
  BellOff: ({ className }) => <span className={className} data-testid="icon-bell-off" />,
  MoreHorizontal: ({ className }) => <span className={className} data-testid="icon-more-horizontal" />,
  UserPlus: ({ className }) => <span className={className} data-testid="icon-user-plus" />
}))

describe('ChannelSidebar', () => {
  const mockUser = {
    id: 'user-1',
    username: 'TestUser',
    discriminator: '1234',
    avatar: null
  }

  const mockServers = [
    { id: 'server-1', name: 'Test Server', icon: null },
    { id: 'server-2', name: 'Gaming Server', icon: 'https://example.com/icon.png' },
    { id: 'server-3', name: 'Dev Server', icon: null }
  ]

  const mockChannels = [
    { id: 'channel-1', serverId: 'server-1', name: 'general', type: 'text', unreadCount: 0 },
    { id: 'channel-2', serverId: 'server-1', name: 'announcements', type: 'text', unreadCount: 5 },
    { id: 'channel-3', serverId: 'server-1', name: 'General Voice', type: 'voice', connectedUsers: [] },
    { id: 'channel-4', serverId: 'server-1', name: 'private-chat', type: 'text', private: true, unreadCount: 0 },
    { id: 'channel-5', serverId: 'server-1', name: 'Gaming Room', type: 'voice', connectedUsers: ['user-2', 'user-3'] },
    { id: 'channel-6', serverId: 'server-2', name: 'other-server', type: 'text', unreadCount: 0 }
  ]

  const mockDirectMessages = [
    {
      id: 'dm-1',
      participant: { id: 'user-2', username: 'Alice', avatar: null },
      lastMessage: { content: 'Hey there!', timestamp: new Date().toISOString() },
      unreadCount: 2
    },
    {
      id: 'dm-2',
      participant: { id: 'user-3', username: 'Bob', avatar: 'https://example.com/avatar.png' },
      lastMessage: { content: 'See you later', timestamp: new Date(Date.now() - 3600000).toISOString() },
      unreadCount: 0
    }
  ]

  const mockOnlineUsers = new Map([
    ['user-2', { username: 'Alice', status: 'online', activity: 'Playing a game' }],
    ['user-3', { username: 'Bob', status: 'away', muted: true }]
  ])

  const defaultProps = {
    servers: mockServers,
    channels: mockChannels,
    directMessages: mockDirectMessages,
    currentServer: 'server-1',
    currentChannel: 'channel-1',
    onServerChange: jest.fn(),
    onChannelChange: jest.fn(),
    onVoiceChannelJoin: jest.fn(),
    onDirectMessageSelect: jest.fn(),
    onToggleCollapse: jest.fn(),
    user: mockUser,
    onlineUsers: mockOnlineUsers,
    collapsed: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the sidebar with server name', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Test Server')).toBeInTheDocument()
    })

    it('should render with default server name when currentServer is not found', () => {
      render(<ChannelSidebar {...defaultProps} currentServer="non-existent" />)
      expect(screen.getByText('CRYB Server')).toBeInTheDocument()
    })

    it('should render user information in user panel', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('TestUser')).toBeInTheDocument()
      expect(screen.getByText('#1234')).toBeInTheDocument()
    })

    it('should render user avatar when provided', () => {
      const userWithAvatar = { ...mockUser, avatar: 'https://example.com/avatar.png' }
      render(<ChannelSidebar {...defaultProps} user={userWithAvatar} />)
      const avatar = screen.getAllByAltText('TestUser')[0]
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
    })

    it('should render user initial when avatar is not provided', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByPlaceholderText('Search channels...')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(<ChannelSidebar {...defaultProps} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Channel Categories', () => {
    it('should render text channels category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Text Channels')).toBeInTheDocument()
    })

    it('should render voice channels category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Voice Channels')).toBeInTheDocument()
    })

    it('should render direct messages category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    it('should expand categories by default', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('general')).toBeInTheDocument()
      expect(screen.getByText('General Voice')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should toggle text channels category collapse', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const textChannelsButton = screen.getByText('Text Channels').closest('button')

      fireEvent.click(textChannelsButton)
      expect(screen.queryByText('general')).not.toBeInTheDocument()

      fireEvent.click(textChannelsButton)
      expect(screen.getByText('general')).toBeInTheDocument()
    })

    it('should toggle voice channels category collapse', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const voiceChannelsButton = screen.getByText('Voice Channels').closest('button')

      fireEvent.click(voiceChannelsButton)
      expect(screen.queryByText('General Voice')).not.toBeInTheDocument()

      fireEvent.click(voiceChannelsButton)
      expect(screen.getByText('General Voice')).toBeInTheDocument()
    })

    it('should toggle direct messages category collapse', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const dmButton = screen.getByText('Direct Messages').closest('button')

      fireEvent.click(dmButton)
      expect(screen.queryByText('Alice')).not.toBeInTheDocument()

      fireEvent.click(dmButton)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  describe('Channel List Rendering', () => {
    it('should render all text channels for current server', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('general')).toBeInTheDocument()
      expect(screen.getByText('announcements')).toBeInTheDocument()
      expect(screen.getByText('private-chat')).toBeInTheDocument()
    })

    it('should not render channels from other servers', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.queryByText('other-server')).not.toBeInTheDocument()
    })

    it('should render all voice channels for current server', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('General Voice')).toBeInTheDocument()
      expect(screen.getByText('Gaming Room')).toBeInTheDocument()
    })

    it('should render channel icons correctly for text channels', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalChannel = screen.getByText('general').closest('button')
      expect(within(generalChannel).getByTestId('icon-hash')).toBeInTheDocument()
    })

    it('should render lock icon for private channels', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const privateChannel = screen.getByText('private-chat').closest('button')
      expect(within(privateChannel).getByTestId('icon-lock')).toBeInTheDocument()
    })

    it('should render voice icon for voice channels', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const voiceChannel = screen.getByText('General Voice').closest('button')
      expect(within(voiceChannel).getByTestId('icon-volume2')).toBeInTheDocument()
    })
  })

  describe('Channel Selection', () => {
    it('should call onChannelChange when text channel is clicked', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalChannel = screen.getByText('general').closest('button')
      fireEvent.click(generalChannel)
      expect(defaultProps.onChannelChange).toHaveBeenCalledWith('channel-1')
    })

    it('should highlight active channel', () => {
      render(<ChannelSidebar {...defaultProps} currentChannel="channel-2" />)
      const activeChannel = screen.getByText('announcements').closest('button')
      expect(activeChannel).toHaveClass('bg-gray-600/50')
      expect(activeChannel).toHaveClass('text-white')
    })

    it('should call onVoiceChannelJoin when voice channel is clicked', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const voiceChannel = screen.getByText('General Voice').closest('button')
      fireEvent.click(voiceChannel)
      expect(defaultProps.onVoiceChannelJoin).toHaveBeenCalledWith('channel-3')
    })

    it('should highlight active voice channel', () => {
      render(<ChannelSidebar {...defaultProps} currentChannel="channel-3" />)
      const activeVoiceChannel = screen.getByText('General Voice').closest('button')
      expect(activeVoiceChannel).toHaveClass('bg-gray-600/50')
    })
  })

  describe('Unread Indicators', () => {
    it('should display unread count for channels with unread messages', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const announcementsChannel = screen.getByText('announcements').closest('button')
      expect(within(announcementsChannel).getByText('5')).toBeInTheDocument()
    })

    it('should not display unread indicator for channels without unread messages', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalChannel = screen.getByText('general').closest('button')
      expect(within(generalChannel).queryByText(/^\d+$/)).not.toBeInTheDocument()
    })

    it('should display 99+ for channels with more than 99 unread messages', () => {
      const channelsWithManyUnread = [
        ...mockChannels,
        { id: 'channel-7', serverId: 'server-1', name: 'spam', type: 'text', unreadCount: 150 }
      ]
      render(<ChannelSidebar {...defaultProps} channels={channelsWithManyUnread} />)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('should display unread count for direct messages', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const aliceDM = screen.getByText('Alice').closest('button')
      expect(within(aliceDM).getByText('2')).toBeInTheDocument()
    })

    it('should not display unread count for DMs without unread messages', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const bobDM = screen.getByText('Bob').closest('button')
      expect(within(bobDM).queryByText(/^\d+$/)).not.toBeInTheDocument()
    })
  })

  describe('Channel Hover Actions', () => {
    it('should show action buttons when hovering over channel', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const generalChannel = screen.getByText('general').closest('button')

      await user.hover(generalChannel)
      await waitFor(() => {
        expect(within(generalChannel).getByTestId('icon-user-plus')).toBeInTheDocument()
        expect(within(generalChannel).getByTestId('icon-settings')).toBeInTheDocument()
      })
    })

    it('should hide action buttons when not hovering', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalChannel = screen.getByText('general').closest('button')

      const actionButtons = within(generalChannel).queryAllByTestId(/icon-(user-plus|settings)/)
      actionButtons.forEach(button => {
        expect(button.closest('div')).toHaveClass('opacity-0')
      })
    })

    it('should show voice actions when hovering over voice channel', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const voiceChannel = screen.getByText('General Voice').closest('button')

      await user.hover(voiceChannel)
      await waitFor(() => {
        expect(within(voiceChannel).getByTestId('icon-phone')).toBeInTheDocument()
        expect(within(voiceChannel).getByTestId('icon-video')).toBeInTheDocument()
      })
    })
  })

  describe('Voice Channel Connected Users', () => {
    it('should display count of connected users', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const gamingRoom = screen.getByText('Gaming Room').closest('div')
      expect(within(gamingRoom).getByText('2')).toBeInTheDocument()
    })

    it('should display connected users list', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const connectedUsers = screen.getAllByText('Alice')
      expect(connectedUsers.length).toBeGreaterThan(0)
    })

    it('should display muted icon for muted users in voice channel', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const gamingRoomSection = screen.getByText('Gaming Room').closest('div').parentElement
      expect(within(gamingRoomSection).getByTestId('icon-mic-off')).toBeInTheDocument()
    })

    it('should display user placeholder for unknown users', () => {
      const channelsWithUnknownUser = [
        ...mockChannels.slice(0, -1),
        { id: 'channel-5', serverId: 'server-1', name: 'Gaming Room', type: 'voice', connectedUsers: ['unknown-user'] }
      ]
      render(<ChannelSidebar {...defaultProps} channels={channelsWithUnknownUser} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should not display connected users for empty voice channels', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalVoice = screen.getByText('General Voice').closest('div')
      expect(within(generalVoice).queryByTestId('icon-user')).not.toBeInTheDocument()
    })
  })

  describe('Direct Messages', () => {
    it('should render all direct messages', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should display last message content', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Hey there!')).toBeInTheDocument()
      expect(screen.getByText('See you later')).toBeInTheDocument()
    })

    it('should display online status indicator', () => {
      const { container } = render(<ChannelSidebar {...defaultProps} />)
      const statusIndicators = container.querySelectorAll('.bg-green-500')
      expect(statusIndicators.length).toBeGreaterThan(0)
    })

    it('should display away status indicator', () => {
      const { container } = render(<ChannelSidebar {...defaultProps} />)
      const awayIndicators = container.querySelectorAll('.bg-yellow-500')
      expect(awayIndicators.length).toBeGreaterThan(0)
    })

    it('should display user activity', () => {
      render(<ChannelSidebar {...defaultProps} />)
      expect(screen.getByText('Playing a game')).toBeInTheDocument()
    })

    it('should call onDirectMessageSelect when DM is clicked', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const aliceDM = screen.getByText('Alice').closest('button')
      fireEvent.click(aliceDM)
      expect(defaultProps.onDirectMessageSelect).toHaveBeenCalledWith('dm-1')
    })

    it('should render participant avatar when provided', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const bobAvatar = screen.getByAltText('Bob')
      expect(bobAvatar).toHaveAttribute('src', 'https://example.com/avatar.png')
    })

    it('should render participant initial when avatar is not provided', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const aliceSection = screen.getByText('Alice').closest('button')
      expect(within(aliceSection).getByText('A')).toBeInTheDocument()
    })

    it('should display "Unknown User" for DM without participant info', () => {
      const dmsWithUnknown = [
        ...mockDirectMessages,
        { id: 'dm-3', participant: null, lastMessage: null, unreadCount: 0 }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={dmsWithUnknown} />)
      expect(screen.getByText('Unknown User')).toBeInTheDocument()
    })
  })

  describe('Channel Search', () => {
    it('should filter direct messages by username', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search channels...')

      await user.type(searchInput, 'Alice')

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })

    it('should filter direct messages by message content', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search channels...')

      await user.type(searchInput, 'Hey there')

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search channels...')

      await user.type(searchInput, 'ALICE')

      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should show all DMs when search is cleared', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search channels...')

      await user.type(searchInput, 'Alice')
      await user.clear(searchInput)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should show no results when search does not match', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search channels...')

      await user.type(searchInput, 'NonExistent')

      expect(screen.queryByText('Alice')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })
  })

  describe('User Settings', () => {
    it('should toggle mute state when mic button is clicked', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const micButton = screen.getAllByTestId('icon-mic')[0].closest('button')

      fireEvent.click(micButton)
      expect(screen.getByTestId('icon-mic-off')).toBeInTheDocument()

      fireEvent.click(micButton)
      expect(screen.getAllByTestId('icon-mic')[0]).toBeInTheDocument()
    })

    it('should toggle deafen state when headphones button is clicked', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const headphonesButtons = screen.getAllByTestId('icon-headphones')
      const userPanelButton = headphonesButtons[headphonesButtons.length - 1].closest('button')

      fireEvent.click(userPanelButton)
      fireEvent.click(userPanelButton)

      expect(screen.getAllByTestId('icon-headphones').length).toBeGreaterThan(0)
    })

    it('should apply red color to muted mic icon', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const micButton = screen.getAllByTestId('icon-mic')[0].closest('button')

      fireEvent.click(micButton)

      expect(micButton).toHaveClass('text-red-400')
    })

    it('should apply red color to deafened headphones icon', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const headphonesButtons = screen.getAllByTestId('icon-headphones')
      const userPanelButton = headphonesButtons[headphonesButtons.length - 1].closest('button')

      fireEvent.click(userPanelButton)

      expect(userPanelButton).toHaveClass('text-red-400')
    })

    it('should render settings button in user panel', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const userPanel = screen.getByText('TestUser').closest('div').parentElement
      const settingsButtons = within(userPanel).getAllByTestId('icon-settings')
      expect(settingsButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Collapsed State', () => {
    it('should render collapsed view when collapsed prop is true', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      expect(screen.queryByText('Test Server')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Search channels...')).not.toBeInTheDocument()
    })

    it('should render server icons in collapsed view', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      expect(screen.getByText('T')).toBeInTheDocument()
      expect(screen.getByText('G')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })

    it('should render server icon image when provided', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const serverIcon = screen.getByAltText('Gaming Server')
      expect(serverIcon).toHaveAttribute('src', 'https://example.com/icon.png')
    })

    it('should call onServerChange when server icon is clicked in collapsed view', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const serverButton = screen.getByText('G').closest('button')
      fireEvent.click(serverButton)
      expect(defaultProps.onServerChange).toHaveBeenCalledWith('server-2')
    })

    it('should highlight current server in collapsed view', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const currentServerButton = screen.getByText('T').closest('button')
      expect(currentServerButton).toHaveClass('rounded-lg')
      expect(currentServerButton).toHaveClass('bg-indigo-600')
    })

    it('should show server tooltip on hover in collapsed view', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const serverButton = screen.getByText('T').closest('button')

      await user.hover(serverButton)

      await waitFor(() => {
        expect(screen.getByText('Test Server')).toBeInTheDocument()
      })
    })

    it('should hide server tooltip on mouse leave in collapsed view', async () => {
      const user = userEvent.setup()
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const serverButton = screen.getByText('T').closest('button')

      await user.hover(serverButton)
      await user.unhover(serverButton)

      await waitFor(() => {
        expect(screen.queryByText('Test Server')).not.toBeInTheDocument()
      })
    })

    it('should render expand button in collapsed view', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const expandButton = screen.getByTestId('icon-chevron-right').closest('button')
      expect(expandButton).toBeInTheDocument()
    })

    it('should call onToggleCollapse when expand button is clicked', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      const expandButton = screen.getByTestId('icon-chevron-right').closest('button')
      fireEvent.click(expandButton)
      expect(defaultProps.onToggleCollapse).toHaveBeenCalled()
    })
  })

  describe('Collapse/Expand Toggle', () => {
    it('should call onToggleCollapse when collapse button is clicked in expanded view', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const collapseButton = screen.getByTestId('icon-chevron-down').closest('button')
      fireEvent.click(collapseButton)
      expect(defaultProps.onToggleCollapse).toHaveBeenCalled()
    })

    it('should render collapse button in server header', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const header = screen.getByText('Test Server').closest('div')
      expect(within(header).getByTestId('icon-chevron-down')).toBeInTheDocument()
    })
  })

  describe('Server Management', () => {
    it('should display multiple servers', () => {
      render(<ChannelSidebar {...defaultProps} collapsed={true} />)
      expect(screen.getByText('T')).toBeInTheDocument()
      expect(screen.getByText('G')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })

    it('should handle empty servers array', () => {
      render(<ChannelSidebar {...defaultProps} servers={[]} collapsed={true} />)
      expect(screen.queryByText('T')).not.toBeInTheDocument()
    })

    it('should filter channels by current server', () => {
      render(<ChannelSidebar {...defaultProps} currentServer="server-2" />)
      expect(screen.queryByText('general')).not.toBeInTheDocument()
      expect(screen.queryByText('announcements')).not.toBeInTheDocument()
    })
  })

  describe('Last Seen Formatting', () => {
    it('should display "Just now" for recent messages', () => {
      const recentDMs = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: 'Hey!', timestamp: new Date().toISOString() },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={recentDMs} />)
      expect(screen.getByText('Just now')).toBeInTheDocument()
    })

    it('should display minutes ago for messages under 1 hour', () => {
      const recentDMs = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: 'Hey!', timestamp: new Date(Date.now() - 1800000).toISOString() },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={recentDMs} />)
      expect(screen.getByText('30m ago')).toBeInTheDocument()
    })

    it('should display hours ago for messages under 1 day', () => {
      const oldDMs = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: 'Hey!', timestamp: new Date(Date.now() - 7200000).toISOString() },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={oldDMs} />)
      expect(screen.getByText('2h ago')).toBeInTheDocument()
    })

    it('should display days ago for old messages', () => {
      const oldDMs = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: 'Hey!', timestamp: new Date(Date.now() - 172800000).toISOString() },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={oldDMs} />)
      expect(screen.getByText('2d ago')).toBeInTheDocument()
    })

    it('should display "Unknown" for missing timestamp', () => {
      const dmsNoTimestamp = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: 'Hey!', timestamp: null },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={dmsNoTimestamp} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Default Props', () => {
    it('should handle missing servers prop', () => {
      const { servers, ...propsWithoutServers } = defaultProps
      render(<ChannelSidebar {...propsWithoutServers} />)
      expect(screen.getByText('CRYB Server')).toBeInTheDocument()
    })

    it('should handle missing channels prop', () => {
      const { channels, ...propsWithoutChannels } = defaultProps
      render(<ChannelSidebar {...propsWithoutChannels} />)
      expect(screen.getByText('Text Channels')).toBeInTheDocument()
    })

    it('should handle missing directMessages prop', () => {
      const { directMessages, ...propsWithoutDMs } = defaultProps
      render(<ChannelSidebar {...propsWithoutDMs} />)
      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    it('should handle missing onlineUsers prop', () => {
      const { onlineUsers, ...propsWithoutOnlineUsers } = defaultProps
      render(<ChannelSidebar {...propsWithoutOnlineUsers} />)
      expect(screen.getByText('TestUser')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle DM without last message', () => {
      const dmsWithoutMessage = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: null,
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={dmsWithoutMessage} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should handle attachment as last message', () => {
      const dmsWithAttachment = [
        {
          id: 'dm-1',
          participant: { id: 'user-2', username: 'Alice', avatar: null },
          lastMessage: { content: '', timestamp: new Date().toISOString() },
          unreadCount: 0
        }
      ]
      render(<ChannelSidebar {...defaultProps} directMessages={dmsWithAttachment} />)
      expect(screen.getByText('Attachment')).toBeInTheDocument()
    })

    it('should handle user without username', () => {
      const userWithoutName = { ...mockUser, username: null }
      render(<ChannelSidebar {...defaultProps} user={userWithoutName} />)
      expect(screen.getByText('Anonymous')).toBeInTheDocument()
      expect(screen.getByText('#0000')).toBeInTheDocument()
    })

    it('should handle user without discriminator', () => {
      const userWithoutDiscriminator = { ...mockUser, discriminator: null }
      render(<ChannelSidebar {...defaultProps} user={userWithoutDiscriminator} />)
      expect(screen.getByText('#0000')).toBeInTheDocument()
    })

    it('should handle empty channel connectedUsers array', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const generalVoice = screen.getByText('General Voice').closest('button')
      expect(within(generalVoice).queryByText(/\d+/)).not.toBeInTheDocument()
    })

    it('should render user status colors correctly', () => {
      const { container } = render(<ChannelSidebar {...defaultProps} />)

      expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
      expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()
    })

    it('should handle busy status color', () => {
      const busyOnlineUsers = new Map([
        ['user-2', { username: 'Alice', status: 'busy' }]
      ])
      const { container } = render(<ChannelSidebar {...defaultProps} onlineUsers={busyOnlineUsers} />)
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
    })

    it('should handle invisible status color', () => {
      const invisibleOnlineUsers = new Map([
        ['user-2', { username: 'Alice', status: 'invisible' }]
      ])
      const { container } = render(<ChannelSidebar {...defaultProps} onlineUsers={invisibleOnlineUsers} />)
      expect(container.querySelector('.bg-gray-500')).toBeInTheDocument()
    })
  })

  describe('Plus Buttons for Categories', () => {
    it('should render plus button for text channels category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const textChannelsHeader = screen.getByText('Text Channels').closest('button')
      expect(within(textChannelsHeader).getByTestId('icon-plus')).toBeInTheDocument()
    })

    it('should render plus button for voice channels category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const voiceChannelsHeader = screen.getByText('Voice Channels').closest('button')
      expect(within(voiceChannelsHeader).getByTestId('icon-plus')).toBeInTheDocument()
    })

    it('should render plus button for direct messages category', () => {
      render(<ChannelSidebar {...defaultProps} />)
      const dmHeader = screen.getByText('Direct Messages').closest('button')
      expect(within(dmHeader).getByTestId('icon-plus')).toBeInTheDocument()
    })
  })
})

export default mockUser
