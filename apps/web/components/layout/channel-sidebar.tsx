"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Hash, Volume2, Settings, Plus, UserPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChannelType } from "@/lib/types";
import { DirectMessageList } from "./direct-message-list";

interface ChannelCategoryProps {
  name: string;
  channels: Array<{
    id: string;
    name: string;
    type: ChannelType;
    unreadCount?: number;
    isSelected?: boolean;
    onClick?: () => void;
  }>;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

function ChannelCategory({ name, channels, isCollapsed = false, onToggle }: ChannelCategoryProps) {
  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        className="w-full justify-start px-2 py-1 h-auto text-xs font-semibold text-gray-400 hover:text-gray-300 uppercase tracking-wide"
        onClick={onToggle}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 mr-1" />
        ) : (
          <ChevronDown className="w-3 h-3 mr-1" />
        )}
        {name}
      </Button>
      
      {!isCollapsed && (
        <div className="space-y-0.5">
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant="ghost"
              className={cn(
                "w-full justify-start px-2 py-1.5 h-auto text-sm font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md",
                channel.isSelected && "bg-gray-600 text-white"
              )}
              onClick={channel.onClick}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {channel.type === ChannelType.TEXT ? (
                  <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="truncate">{channel.name}</span>
              </div>
              
              {channel.unreadCount && channel.unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChannelSidebar() {
  const { 
    selectedServerId, 
    selectedChannelId, 
    servers, 
    channels, 
    selectChannel 
  } = useChatStore();
  const { openModal, searchQuery, setSearchQuery } = useUIStore();
  const { currentChannelId } = useVoiceStore();

  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

  const currentServer = selectedServerId ? servers[selectedServerId] : null;
  
  // Filter channels by server
  const serverChannels = React.useMemo(() => {
    if (!currentServer) return [];
    
    return currentServer.channels.map(channel => ({
      ...channel,
      isSelected: selectedChannelId === channel.id,
      onClick: () => {
        selectChannel(channel.id);
        socket.joinChannel(channel.id);
        
        // Leave previous voice channel if switching to a different one
        if (channel.type === ChannelType.VOICE && currentChannelId && currentChannelId !== channel.id) {
          socket.leaveVoiceChannel();
        }
      }
    }));
  }, [currentServer, selectedChannelId, selectChannel]);

  // Group channels by category
  const channelsByCategory = React.useMemo(() => {
    const textChannels = serverChannels.filter(c => c.type === ChannelType.TEXT);
    const voiceChannels = serverChannels.filter(c => c.type === ChannelType.VOICE);
    
    return {
      text: textChannels,
      voice: voiceChannels
    };
  }, [serverChannels]);

  const toggleCategory = (categoryName: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryName)) {
      newCollapsed.delete(categoryName);
    } else {
      newCollapsed.add(categoryName);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleInviteUsers = () => {
    if (currentServer) {
      openModal("invite-users", { serverId: currentServer.id });
    }
  };

  const handleServerSettings = () => {
    if (currentServer) {
      openModal("server-settings", { serverId: currentServer.id });
    }
  };

  const handleCreateChannel = (type: ChannelType) => {
    if (currentServer) {
      openModal("create-channel", { serverId: currentServer.id, type });
    }
  };

  // Show direct messages when no server is selected
  if (!selectedServerId) {
    return (
      <div className="flex flex-col h-full bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Direct Messages</h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations"
              className="pl-9 bg-gray-900 border-gray-600 text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Direct Message List */}
        <ScrollArea className="flex-1">
          <DirectMessageList searchQuery={searchQuery} />
        </ScrollArea>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gray-800">
        {/* Server Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold truncate">
              {currentServer?.name || "Unknown Server"}
            </h2>
            
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-gray-400 hover:text-white"
                    onClick={handleInviteUsers}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Invite Members</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-gray-400 hover:text-white"
                    onClick={handleServerSettings}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Server Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Channel List */}
        <ScrollArea className="flex-1 p-2">
          {/* Text Channels */}
          {channelsByCategory.text.length > 0 && (
            <ChannelCategory
              name="Text Channels"
              channels={channelsByCategory.text}
              isCollapsed={collapsedCategories.has("text")}
              onToggle={() => toggleCategory("text")}
            />
          )}

          {/* Voice Channels */}
          {channelsByCategory.voice.length > 0 && (
            <ChannelCategory
              name="Voice Channels"
              channels={channelsByCategory.voice.map(channel => ({
                ...channel,
                unreadCount: currentChannelId === channel.id ? 1 : 0, // Show indicator if connected
              }))}
              isCollapsed={collapsedCategories.has("voice")}
              onToggle={() => toggleCategory("voice")}
            />
          )}
        </ScrollArea>

        {/* Create Channel Button */}
        <div className="p-2 border-t border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={() => handleCreateChannel(ChannelType.TEXT)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Channel
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}