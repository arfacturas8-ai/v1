"use client";

import * as React from "react";
import { Hash, Volume2, Pin, Users, Search, MoreHorizontal, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CrashSafeMessageList } from "./crash-safe-message-list";
import { CrashSafeMessageInput } from "./crash-safe-message-input";
import { TypingIndicator } from "./typing-indicator";
import { ChannelType } from "@/lib/types";
import { ChatAreaErrorBoundary } from "@/components/error-boundaries/chat-error-boundary";
import { useCrashSafeSocket } from "@/lib/crash-safe-socket";

interface SafeChatHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  memberCount?: number;
  onSearch?: () => void;
  onToggleUserList?: () => void;
  onPinnedMessages?: () => void;
  onChannelSettings?: () => void;
  error?: Error | null;
}

const SafeChatHeader: React.FC<SafeChatHeaderProps> = ({
  title,
  description,
  icon,
  memberCount,
  onSearch,
  onToggleUserList,
  onPinnedMessages,
  onChannelSettings,
  error,
}) => {
  const [safeTitle, setSafeTitle] = React.useState('');
  const [safeDescription, setSafeDescription] = React.useState('');

  React.useEffect(() => {
    try {
      // Safely process title and description
      setSafeTitle(typeof title === 'string' ? title.trim() : 'Unknown Channel');
      setSafeDescription(typeof description === 'string' ? description.trim() : '');
    } catch (err) {
      console.error('Error processing header data:', err);
      setSafeTitle('Error Loading Channel');
      setSafeDescription('');
    }
  }, [title, description]);

  if (error) {
    return (
      <div className="flex items-center justify-between h-12 px-4 bg-red-900/20 border-b border-red-600">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-200">Failed to load channel</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between h-12 px-4 bg-gray-700 border-b border-gray-600">
      {/* Left side - Channel info */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {icon}
        <div className="min-w-0">
          <h1 className="text-white font-semibold truncate">{safeTitle}</h1>
          {safeDescription && (
            <p className="text-xs text-gray-400 truncate">{safeDescription}</p>
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
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white"
                  onClick={() => {
                    try {
                      onSearch();
                    } catch (error) {
                      console.error('Error opening search:', error);
                    }
                  }}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white"
                  onClick={() => {
                    try {
                      onPinnedMessages();
                    } catch (error) {
                      console.error('Error opening pinned messages:', error);
                    }
                  }}
                >
                  <Pin className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pinned Messages</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onToggleUserList && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white relative"
                  onClick={() => {
                    try {
                      onToggleUserList();
                    } catch (error) {
                      console.error('Error toggling user list:', error);
                    }
                  }}
                >
                  <Users className="w-4 h-4" />
                  {memberCount && memberCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {memberCount > 99 ? "99+" : memberCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Member List</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onChannelSettings && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white"
                  onClick={() => {
                    try {
                      onChannelSettings();
                    } catch (error) {
                      console.error('Error opening channel settings:', error);
                    }
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More Options</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

const SafeEmptyState: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-gray-700">
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

const SafeErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center h-full bg-gray-700">
    <div className="text-center max-w-md p-8">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-red-200 mb-2">Chat Error</h2>
      <p className="text-gray-400 mb-6">
        Something went wrong while loading the chat. Please try again.
      </p>
      <Button onClick={onRetry} className="mb-4">
        Try Again
      </Button>
      <details className="text-left">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300 mb-2">
          Technical Details
        </summary>
        <pre className="p-3 bg-gray-800 rounded text-xs overflow-auto text-red-400">
          {error.message}
        </pre>
      </details>
    </div>
  </div>
);

export const CrashSafeChatArea: React.FC = () => {
  // Store hooks with error handling
  const [storeError, setStoreError] = React.useState<Error | null>(null);
  const [chatData, setChatData] = React.useState<any>(null);
  const [uiData, setUIData] = React.useState<any>(null);
  const [voiceData, setVoiceData] = React.useState<any>(null);

  const { connectionState } = useCrashSafeSocket();

  // Safely access store data
  React.useEffect(() => {
    try {
      const chatStoreData = useChatStore.getState();
      setChatData(chatStoreData);
      setStoreError(null);
    } catch (error) {
      console.error('Error accessing chat store:', error);
      setStoreError(error as Error);
    }
  }, []);

  React.useEffect(() => {
    try {
      const uiStoreData = useUIStore.getState();
      setUIData(uiStoreData);
    } catch (error) {
      console.error('Error accessing UI store:', error);
    }
  }, []);

  React.useEffect(() => {
    try {
      const voiceStoreData = useVoiceStore.getState();
      setVoiceData(voiceStoreData);
    } catch (error) {
      console.error('Error accessing voice store:', error);
    }
  }, []);

  // Subscribe to store changes safely
  React.useEffect(() => {
    try {
      const unsubscribeChatStore = useChatStore.subscribe((state) => {
        setChatData(state);
      });

      const unsubscribeUIStore = useUIStore.subscribe((state) => {
        setUIData(state);
      });

      const unsubscribeVoiceStore = useVoiceStore.subscribe((state) => {
        setVoiceData(state);
      });

      return () => {
        unsubscribeChatStore();
        unsubscribeUIStore();
        unsubscribeVoiceStore();
      };
    } catch (error) {
      console.error('Error setting up store subscriptions:', error);
      setStoreError(error as Error);
    }
  }, []);

  // Safe data extraction
  const safeData = React.useMemo(() => {
    try {
      if (!chatData || !uiData) {
        return {
          selectedChannelId: null,
          selectedDmUserId: null,
          currentChannel: null,
          currentDmUser: null,
          currentServer: null,
          messages: [],
          error: storeError,
        };
      }

      const {
        selectedChannelId,
        selectedDmUserId,
        channels = {},
        users = {},
        servers = {},
        selectedServerId,
        getChannelMessages,
        getUserDMs,
      } = chatData;

      const currentChannel = selectedChannelId ? channels[selectedChannelId] : null;
      const currentDmUser = selectedDmUserId ? users[selectedDmUserId] : null;
      const currentServer = selectedServerId ? servers[selectedServerId] : null;

      // Get messages safely
      let messages = [];
      try {
        if (selectedChannelId && typeof getChannelMessages === 'function') {
          messages = getChannelMessages(selectedChannelId) || [];
        } else if (selectedDmUserId && typeof getUserDMs === 'function') {
          messages = getUserDMs(selectedDmUserId) || [];
        }
      } catch (error) {
        console.error('Error getting messages:', error);
        messages = [];
      }

      return {
        selectedChannelId,
        selectedDmUserId,
        currentChannel,
        currentDmUser,
        currentServer,
        messages,
        error: null,
      };
    } catch (error) {
      console.error('Error processing safe data:', error);
      return {
        selectedChannelId: null,
        selectedDmUserId: null,
        currentChannel: null,
        currentDmUser: null,
        currentServer: null,
        messages: [],
        error: error as Error,
      };
    }
  }, [chatData, uiData, storeError]);

  // Event handlers
  const handleRetry = React.useCallback(() => {
    try {
      setStoreError(null);
      // Force re-initialization
      window.location.reload();
    } catch (error) {
      console.error('Error during retry:', error);
    }
  }, []);

  const handleSearch = React.useCallback(() => {
    try {
      if (uiData?.openModal) {
        uiData.openModal("search", {
          channelId: safeData.selectedChannelId,
          dmUserId: safeData.selectedDmUserId,
        });
      }
    } catch (error) {
      console.error('Error opening search modal:', error);
    }
  }, [uiData, safeData.selectedChannelId, safeData.selectedDmUserId]);

  const handlePinnedMessages = React.useCallback(() => {
    try {
      if (safeData.selectedChannelId && uiData?.openModal) {
        uiData.openModal("pinned-messages", { channelId: safeData.selectedChannelId });
      }
    } catch (error) {
      console.error('Error opening pinned messages:', error);
    }
  }, [safeData.selectedChannelId, uiData]);

  const handleChannelSettings = React.useCallback(() => {
    try {
      if (uiData?.openModal) {
        if (safeData.selectedChannelId) {
          uiData.openModal("channel-settings", { channelId: safeData.selectedChannelId });
        } else if (safeData.selectedDmUserId) {
          uiData.openModal("dm-settings", { userId: safeData.selectedDmUserId });
        }
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }, [uiData, safeData.selectedChannelId, safeData.selectedDmUserId]);

  const handleToggleUserList = React.useCallback(() => {
    try {
      if (uiData?.isMobile) {
        if (uiData.openModal) {
          uiData.openModal("member-list", { channelId: safeData.selectedChannelId });
        }
      } else if (uiData?.toggleUserList) {
        uiData.toggleUserList();
      }
    } catch (error) {
      console.error('Error toggling user list:', error);
    }
  }, [uiData, safeData.selectedChannelId]);

  const getMemberCount = React.useCallback(() => {
    try {
      if (safeData.currentChannel?.type === ChannelType.VOICE && voiceData?.participants) {
        return Object.keys(voiceData.participants).length;
      }
      return safeData.currentServer?.memberCount || 0;
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }, [safeData.currentChannel, safeData.currentServer, voiceData]);

  // Handle critical errors
  if (storeError || safeData.error) {
    return (
      <ChatAreaErrorBoundary>
        <SafeErrorState error={storeError || safeData.error || new Error('Unknown error')} onRetry={handleRetry} />
      </ChatAreaErrorBoundary>
    );
  }

  // Channel chat
  if (safeData.currentChannel) {
    return (
      <ChatAreaErrorBoundary>
        <div className="flex flex-col h-full bg-gray-700">
          <SafeChatHeader
            title={safeData.currentChannel.name || 'Unknown Channel'}
            description={safeData.currentChannel.description}
            icon={
              safeData.currentChannel.type === ChannelType.TEXT ? (
                <Hash className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )
            }
            memberCount={getMemberCount()}
            onSearch={handleSearch}
            onToggleUserList={!uiData?.isMobile ? handleToggleUserList : undefined}
            onPinnedMessages={handlePinnedMessages}
            onChannelSettings={handleChannelSettings}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <CrashSafeMessageList
              messages={safeData.messages}
              channelId={safeData.selectedChannelId}
              isDirectMessage={false}
              height={400}
            />
            
            <div className="px-4 pb-2">
              <TypingIndicator channelId={safeData.selectedChannelId} />
            </div>
            
            <div className="px-4 pb-4">
              <CrashSafeMessageInput
                channelId={safeData.selectedChannelId}
                placeholder={`Message #${safeData.currentChannel.name || 'channel'}`}
              />
            </div>
          </div>
        </div>
      </ChatAreaErrorBoundary>
    );
  }

  // DM chat
  if (safeData.currentDmUser) {
    return (
      <ChatAreaErrorBoundary>
        <div className="flex flex-col h-full bg-gray-700">
          <SafeChatHeader
            title={safeData.currentDmUser.displayName || safeData.currentDmUser.username || 'Unknown User'}
            description={`@${safeData.currentDmUser.username || 'unknown'}`}
            icon={
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                @
              </div>
            }
            onSearch={handleSearch}
            onChannelSettings={handleChannelSettings}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <CrashSafeMessageList
              messages={safeData.messages}
              dmUserId={safeData.selectedDmUserId}
              isDirectMessage={true}
              height={400}
            />
            
            <div className="px-4 pb-4">
              <CrashSafeMessageInput
                dmUserId={safeData.selectedDmUserId}
                placeholder={`Message @${safeData.currentDmUser.username || 'user'}`}
              />
            </div>
          </div>
        </div>
      </ChatAreaErrorBoundary>
    );
  }

  // No selection
  return (
    <ChatAreaErrorBoundary>
      <SafeEmptyState />
    </ChatAreaErrorBoundary>
  );
};