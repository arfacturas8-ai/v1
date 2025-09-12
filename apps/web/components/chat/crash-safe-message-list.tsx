"use client";

import * as React from "react";
import { ChevronDown, AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Message, DirectMessage } from "@/lib/types";
import { CrashSafeMessageItem } from "./crash-safe-message-item";
import { MessageDivider } from "./message-divider";
import { MessageListErrorBoundary } from "@/components/error-boundaries/chat-error-boundary";
import { useCrashSafeVirtualScroll } from "@/lib/hooks/use-crash-safe-virtual-scroll";
import { useCrashSafeSocket } from "@/lib/crash-safe-socket";

interface CrashSafeMessageListProps {
  messages: (Message | DirectMessage)[];
  channelId?: string;
  dmUserId?: string;
  isDirectMessage: boolean;
  height?: number;
}

interface VirtualizedMessage {
  id: string;
  type: 'message' | 'divider';
  data: any;
  height?: number;
}

// Connection status indicator
const ConnectionStatus: React.FC<{ connectionState: any }> = ({ connectionState }) => {
  if (connectionState.status === 'connected') {
    return null; // Don't show anything when connected
  }

  const getStatusInfo = () => {
    switch (connectionState.status) {
      case 'connecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: 'Connecting...',
          bgColor: 'bg-yellow-900/20 border-yellow-600',
          textColor: 'text-yellow-200',
        };
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: `Reconnecting... (${connectionState.reconnectAttempts} attempts)`,
          bgColor: 'bg-orange-900/20 border-orange-600',
          textColor: 'text-orange-200',
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Disconnected from server',
          bgColor: 'bg-red-900/20 border-red-600',
          textColor: 'text-red-200',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Connection error',
          bgColor: 'bg-red-900/20 border-red-600',
          textColor: 'text-red-200',
        };
      default:
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Unknown connection state',
          bgColor: 'bg-gray-600/20 border-gray-500',
          textColor: 'text-gray-300',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 mx-4 mb-2 rounded border",
      statusInfo.bgColor,
      statusInfo.textColor
    )}>
      {statusInfo.icon}
      <span className="text-sm">{statusInfo.text}</span>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ isDirectMessage: boolean }> = ({ isDirectMessage }) => (
  <div className="flex-1 flex items-center justify-center text-gray-400">
    <div className="text-center">
      <div className="text-4xl mb-4">💬</div>
      <p className="text-lg font-medium mb-1">
        {isDirectMessage ? "This is the beginning of your conversation" : "No messages yet"}
      </p>
      <p className="text-sm">
        {isDirectMessage 
          ? "Send a message to get started!" 
          : "Be the first to send a message in this channel!"}
      </p>
    </div>
  </div>
);

// Error state component
const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8">
    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold mb-2 text-gray-200">Failed to load messages</h3>
    <p className="text-sm mb-4 text-center max-w-md">
      There was an error loading the message list. This might be due to a network issue or server problem.
    </p>
    <Button onClick={onRetry} variant="outline" className="mb-2">
      <RefreshCw className="w-4 h-4 mr-2" />
      Try Again
    </Button>
    <details className="text-xs text-gray-500 mt-2">
      <summary className="cursor-pointer hover:text-gray-300">Technical Details</summary>
      <pre className="mt-2 p-2 bg-gray-800 rounded text-red-400 text-xs overflow-auto max-w-md">
        {error.message}
      </pre>
    </details>
  </div>
);

