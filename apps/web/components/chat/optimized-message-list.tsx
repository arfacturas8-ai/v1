"use client";

import * as React from "react";
import { useMemo, startTransition, useDeferredValue, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Message, DirectMessage } from "@/lib/types";
import { MessageItem } from "./message-item";
import { MessageDivider } from "./message-divider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { 
  useOptimizedScroll, 
  useWindowedList, 
  usePerformanceMonitor,
  useStableCallback 
} from "@/lib/hooks/use-optimized-render";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";

interface OptimizedMessageListProps {
  messages: (Message | DirectMessage)[];
  channelId?: string;
  dmUserId?: string;
  isDirectMessage: boolean;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

interface MessageWithMetadata {
  id: string;
  message: Message | DirectMessage;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  showDivider: boolean;
  dividerDate?: Date;
}

// Optimized message item component with React.memo and custom comparison
const OptimizedMessageItem = React.memo(function OptimizedMessageItem({
  messageData,
  isDirectMessage,
}: {
  messageData: MessageWithMetadata;
  isDirectMessage: boolean;
}) {
  const { message, isGroupStart, isGroupEnd, showDivider, dividerDate } = messageData;
  const { compactMode } = useUIStore();
  
  // Performance monitoring for this component
  usePerformanceMonitor('OptimizedMessageItem');

  return (
    <>
      {showDivider && dividerDate && (
        <MessageDivider date={dividerDate} />
      )}
      <MessageItem
        message={message}
        isDirectMessage={isDirectMessage}
        isGroupStart={isGroupStart}
        isGroupEnd={isGroupEnd}
        showAvatar={isGroupStart}
        showTimestamp={isGroupEnd}
        compact={compactMode}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  const prev = prevProps.messageData;
  const next = nextProps.messageData;
  
  return (
    prev.id === next.id &&
    prev.isGroupStart === next.isGroupStart &&
    prev.isGroupEnd === next.isGroupEnd &&
    prev.showDivider === next.showDivider &&
    prev.message.isEdited === next.message.isEdited &&
    prev.message.reactions?.length === next.message.reactions?.length &&
    prevProps.isDirectMessage === nextProps.isDirectMessage
  );
});

export function OptimizedMessageList({
  messages,
  channelId,
  dmUserId,
  isDirectMessage,
  onLoadMore,
  hasMore = false,
}: OptimizedMessageListProps) {
  const { messageGrouping } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [hasNewMessages, setHasNewMessages] = React.useState(false);
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const lastMessageCountRef = React.useRef(messages.length);

  // Performance monitoring
  usePerformanceMonitor('OptimizedMessageList');

  // Use deferred value for smooth updates during rapid message incoming
  const deferredMessages = useDeferredValue(messages);

  // Process messages with metadata for grouping and dividers
  const processedMessages = useMemo(() => {
    if (!messageGrouping) {
      return deferredMessages.map((msg, index) => ({
        id: msg.id,
        message: msg,
        isGroupStart: true,
        isGroupEnd: true,
        showDivider: false,
      }));
    }

    return deferredMessages.map((msg, index): MessageWithMetadata => {
      const prevMsg = index > 0 ? deferredMessages[index - 1] : null;
      const nextMsg = index < deferredMessages.length - 1 ? deferredMessages[index + 1] : null;

      const isSameAuthor = (msg1: Message | DirectMessage, msg2: Message | DirectMessage | null) => {
        if (!msg2) return false;
        return msg1.authorId === msg2.authorId;
      };

      const isWithinTimeThreshold = (msg1: Message | DirectMessage, msg2: Message | DirectMessage | null) => {
        if (!msg2) return false;
        const timeDiff = new Date(msg1.createdAt).getTime() - new Date(msg2.createdAt).getTime();
        return Math.abs(timeDiff) < 5 * 60 * 1000; // 5 minutes
      };

      const isGroupStart = !prevMsg || 
        !isSameAuthor(msg, prevMsg) || 
        !isWithinTimeThreshold(msg, prevMsg);

      const isGroupEnd = !nextMsg || 
        !isSameAuthor(msg, nextMsg) || 
        !isWithinTimeThreshold(msg, nextMsg);

      // Check if we need a date divider
      const showDivider = !prevMsg || 
        new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

      return {
        id: msg.id,
        message: msg,
        isGroupStart,
        isGroupEnd,
        showDivider,
        dividerDate: showDivider ? new Date(msg.createdAt) : undefined,
      };
    });
  }, [deferredMessages, messageGrouping]);

  // Optimized scroll handling with React 19 features
  const handleOptimizedScroll = useStableCallback((scrollTop: number, scrollDirection: 'up' | 'down') => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const { scrollHeight, clientHeight } = scrollElement;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);

    // Load more messages when scrolling up and near top
    if (scrollDirection === 'up' && scrollTop < 100 && hasMore && onLoadMore) {
      onLoadMore();
    }

    if (atBottom && hasNewMessages) {
      setHasNewMessages(false);
    }
  });

  useOptimizedScroll(
    handleOptimizedScroll,
    scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement,
    16 // 60fps
  );

  // Handle new messages
  React.useEffect(() => {
    const hasNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (hasNewMessage) {
      if (isAtBottom) {
        // Auto-scroll if already at bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
      } else {
        // Show notification if not at bottom
        setHasNewMessages(true);
      }
    }
  }, [messages.length, isAtBottom]);

  const scrollToBottom = useStableCallback(() => {
    startTransition(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    });
  });

  if (processedMessages.length === 0) {
    return (
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
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea 
        ref={scrollAreaRef}
        className="h-full"
      >
        <div className="p-4 space-y-1">
          {/* Loading indicator for loading more messages */}
          {isPending && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Render messages using React 19 optimizations */}
          {processedMessages.map((messageData) => (
            <OptimizedMessageItem
              key={messageData.id}
              messageData={messageData}
              isDirectMessage={isDirectMessage}
            />
          ))}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "rounded-full shadow-lg transition-all duration-200",
              hasNewMessages && "bg-blue-600 hover:bg-blue-700 text-white scale-110"
            )}
            onClick={scrollToBottom}
          >
            <ChevronDown className="w-4 h-4" />
            {hasNewMessages && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </div>
      )}

      {/* Loading state overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Loading messages...</span>
          </div>
        </div>
      )}
    </div>
  );
}