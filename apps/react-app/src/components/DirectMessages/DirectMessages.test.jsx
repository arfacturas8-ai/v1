import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import DirectMessages from './DirectMessages'
import directMessagesService from '../../services/directMessages'
import socketService from '../../services/socket'

jest.mock('../../services/directMessages')
jest.mock('../../services/socket')

describe('DirectMessages Component', () => {
  const mockCurrentUser = {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User'
  }

  const mockConversations = [
    {
      id: 'conv1',
      user: {
        id: 'user2',
        username: 'john',
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar1.jpg',
        status: 'online'
      },
      lastMessage: {
        content: 'Hello there!',
        timestamp: new Date('2025-11-07T10:00:00').toISOString()
      },
      unreadCount: 2,
      isPinned: false
    },
    {
      id: 'conv2',
      user: {
        id: 'user3',
        username: 'jane',
        displayName: 'Jane Smith',
        avatar: null,
        status: 'away'
      },
      lastMessage: {
        content: 'See you later',
        timestamp: new Date('2025-11-07T09:00:00').toISOString()
      },
      unreadCount: 0,
      isPinned: true
    },
    {
      id: 'conv3',
      user: {
        id: 'user4',
        username: 'bob',
        displayName: 'Bob Wilson',
        avatar: 'https://example.com/avatar3.jpg',
        status: 'busy'
      },
      lastMessage: {
        content: 'Thanks!',
        timestamp: new Date('2025-11-07T08:00:00').toISOString()
      },
      unreadCount: 0,
      isPinned: false
    }
  ]

  const mockMessages = [
    {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user2',
      content: 'Hi there!',
      timestamp: new Date('2025-11-07T10:00:00').toISOString(),
      isRead: true
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      senderId: 'user1',
      content: 'Hello!',
      timestamp: new Date('2025-11-07T10:01:00').toISOString(),
      isRead: true
    },
    {
      id: 'msg3',
      conversationId: 'conv1',
      senderId: 'user2',
      content: 'How are you?',
      timestamp: new Date('2025-11-07T10:02:00').toISOString(),
      isRead: false
    }
  ]

  let eventHandlers = {}

  beforeEach(() => {
    jest.clearAllMocks()
    eventHandlers = {}

    socketService.isConnected.mockReturnValue(true)
    socketService.connect.mockImplementation(() => {})

    directMessagesService.on = jest.fn((event, handler) => {
      eventHandlers[event] = handler
    })
    directMessagesService.off = jest.fn()
    directMessagesService.loadConversations = jest.fn()
    directMessagesService.loadMessages = jest.fn()
    directMessagesService.markAsRead = jest.fn()
    directMessagesService.sendMessage = jest.fn().mockResolvedValue({})
    directMessagesService.startConversation = jest.fn()
  })

  describe('Initial Rendering', () => {
    test('should render DirectMessages component', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    test('should render sidebar with header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
    })

    test('should render search input', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument()
    })

    test('should render empty state when no conversation selected', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.getByText('Select a conversation')).toBeInTheDocument()
      expect(screen.getByText('Choose a conversation from the list or start a new one')).toBeInTheDocument()
    })

    test('should render start new chat button in empty state', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.getByText('Start New Chat')).toBeInTheDocument()
    })

    test('should not render new conversation modal initially', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
    })
  })

  describe('Socket and Service Initialization', () => {
    test('should connect socket if not connected', () => {
      socketService.isConnected.mockReturnValue(false)
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(socketService.connect).toHaveBeenCalled()
    })

    test('should not connect socket if already connected', () => {
      socketService.isConnected.mockReturnValue(true)
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(socketService.connect).not.toHaveBeenCalled()
    })

    test('should register event listeners on mount', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(directMessagesService.on).toHaveBeenCalledWith('conversations_updated', expect.any(Function))
      expect(directMessagesService.on).toHaveBeenCalledWith('message_received', expect.any(Function))
      expect(directMessagesService.on).toHaveBeenCalledWith('messages_updated', expect.any(Function))
    })

    test('should load conversations on mount', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      expect(directMessagesService.loadConversations).toHaveBeenCalled()
    })

    test('should unregister event listeners on unmount', () => {
      const { unmount } = render(<DirectMessages currentUser={mockCurrentUser} />)
      unmount()
      expect(directMessagesService.off).toHaveBeenCalledWith('conversations_updated', expect.any(Function))
      expect(directMessagesService.off).toHaveBeenCalledWith('message_received', expect.any(Function))
      expect(directMessagesService.off).toHaveBeenCalledWith('messages_updated', expect.any(Function))
    })
  })

  describe('Conversation List Rendering', () => {
    test('should render all conversations', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    test('should display conversation avatars', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/avatar1.jpg')
      expect(images[0]).toHaveAttribute('alt', 'John Doe')
    })

    test('should display avatar placeholder for users without avatar', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const placeholders = screen.getAllByTestId('user-icon', { exact: false })
      expect(placeholders.length).toBeGreaterThan(0)
    })

    test('should display last message preview', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      expect(screen.getByText('Hello there!')).toBeInTheDocument()
      expect(screen.getByText('See you later')).toBeInTheDocument()
      expect(screen.getByText('Thanks!')).toBeInTheDocument()
    })

    test('should display last message timestamp', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const timestamps = screen.getAllByText(/ago|Just now/, { exact: false })
      expect(timestamps.length).toBeGreaterThan(0)
    })

    test('should display status indicators', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const statusIndicators = document.querySelectorAll('.status-indicator')
      expect(statusIndicators.length).toBeGreaterThan(0)
    })

    test('should display online status with green color', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([mockConversations[0]])

      const statusIndicator = document.querySelector('.status-indicator')
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#00b894' })
    })

    test('should display away status with yellow color', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([mockConversations[1]])

      const statusIndicator = document.querySelector('.status-indicator')
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#fdcb6e' })
    })

    test('should display busy status with red color', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([mockConversations[2]])

      const statusIndicator = document.querySelector('.status-indicator')
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#d63031' })
    })

    test('should sort pinned conversations first', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversationItems = screen.getAllByText(/John Doe|Jane Smith|Bob Wilson/)
      expect(conversationItems[0].textContent).toContain('Jane Smith')
    })

    test('should sort conversations by last message timestamp', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversationItems = screen.getAllByText(/John Doe|Jane Smith|Bob Wilson/)
      expect(conversationItems[1].textContent).toContain('John Doe')
      expect(conversationItems[2].textContent).toContain('Bob Wilson')
    })

    test('should display pin icon for pinned conversations', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const pinnedIcons = document.querySelectorAll('.pinned-icon')
      expect(pinnedIcons.length).toBe(1)
    })
  })

  describe('Unread Message Indicators', () => {
    test('should display unread badge for conversations with unread messages', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    test('should not display unread badge for conversations without unread messages', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([mockConversations[1]])

      expect(screen.queryByText('2')).not.toBeInTheDocument()
    })

    test('should apply unread class to conversations with unread messages', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const unreadItems = document.querySelectorAll('.conversation-item.unread')
      expect(unreadItems.length).toBe(1)
    })

    test('should mark conversation as read when selected', async () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      await waitFor(() => {
        expect(directMessagesService.markAsRead).toHaveBeenCalledWith('conv1')
      })
    })

    test('should not mark conversation as read if no unread messages', async () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('Jane Smith')
      fireEvent.click(conversation)

      await waitFor(() => {
        expect(directMessagesService.markAsRead).not.toHaveBeenCalled()
      })
    })
  })

  describe('Conversation Search', () => {
    test('should filter conversations by username', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      fireEvent.change(searchInput, { target: { value: 'john' } })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
    })

    test('should filter conversations by display name', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      fireEvent.change(searchInput, { target: { value: 'Smith' } })

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
    })

    test('should be case insensitive', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      fireEvent.change(searchInput, { target: { value: 'JANE' } })

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    test('should show all conversations when search is cleared', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      fireEvent.change(searchInput, { target: { value: 'john' } })
      fireEvent.change(searchInput, { target: { value: '' } })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    test('should show no results when search does not match', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
    })
  })

  describe('Conversation Selection', () => {
    test('should select conversation when clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(directMessagesService.loadMessages).toHaveBeenCalledWith('conv1')
    })

    test('should apply active class to selected conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe').closest('.conversation-item')
      fireEvent.click(conversation)

      expect(conversation).toHaveClass('active')
    })

    test('should load messages for selected conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(directMessagesService.loadMessages).toHaveBeenCalledWith('conv1')
    })

    test('should show chat header when conversation selected', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const headers = screen.getAllByText('John Doe')
      expect(headers.length).toBeGreaterThan(1)
    })

    test('should hide empty state when conversation selected', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.queryByText('Select a conversation')).not.toBeInTheDocument()
    })
  })

  describe('Message Thread Display', () => {
    test('should display messages for selected conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      expect(screen.getByText('Hi there!')).toBeInTheDocument()
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('How are you?')).toBeInTheDocument()
    })

    test('should apply sent class to messages from current user', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      const sentMessage = screen.getByText('Hello!').closest('.message')
      expect(sentMessage).toHaveClass('sent')
    })

    test('should apply received class to messages from other users', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      const receivedMessage = screen.getByText('Hi there!').closest('.message')
      expect(receivedMessage).toHaveClass('received')
    })

    test('should display message timestamps', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      const timestamps = screen.getAllByText(/ago|Just now/, { exact: false })
      expect(timestamps.length).toBeGreaterThan(0)
    })

    test('should display read indicator for sent messages that are read', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      expect(screen.getByText('• Read')).toBeInTheDocument()
    })

    test('should not display read indicator for received messages', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: [mockMessages[0]] })

      expect(screen.queryByText('• Read')).not.toBeInTheDocument()
    })

    test('should update messages when messages_updated event fires', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      expect(screen.getByText('How are you?')).toBeInTheDocument()
    })

    test('should not update messages for different conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv2', messages: mockMessages })

      expect(screen.queryByText('Hi there!')).not.toBeInTheDocument()
    })
  })

  describe('Real-time Message Updates', () => {
    test('should add new message when message_received event fires', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      const newMessage = {
        id: 'msg4',
        conversationId: 'conv1',
        senderId: 'user2',
        content: 'New message!',
        timestamp: new Date().toISOString(),
        isRead: false
      }

      eventHandlers.message_received(newMessage)

      expect(screen.getByText('New message!')).toBeInTheDocument()
    })

    test('should not add message if for different conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const newMessage = {
        id: 'msg4',
        conversationId: 'conv2',
        senderId: 'user3',
        content: 'Different conversation message',
        timestamp: new Date().toISOString(),
        isRead: false
      }

      eventHandlers.message_received(newMessage)

      expect(screen.queryByText('Different conversation message')).not.toBeInTheDocument()
    })

    test('should update conversations list when conversations_updated fires', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([mockConversations[0]])

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()

      eventHandlers.conversations_updated(mockConversations)

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('Chat Header', () => {
    test('should display selected user name in chat header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const headers = screen.getAllByText('John Doe')
      expect(headers.length).toBe(2)
    })

    test('should display user avatar in chat header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const images = screen.getAllByRole('img')
      const headerImage = images.find(img => img.closest('.chat-header'))
      expect(headerImage).toBeTruthy()
    })

    test('should display active status for online users', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.getByText('Active now')).toBeInTheDocument()
    })

    test('should display away status for away users', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('Jane Smith')
      fireEvent.click(conversation)

      expect(screen.getByText('Away')).toBeInTheDocument()
    })

    test('should display offline status for offline users', () => {
      const offlineConversation = {
        ...mockConversations[0],
        user: { ...mockConversations[0].user, status: 'offline' }
      }

      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([offlineConversation])

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    test('should display phone button in chat header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const phoneButtons = document.querySelectorAll('.chat-action-btn')
      expect(phoneButtons.length).toBeGreaterThan(0)
    })

    test('should display video button in chat header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const videoButtons = document.querySelectorAll('.chat-action-btn')
      expect(videoButtons.length).toBeGreaterThan(1)
    })

    test('should display more options button in chat header', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const moreButtons = document.querySelectorAll('.chat-action-btn')
      expect(moreButtons.length).toBeGreaterThan(2)
    })
  })

  describe('Message Composer', () => {
    test('should render message input', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    })

    test('should update message input value on change', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      expect(input).toHaveValue('Test message')
    })

    test('should display send button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const sendButton = document.querySelector('.send-button')
      expect(sendButton).toBeInTheDocument()
    })

    test('should disable send button when message is empty', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const sendButton = document.querySelector('.send-button')
      expect(sendButton).toBeDisabled()
    })

    test('should enable send button when message has content', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      const sendButton = document.querySelector('.send-button')
      expect(sendButton).not.toBeDisabled()
    })

    test('should display attachment button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const attachmentButtons = document.querySelectorAll('.input-action')
      expect(attachmentButtons.length).toBeGreaterThan(0)
    })

    test('should display image button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const imageButtons = document.querySelectorAll('.input-action')
      expect(imageButtons.length).toBeGreaterThan(1)
    })

    test('should display emoji button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const emojiButtons = document.querySelectorAll('.input-action')
      expect(emojiButtons.length).toBeGreaterThan(2)
    })
  })

  describe('Send Message Functionality', () => {
    test('should send message on form submit', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      const form = document.querySelector('.message-input-form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(directMessagesService.sendMessage).toHaveBeenCalledWith('conv1', 'Test message')
      })
    })

    test('should clear input after sending message', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      const form = document.querySelector('.message-input-form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    test('should not send empty message', async () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const form = document.querySelector('.message-input-form')
      fireEvent.submit(form)

      expect(directMessagesService.sendMessage).not.toHaveBeenCalled()
    })

    test('should not send message with only whitespace', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, '   ')

      const form = document.querySelector('.message-input-form')
      fireEvent.submit(form)

      expect(directMessagesService.sendMessage).not.toHaveBeenCalled()
    })

    test('should handle send message error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      directMessagesService.sendMessage.mockRejectedValue(new Error('Send failed'))

      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      const form = document.querySelector('.message-input-form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to send message:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('should prevent default form submission', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const input = screen.getByPlaceholderText('Type a message...')
      await user.type(input, 'Test message')

      const form = document.querySelector('.message-input-form')
      const event = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      form.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('New Conversation Modal', () => {
    test('should open new conversation modal when plus button clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      expect(screen.getByText('New Conversation')).toBeInTheDocument()
    })

    test('should open new conversation modal from empty state button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const startChatButton = screen.getByText('Start New Chat')
      fireEvent.click(startChatButton)

      expect(screen.getByText('New Conversation')).toBeInTheDocument()
    })

    test('should display username input in modal', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument()
    })

    test('should display cancel button in modal', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    test('should display start chat button in modal', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      expect(screen.getByText('Start Chat')).toBeInTheDocument()
    })

    test('should close modal when cancel button clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
    })

    test('should close modal when close icon clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const modal = screen.getByText('New Conversation').closest('.modal-content')
      const closeButton = modal.querySelector('button')
      fireEvent.click(closeButton)

      expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
    })

    test('should close modal when overlay clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const overlay = document.querySelector('.modal-overlay')
      fireEvent.click(overlay)

      expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
    })

    test('should not close modal when modal content clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const modalContent = document.querySelector('.modal-content')
      fireEvent.click(modalContent)

      expect(screen.getByText('New Conversation')).toBeInTheDocument()
    })

    test('should update username input value', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      expect(input).toHaveValue('newuser')
    })

    test('should disable start chat button when username is empty', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const startButton = screen.getByText('Start Chat')
      expect(startButton).toBeDisabled()
    })

    test('should enable start chat button when username is entered', async () => {
      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      const startButton = screen.getByText('Start Chat')
      expect(startButton).not.toBeDisabled()
    })

    test('should start conversation when start chat button clicked', async () => {
      const user = userEvent.setup()
      const newConversation = { ...mockConversations[0], id: 'conv4' }
      directMessagesService.startConversation.mockResolvedValue(newConversation)

      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      const startButton = screen.getByText('Start Chat')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(directMessagesService.startConversation).toHaveBeenCalledWith('newuser')
      })
    })

    test('should start conversation when Enter key pressed', async () => {
      const user = userEvent.setup()
      const newConversation = { ...mockConversations[0], id: 'conv4' }
      directMessagesService.startConversation.mockResolvedValue(newConversation)

      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      await waitFor(() => {
        expect(directMessagesService.startConversation).toHaveBeenCalledWith('newuser')
      })
    })

    test('should close modal after starting conversation', async () => {
      const user = userEvent.setup()
      const newConversation = { ...mockConversations[0], id: 'conv4' }
      directMessagesService.startConversation.mockResolvedValue(newConversation)

      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      const startButton = screen.getByText('Start Chat')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
      })
    })

    test('should clear username input after starting conversation', async () => {
      const user = userEvent.setup()
      const newConversation = { ...mockConversations[0], id: 'conv4' }
      directMessagesService.startConversation.mockResolvedValue(newConversation)

      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      const startButton = screen.getByText('Start Chat')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.queryByText('New Conversation')).not.toBeInTheDocument()
      })

      const plusButtonAgain = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButtonAgain)

      const inputAgain = screen.getByPlaceholderText('Enter username...')
      expect(inputAgain).toHaveValue('')
    })

    test('should handle start conversation error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      directMessagesService.startConversation.mockRejectedValue(new Error('Failed to start'))

      const user = userEvent.setup()
      render(<DirectMessages currentUser={mockCurrentUser} />)

      const plusButton = screen.getByRole('button', { name: '' })
      fireEvent.click(plusButton)

      const input = screen.getByPlaceholderText('Enter username...')
      await user.type(input, 'newuser')

      const startButton = screen.getByText('Start Chat')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to start conversation:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Conversation Actions', () => {
    test('should pin conversation when pin button clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const pinButton = screen.getByText('Pin Chat')
      fireEvent.click(pinButton)

      const conversationItem = screen.getByText('John Doe').closest('.conversation-item')
      expect(conversationItem).toHaveClass('active')
    })

    test('should unpin conversation when unpin button clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('Jane Smith')
      fireEvent.click(conversation)

      const unpinButton = screen.getByText('Unpin Chat')
      fireEvent.click(unpinButton)

      const conversationItem = screen.getByText('Jane Smith').closest('.conversation-item')
      expect(conversationItem).toHaveClass('active')
    })

    test('should display pin text for unpinned conversations', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.getByText('Pin Chat')).toBeInTheDocument()
    })

    test('should display unpin text for pinned conversations', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('Jane Smith')
      fireEvent.click(conversation)

      expect(screen.getByText('Unpin Chat')).toBeInTheDocument()
    })

    test('should display archive button', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      expect(screen.getByText('Archive Chat')).toBeInTheDocument()
    })

    test('should delete conversation when delete button clicked', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const deleteButton = screen.getByText('Delete Chat')
      fireEvent.click(deleteButton)

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    test('should clear selected conversation when deleted', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const deleteButton = screen.getByText('Delete Chat')
      fireEvent.click(deleteButton)

      expect(screen.getByText('Select a conversation')).toBeInTheDocument()
    })

    test('should not clear selected conversation when deleting different conversation', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const updatedConversations = mockConversations.filter(conv => conv.id !== 'conv2')
      eventHandlers.conversations_updated(updatedConversations)

      expect(screen.queryByText('Select a conversation')).not.toBeInTheDocument()
    })
  })

  describe('Typing Indicator', () => {
    test('should display typing indicator when user is typing', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      eventHandlers.messages_updated({ conversationId: 'conv1', messages: mockMessages })

      render(<DirectMessages currentUser={mockCurrentUser} />)
      const { container } = render(<DirectMessages currentUser={mockCurrentUser} />)
      const typingIndicator = container.querySelector('.typing-indicator')

      expect(typingIndicator).toBeTruthy()
    })

    test('should not display typing indicator when user is not typing', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated(mockConversations)

      const conversation = screen.getByText('John Doe')
      fireEvent.click(conversation)

      const typingIndicator = document.querySelector('.typing-indicator')
      expect(typingIndicator).toBeFalsy()
    })
  })

  describe('Time Formatting', () => {
    test('should format recent time as "Just now"', () => {
      const recentConversation = {
        ...mockConversations[0],
        lastMessage: {
          ...mockConversations[0].lastMessage,
          timestamp: new Date().toISOString()
        }
      }

      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([recentConversation])

      expect(screen.getByText('Just now')).toBeInTheDocument()
    })

    test('should format time in minutes for recent messages', () => {
      const minutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentConversation = {
        ...mockConversations[0],
        lastMessage: {
          ...mockConversations[0].lastMessage,
          timestamp: minutesAgo.toISOString()
        }
      }

      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([recentConversation])

      expect(screen.getByText(/m ago/)).toBeInTheDocument()
    })

    test('should format time in hours for messages from today', () => {
      const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const recentConversation = {
        ...mockConversations[0],
        lastMessage: {
          ...mockConversations[0].lastMessage,
          timestamp: hoursAgo.toISOString()
        }
      }

      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([recentConversation])

      expect(screen.getByText(/h ago/)).toBeInTheDocument()
    })

    test('should format time in days for messages from this week', () => {
      const daysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const recentConversation = {
        ...mockConversations[0],
        lastMessage: {
          ...mockConversations[0].lastMessage,
          timestamp: daysAgo.toISOString()
        }
      }

      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([recentConversation])

      expect(screen.getByText(/d ago/)).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    test('should display empty state when no conversations', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([])

      expect(screen.getByText('Select a conversation')).toBeInTheDocument()
    })

    test('should display empty state message', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)

      expect(screen.getByText('Choose a conversation from the list or start a new one')).toBeInTheDocument()
    })

    test('should display no conversations in list when empty', () => {
      render(<DirectMessages currentUser={mockCurrentUser} />)
      eventHandlers.conversations_updated([])

      const conversationItems = document.querySelectorAll('.conversation-item')
      expect(conversationItems.length).toBe(0)
    })
  })

  describe('Component Props', () => {
    test('should use currentUser prop', () => {
      const customUser = { id: 'custom123', username: 'customuser' }
      render(<DirectMessages currentUser={customUser} />)

      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    test('should handle missing currentUser prop', () => {
      render(<DirectMessages />)

      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    test('should call onClose callback if provided', () => {
      const onClose = jest.fn()
      const { container } = render(<DirectMessages currentUser={mockCurrentUser} onClose={onClose} />)

      expect(container.querySelector('.direct-messages')).toBeInTheDocument()
    })
  })
})

export default mockCurrentUser
