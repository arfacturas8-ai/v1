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
  PictureInPicture
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface VideoCallPanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showControls?: boolean;
  className?: string;
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
}

export function VideoCallPanel({ 
  isExpanded = false, 
  onToggleExpand, 
  showControls = true,
  className 
}: VideoCallPanelProps) {
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
    setVolume
  } = useVoiceStore();

  const { channels } = useChatStore();
  const { openModal } = useUIStore();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = React.useState<'grid' | 'speaker' | 'presentation'>('grid');
  const [isPiP, setIsPiP] = React.useState(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<string | null>(null);
  const videoRefs = React.useRef<Map<string, HTMLVideoElement>>(new Map());

  const currentChannel = currentChannelId ? channels[currentChannelId] : null;
  
  // Convert participants to video participants with mock video streams for demo
  const videoParticipants: VideoParticipant[] = React.useMemo(() => {
    return Object.values(participants).map(participant => ({
      userId: participant.userId,
      user: participant.user,
      hasVideo: hasVideo && participant.userId === user?.id, // Only show video for current user in demo
      hasAudio: !participant.isMuted,
      isSpeaking: participant.isSpeaking,
      isScreenSharing: isScreenSharing && participant.userId === user?.id,
      audioLevel: Math.random() * 100 // Mock audio level
    }));
  }, [participants, hasVideo, isScreenSharing, user?.id]);

  const speakingParticipant = videoParticipants.find(p => p.isSpeaking);
  const screenSharingParticipant = videoParticipants.find(p => p.isScreenSharing);

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

  const handleTogglePiP = () => {
    setIsPiP(!isPiP);
  };

  const handleViewModeChange = (mode: 'grid' | 'speaker' | 'presentation') => {
    setViewMode(mode);
  };

  const renderParticipantVideo = (participant: VideoParticipant, isPrimary = false) => {
    const videoKey = `video-${participant.userId}`;
    
    return (
      <Card 
        key={participant.userId}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          isPrimary ? "aspect-video" : "aspect-video",
          participant.isSpeaking && "ring-2 ring-green-500 ring-opacity-75",
          selectedParticipant === participant.userId && "ring-2 ring-blue-500"
        )}
        onClick={() => setSelectedParticipant(participant.userId)}
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
              muted={participant.userId === user.id}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Avatar size={isPrimary ? "xl" : "lg"}>
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

          {/* Screen Share Indicator */}
          {participant.isScreenSharing && (
            <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
              <Monitor className="w-3 h-3 inline mr-1" />
              Sharing Screen
            </div>
          )}

          {/* Speaking Indicator */}
          {participant.isSpeaking && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}

          {/* Audio/Video Status */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-1">
            {!participant.hasAudio && (
              <div className="bg-red-600 text-white p-1 rounded">
                <MicOff className="w-3 h-3" />
              </div>
            )}
            {!participant.hasVideo && participant.hasAudio && (
              <div className="bg-gray-600 text-white p-1 rounded">
                <VideoOff className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Participant Name */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {participant.user.displayName || participant.user.username}
            {participant.userId === user.id && " (You)"}
          </div>

          {/* Audio Level Indicator */}
          {participant.hasAudio && participant.audioLevel > 10 && (
            <div className="absolute left-0 bottom-0 w-full h-1 bg-gray-700">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${Math.min(100, participant.audioLevel)}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGridView = () => {
    const gridCols = Math.ceil(Math.sqrt(videoParticipants.length));
    
    return (
      <div 
        className={cn(
          "grid gap-2 h-full",
          gridCols === 1 && "grid-cols-1",
          gridCols === 2 && "grid-cols-2",
          gridCols === 3 && "grid-cols-3",
          gridCols >= 4 && "grid-cols-4"
        )}
      >
        {videoParticipants.map(participant => renderParticipantVideo(participant))}
      </div>
    );
  };

  const renderSpeakerView = () => {
    const primaryParticipant = speakingParticipant || videoParticipants[0];
    const secondaryParticipants = videoParticipants.filter(p => p.userId !== primaryParticipant?.userId);

    return (
      <div className="flex h-full gap-2">
        <div className="flex-1">
          {primaryParticipant && renderParticipantVideo(primaryParticipant, true)}
        </div>
        {secondaryParticipants.length > 0 && (
          <div className="w-48 flex flex-col gap-2 overflow-y-auto">
            {secondaryParticipants.map(participant => 
              renderParticipantVideo(participant)
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
        <div className="flex h-full gap-2">
          <div className="flex-1">
            {renderParticipantVideo(screenSharingParticipant, true)}
          </div>
          {otherParticipants.length > 0 && (
            <div className="w-48 flex flex-col gap-2 overflow-y-auto">
              {otherParticipants.map(participant => 
                renderParticipantVideo(participant)
              )}
            </div>
          )}
        </div>
      );
    }
    
    return renderGridView();
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "bg-gray-900 border-gray-700 transition-all duration-300",
        isExpanded ? "h-96" : "h-64",
        isPiP && "fixed top-4 right-4 w-80 h-48 z-50",
        className
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-gray-200 flex items-center">
              <Video className="w-4 h-4 mr-2" />
              {currentChannel.name} - {videoParticipants.length} participant{videoParticipants.length !== 1 ? 's' : ''}
            </CardTitle>
            
            <div className="flex items-center space-x-1">
              {/* View Mode Buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-6 h-6 text-gray-400",
                      viewMode === 'grid' && "text-blue-400"
                    )}
                    onClick={() => handleViewModeChange('grid')}
                  >
                    <Grid3X3 className="w-3 h-3" />
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
                      "w-6 h-6 text-gray-400",
                      viewMode === 'speaker' && "text-blue-400"
                    )}
                    onClick={() => handleViewModeChange('speaker')}
                  >
                    <Users className="w-3 h-3" />
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
                        "w-6 h-6 text-gray-400",
                        viewMode === 'presentation' && "text-blue-400"
                      )}
                      onClick={() => handleViewModeChange('presentation')}
                    >
                      <Presentation className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Presentation View</p></TooltipContent>
                </Tooltip>
              )}

              <Separator orientation="vertical" className="h-4" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-gray-400 hover:text-white"
                    onClick={handleTogglePiP}
                  >
                    <PictureInPicture className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Picture in Picture</p></TooltipContent>
              </Tooltip>

              {onToggleExpand && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-gray-400 hover:text-white"
                      onClick={onToggleExpand}
                    >
                      {isExpanded ? 
                        <Minimize2 className="w-3 h-3" /> : 
                        <Maximize2 className="w-3 h-3" />
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isExpanded ? 'Minimize' : 'Maximize'}</p></TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 h-full">
          {/* Video Grid */}
          <div className="h-full mb-4">
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'speaker' && renderSpeakerView()}
            {viewMode === 'presentation' && renderPresentationView()}
          </div>

          {/* Controls */}
          {showControls && (
            <>
              <Separator className="mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Microphone */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8",
                          isMuted 
                            ? "text-red-400 hover:text-red-300 bg-red-900/20" 
                            : "text-gray-400 hover:text-white"
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
                          "w-8 h-8",
                          hasVideo 
                            ? "text-blue-400 hover:text-blue-300 bg-blue-900/20" 
                            : "text-gray-400 hover:text-white"
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
                          "w-8 h-8",
                          isScreenSharing 
                            ? "text-green-400 hover:text-green-300 bg-green-900/20" 
                            : "text-gray-400 hover:text-white"
                        )}
                        onClick={toggleScreenShare}
                      >
                        {isScreenSharing ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p></TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Volume Control */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-gray-400 hover:text-white"
                        onClick={() => setVolume(volume > 0 ? 0 : 100)}
                      >
                        {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{volume > 0 ? "Mute Audio" : "Unmute Audio"}</p></TooltipContent>
                  </Tooltip>

                  {/* Settings */}
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
                    <TooltipContent><p>Video Settings</p></TooltipContent>
                  </Tooltip>

                  {/* Disconnect */}
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
                    <TooltipContent><p>Leave Call</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}