"use client";

import * as React from "react";
import { Crown, Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PresenceIndicator } from "@/components/chat/presence-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserRole, UserStatus } from "@/lib/types";

interface UserGroupProps {
  title: string;
  users: Array<{
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    status: UserStatus;
    roles: UserRole[];
    isInVoice?: boolean;
    isSpeaking?: boolean;
  }>;
  count: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onUserClick?: (userId: string) => void;
}

function UserGroup({ title, users, count, isCollapsed = false, onToggle, onUserClick }: UserGroupProps) {
  const getRoleIcon = (roles: UserRole[]) => {
    if (roles.includes(UserRole.OWNER)) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    if (roles.includes(UserRole.ADMIN)) {
      return <Shield className="w-4 h-4 text-red-500" />;
    }
    if (roles.includes(UserRole.MODERATOR)) {
      return <ShieldCheck className="w-4 h-4 text-blue-500" />;
    }
    return null;
  };

  const getRoleColor = (roles: UserRole[]) => {
    if (roles.includes(UserRole.OWNER)) return "text-yellow-400";
    if (roles.includes(UserRole.ADMIN)) return "text-red-400";
    if (roles.includes(UserRole.MODERATOR)) return "text-blue-400";
    return "text-gray-300";
  };

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        className="w-full justify-start px-3 py-2 h-auto text-xs font-semibold text-gray-400 hover:text-gray-300 uppercase tracking-wide"
        onClick={onToggle}
      >
        <span className="flex-1 text-left">
          {title} — {count}
        </span>
      </Button>
      
      {!isCollapsed && (
        <div className="space-y-1 px-2">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto hover:bg-gray-700 rounded-md"
              onClick={() => onUserClick?.(user.id)}
            >
              <div className="flex items-center space-x-2 w-full min-w-0">
                {/* Avatar with status */}
                <div className="relative flex-shrink-0">
                  <Avatar size="sm">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>
                      {user.displayName?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <PresenceIndicator 
                      user={user}
                      size="sm"
                      showTooltip={true}
                      isTyping={user.isSpeaking}
                    />
                  </div>
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      getRoleColor(user.roles),
                      user.isInVoice && "text-green-400"
                    )}>
                      {user.displayName || user.username}
                    </span>
                    
                    {/* Role icon */}
                    {getRoleIcon(user.roles) && (
                      <div className="flex-shrink-0">
                        {getRoleIcon(user.roles)}
                      </div>
                    )}
                    
                    {/* Voice indicator */}
                    {user.isInVoice && (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Activity status */}
                  {user.status === UserStatus.ONLINE && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.isInVoice ? "In voice channel" : "Online"}
                    </p>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserList() {
  const { selectedServerId, servers } = useChatStore();
  const { openUserProfile } = useUIStore();
  const { participants } = useVoiceStore();

  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  const currentServer = selectedServerId ? servers[selectedServerId] : null;
  const members = currentServer?.members || [];

  // Group users by status and role
  const groupedUsers = React.useMemo(() => {
    const online: typeof members = [];
    const offline: typeof members = [];

    members.forEach(member => {
      const isInVoice = !!participants[member.userId];
      const voiceParticipant = participants[member.userId];
      
      const userWithVoice = {
        ...member,
        ...member.user,
        isInVoice,
        isSpeaking: voiceParticipant?.isSpeaking || false
      };

      if (member.user.status === UserStatus.ONLINE || member.user.status === UserStatus.IDLE || member.user.status === UserStatus.DND) {
        online.push(userWithVoice);
      } else {
        offline.push(userWithVoice);
      }
    });

    // Sort by role hierarchy
    const sortByRole = (a: typeof members[0], b: typeof members[0]) => {
      const roleOrder = {
        [UserRole.OWNER]: 0,
        [UserRole.ADMIN]: 1,
        [UserRole.MODERATOR]: 2,
        [UserRole.USER]: 3,
      };
      
      const aHighestRole = Math.min(...a.roles.map(role => roleOrder[role] ?? 3));
      const bHighestRole = Math.min(...b.roles.map(role => roleOrder[role] ?? 3));
      
      if (aHighestRole !== bHighestRole) {
        return aHighestRole - bHighestRole;
      }
      
      return (a.user.displayName || a.user.username).localeCompare(
        b.user.displayName || b.user.username
      );
    };

    return {
      online: online.sort(sortByRole),
      offline: offline.sort(sortByRole)
    };
  }, [members, participants]);

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleUserClick = (userId: string) => {
    openUserProfile(userId);
  };

  if (!currentServer) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No server selected</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            Members — {members.length}
          </h3>
        </div>

        {/* User List */}
        <ScrollArea className="flex-1 p-2">
          {/* Online Users */}
          {groupedUsers.online.length > 0 && (
            <UserGroup
              title="Online"
              users={groupedUsers.online}
              count={groupedUsers.online.length}
              isCollapsed={collapsedGroups.has("online")}
              onToggle={() => toggleGroup("online")}
              onUserClick={handleUserClick}
            />
          )}

          {/* Offline Users */}
          {groupedUsers.offline.length > 0 && (
            <>
              {groupedUsers.online.length > 0 && <Separator className="my-2" />}
              <UserGroup
                title="Offline"
                users={groupedUsers.offline}
                count={groupedUsers.offline.length}
                isCollapsed={collapsedGroups.has("offline")}
                onToggle={() => toggleGroup("offline")}
                onUserClick={handleUserClick}
              />
            </>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-4xl mb-4">👥</div>
              <h4 className="text-lg font-medium text-gray-300 mb-2">
                No members yet
              </h4>
              <p className="text-sm text-gray-500">
                Invite people to join this server!
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}