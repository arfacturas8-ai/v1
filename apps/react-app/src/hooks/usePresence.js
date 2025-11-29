/**
 * React Hook for User Presence Tracking
 * Provides real-time user presence and status management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import { useAuth } from '../contexts/AuthContext';

export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [userStatuses, setUserStatuses] = useState(new Map());
  const [currentStatus, setCurrentStatus] = useState('online');
  
  const { user } = useAuth();
  const presenceTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Update user status
  const updateStatus = useCallback((status) => {
    if (!user || currentStatus === status) return;
    
    setCurrentStatus(status);
    websocketService.updateStatus(status);
    
    // Update local status immediately
    setUserStatuses(prev => new Map(prev.set(user.id, {
      status,
      lastSeen: new Date().toISOString(),
      customMessage: null
    })));
  }, [user, currentStatus]);

  // Set custom status message
  const setCustomStatus = useCallback((message) => {
    if (!user) return;
    
    websocketService.updateStatus(currentStatus, message);
    
    setUserStatuses(prev => new Map(prev.set(user.id, {
      status: currentStatus,
      lastSeen: new Date().toISOString(),
      customMessage: message
    })));
  }, [user, currentStatus]);

  // Get user presence info
  const getUserPresence = useCallback((userId) => {
    const isOnline = onlineUsers.has(userId);
    const status = userStatuses.get(userId) || {
      status: isOnline ? 'online' : 'offline',
      lastSeen: null,
      customMessage: null
    };
    
    return {
      isOnline,
      ...status
    };
  }, [onlineUsers, userStatuses]);

  // Get online users count
  const getOnlineCount = useCallback(() => {
    return onlineUsers.size;
  }, [onlineUsers]);

  // Get online users list
  const getOnlineUsers = useCallback(() => {
    return Array.from(onlineUsers.values());
  }, [onlineUsers]);

  // Get users by status
  const getUsersByStatus = useCallback((status) => {
    const users = [];
    for (const [userId, userStatus] of userStatuses) {
      if (userStatus.status === status) {
        const user = onlineUsers.get(userId);
        if (user) {
          users.push({
            ...user,
            ...userStatus
          });
        }
      }
    }
    return users;
  }, [onlineUsers, userStatuses]);

  // Activity tracking
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // If we're idle/away, set back to online
    if (currentStatus === 'idle' || currentStatus === 'away') {
      updateStatus('online');
    }
    
    // Reset inactivity timer
    if (presenceTimeoutRef.current) {
      clearTimeout(presenceTimeoutRef.current);
    }
    
    // Set to idle after 5 minutes of inactivity
    presenceTimeoutRef.current = setTimeout(() => {
      if (currentStatus === 'online') {
        updateStatus('idle');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [currentStatus, updateStatus]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // User switched tabs/minimized - set to away after a delay
      setTimeout(() => {
        if (document.hidden && currentStatus !== 'dnd') {
          updateStatus('away');
        }
      }, 2 * 60 * 1000); // 2 minutes
    } else {
      // User returned - set to online
      if (currentStatus === 'away' || currentStatus === 'idle') {
        updateStatus('online');
        trackActivity();
      }
    }
  }, [currentStatus, updateStatus, trackActivity]);

  // Initialize presence tracking
  useEffect(() => {
    if (!user) return;

    // Set initial status
    updateStatus('online');
    trackActivity();

    // Add activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const throttledTrackActivity = throttle(trackActivity, 30000); // Throttle to once per 30 seconds

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (presenceTimeoutRef.current) {
        clearTimeout(presenceTimeoutRef.current);
      }
    };
  }, [user, updateStatus, trackActivity, handleVisibilityChange]);

  // WebSocket event listeners
  useEffect(() => {
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Map(prev.set(data.userId, {
        id: data.userId,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar,
        joinedAt: data.timestamp || new Date().toISOString()
      })));
      
      setUserStatuses(prev => new Map(prev.set(data.userId, {
        status: data.status || 'online',
        lastSeen: data.timestamp || new Date().toISOString(),
        customMessage: data.customMessage || null
      })));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      
      setUserStatuses(prev => new Map(prev.set(data.userId, {
        status: 'offline',
        lastSeen: data.timestamp || new Date().toISOString(),
        customMessage: null
      })));
    };

    const handleUserStatus = (data) => {
      setUserStatuses(prev => new Map(prev.set(data.userId, {
        status: data.status,
        lastSeen: data.timestamp || new Date().toISOString(),
        customMessage: data.customMessage || null
      })));
      
      // If user is coming online, add to online users
      if (data.status !== 'offline' && !onlineUsers.has(data.userId)) {
        setOnlineUsers(prev => new Map(prev.set(data.userId, {
          id: data.userId,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar,
          joinedAt: data.timestamp || new Date().toISOString()
        })));
      }
    };

    // Register WebSocket event listeners
    websocketService.on('user:online', handleUserOnline);
    websocketService.on('user:offline', handleUserOffline);
    websocketService.on('user:status', handleUserStatus);

    // Cleanup
    return () => {
      websocketService.off('user:online', handleUserOnline);
      websocketService.off('user:offline', handleUserOffline);
      websocketService.off('user:status', handleUserStatus);
    };
  }, [onlineUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        // Set offline status when component unmounts
        websocketService.updateStatus('offline');
      }
    };
  }, [user]);

  return {
    // State
    onlineUsers: Array.from(onlineUsers.values()),
    currentStatus,
    
    // Actions
    updateStatus,
    setCustomStatus,
    trackActivity,
    
    // Utilities
    getUserPresence,
    getOnlineCount,
    getOnlineUsers,
    getUsersByStatus,
    
    // Status counts
    onlineCount: getOnlineCount(),
    idleCount: getUsersByStatus('idle').length,
    awayCount: getUsersByStatus('away').length,
    dndCount: getUsersByStatus('dnd').length
  };
};

// Throttle helper function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default usePresence;