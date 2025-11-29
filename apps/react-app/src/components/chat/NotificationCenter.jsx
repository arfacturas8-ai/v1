import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell, BellOff, X, Check, Trash2,
  MessageCircle, Phone, Video, UserPlus, Crown, Shield,
  Hash, Volume2, Pin, Heart, Star, AlertTriangle,
  Settings, Filter, Calendar, User, ChevronDown, ChevronUp
} from 'lucide-react'

/**
 * NotificationCenter - Discord-style notification system
 * Features: Real-time alerts, message notifications, system notifications, notification settings
 */
function NotificationCenter({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationDismiss,
  onSettingsOpen,
  user,
  isMobile = false,
  className = ''
}) {
  // State
  const [filter, setFilter] = useState('all') // all, unread, mentions, calls, system
  const [groupBy, setGroupBy] = useState('type') // type, time, channel
  const [showSettings, setShowSettings] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(new Set(['messages', 'calls', 'system']))
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    desktop: true,
    sound: true,
    mentions: true,
    directMessages: true,
    groupMessages: true,
    calls: true,
    serverUpdates: false,
    systemMessages: true,
    doNotDisturb: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })

  // Sound settings
  const [soundSettings, setSoundSettings] = useState({
    messageSound: 'default',
    mentionSound: 'urgent',
    callSound: 'ring',
    volume: 80
  })

  // Load notification settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('cryb-notification-settings')
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings))
    }
    
    const savedSoundSettings = localStorage.getItem('cryb-sound-settings')
    if (savedSoundSettings) {
      setSoundSettings(JSON.parse(savedSoundSettings))
    }
  }, [])

  // Request notification permission
  useEffect(() => {
    if (notificationSettings.desktop && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [notificationSettings.desktop])

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filter === 'all') return true
      if (filter === 'unread') return !notification.read
      if (filter === 'mentions') return notification.type === 'mention' || notification.type === 'direct_message'
      if (filter === 'calls') return notification.type === 'call'
      if (filter === 'system') return notification.type === 'system'
      return true
    })
  }, [notifications, filter])

  // Group notifications
  const groupedNotifications = useMemo(() => {
    const groups = {}
    
    filteredNotifications.forEach(notification => {
      let groupKey
      
      switch (groupBy) {
        case 'type':
          groupKey = notification.type
          break
        case 'time':
          const date = new Date(notification.timestamp)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          
          if (date.toDateString() === today.toDateString()) {
            groupKey = 'today'
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'yesterday'
          } else {
            groupKey = 'older'
          }
          break
        case 'channel':
          groupKey = notification.channelId || 'direct'
          break
        default:
          groupKey = 'all'
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })
    
    return groups
  }, [filteredNotifications, groupBy])

  // Get notification icon
  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'message':
      case 'direct_message':
        return MessageCircle
      case 'mention':
        return Bell
      case 'call':
        return notification.callType === 'video' ? Video : Phone
      case 'voice_join':
        return Volume2
      case 'user_join':
        return UserPlus
      case 'role_update':
        return notification.role === 'admin' ? Shield : Crown
      case 'channel_update':
        return Hash
      case 'pin':
        return Pin
      case 'reaction':
        return Heart
      case 'star':
        return Star
      case 'system':
        return Info
      case 'warning':
        return AlertTriangle
      default:
        return Bell
    }
  }

  // Get notification color
  const getNotificationColor = (notification) => {
    switch (notification.type) {
      case 'mention':
      case 'direct_message':
        return 'text-blue-600 dark:text-blue-400'
      case 'call':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-red-600 dark:text-red-400'
      case 'system':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Get group title
  const getGroupTitle = (groupKey) => {
    switch (groupBy) {
      case 'type':
        switch (groupKey) {
          case 'message': return 'Messages'
          case 'direct_message': return 'Direct Messages'
          case 'mention': return 'Mentions'
          case 'call': return 'Calls'
          case 'voice_join': return 'Voice Activity'
          case 'user_join': return 'Member Updates'
          case 'system': return 'System'
          default: return groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
        }
      case 'time':
        switch (groupKey) {
          case 'today': return 'Today'
          case 'yesterday': return 'Yesterday'
          case 'older': return 'Older'
          default: return groupKey
        }
      case 'channel':
        return groupKey === 'direct' ? 'Direct Messages' : `#${groupKey}`
      default:
        return 'All Notifications'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  // Play notification sound
  const playNotificationSound = useCallback((notification) => {
    if (!notificationSettings.sound || notificationSettings.doNotDisturb) return
    
    let soundFile = 'notification.mp3'
    
    switch (notification.type) {
      case 'mention':
      case 'direct_message':
        soundFile = soundSettings.mentionSound === 'urgent' ? 'mention.mp3' : 'message.mp3'
        break
      case 'call':
        soundFile = 'call.mp3'
        break
      default:
        soundFile = 'message.mp3'
    }
    
    try {
      const audio = new Audio(`/sounds/${soundFile}`)
      audio.volume = soundSettings.volume / 100
      audio.play().catch(console.error)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }, [notificationSettings, soundSettings])

  // Show desktop notification
  const showDesktopNotification = useCallback((notification) => {
    if (!notificationSettings.desktop || notificationSettings.doNotDisturb) return
    if (Notification.permission !== 'granted') return
    
    const options = {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.id,
      requireInteraction: false,
      silent: !notificationSettings.sound
    }
    
    const desktopNotification = new Notification(notification.title, options)
    
    desktopNotification.onclick = () => {
      window.focus()
      onNotificationClick && onNotificationClick(notification)
      desktopNotification.close()
    }
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      desktopNotification.close()
    }, 5000)
  }, [notificationSettings, onNotificationClick])

  // Handle new notifications
  useEffect(() => {
    const latestNotification = notifications[0]
    if (latestNotification && !latestNotification.read) {
      playNotificationSound(latestNotification)
      showDesktopNotification(latestNotification)
    }
  }, [notifications, playNotificationSound, showDesktopNotification])

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    onMarkAsRead && onMarkAsRead(notification.id)
    
    // Navigate to content
    onNotificationClick && onNotificationClick(notification)
  }

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Handle selection
  const toggleSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  // Update settings
  const updateNotificationSetting = (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(newSettings)
    localStorage.setItem('cryb-notification-settings', JSON.stringify(newSettings))
  }

  const updateSoundSetting = (key, value) => {
    const newSettings = { ...soundSettings, [key]: value }
    setSoundSettings(newSettings)
    localStorage.setItem('cryb-sound-settings', JSON.stringify(newSettings))
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      {/* Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Bell style={{
  width: '20px',
  height: '20px',
  color: '#c9d1d9'
}} />
            <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span style={{
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%'
}}>
                {unreadCount}
              </span>
            )}
          </div>
          
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            >
              <Settings style={{
  width: '16px',
  height: '16px'
}} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="Mark all as read"
              >
                <CheckCheck style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            )}
            
            <button
              onClick={onClearAll}
              style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              title="Clear all"
            >
              <Trash2 style={{
  width: '16px',
  height: '16px'
}} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
  flex: '1',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="mentions">Mentions</option>
            <option value="calls">Calls</option>
            <option value="system">System</option>
          </select>
          
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
  flex: '1',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
          >
            <option value="type">Group by Type</option>
            <option value="time">Group by Time</option>
            <option value="channel">Group by Channel</option>
          </select>
        </div>

        {/* Selection mode */}
        {isSelectionMode && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <span>{selectedNotifications.size} selected</span>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <button
                onClick={() => {
                  selectedNotifications.forEach(id => onMarkAsRead && onMarkAsRead(id))
                  setSelectedNotifications(new Set())
                }}
                style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
              >
                Mark Read
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedNotifications(new Set())
                }}
                style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff',
  borderRadius: '4px'
}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px'
}}>
          <h4 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>Notification Settings</h4>
          
          <div className="space-y-3">
            <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm">Desktop notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.desktop}
                onChange={(e) => updateNotificationSetting('desktop', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm">Sound notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.sound}
                onChange={(e) => updateNotificationSetting('sound', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm">Mentions</span>
              <input
                type="checkbox"
                checked={notificationSettings.mentions}
                onChange={(e) => updateNotificationSetting('mentions', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm">Direct messages</span>
              <input
                type="checkbox"
                checked={notificationSettings.directMessages}
                onChange={(e) => updateNotificationSetting('directMessages', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm">Do not disturb</span>
              <input
                type="checkbox"
                checked={notificationSettings.doNotDisturb}
                onChange={(e) => updateNotificationSetting('doNotDisturb', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
            </label>
          </div>
          
          {/* Sound settings */}
          {notificationSettings.sound && (
            <div className="mt-4 pt-4 border-t border-white/10 dark:border-gray-600">
              <h5 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>Sound Settings</h5>
              
              <div className="space-y-2">
                <div>
                  <label style={{
  display: 'block',
  color: '#c9d1d9'
}}>
                    Volume: {soundSettings.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.volume}
                    onChange={(e) => updateSoundSetting('volume', parseInt(e.target.value))}
                    style={{
  width: '100%'
}}
                  />
                </div>
                
                <div>
                  <label style={{
  display: 'block',
  color: '#c9d1d9'
}}>
                    Message sound
                  </label>
                  <select
                    value={soundSettings.messageSound}
                    onChange={(e) => updateSoundSetting('messageSound', e.target.value)}
                    style={{
  width: '100%',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
                  >
                    <option value="default">Default</option>
                    <option value="chime">Chime</option>
                    <option value="pop">Pop</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div style={{
  flex: '1'
}}>
        {Object.entries(groupedNotifications).length === 0 ? (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Bell style={{
  width: '48px',
  height: '48px',
  color: '#c9d1d9'
}} />
            <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>No notifications</h3>
            <p style={{
  color: '#c9d1d9'
}}>
              You're all caught up!
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => {
            const isExpanded = expandedGroups.has(groupKey)
            
            return (
              <div key={groupKey} className="border-b border-white/10 dark:border-gray-700">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                >
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <h4 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                      {getGroupTitle(groupKey)}
                    </h4>
                    <span style={{
  color: '#c9d1d9'
}}>
                      ({groupNotifications.length})
                    </span>
                  </div>
                  
                  {isExpanded ? (
                    <ChevronUp style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
                  ) : (
                    <ChevronDown style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {groupNotifications.map(notification => {
                      const Icon = getNotificationIcon(notification)
                      const isSelected = selectedNotifications.has(notification.id)
                      
                      return (
                        <div
                          key={notification.id}
                          style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                            {/* Selection checkbox */}
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  toggleSelection(notification.id)
                                }}
                                style={{
  borderRadius: '4px'
}}
                              />
                            )}
                            
                            {/* Icon */}
                            <div style={{
  padding: '8px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                              <Icon style={{
  width: '16px',
  height: '16px'
}} />
                            </div>
                            
                            {/* Content */}
                            <div style={{
  flex: '1'
}}>
                              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                                <h5 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                                  {notification.title}
                                </h5>
                                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                                  <span style={{
  color: '#c9d1d9'
}}>
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  {!notification.read && (
                                    <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                                  )}
                                </div>
                              </div>
                              
                              <p style={{
  color: '#c9d1d9'
}}>
                                {notification.message}
                              </p>
                              
                              {/* Additional info */}
                              {notification.channelName && (
                                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                                  <Hash style={{
  width: '12px',
  height: '12px',
  color: '#c9d1d9'
}} />
                                  <span style={{
  color: '#c9d1d9'
}}>
                                    {notification.channelName}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkAsRead && onMarkAsRead(notification.id)
                                  }}
                                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                                  title="Mark as read"
                                >
                                  <Check style={{
  width: '12px',
  height: '12px'
}} />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onNotificationDismiss && onNotificationDismiss(notification.id)
                                }}
                                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                                title="Dismiss"
                              >
                                <X style={{
  width: '12px',
  height: '12px'
}} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#c9d1d9'
}}>
            <span>{filteredNotifications.length} notifications</span>
            
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



export default NotificationCenter