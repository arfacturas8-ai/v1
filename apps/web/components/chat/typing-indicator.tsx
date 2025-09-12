"use client";

import * as React from "react";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useChatSocket } from "@/lib/hooks/use-chat-socket";

interface TypingIndicatorProps {
  channelId?: string;
  dmUserId?: string;
}

export function TypingIndicator({ channelId, dmUserId }: TypingIndicatorProps) {
  const { typingUsers, users } = useChatStore();
  const { connected } = useChatSocket();

  // Don't show typing indicator if not connected
  if (!connected) {
    return null;
  }

  const typingKey = channelId || dmUserId || "";
  const typingUserIds = typingUsers[typingKey] || new Set();
  
  // Get typing users data
  const typingUsersList = Array.from(typingUserIds)
    .map(userId => users[userId])
    .filter(Boolean)
    .slice(0, 3); // Limit to first 3 users

  if (typingUsersList.length === 0) {
    return null;
  }

  const formatTypingText = () => {
    const names = typingUsersList.map(user => user.displayName || user.username);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return "Several people are typing...";
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-400 px-2 py-1 animate-fadeIn">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-gray-300">{formatTypingText()}</span>
    </div>
  );
}