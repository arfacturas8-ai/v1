"use client";

import * as React from "react";
import { Hash, Volume2, Pin, Users, Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatSocket } from "@/lib/hooks/use-chat-socket";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { ChannelType } from "@/lib/types";

interface ChatHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  memberCount?: number;
  connected?: boolean;
  onSearch?: () => void;
  onToggleUserList?: () => void;
  onPinnedMessages?: () => void;
  onChannelSettings?: () => void;
}

function ChatHeader({
  title,
  description,
  icon,
  memberCount,
  connected = true,
  onSearch,
  onToggleUserList,
  onPinnedMessages,
  onChannelSettings,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4 bg-gray-800 border-b border-gray-700">
      {/* Left side - Channel info */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-semibold truncate text-responsive-sm">{title}</h1>
            {!connected && (
              <span className="text-xs text-red-400 px-2 py-1 bg-red-900/20 rounded-full">
                Offline
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-400 truncate hidden sm:block">{description}</p>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          {onSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="touch-target text-gray-400 hover:text-white"
                  onClick={onSearch}
                  aria-label="Search messages"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onPinnedMessages && (
            <div className="hidden sm:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="w-8 h-8 text-gray-400 hover:text-white"
                    onClick={onPinnedMessages}
                    aria-label="View pinned messages"
                  >
                    <Pin className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pinned Messages</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {onToggleUserList && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="touch-target text-gray-400 hover:text-white relative"
                  onClick={onToggleUserList}
                  aria-label={`Toggle member list (${memberCount} members)`}
                >
                  <Users className="w-4 h-4" />
                  {memberCount && memberCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {memberCount > 99 ? "99+" : memberCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Member List ({memberCount})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onChannelSettings && (
            <div className="hidden sm:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="w-8 h-8 text-gray-400 hover:text-white"
                    onClick={onChannelSettings}
                    aria-label="Channel settings"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More Options</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

export function ChatArea() {
  const {
    selectedChannelId,
    selectedDmUserId,
    channels,
    users,
    servers,
    selectedServerId,
    getChannelMessages,
    getUserDMs,
    setMessages,
    setLoadingMessages,
    isLoadingMessages,
  } = useChatStore();
  
  // Initialize chat socket connection
  const { socket, connected } = useChatSocket();
  const { 
    userListCollapsed, 
    toggleUserList, 
    openModal,
    isMobile 
  } = useUIStore();
  const { participants } = useVoiceStore();

  const currentChannel = selectedChannelId ? channels[selectedChannelId] : null;
  const currentDmUser = selectedDmUserId ? users[selectedDmUserId] : null;
  const currentServer = selectedServerId ? servers[selectedServerId] : null;

  // Load messages when channel/DM changes
  React.useEffect(() => {
    const loadMessages = async () => {
      if (!connected) return;
      
      if (selectedChannelId) {
        setLoadingMessages(true);
        try {
          const response = await api.getMessages(selectedChannelId);
          if (response.success && response.data) {
            const messages = Array.isArray(response.data) ? response.data : [];
            setMessages(selectedChannelId, messages);
          }
        } catch (error) {
          console.error('Failed to load messages:', error);
        } finally {
          setLoadingMessages(false);
        }
      }
    };
    
    loadMessages();
  }, [selectedChannelId, connected, setMessages, setLoadingMessages]);

  // Get messages for current channel or DM
  const messages = React.useMemo(() => {
    if (selectedChannelId) {
      return getChannelMessages(selectedChannelId);
    }
    if (selectedDmUserId) {
      return getUserDMs(selectedDmUserId);
    }
    return [];
  }, [selectedChannelId, selectedDmUserId, getChannelMessages, getUserDMs]);

  const handleSearch = () => {
    openModal("search", {
      channelId: selectedChannelId,
      dmUserId: selectedDmUserId,
    });
  };

  const handlePinnedMessages = () => {
    if (selectedChannelId) {
      openModal("pinned-messages", { channelId: selectedChannelId });
    }
  };

  const handleChannelSettings = () => {
    if (selectedChannelId) {
      openModal("channel-settings", { channelId: selectedChannelId });
    } else if (selectedDmUserId) {
      openModal("dm-settings", { userId: selectedDmUserId });
    }
  };

  const handleToggleUserList = () => {
    if (!isMobile) {
      toggleUserList();
    } else {
      openModal("member-list", { channelId: selectedChannelId });
    }
  };

  const getMemberCount = () => {
    if (currentChannel?.type === ChannelType.VOICE) {
      return Object.keys(participants).length;
    }
    return currentServer?.memberCount || 0;
  };

  // Render channel chat
  if (currentChannel) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        <ChatHeader
          title={currentChannel.name}
          description={currentChannel.description}
          connected={connected}
          icon={
            currentChannel.type === ChannelType.TEXT ? (
              <Hash className="w-5 h-5 text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-400" />
            )
          }
          memberCount={getMemberCount()}
          onSearch={handleSearch}
          onToggleUserList={!isMobile ? handleToggleUserList : undefined}
          onPinnedMessages={handlePinnedMessages}
          onChannelSettings={handleChannelSettings}
        />

        <div className="flex-1 flex flex-col min-h-0">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading messages...</p>
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              channelId={selectedChannelId}
              isDirectMessage={false}
            />
          )}
          
          {connected && (
            <div className="px-4 pb-2">
              <TypingIndicator channelId={selectedChannelId} />
            </div>
          )}
          
          <div className="px-4 pb-4">
            {!connected && (
              <div className="mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                ⚠️ Connection lost. Trying to reconnect...
              </div>
            )}
            <MessageInput
              channelId={selectedChannelId}
              placeholder={`Message #${currentChannel.name}`}
              disabled={!connected}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render DM chat
  if (currentDmUser) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        <ChatHeader
          title={currentDmUser.displayName || currentDmUser.username}
          description={`@${currentDmUser.username}`}
          connected={connected}
          icon={
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
              @
            </div>
          }
          onSearch={handleSearch}
          onChannelSettings={handleChannelSettings}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <MessageList
            messages={messages}
            dmUserId={selectedDmUserId}
            isDirectMessage={true}
          />
          
          <div className="px-4 pb-4">
            {!connected && (
              <div className="mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                ⚠️ Connection lost. Trying to reconnect...
              </div>
            )}
            <MessageInput
              dmUserId={selectedDmUserId}
              placeholder={`Message @${currentDmUser.username}`}
              disabled={!connected}
            />
          </div>
        </div>
      </div>
    );
  }

  // No channel or DM selected
  return (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4">💭</div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Nothing to see here
        </h2>
        <p className="text-gray-400 max-w-md">
          Select a channel or start a direct message to begin chatting.
        </p>
      </div>
    </div>
  );
}