"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useSocket } from "@/lib/socket";
import { socket } from "@/lib/socket";
import { api } from "@/lib/api";
import { Message, Server, Channel, User, UserStatus } from "@/lib/types";

export default function ChatPage() {
  const {
    selectedServerId,
    selectedChannelId,
    setServers,
    setUsers,
    addMessage,
    setTyping,
    selectServer,
    selectChannel,
    setLoadingServers,
    setConnecting
  } = useChatStore();

  const { user, login } = useAuthStore();
  const { connected } = useSocket();

  // Initialize authentication
  React.useEffect(() => {
    const initAuth = async () => {
      // Check if user is already logged in
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      
      if (token && !user) {
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            console.log('User authenticated:', userResponse.data);
            login(userResponse.data);
            return;
          }
        } catch (error) {
          console.warn('Failed to authenticate user:', error);
          // Clear invalid token
          localStorage.removeItem('auth-token');
          localStorage.removeItem('refresh-token');
        }
      }
      
      // If no valid user, create demo user for testing
      if (!user) {
        const demoUser: User = {
          id: 'demo-user',
          username: 'demo',
          displayName: 'Demo User',
          email: 'demo@cryb.com',
          status: UserStatus.ONLINE,
          isOnline: true,
          createdAt: new Date(),
          roles: []
        };
        console.log('Using demo user for testing');
        login(demoUser);
      }
    };
    
    initAuth();
  }, [user, login]);

  // Initialize socket connection and load data
  React.useEffect(() => {
    if (!user) return;
    
    if (!connected) {
      setConnecting(true);
      socket.connect();
    }

    // Set up socket event listeners
    const setupSocketEvents = () => {
      // Connection events
      socket.on('connect', () => {
        console.log('Connected to chat server');
        setConnecting(false);
        loadInitialData();
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setConnecting(true);
      });

      // Server events
      socket.on('server-state', (data: any) => {
        console.log('Received server state:', data);
        if (data.servers) {
          setServers(data.servers);
        }
        if (data.users) {
          setUsers(data.users);
        }
        setLoadingServers(false);
      });

      // Message events
      socket.on('new-message', (message: Message) => {
        console.log('New message received:', message);
        addMessage(message);
      });

      socket.on('channel-history', (data: { channelId: string; messages: Message[] }) => {
        console.log('Channel history received:', data);
        if (data.messages && data.channelId) {
          setMessages(data.channelId, data.messages);
        }
      });

      // Typing events
      socket.on('user-typing', (data: { userId: string; channelId: string; username: string }) => {
        setTyping(data.channelId, data.userId, true);
        
        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          setTyping(data.channelId, data.userId, false);
        }, 3000);
      });

      socket.on('user-stop-typing', (data: { userId: string; channelId: string }) => {
        setTyping(data.channelId, data.userId, false);
      });

      // User join/leave events
      socket.on('user-joined-channel', (data: { userId: string; username: string; displayName: string }) => {
        console.log('User joined channel:', data);
      });

      socket.on('user-left-channel', (data: { userId: string }) => {
        console.log('User left channel:', data);
      });
    };

    const loadInitialData = async () => {
      setLoadingServers(true);
      
      try {
        // Load servers from API
        console.log('Loading servers from API...');
        const serversResponse = await api.getServers();
        if (serversResponse.success && serversResponse.data) {
          const servers = Array.isArray(serversResponse.data) ? serversResponse.data : [];
          console.log('Servers loaded:', servers);
          setServers(servers);

          // Auto-select first server and channel if available
          if (servers.length > 0 && !selectedServerId) {
            const firstServer = servers[0];
            selectServer(firstServer.id);
            
            if (firstServer.channels && firstServer.channels.length > 0) {
              const firstChannel = firstServer.channels.find(ch => ch.type === 'text') || firstServer.channels[0];
              selectChannel(firstChannel.id);
              
              // Join the selected server and channel via socket
              socket.joinServer(firstServer.id);
              socket.joinChannel(firstChannel.id);
            }
          }
        } else {
          console.warn('Failed to load servers:', serversResponse.error);
        }

        // Load current user info
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.success && userResponse.data && !user) {
            console.log('Current user loaded:', userResponse.data);
            login(userResponse.data);
          }
        } catch (userError) {
          console.warn('Failed to load current user, using demo user');
          // Fallback to demo user if API fails
          if (!user) {
            const demoUser: User = {
              id: 'demo-user',
              username: 'demo',
              displayName: 'Demo User',
              email: 'demo@cryb.com',
              status: UserStatus.ONLINE,
              isOnline: true,
              createdAt: new Date(),
              roles: []
            };
            login(demoUser);
          }
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        
        // Fallback to demo data if API fails
        const fallbackServers: Server[] = [
          {
            id: 'demo-server-1',
            name: 'Demo Server',
            description: 'A demo server for testing',
            icon: '🚀',
            banner: null,
            ownerId: 'demo-user',
            isPublic: true,
            memberCount: 1,
            createdAt: new Date(),
            inviteCode: 'demo',
            roles: [],
            members: [],
            channels: [
              {
                id: 'demo-channel-1',
                name: 'general',
                description: 'General chat channel',
                type: 'text' as any,
                serverId: 'demo-server-1',
                position: 1,
                isNsfw: false,
                createdAt: new Date(),
                permissions: [],
              }
            ]
          }
        ];
        
        console.log('Using fallback demo data');
        setServers(fallbackServers);
        
        if (!selectedServerId) {
          selectServer(fallbackServers[0].id);
          selectChannel(fallbackServers[0].channels[0].id);
        }
      } finally {
        setLoadingServers(false);
      }
    };

    if (connected) {
      loadInitialData();
    }

    setupSocketEvents();

    // Cleanup function
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('server-state');
      socket.off('new-message');
      socket.off('channel-history');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-joined-channel');
      socket.off('user-left-channel');
    };
  }, [connected, user]);

  return (
    <div className="h-screen w-full bg-gray-900 relative">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          connected 
            ? 'bg-green-900/80 text-green-300 border border-green-500/30' 
            : 'bg-red-900/80 text-red-300 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      <AppLayout />
    </div>
  );
}