/**
 * Social WebSocket Service for CRYB Platform
 * Handles real-time social interactions via Socket.io
 */

import { io } from 'socket.io-client'

class SocialWebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  // Initialize connection
  connect(userId, authToken) {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_WS_URL || 'wss://api.cryb.ai'
      
      this.socket = io(wsUrl, {
        auth: {
          token: authToken,
          userId: userId
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      })

      this.setupEventHandlers()
      this.setupSocialEventHandlers()
      
      
    } catch (error) {
      console.error('Failed to initialize social WebSocket:', error)
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  // Setup basic event handlers
  setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected')
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      this.emit('disconnected', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Social WebSocket connection error:', error)
      this.emit('connection_error', error)
    })

    this.socket.on('reconnect', (attemptNumber) => {
      this.emit('reconnected', attemptNumber)
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('Social WebSocket reconnection failed:', error)
      this.emit('reconnect_error', error)
    })
  }

  // Setup social-specific event handlers
  setupSocialEventHandlers() {
    if (!this.socket) return

    // Follow/Unfollow events
    this.socket.on('user_followed', (data) => {
      this.emit('user_followed', data)
    })

    this.socket.on('user_unfollowed', (data) => {
      this.emit('user_unfollowed', data)
    })

    this.socket.on('new_follower', (data) => {
      this.emit('new_follower', data)
    })

    this.socket.on('follower_removed', (data) => {
      this.emit('follower_removed', data)
    })

    // Friend request events
    this.socket.on('friend_request_received', (data) => {
      this.emit('friend_request_received', data)
    })

    this.socket.on('friend_request_accepted', (data) => {
      this.emit('friend_request_accepted', data)
    })

    this.socket.on('friend_request_rejected', (data) => {
      this.emit('friend_request_rejected', data)
    })

    this.socket.on('friend_added', (data) => {
      this.emit('friend_added', data)
    })

    this.socket.on('friend_removed', (data) => {
      this.emit('friend_removed', data)
    })

    // User status events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data)
    })

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data)
    })

    this.socket.on('user_status_changed', (data) => {
      this.emit('user_status_changed', data)
    })

    // Social activity events
    this.socket.on('social_activity', (data) => {
      this.emit('social_activity', data)
    })

    this.socket.on('mutual_connection_added', (data) => {
      this.emit('mutual_connection_added', data)
    })

    // Notification events
    this.socket.on('social_notification', (data) => {
      this.emit('social_notification', data)
    })

    // Profile events
    this.socket.on('profile_updated', (data) => {
      this.emit('profile_updated', data)
    })

    // Block/Unblock events
    this.socket.on('user_blocked', (data) => {
      this.emit('user_blocked', data)
    })

    this.socket.on('user_unblocked', (data) => {
      this.emit('user_unblocked', data)
    })

    this.socket.on('blocked_by_user', (data) => {
      this.emit('blocked_by_user', data)
    })

    // Error events
    this.socket.on('social_error', (data) => {
      console.error('Social error:', data)
      this.emit('social_error', data)
    })
  }

  // ==================== FOLLOW OPERATIONS ====================

  // Send follow user event
  followUser(userId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('follow_user', { userId })
    }
  }

  // Send unfollow user event
  unfollowUser(userId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('unfollow_user', { userId })
    }
  }

  // ==================== FRIEND OPERATIONS ====================

  // Send friend request
  sendFriendRequest(userId, message = '') {
    if (this.isConnected && this.socket) {
      this.socket.emit('send_friend_request', { userId, message })
    }
  }

  // Accept friend request
  acceptFriendRequest(requestId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('accept_friend_request', { requestId })
    }
  }

  // Reject friend request
  rejectFriendRequest(requestId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('reject_friend_request', { requestId })
    }
  }

  // Remove friend
  removeFriend(userId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('remove_friend', { userId })
    }
  }

  // ==================== USER PRESENCE ====================

  // Update user status
  updateStatus(status) {
    if (this.isConnected && this.socket) {
      this.socket.emit('update_status', { status })
    }
  }

  // Join user presence room
  joinPresenceRoom() {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_presence')
    }
  }

  // Leave user presence room
  leavePresenceRoom() {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave_presence')
    }
  }

  // ==================== SOCIAL ROOMS ====================

  // Join user's social room for real-time updates
  joinSocialRoom(userId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_social_room', { userId })
    }
  }

  // Leave user's social room
  leaveSocialRoom(userId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave_social_room', { userId })
    }
  }

  // Join followers room for real-time follower updates
  joinFollowersRoom() {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_followers_room')
    }
  }

  // Join following room for real-time following updates
  joinFollowingRoom() {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_following_room')
    }
  }

  // Join friends room for real-time friend updates
  joinFriendsRoom() {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_friends_room')
    }
  }

  // ==================== SOCIAL ACTIVITY ====================

  // Subscribe to social activity feed
  subscribeToActivityFeed(filters = {}) {
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe_activity_feed', { filters })
    }
  }

  // Unsubscribe from social activity feed
  unsubscribeFromActivityFeed() {
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe_activity_feed')
    }
  }

  // ==================== EVENT MANAGEMENT ====================

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  // Remove event listener
  off(event, callback) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  // Emit event to listeners
  emit(event, data = null) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event = null) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  // ==================== UTILITY METHODS ====================

  // Check if connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected
  }

  // Get connection state
  getConnectionState() {
    return {
      connected: this.isConnected,
      socketConnected: this.socket ? this.socket.connected : false,
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: this.listeners.size
    }
  }

  // Force reconnection
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket.connect()
    }
  }

  // ==================== BULK OPERATIONS ====================

  // Batch follow multiple users
  batchFollowUsers(userIds) {
    if (this.isConnected && this.socket) {
      this.socket.emit('batch_follow_users', { userIds })
    }
  }

  // Batch unfollow multiple users
  batchUnfollowUsers(userIds) {
    if (this.isConnected && this.socket) {
      this.socket.emit('batch_unfollow_users', { userIds })
    }
  }

  // ==================== ANALYTICS EVENTS ====================

  // Track social interaction
  trackSocialInteraction(type, targetUserId, metadata = {}) {
    if (this.isConnected && this.socket) {
      this.socket.emit('track_social_interaction', {
        type,
        targetUserId,
        metadata,
        timestamp: Date.now()
      })
    }
  }

  // ==================== DEBUGGING ====================

  // Enable debug mode
  enableDebug() {
    if (this.socket) {
      this.socket.on('*', (event, ...args) => {
      })
    }
  }

  // Disable debug mode
  disableDebug() {
    if (this.socket) {
      this.socket.off('*')
    }
  }
}

// Create and export singleton instance
const socialWebSocketService = new SocialWebSocketService()

export default socialWebSocketService

// Export class for testing purposes
export { SocialWebSocketService }