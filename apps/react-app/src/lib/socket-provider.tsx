'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/ui/toast-provider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user, token, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      setIsConnecting(true);
      
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001', {
        auth: {
          token,
          userId: user?.id,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        timeout: 20000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        
        // Join user's personal room
        if (user?.id) {
          newSocket.emit('join-user-room', user.id);
        }
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnecting(false);
        
        addToast({
          title: 'Connection Error',
          description: 'Unable to establish real-time connection. Some features may be limited.',
          type: 'warning',
        });
      });

      newSocket.on('reconnect', (attemptNumber) => {
        addToast({
          title: 'Reconnected',
          description: 'Real-time connection restored.',
          type: 'success',
        });
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        addToast({
          title: 'Connection Failed',
          description: 'Unable to restore real-time connection. Please refresh the page.',
          type: 'error',
        });
      });

      // Global event handlers
      newSocket.on('user-online', (userId: string) => {
      });

      newSocket.on('user-offline', (userId: string) => {
      });

      newSocket.on('notification', (notification: any) => {
        addToast({
          title: notification.title,
          description: notification.message,
          type: notification.type || 'info',
        });
      });

      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
        addToast({
          title: 'Error',
          description: error.message || 'An unexpected error occurred.',
          type: 'error',
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
      };
    }
  }, [isAuthenticated, token]);

  // Cleanup on logout
  useEffect(() => {
    if (!isAuthenticated && socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave-room', room);
    }
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Custom hooks for specific socket functionality
export function useSocketEvent(event: string, callback: (...args: any[]) => void) {
  const { on, off } = useSocket();
  
  useEffect(() => {
    on(event, callback);
    return () => off(event, callback);
  }, [event, callback, on, off]);
}

export function useRoomSocket(room: string) {
  const { joinRoom, leaveRoom, isConnected } = useSocket();
  
  useEffect(() => {
    if (isConnected && room) {
      joinRoom(room);
      return () => leaveRoom(room);
    }
  }, [room, isConnected, joinRoom, leaveRoom]);
}