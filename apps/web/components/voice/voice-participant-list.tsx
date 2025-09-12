"use client";

import * as React from "react";
import { 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Monitor,
  Headphones,
  HeadphonesIcon,
  Volume2,
  VolumeX,
  Settings,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  Crown,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Smartphone,
  Monitor as MonitorIcon,
  Laptop
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VoiceParticipantListProps {
  isVisible?: boolean;
  showHeader?: boolean;
  maxHeight?: string;
  onInviteUsers?: () => void;
}

interface ExtendedVoiceParticipant {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    status?: 'online' | 'away' | 'busy' | 'invisible';
  };
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  joinedAt: Date;
  platform: 'desktop' | 'mobile' | 'web';
  permissions: {
    isOwner?: boolean;
    isAdmin?: boolean;
    isModerator?: boolean;
    canSpeak?: boolean;
    canVideo?: boolean;
    canScreenShare?: boolean;
  };
  volume: number; // Individual volume level for this participant
}

export function VoiceParticipantList({
  isVisible = true,
  showHeader = true,
  maxHeight = "400px",
  onInviteUsers
}: VoiceParticipantListProps) {
  const {
    isConnected,
    currentChannelId,
    participants,
    speakingUsers,
    volume: globalVolume,
    setVolume: setGlobalVolume
  } = useVoiceStore();

  const { channels } = useChatStore();
  const { user } = useAuthStore();

  const [participantVolumes, setParticipantVolumes] = React.useState<Record<string, number>>({});
  const [sortBy, setSortBy] = React.useState<'speaking' | 'joined' | 'name'>('speaking');
  const [showOfflineUsers, setShowOfflineUsers] = React.useState(false);

  const currentChannel = currentChannelId ? channels[currentChannelId] : null;

  // Convert participants to extended format with mock data
  const extendedParticipants: ExtendedVoiceParticipant[] = React.useMemo(() => {
    if (!user) return [];

    return Object.values(participants).map(participant => ({
      userId: participant.userId,
      user: {
        ...participant.user,
        status: 'online' as const
      },
      isSpeaking: participant.isSpeaking,
      isMuted: participant.isMuted,
      isDeafened: participant.isDeafened || false,
      hasVideo: participant.userId === user.id, // Mock - only current user has video
      isScreenSharing: participant.userId === user.id, // Mock - only current user is screen sharing
      audioLevel: participant.isSpeaking ? 60 + Math.random() * 40 : Math.random() * 20,
      connectionQuality: ['excellent', 'good', 'poor', 'critical'][Math.floor(Math.random() * 4)] as any,
      joinedAt: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
      platform: ['desktop', 'mobile', 'web'][Math.floor(Math.random() * 3)] as any,
      permissions: {
        isOwner: participant.userId === user.id,
        isAdmin: false,
        isModerator: false,
        canSpeak: true,
        canVideo: true,
        canScreenShare: true
      },
      volume: participantVolumes[participant.userId] || 100
    }));
  }, [participants, user, participantVolumes]);

  // Sort participants
  const sortedParticipants = React.useMemo(() => {
    const sorted = [...extendedParticipants];
    
    switch (sortBy) {
      case 'speaking':
        return sorted.sort((a, b) => {
          if (a.isSpeaking && !b.isSpeaking) return -1;
          if (!a.isSpeaking && b.isSpeaking) return 1;
          return (a.user.displayName || a.user.username).localeCompare(
            b.user.displayName || b.user.username
          );
        });
      case 'joined':
        return sorted.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      case 'name':
        return sorted.sort((a, b) => 
          (a.user.displayName || a.user.username).localeCompare(
            b.user.displayName || b.user.username
          )
        );
      default:
        return sorted;
    }
  }, [extendedParticipants, sortBy]);

  const handleVolumeChange = (userId: string, volume: number) => {
    setParticipantVolumes(prev => ({ ...prev, [userId]: volume }));
  };

  const getConnectionIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <SignalHigh className="w-3 h-3 text-green-500" />;
      case 'good': return <Signal className="w-3 h-3 text-yellow-500" />;
      case 'poor': return <SignalMedium className="w-3 h-3 text-orange-500" />;
      case 'critical': return <SignalZero className="w-3 h-3 text-red-500" />;
      default: return <SignalLow className="w-3 h-3 text-gray-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'desktop': return <MonitorIcon className="w-3 h-3" />;
      case 'mobile': return <Smartphone className="w-3 h-3" />;
      case 'web': return <Laptop className="w-3 h-3" />;
      default: return <MonitorIcon className="w-3 h-3" />;
    }
  };

  const getPermissionIcon = (participant: ExtendedVoiceParticipant) => {
    if (participant.permissions.isOwner) {
      return <Crown className="w-3 h-3 text-yellow-500" />;
    }
    if (participant.permissions.isAdmin) {
      return <ShieldCheck className="w-3 h-3 text-red-500" />;
    }
    if (participant.permissions.isModerator) {
      return <Shield className="w-3 h-3 text-blue-500" />;
    }
    return null;
  };

  const formatDuration = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const renderParticipant = (participant: ExtendedVoiceParticipant) => {
    const isCurrentUser = participant.userId === user?.id;
    
    return (
      <div
        key={participant.userId}
        className={cn(
          "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group hover:bg-gray-800/50",
          participant.isSpeaking && "bg-green-900/20 ring-1 ring-green-500/30",
          isCurrentUser && "bg-blue-900/20 ring-1 ring-blue-500/30"
        )}
      >
        {/* Avatar and Speaking Indicator */}
        <div className="relative flex-shrink-0">
          <Avatar size="sm" className={cn(
            "transition-all duration-200",
            participant.isSpeaking && "ring-2 ring-green-500 ring-opacity-75"
          )}>
            <AvatarImage src={participant.user.avatar} alt={participant.user.username} />
            <AvatarFallback>
              {participant.user.displayName?.[0] || participant.user.username[0]}
            </AvatarFallback>
          </Avatar>
          
          {/* Speaking Indicator */}
          {participant.isSpeaking && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
          
          {/* Status Indicator */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800",
            participant.user.status === 'online' && "bg-green-500",
            participant.user.status === 'away' && "bg-yellow-500",
            participant.user.status === 'busy' && "bg-red-500",
            participant.user.status === 'invisible' && "bg-gray-500"
          )} />
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className={cn(
              "text-sm font-medium truncate",
              participant.isSpeaking ? "text-green-400" : "text-gray-200"
            )}>
              {participant.user.displayName || participant.user.username}
              {isCurrentUser && " (You)"}
            </p>
            
            {/* Permission Icon */}
            {getPermissionIcon(participant)}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-400">
              {formatDuration(participant.joinedAt)}
            </span>
            
            {/* Platform and Connection */}
            <div className="flex items-center space-x-1">
              {getPlatformIcon(participant.platform)}
              {getConnectionIcon(participant.connectionQuality)}
            </div>
          </div>
        </div>
        
        {/* Audio Level Indicator */}
        {participant.isSpeaking && participant.audioLevel > 0 && (
          <div className="w-12 flex items-center">
            <Progress 
              value={participant.audioLevel} 
              className="h-1.5 w-full"
            />
          </div>
        )}
        
        {/* Status Icons */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Screen Share */}
          {participant.isScreenSharing && (
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-green-600 text-white px-1.5 py-0.5">
                  <Monitor className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent><p>Screen sharing</p></TooltipContent>
            </Tooltip>
          )}
          
          {/* Video */}
          {participant.hasVideo ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="text-blue-400">
                  <Video className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Camera on</p></TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <div className="text-gray-500">
                  <VideoOff className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Camera off</p></TooltipContent>
            </Tooltip>
          )}
          
          {/* Audio Status */}
          {participant.isDeafened ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="text-red-400">
                  <HeadphonesIcon className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Deafened</p></TooltipContent>
            </Tooltip>
          ) : participant.isMuted ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="text-red-400">
                  <MicOff className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Muted</p></TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <div className="text-green-400">
                  <Mic className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Microphone on</p></TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Individual Volume Control */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2",
          !isCurrentUser && "w-20"
        )}>
          {!isCurrentUser && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-gray-400 hover:text-white"
                onClick={() => handleVolumeChange(
                  participant.userId, 
                  participant.volume > 0 ? 0 : 100
                )}
              >
                {participant.volume > 0 ? 
                  <Volume2 className="w-3 h-3" /> : 
                  <VolumeX className="w-3 h-3" />
                }
              </Button>
              
              <div className="w-12">
                <Slider
                  value={[participant.volume]}
                  onValueChange={([value]) => handleVolumeChange(participant.userId, value)}
                  max={200}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
        
        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserPlus className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Volume2 className="w-4 h-4 mr-2" />
              Adjust Volume
            </DropdownMenuItem>
            {!isCurrentUser && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400">
                  <UserMinus className="w-4 h-4 mr-2" />
                  Mute User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (!isVisible || !isConnected || !currentChannel) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="bg-gray-900 border-gray-700">
        {showHeader && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-200 flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                Voice Channel
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {extendedParticipants.length} participant{extendedParticipants.length !== 1 ? 's' : ''}
                </Badge>
                
                {onInviteUsers && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-400 hover:text-white"
                    onClick={onInviteUsers}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-400">Sort by:</span>
              <div className="flex items-center space-x-1">
                {['speaking', 'joined', 'name'].map((sort) => (
                  <Button
                    key={sort}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs h-6 px-2",
                      sortBy === sort ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                    )}
                    onClick={() => setSortBy(sort as any)}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
        )}
        
        <CardContent className="p-0">
          {/* Channel Info */}
          <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-400">
                  {currentChannel.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {speakingUsers.size} speaking
                </span>
              </div>
            </div>
          </div>
          
          {/* Global Volume Control */}
          <div className="px-4 py-3 bg-gray-800/30 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 min-w-[4rem]">Master</span>
              <div className="flex-1">
                <Slider
                  value={[globalVolume]}
                  onValueChange={([value]) => setGlobalVolume(value)}
                  max={200}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-gray-400 min-w-[2.5rem]">
                {globalVolume}%
              </span>
            </div>
          </div>
          
          {/* Participant List */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-1">
              {sortedParticipants.length > 0 ? (
                sortedParticipants.map(renderParticipant)
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No participants in voice channel</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}