/**
 * Messages Service
 * API methods for direct messages, conversations, and chat
 */

import { api } from '../../lib/apiClient';

// Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'gif';
  mediaUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Sender info
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };

  // Read receipts
  readBy?: string[];
  deliveredTo?: string[];

  // Reply info
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
      displayName: string;
    };
  };

  // Reactions
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatarUrl?: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;

  // Group chat specific
  admin?: string;
  settings?: {
    allowInvites: boolean;
    allowMediaSharing: boolean;
  };
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'gif';
  mediaUrl?: string;
  replyToId?: string;
  metadata?: any;
}

export interface CreateConversationData {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
  avatarUrl?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}

// Messages Service
export const messagesService = {
  /**
   * Get all conversations
   */
  async getConversations(cursor?: string): Promise<ConversationsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/messages/conversations${queryString ? `?${queryString}` : ''}`;

    return api.get<ConversationsResponse>(url);
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return api.get<Conversation>(`/messages/conversations/${conversationId}`);
  },

  /**
   * Create new conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return api.post<Conversation>('/messages/conversations', data);
  },

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return api.delete<void>(`/messages/conversations/${conversationId}`);
  },

  /**
   * Leave group conversation
   */
  async leaveConversation(conversationId: string): Promise<void> {
    return api.post<void>(`/messages/conversations/${conversationId}/leave`);
  },

  /**
   * Add participants to group conversation
   */
  async addParticipants(conversationId: string, userIds: string[]): Promise<Conversation> {
    return api.post<Conversation>(`/messages/conversations/${conversationId}/participants`, {
      userIds,
    });
  },

  /**
   * Remove participant from group conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<Conversation> {
    return api.delete<Conversation>(`/messages/conversations/${conversationId}/participants/${userId}`);
  },

  /**
   * Update group conversation settings
   */
  async updateConversation(
    conversationId: string,
    data: { name?: string; avatarUrl?: string; settings?: any }
  ): Promise<Conversation> {
    return api.patch<Conversation>(`/messages/conversations/${conversationId}`, data);
  },

  /**
   * Get messages in conversation
   */
  async getMessages(conversationId: string, cursor?: string, limit: number = 50): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `/messages/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;

    return api.get<MessagesResponse>(url);
  },

  /**
   * Send message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    return api.post<Message>(`/messages/conversations/${data.conversationId}/messages`, {
      content: data.content,
      type: data.type || 'text',
      mediaUrl: data.mediaUrl,
      replyToId: data.replyToId,
      metadata: data.metadata,
    });
  },

  /**
   * Delete message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    return api.delete<void>(`/messages/conversations/${conversationId}/messages/${messageId}`);
  },

  /**
   * Edit message
   */
  async editMessage(conversationId: string, messageId: string, content: string): Promise<Message> {
    return api.patch<Message>(`/messages/conversations/${conversationId}/messages/${messageId}`, {
      content,
    });
  },

  /**
   * Mark message as read
   */
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    return api.post<void>(`/messages/conversations/${conversationId}/messages/${messageId}/read`);
  },

  /**
   * Mark conversation as read (all messages)
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    return api.post<void>(`/messages/conversations/${conversationId}/read`);
  },

  /**
   * React to message
   */
  async reactToMessage(conversationId: string, messageId: string, emoji: string): Promise<Message> {
    return api.post<Message>(`/messages/conversations/${conversationId}/messages/${messageId}/reactions`, {
      emoji,
    });
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(conversationId: string, messageId: string, emoji: string): Promise<Message> {
    return api.delete<Message>(`/messages/conversations/${conversationId}/messages/${messageId}/reactions/${emoji}`);
  },

  /**
   * Upload media for message
   */
  async uploadMedia(file: File): Promise<{ url: string; type: string }> {
    return api.upload<{ url: string; type: string }>('/messages/upload', file);
  },

  /**
   * Search messages in conversation
   */
  async searchMessages(conversationId: string, query: string): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    return api.get<MessagesResponse>(`/messages/conversations/${conversationId}/search?${params.toString()}`);
  },

  /**
   * Get shared media in conversation
   */
  async getSharedMedia(
    conversationId: string,
    type?: 'image' | 'video' | 'file',
    cursor?: string
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/messages/conversations/${conversationId}/media${queryString ? `?${queryString}` : ''}`;

    return api.get<MessagesResponse>(url);
  },

  /**
   * Mute conversation
   */
  async muteConversation(conversationId: string, duration?: number): Promise<Conversation> {
    return api.post<Conversation>(`/messages/conversations/${conversationId}/mute`, {
      duration,
    });
  },

  /**
   * Unmute conversation
   */
  async unmuteConversation(conversationId: string): Promise<Conversation> {
    return api.delete<Conversation>(`/messages/conversations/${conversationId}/mute`);
  },

  /**
   * Pin conversation
   */
  async pinConversation(conversationId: string): Promise<Conversation> {
    return api.post<Conversation>(`/messages/conversations/${conversationId}/pin`);
  },

  /**
   * Unpin conversation
   */
  async unpinConversation(conversationId: string): Promise<Conversation> {
    return api.delete<Conversation>(`/messages/conversations/${conversationId}/pin`);
  },

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    return api.post<Conversation>(`/messages/conversations/${conversationId}/archive`);
  },

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(conversationId: string): Promise<Conversation> {
    return api.delete<Conversation>(`/messages/conversations/${conversationId}/archive`);
  },

  /**
   * Get message requests (from non-followed users)
   */
  async getMessageRequests(cursor?: string): Promise<ConversationsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/messages/requests${queryString ? `?${queryString}` : ''}`;

    return api.get<ConversationsResponse>(url);
  },

  /**
   * Accept message request
   */
  async acceptMessageRequest(conversationId: string): Promise<Conversation> {
    return api.post<Conversation>(`/messages/conversations/${conversationId}/accept`);
  },

  /**
   * Decline message request
   */
  async declineMessageRequest(conversationId: string): Promise<void> {
    return api.post<void>(`/messages/conversations/${conversationId}/decline`);
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/messages/unread');
  },

  /**
   * Send typing indicator
   */
  async sendTyping(conversationId: string): Promise<void> {
    return api.post<void>(`/messages/conversations/${conversationId}/typing`);
  },
};

export default messagesService;
