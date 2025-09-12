"use client";

import * as React from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  PhoneOff, 
  Settings, 
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Users,
  Grid3X3,
  Presentation,
  PictureInPicture,
  Pin,
  PinOff,
  MoreHorizontal,
  MessageSquare,
  UserPlus,
  Copy,
  Share2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { VoiceParticipant, User } from "@/lib/types";

interface FullScreenVideoCallProps {
  isVisible: boolean;
  onClose: () => void;
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
  videoStream?: MediaStream;
  audioLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  isPinned?: boolean;
}

type ViewMode = 'grid' | 'speaker' | 'presentation' | 'gallery';

export function FullScreenVideoCall({ isVisible, onClose }: FullScreenVideoCallProps) {
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
    volume,
    setVolume,
    networkQuality,
    bandwidthKbps,
    latencyMs,
    packetLoss
  } = useVoiceStore();

  const { channels } = useChatStore();
  const { openModal } = useUIStore();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [pinnedParticipant, setPinnedParticipant] = React.useState<string | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const [showParticipantsList, setShowParticipantsList] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  
  const videoRefs = React.useRef<Map<string, HTMLVideoElement>>(new Map());
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentChannel = currentChannelId ? channels[currentChannelId] : null;
  
  // Convert participants to video participants with enhanced data
  const videoParticipants: VideoParticipant[] = React.useMemo(() => {
    if (!user) return [];
    
    return Object.values(participants).map(participant => ({
      userId: participant.userId,
      user: participant.user,
      hasVideo: hasVideo && participant.userId === user.id, // Mock video for demo
      hasAudio: !participant.isMuted,
      isSpeaking: participant.isSpeaking,
      isScreenSharing: isScreenSharing && participant.userId === user.id,
      audioLevel: Math.random() * 100, // Mock audio level
      connectionQuality: ['excellent', 'good', 'poor', 'critical'][Math.floor(Math.random() * 4)] as any,
      isPinned: pinnedParticipant === participant.userId
    }));
  }, [participants, hasVideo, isScreenSharing, user, pinnedParticipant]);

  const speakingParticipant = videoParticipants.find(p => p.isSpeaking);
  const screenSharingParticipant = videoParticipants.find(p => p.isScreenSharing);
  const pinnedParticipantData = videoParticipants.find(p => p.isPinned);

  // Handle mouse movement for controls auto-hide
  React.useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (isVisible) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [isVisible]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'm':
        case 'M':
          if (!e.ctrlKey && !e.metaKey) {
            toggleMute();
            e.preventDefault();
          }
          break;
        case 'v':
        case 'V':
          if (!e.ctrlKey && !e.metaKey) {
            toggleVideo();
            e.preventDefault();
          }
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            toggleScreenShare();
            e.preventDefault();
          }
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            toggleFullScreen();
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, toggleMute, toggleVideo, toggleScreenShare, onClose]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const handlePinParticipant = (userId: string) => {
    setPinnedParticipant(pinnedParticipant === userId ? null : userId);
  };

  const handleInviteUsers = () => {
    const inviteUrl = `${window.location.origin}/channels/${currentChannelId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Invite link copied",
      description: "Share this link to invite others to the call"
    });
  };

  const renderParticipantVideo = (participant: VideoParticipant, isPrimary = false, className = "") => {
    const videoKey = `video-${participant.userId}`;
    
    return (
      <Card 
        key={participant.userId}
        className={cn(
          "relative overflow-hidden transition-all duration-300 cursor-pointer group bg-gray-900 border-gray-700",
          isPrimary ? "aspect-video" : "aspect-video",
          participant.isSpeaking && "ring-2 ring-green-500 ring-opacity-75 shadow-lg shadow-green-500/20",
          participant.isPinned && "ring-2 ring-blue-500 ring-opacity-75 shadow-lg shadow-blue-500/20",
          className
        )}
        onClick={() => !isPrimary && handlePinParticipant(participant.userId)}
      >
        <CardContent className="p-0 h-full relative">
          {/* Video/Avatar Display */}
          {participant.hasVideo ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(videoKey, el);
              }}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={participant.userId === user?.id}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Avatar size={isPrimary ? "2xl" : "xl"}>
                  <AvatarImage 
                    src={participant.user.avatar} 
                    alt={participant.user.username} 
                  />
                  <AvatarFallback className={cn(
                    "text-2xl font-semibold",
                    isPrimary ? "text-4xl" : "text-2xl"
                  )}>
                    {participant.user.displayName?.[0] || participant.user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-4 text-gray-300 font-medium">
                  {participant.user.displayName || participant.user.username}
                </p>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <div className={cn(
            "absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            showControls ? "opacity-100" : ""
          )}>
            {/* Top Controls */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              {/* Connection Quality */}
              <Badge 
                variant={participant.connectionQuality === 'excellent' ? 'default' : 
                        participant.connectionQuality === 'good' ? 'secondary' :
                        participant.connectionQuality === 'poor' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {participant.connectionQuality}
              </Badge>
              
              {/* Screen Share Indicator */}
              {participant.isScreenSharing && (
                <Badge className="bg-green-600 text-white text-xs">
                  <Monitor className="w-3 h-3 mr-1" />
                  Screen
                </Badge>
              )}
            </div>

            {/* Top Right Controls */}
            <div className="absolute top-3 right-3 flex items-center space-x-1">
              {participant.isPinned && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 bg-blue-600/80 text-white hover:bg-blue-700/80"
                >
                  <Pin className="w-4 h-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 bg-black/50 text-white hover:bg-black/70"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePinParticipant(participant.userId)}>
                    {participant.isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                    {participant.isPinned ? 'Unpin' : 'Pin'} Participant
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Adjust Volume
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Speaking Indicator */}
          {participant.isSpeaking && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Speaking
              </div>
            </div>
          )}

          {/* Audio/Video Status */}
          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            {!participant.hasAudio && (
              <div className="bg-red-600 text-white p-1.5 rounded-full">
                <MicOff className="w-3 h-3" />
              </div>
            )}
            {!participant.hasVideo && participant.hasAudio && (
              <div className="bg-gray-600 text-white p-1.5 rounded-full">
                <VideoOff className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Participant Name */}
          <div className="absolute bottom-3 right-3 bg-black/75 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {participant.user.displayName || participant.user.username}
            {participant.userId === user?.id && " (You)"}
          </div>

          {/* Audio Level Indicator */}
          {participant.hasAudio && participant.audioLevel > 10 && (
            <div className="absolute left-0 bottom-0 w-full h-1 bg-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                style={{ width: `${Math.min(100, participant.audioLevel)}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGridView = () => {
    const participantCount = videoParticipants.length;
    let gridCols = 1;
    
    if (participantCount <= 1) gridCols = 1;
    else if (participantCount <= 4) gridCols = 2;
    else if (participantCount <= 9) gridCols = 3;
    else gridCols = 4;
    
    return (
      <div 
        className={cn(
          "grid gap-4 h-full p-4",
          `grid-cols-${gridCols}`
        )}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
        }}
      >
        {videoParticipants.map(participant => 
          renderParticipantVideo(participant)
        )}
      </div>
    );
  };

  const renderSpeakerView = () => {
    const primaryParticipant = pinnedParticipantData || speakingParticipant || videoParticipants[0];
    const secondaryParticipants = videoParticipants.filter(p => p.userId !== primaryParticipant?.userId);

    return (
      <div className="flex h-full gap-4 p-4">
        <div className="flex-1 min-w-0">
          {primaryParticipant && renderParticipantVideo(primaryParticipant, true)}
        </div>
        {secondaryParticipants.length > 0 && (
          <div className="w-64 flex flex-col gap-3 overflow-y-auto">
            {secondaryParticipants.slice(0, 6).map(participant => 
              renderParticipantVideo(participant, false, "h-32")
            )}
            {secondaryParticipants.length > 6 && (
              <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">+{secondaryParticipants.length - 6} more</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPresentationView = () => {
    if (screenSharingParticipant) {
      const otherParticipants = videoParticipants.filter(p => !p.isScreenSharing);
      
      return (
        <div className="flex h-full gap-4 p-4">
          <div className="flex-1 min-w-0">
            {renderParticipantVideo(screenSharingParticipant, true)}
          </div>
          {otherParticipants.length > 0 && (
            <div className="w-64 flex flex-col gap-3 overflow-y-auto">
              {otherParticipants.slice(0, 6).map(participant => 
                renderParticipantVideo(participant, false, "h-32")
              )}
            </div>
          )}
        </div>
      );
    }
    
    return renderGridView();
  };

  const renderGalleryView = () => {
    return (
      <div className="grid grid-cols-6 gap-2 h-full p-4">
        {videoParticipants.slice(0, 24).map(participant => 
          renderParticipantVideo(participant, false, "h-20")
        )}
      </div>
    );
  };

  // Don't render if not visible or not connected
  if (!isVisible || !isConnected || !currentChannel || !user) {
    return null;
  }

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black text-white overflow-hidden"
      >
        {/* Header */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-semibold">{currentChannel.name}</span>
                <Badge variant="secondary">
                  {videoParticipants.length} participant{videoParticipants.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Network Quality */}
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={networkQuality === 'excellent' ? 'default' : 
                            networkQuality === 'good' ? 'secondary' :
                            networkQuality === 'poor' ? 'destructive' : 'outline'}
                  >
                    {bandwidthKbps}kbps • {latencyMs}ms • {packetLoss.toFixed(1)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p>Connection: {networkQuality}</p>
                    <p>Bandwidth: {bandwidthKbps} kbps</p>
                    <p>Latency: {latencyMs} ms</p>
                    <p>Packet Loss: {packetLoss.toFixed(1)}%</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="h-full pt-16">
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'speaker' && renderSpeakerView()}
          {viewMode === 'presentation' && renderPresentationView()}
          {viewMode === 'gallery' && renderGalleryView()}
        </div>

        {/* Bottom Controls */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-2">
              {/* View Mode Buttons */}
              <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8",
                        viewMode === 'grid' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                      )}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Grid View</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8",
                        viewMode === 'speaker' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                      )}
                      onClick={() => setViewMode('speaker')}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Speaker View</p></TooltipContent>
                </Tooltip>

                {screenSharingParticipant && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8",
                          viewMode === 'presentation' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                        )}
                        onClick={() => setViewMode('presentation')}
                      >
                        <Presentation className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Presentation View</p></TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-8 h-8",
                        viewMode === 'gallery' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                      )}
                      onClick={() => setViewMode('gallery')}
                    >
                      <PictureInPicture className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Gallery View</p></TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-3">
              {/* Microphone */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full transition-all duration-200",
                      isMuted 
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30" 
                        : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    )}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMuted ? "Unmute (M)" : "Mute (M)"}</p></TooltipContent>
              </Tooltip>

              {/* Video */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full transition-all duration-200",
                      !hasVideo
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30" 
                        : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    )}
                    onClick={toggleVideo}
                  >
                    {hasVideo ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{hasVideo ? "Turn off camera (V)" : "Turn on camera (V)"}</p></TooltipContent>
              </Tooltip>

              {/* Screen Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full transition-all duration-200",
                      isScreenSharing
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30" 
                        : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    )}
                    onClick={toggleScreenShare}
                  >
                    {isScreenSharing ? <Monitor className="w-6 h-6" /> : <MonitorOff className="w-6 h-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isScreenSharing ? "Stop sharing (Ctrl+S)" : "Share screen (Ctrl+S)"}</p></TooltipContent>
              </Tooltip>

              {/* Disconnect */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg shadow-red-500/30"
                    onClick={handleDisconnect}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Leave call</p></TooltipContent>
              </Tooltip>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Chat Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-200",
                      showChat ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle chat</p></TooltipContent>
              </Tooltip>

              {/* Participants List */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-200",
                      showParticipantsList ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    onClick={() => setShowParticipantsList(!showParticipantsList)}
                  >
                    <Users className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Participants</p></TooltipContent>
              </Tooltip>

              {/* Invite Users */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                    onClick={handleInviteUsers}
                  >
                    <UserPlus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Invite users</p></TooltipContent>
              </Tooltip>

              {/* Settings */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                    onClick={() => openModal("voice-settings")}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Settings</p></TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                    onClick={toggleFullScreen}
                  >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle fullscreen (F)</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="absolute top-20 left-4 text-xs text-white/50 space-y-1">
          <p>Press M to mute/unmute</p>
          <p>Press V for camera</p>
          <p>Press Ctrl+S for screen share</p>
          <p>Press F for fullscreen</p>
          <p>Press ESC to exit</p>
        </div>
      </div>
    </TooltipProvider>
  );
}