/**
 * Notification Service for CRYB Platform
 * Handles toast notifications, browser notifications, and real-time alerts
 */

class NotificationService {
  constructor() {
    this.listeners = new Map()
    this.notifications = []
    this.maxNotifications = 5
    this.defaultDuration = 5000
    this.notificationId = 0
  }

  // Event management
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
          console.error(`Notification event error (${event}):`, error)
        }
      })
    }
  }

  // Toast notifications
  show(message, options = {}) {
    const notification = {
      id: ++this.notificationId,
      message,
      type: options.type || 'info',
      title: options.title,
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      persistent: options.persistent || false,
      action: options.action,
      timestamp: Date.now()
    }

    this.notifications.unshift(notification)

    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    this.emit('notification_added', notification)

    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Specific notification types
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' })
  }

  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' })
  }

  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' })
  }

  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' })
  }

  // Dismiss notifications
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      const notification = this.notifications[index]
      this.notifications.splice(index, 1)
      this.emit('notification_removed', notification)
    }
  }

  dismissAll() {
    this.notifications.forEach(notification => {
      this.emit('notification_removed', notification)
    })
    this.notifications = []
  }

  // Get current notifications
  getNotifications() {
    return [...this.notifications]
  }

  // Browser notifications (requires permission)
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        ...options
      })

      if (options.onClick) {
        notification.addEventListener('click', options.onClick)
      }

      return notification
    } else {
      // Fallback to toast notification
      this.info(title, { title: options.body })
    }
  }

  // Real-time notification handlers
  handleDirectMessage(message) {
    this.info(`New message from ${message.sender.displayName}`, {
      title: 'Direct Message',
      action: {
        label: 'View',
        handler: () => {
          // Navigate to DMs
          this.emit('navigate_to_dms', message.sender.id)
        }
      }
    })

    // Browser notification if page not focused
    if (document.hidden) {
      this.showBrowserNotification('New Direct Message', {
        body: `${message.sender.displayName}: ${message.content}`,
        tag: 'dm',
        onClick: () => {
          window.focus()
          this.emit('navigate_to_dms', message.sender.id)
        }
      })
    }
  }

  handleMentionNotification(mention) {
    this.info(`You were mentioned in ${mention.community.displayName}`, {
      title: 'Mention',
      action: {
        label: 'View Post',
        handler: () => {
          this.emit('navigate_to_post', mention.postId)
        }
      }
    })

    if (document.hidden) {
      this.showBrowserNotification('You were mentioned', {
        body: `In ${mention.community.displayName}: ${mention.content}`,
        tag: 'mention',
        onClick: () => {
          window.focus()
          this.emit('navigate_to_post', mention.postId)
        }
      })
    }
  }

  handleVoiceChannelInvite(invite) {
    this.info(`${invite.inviter.displayName} invited you to voice chat`, {
      title: 'Voice Channel Invite',
      persistent: true,
      action: {
        label: 'Join',
        handler: () => {
          this.emit('join_voice_channel', invite.channelId)
        }
      }
    })
  }

  handleCommunityInvite(invite) {
    this.success(`You've been invited to join ${invite.community.displayName}`, {
      title: 'Community Invite',
      action: {
        label: 'View',
        handler: () => {
          this.emit('navigate_to_community', invite.community.id)
        }
      }
    })
  }

  handleSystemNotification(notification) {
    this.show(notification.message, {
      type: notification.type || 'info',
      title: notification.title,
      persistent: notification.persistent
    })
  }

  // Connection status notifications
  handleConnectionStatus(status) {
    switch (status) {
      case 'connected':
        this.success('Connected to CRYB Platform', { duration: 2000 })
        break
      case 'disconnected':
        this.error('Disconnected from server', { persistent: true })
        break
      case 'reconnecting':
        this.warning('Reconnecting...', { persistent: true })
        break
      case 'reconnected':
        this.success('Reconnected successfully', { duration: 2000 })
        break
    }
  }

  // File upload notifications  
  handleFileUpload(status, fileName) {
    switch (status) {
      case 'uploading':
        return this.info(`Uploading ${fileName}...`, { persistent: true })
      case 'success':
        this.success(`${fileName} uploaded successfully`)
        break
      case 'error':
        this.error(`Failed to upload ${fileName}`)
        break
    }
  }

  // Community notifications
  handleCommunityJoin(community) {
    this.success(`Welcome to ${community.displayName}!`, {
      title: 'Community Joined',
      action: {
        label: 'Explore',
        handler: () => {
          this.emit('navigate_to_community', community.id)
        }
      }
    })
  }

  handleNewPost(post) {
    if (post.community && post.community.notifications) {
      this.info(`New post in ${post.community.displayName}`, {
        title: post.title,
        action: {
          label: 'View',
          handler: () => {
            this.emit('navigate_to_post', post.id)
          }
        }
      })
    }
  }

  // Error notifications
  handleApiError(error) {
    let message = 'Something went wrong'
    
    if (error.response) {
      // Server responded with error
      message = error.response.data?.message || `Server error (${error.response.status})`
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection.'
    } else {
      // Other error
      message = error.message || 'An unexpected error occurred'
    }

    this.error(message, {
      title: 'Error',
      action: error.retry ? {
        label: 'Retry',
        handler: error.retry
      } : null
    })
  }

  // Clear expired notifications
  clearExpired() {
    const now = Date.now()
    const expired = this.notifications.filter(n => 
      !n.persistent && n.duration > 0 && (now - n.timestamp) > n.duration
    )
    
    expired.forEach(notification => {
      this.dismiss(notification.id)
    })
  }

  // Clean up
  destroy() {
    this.dismissAll()
    this.listeners.clear()
  }
}

// Export singleton instance
const notificationService = new NotificationService()

// Auto-clear expired notifications every minute
setInterval(() => {
  notificationService.clearExpired()
}, 60000)

export default notificationService