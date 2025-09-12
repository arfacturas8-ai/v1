"use client";

import * as React from "react";
import { Mic, MicOff, PhoneOff, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimpleVoiceStore } from "@/lib/stores/simple-voice-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SimpleVoiceControls() {
  const {
    isConnected,
    isConnecting,
    currentChannelId,
    isMuted,
    participants,
    toggleMute,
    disconnect,
    error
  } = useSimpleVoiceStore();

  const { user } = useAuthStore();

  // Don't show if not connected or connecting
  if (!isConnected && !isConnecting) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-4">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              <span className="text-sm font-medium text-green-400">
                {isConnecting ? 'Connecting...' : 'Connected to Voice'}
              </span>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-red-400 hover:text-red-300"
                  onClick={disconnect}
                  disabled={isConnecting}
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-2 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Participants */}
          {participants.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.sid}
                    className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg"
                  >
                    <div className="relative">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {participant.name[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isSpeaking && (
                        <div className="absolute -inset-0.5 rounded-full border-2 border-green-500 animate-pulse" />
                      )}
                    </div>
                    
                    <span className="text-sm text-gray-300 flex-1 truncate">
                      {participant.name}
                    </span>
                    
                    {participant.isMuted && (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Controls */}
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>
                    {user.displayName?.[0] || user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-gray-400">#{user.username}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
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
                      disabled={isConnecting}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? "Unmute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}