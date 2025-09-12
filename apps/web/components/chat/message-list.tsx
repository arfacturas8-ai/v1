"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useChatSocket } from "@/lib/hooks/use-chat-socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Message, DirectMessage } from "@/lib/types";
import { MessageItem } from "./message-item";
import { MessageDivider } from "./message-divider";

interface MessageListProps {
  messages: (Message | DirectMessage)[];
  channelId?: string;
  dmUserId?: string;
  isDirectMessage: boolean;
}

export function MessageList({
  messages,
  channelId,
  dmUserId,
  isDirectMessage,
}: MessageListProps) {
  const { setScrollPosition, scrollPositions } = useChatStore();
  const { messageGrouping, compactMode } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { connected } = useChatSocket();

  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [hasNewMessages, setHasNewMessages] = React.useState(false);
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const lastMessageCountRef = React.useRef(messages.length);

  const scrollKey = channelId || dmUserId || "";

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    const hasNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (hasNewMessage) {
      if (isAtBottom) {
        // Auto-scroll if already at bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Show notification if not at bottom
        setHasNewMessages(true);
      }
    }
  }, [messages.length, isAtBottom]);

  // Restore scroll position on channel change
  React.useEffect(() => {
    if (scrollKey && scrollPositions[scrollKey]) {
      const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollPositions[scrollKey];
      }
    } else {
      // New channel, scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [scrollKey, scrollPositions]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Check if at bottom (with 100px threshold)
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    
    // Hide scroll to bottom button when at bottom
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
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
  };

  // Group consecutive messages from the same user
  const groupedMessages = React.useMemo(() => {
    if (!messageGrouping) {
      return messages.map(msg => ({ message: msg, isGroupStart: true, isGroupEnd: true }));
    }

    return messages.map((msg, index) => {
      const prevMsg = index > 0 ? messages[index - 1] : null;
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

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

      return {
        message: msg,
        isGroupStart,
        isGroupEnd,
      };
    });
  }, [messages, messageGrouping]);

  // Add dividers for date changes
  const messagesWithDividers = React.useMemo(() => {
    const result: Array<{
      type: 'message' | 'divider';
      data: any;
    }> = [];

    let lastDate: string | null = null;

    groupedMessages.forEach((item, index) => {
      const messageDate = new Date(item.message.createdAt).toDateString();
      
      if (messageDate !== lastDate) {
        if (index > 0) {
          result.push({
            type: 'divider',
            data: { date: new Date(item.message.createdAt) }
          });
        }
        lastDate = messageDate;
      }

      result.push({
        type: 'message',
        data: item
      });
    });

    return result;
  }, [groupedMessages]);

  if (messages.length === 0) {
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
        onScrollCapture={handleScroll}
      >
        <div className={cn("p-4 space-y-1", compactMode && "space-y-0")}>
          {messagesWithDividers.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <MessageDivider
                  key={`divider-${index}`}
                  date={item.data.date}
                />
              );
            }

            const { message, isGroupStart, isGroupEnd } = item.data;
            
            return (
              <MessageItem
                key={message.id}
                message={message}
                isDirectMessage={isDirectMessage}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
                showAvatar={isGroupStart}
                showTimestamp={isGroupEnd}
                compact={compactMode}
              />
            );
          })}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
            onClick={scrollToBottom}
          >
            <ChevronDown className="w-4 h-4" />
            {hasNewMessages && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}