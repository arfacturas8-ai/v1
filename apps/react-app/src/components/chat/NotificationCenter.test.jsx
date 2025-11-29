/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: ({ className }) => <div data-testid="bell-icon" className={className} />,
  BellOff: ({ className }) => <div data-testid="bell-off-icon" className={className} />,
  X: ({ className }) => <div data-testid="x-icon" className={className} />,
  Check: ({ className }) => <div data-testid="check-icon" className={className} />,
  CheckCheck: ({ className }) => <div data-testid="check-check-icon" className={className} />,
  Trash2: ({ className }) => <div data-testid="trash2-icon" className={className} />,
  MessageCircle: ({ className }) => <div data-testid="message-circle-icon" className={className} />,
  Phone: ({ className }) => <div data-testid="phone-icon" className={className} />,
  Video: ({ className }) => <div data-testid="video-icon" className={className} />,
  UserPlus: ({ className }) => <div data-testid="user-plus-icon" className={className} />,
  Crown: ({ className }) => <div data-testid="crown-icon" className={className} />,
  Shield: ({ className }) => <div data-testid="shield-icon" className={className} />,
  Hash: ({ className }) => <div data-testid="hash-icon" className={className} />,
  Volume2: ({ className }) => <div data-testid="volume2-icon" className={className} />,
  Pin: ({ className }) => <div data-testid="pin-icon" className={className} />,
  Heart: ({ className }) => <div data-testid="heart-icon" className={className} />,
  Star: ({ className }) => <div data-testid="star-icon" className={className} />,
  AlertTriangle: ({ className }) => <div data-testid="alert-triangle-icon" className={className} />,
  Settings: ({ className }) => <div data-testid="settings-icon" className={className} />,
  Filter: ({ className }) => <div data-testid="filter-icon" className={className} />,
  Calendar: ({ className }) => <div data-testid="calendar-icon" className={className} />,
  User: ({ className }) => <div data-testid="user-icon" className={className} />,
  ChevronDown: ({ className }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronUp: ({ className }) => <div data-testid="chevron-up-icon" className={className} />,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Notification API
const mockNotification = {
  permission: 'default',
  requestPermission: jest.fn(() => Promise.resolve('granted')),
};

global.Notification = jest.fn((title, options) => ({
  title,
  options,
  close: jest.fn(),
  onclick: null,
}));
global.Notification.permission = 'default';
global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  volume: 1,
}));

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'mention',
      title: 'New Mention',
      message: 'You were mentioned in a message',
      timestamp: new Date().toISOString(),
      read: false,
      channelName: 'general',
      channelId: 'channel-1',
    },
    {
      id: '2',
      type: 'direct_message',
      title: 'Direct Message',
      message: 'You have a new direct message',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'call',
      title: 'Missed Call',
      message: 'You missed a call',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      callType: 'video',
    },
    {
      id: '4',
      type: 'system',
      title: 'System Update',
      message: 'System maintenance scheduled',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      read: true,
    },
  ];

  const defaultProps = {
    notifications: [],
    onNotificationClick: jest.fn(),
    onMarkAsRead: jest.fn(),
    onMarkAllAsRead: jest.fn(),
    onClearAll: jest.fn(),
    onNotificationDismiss: jest.fn(),
    onSettingsOpen: jest.fn(),
    user: { id: 'user-1', name: 'Test User' },
    isMobile: false,
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    global.Notification.permission = 'default';
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<NotificationCenter {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct header structure', () => {
      render(<NotificationCenter {...defaultProps} />);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('renders notification center with custom className', () => {
      const { container } = render(
        <NotificationCenter {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders all action buttons in header', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash2-icon')).toBeInTheDocument();
    });

    it('renders filter dropdown', () => {
      render(<NotificationCenter {...defaultProps} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      expect(filterSelect).toBeInTheDocument();
      expect(within(filterSelect).getByText('All')).toBeInTheDocument();
    });

    it('renders group by dropdown', () => {
      render(<NotificationCenter {...defaultProps} />);
      const groupBySelect = screen.getAllByRole('combobox')[1];
      expect(groupBySelect).toBeInTheDocument();
      expect(within(groupBySelect).getByText('Group by Type')).toBeInTheDocument();
    });
  });

  describe('Unread Count Badge', () => {
    it('displays unread count when there are unread notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const unreadBadge = screen.getByText('2');
      expect(unreadBadge).toBeInTheDocument();
      expect(unreadBadge).toHaveClass('bg-red-500');
    });

    it('does not display badge when all notifications are read', () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, read: true }));
      render(<NotificationCenter {...defaultProps} notifications={readNotifications} />);
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('updates badge count dynamically', () => {
      const { rerender } = render(
        <NotificationCenter {...defaultProps} notifications={mockNotifications} />
      );
      expect(screen.getByText('2')).toBeInTheDocument();

      const updatedNotifications = mockNotifications.map(n => ({ ...n, read: true }));
      rerender(<NotificationCenter {...defaultProps} notifications={updatedNotifications} />);
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  describe('Settings Panel', () => {
    it('toggles settings panel on settings button click', () => {
      render(<NotificationCenter {...defaultProps} />);
      const settingsButton = screen.getByTestId('settings-icon').closest('button');

      expect(screen.queryByText('Notification Settings')).not.toBeInTheDocument();

      fireEvent.click(settingsButton);
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();

      fireEvent.click(settingsButton);
      expect(screen.queryByText('Notification Settings')).not.toBeInTheDocument();
    });

    it('renders all notification settings options', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      expect(screen.getByText('Desktop notifications')).toBeInTheDocument();
      expect(screen.getByText('Sound notifications')).toBeInTheDocument();
      expect(screen.getByText('Mentions')).toBeInTheDocument();
      expect(screen.getByText('Direct messages')).toBeInTheDocument();
      expect(screen.getByText('Do not disturb')).toBeInTheDocument();
    });

    it('renders sound settings when sound is enabled', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      expect(screen.getByText('Sound Settings')).toBeInTheDocument();
      expect(screen.getByText(/Volume:/)).toBeInTheDocument();
      expect(screen.getByText('Message sound')).toBeInTheDocument();
    });

    it('hides sound settings when sound is disabled', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const soundCheckbox = screen.getByLabelText('Sound notifications');
      fireEvent.click(soundCheckbox);

      expect(screen.queryByText('Sound Settings')).not.toBeInTheDocument();
    });

    it('persists notification settings to localStorage', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const desktopCheckbox = screen.getByLabelText('Desktop notifications');
      fireEvent.click(desktopCheckbox);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb-notification-settings',
        expect.any(String)
      );
    });

    it('loads notification settings from localStorage on mount', () => {
      const savedSettings = {
        desktop: false,
        sound: false,
        mentions: false,
        directMessages: true,
        groupMessages: true,
        calls: true,
        serverUpdates: false,
        systemMessages: true,
        doNotDisturb: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const doNotDisturbCheckbox = screen.getByLabelText('Do not disturb');
      expect(doNotDisturbCheckbox).toBeChecked();
    });

    it('updates volume setting', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const volumeSlider = screen.getByRole('slider');
      fireEvent.change(volumeSlider, { target: { value: '50' } });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb-sound-settings',
        expect.stringContaining('"volume":50')
      );
    });

    it('updates message sound setting', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const messageSoundSelect = screen.getByLabelText('Message sound');
      fireEvent.change(messageSoundSelect, { target: { value: 'chime' } });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb-sound-settings',
        expect.stringContaining('"messageSound":"chime"')
      );
    });
  });

  describe('Notification List Display', () => {
    it('displays empty state when no notifications', () => {
      render(<NotificationCenter {...defaultProps} />);
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it('displays notification count in footer', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('4 notifications')).toBeInTheDocument();
    });

    it('renders all notifications in groups', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('New Mention')).toBeInTheDocument();
      expect(screen.getByText('Direct Message')).toBeInTheDocument();
      expect(screen.getByText('Missed Call')).toBeInTheDocument();
      expect(screen.getByText('System Update')).toBeInTheDocument();
    });

    it('displays notification with channel name', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('general')).toBeInTheDocument();
    });

    it('highlights unread notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      expect(notification).toHaveClass('bg-blue-50');
    });

    it('does not highlight read notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('Missed Call').closest('div[class*="p-4"]');
      expect(notification).not.toHaveClass('bg-blue-50');
    });
  });

  describe('Notification Icons and Types', () => {
    it('displays correct icon for mention notification', () => {
      const mentionNotif = [mockNotifications[0]];
      render(<NotificationCenter {...defaultProps} notifications={mentionNotif} />);
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('displays correct icon for direct message notification', () => {
      const dmNotif = [mockNotifications[1]];
      render(<NotificationCenter {...defaultProps} notifications={dmNotif} />);
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
    });

    it('displays correct icon for video call notification', () => {
      const callNotif = [mockNotifications[2]];
      render(<NotificationCenter {...defaultProps} notifications={callNotif} />);
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    });

    it('displays phone icon for voice call notification', () => {
      const voiceCallNotif = [{
        ...mockNotifications[2],
        callType: 'audio',
      }];
      render(<NotificationCenter {...defaultProps} notifications={voiceCallNotif} />);
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    });

    it('displays correct color for mention notification', () => {
      const mentionNotif = [mockNotifications[0]];
      render(<NotificationCenter {...defaultProps} notifications={mentionNotif} />);
      const iconWrapper = screen.getByTestId('bell-icon').closest('div');
      expect(iconWrapper).toHaveClass('text-blue-600');
    });

    it('displays correct color for call notification', () => {
      const callNotif = [mockNotifications[2]];
      render(<NotificationCenter {...defaultProps} notifications={callNotif} />);
      const iconWrapper = screen.getByTestId('video-icon').closest('div');
      expect(iconWrapper).toHaveClass('text-green-600');
    });
  });

  describe('Filter Notifications', () => {
    it('filters notifications by "all"', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'all' } });

      expect(screen.getByText('4 notifications')).toBeInTheDocument();
    });

    it('filters notifications by "unread"', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'unread' } });

      expect(screen.getByText('2 notifications')).toBeInTheDocument();
      expect(screen.getByText('New Mention')).toBeInTheDocument();
      expect(screen.queryByText('Missed Call')).not.toBeInTheDocument();
    });

    it('filters notifications by "mentions"', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'mentions' } });

      expect(screen.getByText('New Mention')).toBeInTheDocument();
      expect(screen.getByText('Direct Message')).toBeInTheDocument();
      expect(screen.queryByText('Missed Call')).not.toBeInTheDocument();
    });

    it('filters notifications by "calls"', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'calls' } });

      expect(screen.getByText('Missed Call')).toBeInTheDocument();
      expect(screen.queryByText('New Mention')).not.toBeInTheDocument();
    });

    it('filters notifications by "system"', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'system' } });

      expect(screen.getByText('System Update')).toBeInTheDocument();
      expect(screen.queryByText('New Mention')).not.toBeInTheDocument();
    });

    it('shows empty state when filter has no results', () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, read: true }));
      render(<NotificationCenter {...defaultProps} notifications={readNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'unread' } });

      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  describe('Group Notifications', () => {
    it('groups notifications by type by default', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('Mentions')).toBeInTheDocument();
      expect(screen.getByText('Direct Messages')).toBeInTheDocument();
      expect(screen.getByText('Calls')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('displays notification count per group', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('(1)')).toBeInTheDocument(); // One mention
    });

    it('groups notifications by time', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const groupBySelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(groupBySelect, { target: { value: 'time' } });

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('Older')).toBeInTheDocument();
    });

    it('groups notifications by channel', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const groupBySelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(groupBySelect, { target: { value: 'channel' } });

      expect(screen.getByText('#channel-1')).toBeInTheDocument();
      expect(screen.getByText('Direct Messages')).toBeInTheDocument();
    });

    it('toggles group expansion', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const mentionsGroup = screen.getByText('Mentions').closest('button');

      // Initially expanded (default state)
      expect(screen.getByText('New Mention')).toBeInTheDocument();

      fireEvent.click(mentionsGroup);
      expect(screen.queryByText('New Mention')).not.toBeInTheDocument();

      fireEvent.click(mentionsGroup);
      expect(screen.getByText('New Mention')).toBeInTheDocument();
    });

    it('shows chevron up when group is expanded', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const mentionsGroup = screen.getByText('Mentions').closest('button');
      expect(within(mentionsGroup).getByTestId('chevron-up-icon')).toBeInTheDocument();
    });

    it('shows chevron down when group is collapsed', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const mentionsGroup = screen.getByText('Mentions').closest('button');

      fireEvent.click(mentionsGroup);
      expect(within(mentionsGroup).getByTestId('chevron-down-icon')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('displays "Just now" for recent notifications', () => {
      const recentNotif = [{
        ...mockNotifications[0],
        timestamp: new Date().toISOString(),
      }];
      render(<NotificationCenter {...defaultProps} notifications={recentNotif} />);
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('displays minutes ago for notifications within last hour', () => {
      const notif = [{
        ...mockNotifications[0],
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      }];
      render(<NotificationCenter {...defaultProps} notifications={notif} />);
      expect(screen.getByText(/30m ago/)).toBeInTheDocument();
    });

    it('displays hours ago for notifications within last day', () => {
      const notif = [{
        ...mockNotifications[0],
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      }];
      render(<NotificationCenter {...defaultProps} notifications={notif} />);
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it('displays date for older notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const olderNotif = screen.getByText('System Update').closest('div[class*="p-4"]');
      const timestamp = within(olderNotif).getByText(/\d+\/\d+\/\d+/);
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('Mark Notification as Read', () => {
    it('calls onMarkAsRead when clicking unread notification', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      fireEvent.click(notification);

      expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('calls onNotificationClick when clicking notification', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      fireEvent.click(notification);

      expect(defaultProps.onNotificationClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' })
      );
    });

    it('shows mark as read button for unread notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const markReadButton = within(notification).getByTestId('check-icon').closest('button');
      expect(markReadButton).toBeInTheDocument();
    });

    it('calls onMarkAsRead when clicking mark as read button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const markReadButton = within(notification).getByTestId('check-icon').closest('button');

      fireEvent.click(markReadButton);
      expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('does not call onNotificationClick when clicking mark as read button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const markReadButton = within(notification).getByTestId('check-icon').closest('button');

      fireEvent.click(markReadButton);
      expect(defaultProps.onNotificationClick).not.toHaveBeenCalled();
    });

    it('displays unread indicator dot for unread notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const unreadDot = notification.querySelector('.bg-blue-500.rounded-full');
      expect(unreadDot).toBeInTheDocument();
    });

    it('does not display unread indicator for read notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('Missed Call').closest('div[class*="p-4"]');
      const unreadDot = notification.querySelector('.bg-blue-500.rounded-full');
      expect(unreadDot).not.toBeInTheDocument();
    });
  });

  describe('Mark All as Read', () => {
    it('shows mark all as read button when there are unread notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const markAllButton = screen.getByTitle('Mark all as read');
      expect(markAllButton).toBeInTheDocument();
    });

    it('does not show mark all as read button when all are read', () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, read: true }));
      render(<NotificationCenter {...defaultProps} notifications={readNotifications} />);
      expect(screen.queryByTitle('Mark all as read')).not.toBeInTheDocument();
    });

    it('calls onMarkAllAsRead when clicking mark all as read button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const markAllButton = screen.getByTitle('Mark all as read');
      fireEvent.click(markAllButton);

      expect(defaultProps.onMarkAllAsRead).toHaveBeenCalled();
    });
  });

  describe('Delete Notification', () => {
    it('shows dismiss button for each notification', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const dismissButton = within(notification).getByTestId('x-icon').closest('button');
      expect(dismissButton).toBeInTheDocument();
    });

    it('calls onNotificationDismiss when clicking dismiss button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const dismissButton = within(notification).getByTestId('x-icon').closest('button');

      fireEvent.click(dismissButton);
      expect(defaultProps.onNotificationDismiss).toHaveBeenCalledWith('1');
    });

    it('does not call onNotificationClick when clicking dismiss button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      const dismissButton = within(notification).getByTestId('x-icon').closest('button');

      fireEvent.click(dismissButton);
      expect(defaultProps.onNotificationClick).not.toHaveBeenCalled();
    });
  });

  describe('Clear All Notifications', () => {
    it('shows clear all button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const clearAllButton = screen.getByTitle('Clear all');
      expect(clearAllButton).toBeInTheDocument();
    });

    it('calls onClearAll when clicking clear all button', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const clearAllButton = screen.getByTitle('Clear all');
      fireEvent.click(clearAllButton);

      expect(defaultProps.onClearAll).toHaveBeenCalled();
    });

    it('shows clear all button even when no notifications', () => {
      render(<NotificationCenter {...defaultProps} />);
      const clearAllButton = screen.getByTitle('Clear all');
      expect(clearAllButton).toBeInTheDocument();
    });
  });

  describe('Selection Mode', () => {
    it('toggles selection mode on Select button click', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const selectButton = screen.getByText('Select');
      fireEvent.click(selectButton);

      expect(screen.getByText('0 selected')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows checkboxes in selection mode', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('selects notification when clicking checkbox', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('deselects notification when clicking checkbox again', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      fireEvent.click(checkboxes[0]);
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('marks selected notifications as read', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const markReadButton = screen.getByText('Mark Read');
      fireEvent.click(markReadButton);

      expect(defaultProps.onMarkAsRead).toHaveBeenCalled();
    });

    it('exits selection mode on cancel', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));
      expect(screen.getByText('0 selected')).toBeInTheDocument();

      const cancelButton = screen.getAllByText('Cancel')[1]; // Second cancel button in selection bar
      fireEvent.click(cancelButton);

      expect(screen.queryByText('0 selected')).not.toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('clears selections when exiting selection mode', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      const cancelButton = screen.getAllByText('Cancel')[1];
      fireEvent.click(cancelButton);

      fireEvent.click(screen.getByText('Select'));
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('does not trigger notification click when clicking checkbox', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(defaultProps.onNotificationClick).not.toHaveBeenCalled();
    });

    it('highlights selected notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      const notification = checkboxes[0].closest('div[class*="p-4"]');

      fireEvent.click(checkboxes[0]);
      expect(notification).toHaveClass('bg-blue-100');
    });
  });

  describe('Desktop Notifications', () => {
    it('requests notification permission when desktop notifications are enabled', () => {
      render(<NotificationCenter {...defaultProps} />);
      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));

      const desktopCheckbox = screen.getByLabelText('Desktop notifications');
      expect(desktopCheckbox).toBeChecked();
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('shows desktop notification for new unread notification', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      global.Notification.permission = 'granted';
      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'New Test Mention',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Notification).toHaveBeenCalledWith(
          'New Test Mention',
          expect.objectContaining({
            body: 'Test message',
          })
        );
      });
    });

    it('does not show desktop notification when permission is denied', async () => {
      global.Notification.permission = 'denied';
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'New Test Mention',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Notification).not.toHaveBeenCalled();
      });
    });

    it('does not show desktop notification when do not disturb is enabled', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));
      const dndCheckbox = screen.getByLabelText('Do not disturb');
      fireEvent.click(dndCheckbox);

      global.Notification.permission = 'granted';
      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'New Test Mention',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Notification).not.toHaveBeenCalled();
      });
    });

    it('does not show desktop notification for already read notification', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      global.Notification.permission = 'granted';
      const readNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Read Notification',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: true,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={readNotification} />);

      await waitFor(() => {
        expect(global.Notification).not.toHaveBeenCalled();
      });
    });
  });

  describe('Notification Sounds', () => {
    it('plays notification sound for new unread notification', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'New Test Mention',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledWith('/sounds/mention.mp3');
      });
    });

    it('plays correct sound for mention notification', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Mention',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledWith('/sounds/mention.mp3');
      });
    });

    it('plays correct sound for call notification', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      const newNotification = [{
        id: 'new-1',
        type: 'call',
        title: 'Call',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledWith('/sounds/call.mp3');
      });
    });

    it('does not play sound when sound is disabled', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));
      const soundCheckbox = screen.getByLabelText('Sound notifications');
      fireEvent.click(soundCheckbox);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Mention',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Audio).not.toHaveBeenCalled();
      });
    });

    it('does not play sound when do not disturb is enabled', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));
      const dndCheckbox = screen.getByLabelText('Do not disturb');
      fireEvent.click(dndCheckbox);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Mention',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        expect(global.Audio).not.toHaveBeenCalled();
      });
    });

    it('sets correct volume for notification sound', async () => {
      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      fireEvent.click(screen.getByTestId('settings-icon').closest('button'));
      const volumeSlider = screen.getByRole('slider');
      fireEvent.change(volumeSlider, { target: { value: '50' } });

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Mention',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);

      await waitFor(() => {
        const audioInstance = global.Audio.mock.results[0]?.value;
        expect(audioInstance.volume).toBe(0.5);
      });
    });
  });

  describe('Mobile Optimizations', () => {
    it('renders correctly in mobile mode', () => {
      const { container } = render(
        <NotificationCenter {...defaultProps} isMobile={true} notifications={mockNotifications} />
      );
      expect(container).toBeInTheDocument();
    });

    it('maintains functionality in mobile mode', () => {
      render(
        <NotificationCenter {...defaultProps} isMobile={true} notifications={mockNotifications} />
      );

      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      fireEvent.click(notification);

      expect(defaultProps.onNotificationClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<NotificationCenter {...defaultProps} />);
      const heading = screen.getByText('Notifications');
      expect(heading.tagName).toBe('H3');
    });

    it('has accessible filter dropdown', () => {
      render(<NotificationCenter {...defaultProps} />);
      const filterSelect = screen.getAllByRole('combobox')[0];
      expect(filterSelect).toBeInTheDocument();
    });

    it('has accessible group by dropdown', () => {
      render(<NotificationCenter {...defaultProps} />);
      const groupBySelect = screen.getAllByRole('combobox')[1];
      expect(groupBySelect).toBeInTheDocument();
    });

    it('has accessible buttons with titles', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByTitle('Mark all as read')).toBeInTheDocument();
      expect(screen.getByTitle('Clear all')).toBeInTheDocument();
    });

    it('notification groups are keyboard accessible', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const groupButton = screen.getByText('Mentions').closest('button');
      expect(groupButton).toBeInTheDocument();

      groupButton.focus();
      expect(document.activeElement).toBe(groupButton);
    });

    it('checkboxes have proper labels in selection mode', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      fireEvent.click(screen.getByText('Select'));

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty notifications array', () => {
      render(<NotificationCenter {...defaultProps} notifications={[]} />);
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('handles undefined notifications prop', () => {
      render(<NotificationCenter {...defaultProps} notifications={undefined} />);
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('handles missing callback props gracefully', () => {
      render(
        <NotificationCenter
          notifications={mockNotifications}
          user={{ id: 'user-1' }}
        />
      );

      const notification = screen.getByText('New Mention').closest('div[class*="p-4"]');
      expect(() => fireEvent.click(notification)).not.toThrow();
    });

    it('handles notification without timestamp', () => {
      const notifWithoutTimestamp = [{
        id: '1',
        type: 'mention',
        title: 'Test',
        message: 'Test message',
        read: false,
      }];

      render(<NotificationCenter {...defaultProps} notifications={notifWithoutTimestamp} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles notification without channel name', () => {
      const notifWithoutChannel = [{
        id: '1',
        type: 'mention',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      render(<NotificationCenter {...defaultProps} notifications={notifWithoutChannel} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');

      expect(() => {
        render(<NotificationCenter {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles audio playback errors gracefully', async () => {
      const mockAudioWithError = jest.fn().mockImplementation(() => ({
        play: jest.fn(() => Promise.reject(new Error('Audio error'))),
        pause: jest.fn(),
        volume: 1,
      }));
      global.Audio = mockAudioWithError;

      const { rerender } = render(<NotificationCenter {...defaultProps} notifications={[]} />);

      const newNotification = [{
        id: 'new-1',
        type: 'mention',
        title: 'Test',
        message: 'Test',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      expect(() => {
        rerender(<NotificationCenter {...defaultProps} notifications={newNotification} />);
      }).not.toThrow();
    });

    it('handles unknown notification type', () => {
      const unknownTypeNotif = [{
        id: '1',
        type: 'unknown_type',
        title: 'Unknown',
        message: 'Unknown notification type',
        timestamp: new Date().toISOString(),
        read: false,
      }];

      render(<NotificationCenter {...defaultProps} notifications={unknownTypeNotif} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument(); // Default icon
    });

    it('handles very long notification messages', () => {
      const longMessageNotif = [{
        id: '1',
        type: 'mention',
        title: 'Long Message',
        message: 'A'.repeat(500),
        timestamp: new Date().toISOString(),
        read: false,
      }];

      render(<NotificationCenter {...defaultProps} notifications={longMessageNotif} />);
      expect(screen.getByText('Long Message')).toBeInTheDocument();
    });

    it('handles rapid filter changes', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const filterSelect = screen.getAllByRole('combobox')[0];

      fireEvent.change(filterSelect, { target: { value: 'unread' } });
      fireEvent.change(filterSelect, { target: { value: 'mentions' } });
      fireEvent.change(filterSelect, { target: { value: 'all' } });

      expect(screen.getByText('4 notifications')).toBeInTheDocument();
    });

    it('handles rapid group by changes', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      const groupBySelect = screen.getAllByRole('combobox')[1];

      fireEvent.change(groupBySelect, { target: { value: 'time' } });
      fireEvent.change(groupBySelect, { target: { value: 'channel' } });
      fireEvent.change(groupBySelect, { target: { value: 'type' } });

      expect(screen.getByText('Mentions')).toBeInTheDocument();
    });

    it('handles notifications with same timestamp', () => {
      const sameTimestamp = new Date().toISOString();
      const duplicateTimestampNotifs = [
        { id: '1', type: 'mention', title: 'First', message: 'Test 1', timestamp: sameTimestamp, read: false },
        { id: '2', type: 'mention', title: 'Second', message: 'Test 2', timestamp: sameTimestamp, read: false },
      ];

      render(<NotificationCenter {...defaultProps} notifications={duplicateTimestampNotifs} />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('shows footer when notifications exist', () => {
      render(<NotificationCenter {...defaultProps} notifications={mockNotifications} />);
      expect(screen.getByText('4 notifications')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('does not show footer when no notifications', () => {
      render(<NotificationCenter {...defaultProps} notifications={[]} />);
      expect(screen.queryByText('Select')).not.toBeInTheDocument();
    });

    it('updates notification count dynamically', () => {
      const { rerender } = render(
        <NotificationCenter {...defaultProps} notifications={mockNotifications} />
      );
      expect(screen.getByText('4 notifications')).toBeInTheDocument();

      rerender(<NotificationCenter {...defaultProps} notifications={[mockNotifications[0]]} />);
      expect(screen.getByText('1 notifications')).toBeInTheDocument();
    });
  });
});

export default localStorageMock
