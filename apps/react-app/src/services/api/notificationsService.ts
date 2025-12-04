/**
 * Notifications Service
 * API methods for notifications and activity feed
 */

import { api } from '../../lib/apiClient';

// Types
export interface Notification {
  id: string;
  type:
    | 'like'
    | 'comment'
    | 'repost'
    | 'quote'
    | 'follow'
    | 'mention'
    | 'reply'
    | 'message'
    | 'community_invite'
    | 'community_join'
    | 'community_post';
  userId: string;
  actorId: string;
  targetId?: string;
  targetType?: 'post' | 'comment' | 'user' | 'community';
  content?: string;
  metadata?: any;
  read: boolean;
  createdAt: string;

  // Actor info
  actor?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };

  // Target info
  target?: {
    id: string;
    type: string;
    content?: string;
    metadata?: any;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  nextCursor?: string;
  hasMore: boolean;
  unreadCount: number;
}

// Notifications Service
export const notificationsService = {
  /**
   * Get notifications for current user
   */
  async getNotifications(cursor?: string, type?: string): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (type) params.append('type', type);

    const queryString = params.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;

    return api.get<NotificationsResponse>(url);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/notifications/unread');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return api.patch<void>(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    return api.post<{ count: number }>('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return api.delete<void>(`/notifications/${notificationId}`);
  },

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<{ count: number }> {
    return api.delete<{ count: number }>('/notifications/clear');
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<{
    email: { [key: string]: boolean };
    push: { [key: string]: boolean };
    inApp: { [key: string]: boolean };
  }> {
    return api.get('/notifications/settings');
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: {
    email?: { [key: string]: boolean };
    push?: { [key: string]: boolean };
    inApp?: { [key: string]: boolean };
  }): Promise<{
    email: { [key: string]: boolean };
    push: { [key: string]: boolean };
    inApp: { [key: string]: boolean };
  }> {
    return api.patch('/notifications/settings', settings);
  },

  /**
   * Register push notification token
   */
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/notifications/push/register', {
      token,
      platform,
    });
  },

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(token: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/notifications/push/unregister', {
      token,
    });
  },
};

export default notificationsService;
