"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { FullScreenVideoCall } from "./full-screen-video-call";
import { FloatingVideoOverlay } from "./floating-video-overlay";
import { IncomingCallNotification, useIncomingCall } from "./incoming-call-notification";
import { ScreenShareViewer } from "./screen-share-viewer";
import { VoiceParticipantList } from "./voice-participant-list";
import { CallQualityIndicator } from "./call-quality-indicator";
import { VoiceErrorRecovery } from "./voice-error-recovery";
import { AnimatePresence } from "framer-motion";

interface VoiceChatManagerProps {
  /**
   * Controls which components are enabled
   */
  features?: {
    fullScreenCall?: boolean;
    floatingOverlay?: boolean;
    incomingCallNotifications?: boolean;
    screenShareViewer?: boolean;
    participantList?: boolean;
    qualityIndicator?: boolean;
  };
  
  /**
   * Layout preferences
   */
  layout?: {
    floatingOverlayPosition?: { x: number; y: number };
    participantListSide?: 'left' | 'right';
    showParticipantListByDefault?: boolean;
  };
  
  /**
   * Event handlers
   */
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onScreenShare?: (sharing: boolean) => void;
}

export function VoiceChatManager({
  features = {
    fullScreenCall: true,
    floatingOverlay: true,
    incomingCallNotifications: true,
    screenShareViewer: true,
    participantList: true,
    qualityIndicator: true
  },
  layout = {
    floatingOverlayPosition: { x: 20, y: 20 },
    participantListSide: 'right',
    showParticipantListByDefault: false
  },
  onCallStart,
  onCallEnd,
  onScreenShare
}: VoiceChatManagerProps) {
  const {
    isConnected,
    hasVideo,
    isScreenSharing,
    participants,
    disconnect,
    toggleVideo
  } = useVoiceStore();
  
  const { user } = useAuthStore();
  const { incomingCall, showIncomingCall, hideIncomingCall } = useIncomingCall();

  // UI State
  const [isFullScreenVisible, setIsFullScreenVisible] = React.useState(false);
  const [isFloatingVisible, setIsFloatingVisible] = React.useState(false);
  const [isScreenShareViewerVisible, setIsScreenShareViewerVisible] = React.useState(false);
  const [isParticipantListVisible, setIsParticipantListVisible] = React.useState(
    layout.showParticipantListByDefault || false
  );
  const [isPipMode, setIsPipMode] = React.useState(false);
  const [floatingPinned, setFloatingPinned] = React.useState(false);

  // Screen sharing presenter info
  const screenSharingParticipant = React.useMemo(() => {
    return Object.values(participants).find(p => 
      isScreenSharing && p.userId === user?.id // Mock - only current user shares screen
    );
  }, [participants, isScreenSharing, user]);

  // Auto-show floating overlay when connected with video
  React.useEffect(() => {
    if (isConnected && hasVideo && !isFullScreenVisible) {
      setIsFloatingVisible(true);
    } else if (!isConnected) {
      setIsFloatingVisible(false);
      setIsFullScreenVisible(false);
      setIsScreenShareViewerVisible(false);
    }
  }, [isConnected, hasVideo, isFullScreenVisible]);

  // Handle screen sharing changes
  React.useEffect(() => {
    if (isScreenSharing && screenSharingParticipant) {
      setIsScreenShareViewerVisible(true);
      if (onScreenShare) onScreenShare(true);
    } else {
      setIsScreenShareViewerVisible(false);
      if (onScreenShare) onScreenShare(false);
    }
  }, [isScreenSharing, screenSharingParticipant, onScreenShare]);

  // Handle call lifecycle
  React.useEffect(() => {
    if (isConnected && onCallStart) {
      onCallStart();
    } else if (!isConnected && onCallEnd) {
      onCallEnd();
    }
  }, [isConnected, onCallStart, onCallEnd]);

  // Simulate incoming call (for demo purposes)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && Math.random() > 0.7) { // 30% chance of incoming call
        showIncomingCall({
          isVisible: true,
          callType: Math.random() > 0.5 ? 'video' : 'voice',
          caller: {
            id: 'demo-caller',
            username: 'johndoe',
            displayName: 'John Doe',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
          },
          channelName: 'General',
          participantCount: 3
        });
      }
    }, 10000); // Show after 10 seconds for demo

    return () => clearTimeout(timer);
  }, [showIncomingCall, isConnected]);

  const handleExpandToFullScreen = () => {
    setIsFloatingVisible(false);
    setIsFullScreenVisible(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreenVisible(false);
    if (hasVideo) {
      setIsFloatingVisible(true);
    }
  };

  const handleCloseFloating = () => {
    setIsFloatingVisible(false);
    disconnect();
  };

  const handleAcceptCall = () => {
    hideIncomingCall();
    // Here you would connect to the voice channel
    // connect(channelId);
  };

  const handleDeclineCall = () => {
    hideIncomingCall();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleToggleAudio = () => {
    // This would toggle audio for incoming call preview
  };

  const handleCloseScreenShare = () => {
    setIsScreenShareViewerVisible(false);
  };

  const handleInviteUsers = () => {
    // Copy invite link or show invite modal
    const inviteUrl = `${window.location.origin}/channels/${Math.random()}`;
    navigator.clipboard.writeText(inviteUrl);
  };

  const handleOpenSettings = () => {
    // Open voice settings modal
  };

  return (
    <>
      {/* Full Screen Video Call */}
      {features.fullScreenCall && (
        <AnimatePresence>
          <FullScreenVideoCall
            isVisible={isFullScreenVisible}
            onClose={handleCloseFullScreen}
          />
        </AnimatePresence>
      )}

      {/* Floating Video Overlay */}
      {features.floatingOverlay && !isFullScreenVisible && (
        <FloatingVideoOverlay
          onExpand={handleExpandToFullScreen}
          onClose={handleCloseFloating}
          defaultPosition={layout.floatingOverlayPosition}
          isPinned={floatingPinned}
          onPin={setFloatingPinned}
        />
      )}

      {/* Incoming Call Notification */}
      {features.incomingCallNotifications && incomingCall && (
        <IncomingCallNotification
          isVisible={incomingCall.isVisible}
          callType={incomingCall.callType}
          caller={incomingCall.caller}
          channelName={incomingCall.channelName}
          participantCount={incomingCall.participantCount}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          isVideoEnabled={hasVideo}
          isAudioEnabled={true}
        />
      )}

      {/* Screen Share Viewer */}
      {features.screenShareViewer && isScreenShareViewerVisible && screenSharingParticipant && (
        <ScreenShareViewer
          isVisible={isScreenShareViewerVisible}
          onClose={handleCloseScreenShare}
          presenter={{
            id: screenSharingParticipant.userId,
            username: screenSharingParticipant.user.username,
            displayName: screenSharingParticipant.user.displayName,
            avatar: screenSharingParticipant.user.avatar
          }}
          allowAnnotations={true}
          allowRecording={true}
        />
      )}

      {/* Voice Participant List - can be shown as sidebar or modal */}
      {features.participantList && isConnected && isParticipantListVisible && (
        <div className={cn(
          "fixed top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 z-30",
          layout.participantListSide === 'left' ? "left-0" : "right-0"
        )}>
          <VoiceParticipantList
            onInviteUsers={handleInviteUsers}
          />
        </div>
      )}

      {/* Call Quality Indicator - floating in corner */}
      {features.qualityIndicator && isConnected && !isFullScreenVisible && (
        <div className="fixed bottom-4 left-4 z-20">
          <CallQualityIndicator
            variant="floating"
            onOpenSettings={handleOpenSettings}
          />
        </div>
      )}

      {/* PiP Mode (Picture-in-Picture) */}
      {isPipMode && hasVideo && (
        <div className="fixed bottom-4 right-4 w-48 h-36 z-40">
          <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
            <video
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setIsPipMode(false)}
                className="w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Error Recovery */}
      <VoiceErrorRecovery
        onRetry={handleOpenSettings}
        onSettings={handleOpenSettings}
        onDisconnect={() => {
          disconnect();
          setIsFullScreenVisible(false);
          setIsFloatingVisible(false);
        }}
      />
    </>
  );
}

// Export a hook for easy integration
export function useVoiceChatManager() {
  const [managerRef, setManagerRef] = React.useState<{
    showFullScreen: () => void;
    hideFullScreen: () => void;
    showFloating: () => void;
    hideFloating: () => void;
    showParticipantList: () => void;
    hideParticipantList: () => void;
    togglePictureInPicture: () => void;
  } | null>(null);

  const register = React.useCallback((manager: any) => {
    setManagerRef(manager);
  }, []);

  return {
    manager: managerRef,
    register
  };
}