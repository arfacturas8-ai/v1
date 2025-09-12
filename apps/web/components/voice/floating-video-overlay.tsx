"use client";

import * as React from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Volume2,
  VolumeX,
  Move3D,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface FloatingVideoOverlayProps {
  onExpand?: () => void;
  onClose?: () => void;
  isDraggable?: boolean;
  defaultPosition?: { x: number; y: number };
  isPinned?: boolean;
  onPin?: (pinned: boolean) => void;
}

interface VideoParticipant {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
}

export function FloatingVideoOverlay({ 
  onExpand,
  onClose,
  isDraggable = true,
  defaultPosition = { x: 20, y: 20 },
  isPinned = false,
  onPin
}: FloatingVideoOverlayProps) {
  const {
    isConnected,
    currentChannelId,
    isMuted,
    hasVideo,
    isScreenSharing,
    participants,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    disconnect,
    volume,
    setVolume
  } = useVoiceStore();

  const { channels } = useChatStore();
  const { user } = useAuthStore();

  const [position, setPosition] = React.useState(defaultPosition);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [showControls, setShowControls] = React.useState(false);
  const [pinnedState, setPinnedState] = React.useState(isPinned);
  
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<Map<string, HTMLVideoElement>>(new Map());

  const currentChannel = currentChannelId ? channels[currentChannelId] : null;
  
  // Convert participants to video participants
  const videoParticipants: VideoParticipant[] = React.useMemo(() => {
    if (!user) return [];
    
    return Object.values(participants).map(participant => ({
      userId: participant.userId,
      user: participant.user,
      hasVideo: hasVideo && participant.userId === user.id, // Mock video for demo
      hasAudio: !participant.isMuted,
      isSpeaking: participant.isSpeaking,
      isScreenSharing: isScreenSharing && participant.userId === user.id,
      audioLevel: Math.random() * 100 // Mock audio level
    }));
  }, [participants, hasVideo, isScreenSharing, user]);

  const speakingParticipant = videoParticipants.find(p => p.isSpeaking);
  const screenSharingParticipant = videoParticipants.find(p => p.isScreenSharing);
  const primaryParticipant = screenSharingParticipant || speakingParticipant || videoParticipants[0];

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || pinnedState) return;
    
    setIsDragging(true);
    const rect = overlayRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !isDraggable || pinnedState) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 320; // Assuming 320px width
    const maxY = window.innerHeight - 240; // Assuming 240px height
    
    newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
    newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    
    setPosition(newPosition);
  }, [isDragging, isDraggable, dragOffset, pinnedState]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Auto-hide controls
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const handleDisconnect = () => {
    disconnect();
    if (onClose) onClose();
  };

  const handlePin = () => {
    const newPinnedState = !pinnedState;
    setPinnedState(newPinnedState);
    if (onPin) onPin(newPinnedState);
  };

  const renderParticipantVideo = (participant: VideoParticipant) => {
    const videoKey = `floating-video-${participant.userId}`;
    
    return (
      <div key={participant.userId} className="relative h-full">
        {participant.hasVideo ? (
          <video
            ref={(el) => {
              if (el) videoRefs.current.set(videoKey, el);
            }}
            className="w-full h-full object-cover rounded-lg"
            autoPlay
            playsInline
            muted={participant.userId === user?.id}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
            <Avatar size="lg">
              <AvatarImage 
                src={participant.user.avatar} 
                alt={participant.user.username} 
              />
              <AvatarFallback>
                {participant.user.displayName?.[0] || participant.user.username[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Speaking Indicator */}
        {participant.isSpeaking && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
        
        {/* Screen Share Indicator */}
        {participant.isScreenSharing && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-600 text-white text-xs">
              <Monitor className="w-3 h-3" />
            </Badge>
          </div>
        )}
        
        {/* Audio/Video Status */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-1">
          {!participant.hasAudio && (
            <div className="bg-red-500 text-white p-1 rounded-full">
              <MicOff className="w-3 h-3" />
            </div>
          )}
          {!participant.hasVideo && participant.hasAudio && (
            <div className="bg-gray-500 text-white p-1 rounded-full">
              <VideoOff className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {/* Participant Name */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
          {participant.user.displayName || participant.user.username}
          {participant.userId === user?.id && " (You)"}
        </div>
        
        {/* Audio Level */}
        {participant.hasAudio && participant.audioLevel > 10 && (
          <div className="absolute left-0 bottom-0 w-full h-1 bg-gray-600 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-green-400 transition-all duration-100"
              style={{ width: `${Math.min(100, participant.audioLevel)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // Don't render if not connected
  if (!isConnected || !currentChannel || !user || videoParticipants.length === 0) {
    return null;
  }

  if (isMinimized) {
    return (
      <TooltipProvider>
        <div
          ref={overlayRef}
          className={cn(
            "fixed z-40 transition-all duration-300",
            pinnedState ? "cursor-default" : "cursor-move"
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
          onMouseDown={handleMouseDown}
        >
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-3 flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-white font-medium">
                {currentChannel.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {videoParticipants.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-gray-400 hover:text-white"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div
        ref={overlayRef}
        className={cn(
          "fixed z-40 transition-all duration-300",
          isDragging ? "cursor-grabbing" : pinnedState ? "cursor-default" : "cursor-grab"
        )}
        style={{
          left: position.x,
          top: position.y,
          width: "320px",
          height: "240px"
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <Card className="h-full bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-2xl overflow-hidden">
          <CardContent className="p-0 h-full relative">
            {/* Header */}
            <div className={cn(
              "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-2 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-white font-medium truncate">
                    {currentChannel.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {videoParticipants.length}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-white"
                        onClick={handlePin}
                      >
                        {pinnedState ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{pinnedState ? 'Unpin' : 'Pin'} overlay</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-white"
                        onClick={() => setIsMinimized(true)}
                      >
                        <Minimize2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Minimize</p></TooltipContent>
                  </Tooltip>
                  
                  {onExpand && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-gray-400 hover:text-white"
                          onClick={onExpand}
                        >
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Expand to full screen</p></TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-red-400 hover:text-red-300"
                        onClick={handleDisconnect}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Leave call</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            
            {/* Main Video Area */}
            <div className="h-full relative">
              {primaryParticipant ? (
                <div className="h-full">
                  {renderParticipantVideo(primaryParticipant)}
                </div>
              ) : (
                <div className="h-full bg-gray-800 flex items-center justify-center rounded-lg">
                  <div className="text-center text-gray-400">
                    <Video className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No video</p>
                  </div>
                </div>
              )}
              
              {/* Secondary participants preview */}
              {videoParticipants.length > 1 && (
                <div className="absolute top-2 right-2 flex space-x-1">
                  {videoParticipants
                    .filter(p => p.userId !== primaryParticipant?.userId)
                    .slice(0, 3)
                    .map(participant => (
                      <div key={participant.userId} className="w-8 h-8 relative">
                        {participant.hasVideo ? (
                          <video
                            className="w-full h-full object-cover rounded border border-gray-600"
                            autoPlay
                            playsInline
                            muted
                          />
                        ) : (
                          <Avatar size="xs" className="border border-gray-600">
                            <AvatarImage src={participant.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {participant.user.displayName?.[0] || participant.user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {participant.isSpeaking && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </div>
                    ))}
                  {videoParticipants.length > 4 && (
                    <div className="w-8 h-8 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-300">
                        +{videoParticipants.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Bottom Controls */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}>
              <div className="flex items-center justify-center space-x-2">
                {/* Microphone */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8 rounded-full",
                        isMuted 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-white/20 hover:bg-white/30 text-white"
                      )}
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isMuted ? "Unmute" : "Mute"}</p></TooltipContent>
                </Tooltip>
                
                {/* Video */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8 rounded-full",
                        !hasVideo
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-white/20 hover:bg-white/30 text-white"
                      )}
                      onClick={toggleVideo}
                    >
                      {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{hasVideo ? "Turn off camera" : "Turn on camera"}</p></TooltipContent>
                </Tooltip>
                
                {/* Screen Share */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8 rounded-full",
                        isScreenSharing
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-white/20 hover:bg-white/30 text-white"
                      )}
                      onClick={toggleScreenShare}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p></TooltipContent>
                </Tooltip>
                
                {/* Volume */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => setVolume(volume > 0 ? 0 : 100)}
                    >
                      {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{volume > 0 ? "Mute audio" : "Unmute audio"}</p></TooltipContent>
                </Tooltip>
                
                {/* Disconnect */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDisconnect}
                    >
                      <PhoneOff className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Leave call</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Drag Handle */}
            {!pinnedState && (
              <div className={cn(
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300",
                showControls ? "opacity-0" : "opacity-30 hover:opacity-60"
              )}>
                <Move3D className="w-6 h-6 text-white" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}