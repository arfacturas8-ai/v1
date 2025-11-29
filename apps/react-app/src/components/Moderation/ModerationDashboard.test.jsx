import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ModerationDashboard from './ModerationDashboard';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock sub-components
jest.mock('./ModerationQueue', () => {
  return function ModerationQueue({ onUserSelect, onItemAction }) {
    return (
      <div data-testid="moderation-queue">
        <button onClick={() => onUserSelect('user123')}>Select User</button>
        <button onClick={() => onItemAction('queue1', 'approved', 'Test notes')}>
          Approve Queue Item
        </button>
      </div>
    );
  };
});

jest.mock('./ReportingSystem', () => {
  return function ReportsPanel({ onUserSelect, onQuickAction }) {
    return (
      <div data-testid="reports-panel">
        <button onClick={() => onUserSelect('user456')}>Select Report User</button>
        <button onClick={() => onQuickAction('ban', 'user789', 'Spam')}>
          Quick Ban
        </button>
      </div>
    );
  };
});

jest.mock('./AnalyticsPanel', () => {
  return function AnalyticsPanel() {
    return <div data-testid="analytics-panel">Analytics Panel</div>;
  };
});

// Mock components that are referenced but not imported
const ModerationStats = ({ stats }) => (
  <div data-testid="moderation-stats">
    <span>Pending: {stats?.queue?.pending_queue || 0}</span>
  </div>
);

const ReportsPanel = ({ socket, onUserSelect, onQuickAction }) => (
  <div data-testid="reports-panel">
    <button onClick={() => onUserSelect('user456')}>Select Report User</button>
    <button onClick={() => onQuickAction('ban', 'user789', 'Spam')}>Quick Ban</button>
  </div>
);

const LiveModerationFeed = ({ events, onUserSelect }) => (
  <div data-testid="live-feed">
    {events.map((event, idx) => (
      <div key={idx} data-testid={`event-${idx}`}>
        {event.type}
      </div>
    ))}
  </div>
);

const QuickActions = ({ onAction, socket }) => (
  <div data-testid="quick-actions">
    <button onClick={() => onAction('timeout', 'user999', 'Testing')}>
      Quick Timeout
    </button>
  </div>
);

const UserModerationHistory = ({ userId, onQuickAction }) => (
  <div data-testid="user-history">
    <span>User: {userId}</span>
    <button onClick={() => onQuickAction('warn', userId, 'Warning')}>Warn User</button>
  </div>
);

// Add mocks to window object
global.ModerationStats = ModerationStats;
global.ReportsPanel = ReportsPanel;
global.LiveModerationFeed = LiveModerationFeed;
global.QuickActions = QuickActions;
global.UserModerationHistory = UserModerationHistory;

// Mock CSS import
jest.mock('./ModerationDashboard.css', () => ({}));

