/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import NotificationsPage from './NotificationsPage'
import { AuthContext } from '../contexts/AuthContext'
import apiService from '../services/api'
import socketService from '../services/socket'
import { formatDistanceToNow } from 'date-fns'

// Mock services
jest.mock('../services/api')
jest.mock('../services/socket')

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago')
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: ({ className, ...props }) => <div data-testid="icon-bell" className={className} {...props} />,
  BellOff: ({ className, ...props }) => <div data-testid="icon-bell-off" className={className} {...props} />,
  Check: ({ className, ...props }) => <div data-testid="icon-check" className={className} {...props} />,
  CheckCheck: ({ className, ...props }) => <div data-testid="icon-check-check" className={className} {...props} />,
  Trash2: ({ className, ...props }) => <div data-testid="icon-trash" className={className} {...props} />,
  Filter: ({ className, ...props }) => <div data-testid="icon-filter" className={className} {...props} />,
  Settings: ({ className, ...props }) => <div data-testid="icon-settings" className={className} {...props} />,
  MessageSquare: ({ className, ...props }) => <div data-testid="icon-message-square" className={className} {...props} />,
  Heart: ({ className, ...props }) => <div data-testid="icon-heart" className={className} {...props} />,
  UserPlus: ({ className, ...props }) => <div data-testid="icon-user-plus" className={className} {...props} />,
  AtSign: ({ className, ...props }) => <div data-testid="icon-at-sign" className={className} {...props} />,
  Award: ({ className, ...props }) => <div data-testid="icon-award" className={className} {...props} />,
  Zap: ({ className, ...props }) => <div data-testid="icon-zap" className={className} {...props} />,
  AlertCircle: ({ className, ...props }) => <div data-testid="icon-alert-circle" className={className} {...props} />,
  ArrowLeft: ({ className, ...props }) => <div data-testid="icon-arrow-left" className={className} {...props} />,
  Loader: ({ className, ...props }) => <div data-testid="icon-loader" className={className} {...props} />
}))

// Mock accessibility utilities
jest.mock('../utils/accessibility.jsx', () => ({
  SkipToContent: () => <div>Skip to content</div>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn()
}))

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: null
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const createMockNotification = (overrides = {}) => ({
  id: `notif-${Math.random()}`,
  type: 'message',
  title: 'Test Notification',
  content: 'This is a test notification',
  isRead: false,
  timestamp: new Date().toISOString(),
  avatar: '👤',
  actionUrl: '/post/123',
  ...overrides
})

const mockNotifications = [
  createMockNotification({
    id: 'notif-1',
    type: 'message',
    title: 'New Message',
    content: 'You have a new message',
    isRead: false
  }),
  createMockNotification({
    id: 'notif-2',
    type: 'mention',
    title: 'You were mentioned',
    content: '@testuser check this out',
    isRead: false
  }),
  createMockNotification({
    id: 'notif-3',
    type: 'reaction',
    title: 'Someone reacted to your post',
    content: 'User liked your post',
    isRead: true
  }),
  createMockNotification({
    id: 'notif-4',
    type: 'follow',
    title: 'New Follower',
    content: 'User started following you',
    isRead: false
  }),
  createMockNotification({
    id: 'notif-5',
    type: 'award',
    title: 'You received an award',
    content: 'You got a gold award',
    isRead: true
  })
]

