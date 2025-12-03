import React, { useState, useEffect } from 'react'
import { 
  Bell, Gift, Star, Crown, Heart, Zap, Trophy, X, 
  Check, MessageSquare, Calendar, Award, Sparkles
} from 'lucide-react'

const AwardNotificationSystem = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, awards, mentions
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    fetchNotifications()
    // Set up real-time notification listener
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      setNotifications(prev => [notification, ...prev])
      
      // Show browser notification for awards
      if (notification.type === 'award_received' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`You received a ${notification.data.awardName}!`, {
            body: notification.data.message || 'Someone appreciated your post',
            icon: '/icons/award.png',
            tag: `award-${notification.id}`
          })
        }
      }
    }

    return () => eventSource.close()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type, data) => {
    switch (type) {
      case 'award_received':
        return <Gift style={{
  width: '20px',
  height: '20px'
}} />
      case 'post_upvoted':
        return <Heart style={{
  width: '20px',
  height: '20px'
}} />
      case 'comment_replied':
        return <MessageSquare style={{
  width: '20px',
  height: '20px'
}} />
      case 'mention':
        return <Bell style={{
  width: '20px',
  height: '20px'
}} />
      case 'achievement_unlocked':
        return <Trophy style={{
  width: '20px',
  height: '20px'
}} />
      case 'follower_new':
        return <Star style={{
  width: '20px',
  height: '20px'
}} />
      default:
        return <Bell style={{
  width: '20px',
  height: '20px',
  color: '#A0A0A0'
}} />
    }
  }

  const getNotificationTitle = (notification) => {
    const { type, data } = notification
    switch (type) {
      case 'award_received':
        return `You received a ${data.awardName}!`
      case 'post_upvoted':
        return 'Your post was upvoted'
      case 'comment_replied':
        return 'Someone replied to your comment'
      case 'mention':
        return 'You were mentioned'
      case 'achievement_unlocked':
        return `Achievement unlocked: ${data.achievementName}`
      case 'follower_new':
        return `${data.username} started following you`
      default:
        return 'New notification'
    }
  }

  const getNotificationDescription = (notification) => {
    const { type, data } = notification
    switch (type) {
      case 'award_received':
        return data.message || `"${data.postTitle.slice(0, 50)}..."`
      case 'post_upvoted':
        return `"${data.postTitle.slice(0, 50)}..."`
      case 'comment_replied':
        return `"${data.replyText.slice(0, 50)}..."`
      case 'mention':
        return `in "${data.postTitle.slice(0, 40)}..."`
      case 'achievement_unlocked':
        return data.description
      case 'follower_new':
        return 'Check out their profile'
      default:
        return data.message || ''
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 30) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read
      case 'awards':
        return notification.type === 'award_received'
      case 'mentions':
        return notification.type === 'mention'
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const AwardDetails = ({ notification }) => {
    const { data } = notification
    return (
      <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
          <div className="text-3xl">{data.awardIcon}</div>
          <div style={{
  flex: '1'
}}>
            <h4 style={{
  fontWeight: '600'
}}>{data.awardName}</h4>
            <p className="text-sm text-muted/80 mb-2">{data.awardDescription}</p>
            
            {data.message && (
              <div style={{
  borderRadius: '12px',
  padding: '12px'
}}>
                <p className="text-sm italic">"{data.message}"</p>
                <p className="text-xs text-muted/60 mt-1">- from u/{data.giverUsername}</p>
              </div>
            )}

            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Trophy style={{
  width: '12px',
  height: '12px'
}} />
                <span>+{data.karmaValue} karma</span>
              </div>
              {data.coinsReceived && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
                  <span>+{data.coinsReceived} coins</span>
                </div>
              )}
              {data.premiumDays && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Crown style={{
  width: '12px',
  height: '12px'
}} />
                  <span>+{data.premiumDays} days Premium</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border-primary/20">
              <a 
                href={`/posts/${data.postId}`}
                style={{
  fontWeight: '500'
}}
              >
                View the awarded post →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  position: 'relative'
}}>
                <Bell style={{
  width: '24px',
  height: '24px'
}} />
                {unreadCount > 0 && (
                  <div style={{
  position: 'absolute',
  color: '#ffffff',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h2 style={{
  fontWeight: 'bold'
}}>Notifications</h2>
                <p style={{
  color: '#A0A0A0'
}}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                >
                  Mark all read
                </button>
              )}
              <button onClick={onClose} style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                <X style={{
  width: '20px',
  height: '20px'
}} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'awards', label: 'Awards' },
              { key: 'mentions', label: 'Mentions' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#A0A0A0'
}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
  flex: '1'
}}>
          {loading ? (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '256px'
}}>
              <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '256px'
}}>
              <Bell style={{
  width: '48px',
  height: '48px'
}} />
              <p>No notifications to show</p>
            </div>
          ) : (
            <div style={{
  padding: '16px'
}}>
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
  position: 'relative',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id)
                    setSelectedNotification(selectedNotification?.id === notification.id ? null : notification)
                  }}
                >
                  <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.data)}
                    </div>
                    
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
                        <div style={{
  flex: '1'
}}>
                          <h3 style={{
  fontWeight: '500'
}}>
                            {getNotificationTitle(notification)}
                          </h3>
                          <p className="text-xs text-muted/70 mt-1">
                            {getNotificationDescription(notification)}
                          </p>
                        </div>
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                          <span className="text-xs text-muted/60 whitespace-nowrap">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedNotification?.id === notification.id && (
                        <div className="mt-3">
                          {notification.type === 'award_received' && (
                            <AwardDetails notification={notification} />
                          )}
                          
                          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                            >
                              <Check style={{
  width: '12px',
  height: '12px'
}} />
                              Mark read
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                            >
                              <X style={{
  width: '12px',
  height: '12px'
}} />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



export default AwardNotificationSystem