export const CrashSafeMessageList: React.FC<CrashSafeMessageListProps> = ({
  messages,
  channelId,
  dmUserId,
  isDirectMessage,
  height = 400,
}) => {
  const { setScrollPosition, scrollPositions } = useChatStore();
  const { messageGrouping, compactMode } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { connectionState } = useCrashSafeSocket();

  // State
  const [error, setError] = React.useState<Error | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [hasNewMessages, setHasNewMessages] = React.useState(false);
  const [itemHeights, setItemHeights] = React.useState<Map<string, number>>(new Map());

  // Refs
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const lastMessageCountRef = React.useRef(messages.length);

  const scrollKey = channelId || dmUserId || "";

  // Safe message processing with error handling
  const processedMessages = React.useMemo(() => {
    try {
      if (!Array.isArray(messages)) {
        console.warn('Messages is not an array:', messages);
        return [];
      }

      // Filter out invalid messages
      const validMessages = messages.filter((message) => {
        try {
          return message && 
                 typeof message === 'object' && 
                 message.id && 
                 message.authorId && 
                 message.createdAt && 
                 message.author;
        } catch (err) {
          console.warn('Invalid message detected:', message, err);
          return false;
        }
      });

      return validMessages;
    } catch (err) {
      console.error('Error processing messages:', err);
      setError(err as Error);
      return [];
    }
  }, [messages]);

  // Group consecutive messages from the same user
  const groupedMessages = React.useMemo(() => {
    try {
      if (!messageGrouping) {
        return processedMessages.map(msg => ({ 
          message: msg, 
          isGroupStart: true, 
          isGroupEnd: true 
        }));
      }

      return processedMessages.map((msg, index) => {
        const prevMsg = index > 0 ? processedMessages[index - 1] : null;
        const nextMsg = index < processedMessages.length - 1 ? processedMessages[index + 1] : null;

        const isSameAuthor = (msg1: Message | DirectMessage, msg2: Message | DirectMessage | null) => {
          if (!msg2) return false;
          try {
            return msg1.authorId === msg2.authorId;
          } catch (err) {
            return false;
          }
        };

        const isWithinTimeThreshold = (msg1: Message | DirectMessage, msg2: Message | DirectMessage | null) => {
          if (!msg2) return false;
          try {
            const date1 = new Date(msg1.createdAt);
            const date2 = new Date(msg2.createdAt);
            if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
            
            const timeDiff = Math.abs(date1.getTime() - date2.getTime());
            return timeDiff < 5 * 60 * 1000; // 5 minutes
          } catch (err) {
            return false;
          }
        };

        const isGroupStart = !prevMsg || 
          !isSameAuthor(msg, prevMsg) || 
          !isWithinTimeThreshold(msg, prevMsg);

        const isGroupEnd = !nextMsg || 
          !isSameAuthor(msg, nextMsg) || 
          !isWithinTimeThreshold(msg, nextMsg);

        return {
          message: msg,
          isGroupStart,
          isGroupEnd,
        };
      });
    } catch (err) {
      console.error('Error grouping messages:', err);
      setError(err as Error);
      return [];
    }
  }, [processedMessages, messageGrouping]);

  // Add dividers for date changes and convert to virtual items
  const virtualItems = React.useMemo(() => {
    try {
      const result: VirtualizedMessage[] = [];
      let lastDate: string | null = null;

      groupedMessages.forEach((item, index) => {
        try {
          const messageDate = new Date(item.message.createdAt).toDateString();
          
          if (messageDate !== lastDate && !isNaN(new Date(item.message.createdAt).getTime())) {
            if (index > 0) {
              result.push({
                id: `divider-${item.message.id}`,
                type: 'divider',
                data: { date: new Date(item.message.createdAt) },
                height: 40, // Estimated divider height
              });
            }
            lastDate = messageDate;
          }

          const estimatedHeight = compactMode ? 28 : (item.isGroupStart ? 80 : 28);
          result.push({
            id: item.message.id,
            type: 'message',
            data: item,
            height: itemHeights.get(item.message.id) || estimatedHeight,
          });
        } catch (err) {
          console.warn('Error processing message for virtualization:', err);
        }
      });

      return result;
    } catch (err) {
      console.error('Error creating virtual items:', err);
      setError(err as Error);
      return [];
    }
  }, [groupedMessages, compactMode, itemHeights]);

  // Virtual scrolling
  const {
    containerProps,
    items: visibleItems,
    scrollToBottom,
    totalHeight,
    isScrolling,
    error: virtualScrollError,
    retry: retryVirtualScroll,
  } = useCrashSafeVirtualScroll(virtualItems, {
    itemHeight: compactMode ? 28 : 60,
    containerHeight: height,
    overscan: 5,
    onScroll: (scrollTop) => {
      // Check if at bottom (with 100px threshold)
      const atBottom = (totalHeight - scrollTop - height) < 100;
      setIsAtBottom(atBottom);
      
      if (atBottom) {
        setShowScrollToBottom(false);
        setHasNewMessages(false);
      } else {
        setShowScrollToBottom(true);
      }
      
      // Save scroll position
      if (scrollKey) {
        setScrollPosition(scrollKey, scrollTop);
      }
    },
    maxItems: 5000, // Limit to prevent memory issues
  });

  // Handle item height changes
  const handleItemHeightChange = React.useCallback((messageId: string, newHeight: number) => {
    setItemHeights(prev => {
      const updated = new Map(prev);
      updated.set(messageId, newHeight);
      return updated;
    });
  }, []);

  // Handle new messages
  React.useEffect(() => {
    try {
      const hasNewMessage = processedMessages.length > lastMessageCountRef.current;
      lastMessageCountRef.current = processedMessages.length;

      if (hasNewMessage) {
        if (isAtBottom) {
          // Auto-scroll if already at bottom
          setTimeout(() => scrollToBottom(), 100);
        } else {
          // Show notification if not at bottom
          setHasNewMessages(true);
        }
      }
    } catch (err) {
      console.error('Error handling new messages:', err);
    }
  }, [processedMessages.length, isAtBottom, scrollToBottom]);

  // Handle scroll to bottom
  const handleScrollToBottom = React.useCallback(() => {
    try {
      scrollToBottom();
      setHasNewMessages(false);
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }, [scrollToBottom]);

  // Error handling
  const handleRetry = React.useCallback(() => {
    setError(null);
    setItemHeights(new Map());
    retryVirtualScroll();
  }, [retryVirtualScroll]);

  // Main error state
  if (error || virtualScrollError) {
    return (
      <MessageListErrorBoundary>
        <ErrorState 
          error={error || virtualScrollError || new Error('Unknown error')} 
          onRetry={handleRetry}
        />
      </MessageListErrorBoundary>
    );
  }

  // Empty state
  if (processedMessages.length === 0) {
    return (
      <MessageListErrorBoundary>
        <ConnectionStatus connectionState={connectionState} />
        <EmptyState isDirectMessage={isDirectMessage} />
      </MessageListErrorBoundary>
    );
  }

  return (
    <MessageListErrorBoundary>
      <div className="flex-1 relative">
        <ConnectionStatus connectionState={connectionState} />
        
        <div {...containerProps} className={cn(containerProps.style && "overflow-auto")}>
          <div 
            style={{ 
              height: totalHeight,
              position: 'relative',
            }}
            className={cn("p-4", compactMode && "space-y-0")}
          >
            {visibleItems.map(({ index, item, style }) => {
              const virtualItem = item;
              
              try {
                if (virtualItem.type === 'divider') {
                  return (
                    <div key={virtualItem.id} style={style}>
                      <MessageDivider date={virtualItem.data.date} />
                    </div>
                  );
                }

                const { message, isGroupStart, isGroupEnd } = virtualItem.data;
                
                return (
                  <div key={virtualItem.id} style={style}>
                    <CrashSafeMessageItem
                      message={message}
                      isDirectMessage={isDirectMessage}
                      isGroupStart={isGroupStart}
                      isGroupEnd={isGroupEnd}
                      showAvatar={isGroupStart}
                      showTimestamp={isGroupEnd}
                      compact={compactMode}
                      onHeightChange={handleItemHeightChange}
                    />
                  </div>
                );
              } catch (err) {
                console.error('Error rendering virtual item:', err);
                return (
                  <div key={virtualItem.id} style={style}>
                    <div className="flex items-center gap-2 p-2 text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Failed to load message
                    </div>
                  </div>
                );
              }
            })}
          </div>
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "rounded-full shadow-lg",
                hasNewMessages && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              onClick={handleScrollToBottom}
            >
              <ChevronDown className="w-4 h-4" />
              {hasNewMessages && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>
        )}
      </div>
    </MessageListErrorBoundary>
  );
};