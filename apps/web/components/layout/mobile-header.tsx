"use client";

import * as React from "react";
import { Menu, Hash, Volume2, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ChannelType } from "@/lib/types";

export function MobileHeader() {
  const { 
    selectedServerId, 
    selectedChannelId, 
    selectedDmUserId,
    servers, 
    channels, 
    users 
  } = useChatStore();
  const { 
    showMobileMenu, 
    toggleMobileMenu, 
    openModal 
  } = useUIStore();
  const { participants } = useVoiceStore();

  const currentServer = selectedServerId ? servers[selectedServerId] : null;
  const currentChannel = selectedChannelId ? channels[selectedChannelId] : null;
  const currentDmUser = selectedDmUserId ? users[selectedDmUserId] : null;

  const getHeaderTitle = () => {
    if (currentChannel) {
      return currentChannel.name;
    }
    if (currentDmUser) {
      return currentDmUser.displayName || currentDmUser.username;
    }
    if (currentServer) {
      return currentServer.name;
    }
    return "CRYB Platform";
  };

  const getHeaderIcon = () => {
    if (currentChannel) {
      return currentChannel.type === ChannelType.TEXT ? (
        <Hash className="w-5 h-5 text-gray-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-gray-400" />
      );
    }
    if (currentDmUser) {
      return (
        <div className="relative">
          <Avatar size="sm">
            <AvatarImage src={currentDmUser.avatar} alt={currentDmUser.username} />
            <AvatarFallback>
              {currentDmUser.displayName?.[0] || currentDmUser.username[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
            <StatusIndicator status={currentDmUser.status} size="xs" />
          </div>
        </div>
      );
    }
    return null;
  };

  const getMemberCount = () => {
    if (currentChannel) {
      const voiceParticipants = Object.keys(participants).length;
      if (currentChannel.type === ChannelType.VOICE && voiceParticipants > 0) {
        return voiceParticipants;
      }
      return currentServer?.memberCount || 0;
    }
    return null;
  };

  const handleSearch = () => {
    openModal("search");
  };

  const handleMemberList = () => {
    if (currentChannel) {
      openModal("member-list", { channelId: currentChannel.id });
    }
  };

  return (
    <div className="flex items-center justify-between h-14 safe-area-top px-4 bg-gray-800 border-b border-gray-700">
      {/* Left side - Menu and channel info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white touch-target flex-shrink-0"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="flex-shrink-0">
            {getHeaderIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-semibold truncate text-responsive-sm">
              {getHeaderTitle()}
            </h1>
            {currentChannel && currentChannel.description && (
              <p className="text-xs text-gray-400 truncate hidden xs:block">
                {currentChannel.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white touch-target"
          onClick={handleSearch}
          aria-label="Search messages"
        >
          <Search className="w-5 h-5" />
        </Button>

        {currentChannel && (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white relative touch-target"
            onClick={handleMemberList}
            aria-label={`View member list (${getMemberCount()} members)`}
          >
            <Users className="w-5 h-5" />
            {getMemberCount() && getMemberCount()! > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {getMemberCount()! > 99 ? "99+" : getMemberCount()}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}