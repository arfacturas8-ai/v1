/**
 * Real-Time Chat Service for CRYB Platform
 * Handles messaging, channels, and real-time communication
 * Connected to backend API with WebSocket support
 */

import apiService from './api'
import websocketService from './websocketService'
import channelService from './channelService'

class ChatService {
  constructor() {
    this.currentUser = null
    this.channels = new Map()
    this.servers = new Map()
    this.directMessages = new Map()
    this.eventListeners = new Map()
    this.isInitialized = false

    // Setup WebSocket event handlers
    this.setupWebSocketHandlers()
  }

  // Setup WebSocket event handlers
  setupWebSocketHandlers() {
    websocketService.on('message:received', (data) => {
      this.handleNewMessage(data)
    })
    
    websocketService.on('channel:updated', (data) => {
      this.handleChannelUpdate(data)
    })
    
    websocketService.on('user:online', (data) => {
      this.emit('user:online', data)
    })
    
    websocketService.on('user:offline', (data) => {
      this.emit('user:offline', data)
    })

    websocketService.on('typing:start', (data) => {
      this.emit('typing:start', data)
    })

    websocketService.on('typing:stop', (data) => {
      this.emit('typing:stop', data)
    })
  }

  // Initialize chat service with user
  async initialize(user) {
    this.currentUser = user
    this.isInitialized = true

    try {
      // Load user's servers and channels from backend
      await this.loadUserServers()
      await this.loadUserChannels()
      await this.loadDirectMessages()
      
      this.emit('initialized', { user })
    } catch (error) {
      console.error('[ChatService] Failed to initialize:', error)
      throw error
    }
  }

  // Load user's servers from backend
  async loadUserServers() {
    try {
      const response = await apiService.get('/servers')
      if (response.success && response.data?.servers) {
        response.data.servers.forEach(server => {
          this.servers.set(server.id, server)
        })
        this.emit('servers:loaded', Array.from(this.servers.values()))
      }
    } catch (error) {
      console.error('[ChatService] Failed to load servers:', error)
      // Don't throw - allow app to continue with empty servers
    }
  }

  // Load user's channels from backend
  async loadUserChannels() {
    try {
      // Note: This endpoint may need serverId parameter for proper filtering
      const response = await apiService.get('/channels')
      if (response.success && response.data?.channels) {
        response.data.channels.forEach(channel => {
          this.channels.set(channel.id, channel)
        })
        this.emit('channels:loaded', Array.from(this.channels.values()))
      }
    } catch (error) {
      console.error('[ChatService] Failed to load channels:', error)
      // Don't throw - allow app to continue with empty channels
    }
  }

  // Load direct messages
  async loadDirectMessages() {
    try {
      const response = await apiService.get('/direct-messages')
      if (response.success && response.data?.conversations) {
        response.data.conversations.forEach(conversation => {
          this.directMessages.set(conversation.id, conversation)
        })
        this.emit('direct-messages:loaded', Array.from(this.directMessages.values()))
      }
    } catch (error) {
      console.error('[ChatService] Failed to load direct messages:', error)
      // Don't throw - allow app to continue
    }
  }

  // Get all channels
  getChannels() {
    return Array.from(this.channels.values())
  }

  // Get channel by ID
  getChannel(channelId) {
    return this.channels.get(channelId)
  }

  // Get channel messages
  async getChannelMessages(channelId, options = {}) {
    try {
      const result = await channelService.getMessages(channelId, options)
      if (result.success && result.messages) {
        return result.messages
      }
      return []
    } catch (error) {
      console.error('[ChatService] Failed to load messages:', error)
      return []
    }
  }

