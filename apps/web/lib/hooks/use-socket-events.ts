"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { 
  Message, 
  DirectMessage, 
  User, 
  Server, 
  Channel, 
  VoiceState,
  ServerMember,
  Role
} from "@/lib/types";

export function useSocketEvents() {
  const {
    addMessage,
    updateMessage,
    removeMessage,
    addDirectMessage,
    updateDirectMessage,
    removeDirectMessage,
    addServer,
    updateServer,
    removeServer,
    addChannel,
    updateChannel,
    removeChannel,
    addUser,
    updateUser,
    setTyping,
    clearTyping,
  } = useChatStore();

  const { user: currentUser, updateUser: updateCurrentUser } = useAuthStore();

  const {
    addParticipant,
    removeParticipant,
    updateParticipant,
    setParticipantSpeaking,
    setConnected,
    setError: setVoiceError,
  } = useVoiceStore();

  const {
    addNotification,
    setConnectionStatus,
    setOnline,
    updateActivity,
  } = useUIStore();

  useEffect(() => {
    if (!socket) return;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      setOnline(true);
      updateActivity();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
      setOnline(false);
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      addNotification({
        type: 'system',
        title: 'Connection Error',
        message: 'There was a problem with your connection.',
      });
    });

    // Message events
    socket.on('message_create', (message: Message) => {
      addMessage(message);
      
      // Show notification for mentions or DMs
      if (currentUser && (
        message.mentions?.some(mention => mention.userId === currentUser.id) ||
        message.authorId !== currentUser.id
      )) {
        addNotification({
          type: 'message',
          title: `${message.author.displayName || message.author.username}`,
          message: message.content.slice(0, 100),
          serverId: message.serverId,
          channelId: message.channelId,
        });
      }
    });

    socket.on('message_update', (message: Message) => {
      updateMessage(message.id, message);
    });

    socket.on('message_delete', (messageId: string, channelId: string) => {
      removeMessage(messageId, channelId);
    });

    socket.on('message_bulk_delete', (messageIds: string[], channelId: string) => {
      messageIds.forEach(messageId => {
        removeMessage(messageId, channelId);
      });
    });

    // Direct message events
    socket.on('dm_create', (dm: DirectMessage) => {
      addDirectMessage(dm);
      
      if (currentUser && dm.authorId !== currentUser.id) {
        addNotification({
          type: 'message',
          title: `${dm.author.displayName || dm.author.username}`,
          message: dm.content.slice(0, 100),
        });
      }
    });

    socket.on('dm_update', (dm: DirectMessage) => {
      updateDirectMessage(dm.id, dm);
    });

    socket.on('dm_delete', (dmId: string) => {
      // Handle DM deletion - would need to determine user ID from DM cache
      console.log('DM deleted:', dmId);
    });

    // Typing events
    socket.on('typing_start', (channelId: string, userId: string) => {
      setTyping(channelId, userId, true);
    });

    socket.on('typing_stop', (channelId: string, userId: string) => {
      setTyping(channelId, userId, false);
    });

    // User presence events
    socket.on('user_update', (user: User) => {
      addUser(user);
      
      // Update current user if it's them
      if (currentUser && user.id === currentUser.id) {
        updateCurrentUser(user);
      }
    });

    socket.on('presence_update', (userId: string, status: any) => {
      updateUser(userId, { status, isOnline: status !== 'offline' });
    });

    // Server events
    socket.on('server_create', (server: Server) => {
      addServer(server);
      addNotification({
        type: 'system',
        title: 'New Server',
        message: `You've joined ${server.name}`,
        serverId: server.id,
      });
    });

    socket.on('server_update', (server: Server) => {
      updateServer(server.id, server);
    });

    socket.on('server_delete', (serverId: string) => {
      removeServer(serverId);
      addNotification({
        type: 'system',
        title: 'Server Deleted',
        message: 'A server you were in has been deleted.',
      });
    });

    socket.on('server_member_add', (member: ServerMember) => {
      // Handle member addition to server
      console.log('Member added:', member);
      addUser(member.user);
    });

    socket.on('server_member_update', (member: ServerMember) => {
      // Handle member updates (roles, nickname, etc.)
      console.log('Member updated:', member);
      addUser(member.user);
    });

    socket.on('server_member_remove', (serverId: string, userId: string) => {
      // Handle member removal from server
      console.log('Member removed:', serverId, userId);
    });

    // Channel events
    socket.on('channel_create', (channel: Channel) => {
      addChannel(channel);
    });

    socket.on('channel_update', (channel: Channel) => {
      updateChannel(channel.id, channel);
    });

    socket.on('channel_delete', (channelId: string, serverId: string) => {
      removeChannel(channelId);
    });

    // Role events
    socket.on('role_create', (role: Role) => {
      console.log('Role created:', role);
    });

    socket.on('role_update', (role: Role) => {
      console.log('Role updated:', role);
    });

    socket.on('role_delete', (roleId: string, serverId: string) => {
      console.log('Role deleted:', roleId, serverId);
    });

    // Voice events
    socket.on('voice_state_update', (voiceState: VoiceState) => {
      if (voiceState.channelId) {
        // User joined or updated in voice channel
        const participant = {
          userId: voiceState.userId,
          user: { id: voiceState.userId } as User, // Would be populated with full user data
          isMuted: voiceState.isMuted,
          isDeafened: voiceState.isDeafened,
          isSpeaking: false,
          volume: 100,
        };
        
        addParticipant(participant);
      } else {
        // User left voice channel
        removeParticipant(voiceState.userId);
      }
    });

    socket.on('voice_speaking', (userId: string, isSpeaking: boolean) => {
      setParticipantSpeaking(userId, isSpeaking);
    });

    // Cleanup function
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('message_create');
      socket.off('message_update');
      socket.off('message_delete');
      socket.off('message_bulk_delete');
      socket.off('dm_create');
      socket.off('dm_update');
      socket.off('dm_delete');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('user_update');
      socket.off('presence_update');
      socket.off('server_create');
      socket.off('server_update');
      socket.off('server_delete');
      socket.off('server_member_add');
      socket.off('server_member_update');
      socket.off('server_member_remove');
      socket.off('channel_create');
      socket.off('channel_update');
      socket.off('channel_delete');
      socket.off('role_create');
      socket.off('role_update');
      socket.off('role_delete');
      socket.off('voice_state_update');
      socket.off('voice_speaking');
    };
  }, [
    addMessage,
    updateMessage,
    removeMessage,
    addDirectMessage,
    updateDirectMessage,
    removeDirectMessage,
    addServer,
    updateServer,
    removeServer,
    addChannel,
    updateChannel,
    removeChannel,
    addUser,
    updateUser,
    setTyping,
    clearTyping,
    currentUser,
    updateCurrentUser,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setParticipantSpeaking,
    setConnected,
    setVoiceError,
    addNotification,
    setConnectionStatus,
    setOnline,
    updateActivity,
  ]);

  // Return socket instance for manual operations
  return socket;
}