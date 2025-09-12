"use client";

import * as React from "react";
import { Volume2, VolumeX, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface VoiceChannelButtonProps {
  channelId: string;
  channelName: string;
  channelType: "VOICE" | "STAGE";
  participantCount?: number;
  userLimit?: number;
  className?: string;
}

export function VoiceChannelButton({
  channelId,
  channelName,
  channelType,
  participantCount = 0,
  userLimit,
  className
}: VoiceChannelButtonProps) {
  const {
    isConnected,
    isConnecting,
    currentChannelId,
    connect,
    disconnect,
    getParticipantCount
  } = useVoiceStore();

  const { user } = useAuthStore();
  const { toast } = useToast();

  const isCurrentChannel = currentChannelId === channelId;
  const isInVoiceChannel = isConnected && isCurrentChannel;
  const canJoin = !userLimit || participantCount < userLimit;

  const handleVoiceChannelClick = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to join voice channels.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isInVoiceChannel) {
        // Already in this voice channel, disconnect
        await disconnect();
        toast({
          title: "Disconnected",
          description: `Left voice channel "${channelName}".`,
        });
      } else if (isConnected && currentChannelId !== channelId) {
        // In a different voice channel, switch
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        await connect(channelId);
        toast({
          title: "Switched Voice Channels",
          description: `Now connected to "${channelName}".`,
        });
      } else {
        // Not in any voice channel, join this one
        if (!canJoin) {
          toast({
            title: "Channel Full",
            description: `Voice channel "${channelName}" is at capacity.`,
            variant: "destructive",
          });
          return;
        }

        await connect(channelId);
        toast({
          title: "Connected",
          description: `Joined voice channel "${channelName}".`,
        });
      }
    } catch (error) {
      console.error('Voice channel action failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to join voice channel. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isInVoiceChannel ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "justify-start gap-2 w-full h-8 px-2",
              isInVoiceChannel && "bg-green-900/30 hover:bg-green-900/40 text-green-300",
              !canJoin && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={handleVoiceChannelClick}
            disabled={isConnecting || !canJoin}
          >
            {isConnecting && isCurrentChannel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isInVoiceChannel ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            
            <span className="flex-1 text-left truncate text-sm">
              {channelName}
            </span>
            
            {participantCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                <span>{participantCount}</span>
                {userLimit && <span>/{userLimit}</span>}
              </div>
            )}
          </Button>
        </TooltipTrigger>
        
        <TooltipContent side="right">
          <div className="text-sm">
            <p className="font-medium">{channelName}</p>
            <p className="text-gray-300">
              {channelType === "STAGE" ? "Stage Channel" : "Voice Channel"}
            </p>
            {participantCount > 0 && (
              <p className="text-gray-400">
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
                {userLimit && ` (max ${userLimit})`}
              </p>
            )}
            {isInVoiceChannel ? (
              <p className="text-green-400 mt-1">Click to disconnect</p>
            ) : canJoin ? (
              <p className="text-blue-400 mt-1">Click to join</p>
            ) : (
              <p className="text-red-400 mt-1">Channel is full</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}