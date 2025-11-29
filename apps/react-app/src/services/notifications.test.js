/**
 * Tests for notifications service
 */
import notificationService from './notifications';

// Mock global objects
global.Notification = jest.fn();
global.Notification.permission = 'default';
global.Notification.requestPermission = jest.fn();

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    notificationService.notifications = [];
    notificationService.notificationId = 0;
    notificationService.listeners.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Event Management', () => {
    it('registers event listeners', () => {
      const callback = jest.fn();
      notificationService.on('test_event', callback);

      expect(notificationService.listeners.has('test_event')).toBe(true);
      expect(notificationService.listeners.get('test_event')).toContain(callback);
    });

    it('removes event listeners', () => {
      const callback = jest.fn();
      notificationService.on('test_event', callback);
      notificationService.off('test_event', callback);

      const listeners = notificationService.listeners.get('test_event');
      expect(listeners).not.toContain(callback);
    });

    it('emits events to registered listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      notificationService.on('test_event', callback1);
      notificationService.on('test_event', callback2);

      notificationService.emit('test_event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('handles errors in event callbacks gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const successCallback = jest.fn();

      notificationService.on('test_event', errorCallback);
      notificationService.on('test_event', successCallback);

      notificationService.emit('test_event', {});

      expect(successCallback).toHaveBeenCalled();
    });
  });

  describe('Toast Notifications', () => {
    it('shows notification with default settings', () => {
      const id = notificationService.show('Test message');

      expect(id).toBe(1);
      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].message).toBe('Test message');
      expect(notificationService.notifications[0].type).toBe('info');
    });

    it('shows notification with custom options', () => {
      notificationService.show('Test', {
        type: 'success',
        title: 'Success Title',
        duration: 3000,
        persistent: true
      });

      const notification = notificationService.notifications[0];
      expect(notification.type).toBe('success');
      expect(notification.title).toBe('Success Title');
      expect(notification.duration).toBe(3000);
      expect(notification.persistent).toBe(true);
    });

    it('includes action in notification', () => {
      const handler = jest.fn();
      notificationService.show('Test', {
        action: {
          label: 'Click me',
          handler
        }
      });

      expect(notificationService.notifications[0].action.label).toBe('Click me');
      expect(notificationService.notifications[0].action.handler).toBe(handler);
    });

    it('emits notification_added event', () => {
      const callback = jest.fn();
      notificationService.on('notification_added', callback);

      notificationService.show('Test');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].message).toBe('Test');
    });

    it('limits number of notifications', () => {
      for (let i = 0; i < 10; i++) {
        notificationService.show(`Message ${i}`);
      }

      expect(notificationService.notifications.length).toBe(5);
    });

    it('auto-dismisses non-persistent notifications', () => {
      const id = notificationService.show('Test', { duration: 1000 });

      expect(notificationService.notifications).toHaveLength(1);

      jest.advanceTimersByTime(1100);

      expect(notificationService.notifications).toHaveLength(0);
    });

    it('does not auto-dismiss persistent notifications', () => {
      notificationService.show('Test', { persistent: true });

      jest.advanceTimersByTime(10000);

      expect(notificationService.notifications).toHaveLength(1);
    });

    it('does not auto-dismiss when duration is 0', () => {
      notificationService.show('Test', { duration: 0 });

      jest.advanceTimersByTime(10000);

      expect(notificationService.notifications).toHaveLength(1);
    });
  });

  describe('Notification Types', () => {
    it('shows success notification', () => {
      notificationService.success('Success message');

      expect(notificationService.notifications[0].type).toBe('success');
      expect(notificationService.notifications[0].message).toBe('Success message');
    });

    it('shows error notification', () => {
      notificationService.error('Error message');

      expect(notificationService.notifications[0].type).toBe('error');
    });

    it('shows warning notification', () => {
      notificationService.warning('Warning message');

      expect(notificationService.notifications[0].type).toBe('warning');
    });

    it('shows info notification', () => {
      notificationService.info('Info message');

      expect(notificationService.notifications[0].type).toBe('info');
    });

    it('allows custom options for typed notifications', () => {
      notificationService.success('Test', { duration: 2000, title: 'Custom' });

      expect(notificationService.notifications[0].duration).toBe(2000);
      expect(notificationService.notifications[0].title).toBe('Custom');
    });
  });

  describe('Dismiss Notifications', () => {
    it('dismisses notification by id', () => {
      const id = notificationService.show('Test');

      notificationService.dismiss(id);

      expect(notificationService.notifications).toHaveLength(0);
    });

    it('emits notification_removed event on dismiss', () => {
      const callback = jest.fn();
      notificationService.on('notification_removed', callback);

      const id = notificationService.show('Test');
      notificationService.dismiss(id);

      expect(callback).toHaveBeenCalled();
    });

    it('does nothing when dismissing non-existent id', () => {
      notificationService.show('Test');
      notificationService.dismiss(999);

      expect(notificationService.notifications).toHaveLength(1);
    });

    it('dismisses all notifications', () => {
      notificationService.show('Test 1');
      notificationService.show('Test 2');
      notificationService.show('Test 3');

      notificationService.dismissAll();

      expect(notificationService.notifications).toHaveLength(0);
    });

    it('emits notification_removed for each dismissed notification', () => {
      const callback = jest.fn();
      notificationService.on('notification_removed', callback);

      notificationService.show('Test 1');
      notificationService.show('Test 2');

      notificationService.dismissAll();

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Get Notifications', () => {
    it('returns copy of notifications array', () => {
      notificationService.show('Test 1');
      notificationService.show('Test 2');

      const notifications = notificationService.getNotifications();

      expect(notifications).toHaveLength(2);
      expect(notifications).not.toBe(notificationService.notifications);
    });

    it('returns empty array when no notifications', () => {
      const notifications = notificationService.getNotifications();

      expect(notifications).toEqual([]);
    });
  });

  describe('Browser Notifications', () => {
    it('requests notification permission', async () => {
      global.Notification.requestPermission.mockResolvedValue('granted');

      const result = await notificationService.requestPermission();

      expect(result).toBe(true);
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('returns false when permission denied', async () => {
      global.Notification.requestPermission.mockResolvedValue('denied');

      const result = await notificationService.requestPermission();

      expect(result).toBe(false);
    });

    it('returns false when Notification API not available', async () => {
      const originalNotification = global.Notification;
      delete global.Notification;

      const result = await notificationService.requestPermission();

      expect(result).toBe(false);

      global.Notification = originalNotification;
    });

    it('shows browser notification when permission granted', () => {
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation((title, options) => ({
        title,
        ...options,
        addEventListener: jest.fn()
      }));

      notificationService.showBrowserNotification('Test Title', {
        body: 'Test body'
      });

      expect(global.Notification).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test body'
      }));
    });

    it('uses custom icon or default favicon', () => {
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation((title, options) => ({
        addEventListener: jest.fn()
      }));

      notificationService.showBrowserNotification('Test', {});

      expect(global.Notification).toHaveBeenCalledWith('Test', expect.objectContaining({
        icon: '/favicon.ico'
      }));
    });

    it('attaches onClick handler to browser notification', () => {
      const mockAddEventListener = jest.fn();
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation(() => ({
        addEventListener: mockAddEventListener
      }));

      const onClick = jest.fn();
      notificationService.showBrowserNotification('Test', { onClick });

      expect(mockAddEventListener).toHaveBeenCalledWith('click', onClick);
    });

    it('falls back to toast when permission not granted', () => {
      global.Notification.permission = 'denied';

      notificationService.showBrowserNotification('Test Title', {
        body: 'Test body'
      });

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].message).toBe('Test Title');
    });
  });

  describe('Real-time Notification Handlers', () => {
    it('handles direct message notification', () => {
      const message = {
        sender: { displayName: 'John', id: 'user-1' },
        content: 'Hello'
      };

      notificationService.handleDirectMessage(message);

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].message).toContain('John');
    });

    it('handles mention notification', () => {
      const mention = {
        community: { displayName: 'Tech Community' },
        postId: 'post-1',
        content: 'Great post!'
      };

      notificationService.handleMentionNotification(mention);

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].message).toContain('Tech Community');
    });

    it('handles voice channel invite', () => {
      const invite = {
        inviter: { displayName: 'Alice' },
        channelId: 'channel-1'
      };

      notificationService.handleVoiceChannelInvite(invite);

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].persistent).toBe(true);
    });

    it('handles community invite', () => {
      const invite = {
        community: { displayName: 'Gaming', id: 'comm-1' }
      };

      notificationService.handleCommunityInvite(invite);

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].type).toBe('success');
    });

    it('handles system notification', () => {
      const notification = {
        message: 'System update available',
        type: 'warning',
        title: 'Update',
        persistent: true
      };

      notificationService.handleSystemNotification(notification);

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0].type).toBe('warning');
    });
  });

  describe('Connection Status Handlers', () => {
    it('handles connected status', () => {
      notificationService.handleConnectionStatus('connected');

      expect(notificationService.notifications[0].type).toBe('success');
      expect(notificationService.notifications[0].message).toContain('Connected');
    });

    it('handles disconnected status', () => {
      notificationService.handleConnectionStatus('disconnected');

      expect(notificationService.notifications[0].type).toBe('error');
      expect(notificationService.notifications[0].persistent).toBe(true);
    });

    it('handles reconnecting status', () => {
      notificationService.handleConnectionStatus('reconnecting');

      expect(notificationService.notifications[0].type).toBe('warning');
    });

    it('handles reconnected status', () => {
      notificationService.handleConnectionStatus('reconnected');

      expect(notificationService.notifications[0].type).toBe('success');
    });
  });

  describe('File Upload Handlers', () => {
    it('handles uploading status', () => {
      const id = notificationService.handleFileUpload('uploading', 'photo.jpg');

      expect(notificationService.notifications[0].message).toContain('photo.jpg');
      expect(notificationService.notifications[0].persistent).toBe(true);
      expect(id).toBeDefined();
    });

    it('handles upload success', () => {
      notificationService.handleFileUpload('success', 'photo.jpg');

      expect(notificationService.notifications[0].type).toBe('success');
    });

    it('handles upload error', () => {
      notificationService.handleFileUpload('error', 'photo.jpg');

      expect(notificationService.notifications[0].type).toBe('error');
    });
  });

  describe('Community Handlers', () => {
    it('handles community join', () => {
      const community = { displayName: 'Developers', id: 'comm-1' };

      notificationService.handleCommunityJoin(community);

      expect(notificationService.notifications[0].message).toContain('Developers');
    });

    it('handles new post notification', () => {
      const post = {
        id: 'post-1',
        title: 'New Post',
        community: {
          displayName: 'Tech',
          notifications: true
        }
      };

      notificationService.handleNewPost(post);

      expect(notificationService.notifications).toHaveLength(1);
    });

    it('does not notify when community notifications disabled', () => {
      const post = {
        community: {
          displayName: 'Tech',
          notifications: false
        }
      };

      notificationService.handleNewPost(post);

      expect(notificationService.notifications).toHaveLength(0);
    });
  });

  describe('API Error Handler', () => {
    it('handles server error with response', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' }
        }
      };

      notificationService.handleApiError(error);

      expect(notificationService.notifications[0].type).toBe('error');
      expect(notificationService.notifications[0].message).toContain('Server error');
    });

    it('handles network error', () => {
      const error = { request: {} };

      notificationService.handleApiError(error);

      expect(notificationService.notifications[0].message).toContain('Network error');
    });

    it('handles generic error', () => {
      const error = { message: 'Something failed' };

      notificationService.handleApiError(error);

      expect(notificationService.notifications[0].message).toBe('Something failed');
    });

    it('includes retry action when available', () => {
      const retryFn = jest.fn();
      const error = {
        message: 'Failed',
        retry: retryFn
      };

      notificationService.handleApiError(error);

      expect(notificationService.notifications[0].action.label).toBe('Retry');
      expect(notificationService.notifications[0].action.handler).toBe(retryFn);
    });
  });

  describe('Clear Expired', () => {
    it('clears expired notifications', () => {
      notificationService.show('Test 1', { duration: 1000 });
      notificationService.show('Test 2', { duration: 5000 });
      notificationService.show('Test 3', { persistent: true });

      // Advance time by 2 seconds
      jest.advanceTimersByTime(2000);

      notificationService.clearExpired();

      expect(notificationService.notifications).toHaveLength(2);
    });

    it('does not clear persistent notifications', () => {
      notificationService.show('Test', { persistent: true });

      jest.advanceTimersByTime(100000);
      notificationService.clearExpired();

      expect(notificationService.notifications).toHaveLength(1);
    });
  });

  describe('Destroy', () => {
    it('clears all notifications and listeners', () => {
      notificationService.show('Test 1');
      notificationService.show('Test 2');
      notificationService.on('test_event', jest.fn());

      notificationService.destroy();

      expect(notificationService.notifications).toHaveLength(0);
      expect(notificationService.listeners.size).toBe(0);
    });
  });
});