  // Send message to channel
  async sendMessage(channelId, content, type = 'text', metadata = {}) {
    if (!this.currentUser) {
      throw new Error('Cannot send message: No user logged in')
    }

    try {
      const messageData = {
        channelId,
        content,
        type,
        metadata
      }

      // Send via WebSocket for real-time delivery
      const success = websocketService.sendMessage(channelId, content, type, metadata)
      
      if (!success) {
        // Fallback to HTTP API if WebSocket fails
        const response = await apiService.post('/messages', messageData)
        if (response.success && response.data?.message) {
          this.emit('message:sent', response.data.message)
          return response.data.message
        }
      } else {
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to send message:', error)
      throw error
    }
  }

  // Join a channel
  async joinChannel(channelId) {
    if (!this.currentUser) {
      throw new Error('Cannot join channel: No user logged in')
    }

    try {
      // Join via WebSocket
      websocketService.joinChannel(channelId)
      
      // Also update backend
      const response = await apiService.post(`/channels/${channelId}/join`)
      if (response.success) {
        this.emit('channel:joined', { channelId, userId: this.currentUser.id })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to join channel:', error)
      throw error
    }
  }

  // Leave a channel
  async leaveChannel(channelId) {
    if (!this.currentUser) {
      throw new Error('Cannot leave channel: No user logged in')
    }

    try {
      // Leave via WebSocket
      websocketService.leaveChannel(channelId)
      
      // Also update backend
      const response = await apiService.post(`/channels/${channelId}/leave`)
      if (response.success) {
        this.emit('channel:left', { channelId, userId: this.currentUser.id })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to leave channel:', error)
      throw error
    }
  }

  // Get all servers
  getServers() {
    return Array.from(this.servers.values())
  }

  // Get server by ID
  getServer(serverId) {
    return this.servers.get(serverId)
  }

  // Join server
  async joinServer(serverId) {
    try {
      websocketService.joinServer(serverId)
      const response = await apiService.post(`/servers/${serverId}/join`)
      if (response.success) {
        this.emit('server:joined', { serverId, userId: this.currentUser.id })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to join server:', error)
      throw error
    }
  }

  // Leave server
  async leaveServer(serverId) {
    try {
      websocketService.leaveServer(serverId)
      const response = await apiService.post(`/servers/${serverId}/leave`)
      if (response.success) {
        this.emit('server:left', { serverId, userId: this.currentUser.id })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to leave server:', error)
      throw error
    }
  }

  // Get direct messages
  getDirectMessages() {
    return Array.from(this.directMessages.values())
  }

  // Send direct message
  async sendDirectMessage(recipientId, content, type = 'direct_message') {
    if (!this.currentUser) {
      throw new Error('Cannot send DM: No user logged in')
    }

    try {
      const messageData = {
        recipientId,
        content,
        type
      }

      const response = await apiService.post('/direct-messages', messageData)
      if (response.success && response.data?.message) {
        this.emit('direct-message:sent', response.data.message)
        return response.data.message
      }
    } catch (error) {
      console.error('[ChatService] Failed to send direct message:', error)
      throw error
    }
  }

  // Start typing indicator
  startTyping(channelId) {
    websocketService.startTyping(channelId)
    // Also send via HTTP API for redundancy
    channelService.sendTypingIndicator(channelId).catch(err =>
      console.warn('[ChatService] Failed to send typing indicator via API:', err)
    )
  }

  // Stop typing indicator
  stopTyping(channelId) {
    websocketService.stopTyping(channelId)
  }

  // Handle new message from WebSocket
  handleNewMessage(data) {
    this.emit('message:received', data)
  }

  // Handle channel update from WebSocket
  handleChannelUpdate(data) {
    if (data.channel) {
      this.channels.set(data.channel.id, data.channel)
      this.emit('channel:updated', data)
    }
  }

  // Get online users for a server/channel
  async getOnlineUsers(serverId = null) {
    try {
      const endpoint = serverId ? `/servers/${serverId}/members` : '/users/online'
      const response = await apiService.get(endpoint)
      if (response.success && response.data?.users) {
        return response.data.users
      }
      return []
    } catch (error) {
      console.error('[ChatService] Failed to load online users:', error)
      return []
    }
  }

  // Search messages
  async searchMessages(query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        channelId: options.channelId || '',
        serverId: options.serverId || '',
        limit: options.limit || '50'
      })
      
      const response = await apiService.get(`/search/messages?${params}`)
      if (response.success && response.data?.messages) {
        return response.data.messages
      }
      return []
    } catch (error) {
      console.error('[ChatService] Failed to search messages:', error)
      return []
    }
  }

  // Edit message
  async editMessage(messageId, content, channelId = null) {
    try {
      const response = await apiService.put(`/messages/${messageId}`, { content })
      if (response.success && response.data?.message) {
        this.emit('message:edited', { messageId, content, channelId })
        return response.data.message
      }
    } catch (error) {
      console.error('[ChatService] Failed to edit message:', error)
      throw error
    }
  }

  // Delete message
  async deleteMessage(messageId, channelId = null) {
    try {
      const response = await apiService.delete(`/messages/${messageId}`)
      if (response.success) {
        this.emit('message:deleted', { messageId, channelId })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to delete message:', error)
      throw error
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji, channelId = null) {
    try {
      const response = await apiService.post(`/messages/${messageId}/reactions`, { emoji })
      if (response.success) {
        this.emit('reaction:added', { messageId, emoji, channelId })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to add reaction:', error)
      throw error
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, emoji, channelId = null) {
    try {
      const response = await apiService.delete(`/messages/${messageId}/reactions/${emoji}`)
      if (response.success) {
        this.emit('reaction:removed', { messageId, emoji, channelId })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to remove reaction:', error)
      throw error
    }
  }

  // Mark message as read
  async markAsRead(messageId, channelId = null) {
    try {
      const response = await apiService.post(`/messages/${messageId}/read`)
      if (response.success) {
        this.emit('message:read', { messageId, channelId, userId: this.currentUser.id })
        return true
      }
    } catch (error) {
      console.error('[ChatService] Failed to mark message as read:', error)
    }
  }

  // Event system
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event).add(handler)
  }

  off(event, handler) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(handler)
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[ChatService] Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Get connection status
  getConnectionStatus() {
    return websocketService.getConnectionStatus()
  }

  // Cleanup
  destroy() {
    this.channels.clear()
    this.servers.clear()
    this.directMessages.clear()
    this.eventListeners.clear()
    this.isInitialized = false
  }
}

// Create and export singleton instance
const chatService = new ChatService()

export default chatService