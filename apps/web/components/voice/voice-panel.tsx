"use client";

import * as React from "react";
import { 
  Mic, 
  MicOff, 
  Headphones, 
  HeadphonesIcon, 
  Settings, 
  PhoneOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusIndicator } from "@/components/ui/status-indicator";

export function VoicePanel() {
  const {
    isConnected,
    currentChannelId,
    isMuted,
    isDeafened,
    hasVideo,
    isScreenSharing,
    participants,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    disconnect,
  } = useVoiceStore();

  const { channels, users } = useChatStore();
  const { openModal } = useUIStore();
  const { user } = useAuthStore();

  const currentChannel = currentChannelId ? channels[currentChannelId] : null;
  const participantsList = Object.values(participants);

  // Don't show panel if not connected to voice
  if (!isConnected || !currentChannel || !user) {
    return null;
  }

  const handleDisconnect = () => {
    disconnect();
  };

  const handleVoiceSettings = () => {
    openModal("voice-settings");
  };

  return (
    <TooltipProvider>
      <div className="bg-gray-900 border-t border-gray-700">
        {/* Voice channel header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-400 truncate">
              Connected to {currentChannel.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white"
                  onClick={handleVoiceSettings}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-red-400 hover:text-red-300"
                  onClick={handleDisconnect}
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator />

        {/* Participants */}
        {participantsList.length > 1 && (
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {participantsList
                .filter(p => p.userId !== user.id)
                .slice(0, 8) // Limit displayed participants
                .map((participant) => (
                  <Tooltip key={participant.userId}>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-2 py-1">
                        <div className="relative">
                          <Avatar size="xs">
                            <AvatarImage 
                              src={participant.user.avatar} 
                              alt={participant.user.username} 
                            />
                            <AvatarFallback className="text-xs">
                              {participant.user.displayName?.[0] || participant.user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          {participant.isSpeaking && (
                            <div className="absolute -inset-0.5 rounded-full border-2 border-green-500 animate-pulse" />
                          )}
                        </div>
                        
                        <span className="text-xs text-gray-300 truncate max-w-20">
                          {participant.user.displayName || participant.user.username}
                        </span>
                        
                        {participant.isMuted && (
                          <MicOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {participant.user.displayName || participant.user.username}
                        {participant.isSpeaking && " (Speaking)"}
                        {participant.isMuted && " (Muted)"}
                        {participant.isDeafened && " (Deafened)"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              
              {participantsList.length > 9 && (
                <div className="flex items-center space-x-1 bg-gray-800 rounded-lg px-2 py-1">
                  <span className="text-xs text-gray-400">
                    +{participantsList.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Current user controls */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* User info */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative">
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
            
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-xs text-gray-400">#{user.username}</p>
            </div>
          </div>

          {/* Voice controls */}
          <div className="flex items-center space-x-1">
            {/* Microphone */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10",
                    isMuted 
                      ? "text-red-400 hover:text-red-300 bg-red-900/20" 
                      : "text-gray-400 hover:text-white"
                  )}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "Unmute" : "Mute"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Headphones/Deafen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10",
                    isDeafened 
                      ? "text-red-400 hover:text-red-300 bg-red-900/20" 
                      : "text-gray-400 hover:text-white"
                  )}
                  onClick={toggleDeafen}
                >
                  {isDeafened ? (
                    <HeadphonesIcon className="w-5 h-5" />
                  ) : (
                    <Headphones className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDeafened ? "Undeafen" : "Deafen"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Video */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10",
                    hasVideo 
                      ? "text-blue-400 hover:text-blue-300 bg-blue-900/20" 
                      : "text-gray-400 hover:text-white"
                  )}
                  onClick={toggleVideo}
                >
                  {hasVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasVideo ? "Turn off camera" : "Turn on camera"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Screen Share */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10",
                    isScreenSharing 
                      ? "text-green-400 hover:text-green-300 bg-green-900/20" 
                      : "text-gray-400 hover:text-white"
                  )}
                  onClick={toggleScreenShare}
                >
                  {isScreenSharing ? (
                    <Monitor className="w-5 h-5" />
                  ) : (
                    <MonitorOff className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}