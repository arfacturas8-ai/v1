/**
 * Real-time Event Handlers
 * WebSocket event handlers that update React Query cache
 */

import { QueryClient } from '@tanstack/react-query';
import { websocket, WS_EVENTS } from './websocket';
import { Post } from '../services/api/postsService';
import { Message, Conversation } from '../services/api/messagesService';
import { Notification } from '../services/api/notificationsService';
import { toast } from '../stores/uiStore';

/**
 * Setup all real-time event handlers
 */
export const setupRealtimeHandlers = (queryClient: QueryClient) => {
  // ==================== POST EVENTS ====================

  /**
   * New post created (for feed updates)
   */
  websocket.on(WS_EVENTS.POST_CREATED, (data: { post: Post }) => {
    // Invalidate feed queries to show new post
    queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
    queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
  });

  /**
   * Post liked/unliked
   */
  websocket.on(WS_EVENTS.POST_LIKED, (data: { postId: string; userId: string; likesCount: number }) => {
    // Update post cache with new like count
    const postKey = ['posts', 'detail', data.postId];
    const currentPost = queryClient.getQueryData<Post>(postKey);

    if (currentPost) {
      queryClient.setQueryData<Post>(postKey, {
        ...currentPost,
        stats: {
          ...currentPost.stats!,
          likes: data.likesCount,
        },
      });
    }
  });

  /**
   * New comment on post
   */
  websocket.on(WS_EVENTS.POST_COMMENTED, (data: { postId: string; comment: any; commentsCount: number }) => {
    // Update post comment count
    const postKey = ['posts', 'detail', data.postId];
    const currentPost = queryClient.getQueryData<Post>(postKey);

    if (currentPost) {
      queryClient.setQueryData<Post>(postKey, {
        ...currentPost,
        stats: {
          ...currentPost.stats!,
          comments: data.commentsCount,
        },
      });
    }

    // Invalidate comments list
    queryClient.invalidateQueries({ queryKey: ['posts', data.postId, 'comments'] });
  });

  // ==================== MESSAGE EVENTS ====================

  /**
   * New message received
   */
  websocket.on(WS_EVENTS.NEW_MESSAGE, (data: { message: Message }) => {
    const { message } = data;

    // Invalidate messages for this conversation
    queryClient.invalidateQueries({
      queryKey: ['messages', 'conversations', message.conversationId, 'messages'],
    });

    // Update conversation last message
    queryClient.invalidateQueries({
      queryKey: ['messages', 'conversations', message.conversationId],
    });

    // Update conversations list
    queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });

    // Show toast notification if not in conversation
    const currentPath = window.location.pathname;
    if (!currentPath.includes(`/messages/${message.conversationId}`)) {
      toast.success(`New message from ${message.sender?.displayName || 'someone'}`);
    }
  });

  /**
   * Message deleted
   */
  websocket.on(WS_EVENTS.MESSAGE_DELETED, (data: { conversationId: string; messageId: string }) => {
    queryClient.invalidateQueries({
      queryKey: ['messages', 'conversations', data.conversationId, 'messages'],
    });
  });

  /**
   * Message edited
   */
  websocket.on(WS_EVENTS.MESSAGE_EDITED, (data: { message: Message }) => {
    queryClient.invalidateQueries({
      queryKey: ['messages', 'conversations', data.message.conversationId, 'messages'],
    });
  });

  /**
   * Message read
   */
  websocket.on(WS_EVENTS.MESSAGE_READ, (data: { conversationId: string; messageId: string; userId: string }) => {
    // Update message read status
    queryClient.invalidateQueries({
      queryKey: ['messages', 'conversations', data.conversationId, 'messages'],
    });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
  });

  /**
   * Typing indicator start
   */
  websocket.on(WS_EVENTS.TYPING_START, (data: { conversationId: string; userId: string; user: any }) => {
    // Store typing state in cache (temporary data)
    const typingKey = ['messages', 'typing', data.conversationId];
    const currentTyping = queryClient.getQueryData<string[]>(typingKey) || [];

    if (!currentTyping.includes(data.userId)) {
      queryClient.setQueryData<string[]>(typingKey, [...currentTyping, data.userId]);
    }

    // Auto-clear after 3 seconds
    setTimeout(() => {
      const typing = queryClient.getQueryData<string[]>(typingKey) || [];
      queryClient.setQueryData<string[]>(
        typingKey,
        typing.filter((id) => id !== data.userId)
      );
    }, 3000);
  });

  /**
   * Typing indicator stop
   */
  websocket.on(WS_EVENTS.TYPING_STOP, (data: { conversationId: string; userId: string }) => {
    const typingKey = ['messages', 'typing', data.conversationId];
    const currentTyping = queryClient.getQueryData<string[]>(typingKey) || [];

    queryClient.setQueryData<string[]>(
      typingKey,
      currentTyping.filter((id) => id !== data.userId)
    );
  });

  // ==================== USER EVENTS ====================

  /**
   * User online
   */
  websocket.on(WS_EVENTS.USER_ONLINE, (data: { userId: string }) => {
    // Update user online status in cache
    const onlineKey = ['users', 'online'];
    const currentOnline = queryClient.getQueryData<Set<string>>(onlineKey) || new Set();
    currentOnline.add(data.userId);
    queryClient.setQueryData(onlineKey, currentOnline);
  });

  /**
   * User offline
   */
  websocket.on(WS_EVENTS.USER_OFFLINE, (data: { userId: string }) => {
    // Update user online status in cache
    const onlineKey = ['users', 'online'];
    const currentOnline = queryClient.getQueryData<Set<string>>(onlineKey) || new Set();
    currentOnline.delete(data.userId);
    queryClient.setQueryData(onlineKey, currentOnline);
  });

  /**
   * User started following you
   */
  websocket.on(WS_EVENTS.USER_FOLLOWED, (data: { userId: string; user: any }) => {
    // Invalidate followers list
    queryClient.invalidateQueries({ queryKey: ['users', 'me', 'followers'] });

    // Show notification
    toast.success(`${data.user.displayName} started following you!`);
  });

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * New notification
   */
  websocket.on(WS_EVENTS.NOTIFICATION_NEW, (data: { notification: Notification }) => {
    // Invalidate notifications
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });

    // Show toast for important notifications
    const importantTypes = ['follow', 'message', 'mention'];
    if (importantTypes.includes(data.notification.type)) {
      toast.success(getNotificationMessage(data.notification));
    }
  });

  // ==================== COMMUNITY EVENTS ====================

  /**
   * New member joined community
   */
  websocket.on(WS_EVENTS.COMMUNITY_MEMBER_JOINED, (data: { communityId: string; userId: string; user: any }) => {
    // Invalidate members list
    queryClient.invalidateQueries({ queryKey: ['communities', data.communityId, 'members'] });

    // Update member count
    queryClient.invalidateQueries({ queryKey: ['communities', data.communityId] });
  });

  /**
   * Member left community
   */
  websocket.on(WS_EVENTS.COMMUNITY_MEMBER_LEFT, (data: { communityId: string; userId: string }) => {
    // Invalidate members list
    queryClient.invalidateQueries({ queryKey: ['communities', data.communityId, 'members'] });

    // Update member count
    queryClient.invalidateQueries({ queryKey: ['communities', data.communityId] });
  });

  /**
   * New post in community
   */
  websocket.on(WS_EVENTS.COMMUNITY_POST_CREATED, (data: { communityId: string; post: Post }) => {
    // Invalidate community posts
    queryClient.invalidateQueries({ queryKey: ['communities', data.communityId, 'posts'] });
  });

  // ==================== CONNECTION EVENTS ====================

  /**
   * WebSocket connected
   */
  websocket.on(WS_EVENTS.CONNECTED, () => {
    console.log('✅ WebSocket connected');
    toast.success('Connected to real-time updates');
  });

  /**
   * WebSocket disconnected
   */
  websocket.on(WS_EVENTS.DISCONNECTED, () => {
    console.log('❌ WebSocket disconnected');
    toast.error('Disconnected from real-time updates');
  });

  /**
   * WebSocket reconnected
   */
  websocket.on(WS_EVENTS.RECONNECTED, () => {
    console.log('🔄 WebSocket reconnected');
    toast.success('Reconnected to real-time updates');

    // Refetch critical data after reconnection
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
  });
};

/**
 * Cleanup real-time event handlers
 */
export const cleanupRealtimeHandlers = () => {
  // Remove all event listeners
  websocket.removeAllListeners();
};

/**
 * Helper: Get notification message for toast
 */
const getNotificationMessage = (notification: Notification): string => {
  const actor = notification.actor?.displayName || 'Someone';

  switch (notification.type) {
    case 'like':
      return `${actor} liked your post`;
    case 'comment':
      return `${actor} commented on your post`;
    case 'repost':
      return `${actor} reposted your post`;
    case 'follow':
      return `${actor} started following you`;
    case 'mention':
      return `${actor} mentioned you`;
    case 'message':
      return `New message from ${actor}`;
    default:
      return 'New notification';
  }
};

export default setupRealtimeHandlers;
