/**
 * useNotifications Hooks
 * React Query hooks for notifications API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tantml:invoke>
<invoke name="@tanstack/react-query';
import { notificationsService, Notification } from '../../services/api/notificationsService';
import { toast } from '../../stores/uiStore';

/**
 * Get notifications (infinite scroll)
 */
export const useNotificationsQuery = (type?: string) => {
  return useInfiniteQuery({
    queryKey: ['notifications', type],
    queryFn: ({ pageParam }) => notificationsService.getNotifications(pageParam, type),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30 * 1000, // 30 seconds - notifications need fresh data
    refetchInterval: 60 * 1000, // Poll every minute
  });
};

/**
 * Get unread notification count
 */
export const useUnreadNotificationsCountQuery = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
};

/**
 * Get notification settings
 */
export const useNotificationSettingsQuery = () => {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationsService.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mark notification as read mutation
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Mark all notifications as read mutation
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to mark all as read');
    },
  });
};

/**
 * Delete notification mutation
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete notification');
    },
  });
};

/**
 * Clear all notifications mutation
 */
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('All notifications cleared');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to clear notifications');
    },
  });
};

/**
 * Update notification settings mutation
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: any) => notificationsService.updateSettings(settings),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['notifications', 'settings'], updatedSettings);

      toast.success('Notification settings updated');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update settings');
    },
  });
};

/**
 * Register push notification token mutation
 */
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: ({ token, platform }: { token: string; platform: 'ios' | 'android' | 'web' }) =>
      notificationsService.registerPushToken(token, platform),
    onSuccess: () => {
      toast.success('Push notifications enabled');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to enable push notifications');
    },
  });
};

/**
 * Unregister push notification token mutation
 */
export const useUnregisterPushToken = () => {
  return useMutation({
    mutationFn: (token: string) => notificationsService.unregisterPushToken(token),
    onSuccess: () => {
      toast.success('Push notifications disabled');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to disable push notifications');
    },
  });
};

export default {
  useNotificationsQuery,
  useUnreadNotificationsCountQuery,
  useNotificationSettingsQuery,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications,
  useUpdateNotificationSettings,
  useRegisterPushToken,
  useUnregisterPushToken,
};
