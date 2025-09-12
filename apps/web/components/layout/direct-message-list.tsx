"use client";

import * as React from "react";
import { MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface DirectMessageListProps {
  searchQuery?: string;
}

export function DirectMessageList({ searchQuery = "" }: DirectMessageListProps) {
  const { users, selectedDmUserId, selectDM, directMessages } = useChatStore();
  const { user: currentUser } = useAuthStore();

  // Get users with recent DM conversations
  const dmUsers = React.useMemo(() => {
    const usersWithDMs = Object.keys(directMessages)
      .map(userId => users[userId])
      .filter(Boolean)
      .filter(user => {
        if (!searchQuery) return true;
        return user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      })
      .sort((a, b) => {
        // Sort by last message time
        const aDMs = directMessages[a.id] || [];
        const bDMs = directMessages[b.id] || [];
        const aLastMessage = aDMs[aDMs.length - 1];
        const bLastMessage = bDMs[bDMs.length - 1];
        
        if (!aLastMessage && !bLastMessage) return 0;
        if (!aLastMessage) return 1;
        if (!bLastMessage) return -1;
        
        return new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime();
      });

    return usersWithDMs;
  }, [directMessages, users, searchQuery]);

  const handleUserSelect = (userId: string) => {
    selectDM(userId);
  };

  const getUnreadCount = (userId: string) => {
    const dms = directMessages[userId] || [];
    return dms.filter(dm => !dm.isRead && dm.authorId !== currentUser?.id).length;
  };

  const getLastMessage = (userId: string) => {
    const dms = directMessages[userId] || [];
    return dms[dms.length - 1];
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return new Date(date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (dmUsers.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Start a conversation with someone to see your direct messages here.
        </p>
      </div>
    );
  }

  if (dmUsers.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          No results found
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Try searching for a different username or display name.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {dmUsers.map((user) => {
          const isSelected = selectedDmUserId === user.id;
          const unreadCount = getUnreadCount(user.id);
          const lastMessage = getLastMessage(user.id);

          return (
            <Button
              key={user.id}
              variant="ghost"
              className={cn(
                "w-full justify-start p-2 h-auto text-left hover:bg-gray-700 rounded-lg",
                isSelected && "bg-gray-600"
              )}
              onClick={() => handleUserSelect(user.id)}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                {/* Avatar with status */}
                <div className="relative flex-shrink-0">
                  <Avatar size="sm">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>
                      {user.displayName?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <StatusIndicator status={user.status} size="xs" />
                  </div>
                </div>

                {/* User info and last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "font-medium truncate",
                      isSelected ? "text-white" : "text-gray-300",
                      unreadCount > 0 && "text-white"
                    )}>
                      {user.displayName || user.username}
                    </span>
                    
                    {lastMessage && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatLastMessageTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {lastMessage && (
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm truncate",
                        unreadCount > 0 ? "text-gray-300 font-medium" : "text-gray-500"
                      )}>
                        {lastMessage.authorId === currentUser?.id && "You: "}
                        {lastMessage.content || "Sent an attachment"}
                      </p>
                      
                      {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0 ml-2">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}