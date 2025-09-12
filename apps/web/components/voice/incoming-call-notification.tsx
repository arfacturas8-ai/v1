"use client";

import * as React from "react";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff,
  Volume2,
  VolumeX,
  Users,
  Clock,
  UserCheck,
  UserX,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface IncomingCallNotificationProps {
  isVisible: boolean;
  callType: 'voice' | 'video';
  caller: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  channelName: string;
  participantCount?: number;
  onAccept: () => void;
  onDecline: () => void;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  autoDeclineTimeout?: number; // in seconds
}

export function IncomingCallNotification({
  isVisible,
  callType,
  caller,
  channelName,
  participantCount = 1,
  onAccept,
  onDecline,
  onToggleVideo,
  onToggleAudio,
  isVideoEnabled = true,
  isAudioEnabled = true,
  autoDeclineTimeout = 30
}: IncomingCallNotificationProps) {
  const [timeLeft, setTimeLeft] = React.useState(autoDeclineTimeout);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [ringVolume, setRingVolume] = React.useState(80);
  const [isRinging, setIsRinging] = React.useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize ringtone
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ringVolume / 100;
      audioRef.current.loop = true;
    }
  }, [ringVolume]);

  // Handle countdown and auto-decline
  React.useEffect(() => {
    if (!isVisible) {
      setTimeLeft(autoDeclineTimeout);
      setIsRinging(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    setIsRinging(true);
    if (audioRef.current && isAudioEnabled) {
      audioRef.current.play().catch(console.error);
    }

    timeoutRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isVisible, autoDeclineTimeout, isAudioEnabled, onDecline]);

  const handleAccept = () => {
    setIsRinging(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onAccept();
  };

  const handleDecline = () => {
    setIsRinging(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onDecline();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`; 
  };

  if (!isVisible) return null;

  const NotificationContent = () => (
    <Card className={cn(
      "bg-gray-900/95 border-gray-700 backdrop-blur-md shadow-2xl",
      isMinimized ? "w-80" : "w-96"
    )}>
      <CardContent className={cn(
        "p-6",
        isMinimized && "p-4"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              callType === 'video' ? "bg-blue-500" : "bg-green-500"
            )} />
            <span className="text-sm font-medium text-gray-300">
              Incoming {callType} call
            </span>
            <Badge variant="outline" className="text-xs">
              {formatTime(timeLeft)}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 text-gray-400 hover:text-white"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
        </div>

        {!isMinimized && (
          <>
            {/* Caller Info */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <Avatar size="2xl" className="border-4 border-gray-700">
                  <AvatarImage src={caller.avatar} alt={caller.username} />
                  <AvatarFallback className="text-2xl">
                    {caller.displayName?.[0] || caller.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -inset-1 rounded-full animate-ping",
                  callType === 'video' ? "border-2 border-blue-500" : "border-2 border-green-500"
                )} />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-1">
                {caller.displayName || caller.username}
              </h3>
              <p className="text-gray-400">@{caller.username}</p>
            </div>

            {/* Call Details */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <span>#{channelName}</span>
                  {participantCount > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {participantCount}
                    </Badge>
                  )}\n                </div>
                <div className="flex items-center space-x-1 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* Timeout Progress */}
            <div className="mb-4">
              <Progress 
                value={(autoDeclineTimeout - timeLeft) / autoDeclineTimeout * 100} 
                className="h-1"
              />
            </div>
          </>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="flex items-center space-x-3 mb-4">
            <Avatar size="sm" className="border-2 border-gray-700">
              <AvatarImage src={caller.avatar} alt={caller.username} />
              <AvatarFallback>
                {caller.displayName?.[0] || caller.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {caller.displayName || caller.username}
              </p>
              <p className="text-xs text-gray-400 truncate">#{channelName}</p>
            </div>
            <div className="text-xs text-gray-400">
              {formatTime(timeLeft)}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isMinimized && (
            <>
              {/* Pre-call Settings */}
              <div className="flex items-center justify-center space-x-2 p-2 bg-gray-800/30 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-8 h-8",
                    !isAudioEnabled ? "bg-red-900/50 text-red-400" : "text-gray-400 hover:text-white"
                  )}
                  onClick={onToggleAudio}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                {callType === 'video' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-8 h-8",
                      !isVideoEnabled ? "bg-red-900/50 text-red-400" : "text-gray-400 hover:text-white"
                    )}
                    onClick={onToggleVideo}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                )}
                
                <div className="flex-1" />
                
                <div className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>Ring volume:</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => setRingVolume(prev => prev > 0 ? 0 : 80)}
                  >
                    {ringVolume > 0 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {/* Decline */}
            <Button
              variant="destructive"
              size={isMinimized ? "sm" : "lg"}
              className={cn(
                "rounded-full shadow-lg transition-all duration-200 hover:scale-105",
                isMinimized ? "w-12 h-12" : "w-16 h-16"
              )}
              onClick={handleDecline}
            >
              <PhoneOff className={cn(
                isMinimized ? "w-5 h-5" : "w-6 h-6"
              )} />
            </Button>
            
            {/* Accept */}
            <Button
              className={cn(
                "rounded-full shadow-lg transition-all duration-200 hover:scale-105",
                callType === 'video' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700",
                isMinimized ? "w-12 h-12" : "w-16 h-16"
              )}
              onClick={handleAccept}
            >
              {callType === 'video' ? (
                <Video className={cn(
                  isMinimized ? "w-5 h-5" : "w-6 h-6"
                )} />
              ) : (
                <Phone className={cn(
                  isMinimized ? "w-5 h-5" : "w-6 h-6"
                )} />
              )}
            </Button>
          </div>
          
          {!isMinimized && (
            <div className="text-center text-xs text-gray-500 mt-2">
              Call will auto-decline in {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hidden Audio Element for Ringtone */}
      <audio
        ref={audioRef}
        preload="auto"
      >\n        <source src="/sounds/incoming-call.mp3" type="audio/mpeg" />
        <source src="/sounds/incoming-call.ogg" type="audio/ogg" />
        {/* Fallback to a simple beep sound */}
      </audio>
    </Card>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              damping: 25,
              stiffness: 300
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -100, 
            scale: 0.9,
            transition: {
              duration: 0.2
            }
          }}
          className="fixed top-4 right-4 z-50"
        >
          <motion.div
            animate={{
              scale: isRinging ? [1, 1.02, 1] : 1,
              transition: {
                duration: 1,
                repeat: isRinging ? Infinity : 0,
                ease: "easeInOut"
              }
            }}
          >
            <NotificationContent />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing incoming call state
export function useIncomingCall() {
  const [incomingCall, setIncomingCall] = React.useState<{
    isVisible: boolean;
    callType: 'voice' | 'video';
    caller: {
      id: string;
      username: string;
      displayName?: string;
      avatar?: string;
    };
    channelName: string;
    participantCount?: number;
  } | null>(null);

  const showIncomingCall = React.useCallback((callData: NonNullable<typeof incomingCall>) => {
    setIncomingCall({ ...callData, isVisible: true });
  }, []);

  const hideIncomingCall = React.useCallback(() => {
    setIncomingCall(null);
  }, []);

  return {
    incomingCall,
    showIncomingCall,
    hideIncomingCall
  };
}