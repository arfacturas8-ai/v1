"use client";

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/stores/use-chat-store';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import { socket } from '@/lib/socket';
import { Message, DirectMessage } from '@/lib/types';

export function useChatSocket() {
  const { user } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    removeMessage,
    addDirectMessage,
    updateDirectMessage,
    removeDirectMessage,
    setTyping,
    addUser,
    updateUser,
    addServer,
    updateServer,
    removeServer,
    addChannel,
    updateChannel,
    removeChannel,
  } = useChatStore();

  const isSetupRef = useRef(false);

  useEffect(() => {
    if (!user || isSetupRef.current) return;

    console.log('🔌 Setting up chat socket listeners');
    isSetupRef.current = true;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      
      // Send identify event to initialize connection
      socket.emit('identify', {
        large_threshold: 250,
        presence: {
          status: 'online',
          activity: null
        }
      });
    });

    // Ready event with user data and servers
    socket.on('ready', (data: any) => {
      console.log('🎉 Ready event received:', data);
      
      // Initialize user servers and channels
      if (data.servers) {
        data.servers.forEach((server: any) => {
          addServer(server);
          if (server.channels) {
            server.channels.forEach((channel: any) => addChannel(channel));
          }
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
    });

    socket.on('error', (error) => {
      console.error('🔥 Socket error:', error);
    });

    socket.on('auth_error', (error) => {
      console.error('🔑 Authentication error:', error);
      // Handle auth error - maybe redirect to login
    });

    // Message events - Discord-style events from backend
    socket.on('new-message', (message: Message) => {
      console.log('📨 New message received:', message);
      addMessage(message);
    });

    socket.on('message-updated', (message: Message) => {
      console.log('✏️ Message updated:', message);
      updateMessage(message.id, message);
    });

    socket.on('message-deleted', (data: { messageId: string; channelId: string; deletedBy: string }) => {
      console.log('🗑️ Message deleted:', data);
      removeMessage(data.messageId, data.channelId);
    });

    // Reaction events - Discord-style events from backend
    socket.on('message:reaction_add', (data: { 
      messageId: string; 
      channelId: string; 
      emoji: string; 
      user: any;
      reaction: any;
    }) => {
      console.log('👍 Reaction added:', data);
      // Update message with new reaction
      updateMessage(data.messageId, {
        reactions: data.reaction // Server should send the updated reactions array
      });
    });

    socket.on('message:reaction_remove', (data: { 
      messageId: string; 
      channelId: string; 
      emoji: string; 
      user: any;
      reaction: any;
    }) => {
      console.log('👎 Reaction removed:', data);
      // Update message with updated reaction
      updateMessage(data.messageId, {
        reactions: data.reaction // Server should send the updated reactions array
      });
    });

    // Direct message events - Discord-style events from backend
    socket.on('dm:created', (data: { channel_id: string; recipient_id: string }) => {
      console.log('📱 DM channel created:', data);
      // Handle DM channel creation
    });

    // Typing indicators - Discord-style events from backend
    socket.on('user-typing', (data: { userId: string; channelId: string; username: string; displayName: string }) => {
      console.log('⌨️ User typing:', data);
      setTyping(data.channelId, data.userId, true);
    });

    socket.on('user-stop-typing', (data: { userId: string; channelId: string }) => {
      console.log('⏸️ User stopped typing:', data);
      setTyping(data.channelId, data.userId, false);
    });

    // Channel events - Discord-style events from backend
    socket.on('channel-history', (data: { channelId: string; messages: Message[] }) => {
      console.log('📜 Channel history received:', data);
      // Add messages to the store
      data.messages.forEach(message => addMessage(message));
    });

    socket.on('user-joined-channel', (data: { userId: string; username: string; displayName: string }) => {
      console.log('👋 User joined channel:', data);
      // Add or update user
      if (data.userId && (!user || user.id !== data.userId)) {
        addUser({
          id: data.userId,
          username: data.username,
          displayName: data.displayName,
          email: '',
          status: 'online',
          isOnline: true,
          createdAt: new Date(),
          roles: []
        });
      }
    });

    socket.on('user-left-channel', (data: { userId: string }) => {
      console.log('👋 User left channel:', data);
    });

    // Server events - Discord-style events from backend
    socket.on('server-state', (data: any) => {
      console.log('🏰 Server state:', data);
      // Handle server state update
      if (data.channels) {
        data.channels.forEach((channel: any) => addChannel(channel));
      }
    });

    socket.on('left-server', (data: { serverId: string }) => {
      console.log('🚪 Left server:', data);
      removeServer(data.serverId);
    });

    socket.on('server:members_chunk', (data: { server_id: string; members: any[] }) => {
      console.log('👥 Server members:', data);
      // Handle server members
      data.members.forEach((member: any) => {
        if (member.user) {
          addUser({
            id: member.user.id,
            username: member.user.username,
            displayName: member.user.displayName || member.user.display_name,
            email: '',
            status: member.presence?.status || 'offline',
            isOnline: member.presence?.status === 'online',
            createdAt: new Date(),
            roles: member.roles || []
          });
        }
      });
    });

    // Voice events - Discord-style events from backend
    socket.on('voice:joined', (data: { channel_id: string; session_id: string }) => {
      console.log('🎤 Voice joined:', data);
    });

    socket.on('voice:left', (data: { channel_id: string }) => {
      console.log('🔇 Voice left:', data);
    });

    socket.on('voice:state_update', (data: any) => {
      console.log('🎤 Voice state update:', data);
    });

    // Presence events - Discord-style events from backend
    socket.on('presence-update', (data: { userId: string; status: string; activity?: string; lastSeen: Date }) => {
      console.log('👤 Presence update:', data);
      updateUser(data.userId, {
        status: data.status as any,
        isOnline: data.status === 'online',
        lastSeen: data.lastSeen ? new Date(data.lastSeen) : new Date()
      });
    });

    socket.on('presence-data', (data: any[]) => {
      console.log('👥 Presence data:', data);
      data.forEach(presence => {
        if (presence.userId) {
          updateUser(presence.userId, {
            status: presence.status,
            isOnline: presence.status === 'online',
            lastSeen: presence.lastSeen ? new Date(presence.lastSeen) : new Date()
          });
        }
      });
    });

    // Mention notifications - Discord-style events from backend
    socket.on('mentioned', (data: { messageId: string; channelId: string; mentionedBy: string }) => {
      console.log('📢 Mentioned in message:', data);
      // Handle mention notification
    });

    // Moderation events
    socket.on('kicked-from-server', (data: { serverId: string; reason?: string; moderator: string }) => {
      console.log('👢 Kicked from server:', data);
      removeServer(data.serverId);
    });

    socket.on('banned-from-server', (data: { serverId: string; reason?: string; moderator: string }) => {
      console.log('🚫 Banned from server:', data);
      removeServer(data.serverId);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up chat socket listeners');
      socket.off('connect');
      socket.off('ready');
      socket.off('disconnect');
      socket.off('error');
      socket.off('auth_error');
      socket.off('new-message');
      socket.off('message-updated');
      socket.off('message-deleted');
      socket.off('message:reaction_add');
      socket.off('message:reaction_remove');
      socket.off('dm:created');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('channel-history');
      socket.off('user-joined-channel');
      socket.off('user-left-channel');
      socket.off('server-state');
      socket.off('left-server');
      socket.off('server:members_chunk');
      socket.off('voice:joined');
      socket.off('voice:left');
      socket.off('voice:state_update');
      socket.off('presence-update');
      socket.off('presence-data');
      socket.off('mentioned');
      socket.off('kicked-from-server');
      socket.off('banned-from-server');
      isSetupRef.current = false;
    };
  }, [user, addMessage, updateMessage, removeMessage, addDirectMessage, updateDirectMessage, removeDirectMessage, setTyping, addUser, updateUser, addServer, updateServer, removeServer, addChannel, updateChannel, removeChannel]);

  return {
    socket,
    connected: socket.connected,
  };
}