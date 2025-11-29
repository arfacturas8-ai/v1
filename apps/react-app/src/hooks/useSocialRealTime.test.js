/**
 * Tests for useSocialRealTime hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocialRealTime } from './useSocialRealTime';
import * as AuthContext from '../contexts/AuthContext';
import * as ToastContext from '../components/ui/useToast';
import socialWebSocketService from '../services/socialWebSocketService';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/useToast');
jest.mock('../services/socialWebSocketService');

describe('useSocialRealTime', () => {
  let mockUser;
  let mockShowToast;
  let mockEventHandlers;

  beforeEach(() => {
    // Mock user
    mockUser = { id: 'user-123', email: 'test@example.com' };
    AuthContext.useAuth = jest.fn(() => ({ user: mockUser }));

    // Mock toast
    mockShowToast = jest.fn();
    ToastContext.useToast = jest.fn(() => ({ showToast: mockShowToast }));

    // Mock localStorage
    const token = JSON.stringify({ token: 'test-token' });
    global.localStorage = {
      getItem: jest.fn(() => token),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock WebSocket service
    mockEventHandlers = {};
    socialWebSocketService.on = jest.fn((event, handler) => {
      mockEventHandlers[event] = handler;
      return jest.fn(); // Return unsubscribe function
    });
    socialWebSocketService.connect = jest.fn();
    socialWebSocketService.disconnect = jest.fn();
    socialWebSocketService.joinPresenceRoom = jest.fn();
    socialWebSocketService.joinFollowersRoom = jest.fn();
    socialWebSocketService.joinFollowingRoom = jest.fn();
    socialWebSocketService.joinFriendsRoom = jest.fn();
    socialWebSocketService.subscribeToActivityFeed = jest.fn();
    socialWebSocketService.followUser = jest.fn();
    socialWebSocketService.unfollowUser = jest.fn();
    socialWebSocketService.sendFriendRequest = jest.fn();
    socialWebSocketService.acceptFriendRequest = jest.fn();
    socialWebSocketService.rejectFriendRequest = jest.fn();
    socialWebSocketService.updateStatus = jest.fn();
    socialWebSocketService.trackSocialInteraction = jest.fn();
    socialWebSocketService.forceReconnect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useSocialRealTime());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.socialUpdates.followers).toEqual([]);
      expect(result.current.socialUpdates.following).toEqual([]);
      expect(result.current.socialUpdates.friends).toEqual([]);
      expect(result.current.socialUpdates.requests).toEqual([]);
    });

    it('auto-connects when user is available', () => {
      renderHook(() => useSocialRealTime({ autoConnect: true }));

      expect(socialWebSocketService.connect).toHaveBeenCalledWith('user-123', 'test-token');
    });

    it('does not auto-connect when disabled', () => {
      renderHook(() => useSocialRealTime({ autoConnect: false }));

      expect(socialWebSocketService.connect).not.toHaveBeenCalled();
    });

    it('disconnects on unmount', () => {
      const { unmount } = renderHook(() => useSocialRealTime());

      unmount();

      expect(socialWebSocketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('connects to socket', async () => {
      const { result } = renderHook(() => useSocialRealTime({ autoConnect: false }));

      await act(async () => {
        await result.current.connect();
      });

      expect(socialWebSocketService.connect).toHaveBeenCalled();
    });

    it('handles connection success', () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
    });

    it('joins rooms on connection', () => {
      renderHook(() => useSocialRealTime({ enablePresence: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      expect(socialWebSocketService.joinPresenceRoom).toHaveBeenCalled();
      expect(socialWebSocketService.joinFollowersRoom).toHaveBeenCalled();
      expect(socialWebSocketService.joinFollowingRoom).toHaveBeenCalled();
      expect(socialWebSocketService.joinFriendsRoom).toHaveBeenCalled();
    });

    it('subscribes to activity feed when enabled', () => {
      renderHook(() => useSocialRealTime({ enableActivityFeed: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      expect(socialWebSocketService.subscribeToActivityFeed).toHaveBeenCalled();
    });

    it('handles disconnection', () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      act(() => {
        mockEventHandlers.disconnected('Connection lost');
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBe('Connection lost');
    });

    it('handles connection errors', () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useSocialRealTime({ onError }));

      const error = { message: 'Connection failed' };

      act(() => {
        mockEventHandlers.connection_error(error);
      });

      expect(result.current.connectionError).toBe('Connection failed');
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('handles reconnection', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.reconnected(3);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState.reconnectAttempts).toBe(3);
      expect(mockShowToast).toHaveBeenCalledWith('Reconnected to social updates', 'success');
    });
  });

  describe('Follower Events', () => {
    it('handles new follower', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      const followerData = {
        user: { id: 'user-456', displayName: 'John Doe' }
      };

      act(() => {
        mockEventHandlers.new_follower(followerData);
      });

      expect(result.current.socialUpdates.followers).toContainEqual(followerData.user);
      expect(result.current.realTimeStats.followersCount).toBe(1);
      expect(mockShowToast).toHaveBeenCalledWith('John Doe started following you', 'info');
    });

    it('handles follower removed', () => {
      const { result } = renderHook(() => useSocialRealTime());

      // Add follower first
      act(() => {
        mockEventHandlers.new_follower({
          user: { id: 'user-456', displayName: 'John' }
        });
      });

      // Remove follower
      act(() => {
        mockEventHandlers.follower_removed({ userId: 'user-456' });
      });

      expect(result.current.socialUpdates.followers).toHaveLength(0);
      expect(result.current.realTimeStats.followersCount).toBe(0);
    });
  });

  describe('Following Events', () => {
    it('handles user followed', () => {
      const { result } = renderHook(() => useSocialRealTime());

      const userData = {
        user: { id: 'user-456', displayName: 'Jane Doe' }
      };

      act(() => {
        mockEventHandlers.user_followed(userData);
      });

      expect(result.current.socialUpdates.following).toContainEqual(userData.user);
      expect(result.current.realTimeStats.followingCount).toBe(1);
    });

    it('handles user unfollowed', () => {
      const { result } = renderHook(() => useSocialRealTime());

      // Follow first
      act(() => {
        mockEventHandlers.user_followed({
          user: { id: 'user-456', displayName: 'Jane' }
        });
      });

      // Unfollow
      act(() => {
        mockEventHandlers.user_unfollowed({ userId: 'user-456' });
      });

      expect(result.current.socialUpdates.following).toHaveLength(0);
      expect(result.current.realTimeStats.followingCount).toBe(0);
    });
  });

  describe('Friend Request Events', () => {
    it('handles friend request received', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      const requestData = {
        request: {
          id: 'req-123',
          user: { id: 'user-456', displayName: 'Bob' }
        }
      };

      act(() => {
        mockEventHandlers.friend_request_received(requestData);
      });

      expect(result.current.socialUpdates.requests).toContainEqual(requestData.request);
      expect(result.current.realTimeStats.requestsCount).toBe(1);
      expect(mockShowToast).toHaveBeenCalledWith('Friend request from Bob', 'info');
    });

    it('handles friend request accepted', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      // Add request first
      act(() => {
        mockEventHandlers.friend_request_received({
          request: { id: 'req-123', user: { id: 'user-456', displayName: 'Bob' } }
        });
      });

      // Accept request
      act(() => {
        mockEventHandlers.friend_request_accepted({
          requestId: 'req-123',
          user: { id: 'user-456', displayName: 'Bob' }
        });
      });

      expect(result.current.socialUpdates.requests).toHaveLength(0);
      expect(result.current.socialUpdates.friends).toHaveLength(1);
      expect(result.current.realTimeStats.friendsCount).toBe(1);
      expect(mockShowToast).toHaveBeenCalledWith('Bob accepted your friend request', 'success');
    });

    it('handles friend request rejected', () => {
      const { result } = renderHook(() => useSocialRealTime());

      // Add request first
      act(() => {
        mockEventHandlers.friend_request_received({
          request: { id: 'req-123', user: { id: 'user-456' } }
        });
      });

      // Reject request
      act(() => {
        mockEventHandlers.friend_request_rejected({ requestId: 'req-123' });
      });

      expect(result.current.socialUpdates.requests).toHaveLength(0);
      expect(result.current.realTimeStats.requestsCount).toBe(0);
    });

    it('handles friend added', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.friend_added({
          user: { id: 'user-456', displayName: 'Alice' }
        });
      });

      expect(result.current.socialUpdates.friends).toHaveLength(1);
      expect(mockShowToast).toHaveBeenCalledWith("You're now friends with Alice", 'success');
    });

    it('handles friend removed', () => {
      const { result } = renderHook(() => useSocialRealTime());

      // Add friend first
      act(() => {
        mockEventHandlers.friend_added({
          user: { id: 'user-456', displayName: 'Alice' }
        });
      });

      // Remove friend
      act(() => {
        mockEventHandlers.friend_removed({ userId: 'user-456' });
      });

      expect(result.current.socialUpdates.friends).toHaveLength(0);
      expect(result.current.realTimeStats.friendsCount).toBe(0);
    });
  });

  describe('Presence Events', () => {
    it('handles user online', () => {
      const { result } = renderHook(() => useSocialRealTime({ enablePresence: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      act(() => {
        mockEventHandlers.user_online({ userId: 'user-456' });
      });

      expect(result.current.socialUpdates.onlineUsers.has('user-456')).toBe(true);
      expect(result.current.realTimeStats.onlineCount).toBe(1);
    });

    it('handles user offline', () => {
      const { result } = renderHook(() => useSocialRealTime({ enablePresence: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      // User comes online
      act(() => {
        mockEventHandlers.user_online({ userId: 'user-456' });
      });

      // User goes offline
      act(() => {
        mockEventHandlers.user_offline({ userId: 'user-456' });
      });

      expect(result.current.socialUpdates.onlineUsers.has('user-456')).toBe(false);
      expect(result.current.realTimeStats.onlineCount).toBe(0);
    });

    it('does not track presence when disabled', () => {
      renderHook(() => useSocialRealTime({ enablePresence: false }));

      expect(mockEventHandlers.user_online).toBeUndefined();
      expect(mockEventHandlers.user_offline).toBeUndefined();
    });
  });

  describe('Activity Feed Events', () => {
    it('handles social activity', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableActivityFeed: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      const activity = {
        id: 'act-1',
        type: 'post_liked',
        user: { displayName: 'John' }
      };

      act(() => {
        mockEventHandlers.social_activity({ activity });
      });

      expect(result.current.socialUpdates.activities).toContainEqual(activity);
    });

    it('limits activities to 50', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableActivityFeed: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      // Add 55 activities
      act(() => {
        for (let i = 0; i < 55; i++) {
          mockEventHandlers.social_activity({
            activity: { id: `act-${i}` }
          });
        }
      });

      expect(result.current.socialUpdates.activities).toHaveLength(50);
    });
  });

  describe('Notification Events', () => {
    it('handles social notifications', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      const notification = {
        id: 'notif-1',
        message: 'Someone liked your post',
        type: 'info',
        showToast: true
      };

      act(() => {
        mockEventHandlers.social_notification({ notification });
      });

      expect(result.current.socialUpdates.notifications).toContainEqual(notification);
      expect(mockShowToast).toHaveBeenCalledWith('Someone liked your post', 'info');
    });

    it('limits notifications to 100', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      // Add 105 notifications
      act(() => {
        for (let i = 0; i < 105; i++) {
          mockEventHandlers.social_notification({
            notification: { id: `notif-${i}`, showToast: false }
          });
        }
      });

      expect(result.current.socialUpdates.notifications).toHaveLength(100);
    });
  });

  describe('Social Actions', () => {
    it('follows user', async () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      await act(async () => {
        await result.current.followUser('user-456');
      });

      expect(socialWebSocketService.followUser).toHaveBeenCalledWith('user-456');
      expect(socialWebSocketService.trackSocialInteraction).toHaveBeenCalledWith('follow', 'user-456');
    });

    it('unfollows user', async () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      await act(async () => {
        await result.current.unfollowUser('user-456');
      });

      expect(socialWebSocketService.unfollowUser).toHaveBeenCalledWith('user-456');
    });

    it('sends friend request', async () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      await act(async () => {
        await result.current.sendFriendRequest('user-456', 'Hi there!');
      });

      expect(socialWebSocketService.sendFriendRequest).toHaveBeenCalledWith('user-456', 'Hi there!');
    });

    it('accepts friend request', async () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      await act(async () => {
        await result.current.acceptFriendRequest('req-123');
      });

      expect(socialWebSocketService.acceptFriendRequest).toHaveBeenCalledWith('req-123');
    });

    it('rejects friend request', async () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      await act(async () => {
        await result.current.rejectFriendRequest('req-123');
      });

      expect(socialWebSocketService.rejectFriendRequest).toHaveBeenCalledWith('req-123');
    });

    it('throws error when not connected', async () => {
      const { result } = renderHook(() => useSocialRealTime({ autoConnect: false }));

      await expect(
        act(async () => {
          await result.current.followUser('user-456');
        })
      ).rejects.toThrow('Not connected');
    });
  });

  describe('Utility Methods', () => {
    it('checks if user is online', () => {
      const { result } = renderHook(() => useSocialRealTime({ enablePresence: true }));

      act(() => {
        mockEventHandlers.connected();
        mockEventHandlers.user_online({ userId: 'user-456' });
      });

      expect(result.current.isUserOnline('user-456')).toBe(true);
      expect(result.current.isUserOnline('user-789')).toBe(false);
    });

    it('gets recent activities', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableActivityFeed: true }));

      act(() => {
        mockEventHandlers.connected();
      });

      act(() => {
        for (let i = 0; i < 20; i++) {
          mockEventHandlers.social_activity({
            activity: { id: `act-${i}` }
          });
        }
      });

      const recent = result.current.getRecentActivities(5);

      expect(recent).toHaveLength(5);
      expect(recent[0].id).toBe('act-19');
    });

    it('gets unread notifications', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.connected();
        mockEventHandlers.social_notification({
          notification: { id: 'notif-1', read: false, showToast: false }
        });
        mockEventHandlers.social_notification({
          notification: { id: 'notif-2', read: true, showToast: false }
        });
      });

      const unread = result.current.getUnreadNotifications();

      expect(unread).toHaveLength(1);
      expect(unread[0].id).toBe('notif-1');
    });

    it('marks notification as read', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.connected();
        mockEventHandlers.social_notification({
          notification: { id: 'notif-1', read: false, showToast: false }
        });
      });

      act(() => {
        result.current.markNotificationAsRead('notif-1');
      });

      expect(result.current.socialUpdates.notifications[0].read).toBe(true);
    });

    it('clears all notifications', () => {
      const { result } = renderHook(() => useSocialRealTime({ enableNotifications: true }));

      act(() => {
        mockEventHandlers.connected();
        mockEventHandlers.social_notification({
          notification: { id: 'notif-1', showToast: false }
        });
      });

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.socialUpdates.notifications).toHaveLength(0);
    });

    it('updates status', () => {
      const { result } = renderHook(() => useSocialRealTime());

      act(() => {
        mockEventHandlers.connected();
      });

      act(() => {
        result.current.updateStatus('online');
      });

      expect(socialWebSocketService.updateStatus).toHaveBeenCalledWith('online');
    });
  });

  describe('Error Handling', () => {
    it('handles social errors', () => {
      const onError = jest.fn();
      renderHook(() => useSocialRealTime({ enableNotifications: true, onError }));

      act(() => {
        mockEventHandlers.connected();
      });

      const errorData = { message: 'Social action failed' };

      act(() => {
        mockEventHandlers.social_error(errorData);
      });

      expect(mockShowToast).toHaveBeenCalledWith('Social update failed', 'error');
      expect(onError).toHaveBeenCalled();
    });

    it('handles missing auth token', async () => {
      global.localStorage.getItem = jest.fn(() => null);

      const { result } = renderHook(() => useSocialRealTime({ autoConnect: false }));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionError).toBeTruthy();
    });
  });
});
