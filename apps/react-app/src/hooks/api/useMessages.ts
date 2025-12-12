/**
 * useMessages Hooks
 * React Query hooks for messages API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  messagesService,
  Message,
  Conversation,
  SendMessageData,
  CreateConversationData,
} from '../../services/api/messagesService';
import { toast } from '../../stores/uiStore';
import { getErrorMessage } from '../../utils/errorUtils';

/**
 * Get all conversations (infinite scroll)
 */
export const useConversationsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: ({ pageParam }) => messagesService.getConversations(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30 * 1000, // 30 seconds - messages need fresher data
  });
};

/**
 * Get conversation by ID
 */
export const useConversationQuery = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', 'conversations', conversationId],
    queryFn: () => messagesService.getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
};

/**
 * Get messages in conversation (infinite scroll, reversed for chat)
 */
export const useMessagesQuery = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: ['messages', 'conversations', conversationId, 'messages'],
    queryFn: ({ pageParam }) => messagesService.getMessages(conversationId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

/**
 * Get message requests
 */
export const useMessageRequestsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['messages', 'requests'],
    queryFn: ({ pageParam }) => messagesService.getMessageRequests(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Get unread message count
 */
export const useUnreadCountQuery = () => {
  return useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: () => messagesService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
};

/**
 * Get shared media in conversation
 */
export const useSharedMediaQuery = (conversationId: string, type?: 'image' | 'video' | 'file') => {
  return useInfiniteQuery({
    queryKey: ['messages', 'conversations', conversationId, 'media', type],
    queryFn: ({ pageParam }) => messagesService.getSharedMedia(conversationId, type, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search messages in conversation
 */
export const useSearchMessagesQuery = (conversationId: string, query: string) => {
  return useQuery({
    queryKey: ['messages', 'conversations', conversationId, 'search', query],
    queryFn: () => messagesService.searchMessages(conversationId, query),
    enabled: !!conversationId && query.length > 0,
    staleTime: 60 * 1000,
  });
};

/**
 * Create conversation mutation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationData) => messagesService.createConversation(data),
    onSuccess: (newConversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

      toast.success('Conversation created!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create conversation'));
    },
  });
};

/**
 * Send message mutation
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => messagesService.sendMessage(data),
    onMutate: async (newMessage) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['messages', 'conversations', newMessage.conversationId, 'messages'],
      });

      // Optimistic update: Add message to cache immediately
      const previousMessages = queryClient.getQueryData([
        'messages',
        'conversations',
        newMessage.conversationId,
        'messages',
      ]);

      // We can add optimistic message here if needed
      // For now, let it refetch

      return { previousMessages };
    },
    onSuccess: (message, data) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', data.conversationId, 'messages'],
      });

      // Update conversation last message
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', data.conversationId],
      });

      // Update conversations list (for last message preview)
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
    onError: (error: any, data, context) => {
      toast.error(getErrorMessage(error, 'Failed to send message'));
    },
  });
};

/**
 * Delete message mutation
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      messagesService.deleteMessage(conversationId, messageId),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', conversationId, 'messages'],
      });

      toast.success('Message deleted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete message'));
    },
  });
};

/**
 * Edit message mutation
 */
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, messageId, content }: { conversationId: string; messageId: string; content: string }) =>
      messagesService.editMessage(conversationId, messageId, content),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', conversationId, 'messages'],
      });

      toast.success('Message edited');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to edit message'));
    },
  });
};

/**
 * Mark conversation as read mutation
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.markConversationAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });

      // Update conversation
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });

      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
};

/**
 * React to message mutation
 */
export const useReactToMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, messageId, emoji }: { conversationId: string; messageId: string; emoji: string }) =>
      messagesService.reactToMessage(conversationId, messageId, emoji),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', conversationId, 'messages'],
      });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to add reaction'));
    },
  });
};

/**
 * Remove reaction mutation
 */
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, messageId, emoji }: { conversationId: string; messageId: string; emoji: string }) =>
      messagesService.removeReaction(conversationId, messageId, emoji),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations', conversationId, 'messages'],
      });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to remove reaction'));
    },
  });
};

/**
 * Delete conversation mutation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.removeQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete conversation'));
    },
  });
};

/**
 * Leave group conversation mutation
 */
export const useLeaveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.leaveConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.removeQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Left conversation');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to leave conversation'));
    },
  });
};

/**
 * Add participants mutation
 */
export const useAddParticipants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userIds }: { conversationId: string; userIds: string[] }) =>
      messagesService.addParticipants(conversationId, userIds),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Participants added');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to add participants'));
    },
  });
};

/**
 * Remove participant mutation
 */
export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      messagesService.removeParticipant(conversationId, userId),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Participant removed');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to remove participant'));
    },
  });
};

/**
 * Update conversation mutation
 */
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: any }) =>
      messagesService.updateConversation(conversationId, data),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

      toast.success('Conversation updated');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update conversation'));
    },
  });
};

/**
 * Mute conversation mutation
 */
export const useMuteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, duration }: { conversationId: string; duration?: number }) =>
      messagesService.muteConversation(conversationId, duration),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Conversation muted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to mute conversation'));
    },
  });
};

/**
 * Unmute conversation mutation
 */
export const useUnmuteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.unmuteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', conversationId] });

      toast.success('Conversation unmuted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to unmute conversation'));
    },
  });
};

/**
 * Pin conversation mutation
 */
export const usePinConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.pinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

      toast.success('Conversation pinned');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to pin conversation'));
    },
  });
};

/**
 * Unpin conversation mutation
 */
export const useUnpinConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.unpinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

      toast.success('Conversation unpinned');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to unpin conversation'));
    },
  });
};

/**
 * Accept message request mutation
 */
export const useAcceptMessageRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.acceptMessageRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });

      toast.success('Request accepted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to accept request'));
    },
  });
};

/**
 * Decline message request mutation
 */
export const useDeclineMessageRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.declineMessageRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'requests'] });

      toast.success('Request declined');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to decline request'));
    },
  });
};

/**
 * Upload media mutation
 */
export const useUploadMessageMedia = () => {
  return useMutation({
    mutationFn: (file: File) => messagesService.uploadMedia(file),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to upload media'));
    },
  });
};

export default {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useMessageRequestsQuery,
  useUnreadCountQuery,
  useSharedMediaQuery,
  useSearchMessagesQuery,
  useCreateConversation,
  useSendMessage,
  useDeleteMessage,
  useEditMessage,
  useMarkAsRead,
  useReactToMessage,
  useRemoveReaction,
  useDeleteConversation,
  useLeaveConversation,
  useAddParticipants,
  useRemoveParticipant,
  useUpdateConversation,
  useMuteConversation,
  useUnmuteConversation,
  usePinConversation,
  useUnpinConversation,
  useAcceptMessageRequest,
  useDeclineMessageRequest,
  useUploadMessageMedia,
};
