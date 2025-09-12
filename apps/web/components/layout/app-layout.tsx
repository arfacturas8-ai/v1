"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAppInitialization } from "@/lib/hooks/use-app-initialization";
import { ServerSidebar } from "./server-sidebar";
import { ChannelSidebar } from "./channel-sidebar";
import { UserList } from "./user-list";
import { ChatArea } from "../chat/chat-area";
import { VoicePanel } from "../voice/voice-panel";
import { VoiceChatManager } from "../voice/voice-chat-manager";
import { MobileHeader } from "./mobile-header";
import { ResizablePanel } from "../ui/resizable-panel";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useDiscordLayout } from "@/lib/hooks/use-responsive";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const {
    sidebarCollapsed,
    userListCollapsed,
    leftPanelWidth,
    rightPanelWidth,
    isMobile,
    showMobileMenu,
    setLeftPanelWidth,
    setRightPanelWidth,
    setIsMobile,
  } = useUIStore();

  const { selectedServerId, selectedChannelId, selectedDmUserId } = useChatStore();
  
  // Initialize app data
  useAppInitialization();

  // Import responsive hooks
  const { layout, isMobile: responsiveIsMobile, showServerSidebar, showChannelSidebar, showUserList, allowResizing } = useDiscordLayout();
  
  // Sync with UI store
  React.useEffect(() => {
    setIsMobile(responsiveIsMobile);
  }, [responsiveIsMobile, setIsMobile]);

  // Render mobile layout
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        <MobileHeader />
        
        {/* Mobile overlay menu */}
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-mobile-overlay bg-black/50 backdrop-blur-sm"
              onClick={() => useUIStore.getState().setShowMobileMenu(false)}
            />
            {/* Sliding menu */}
            <div className="fixed inset-y-0 left-0 z-mobile-nav w-80 bg-background shadow-xl slide-in-left">
              <div className="flex h-full">
                <div className="w-20 bg-gray-900 safe-area-left">
                  <ServerSidebar />
                </div>
                <div className="flex-1 bg-gray-800">
                  <ChannelSidebar />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {selectedChannelId || selectedDmUserId ? (
            <ChatArea />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground spacing-responsive">
              <div className="text-center max-w-sm">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to CRYB
                </h2>
                <p className="text-responsive-sm">
                  Select a channel to start chatting with your community
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="safe-area-bottom">
          <VoicePanel />
        </div>
      </div>
    );
  }

  // Desktop layout with responsive features
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Server sidebar - responsive visibility */}
      {showServerSidebar && (
        <>
          <div className="w-[72px] bg-gray-900 flex-shrink-0">
            <ServerSidebar />
          </div>
          <Separator orientation="vertical" />
        </>
      )}

      {/* Channel sidebar - responsive and resizable */}
      {showChannelSidebar && !sidebarCollapsed && (
        <>
          {allowResizing ? (
            <ResizablePanel
              defaultWidth={leftPanelWidth}
              minWidth={200}
              maxWidth={400}
              onResize={setLeftPanelWidth}
              className="bg-gray-800"
            >
              <ChannelSidebar />
            </ResizablePanel>
          ) : (
            <div className="w-64 bg-gray-800 flex-shrink-0">
              <ChannelSidebar />
            </div>
          )}
          <Separator orientation="vertical" />
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannelId || selectedDmUserId ? (
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0">
              <ChatArea />
            </div>
            
            {/* User list - responsive visibility and resizing */}
            {showUserList && !userListCollapsed && selectedChannelId && (
              <>
                <Separator orientation="vertical" />
                {allowResizing ? (
                  <ResizablePanel
                    defaultWidth={rightPanelWidth}
                    minWidth={200}
                    maxWidth={300}
                    onResize={setRightPanelWidth}
                    className="bg-gray-800"
                    side="right"
                  >
                    <UserList />
                  </ResizablePanel>
                ) : (
                  <div className="w-60 bg-gray-800 flex-shrink-0">
                    <UserList />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-700">
            <div className="text-center container-responsive mx-auto spacing-responsive">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-responsive-xl font-bold text-gray-100 mb-2">
                Welcome to CRYB Platform
              </h2>
              <p className="text-responsive-base text-gray-400 mb-6">
                {selectedServerId
                  ? "Select a channel to start chatting with your community"
                  : "Choose a server from the sidebar to get started"}
              </p>
              
              {/* Quick actions for empty state */}
              {!selectedServerId && (
                <div className="mt-6 space-y-4">
                  <p className="text-responsive-sm text-gray-500 mb-4">
                    Get started by joining a community or creating your own
                  </p>
                  <div className="flex flex-responsive-col gap-3 justify-center">
                    <Button 
                      variant="brand" 
                      size="lg"
                      className="touch-button"
                    >
                      Join a Server
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="lg"
                      className="touch-button"
                    >
                      Create Server
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice panel at bottom */}
        <VoicePanel />
      </div>

      {/* Custom content overlay */}
      {children}

      {/* Voice Chat Manager - handles all voice/video calling UI */}
      <VoiceChatManager
        features={{
          fullScreenCall: true,
          floatingOverlay: true,
          incomingCallNotifications: true,
          screenShareViewer: true,
          participantList: true,
          qualityIndicator: true
        }}
        layout={{
          floatingOverlayPosition: { x: 20, y: 100 },
          participantListSide: 'right',
          showParticipantListByDefault: false
        }}
        onCallStart={() => {
          console.log('Voice call started');
        }}
        onCallEnd={() => {
          console.log('Voice call ended');
        }}
        onScreenShare={(sharing) => {
          console.log('Screen sharing:', sharing);
        }}
      />
    </div>
  );
}