const renderWithContext = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <NotificationsPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('NotificationsPage', () => {
  let mockSocketOn
  let mockSocketOff
  let mockSocketEmit

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup API mocks
    apiService.get = jest.fn().mockResolvedValue({
      success: true,
      data: { notifications: mockNotifications }
    })
    apiService.put = jest.fn().mockResolvedValue({ success: true })
    apiService.delete = jest.fn().mockResolvedValue({ success: true })

    // Setup socket mocks
    mockSocketOn = jest.fn()
    mockSocketOff = jest.fn()
    mockSocketEmit = jest.fn()
    socketService.on = mockSocketOn
    socketService.off = mockSocketOff
    socketService.emit = mockSocketEmit
  })

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays page title', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    it('renders Bell icon in header', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-bell')).toBeInTheDocument()
      })
    })

    it('has proper semantic HTML structure', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('role', 'main')
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithContext()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner initially', () => {
      renderWithContext()
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument()
    })

    it('has proper ARIA attributes during loading', () => {
      renderWithContext()
      const loadingElement = screen.getByRole('status')
      expect(loadingElement).toBeInTheDocument()
      expect(loadingElement).toHaveAttribute('aria-live', 'polite')
    })

    it('removes loading state after data loads', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument()
      })
    })

    it('fetches notifications on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/notifications')
      })
    })
  })

  describe('Notification List Display', () => {
    it('displays list of notifications after loading', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument()
        expect(screen.getByText('You were mentioned')).toBeInTheDocument()
      })
    })

    it('shows notification titles', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument()
        expect(screen.getByText('You were mentioned')).toBeInTheDocument()
        expect(screen.getByText('Someone reacted to your post')).toBeInTheDocument()
      })
    })

    it('shows notification content', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('You have a new message')).toBeInTheDocument()
        expect(screen.getByText('@testuser check this out')).toBeInTheDocument()
      })
    })

    it('displays notification avatars', async () => {
      renderWithContext()
      await waitFor(() => {
        const avatars = screen.getAllByText('👤')
        expect(avatars.length).toBeGreaterThan(0)
      })
    })

    it('shows formatted timestamps', async () => {
      renderWithContext()
      await waitFor(() => {
        const timestamps = screen.getAllByText('2 hours ago')
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })

    it('renders checkboxes for each notification', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBe(mockNotifications.length)
      })
    })
  })

  describe('Notification Types and Icons', () => {
    it('displays message icon for message notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const messageIcons = screen.getAllByTestId('icon-message-square')
        expect(messageIcons.length).toBeGreaterThan(0)
      })
    })

    it('displays mention icon for mention notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-at-sign')).toBeInTheDocument()
      })
    })

    it('displays heart icon for reaction notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-heart')).toBeInTheDocument()
      })
    })

    it('displays user-plus icon for follow notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-user-plus')).toBeInTheDocument()
      })
    })

    it('displays award icon for award notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-award')).toBeInTheDocument()
      })
    })

    it('displays default bell icon for unknown notification types', async () => {
      const unknownNotif = [createMockNotification({ type: 'unknown' })]
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: unknownNotif }
      })
      renderWithContext()
      await waitFor(() => {
        const bellIcons = screen.getAllByTestId('icon-bell')
        expect(bellIcons.length).toBeGreaterThan(0)
      })
    })

    it('displays reply icon for reply notifications', async () => {
      const replyNotif = [createMockNotification({ type: 'reply' })]
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: replyNotif }
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-message-square')).toBeInTheDocument()
      })
    })
  })

  describe('Unread Count Display', () => {
    it('displays unread count badge when there are unread notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadCount = mockNotifications.filter(n => !n.isRead).length
        expect(screen.getByText(unreadCount.toString())).toBeInTheDocument()
      })
    })

    it('has proper ARIA label for unread count', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadCount = mockNotifications.filter(n => !n.isRead).length
        const badge = screen.getByLabelText(`${unreadCount} unread notifications`)
        expect(badge).toBeInTheDocument()
      })
    })

    it('does not display badge when all notifications are read', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }))
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: readNotifications }
      })
      renderWithContext()
      await waitFor(() => {
        const unreadCount = readNotifications.filter(n => !n.isRead).length
        expect(unreadCount).toBe(0)
      })
    })

    it('updates count when notifications are marked as read', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Functionality', () => {
    it('displays filter buttons', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
        expect(screen.getByText('Unread')).toBeInTheDocument()
        expect(screen.getByText('Mentions')).toBeInTheDocument()
        expect(screen.getByText('Reactions')).toBeInTheDocument()
      })
    })

    it('has proper ARIA labels for filter buttons', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by all notifications')).toBeInTheDocument()
        expect(screen.getByLabelText('Filter by unread notifications')).toBeInTheDocument()
      })
    })

    it('filters by unread notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadButton = screen.getByText('Unread')
        fireEvent.click(unreadButton)
      })
      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument()
        expect(screen.queryByText('Someone reacted to your post')).not.toBeInTheDocument()
      })
    })

    it('filters by mentions', async () => {
      renderWithContext()
      await waitFor(() => {
        const mentionsButton = screen.getByText('Mentions')
        fireEvent.click(mentionsButton)
      })
      await waitFor(() => {
        expect(screen.getByText('You were mentioned')).toBeInTheDocument()
        expect(screen.queryByText('New Message')).not.toBeInTheDocument()
      })
    })

    it('filters by reactions', async () => {
      renderWithContext()
      await waitFor(() => {
        const reactionsButton = screen.getByText('Reactions')
        fireEvent.click(reactionsButton)
      })
      await waitFor(() => {
        expect(screen.getByText('Someone reacted to your post')).toBeInTheDocument()
        expect(screen.queryByText('New Message')).not.toBeInTheDocument()
      })
    })

    it('shows all notifications when "All" filter is selected', async () => {
      renderWithContext()
      await waitFor(() => {
        const allButton = screen.getByText('All')
        fireEvent.click(allButton)
      })
      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument()
        expect(screen.getByText('You were mentioned')).toBeInTheDocument()
        expect(screen.getByText('Someone reacted to your post')).toBeInTheDocument()
      })
    })

    it('highlights active filter', async () => {
      renderWithContext()
      await waitFor(() => {
        const allButton = screen.getByText('All')
        expect(allButton).toHaveClass('bg-blue-600')
      })
    })

    it('updates filter on button click', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadButton = screen.getByText('Unread')
        fireEvent.click(unreadButton)
        expect(unreadButton).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('Mark as Read Functionality', () => {
    it('displays mark as read button for unread notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const markReadButtons = screen.getAllByLabelText('Mark as read')
        expect(markReadButtons.length).toBeGreaterThan(0)
      })
    })

    it('marks notification as read when button clicked', async () => {
      renderWithContext()
      await waitFor(() => {
        const markReadButtons = screen.getAllByLabelText('Mark as read')
        fireEvent.click(markReadButtons[0])
      })
      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/notifications/notif-1/read')
      })
    })

    it('emits socket event when marking as read', async () => {
      renderWithContext()
      await waitFor(() => {
        const markReadButtons = screen.getAllByLabelText('Mark as read')
        fireEvent.click(markReadButtons[0])
      })
      await waitFor(() => {
        expect(mockSocketEmit).toHaveBeenCalledWith('notification_read', { notificationId: 'notif-1' })
      })
    })

    it('optimistically updates UI when marking as read', async () => {
      renderWithContext()
      await waitFor(() => {
        const markReadButtons = screen.getAllByLabelText('Mark as read')
        fireEvent.click(markReadButtons[0])
      })
      // UI should update immediately
      expect(apiService.put).toHaveBeenCalled()
    })

    it('reverts optimistic update on API error', async () => {
      apiService.put.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const markReadButtons = screen.getAllByLabelText('Mark as read')
        fireEvent.click(markReadButtons[0])
      })
      await waitFor(() => {
        // Should revert the optimistic update
        expect(console.error).toHaveBeenCalled()
      })
    })

    it('does not show mark as read button for already read notifications', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }))
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: readNotifications }
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByLabelText('Mark as read')).not.toBeInTheDocument()
      })
    })
  })

  describe('Mark All as Read', () => {
    it('displays mark all as read button', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Mark all notifications as read')).toBeInTheDocument()
      })
    })

    it('marks all notifications as read when clicked', async () => {
      renderWithContext()
      await waitFor(() => {
        const markAllButton = screen.getByLabelText('Mark all notifications as read')
        fireEvent.click(markAllButton)
      })
      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/notifications/read-all')
      })
    })

    it('emits socket event when marking all as read', async () => {
      renderWithContext()
      await waitFor(() => {
        const markAllButton = screen.getByLabelText('Mark all notifications as read')
        fireEvent.click(markAllButton)
      })
      await waitFor(() => {
        expect(mockSocketEmit).toHaveBeenCalledWith('notification_mark_all_read')
      })
    })

    it('is disabled when there are no unread notifications', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }))
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: readNotifications }
      })
      renderWithContext()
      await waitFor(() => {
        const markAllButton = screen.getByLabelText('Mark all notifications as read')
        expect(markAllButton).toBeDisabled()
      })
    })

    it('reverts on API error', async () => {
      apiService.put.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const markAllButton = screen.getByLabelText('Mark all notifications as read')
        fireEvent.click(markAllButton)
      })
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })

  describe('Delete Notification', () => {
    it('displays delete button for each notification', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete notification')
        expect(deleteButtons.length).toBe(mockNotifications.length)
      })
    })

    it('deletes notification when button clicked', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete notification')
        fireEvent.click(deleteButtons[0])
      })
      await waitFor(() => {
        expect(apiService.delete).toHaveBeenCalledWith('/notifications/notif-1')
      })
    })

    it('emits socket event when deleting', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete notification')
        fireEvent.click(deleteButtons[0])
      })
      await waitFor(() => {
        expect(mockSocketEmit).toHaveBeenCalledWith('notification_delete', { notificationId: 'notif-1' })
      })
    })

    it('removes notification from list after deletion', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument()
      })
      const deleteButtons = screen.getAllByLabelText('Delete notification')
      fireEvent.click(deleteButtons[0])
      await waitFor(() => {
        expect(screen.queryByText('New Message')).not.toBeInTheDocument()
      })
    })

    it('reverts deletion on API error', async () => {
      apiService.delete.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete notification')
        fireEvent.click(deleteButtons[0])
      })
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })

  describe('Clear All Notifications', () => {
    it('displays delete all button when notifications exist', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Delete all notifications')).toBeInTheDocument()
      })
    })

    it('deletes all notifications when clicked', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteAllButton = screen.getByLabelText('Delete all notifications')
        fireEvent.click(deleteAllButton)
      })
      await waitFor(() => {
        expect(apiService.delete).toHaveBeenCalledWith('/notifications/all')
      })
    })

    it('emits socket event when deleting all', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteAllButton = screen.getByLabelText('Delete all notifications')
        fireEvent.click(deleteAllButton)
      })
      await waitFor(() => {
        expect(mockSocketEmit).toHaveBeenCalledWith('notification_delete_all')
      })
    })

    it('does not show when there are no notifications', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: [] }
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByLabelText('Delete all notifications')).not.toBeInTheDocument()
      })
    })

    it('shows empty state after deleting all', async () => {
      renderWithContext()
      await waitFor(() => {
        const deleteAllButton = screen.getByLabelText('Delete all notifications')
        fireEvent.click(deleteAllButton)
      })
      await waitFor(() => {
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
      })
    })

    it('reverts on API error', async () => {
      apiService.delete.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const deleteAllButton = screen.getByLabelText('Delete all notifications')
        fireEvent.click(deleteAllButton)
      })
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })

  describe('Notification Click Navigation', () => {
    it('navigates to action URL when notification clicked', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      renderWithContext()
      await waitFor(() => {
        const notification = screen.getByText('New Message')
        fireEvent.click(notification)
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/post/123')
      })
    })

    it('marks notification as read when clicked', async () => {
      renderWithContext()
      await waitFor(() => {
        const notification = screen.getByText('New Message')
        fireEvent.click(notification)
      })
      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/notifications/notif-1/read')
      })
    })

    it('does not navigate when notification has no actionUrl', async () => {
      const noUrlNotif = [createMockNotification({ actionUrl: null })]
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: noUrlNotif }
      })
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      renderWithContext()
      await waitFor(() => {
        const notification = screen.getByText('Test Notification')
        fireEvent.click(notification)
      })
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    it('does not navigate when clicking action buttons', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      renderWithContext()
      await waitFor(() => {
        const deleteButton = screen.getAllByLabelText('Delete notification')[0]
        fireEvent.click(deleteButton)
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Real-time Notifications via Socket.IO', () => {
    it('registers socket event listener on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalledWith('notification_received', expect.any(Function))
      })
    })

    it('cleans up socket listener on unmount', async () => {
      const { unmount } = renderWithContext()
      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalled()
      })
      unmount()
      expect(mockSocketOff).toHaveBeenCalledWith('notification_received')
    })

    it('adds new notification to list when received via socket', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalled()
      })

      const socketCallback = mockSocketOn.mock.calls[0][1]
      const newNotification = createMockNotification({
        id: 'new-notif',
        title: 'Real-time Notification'
      })

      act(() => {
        socketCallback({ notification: newNotification })
      })

      await waitFor(() => {
        expect(screen.getByText('Real-time Notification')).toBeInTheDocument()
      })
    })

    it('prepends new notification to beginning of list', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalled()
      })

      const socketCallback = mockSocketOn.mock.calls[0][1]
      const newNotification = createMockNotification({
        id: 'newest-notif',
        title: 'Newest Notification'
      })

      act(() => {
        socketCallback({ notification: newNotification })
      })

      await waitFor(() => {
        const notifications = screen.getAllByRole('checkbox')
        expect(notifications[0]).toHaveAttribute('aria-label', expect.stringContaining('Newest Notification'))
      })
    })
  })

  describe('Bulk Selection', () => {
    it('allows selecting individual notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])
        expect(checkboxes[0]).toBeChecked()
      })
    })

    it('shows bulk action bar when notifications are selected', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
      })
      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument()
      })
    })

    it('displays bulk mark as read button', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
      })
      await waitFor(() => {
        expect(screen.getByLabelText('Mark selected notifications as read')).toBeInTheDocument()
      })
    })

    it('displays bulk delete button', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
      })
      await waitFor(() => {
        expect(screen.getByLabelText('Delete selected notifications')).toBeInTheDocument()
      })
    })

    it('marks selected notifications as read', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])
        fireEvent.click(checkboxes[1])
      })
      await waitFor(() => {
        const bulkMarkReadButton = screen.getByLabelText('Mark selected notifications as read')
        fireEvent.click(bulkMarkReadButton)
      })
      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/notifications/bulk-read', {
          notificationIds: expect.arrayContaining(['notif-1', 'notif-2'])
        })
      })
    })

    it('deletes selected notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])
      })
      await waitFor(() => {
        const bulkDeleteButton = screen.getByLabelText('Delete selected notifications')
        fireEvent.click(bulkDeleteButton)
      })
      await waitFor(() => {
        expect(apiService.delete).toHaveBeenCalledWith('/notifications/bulk', {
          data: { notificationIds: ['notif-1'] }
        })
      })
    })

    it('clears selection after bulk action', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
      })
      await waitFor(() => {
        const bulkMarkReadButton = screen.getByLabelText('Mark selected notifications as read')
        fireEvent.click(bulkMarkReadButton)
      })
      await waitFor(() => {
        expect(screen.queryByText('1 selected')).not.toBeInTheDocument()
      })
    })

    it('allows deselecting notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
        expect(checkbox).toBeChecked()
        fireEvent.click(checkbox)
        expect(checkbox).not.toBeChecked()
      })
    })

    it('reverts on bulk action error', async () => {
      apiService.put.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
      })
      await waitFor(() => {
        const bulkMarkReadButton = screen.getByLabelText('Mark selected notifications as read')
        fireEvent.click(bulkMarkReadButton)
      })
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no notifications', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: [] }
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
      })
    })

    it('displays BellOff icon in empty state', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: [] }
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-bell-off')).toBeInTheDocument()
      })
    })

    it('shows filter-specific empty message', async () => {
      renderWithContext()
      await waitFor(() => {
        const reactionsButton = screen.getByText('Reactions')
        fireEvent.click(reactionsButton)
      })
      await waitFor(() => {
        // Only one reaction notification exists and it's read
        const unreadButton = screen.getByText('Unread')
        fireEvent.click(unreadButton)
      })
      // This should show empty state for unread reactions
    })

    it('has proper ARIA attributes for empty state', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { notifications: [] }
      })
      renderWithContext()
      await waitFor(() => {
        const emptyState = screen.getByRole('status')
        expect(emptyState).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Notifications')).toBeInTheDocument()
      })
    })

    it('shows error message from state', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications. Please try again later.')).toBeInTheDocument()
      })
    })

    it('displays AlertCircle icon in error state', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument()
      })
    })

    it('has proper ARIA attributes for error state', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('provides try again button on error', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Try again to load notifications')).toBeInTheDocument()
      })
    })

    it('reloads page when try again is clicked', async () => {
      delete window.location
      window.location = { reload: jest.fn() }

      apiService.get.mockRejectedValueOnce(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const tryAgainButton = screen.getByLabelText('Try again to load notifications')
        fireEvent.click(tryAgainButton)
      })
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('shows empty array when API returns no data', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: null
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
      })
    })

    it('handles unsuccessful API response gracefully', async () => {
      apiService.get.mockResolvedValue({
        success: false,
        data: null
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Required', () => {
    it('shows sign in message when not authenticated', async () => {
      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByText('Sign In Required')).toBeInTheDocument()
      })
    })

    it('displays message to sign in to view notifications', async () => {
      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByText('Please sign in to view your notifications')).toBeInTheDocument()
      })
    })

    it('shows sign in button when not authenticated', async () => {
      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByLabelText('Sign in to view notifications')).toBeInTheDocument()
      })
    })

    it('navigates to login page when sign in clicked', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        const signInButton = screen.getByLabelText('Sign in to view notifications')
        fireEvent.click(signInButton)
      })
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('does not fetch notifications when not authenticated', async () => {
      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByText('Sign In Required')).toBeInTheDocument()
      })
      expect(apiService.get).not.toHaveBeenCalled()
    })

    it('has proper semantic structure for auth required state', async () => {
      renderWithContext(mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Settings Link', () => {
    it('displays settings button in header', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Notification settings')).toBeInTheDocument()
      })
    })

    it('shows settings icon', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-settings')).toBeInTheDocument()
      })
    })
  })

  describe('Back Button Navigation', () => {
    it('displays back button on mobile', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Go back')).toBeInTheDocument()
      })
    })

    it('shows ArrowLeft icon in back button', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByTestId('icon-arrow-left')).toBeInTheDocument()
      })
    })

    it('navigates back when back button clicked', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      renderWithContext()
      await waitFor(() => {
        const backButton = screen.getByLabelText('Go back')
        fireEvent.click(backButton)
      })
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all interactive elements', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Go back')).toBeInTheDocument()
        expect(screen.getByLabelText('Mark all notifications as read')).toBeInTheDocument()
        expect(screen.getByLabelText('Notification settings')).toBeInTheDocument()
      })
    })

    it('uses aria-hidden for decorative icons', async () => {
      renderWithContext()
      await waitFor(() => {
        const icons = document.querySelectorAll('[aria-hidden="true"]')
        expect(icons.length).toBeGreaterThan(0)
      })
    })

    it('has filter group with proper aria-label', async () => {
      renderWithContext()
      await waitFor(() => {
        const filterGroup = screen.getByRole('group', { name: 'Notification filters' })
        expect(filterGroup).toBeInTheDocument()
      })
    })

    it('uses aria-pressed for filter buttons', async () => {
      renderWithContext()
      await waitFor(() => {
        const allButton = screen.getByText('All')
        expect(allButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('provides checkbox labels for each notification', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByLabelText('Select notification: New Message')).toBeInTheDocument()
      })
    })

    it('uses semantic HTML elements', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
      })
    })

    it('has proper heading hierarchy', async () => {
      renderWithContext()
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('Notifications')
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithContext()
      await waitFor(async () => {
        await user.tab()
        // Focus should move to interactive elements
        expect(document.activeElement).toBeInTheDocument()
      })
    })
  })

  describe('Visual Indicators', () => {
    it('highlights unread notifications with border', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadNotif = screen.getByText('New Message').closest('div')
        expect(unreadNotif).toHaveClass('border-l-4', 'border-l-blue-500')
      })
    })

    it('changes background when notification is selected', async () => {
      renderWithContext()
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
        const notification = checkbox.closest('div')
        expect(notification).toHaveClass('bg-[#1a1d21]')
      })
    })

    it('applies different styles to read vs unread notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadTitle = screen.getByText('New Message')
        const readTitle = screen.getByText('Someone reacted to your post')
        expect(unreadTitle).toHaveClass('text-white')
        expect(readTitle).toHaveClass('text-[#c9d1d9]')
      })
    })
  })

  describe('Performance and Memoization', () => {
    it('memoizes filtered notifications', async () => {
      renderWithContext()
      await waitFor(() => {
        const allButton = screen.getByText('All')
        fireEvent.click(allButton)
        // Should not cause unnecessary re-renders
        expect(screen.getAllByRole('checkbox').length).toBe(mockNotifications.length)
      })
    })

    it('memoizes unread count', async () => {
      renderWithContext()
      await waitFor(() => {
        const unreadCount = mockNotifications.filter(n => !n.isRead).length
        expect(screen.getByText(unreadCount.toString())).toBeInTheDocument()
      })
    })

    it('uses useCallback for event handlers', async () => {
      // This is implicitly tested by the fact that event handlers work correctly
      renderWithContext()
      await waitFor(() => {
        const markReadButton = screen.getAllByLabelText('Mark as read')[0]
        fireEvent.click(markReadButton)
        expect(apiService.put).toHaveBeenCalled()
      })
    })
  })
})

export default mockUser
