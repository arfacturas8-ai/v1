/**
 * Real-time Socket.io Client Service for CRYB Platform
 * Replaces MockWebSocket with real WebSocket connections
 */
import { io } from 'socket.io-client'
import apiService from './api'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  connect() {
    if (this.socket) {
      this.disconnect()
    }

    const token = apiService.getAuthToken()
    if (!token) {
      return
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'https://api.cryb.ai'
    
    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000
    })

    this.setupEventHandlers()
    return this.socket
  }

  setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.connected = true
      this.reconnectAttempts = 0
      this.emit('connected', { status: 'connected', socketId: this.socket.id })
    })

    this.socket.on('disconnect', (reason) => {
      this.connected = false
      this.emit('disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket.io connection error:', error)
      this.connected = false
      this.emit('connection_error', { error: error.message })
    })

    this.socket.on('reconnect', (attemptNumber) => {
      this.connected = true
      this.emit('reconnected', { attemptNumber })
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 Socket.io reconnection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🔌 Max reconnection attempts reached')
        this.emit('max_reconnect_attempts_reached')
      }
    })

    // Real-time message events
    this.socket.on('message_received', (message) => {
      this.emit('message_received', message)
    })

    this.socket.on('message_sent', (message) => {
      this.emit('message_sent', message)
    })

    this.socket.on('message_updated', (message) => {
      this.emit('message_updated', message)
    })

    this.socket.on('message_deleted', (messageId) => {
      this.emit('message_deleted', messageId)
    })

    // Direct Message events
    this.socket.on('direct_message_received', (message) => {
      this.emit('direct_message_received', message)
    })

    this.socket.on('direct_message_sent', (message) => {
      this.emit('direct_message_sent', message)
    })

    this.socket.on('conversation_created', (conversation) => {
      this.emit('conversation_created', conversation)
    })

    this.socket.on('conversations_list', (conversations) => {
      this.emit('conversations_list', conversations)
    })

    this.socket.on('direct_messages_list', (messages) => {
      this.emit('direct_messages_list', messages)
    })

    this.socket.on('conversation_updated', (conversation) => {
      this.emit('conversation_updated', conversation)
    })

    // User activity events
    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data)
    })

    this.socket.on('user_left', (data) => {
      this.emit('user_left', data)
    })

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data)
    })

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data)
    })

    this.socket.on('user_status_changed', (data) => {
      this.emit('user_status_changed', data)
    })

    // Channel events
    this.socket.on('channel_created', (channel) => {
      this.emit('channel_created', channel)
    })

    this.socket.on('channel_updated', (channel) => {
      this.emit('channel_updated', channel)
    })

    this.socket.on('channel_deleted', (channelId) => {
      this.emit('channel_deleted', channelId)
    })

    // Server events
    this.socket.on('server_updated', (server) => {
      this.emit('server_updated', server)
    })

    this.socket.on('member_joined', (data) => {
      this.emit('member_joined', data)
    })

    this.socket.on('member_left', (data) => {
      this.emit('member_left', data)
    })

    // Voice/Video events
    this.socket.on('voice_user_joined', (data) => {
      this.emit('voice_user_joined', data)
    })

    this.socket.on('voice_user_left', (data) => {
      this.emit('voice_user_left', data)
    })

    this.socket.on('voice_user_muted', (data) => {
      this.emit('voice_user_muted', data)
    })

    this.socket.on('voice_user_unmuted', (data) => {
      this.emit('voice_user_unmuted', data)
    })

    // Notification events
    this.socket.on('notification', (notification) => {
      this.emit('notification', notification)
    })

    // Community events
    this.socket.on('community_created', (community) => {
      this.emit('community_created', community)
    })

    this.socket.on('community_updated', (community) => {
      this.emit('community_updated', community)
    })

    this.socket.on('community_deleted', (communityId) => {
      this.emit('community_deleted', communityId)
    })

    this.socket.on('community_member_count_updated', (data) => {
      this.emit('community_member_count_updated', data)
    })

    // Community member events
    this.socket.on('member_joined', (data) => {
      this.emit('member_joined', data)
    })

    this.socket.on('member_left', (data) => {
      this.emit('member_left', data)
    })

    this.socket.on('member_role_updated', (data) => {
      this.emit('member_role_updated', data)
    })

    this.socket.on('member_banned', (data) => {
      this.emit('member_banned', data)
    })

    this.socket.on('member_unbanned', (data) => {
      this.emit('member_unbanned', data)
    })

    // Community post events
    this.socket.on('community_post_created', (post) => {
      this.emit('community_post_created', post)
    })

    this.socket.on('community_post_updated', (post) => {
      this.emit('community_post_updated', post)
    })

    this.socket.on('community_post_deleted', (postId) => {
      this.emit('community_post_deleted', postId)
    })

    this.socket.on('community_post_vote_updated', (data) => {
      this.emit('community_post_vote_updated', data)
    })

    // Community comment events
    this.socket.on('community_comment_created', (comment) => {
      this.emit('community_comment_created', comment)
    })

    this.socket.on('community_comment_updated', (comment) => {
      this.emit('community_comment_updated', comment)
    })

    this.socket.on('community_comment_deleted', (commentId) => {
      this.emit('community_comment_deleted', commentId)
    })

    // Moderation events
    this.socket.on('moderation_queue_updated', (data) => {
      this.emit('moderation_queue_updated', data)
    })

    this.socket.on('content_moderated', (data) => {
      this.emit('content_moderated', data)
    })

    // Analytics events
    this.socket.on('analytics_updated', (data) => {
      this.emit('analytics_updated', data)
    })

    // Community event notifications
    this.socket.on('community_event_created', (event) => {
      this.emit('community_event_created', event)
    })

    this.socket.on('community_event_updated', (event) => {
      this.emit('community_event_updated', event)
    })

    this.socket.on('community_event_reminder', (event) => {
      this.emit('community_event_reminder', event)
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🔌 Socket.io error:', error)
      this.emit('error', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Socket event error (${event}):`, error)
        }
      })
    }
  }

  // Socket.io specific emit (send to server)
  send(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data)
    } else {
    }
  }

  // Message operations
  sendMessage(channelId, content, attachments = []) {
    const messageData = {
      channelId,
      content,
      attachments,
      timestamp: new Date().toISOString(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.send('send_message', messageData)
    return messageData
  }

  // Direct Message operations
  sendDirectMessage(recipientId, content, attachments = []) {
    const messageData = {
      recipientId,
      content,
      attachments,
      timestamp: new Date().toISOString(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.send('send_direct_message', messageData)
    return messageData
  }

  startDirectConversation(userId) {
    this.send('start_conversation', { userId })
  }

  getDirectConversations() {
    this.send('get_conversations')
  }

  getDirectMessages(conversationId) {
    this.send('get_direct_messages', { conversationId })
  }

  markConversationAsRead(conversationId) {
    this.send('mark_conversation_read', { conversationId })
  }

  editMessage(messageId, content) {
    this.send('edit_message', {
      messageId,
      content,
      timestamp: new Date().toISOString()
    })
  }

  deleteMessage(messageId) {
    this.send('delete_message', { messageId })
  }

  addReaction(messageId, emoji) {
    this.send('add_reaction', { messageId, emoji })
  }

  removeReaction(messageId, emoji) {
    this.send('remove_reaction', { messageId, emoji })
  }

  // Channel operations
  joinChannel(channelId) {
    this.send('join_channel', { channelId })
  }

  leaveChannel(channelId) {
    this.send('leave_channel', { channelId })
  }

  // Typing indicators
  startTyping(channelId) {
    this.send('start_typing', { channelId })
  }

  stopTyping(channelId) {
    this.send('stop_typing', { channelId })
  }

  // Voice operations
  joinVoiceChannel(channelId) {
    this.send('join_voice', { channelId })
  }

  leaveVoiceChannel(channelId) {
    this.send('leave_voice', { channelId })
  }

  toggleMute() {
    this.send('toggle_mute')
  }

  toggleDeafen() {
    this.send('toggle_deafen')
  }

  // User presence
  updateStatus(status) {
    this.send('update_status', { status })
  }

  // Community operations
  joinCommunity(communityId) {
    this.send('join_community', { communityId })
  }

  leaveCommunity(communityId) {
    this.send('leave_community', { communityId })
  }

  // Community posts
  createCommunityPost(postData) {
    const messageData = {
      ...postData,
      timestamp: new Date().toISOString(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.send('create_community_post', messageData)
    return messageData
  }

  updateCommunityPost(postId, updateData) {
    this.send('update_community_post', {
      postId,
      ...updateData,
      timestamp: new Date().toISOString()
    })
  }

  deleteCommunityPost(postId) {
    this.send('delete_community_post', { postId })
  }

  voteCommunityPost(postId, voteType) {
    this.send('vote_community_post', { postId, voteType })
  }

  // Community comments
  createCommunityComment(commentData) {
    const messageData = {
      ...commentData,
      timestamp: new Date().toISOString(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.send('create_community_comment', messageData)
    return messageData
  }

  updateCommunityComment(commentId, content) {
    this.send('update_community_comment', {
      commentId,
      content,
      timestamp: new Date().toISOString()
    })
  }

  deleteCommunityComment(commentId) {
    this.send('delete_community_comment', { commentId })
  }

  voteCommunityComment(commentId, voteType) {
    this.send('vote_community_comment', { commentId, voteType })
  }

  // Community moderation
  moderateContent(contentId, action, reason) {
    this.send('moderate_content', { contentId, action, reason })
  }

  reportContent(contentId, contentType, reason, details) {
    this.send('report_content', { contentId, contentType, reason, details })
  }

  // Community events
  createCommunityEvent(eventData) {
    this.send('create_community_event', eventData)
  }

  updateCommunityEvent(eventId, updateData) {
    this.send('update_community_event', { eventId, ...updateData })
  }

  joinCommunityEvent(eventId) {
    this.send('join_community_event', { eventId })
  }

  leaveCommunityEvent(eventId) {
    this.send('leave_community_event', { eventId })
  }

  // Community member management
  inviteToCommunity(communityId, inviteData) {
    this.send('invite_to_community', { communityId, ...inviteData })
  }

  updateMemberRole(communityId, userId, role) {
    this.send('update_member_role', { communityId, userId, role })
  }

  banMember(communityId, userId, reason, duration) {
    this.send('ban_member', { communityId, userId, reason, duration })
  }

  unbanMember(communityId, userId) {
    this.send('unban_member', { communityId, userId })
  }

  // Community analytics
  requestAnalytics(communityId, timeRange) {
    this.send('request_analytics', { communityId, timeRange })
  }

  // Utility methods
  isConnected() {
    return this.connected
  }

  getSocket() {
    return this.socket
  }

  reconnect() {
    if (this.socket) {
      this.socket.connect()
    } else {
      this.connect()
    }
  }

  // Subscribe to community updates
  subscribeToCommunity(communityId) {
    if (this.connected) {
      this.send('subscribe_community', { communityId })
    }
  }

  // Unsubscribe from community updates
  unsubscribeFromCommunity(communityId) {
    if (this.connected) {
      this.send('unsubscribe_community', { communityId })
    }
  }

  // Subscribe to moderation queue updates
  subscribeModerationQueue(communityId) {
    if (this.connected) {
      this.send('subscribe_moderation_queue', { communityId })
    }
  }

  // Unsubscribe from moderation queue updates
  unsubscribeModerationQueue(communityId) {
    if (this.connected) {
      this.send('unsubscribe_moderation_queue', { communityId })
    }
  }

  // Subscribe to community analytics updates
  subscribeAnalytics(communityId) {
    if (this.connected) {
      this.send('subscribe_analytics', { communityId })
    }
  }

  // Unsubscribe from community analytics updates
  unsubscribeAnalytics(communityId) {
    if (this.connected) {
      this.send('unsubscribe_analytics', { communityId })
    }
  }
}

// Export singleton instance
const socketService = new SocketService()
export default socketService