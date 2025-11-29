import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import AwardNotificationSystem from './AwardNotificationSystem'

// Mock fetch globally
global.fetch = jest.fn()

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url
    this.onmessage = null
    this.onerror = null
    MockEventSource.instances.push(this)
  }

  close() {
    this.closed = true
  }

  static instances = []
  static reset() {
    this.instances = []
  }
}

global.EventSource = MockEventSource

// Mock browser Notification API
const mockNotification = jest.fn()
global.Notification = mockNotification
global.Notification.permission = 'default'

// Mock console methods
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('AwardNotificationSystem', () => {
  let user

  beforeEach(() => {
    jest.useFakeTimers()
    user = userEvent.setup({ delay: null })
    MockEventSource.reset()
    global.fetch.mockClear()
    mockNotification.mockClear()
    consoleError.mockClear()
    global.Notification.permission = 'default'
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const mockNotifications = [
    {
      id: '1',
      type: 'award_received',
      read: false,
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      data: {
        awardName: 'Gold Award',
        awardIcon: '🏆',
        awardDescription: 'A prestigious gold award',
        message: 'Great post!',
        giverUsername: 'john_doe',
        postTitle: 'Amazing content that everyone loves',
        postId: 'post-123',
        karmaValue: 100,
        coinsReceived: 50,
        premiumDays: 7
      }
    },
    {
      id: '2',
      type: 'post_upvoted',
      read: true,
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      data: {
        postTitle: 'Another interesting post'
      }
    },
    {
      id: '3',
      type: 'comment_replied',
      read: false,
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      data: {
        replyText: 'Thanks for your comment, I agree with your points'
      }
    },
    {
      id: '4',
      type: 'mention',
      read: false,
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      data: {
        postTitle: 'Discussion about technology trends'
      }
    },
    {
      id: '5',
      type: 'achievement_unlocked',
      read: true,
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      data: {
        achievementName: 'First Post',
        description: 'Published your first post'
      }
    },
    {
      id: '6',
      type: 'follower_new',
      read: false,
      timestamp: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      data: {
        username: 'jane_smith'
      }
    }
  ]

  const setupFetchMock = (notifications = mockNotifications) => {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/notifications?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ notifications })
        })
      }
      if (url.includes('/api/notifications/') && options?.method === 'POST') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/notifications/mark-all-read')) {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/notifications/') && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  }

  describe('Component Rendering', () => {
    test('renders notification modal with header', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    test('displays loading state initially', () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })

    test('renders all notifications after loading', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      expect(screen.getByText('Someone replied to your comment')).toBeInTheDocument()
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
    })

    test('displays correct unread count', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('4 unread')).toBeInTheDocument()
      })

      expect(screen.getByText('4')).toBeInTheDocument()
    })

    test('shows "All caught up!" when no unread notifications', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, read: true }))
      setupFetchMock(readNotifications)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument()
      })
    })

    test('displays unread count badge with 99+ for large numbers', async () => {
      const manyUnread = Array.from({ length: 150 }, (_, i) => ({
        id: `notif-${i}`,
        type: 'post_upvoted',
        read: false,
        timestamp: new Date().toISOString(),
        data: { postTitle: `Post ${i}` }
      }))
      setupFetchMock(manyUnread)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument()
      })
    })

    test('renders empty state when no notifications', async () => {
      setupFetchMock([])
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No notifications to show')).toBeInTheDocument()
      })
    })
  })

  describe('Award Type Rendering', () => {
    test('renders award received notification with correct icon', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        const awardNotification = screen.getByText('You received a Gold Award!').closest('div')
        expect(within(awardNotification).getByText('🏆')).toBeInTheDocument()
      })
    })

    test('displays award details when award notification is expanded', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const awardNotification = screen.getByText('You received a Gold Award!')
      await user.click(awardNotification)

      await waitFor(() => {
        expect(screen.getByText('A prestigious gold award')).toBeInTheDocument()
        expect(screen.getByText('"Great post!"')).toBeInTheDocument()
        expect(screen.getByText('- from u/john_doe')).toBeInTheDocument()
        expect(screen.getByText('+100 karma')).toBeInTheDocument()
        expect(screen.getByText('+50 coins')).toBeInTheDocument()
        expect(screen.getByText('+7 days Premium')).toBeInTheDocument()
      })
    })

    test('shows "View the awarded post" link for award notifications', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const awardNotification = screen.getByText('You received a Gold Award!')
      await user.click(awardNotification)

      await waitFor(() => {
        const link = screen.getByText('View the awarded post →')
        expect(link).toHaveAttribute('href', '/posts/post-123')
      })
    })

    test('renders post upvoted notification correctly', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })
    })

    test('renders comment replied notification correctly', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Someone replied to your comment')).toBeInTheDocument()
        expect(screen.getByText(/"Thanks for your comment, I agree with your points/)).toBeInTheDocument()
      })
    })

    test('renders mention notification correctly', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You were mentioned')).toBeInTheDocument()
        expect(screen.getByText(/in "Discussion about technology trends/)).toBeInTheDocument()
      })
    })

    test('renders achievement unlocked notification correctly', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Achievement unlocked: First Post')).toBeInTheDocument()
        expect(screen.getByText('Published your first post')).toBeInTheDocument()
      })
    })

    test('renders new follower notification correctly', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('jane_smith started following you')).toBeInTheDocument()
        expect(screen.getByText('Check out their profile')).toBeInTheDocument()
      })
    })

    test('handles unknown notification type with default icon and text', async () => {
      const unknownNotification = [{
        id: '99',
        type: 'unknown_type',
        read: false,
        timestamp: new Date().toISOString(),
        data: { message: 'Something happened' }
      }]
      setupFetchMock(unknownNotification)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('New notification')).toBeInTheDocument()
        expect(screen.getByText('Something happened')).toBeInTheDocument()
      })
    })
  })

  describe('Notification Filters', () => {
    test('renders all filter buttons', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
      })

      expect(screen.getByText('Unread')).toBeInTheDocument()
      expect(screen.getByText('Awards')).toBeInTheDocument()
      expect(screen.getByText('Mentions')).toBeInTheDocument()
    })

    test('filters unread notifications when Unread filter is selected', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const unreadButton = screen.getByText('Unread')
      await user.click(unreadButton)

      expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      expect(screen.queryByText('Your post was upvoted')).not.toBeInTheDocument()
    })

    test('filters award notifications when Awards filter is selected', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const awardsButton = screen.getByText('Awards')
      await user.click(awardsButton)

      expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      expect(screen.queryByText('Your post was upvoted')).not.toBeInTheDocument()
      expect(screen.queryByText('Someone replied to your comment')).not.toBeInTheDocument()
    })

    test('filters mention notifications when Mentions filter is selected', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const mentionsButton = screen.getByText('Mentions')
      await user.click(mentionsButton)

      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
      expect(screen.queryByText('You received a Gold Award!')).not.toBeInTheDocument()
    })

    test('shows empty state when filter has no results', async () => {
      const noAwards = mockNotifications.filter(n => n.type !== 'award_received')
      setupFetchMock(noAwards)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })

      const awardsButton = screen.getByText('Awards')
      await user.click(awardsButton)

      expect(screen.getByText('No notifications to show')).toBeInTheDocument()
    })

    test('applies active styling to selected filter', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
      })

      const allButton = screen.getByText('All')
      const unreadButton = screen.getByText('Unread')

      expect(allButton).toHaveClass('bg-rgb(var(--color-primary-500))')
      expect(unreadButton).not.toHaveClass('bg-rgb(var(--color-primary-500))')

      await user.click(unreadButton)

      expect(unreadButton).toHaveClass('bg-rgb(var(--color-primary-500))')
      expect(allButton).not.toHaveClass('bg-rgb(var(--color-primary-500))')
    })
  })

  describe('Timestamp Formatting', () => {
    test('displays "now" for very recent notifications', async () => {
      const recentNotification = [{
        id: '1',
        type: 'post_upvoted',
        read: false,
        timestamp: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        data: { postTitle: 'Recent post' }
      }]
      setupFetchMock(recentNotification)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('now')).toBeInTheDocument()
      })
    })

    test('displays minutes ago for notifications under 1 hour', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('5m ago')).toBeInTheDocument()
      })
    })

    test('displays hours ago for notifications under 24 hours', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('2h ago')).toBeInTheDocument()
      })
    })

    test('displays days ago for notifications under 30 days', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('1d ago')).toBeInTheDocument()
        expect(screen.getByText('2d ago')).toBeInTheDocument()
        expect(screen.getByText('3d ago')).toBeInTheDocument()
      })
    })

    test('displays formatted date for notifications over 30 days', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        const notifications = screen.getAllByText(/\//)
        expect(notifications.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Notification Interactions', () => {
    test('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn()
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })

      const closeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && btn.closest('.p-2')
      )
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    test('expands notification when clicked', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('A prestigious gold award')).toBeInTheDocument()
      })
    })

    test('collapses notification when clicked again', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')

      // Expand
      await user.click(notification)
      await waitFor(() => {
        expect(screen.getByText('A prestigious gold award')).toBeInTheDocument()
      })

      // Collapse
      await user.click(notification)
      await waitFor(() => {
        expect(screen.queryByText('A prestigious gold award')).not.toBeInTheDocument()
      })
    })

    test('marks notification as read when clicked', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1/read',
          { method: 'POST' }
        )
      })
    })

    test('does not mark already read notification as read again', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })

      const readNotification = screen.getByText('Your post was upvoted')
      const initialCallCount = global.fetch.mock.calls.filter(
        call => call[0].includes('/read')
      ).length

      await user.click(readNotification)

      const finalCallCount = global.fetch.mock.calls.filter(
        call => call[0].includes('/read')
      ).length

      expect(finalCallCount).toBe(initialCallCount)
    })

    test('marks notification as read using expanded Mark read button', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('Mark read')).toBeInTheDocument()
      })

      const markReadButton = screen.getByText('Mark read')
      await user.click(markReadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1/read',
          { method: 'POST' }
        )
      })
    })

    test('deletes notification when Delete button is clicked', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1',
          { method: 'DELETE' }
        )
      })

      await waitFor(() => {
        expect(screen.queryByText('You received a Gold Award!')).not.toBeInTheDocument()
      })
    })

    test('marks all notifications as read when Mark all read button is clicked', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument()
      })

      const markAllButton = screen.getByText('Mark all read')
      await user.click(markAllButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/mark-all-read',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-123' })
          }
        )
      })

      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument()
      })
    })

    test('hides Mark all read button when no unread notifications', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, read: true }))
      setupFetchMock(readNotifications)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument()
      })

      expect(screen.queryByText('Mark all read')).not.toBeInTheDocument()
    })

    test('stops event propagation when clicking Mark read button', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('Mark read')).toBeInTheDocument()
      })

      const notificationContainer = screen.getByText('You received a Gold Award!').closest('div[class*="relative"]')
      const initialClass = notificationContainer.className

      const markReadButton = screen.getByText('Mark read')
      await user.click(markReadButton)

      // Should not collapse the notification
      expect(screen.getByText('A prestigious gold award')).toBeInTheDocument()
    })

    test('stops event propagation when clicking Delete button', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      // Event should not bubble up to collapse notification
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1',
          { method: 'DELETE' }
        )
      })
    })
  })

  describe('Real-time Notifications (EventSource)', () => {
    test('initializes EventSource with correct URL', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
        expect(MockEventSource.instances[0].url).toBe('/api/notifications/stream?userId=user-123')
      })
    })

    test('adds new notification when EventSource receives message', async () => {
      setupFetchMock([])
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No notifications to show')).toBeInTheDocument()
      })

      const eventSource = MockEventSource.instances[0]
      const newNotification = {
        id: 'new-1',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Silver Award',
          awardIcon: '🥈',
          message: 'Nice work!',
          postTitle: 'Great content'
        }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newNotification) })
      })

      await waitFor(() => {
        expect(screen.getByText('You received a Silver Award!')).toBeInTheDocument()
      })
    })

    test('prepends new notification to the list', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const eventSource = MockEventSource.instances[0]
      const newNotification = {
        id: 'new-1',
        type: 'post_upvoted',
        read: false,
        timestamp: new Date().toISOString(),
        data: { postTitle: 'Newest post' }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newNotification) })
      })

      await waitFor(() => {
        const notifications = screen.getAllByText(/Your post was upvoted|You received/)
        expect(notifications[0]).toHaveTextContent('Your post was upvoted')
      })
    })

    test('creates browser notification for new award when permission granted', async () => {
      global.Notification.permission = 'granted'
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
      })

      const eventSource = MockEventSource.instances[0]
      const newAward = {
        id: 'new-award',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Platinum Award',
          awardIcon: '💎',
          message: 'Outstanding!',
          postTitle: 'Amazing work'
        }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newAward) })
      })

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith(
          'You received a Platinum Award!',
          {
            body: 'Outstanding!',
            icon: '/icons/award.png',
            tag: 'award-new-award'
          }
        )
      })
    })

    test('does not create browser notification when permission not granted', async () => {
      global.Notification.permission = 'denied'
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
      })

      const eventSource = MockEventSource.instances[0]
      const newAward = {
        id: 'new-award',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Platinum Award',
          awardIcon: '💎',
          postTitle: 'Amazing work'
        }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newAward) })
      })

      await waitFor(() => {
        expect(screen.getByText('You received a Platinum Award!')).toBeInTheDocument()
      })

      expect(mockNotification).not.toHaveBeenCalled()
    })

    test('does not create browser notification for non-award notifications', async () => {
      global.Notification.permission = 'granted'
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
      })

      const eventSource = MockEventSource.instances[0]
      const newUpvote = {
        id: 'new-upvote',
        type: 'post_upvoted',
        read: false,
        timestamp: new Date().toISOString(),
        data: { postTitle: 'Some post' }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newUpvote) })
      })

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })

      expect(mockNotification).not.toHaveBeenCalled()
    })

    test('closes EventSource on component unmount', async () => {
      setupFetchMock()
      const { unmount } = render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
      })

      const eventSource = MockEventSource.instances[0]
      expect(eventSource.closed).toBeUndefined()

      unmount()

      expect(eventSource.closed).toBe(true)
    })

    test('uses fallback message when award has no custom message', async () => {
      global.Notification.permission = 'granted'
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBe(1)
      })

      const eventSource = MockEventSource.instances[0]
      const newAward = {
        id: 'new-award',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Basic Award',
          awardIcon: '🏅',
          postTitle: 'Post'
        }
      }

      act(() => {
        eventSource.onmessage({ data: JSON.stringify(newAward) })
      })

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith(
          'You received a Basic Award!',
          expect.objectContaining({
            body: 'Someone appreciated your post'
          })
        )
      })
    })
  })

  describe('API Error Handling', () => {
    test('handles fetch notifications error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to fetch notifications:',
          expect.any(Error)
        )
      })

      expect(screen.getByText('No notifications to show')).toBeInTheDocument()
    })

    test('handles mark as read error gracefully', async () => {
      setupFetchMock()
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/notifications?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ notifications: mockNotifications })
          })
        }
        if (url.includes('/read')) {
          return Promise.reject(new Error('Failed to mark as read'))
        }
        return Promise.resolve({ ok: true })
      })

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to mark notification as read:',
          expect.any(Error)
        )
      })
    })

    test('handles mark all as read error gracefully', async () => {
      setupFetchMock()
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/notifications?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ notifications: mockNotifications })
          })
        }
        if (url.includes('/mark-all-read')) {
          return Promise.reject(new Error('Failed to mark all as read'))
        }
        return Promise.resolve({ ok: true })
      })

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument()
      })

      const markAllButton = screen.getByText('Mark all read')
      await user.click(markAllButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to mark all as read:',
          expect.any(Error)
        )
      })
    })

    test('handles delete notification error gracefully', async () => {
      setupFetchMock()
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/notifications?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ notifications: mockNotifications })
          })
        }
        if (options?.method === 'DELETE') {
          return Promise.reject(new Error('Failed to delete'))
        }
        return Promise.resolve({ ok: true })
      })

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      await user.click(notification)

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to delete notification:',
          expect.any(Error)
        )
      })
    })

    test('sets loading to false even when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.queryByRole('generic', { hidden: true })).not.toHaveClass('animate-spin')
      })
    })
  })

  describe('Visual States', () => {
    test('applies unread styling to unread notifications', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const unreadNotification = screen.getByText('You received a Gold Award!').closest('div[class*="relative"]')
      expect(unreadNotification).toHaveClass('bg-accent/5', 'border-accent/20')
    })

    test('applies read styling to read notifications', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })

      const readNotification = screen.getByText('Your post was upvoted').closest('div[class*="relative"]')
      expect(readNotification).toHaveClass('bg-bg-secondary/30', 'border-border-primary/20')
    })

    test('displays unread indicator dot for unread notifications', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const unreadNotification = screen.getByText('You received a Gold Award!').closest('div[class*="relative"]')
      const unreadDot = within(unreadNotification).getByRole('generic', { hidden: true })

      expect(unreadDot.className).toContain('w-2 h-2 bg-accent rounded-full')
    })

    test('does not display unread indicator for read notifications', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Your post was upvoted')).toBeInTheDocument()
      })

      const readNotification = screen.getByText('Your post was upvoted').closest('div[class*="relative"]')
      const dots = within(readNotification).queryAllByRole('generic', { hidden: true })
      const unreadDot = dots.find(dot => dot.className.includes('w-2 h-2 bg-accent rounded-full'))

      expect(unreadDot).toBeUndefined()
    })

    test('applies ring styling to selected notification', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      const notificationContainer = notification.closest('div[class*="relative"]')

      expect(notificationContainer).not.toHaveClass('ring-2', 'ring-accent/50')

      await user.click(notification)

      await waitFor(() => {
        expect(notificationContainer).toHaveClass('ring-2', 'ring-accent/50')
      })
    })

    test('removes ring styling when notification is deselected', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      const notification = screen.getByText('You received a Gold Award!')
      const notificationContainer = notification.closest('div[class*="relative"]')

      // Select
      await user.click(notification)
      await waitFor(() => {
        expect(notificationContainer).toHaveClass('ring-2', 'ring-accent/50')
      })

      // Deselect
      await user.click(notification)
      await waitFor(() => {
        expect(notificationContainer).not.toHaveClass('ring-2', 'ring-accent/50')
      })
    })
  })

  describe('Award Details Component', () => {
    test('renders award icon in details', async () => {
      setupFetchMock()
      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Gold Award!')).toBeInTheDocument()
      })

      await user.click(screen.getByText('You received a Gold Award!'))

      await waitFor(() => {
        const details = screen.getByText('A prestigious gold award').closest('div')
        expect(within(details.parentElement).getByText('🏆')).toBeInTheDocument()
      })
    })

    test('renders award without message field', async () => {
      const awardWithoutMessage = [{
        id: '1',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Basic Award',
          awardIcon: '🏅',
          awardDescription: 'A simple award',
          postTitle: 'Post title',
          postId: 'post-1',
          karmaValue: 10
        }
      }]
      setupFetchMock(awardWithoutMessage)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Basic Award!')).toBeInTheDocument()
      })

      await user.click(screen.getByText('You received a Basic Award!'))

      await waitFor(() => {
        expect(screen.getByText('A simple award')).toBeInTheDocument()
      })

      expect(screen.queryByText(/from u\//)).not.toBeInTheDocument()
    })

    test('renders award without coins received', async () => {
      const awardWithoutCoins = [{
        id: '1',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Free Award',
          awardIcon: '🎁',
          awardDescription: 'Free award',
          postTitle: 'Post',
          postId: 'post-1',
          karmaValue: 5
        }
      }]
      setupFetchMock(awardWithoutCoins)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Free Award!')).toBeInTheDocument()
      })

      await user.click(screen.getByText('You received a Free Award!'))

      await waitFor(() => {
        expect(screen.getByText('+5 karma')).toBeInTheDocument()
      })

      expect(screen.queryByText(/coins/)).not.toBeInTheDocument()
    })

    test('renders award without premium days', async () => {
      const awardWithoutPremium = [{
        id: '1',
        type: 'award_received',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          awardName: 'Basic Award',
          awardIcon: '⭐',
          awardDescription: 'Basic award',
          postTitle: 'Post',
          postId: 'post-1',
          karmaValue: 10,
          coinsReceived: 5
        }
      }]
      setupFetchMock(awardWithoutPremium)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('You received a Basic Award!')).toBeInTheDocument()
      })

      await user.click(screen.getByText('You received a Basic Award!'))

      await waitFor(() => {
        expect(screen.getByText('+10 karma')).toBeInTheDocument()
        expect(screen.getByText('+5 coins')).toBeInTheDocument()
      })

      expect(screen.queryByText(/Premium/)).not.toBeInTheDocument()
    })

    test('truncates long post titles in descriptions', async () => {
      const longTitleNotification = [{
        id: '1',
        type: 'post_upvoted',
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          postTitle: 'This is a very long post title that exceeds the fifty character limit and should be truncated'
        }
      }]
      setupFetchMock(longTitleNotification)

      render(<AwardNotificationSystem userId="user-123" onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/This is a very long post title that exceeds the/)).toBeInTheDocument()
      })
    })
  })
})

export default mockNotification
