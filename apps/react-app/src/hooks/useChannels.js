/**
 * React Hook for Channel Management
 * Provides state management and API integration for Discord-like channels
 */

import { useState, useEffect, useCallback } from 'react';
import channelService from '../services/channelService';
import websocketService from '../services/websocketService';

export const useChannels = (serverId = null) => {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load channels for a server
  const loadChannels = useCallback(async (targetServerId = null) => {
    const serverIdToUse = targetServerId || serverId;
    if (!serverIdToUse) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await channelService.getServerChannels?.(serverIdToUse) || 
                     await serverService.getServerChannels(serverIdToUse);
      
      if (result.success) {
        setChannels(result.channels);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  // Get channel by ID
  const getChannel = useCallback(async (channelId) => {
    try {
      const result = await channelService.getChannel(channelId);
      
      if (result.success) {
        return result.channel;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to get channel:', error);
      throw error;
    }
  }, []);

  // Create a new channel
  const createChannel = useCallback(async (channelData) => {
    if (!serverId) {
      throw new Error('Server ID is required to create a channel');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await serverService.createChannel(serverId, channelData);
      
      if (result.success) {
        setChannels(prev => [...prev, result.channel]);
        return result.channel;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  // Update channel
  const updateChannel = useCallback(async (channelId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await channelService.updateChannel(channelId, updateData);
      
      if (result.success) {
        setChannels(prev => 
          prev.map(c => c.id === channelId ? result.channel : c)
        );
        
        if (currentChannel && currentChannel.id === channelId) {
          setCurrentChannel(result.channel);
        }
        
        return result.channel;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update channel:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentChannel]);

  // Delete channel
  const deleteChannel = useCallback(async (channelId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await channelService.deleteChannel(channelId);
      
      if (result.success) {
        setChannels(prev => prev.filter(c => c.id !== channelId));
        
        // Leave WebSocket room
        websocketService.leaveChannel(channelId);
        
        if (currentChannel && currentChannel.id === channelId) {
          setCurrentChannel(null);
        }
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentChannel]);

  // Select/switch to a channel
  const selectChannel = useCallback(async (channel) => {
    if (currentChannel && currentChannel.id === channel.id) return;
    
    // Leave current channel WebSocket room
    if (currentChannel) {
      websocketService.leaveChannel(currentChannel.id);
    }
    
    try {
      // Get full channel data if we only have basic info
      let fullChannel = channel;
      if (!channel.messages && !channel.permissions) {
        const result = await getChannel(channel.id);
        fullChannel = result;
      }
      
      setCurrentChannel(fullChannel);
      
      // Join new channel WebSocket room
      websocketService.joinChannel(fullChannel.id);
      
      // Mark channel as read
      try {
        await channelService.markAsRead(fullChannel.id);
      } catch (error) {
      }
      
      return fullChannel;
    } catch (error) {
      console.error('Failed to select channel:', error);
      setError(error.message);
      throw error;
    }
  }, [currentChannel, getChannel]);

  // Get channel by ID from current channels
  const getChannelById = useCallback((channelId) => {
    return channels.find(c => c.id === channelId);
  }, [channels]);

  // Get channels by type
  const getChannelsByType = useCallback((type) => {
    return channels.filter(c => c.type === type);
  }, [channels]);

  // Get text channels
  const getTextChannels = useCallback(() => {
    return getChannelsByType('text');
  }, [getChannelsByType]);

  // Get voice channels
  const getVoiceChannels = useCallback(() => {
    return getChannelsByType('voice');
  }, [getChannelsByType]);

  // Get channels organized by category
  const getChannelsByCategory = useCallback(() => {
    const organized = {
      uncategorized: [],
      categories: {}
    };

    channels.forEach(channel => {
      if (channel.categoryId) {
        if (!organized.categories[channel.categoryId]) {
          organized.categories[channel.categoryId] = {
            id: channel.categoryId,
            name: channel.categoryName || 'Category',
            channels: []
          };
        }
        organized.categories[channel.categoryId].channels.push(channel);
      } else {
        organized.uncategorized.push(channel);
      }
    });

    return organized;
  }, [channels]);

  // Load channels when serverId changes
  useEffect(() => {
    if (serverId) {
      loadChannels();
    } else {
      setChannels([]);
      setCurrentChannel(null);
    }
  }, [serverId, loadChannels]);

  // WebSocket event listeners
  useEffect(() => {
    const handleChannelUpdated = (data) => {
      setChannels(prev => 
        prev.map(c => c.id === data.channelId ? { ...c, ...data.updates } : c)
      );
      
      if (currentChannel && currentChannel.id === data.channelId) {
        setCurrentChannel(prev => ({ ...prev, ...data.updates }));
      }
    };

    const handleUserJoined = (data) => {
      if (currentChannel && currentChannel.id === data.channelId) {
        setCurrentChannel(prev => ({
          ...prev,
          onlineMembers: [...(prev.onlineMembers || []), data.user]
        }));
      }
    };

    const handleUserLeft = (data) => {
      if (currentChannel && currentChannel.id === data.channelId) {
        setCurrentChannel(prev => ({
          ...prev,
          onlineMembers: (prev.onlineMembers || []).filter(u => u.id !== data.userId)
        }));
      }
    };

    // Register WebSocket event listeners
    websocketService.on('channel:updated', handleChannelUpdated);
    websocketService.on('channel:user_joined', handleUserJoined);
    websocketService.on('channel:user_left', handleUserLeft);

    // Cleanup
    return () => {
      websocketService.off('channel:updated', handleChannelUpdated);
      websocketService.off('channel:user_joined', handleUserJoined);
      websocketService.off('channel:user_left', handleUserLeft);
    };
  }, [currentChannel]);

  return {
    // State
    channels,
    currentChannel,
    loading,
    error,
    
    // Actions
    loadChannels,
    getChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    selectChannel,
    
    // Utilities
    getChannelById,
    getChannelsByType,
    getTextChannels,
    getVoiceChannels,
    getChannelsByCategory,
    
    // Channel counts
    channelCount: channels.length,
    textChannelCount: getTextChannels().length,
    voiceChannelCount: getVoiceChannels().length
  };
};

export default useChannels;