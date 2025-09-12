"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import { useChatStore } from '@/lib/stores/use-chat-store';
import { useVoiceStore } from '@/lib/stores/use-voice-store';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';
import { Server, User, ChannelType, UserStatus } from '@/lib/types';

export function useAppInitialization() {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    setServers, 
    setUsers, 
    addMessage, 
    setTyping, 
    setConnecting,
    selectServer
  } = useChatStore();
  const { setConnected } = useVoiceStore();
  
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || initialized.current) {
      return;
    }

    const initializeApp = async () => {
      console.log('Initializing app for user:', user.username);
      initialized.current = true;
      
      try {
        setConnecting(true);

        // Load servers and channels from API
        const serversResponse = await api.getServers();
        if (serversResponse.success && serversResponse.data) {
          console.log('Loaded servers:', serversResponse.data);
          setServers(serversResponse.data);
          
          // Auto-select first server if available
          if (serversResponse.data.length > 0) {
            selectServer(serversResponse.data[0].id);
          }
        } else {
          console.log('No servers found, creating demo data...');
          // Create demo server for testing
          await createDemoData();
        }

        // Connect socket with authentication
        const token = localStorage.getItem('auth-token');
        if (token) {
          console.log('Connecting socket with token...');
          socket.connect(token);
          setupSocketListeners();
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setConnecting(false);
      }
    };

    initializeApp();
  }, [isAuthenticated, user, setServers, setUsers, setConnecting, selectServer, setConnected]);

  const createDemoData = async () => {
    try {
      // Create a demo server
      const serverResponse = await api.createServer({
        name: "CRYB Demo Server",
        description: "Welcome to the CRYB platform demo!"
      });
      
      if (serverResponse.success && serverResponse.data) {
        console.log('Created demo server:', serverResponse.data);
        
        // Create demo channels
        const serverId = serverResponse.data.id;
        
        await api.createChannel(serverId, {
          name: "general",
          type: ChannelType.TEXT,
          description: "General discussion"
        });
        
        await api.createChannel(serverId, {
          name: "random",
          type: ChannelType.TEXT,
          description: "Random chat"
        });
        
        await api.createChannel(serverId, {
          name: "Voice Chat",
          type: ChannelType.VOICE,
          description: "General voice channel"
        });
        
        // Reload servers to get the updated data with channels
        const updatedServersResponse = await api.getServers();
        if (updatedServersResponse.success && updatedServersResponse.data) {
          setServers(updatedServersResponse.data);
          selectServer(serverId);
        }
      }
    } catch (error) {
      console.error('Failed to create demo data:', error);
    }
  };

  const setupSocketListeners = () => {
    console.log('Setting up socket listeners...');
    
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected!');
      setConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    // Message events
    socket.on('new-message', (message) => {
      console.log('New message received:', message);
      addMessage(message);
    });
    
    // Typing events
    socket.on('user-typing', ({ userId, channelId }) => {
      setTyping(channelId, userId, true);
    });
    
    socket.on('user-stop-typing', ({ userId, channelId }) => {
      setTyping(channelId, userId, false);
    });
    
    // Server events
    socket.on('joined-server', ({ serverId }) => {
      console.log('Joined server:', serverId);
      // Refresh server data
      api.getServers().then(response => {
        if (response.success && response.data) {
          setServers(response.data);
        }
      });
    });
    
    // Channel events
    socket.on('joined-channel', ({ channelId }) => {
      console.log('Joined channel:', channelId);
    });
    
    socket.on('channel-history', ({ channelId, messages }) => {
      console.log('Received channel history for', channelId, messages.length, 'messages');
      // This would be handled by the chat area component
    });
    
    // Voice events
    socket.on('user-joined-voice', (data) => {
      console.log('User joined voice:', data);
    });
    
    socket.on('user-left-voice', (data) => {
      console.log('User left voice:', data);
    });
  };

  return {
    initialized: initialized.current
  };
}