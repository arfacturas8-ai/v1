/**
 * React Hook for Server Management
 * Provides state management and API integration for Discord-like servers
 */

import { useState, useEffect, useCallback } from 'react';
import serverService from '../services/serverService';
import websocketService from '../services/websocketService';

export const useServers = () => {
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all servers for the current user
  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.getServers();
      
      if (result.success) {
        setServers(result.servers);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new server
  const createServer = useCallback(async (serverData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.createServer(serverData);
      
      if (result.success) {
        setServers(prev => [...prev, result.server]);
        
        // Automatically join the WebSocket room for the new server
        websocketService.joinServer(result.server.id);
        
        return result.server;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create server:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join an existing server
  const joinServer = useCallback(async (serverId, inviteCode = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.joinServer(serverId, inviteCode);
      
      if (result.success) {
        // Add server to the list if it's not already there
        setServers(prev => {
          const exists = prev.find(s => s.id === result.server.id);
          return exists ? prev : [...prev, result.server];
        });
        
        // Join WebSocket room
        websocketService.joinServer(result.server.id);
        
        return result.server;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to join server:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join server by invite code
  const joinByInvite = useCallback(async (inviteCode) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.joinByInvite(inviteCode);
      
      if (result.success) {
        setServers(prev => {
          const exists = prev.find(s => s.id === result.server.id);
          return exists ? prev : [...prev, result.server];
        });
        
        websocketService.joinServer(result.server.id);
        
        return result.server;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to join server by invite:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave a server
  const leaveServer = useCallback(async (serverId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.leaveServer(serverId);
      
      if (result.success) {
        setServers(prev => prev.filter(s => s.id !== serverId));
        
        // Leave WebSocket room
        websocketService.leaveServer(serverId);
        
        // Clear current server if it's the one being left
        if (currentServer && currentServer.id === serverId) {
          setCurrentServer(null);
        }
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to leave server:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentServer]);

  // Update server
  const updateServer = useCallback(async (serverId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.updateServer(serverId, updateData);
      
      if (result.success) {
        setServers(prev => 
          prev.map(s => s.id === serverId ? result.server : s)
        );
        
        if (currentServer && currentServer.id === serverId) {
          setCurrentServer(result.server);
        }
        
        return result.server;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update server:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentServer]);

  // Delete server
  const deleteServer = useCallback(async (serverId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.deleteServer(serverId);
      
      if (result.success) {
        setServers(prev => prev.filter(s => s.id !== serverId));
        websocketService.leaveServer(serverId);
        
        if (currentServer && currentServer.id === serverId) {
          setCurrentServer(null);
        }
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentServer]);

  // Select/switch to a server
  const selectServer = useCallback((server) => {
    if (currentServer && currentServer.id === server.id) return;
    
    // Leave current server WebSocket room
    if (currentServer) {
      websocketService.leaveServer(currentServer.id);
    }
    
    setCurrentServer(server);
    
    // Join new server WebSocket room
    if (server) {
      websocketService.joinServer(server.id);
    }
  }, [currentServer]);

  // Get server by ID
  const getServerById = useCallback((serverId) => {
    return servers.find(s => s.id === serverId);
  }, [servers]);

  // Search public servers
  const searchServers = useCallback(async (query = '', filters = {}) => {
    try {
      const result = await serverService.searchPublicServers(query, filters);
      
      if (result.success) {
        return result.servers;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to search servers:', error);
      throw error;
    }
  }, []);

  // Load initial servers
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // WebSocket event listeners
  useEffect(() => {
    const handleServerUpdated = (data) => {
      setServers(prev => 
        prev.map(s => s.id === data.serverId ? { ...s, ...data.updates } : s)
      );
      
      if (currentServer && currentServer.id === data.serverId) {
        setCurrentServer(prev => ({ ...prev, ...data.updates }));
      }
    };

    const handleMemberJoined = (data) => {
      setServers(prev => 
        prev.map(s => s.id === data.serverId 
          ? { 
              ...s, 
              memberCount: (s.memberCount || 0) + 1,
              members: [...(s.members || []), data.member]
            } 
          : s
        )
      );
    };

    const handleMemberLeft = (data) => {
      setServers(prev => 
        prev.map(s => s.id === data.serverId 
          ? { 
              ...s, 
              memberCount: Math.max((s.memberCount || 1) - 1, 0),
              members: (s.members || []).filter(m => m.id !== data.userId)
            } 
          : s
        )
      );
    };

    // Register WebSocket event listeners
    websocketService.on('server:updated', handleServerUpdated);
    websocketService.on('server:member_joined', handleMemberJoined);
    websocketService.on('server:member_left', handleMemberLeft);

    // Cleanup
    return () => {
      websocketService.off('server:updated', handleServerUpdated);
      websocketService.off('server:member_joined', handleMemberJoined);
      websocketService.off('server:member_left', handleMemberLeft);
    };
  }, [currentServer]);

  return {
    // State
    servers,
    currentServer,
    loading,
    error,
    
    // Actions
    loadServers,
    createServer,
    joinServer,
    joinByInvite,
    leaveServer,
    updateServer,
    deleteServer,
    selectServer,
    searchServers,
    
    // Utilities
    getServerById,
    
    // Server count
    serverCount: servers.length
  };
};

export default useServers;