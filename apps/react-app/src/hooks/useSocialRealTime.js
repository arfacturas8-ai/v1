/**
 * React Hook for Real-time Social Updates
 * Provides real-time social functionality to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import socialWebSocketService from '../services/socialWebSocketService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/useToast'

export const useSocialRealTime = (options = {}) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const {
    enablePresence = true,
    enableActivityFeed = true,
    enableNotifications = true,
    autoConnect = true,
    onError = null
  } = options

  const [connectionState, setConnectionState] = useState({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0
  })

  const [socialUpdates, setSocialUpdates] = useState({
    followers: [],
    following: [],
    friends: [],
    requests: [],
    onlineUsers: new Set(),
    activities: [],
    notifications: []
  })

  const [realTimeStats, setRealTimeStats] = useState({
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
    requestsCount: 0,
    onlineCount: 0
  })

  const unsubscribersRef = useRef([])

  // Connect to WebSocket when user is available
  useEffect(() => {
    if (user && autoConnect) {
      connectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [user, autoConnect])

  // Setup event listeners
  useEffect(() => {
    if (connectionState.connected) {
      setupEventListeners()
    }

    return () => {
      cleanupEventListeners()
    }
  }, [connectionState.connected, enablePresence, enableActivityFeed, enableNotifications])

  const connectSocket = useCallback(async () => {
    if (!user) return

    try {
      setConnectionState(prev => ({ ...prev, connecting: true, error: null }))

      // Get auth token
      const token = localStorage.getItem('cryb_session_token')
      const authToken = token ? JSON.parse(token).token : null

      if (!authToken) {
        throw new Error('No authentication token available')
      }

      socialWebSocketService.connect(user.id, authToken)

    } catch (error) {
      console.error('Failed to connect to social WebSocket:', error)
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: error.message
      }))
      
      if (onError) {
        onError(error)
      }
    }
  }, [user, onError])

  const disconnectSocket = useCallback(() => {
    socialWebSocketService.disconnect()
    cleanupEventListeners()
    setConnectionState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0
    })
  }, [])

  const setupEventListeners = useCallback(() => {
    const unsubscribers = []

    // Connection events
    unsubscribers.push(
      socialWebSocketService.on('connected', () => {
        setConnectionState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0
        }))

        // Join rooms after connection
        if (enablePresence) {
          socialWebSocketService.joinPresenceRoom()
          socialWebSocketService.joinFollowersRoom()
          socialWebSocketService.joinFollowingRoom()
          socialWebSocketService.joinFriendsRoom()
        }

        if (enableActivityFeed) {
          socialWebSocketService.subscribeToActivityFeed()
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('disconnected', (reason) => {
        setConnectionState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: reason
        }))
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('connection_error', (error) => {
        setConnectionState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message
        }))
        
        if (onError) {
          onError(error)
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('reconnected', (attemptNumber) => {
        setConnectionState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: attemptNumber
        }))

        if (enableNotifications) {
          showToast('Reconnected to social updates', 'success')
        }
      })
    )

    // Follow/Unfollow events
    unsubscribers.push(
      socialWebSocketService.on('new_follower', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          followers: [data.user, ...prev.followers]
        }))

        setRealTimeStats(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }))

        if (enableNotifications) {
          showToast(`${data.user.displayName} started following you`, 'info')
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('follower_removed', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          followers: prev.followers.filter(f => f.id !== data.userId)
        }))

        setRealTimeStats(prev => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1)
        }))
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('user_followed', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          following: [data.user, ...prev.following]
        }))

        setRealTimeStats(prev => ({
          ...prev,
          followingCount: prev.followingCount + 1
        }))
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('user_unfollowed', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          following: prev.following.filter(f => f.id !== data.userId)
        }))

        setRealTimeStats(prev => ({
          ...prev,
          followingCount: Math.max(0, prev.followingCount - 1)
        }))
      })
    )

    // Friend request events
    unsubscribers.push(
      socialWebSocketService.on('friend_request_received', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          requests: [data.request, ...prev.requests]
        }))

        setRealTimeStats(prev => ({
          ...prev,
          requestsCount: prev.requestsCount + 1
        }))

        if (enableNotifications) {
          showToast(`Friend request from ${data.request.user.displayName}`, 'info')
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('friend_request_accepted', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          requests: prev.requests.filter(r => r.id !== data.requestId),
          friends: [data.user, ...prev.friends]
        }))

        setRealTimeStats(prev => ({
          ...prev,
          requestsCount: Math.max(0, prev.requestsCount - 1),
          friendsCount: prev.friendsCount + 1
        }))

        if (enableNotifications) {
          showToast(`${data.user.displayName} accepted your friend request`, 'success')
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('friend_request_rejected', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          requests: prev.requests.filter(r => r.id !== data.requestId)
        }))

        setRealTimeStats(prev => ({
          ...prev,
          requestsCount: Math.max(0, prev.requestsCount - 1)
        }))
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('friend_added', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          friends: [data.user, ...prev.friends]
        }))

        setRealTimeStats(prev => ({
          ...prev,
          friendsCount: prev.friendsCount + 1
        }))

        if (enableNotifications) {
          showToast(`You're now friends with ${data.user.displayName}`, 'success')
        }
      })
    )

    unsubscribers.push(
      socialWebSocketService.on('friend_removed', (data) => {
        setSocialUpdates(prev => ({
          ...prev,
          friends: prev.friends.filter(f => f.id !== data.userId)
        }))

        setRealTimeStats(prev => ({
          ...prev,
          friendsCount: Math.max(0, prev.friendsCount - 1)
        }))
      })
    )

    // Presence events
    if (enablePresence) {
      unsubscribers.push(
        socialWebSocketService.on('user_online', (data) => {
          setSocialUpdates(prev => ({
            ...prev,
            onlineUsers: new Set([...prev.onlineUsers, data.userId])
          }))

          setRealTimeStats(prev => ({
            ...prev,
            onlineCount: prev.onlineCount + 1
          }))
        })
      )

      unsubscribers.push(
        socialWebSocketService.on('user_offline', (data) => {
          setSocialUpdates(prev => {
            const newOnlineUsers = new Set(prev.onlineUsers)
            newOnlineUsers.delete(data.userId)
            return {
              ...prev,
              onlineUsers: newOnlineUsers
            }
          })

          setRealTimeStats(prev => ({
            ...prev,
            onlineCount: Math.max(0, prev.onlineCount - 1)
          }))
        })
      )
    }

    // Activity feed events
    if (enableActivityFeed) {
      unsubscribers.push(
        socialWebSocketService.on('social_activity', (data) => {
          setSocialUpdates(prev => ({
            ...prev,
            activities: [data.activity, ...prev.activities.slice(0, 49)] // Keep last 50
          }))
        })
      )
    }

    // Notification events
    if (enableNotifications) {
      unsubscribers.push(
        socialWebSocketService.on('social_notification', (data) => {
          setSocialUpdates(prev => ({
            ...prev,
            notifications: [data.notification, ...prev.notifications.slice(0, 99)] // Keep last 100
          }))

          // Show toast notification
          if (data.notification.showToast) {
            showToast(data.notification.message, data.notification.type || 'info')
          }
        })
      )
    }

    // Error events
    unsubscribers.push(
      socialWebSocketService.on('social_error', (data) => {
        console.error('Social WebSocket error:', data)
        
        if (enableNotifications) {
          showToast('Social update failed', 'error')
        }
        
        if (onError) {
          onError(new Error(data.message))
        }
      })
    )

    unsubscribersRef.current = unsubscribers
  }, [enablePresence, enableActivityFeed, enableNotifications, onError, showToast])

  const cleanupEventListeners = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscriber => {
      if (typeof unsubscriber === 'function') {
        unsubscriber()
      }
    })
    unsubscribersRef.current = []
  }, [])

  // Social action methods with real-time updates
  const followUser = useCallback(async (userId) => {
    if (!connectionState.connected) {
      throw new Error('Not connected to real-time updates')
    }

    socialWebSocketService.followUser(userId)
    socialWebSocketService.trackSocialInteraction('follow', userId)
  }, [connectionState.connected])

  const unfollowUser = useCallback(async (userId) => {
    if (!connectionState.connected) {
      throw new Error('Not connected to real-time updates')
    }

    socialWebSocketService.unfollowUser(userId)
    socialWebSocketService.trackSocialInteraction('unfollow', userId)
  }, [connectionState.connected])

  const sendFriendRequest = useCallback(async (userId, message = '') => {
    if (!connectionState.connected) {
      throw new Error('Not connected to real-time updates')
    }

    socialWebSocketService.sendFriendRequest(userId, message)
    socialWebSocketService.trackSocialInteraction('friend_request', userId, { message })
  }, [connectionState.connected])

  const acceptFriendRequest = useCallback(async (requestId) => {
    if (!connectionState.connected) {
      throw new Error('Not connected to real-time updates')
    }

    socialWebSocketService.acceptFriendRequest(requestId)
  }, [connectionState.connected])

  const rejectFriendRequest = useCallback(async (requestId) => {
    if (!connectionState.connected) {
      throw new Error('Not connected to real-time updates')
    }

    socialWebSocketService.rejectFriendRequest(requestId)
  }, [connectionState.connected])

  const updateStatus = useCallback((status) => {
    if (connectionState.connected) {
      socialWebSocketService.updateStatus(status)
    }
  }, [connectionState.connected])

  const isUserOnline = useCallback((userId) => {
    return socialUpdates.onlineUsers.has(userId)
  }, [socialUpdates.onlineUsers])

  const getRecentActivities = useCallback((limit = 10) => {
    return socialUpdates.activities.slice(0, limit)
  }, [socialUpdates.activities])

  const getUnreadNotifications = useCallback(() => {
    return socialUpdates.notifications.filter(n => !n.read)
  }, [socialUpdates.notifications])

  const markNotificationAsRead = useCallback((notificationId) => {
    setSocialUpdates(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    }))
  }, [])

  const clearNotifications = useCallback(() => {
    setSocialUpdates(prev => ({
      ...prev,
      notifications: []
    }))
  }, [])

  return {
    // Connection state
    connectionState,
    isConnected: connectionState.connected,
    isConnecting: connectionState.connecting,
    connectionError: connectionState.error,

    // Real-time data
    socialUpdates,
    realTimeStats,

    // Connection methods
    connect: connectSocket,
    disconnect: disconnectSocket,
    reconnect: socialWebSocketService.forceReconnect,

    // Social actions with real-time updates
    followUser,
    unfollowUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    updateStatus,

    // Utility methods
    isUserOnline,
    getRecentActivities,
    getUnreadNotifications,
    markNotificationAsRead,
    clearNotifications,

    // WebSocket service access for advanced usage
    socketService: socialWebSocketService
  }
}

export default useSocialRealTime