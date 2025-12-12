/**
 * React Hook for Message Management
 * Provides state management and API integration for real-time messaging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import channelService from '../services/channelService';
import websocketService from '../services/websocketService';
import { getErrorMessage } from '../utils/errorUtils';

export const useMessages = (channelId = null) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const lastMessageRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadingRef = useRef(false);

  // Load messages for a channel
  const loadMessages = useCallback(async (targetChannelId = null, options = {}) => {
    const channelIdToUse = targetChannelId || channelId;
    if (!channelIdToUse || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const result = await channelService.getMessages(channelIdToUse, {
        limit: options.limit || 50,
        before: options.before,
        after: options.after,
        around: options.around
      });
      
      if (result.success) {
        const newMessages = result.messages || [];
        
        if (options.append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else if (options.prepend) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        
        setHasMore(result.pagination?.hasMore !== false);
        
        if (newMessages.length > 0) {
          lastMessageRef.current = newMessages[newMessages.length - 1].id;
        }
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [channelId]);

  // Load older messages (for infinite scroll)
  const loadOlderMessages = useCallback(async () => {
    if (!channelId || !hasMore || loading || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    await loadMessages(channelId, {
      before: oldestMessage.id,
      prepend: true,
      limit: 25
    });
  }, [channelId, hasMore, loading, messages, loadMessages]);

  // Send a message
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!channelId || !content.trim()) return null;

    try {
      const result = await channelService.sendMessage(channelId, content, options);
      
      if (result.success) {
        // The message will be added via WebSocket event
        return result.message;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [channelId]);

  // Send a message with files
  const sendMessageWithFiles = useCallback(async (content, files, options = {}) => {
    if (!channelId) return null;

    try {
      const result = await channelService.sendMessage(channelId, content, {
        ...options,
        files: files
      });
      
      if (result.success) {
        return result.message;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to send message with files:', error);
      throw error;
    }
  }, [channelId]);

  // Update a message
  const updateMessage = useCallback(async (messageId, newContent) => {
    if (!channelId || !messageId || !newContent.trim()) return null;

    try {
      const result = await channelService.updateMessage(channelId, messageId, newContent);
      
      if (result.success) {
        setMessages(prev => 
          prev.map(m => m.id === messageId ? result.message : m)
        );
        return result.message;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to update message:', error);
      throw error;
    }
  }, [channelId]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    if (!channelId || !messageId) return false;

    try {
      const result = await channelService.deleteMessage(channelId, messageId);
      
      if (result.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [channelId]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId, emoji) => {
    if (!channelId || !messageId || !emoji) return null;

    try {
      const result = await channelService.addReaction(channelId, messageId, emoji);
      
      if (result.success) {
        setMessages(prev => 
          prev.map(m => {
            if (m.id === messageId) {
              const reactions = m.reactions || {};
              const reaction = reactions[emoji] || { count: 0, users: [] };
              
              return {
                ...m,
                reactions: {
                  ...reactions,
                  [emoji]: {
                    count: reaction.count + 1,
                    users: [...reaction.users, 'current-user'] // Should be actual user ID
                  }
                }
              };
            }
            return m;
          })
        );
        return result.reaction;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }, [channelId]);

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId, emoji) => {
    if (!channelId || !messageId || !emoji) return false;

    try {
      const result = await channelService.removeReaction(channelId, messageId, emoji);
      
      if (result.success) {
        setMessages(prev => 
          prev.map(m => {
            if (m.id === messageId) {
              const reactions = m.reactions || {};
              const reaction = reactions[emoji];
              
              if (reaction) {
                const newCount = Math.max(reaction.count - 1, 0);
                const newUsers = reaction.users.filter(u => u !== 'current-user');
                
                return {
                  ...m,
                  reactions: {
                    ...reactions,
                    [emoji]: newCount > 0 ? {
                      count: newCount,
                      users: newUsers
                    } : undefined
                  }
                };
              }
            }
            return m;
          })
        );
        return true;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }, [channelId]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!channelId) return;

    websocketService.startTyping(channelId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [channelId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!channelId) return;

    websocketService.stopTyping(channelId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [channelId]);

  // Search messages in channel
  const searchMessages = useCallback(async (query, options = {}) => {
    if (!channelId || !query.trim()) return { messages: [], total: 0 };

    try {
      const result = await channelService.searchMessages(channelId, query, options);
      
      if (result.success) {
        return {
          messages: result.messages || [],
          total: result.total || 0
        };
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  }, [channelId]);

  // Get pinned messages
  const getPinnedMessages = useCallback(async () => {
    if (!channelId) return [];

    try {
      const result = await channelService.getPinnedMessages(channelId);
      
      if (result.success) {
        return result.messages || [];
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to get pinned messages:', error);
      throw error;
    }
  }, [channelId]);

  // Pin/unpin message
  const togglePin = useCallback(async (messageId, pin = true) => {
    if (!channelId || !messageId) return false;

    try {
      const result = pin 
        ? await channelService.pinMessage(channelId, messageId)
        : await channelService.unpinMessage(channelId, messageId);
      
      if (result.success) {
        setMessages(prev => 
          prev.map(m => m.id === messageId ? { ...m, pinned: pin } : m)
        );
        return true;
      } else {
        throw new Error(getErrorMessage(result.error, 'Operation failed'));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      throw error;
    }
  }, [channelId]);

  // Clear messages when channel changes
  useEffect(() => {
    if (channelId) {
      setMessages([]);
      setHasMore(true);
      setTypingUsers([]);
      loadMessages();
    } else {
      setMessages([]);
      setHasMore(true);
      setTypingUsers([]);
    }
  }, [channelId, loadMessages]);

  // WebSocket event listeners
  useEffect(() => {
    const handleMessageReceived = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.find(m => m.id === data.id);
          return exists ? prev : [...prev, data];
        });
      }
    };

    const handleMessageUpdated = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev => 
          prev.map(m => m.id === data.id ? { ...m, ...data } : m)
        );
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    };

    const handleTypingStart = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          return exists ? prev : [...prev, data];
        });
      }
    };

    const handleTypingStop = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    };

    // Register WebSocket event listeners
    websocketService.on('message:received', handleMessageReceived);
    websocketService.on('message:updated', handleMessageUpdated);
    websocketService.on('message:deleted', handleMessageDeleted);
    websocketService.on('typing:start', handleTypingStart);
    websocketService.on('typing:stop', handleTypingStop);

    // Cleanup
    return () => {
      websocketService.off('message:received', handleMessageReceived);
      websocketService.off('message:updated', handleMessageUpdated);
      websocketService.off('message:deleted', handleMessageDeleted);
      websocketService.off('typing:start', handleTypingStart);
      websocketService.off('typing:stop', handleTypingStop);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId]);

  return {
    // State
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    
    // Actions
    loadMessages,
    loadOlderMessages,
    sendMessage,
    sendMessageWithFiles,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    searchMessages,
    getPinnedMessages,
    togglePin,
    
    // Utilities
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1] || null
  };
};

export default useMessages;