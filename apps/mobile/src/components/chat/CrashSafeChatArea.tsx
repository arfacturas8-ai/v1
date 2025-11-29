/**
 * CRASH-SAFE CHAT AREA
 * Discord-like chat interface with comprehensive error handling
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { CrashSafeMessageItem } from './CrashSafeMessageItem';
import { CrashSafeMessageInput } from './CrashSafeMessageInput';
import { CrashSafeTypingIndicator } from './CrashSafeTypingIndicator';
import { ErrorBoundary, useErrorHandler } from '../ErrorBoundary';
import { CrashDetector } from '../../utils/CrashDetector';
import { useSocketStore } from '../../stores/socketStore';
import { useAuthStore } from '../../stores/authStore';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { height } = Dimensions.get('window');

export interface Message {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  channelId: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: string;
  type: 'text' | 'image' | 'file' | 'system';
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface CrashSafeChatAreaProps {
  channelId: string;
  serverId?: string;
}

const MESSAGES_PER_PAGE = 50;
const MESSAGE_HEIGHT_ESTIMATE = 80;

export const CrashSafeChatArea: React.FC<CrashSafeChatAreaProps> = ({
  channelId,
  serverId,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const queryClient = useQueryClient();
  const { socket, isConnected, sendMessage } = useSocketStore();
  const { user } = useAuthStore();
  const handleError = useErrorHandler();

  // Fetch messages with infinite scrolling
  const {
    data: messagesData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    initialPageParam: null,
    queryFn: async ({ pageParam = null }) => {
      try {
        const url = new URL(`http://localhost:3002/api/channels/${channelId}/messages`);
        if (pageParam) url.searchParams.set('before', pageParam);
        url.searchParams.set('limit', MESSAGES_PER_PAGE.toString());

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          messages: data.messages || [],
          hasMore: data.hasMore || false,
          nextCursor: data.nextCursor,
        };
      } catch (error) {
        await CrashDetector.reportNetworkError(error, `FETCH_MESSAGES_${channelId}`);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Retry network errors but not authentication errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Flatten messages from all pages
  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    
    try {
      return messagesData.pages
        .flatMap(page => page.messages)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }, [messagesData, handleError]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      try {
        if (message.channelId === channelId) {
          queryClient.setQueryData(['messages', channelId], (oldData: any) => {
            if (!oldData) return oldData;
            
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
              const lastPage = { ...newPages[newPages.length - 1] };
              lastPage.messages = [...lastPage.messages, message];
              newPages[newPages.length - 1] = lastPage;
            }
            
            return { ...oldData, pages: newPages };
          });

          // Update unread count if not at bottom
          if (!isAtBottom && message.authorId !== user?.id) {
            setNewMessageCount(prev => prev + 1);
          } else {
            // Auto-scroll to bottom if at bottom or if it's our message
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleMessageUpdate = (updatedMessage: Message) => {
      try {
        if (updatedMessage.channelId === channelId) {
          queryClient.setQueryData(['messages', channelId], (oldData: any) => {
            if (!oldData) return oldData;
            
            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              messages: page.messages.map((msg: Message) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ),
            }));
            
            return { ...oldData, pages: newPages };
          });
        }
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleMessageDelete = (messageId: string) => {
      try {
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          
          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            messages: page.messages.filter((msg: Message) => msg.id !== messageId),
          }));
          
          return { ...oldData, pages: newPages };
        });
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleTypingStart = (data: { userId: string; username: string; channelId: string }) => {
      try {
        if (data.channelId === channelId && data.userId !== user?.id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        }
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleTypingStop = (data: { userId: string; username: string; channelId: string }) => {
      try {
        if (data.channelId === channelId) {
          setTypingUsers(prev => prev.filter(username => username !== data.username));
        }
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // Register socket listeners
    socket.on('message:new', handleNewMessage);
    socket.on('message:update', handleMessageUpdate);
    socket.on('message:delete', handleMessageDelete);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:update', handleMessageUpdate);
      socket.off('message:delete', handleMessageDelete);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, isConnected, channelId, queryClient, user?.id, isAtBottom, handleError]);

  // Handle scroll events
  const handleScroll = useCallback((event: any) => {
    try {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
      
      setIsAtBottom(isNearBottom);
      
      if (isNearBottom && newMessageCount > 0) {
        setNewMessageCount(0);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [newMessageCount, handleError]);

  // Handle end reached (load more messages)
  const handleEndReached = useCallback(() => {
    try {
      if (hasNextPage && !isFetchingNextPage && !isLoading) {
        fetchNextPage();
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, handleError]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
      setNewMessageCount(0);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setRefreshing(false);
    }
  }, [refetch, handleError]);

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      if (!content.trim() && !attachments?.length) return false;

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        content: content.trim(),
        authorId: user?.id || '',
        author: {
          id: user?.id || '',
          username: user?.username || 'Unknown',
          avatar: user?.avatarUrl,
        },
        channelId,
        createdAt: new Date().toISOString(),
        type: 'text',
        attachments: attachments?.map((file, index) => ({
          id: `temp-attachment-${index}`,
          url: '',
          filename: file.name,
          size: file.size,
          contentType: file.type,
        })),
      };

      // Optimistically add message
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          const lastPage = { ...newPages[newPages.length - 1] };
          lastPage.messages = [...lastPage.messages, tempMessage];
          newPages[newPages.length - 1] = lastPage;
        }
        
        return { ...oldData, pages: newPages };
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send via socket
      const success = await sendMessage('message:send', {
        channelId,
        content: content.trim(),
        attachments: attachments ? await Promise.all(
          attachments.map(async (file) => {
            // Handle file upload here
            return {
              filename: file.name,
              size: file.size,
              contentType: file.type,
              data: file, // This would be processed by the backend
            };
          })
        ) : undefined,
      });

      if (!success) {
        // Remove optimistic message on failure
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          
          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            messages: page.messages.filter((msg: Message) => msg.id !== tempId),
          }));
          
          return { ...oldData, pages: newPages };
        });

        Alert.alert('Error', 'Failed to send message. Please try again.');
        return false;
      }

      return true;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'An unexpected error occurred while sending the message.');
      return false;
    }
  }, [channelId, user, sendMessage, queryClient, handleError]);

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    try {
      const previousMessage = index > 0 ? allMessages[index - 1] : null;
      const isGrouped = previousMessage?.authorId === item.authorId &&
                       new Date(item.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 5 * 60 * 1000;

      return (
        <CrashSafeMessageItem
          message={item}
          isGrouped={isGrouped}
          onReact={(emoji) => {
            // Handle reaction
            sendMessage('message:react', {
              messageId: item.id,
              emoji,
            });
          }}
          onReply={() => {
            // Handle reply
          }}
          onEdit={(newContent) => {
            if (item.authorId === user?.id) {
              sendMessage('message:edit', {
                messageId: item.id,
                content: newContent,
              });
            }
          }}
          onDelete={() => {
            if (item.authorId === user?.id) {
              Alert.alert(
                'Delete Message',
                'Are you sure you want to delete this message?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      sendMessage('message:delete', {
                        messageId: item.id,
                      });
                    },
                  },
                ]
              );
            }
          }}
          canEdit={item.authorId === user?.id}
          canDelete={item.authorId === user?.id}
        />
      );
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, [allMessages, user?.id, sendMessage, handleError]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a9eff" />
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to load messages: {error?.message}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.chatContainer}>
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4a9eff"
              colors={['#4a9eff']}
            />
          }
          ListHeaderComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#4a9eff" />
              </View>
            ) : null
          }
          getItemLayout={(data, index) => ({
            length: MESSAGE_HEIGHT_ESTIMATE,
            offset: MESSAGE_HEIGHT_ESTIMATE * index,
            index,
          })}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />

        {/* New Messages Indicator */}
        {newMessageCount > 0 && (
          <TouchableOpacity
            style={styles.newMessagesIndicator}
            onPress={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
              setNewMessageCount(0);
            }}
          >
            <Text style={styles.newMessagesText}>
              {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <CrashSafeTypingIndicator users={typingUsers} />
        )}

        {/* Message Input */}
        <CrashSafeMessageInput
          channelId={channelId}
          onSendMessage={handleSendMessage}
          onTypingStart={() => {
            if (user) {
              sendMessage('typing:start', {
                channelId,
                userId: user.id,
                username: user.username,
              });
            }
          }}
          onTypingStop={() => {
            if (user) {
              sendMessage('typing:stop', {
                channelId,
                userId: user.id,
                username: user.username,
              });
            }
          }}
          disabled={!isConnected}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: spacing.xl,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: typography.body1,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  loadingMore: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  newMessagesIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4a9eff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  newMessagesText: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: '600',
  },
});

// Export with error boundary
export default function SafeChatArea(props: CrashSafeChatAreaProps) {
  return (
    <ErrorBoundary>
      <CrashSafeChatArea {...props} />
    </ErrorBoundary>
  );
}