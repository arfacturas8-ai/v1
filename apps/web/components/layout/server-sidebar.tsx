"use client";

import * as React from "react";
import { Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { socket } from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function ServerSidebar() {
  const { servers, selectedServerId, selectServer, selectChannel, selectDM, isLoadingServers } = useChatStore();
  const { openModal } = useUIStore();

  const serverList = Object.values(servers);

  const handleServerSelect = (serverId: string) => {
    selectServer(serverId);
    selectDM(null); // Clear DM selection when selecting a server
    
    // Join server via socket
    socket.joinServer(serverId);
    
    // Auto-select first available text channel in the server
    const server = servers[serverId];
    if (server && server.channels && server.channels.length > 0) {
      const firstTextChannel = server.channels.find(ch => ch.type === 'text') || server.channels[0];
      if (firstTextChannel) {
        selectChannel(firstTextChannel.id);
        socket.joinChannel(firstTextChannel.id);
      }
    }
  };

  const handleDirectMessages = () => {
    selectServer(null); // Clear server selection
    selectDM(null); // This will show DM list
  };

  const handleCreateServer = () => {
    openModal("create-server");
  };

  const handleSettings = () => {
    openModal("user-settings");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gray-900 py-3">
        {/* Home/DM Button */}
        <div className="px-3 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-12 h-12 rounded-full p-0 bg-gray-700 hover:bg-blue-600 hover:rounded-2xl transition-all duration-200",
                  !selectedServerId && "bg-blue-600 rounded-2xl"
                )}
                onClick={handleDirectMessages}
              >
                <span className="text-white font-bold text-lg">
                  {!selectedServerId ? "🏠" : "💬"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Direct Messages</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="mx-3 mb-2" />

        {/* Server List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2">
            {isLoadingServers ? (
              // Loading skeleton
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              serverList.map((server) => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-12 h-12 rounded-full p-0 hover:rounded-2xl transition-all duration-200 relative overflow-hidden",
                      selectedServerId === server.id && "rounded-2xl"
                    )}
                    onClick={() => handleServerSelect(server.id)}
                  >
                    {server.icon ? (
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={server.icon} alt={server.name} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                          {server.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 flex items-center justify-center text-white font-bold text-lg rounded-full">
                        {server.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {selectedServerId === server.id && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{server.name}</p>
                </TooltipContent>
              </Tooltip>
            ))
            )}
          </div>
        </ScrollArea>

        <Separator className="mx-3 mb-2" />

        {/* Add Server Button */}
        <div className="px-3 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-12 h-12 rounded-full p-0 bg-gray-700 hover:bg-green-600 hover:rounded-2xl transition-all duration-200"
                onClick={handleCreateServer}
              >
                <Plus className="w-6 h-6 text-green-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add a Server</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Settings Button */}
        <div className="px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-12 h-12 rounded-full p-0 bg-gray-700 hover:bg-gray-600 hover:rounded-2xl transition-all duration-200"
                onClick={handleSettings}
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}