/**
 * Realtime Notification Listener
 * Listens for new notifications via WebSocket and shows toast alerts
 */

import { useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WS_EVENTS } from '../../lib/websocket';
import { Notification } from '../../services/api/notificationsService';
import { toast } from '../../stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';

export const RealtimeNotificationListener = () => {
  const queryClient = useQueryClient();

  // Listen for new notifications
  useWebSocket(
    WS_EVENTS.NOTIFICATION_NEW,
    (data: { notification: Notification }) => {
      const { notification } = data;

      // Play notification sound (optional)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('CRYB.AI', {
          body: getNotificationText(notification),
          icon: notification.actor?.avatarUrl || '/logo.png',
          badge: '/logo.png',
        });
      }

      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });

      // Show toast for important notifications
      const importantTypes = ['follow', 'message', 'mention', 'comment'];
      if (importantTypes.includes(notification.type)) {
        toast.success(getNotificationText(notification));
      }
    },
    []
  );

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null;
};

/**
 * Get human-readable notification text
 */
const getNotificationText = (notification: Notification): string => {
  const actor = notification.actor?.displayName || 'Someone';

  switch (notification.type) {
    case 'like':
      return `${actor} liked your post`;
    case 'comment':
      return `${actor} commented on your post`;
    case 'repost':
      return `${actor} reposted your post`;
    case 'quote':
      return `${actor} quoted your post`;
    case 'follow':
      return `${actor} started following you`;
    case 'mention':
      return `${actor} mentioned you`;
    case 'reply':
      return `${actor} replied to your comment`;
    case 'message':
      return `New message from ${actor}`;
    case 'community_invite':
      return `${actor} invited you to a community`;
    case 'community_join':
      return `${actor} joined your community`;
    case 'community_post':
      return `New post in your community`;
    default:
      return 'You have a new notification';
  }
};

export default RealtimeNotificationListener;