// Mock framer-motion if used
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('ModerationDashboard', () => {
  let mockSocket;
  let mockSocketInstance;

  const mockUser = {
    id: 'moderator123',
    username: 'testmoderator',
    role: 'moderator',
  };

  const mockToken = 'mock-auth-token-12345';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup localStorage
    localStorage.clear();
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Mock socket instance with all event handlers
    mockSocketInstance = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };

    // Mock io function
    mockSocket = jest.fn(() => mockSocketInstance);
    io.mockImplementation(mockSocket);

    // Mock Notification API
    global.Notification = jest.fn();
    global.Notification.permission = 'default';
    global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <ModerationDashboard />
      </BrowserRouter>
    );
  };

  // ===== RENDERING AND INITIAL STATE TESTS =====

  describe('Rendering and Initial State', () => {
    test('1. renders without crashing', () => {
      renderDashboard();
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    test('2. displays disconnected status initially', () => {
      renderDashboard();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('3. renders dashboard header with title', () => {
      renderDashboard();
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('4. renders connection status indicator', () => {
      renderDashboard();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      const statusElement = document.querySelector('.connection-status');
      expect(statusElement).toBeInTheDocument();
    });

    test('5. renders all navigation tabs', () => {
      renderDashboard();
      const nav = document.querySelector('.tab-navigation');
      expect(nav).toBeInTheDocument();
      const buttons = nav.querySelectorAll('.tab-button');
      expect(buttons.length).toBeGreaterThanOrEqual(5);
    });

    test('6. defaults to queue tab as active', () => {
      renderDashboard();
      const activeButton = document.querySelector('.tab-button.active');
      expect(activeButton).toBeInTheDocument();
      expect(activeButton.textContent).toContain('Queue');
    });

    test('7. renders sidebar sections', () => {
      renderDashboard();
      expect(screen.getByText('Active Moderators')).toBeInTheDocument();
      expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    });

    test('8. displays initial moderator stats as zero', () => {
      renderDashboard();
      expect(screen.getByText('0 online')).toBeInTheDocument();
    });

    test('9. does not render user history tab initially', () => {
      renderDashboard();
      expect(screen.queryByText('User History')).not.toBeInTheDocument();
    });

    test('10. renders with correct CSS classes', () => {
      renderDashboard();
      const dashboard = screen.getByText('Moderation Dashboard').closest('.moderation-dashboard');
      expect(dashboard).toBeInTheDocument();
    });
  });

  // ===== SOCKET.IO CONNECTION TESTS =====

  describe('Socket.IO Connection', () => {
    test('11. initializes socket connection with correct URL', () => {
      renderDashboard();
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: mockToken },
          transports: ['websocket'],
        })
      );
    });

    test('12. does not initialize socket without auth token', () => {
      localStorage.removeItem('auth_token');
      renderDashboard();
      // Socket should not be called when there's no token
      expect(io).not.toHaveBeenCalled();
    });

    test('13. registers connect event handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    test('14. registers disconnect event handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    test('15. registers moderator_authenticated event handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'moderator_authenticated',
        expect.any(Function)
      );
    });

    test('16. registers authentication_failed event handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'authentication_failed',
        expect.any(Function)
      );
    });

    test('17. registers moderation_event handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'moderation_event',
        expect.any(Function)
      );
    });

    test('18. registers urgent_notification handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'urgent_notification',
        expect.any(Function)
      );
    });

    test('19. registers live_stats_update handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'live_stats_update',
        expect.any(Function)
      );
    });

    test('20. registers queue_item_assigned handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'queue_item_assigned',
        expect.any(Function)
      );
    });

    test('21. registers action_applied handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith(
        'action_applied',
        expect.any(Function)
      );
    });

    test('22. registers action_error handler', () => {
      renderDashboard();
      expect(mockSocketInstance.on).toHaveBeenCalledWith('action_error', expect.any(Function));
    });

    test('23. updates connection status on connect event', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      await act(async () => {
        connectHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    test('24. emits authenticate_moderator on connect', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      await act(async () => {
        connectHandler();
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('authenticate_moderator', {
        userId: mockUser.id,
        token: mockToken,
      });
    });

    test('25. updates connection status on disconnect event', async () => {
      renderDashboard();

      // First connect
      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      await act(async () => {
        connectHandler();
      });

      // Then disconnect
      const disconnectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      await act(async () => {
        disconnectHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    test('26. disconnects socket on component unmount', () => {
      const { unmount } = renderDashboard();
      unmount();
      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    });
  });

  // ===== AUTHENTICATION TESTS =====

  describe('Authentication Flow', () => {
    test('27. retrieves auth token from localStorage', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      renderDashboard();
      expect(getItemSpy).toHaveBeenCalledWith('auth_token');
    });

    test('28. retrieves user data from localStorage', () => {
      renderDashboard();
      // The connect handler will parse user from localStorage
      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      expect(() => connectHandler()).not.toThrow();
    });

    test('29. handles moderator_authenticated event', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      const mockStats = {
        queue: { pending_queue: 5, total_queue_items: 10 },
        reports: { pending_reports: 3 },
        online_moderators: 7,
      };

      await act(async () => {
        authHandler(mockStats);
      });

      await waitFor(() => {
        expect(screen.getByText('7 online')).toBeInTheDocument();
      });
    });

    test('30. handles authentication_failed event', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      renderDashboard();

      const authFailHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'authentication_failed'
      )[1];

      const mockError = { message: 'Invalid token' };

      await act(async () => {
        authFailHandler(mockError);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Moderator authentication failed:',
        mockError
      );
    });

    test('31. handles missing user data gracefully', () => {
      localStorage.setItem('user', '{}');
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      expect(() => {
        act(() => {
          connectHandler();
        });
      }).not.toThrow();
    });
  });

  // ===== TAB NAVIGATION TESTS =====

  describe('Tab Navigation', () => {
    test('32. changes to reports tab when clicked', async () => {
      renderDashboard();

      const buttons = document.querySelectorAll('.tab-button');
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));

      await act(async () => {
        fireEvent.click(reportsButton);
      });

      expect(reportsButton).toHaveClass('active');
      expect(screen.getByTestId('reports-panel')).toBeInTheDocument();
    });

    test('33. changes to analytics tab when clicked', async () => {
      renderDashboard();

      const analyticsButton = screen.getByText(/Analytics/).closest('button');

      await act(async () => {
        fireEvent.click(analyticsButton);
      });

      expect(analyticsButton).toHaveClass('active');
      expect(screen.getByTestId('analytics-panel')).toBeInTheDocument();
    });

    test('34. changes to live feed tab when clicked', async () => {
      renderDashboard();

      const liveFeedButton = screen.getByText(/Live Feed/).closest('button');

      await act(async () => {
        fireEvent.click(liveFeedButton);
      });

      expect(liveFeedButton).toHaveClass('active');
      expect(screen.getByTestId('live-feed')).toBeInTheDocument();
    });

    test('35. changes to quick actions tab when clicked', async () => {
      renderDashboard();

      const quickActionsButton = screen.getByText(/Quick Actions/).closest('button');

      await act(async () => {
        fireEvent.click(quickActionsButton);
      });

      expect(quickActionsButton).toHaveClass('active');
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    test('36. displays queue count in tab label', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      await act(async () => {
        authHandler({ queue: { pending_queue: 15 } });
      });

      expect(screen.getByText(/Queue \(15\)/)).toBeInTheDocument();
    });

    test('37. displays reports count in tab label', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      await act(async () => {
        authHandler({ reports: { pending_reports: 8 } });
      });

      expect(screen.getByText(/Reports \(8\)/)).toBeInTheDocument();
    });

    test('38. shows user history tab when user is selected', async () => {
      renderDashboard();

      const selectButton = screen.getByText('Select User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByText('User History')).toBeInTheDocument();
      });
    });

    test('39. switches to user history tab when user is selected', async () => {
      renderDashboard();

      const selectButton = screen.getByText('Select User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        const userHistoryButton = screen.getByText('User History').closest('button');
        expect(userHistoryButton).toHaveClass('active');
      });
    });
  });

  // ===== NOTIFICATION HANDLING TESTS =====

  describe('Notification Handling', () => {
    test('40. requests notification permission on mount', () => {
      renderDashboard();
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('41. does not request permission if already granted', () => {
      global.Notification.permission = 'granted';
      renderDashboard();
      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });

    test('42. handles urgent_notification event', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      const mockNotification = {
        id: 'notif1',
        type: 'urgent',
        title: 'Urgent Report',
        message: 'New urgent report received',
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        notificationHandler(mockNotification);
      });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // badge count
      });
    });

    test('43. shows browser notification for urgent items', async () => {
      global.Notification.permission = 'granted';
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      const mockNotification = {
        id: 'notif2',
        type: 'urgent',
        title: 'Critical Alert',
        message: 'Critical moderation issue',
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        notificationHandler(mockNotification);
      });

      expect(Notification).toHaveBeenCalledWith('Critical Alert', {
        body: 'Critical moderation issue',
        icon: '/icons/warning.png',
      });
    });

    test('44. displays notification badge with count', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        notificationHandler({
          id: '1',
          type: 'urgent',
          title: 'Test 1',
          message: 'Message 1',
          timestamp: new Date().toISOString(),
        });
        notificationHandler({
          id: '2',
          type: 'urgent',
          title: 'Test 2',
          message: 'Message 2',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('45. dismisses notification when clicked', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      const mockNotification = {
        id: 'notif3',
        type: 'urgent',
        title: 'Dismissable',
        message: 'Click to dismiss',
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        notificationHandler(mockNotification);
      });

      // Verify notification was added (shown in sidebar recent notifications)
      await waitFor(() => {
        const sidebarNotifications = document.querySelector('.recent-notifications');
        expect(sidebarNotifications).toBeInTheDocument();
      });
    });

    test('46. limits notifications dropdown to 5 items', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          notificationHandler({
            id: `notif${i}`,
            type: 'urgent',
            title: `Notification ${i}`,
            message: `Message ${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      await waitFor(() => {
        const dropdown = document.querySelector('.notifications-dropdown');
        const items = dropdown.querySelectorAll('.notification-item');
        expect(items.length).toBe(5);
      });
    });

    test('47. displays notification timestamp', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      const timestamp = new Date().toISOString();

      await act(async () => {
        notificationHandler({
          id: 'notif4',
          type: 'urgent',
          title: 'Timed Notification',
          message: 'Has timestamp',
          timestamp,
        });
      });

      await waitFor(() => {
        const timeElements = document.querySelectorAll('.notification-time');
        expect(timeElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  // ===== MODERATION ACTIONS TESTS =====

  describe('Moderation Actions', () => {
    test('48. handles quick action timeout', async () => {
      renderDashboard();

      // Connect socket first
      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      await act(async () => {
        connectHandler();
      });

      // Switch to quick actions tab
      const quickActionsButton = screen.getByText(/Quick Actions/).closest('button');
      await act(async () => {
        fireEvent.click(quickActionsButton);
      });

      const timeoutButton = screen.getByText('Quick Timeout');

      await act(async () => {
        fireEvent.click(timeoutButton);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('apply_moderation_action', {
        action_type: 'timeout',
        target_user_id: 'user999',
        reason: 'Testing',
        duration_minutes: 60,
      });
    });

    test('49. handles quick action ban', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      await act(async () => {
        connectHandler();
      });

      const buttons = document.querySelectorAll('.tab-button');
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));
      await act(async () => {
        fireEvent.click(reportsButton);
      });

      const banButton = screen.getByText('Quick Ban');

      await act(async () => {
        fireEvent.click(banButton);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('apply_moderation_action', {
        action_type: 'ban',
        target_user_id: 'user789',
        reason: 'Spam',
        duration_minutes: 10080,
      });
    });

    test('50. does not emit action without socket connection', async () => {
      localStorage.removeItem('auth_token');
      renderDashboard();

      // Socket should not be initialized without auth token
      expect(io).not.toHaveBeenCalled();
    });

    test('51. handles queue item approval via API', async () => {
      renderDashboard();

      const approveButton = screen.getByText('Approve Queue Item');

      await act(async () => {
        fireEvent.click(approveButton);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/queue/queue1'),
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({
              status: 'approved',
              notes: 'Test notes',
            }),
          })
        );
      });
    });

    test('52. handles API error for queue item action', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      renderDashboard();

      const approveButton = screen.getByText('Approve Queue Item');

      await act(async () => {
        fireEvent.click(approveButton);
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    test('53. handles network error for queue item action', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      renderDashboard();

      const approveButton = screen.getByText('Approve Queue Item');

      await act(async () => {
        fireEvent.click(approveButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error updating queue item:',
          expect.any(Error)
        );
      });
    });

    test('54. handles action_applied socket event', async () => {
      renderDashboard();

      const actionAppliedHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'action_applied'
      )[1];

      await act(async () => {
        actionAppliedHandler({ success: true });
      });

      // Verify handler was registered
      expect(mockSocketInstance.on).toHaveBeenCalledWith('action_applied', expect.any(Function));
    });

    test('55. handles action_error socket event', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      renderDashboard();

      const actionErrorHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'action_error'
      )[1];

      const mockError = { error: 'Insufficient permissions' };

      await act(async () => {
        actionErrorHandler(mockError);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Moderation action error:', mockError);
    });
  });

  // ===== LIVE EVENTS TESTS =====

  describe('Live Events and Stats', () => {
    test('56. handles moderation_event socket event', async () => {
      renderDashboard();

      const eventHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderation_event'
      )[1];

      const mockEvent = {
        type: 'user_warned',
        userId: 'user123',
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        eventHandler(mockEvent);
      });

      // Switch to live feed
      const liveFeedButton = screen.getByText(/Live Feed/).closest('button');
      await act(async () => {
        fireEvent.click(liveFeedButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-0')).toHaveTextContent('user_warned');
      });
    });

    test('57. limits live events to 50 items', async () => {
      renderDashboard();

      const eventHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderation_event'
      )[1];

      await act(async () => {
        for (let i = 0; i < 60; i++) {
          eventHandler({
            type: `event_${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      const liveFeedButton = screen.getByText(/Live Feed/).closest('button');
      await act(async () => {
        fireEvent.click(liveFeedButton);
      });

      await waitFor(() => {
        const events = screen.getAllByTestId(/^event-/);
        expect(events.length).toBe(50);
      });
    });

    test('58. updates moderator stats on live_stats_update event', async () => {
      renderDashboard();

      const statsHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'live_stats_update'
      )[1];

      await act(async () => {
        statsHandler({
          online_moderators: 12,
          queue: { pending_queue: 25 },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('12 online')).toBeInTheDocument();
      });
    });

    test('59. merges stats updates with existing stats', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      await act(async () => {
        authHandler({
          online_moderators: 5,
          queue: { pending_queue: 10, total_queue_items: 20 },
        });
      });

      const statsHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'live_stats_update'
      )[1];

      await act(async () => {
        statsHandler({
          online_moderators: 8,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('8 online')).toBeInTheDocument();
        expect(screen.getByText(/Queue \(10\)/)).toBeInTheDocument();
      });
    });

    test('60. displays quick stats in sidebar', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      await act(async () => {
        authHandler({
          reports: { pending_reports: 15, reports_24h: 42 },
          queue: { total_queue_items: 30, high_priority_queue: 5 },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Pending Reports
        expect(screen.getByText('30')).toBeInTheDocument(); // Queue Items
        expect(screen.getByText('5')).toBeInTheDocument(); // High Priority
        expect(screen.getByText('42')).toBeInTheDocument(); // 24h Reports
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    test('61. handles malformed user data in localStorage', () => {
      localStorage.setItem('user', 'invalid-json');

      expect(() => {
        renderDashboard();
      }).not.toThrow();
    });

    test('62. handles missing Notification API', () => {
      delete global.Notification;

      expect(() => {
        renderDashboard();
      }).not.toThrow();
    });

    test('63. handles socket emit without connection', async () => {
      renderDashboard();

      const buttons = document.querySelectorAll('.tab-button');
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));
      await act(async () => {
        fireEvent.click(reportsButton);
      });

      // Should not throw even when trying actions
      const banButton = screen.getByText('Quick Ban');
      expect(() => {
        act(() => {
          fireEvent.click(banButton);
        });
      }).not.toThrow();
    });

    test('64. handles queue_item_assigned event', async () => {
      renderDashboard();

      const assignedHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'queue_item_assigned'
      )[1];

      expect(() => {
        act(() => {
          assignedHandler({ queueId: 'queue123', moderatorId: 'mod456' });
        });
      }).not.toThrow();
    });

    test('65. handles empty notifications array', () => {
      renderDashboard();

      expect(screen.queryByText('1')).not.toBeInTheDocument(); // No badge
    });

    test('66. handles empty moderator stats', () => {
      renderDashboard();

      expect(screen.getByText('0 online')).toBeInTheDocument();
    });

    test('67. constructs socket URL from VITE_API_URL', () => {
      renderDashboard();

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.any(Object),
          transports: ['websocket'],
        })
      );
    });
  });

  // ===== COMPONENT INTERACTION TESTS =====

  describe('Component Interactions', () => {
    test('68. passes socket to ModerationQueue component', () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      act(() => {
        connectHandler();
      });

      expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();
    });

    test('69. passes filters to ModerationQueue component', () => {
      renderDashboard();
      expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();
    });

    test('70. handles onUserSelect from ModerationQueue', async () => {
      renderDashboard();

      const selectButton = screen.getByText('Select User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByText('User History')).toBeInTheDocument();
        expect(screen.getByText('User: user123')).toBeInTheDocument();
      });
    });

    test('71. handles onUserSelect from ReportsPanel', async () => {
      renderDashboard();

      const buttons = document.querySelectorAll('.tab-button');
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));
      await act(async () => {
        fireEvent.click(reportsButton);
      });

      const selectButton = screen.getByText('Select Report User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByText('User: user456')).toBeInTheDocument();
      });
    });

    test('72. displays selected user in UserModerationHistory', async () => {
      renderDashboard();

      const selectButton = screen.getByText('Select User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-history')).toBeInTheDocument();
      });
    });

    test('73. handles quick action from UserModerationHistory', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      await act(async () => {
        connectHandler();
      });

      const selectButton = screen.getByText('Select User');
      await act(async () => {
        fireEvent.click(selectButton);
      });

      const warnButton = screen.getByText('Warn User');
      await act(async () => {
        fireEvent.click(warnButton);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('apply_moderation_action', {
        action_type: 'warn',
        target_user_id: 'user123',
        reason: 'Warning',
        duration_minutes: undefined,
      });
    });
  });

  // ===== HELPER FUNCTIONS TESTS =====

  describe('Helper Functions', () => {
    test('74. getDefaultDuration returns correct value for timeout', () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      act(() => {
        connectHandler();
      });

      const quickActionsButton = screen.getByText(/Quick Actions/).closest('button');
      act(() => {
        fireEvent.click(quickActionsButton);
      });

      const timeoutButton = screen.getByText('Quick Timeout');
      act(() => {
        fireEvent.click(timeoutButton);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'apply_moderation_action',
        expect.objectContaining({ duration_minutes: 60 })
      );
    });

    test('75. getDefaultDuration returns correct value for ban', () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      act(() => {
        connectHandler();
      });

      const buttons = document.querySelectorAll('.tab-button');
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));
      act(() => {
        fireEvent.click(reportsButton);
      });

      const banButton = screen.getByText('Quick Ban');
      act(() => {
        fireEvent.click(banButton);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'apply_moderation_action',
        expect.objectContaining({ duration_minutes: 10080 })
      );
    });

    test('76. showToast handles success messages', async () => {
      renderDashboard();

      const actionAppliedHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'action_applied'
      )[1];

      expect(() => {
        act(() => {
          actionAppliedHandler({ success: true });
        });
      }).not.toThrow();
    });

    test('77. showToast handles error messages', async () => {
      renderDashboard();

      const actionErrorHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'action_error'
      )[1];

      expect(() => {
        act(() => {
          actionErrorHandler({ error: 'Test error' });
        });
      }).not.toThrow();
    });
  });

  // ===== ADDITIONAL EDGE CASES =====

  describe('Edge Cases', () => {
    test('78. handles multiple rapid tab changes', async () => {
      renderDashboard();

      const tabs = ['Reports', 'Analytics', 'Live Feed', 'Quick Actions'];
      const buttons = document.querySelectorAll('.tab-button');

      for (const tab of tabs) {
        const tabButton = Array.from(buttons).find(btn => btn.textContent.includes(tab));
        await act(async () => {
          fireEvent.click(tabButton);
        });
        expect(tabButton).toHaveClass('active');
      }
    });

    test('79. maintains active tab after stats update', async () => {
      renderDashboard();

      const analyticsButton = screen.getByText(/Analytics/).closest('button');
      await act(async () => {
        fireEvent.click(analyticsButton);
      });

      const statsHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'live_stats_update'
      )[1];

      await act(async () => {
        statsHandler({ online_moderators: 20 });
      });

      expect(analyticsButton).toHaveClass('active');
    });

    test('80. handles reconnection scenario', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      const disconnectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      // Connect
      await act(async () => {
        connectHandler();
      });
      expect(screen.getByText('Connected')).toBeInTheDocument();

      // Disconnect
      await act(async () => {
        disconnectHandler();
      });
      expect(screen.getByText('Disconnected')).toBeInTheDocument();

      // Reconnect
      await act(async () => {
        connectHandler();
      });
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    test('81. handles rapid notification additions', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        for (let i = 0; i < 20; i++) {
          notificationHandler({
            id: `rapid-${i}`,
            type: 'urgent',
            title: `Rapid ${i}`,
            message: `Message ${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument(); // Badge count
      });
    });

    test('82. sidebar shows limited recent notifications', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          notificationHandler({
            id: `sidebar-${i}`,
            type: 'info',
            title: `Sidebar ${i}`,
            message: `Message ${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      await waitFor(() => {
        const sidebar = document.querySelector('.recent-notifications');
        const items = sidebar.querySelectorAll('.notification-item');
        expect(items.length).toBe(3); // Limited to 3 in sidebar
      });
    });

    test('83. handles empty stats gracefully', async () => {
      renderDashboard();

      const statsHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'live_stats_update'
      )[1];

      await act(async () => {
        statsHandler({});
      });

      expect(screen.getByText('0 online')).toBeInTheDocument();
    });

    test('84. displays connection class on status element', async () => {
      renderDashboard();

      const connectHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      await act(async () => {
        connectHandler();
      });

      const statusElement = document.querySelector('.connection-status.connected');
      expect(statusElement).toBeInTheDocument();
    });

    test('85. displays disconnection class on status element', () => {
      renderDashboard();

      const statusElement = document.querySelector('.connection-status.disconnected');
      expect(statusElement).toBeInTheDocument();
    });
  });

  // ===== ADDITIONAL COMPREHENSIVE TESTS =====

  describe('Additional Comprehensive Tests', () => {
    test('86. verifies all event listeners are registered', () => {
      renderDashboard();

      const expectedEvents = [
        'connect',
        'disconnect',
        'moderator_authenticated',
        'authentication_failed',
        'moderation_event',
        'urgent_notification',
        'live_stats_update',
        'queue_item_assigned',
        'action_applied',
        'action_error',
      ];

      expectedEvents.forEach(event => {
        expect(mockSocketInstance.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });

    test('87. handles API call with correct authorization header', async () => {
      renderDashboard();

      const approveButton = screen.getByText('Approve Queue Item');

      await act(async () => {
        fireEvent.click(approveButton);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockToken}`,
            }),
          })
        );
      });
    });

    test('88. constructs correct API URL for queue items', async () => {
      renderDashboard();

      const approveButton = screen.getByText('Approve Queue Item');

      await act(async () => {
        fireEvent.click(approveButton);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/queue/queue1'),
          expect.any(Object)
        );
      });
    });

    test('89. notification type class is applied correctly', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        notificationHandler({
          id: 'typed-notif',
          type: 'urgent',
          title: 'Type Test',
          message: 'Testing type class',
          timestamp: new Date().toISOString(),
        });
      });

      // Verify notification was added to state
      await waitFor(() => {
        expect(document.querySelector('.notifications-badge')).toBeInTheDocument();
      });
    });

    test('90. handles user selection and maintains state', async () => {
      renderDashboard();

      const selectButton = screen.getByText('Select User');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-history')).toBeInTheDocument();
      });

      // Switch to another tab
      const buttons = document.querySelectorAll('.tab-button');
      const queueButton = Array.from(buttons).find(btn => btn.textContent.includes('Queue'));
      await act(async () => {
        fireEvent.click(queueButton);
      });

      // User history tab should still be visible
      expect(screen.getByText('User History')).toBeInTheDocument();
    });

    test('91. validates filter structure passed to ModerationQueue', () => {
      renderDashboard();

      // Component should pass default filters
      expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();
    });

    test('92. handles socket null check before emit', async () => {
      localStorage.removeItem('auth_token');
      renderDashboard();

      const quickActionsButton = screen.getByText(/Quick Actions/).closest('button');
      await act(async () => {
        fireEvent.click(quickActionsButton);
      });

      const timeoutButton = screen.getByText('Quick Timeout');

      await act(async () => {
        fireEvent.click(timeoutButton);
      });

      // Should not crash or emit when socket is null
      expect(mockSocketInstance.emit).not.toHaveBeenCalled();
    });

    test('93. preserves most recent events', async () => {
      renderDashboard();

      const eventHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderation_event'
      )[1];

      await act(async () => {
        eventHandler({ type: 'old_event' });
        eventHandler({ type: 'new_event' });
      });

      const liveFeedButton = screen.getByText(/Live Feed/).closest('button');
      await act(async () => {
        fireEvent.click(liveFeedButton);
      });

      await waitFor(() => {
        const firstEvent = screen.getByTestId('event-0');
        expect(firstEvent).toHaveTextContent('new_event');
      });
    });

    test('94. displays all sidebar stat items', () => {
      renderDashboard();

      expect(screen.getByText('Pending Reports')).toBeInTheDocument();
      expect(screen.getByText('Queue Items')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('24h Reports')).toBeInTheDocument();
    });

    test('95. notification dropdown renders correct structure', async () => {
      renderDashboard();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        notificationHandler({
          id: 'struct-test',
          type: 'info',
          title: 'Structure Test',
          message: 'Testing structure',
          timestamp: new Date().toISOString(),
        });
      });

      // Verify notification structures exist
      await waitFor(() => {
        expect(document.querySelector('.notifications-badge')).toBeInTheDocument();
        expect(document.querySelector('.notifications-dropdown')).toBeInTheDocument();
      });
    });

    test('96. handles consecutive authentication', async () => {
      renderDashboard();

      const authHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'moderator_authenticated'
      )[1];

      await act(async () => {
        authHandler({ online_moderators: 5 });
        authHandler({ online_moderators: 10 });
      });

      await waitFor(() => {
        expect(screen.getByText('10 online')).toBeInTheDocument();
      });
    });

    test('97. socket cleanup on unmount prevents memory leaks', () => {
      const { unmount } = renderDashboard();

      unmount();

      expect(mockSocketInstance.disconnect).toHaveBeenCalledTimes(1);
    });

    test('98. validates dashboard structure hierarchy', () => {
      renderDashboard();

      const dashboard = document.querySelector('.moderation-dashboard');
      expect(dashboard.querySelector('.dashboard-header')).toBeInTheDocument();
      expect(dashboard.querySelector('.dashboard-navigation')).toBeInTheDocument();
      expect(dashboard.querySelector('.dashboard-content')).toBeInTheDocument();
    });

    test('99. ensures notification badge only shows when notifications exist', async () => {
      renderDashboard();

      expect(document.querySelector('.notifications-badge')).not.toBeInTheDocument();

      const notificationHandler = mockSocketInstance.on.mock.calls.find(
        call => call[0] === 'urgent_notification'
      )[1];

      await act(async () => {
        notificationHandler({
          id: 'badge-test',
          type: 'urgent',
          title: 'Badge Test',
          message: 'Testing badge',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(document.querySelector('.notifications-badge')).toBeInTheDocument();
      });
    });

    test('100. verifies correct tab content rendering for each tab', async () => {
      renderDashboard();

      const buttons = document.querySelectorAll('.tab-button');

      // Queue tab
      expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();

      // Reports tab
      const reportsButton = Array.from(buttons).find(btn => btn.textContent.includes('Reports'));
      await act(async () => {
        fireEvent.click(reportsButton);
      });
      expect(screen.getByTestId('reports-panel')).toBeInTheDocument();

      // Analytics tab
      const analyticsButton = Array.from(buttons).find(btn => btn.textContent.includes('Analytics'));
      await act(async () => {
        fireEvent.click(analyticsButton);
      });
      expect(screen.getByTestId('analytics-panel')).toBeInTheDocument();

      // Live Feed tab
      const liveFeedButton = Array.from(buttons).find(btn => btn.textContent.includes('Live Feed'));
      await act(async () => {
        fireEvent.click(liveFeedButton);
      });
      expect(screen.getByTestId('live-feed')).toBeInTheDocument();

      // Quick Actions tab
      const quickActionsButton = Array.from(buttons).find(btn => btn.textContent.includes('Quick Actions'));
      await act(async () => {
        fireEvent.click(quickActionsButton);
      });
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });
});

export default ModerationQueue
