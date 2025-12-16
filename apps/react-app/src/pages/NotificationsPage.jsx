import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import socketService from '../services/socket'
import apiService from '../services/api'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  MessageSquare,
  Heart,
  UserPlus,
  AtSign,
  Award,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { EmptyNotifications } from '../components/ui/EmptyState'
import usePullToRefresh from '../hooks/usePullToRefresh.jsx'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'
import { useResponsive } from '../hooks/useResponsive'

/**
 * NotificationsPage - Comprehensive notification center
 *
 * Master Prompt Standards Applied:
 * - Responsive padding: 80px desktop, 24px tablet, 16px mobile
 * - Header offset: 72px desktop/tablet, 56px mobile
 * - All icons 24px in shrink-0 containers
 * - Notification rows minimum 72px height
 * - Section gaps: 48px, card gaps: 24px, inline gaps: 16px
 * - Z-index: header at 50
 *
 * Features:
 * - All notification types (messages, mentions, reactions, follows, awards)
 * - Filtering by type and status
 * - Mark as read/unread
 * - Bulk actions (mark all read, delete)
 * - Real-time updates via WebSocket
 * - Mobile-responsive design
 */

const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  MENTION: 'mention',
  REACTION: 'reaction',
  FOLLOW: 'follow',
  AWARD: 'award',
  SYSTEM: 'system',
  REPLY: 'reply'
}

// Icon component with standard 24px sizing in shrink-0 container
const NotificationIcon = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return <MessageSquare style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.MENTION:
        return <AtSign style={{ width: '24px', height: '24px', color: '#a371f7', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.REACTION:
        return <Heart style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.FOLLOW:
        return <UserPlus style={{ width: '24px', height: '24px', color: '#10b981', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.AWARD:
        return <Award style={{ width: '24px', height: '24px', color: '#eab308', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.REPLY:
        return <MessageSquare style={{ width: '24px', height: '24px', color: '#06b6d4', flexShrink: 0 }} />
      default:
        return <Bell style={{ width: '24px', height: '24px', color: 'var(--text-secondary)', flexShrink: 0 }} />
    }
  }

  return (
    <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
      {getIcon()}
    </div>
  )
}

// Notification Card Component with 72px minimum height
const NotificationCard = ({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onClick,
  onDelete
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isSelected ? '#58a6ff' : 'var(--border-primary)',
        borderRadius: '12px',
        borderLeftWidth: !notification.isRead ? '4px' : '1px',
        borderLeftColor: !notification.isRead ? '#58a6ff' : 'var(--border-primary)',
        minHeight: '72px',
        padding: '16px',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      className="hover:shadow-md"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Checkbox */}
        <div style={{ width: '24px', height: '24px', flexShrink: 0, paddingTop: '4px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect(notification.id)
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              borderWidth: '1px',
              borderColor: 'var(--border-primary)',
              cursor: 'pointer'
            }}
            aria-label={`Select notification: ${notification.title}`}
          />
        </div>

        {/* Avatar with unread indicator */}
        <div style={{ width: '48px', height: '48px', flexShrink: 0, position: 'relative' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            {notification.avatar}
          </div>
          {!notification.isRead && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                backgroundColor: '#58a6ff',
                borderRadius: '50%',
                borderWidth: '2px',
                borderColor: 'var(--bg-primary)',
                boxShadow: '0 0 8px rgba(88, 166, 255, 0.6)'
              }}
            />
          )}
        </div>

        {/* Content */}
        <div
          style={{ flex: 1, minWidth: 0 }}
          onClick={onClick}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <NotificationIcon type={notification.type} />
              <span
                style={{
                  color: !notification.isRead ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '15px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {notification.title}
              </span>
            </div>
            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          >
            {notification.content}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:bg-[#58a6ff]/10"
              aria-label="Mark as read"
              title="Mark as read"
            >
              <Check style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="hover:bg-red-500/10"
            aria-label="Delete notification"
            title="Delete"
          >
            <Trash2 style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isDesktop, isTablet, isMobile } = useResponsive()

  // Calculate responsive values
  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px'
  const headerPaddingTop = isDesktop || isTablet ? '72px' : '56px'

  // State
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedNotifications, setSelectedNotifications] = useState(new Set())

  // Memoize unread count
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, 'Loading notifications')
  useErrorAnnouncement(error)

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiService.get('/notifications')

      if (response.success && response.data) {
        setNotifications(response.data.notifications || [])
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications. Please try again later.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Refresh handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Pull-to-refresh hook
  const { containerRef, indicator } = usePullToRefresh(handleRefresh)

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Socket events for real-time updates
  useEffect(() => {
    socketService.on('notification_received', (data) => {
      setNotifications(prev => [data.notification, ...prev])
    })

    return () => {
      socketService.off('notification_received')
    }
  }, [])

  // Event handlers
  const handleMarkAsRead = useCallback(async (notificationId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ))

    try {
      await apiService.put(`/notifications/${notificationId}/read`)
      socketService.emit('notification_read', { notificationId })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: false } : n
      ))
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    const previousNotifications = notifications
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

    try {
      await apiService.put('/notifications/read-all')
      socketService.emit('notification_mark_all_read')
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      setNotifications(previousNotifications)
    }
  }, [notifications])

  const handleDelete = useCallback(async (notificationId) => {
    const previousNotifications = notifications
    setNotifications(prev => prev.filter(n => n.id !== notificationId))

    try {
      await apiService.delete(`/notifications/${notificationId}`)
      socketService.emit('notification_delete', { notificationId })
    } catch (err) {
      console.error('Failed to delete notification:', err)
      setNotifications(previousNotifications)
    }
  }, [notifications])

  const handleDeleteAll = useCallback(async () => {
    const previousNotifications = notifications
    setNotifications([])

    try {
      await apiService.delete('/notifications/all')
      socketService.emit('notification_delete_all')
    } catch (err) {
      console.error('Failed to delete all notifications:', err)
      setNotifications(previousNotifications)
    }
  }, [notifications])

  const handleNotificationClick = useCallback((notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }, [handleMarkAsRead, navigate])

  const handleToggleSelect = useCallback((notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }, [])

  const handleBulkMarkRead = useCallback(async () => {
    const previousNotifications = notifications
    const selectedIds = Array.from(selectedNotifications)

    setNotifications(prev => prev.map(n =>
      selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
    ))
    setSelectedNotifications(new Set())

    try {
      await apiService.put('/notifications/bulk-read', { notificationIds: selectedIds })
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
      setNotifications(previousNotifications)
      setSelectedNotifications(new Set(selectedIds))
    }
  }, [selectedNotifications, notifications])

  const handleBulkDelete = useCallback(async () => {
    const previousNotifications = notifications
    const selectedIds = Array.from(selectedNotifications)

    setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)))
    setSelectedNotifications(new Set())

    try {
      await apiService.delete('/notifications/bulk', { data: { notificationIds: selectedIds } })
    } catch (err) {
      console.error('Failed to delete notifications:', err)
      setNotifications(previousNotifications)
      setSelectedNotifications(new Set(selectedIds))
    }
  }, [selectedNotifications, notifications])

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() =>
    notifications.filter(n => {
      if (filter === 'all') return true
      if (filter === 'unread') return !n.isRead
      if (filter === 'mentions') return n.type === NOTIFICATION_TYPES.MENTION
      if (filter === 'reactions') return n.type === NOTIFICATION_TYPES.REACTION
      return true
    }),
    [notifications, filter]
  )

  // Memoize filter options
  const filterOptions = useMemo(() => ['all', 'unread', 'mentions', 'reactions'], [])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)'
      }}
      role="main"
    >
      {/* Fixed Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg-secondary)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--border-primary)'
        }}
      >
        <div
          style={{
            maxWidth: '896px',
            margin: '0 auto',
            padding: `16px ${pagePadding}`
          }}
        >
          {/* Title Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {isMobile && (
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-white/5"
                  aria-label="Go back"
                >
                  <ArrowLeft style={{ width: '24px', height: '24px', color: 'var(--text-secondary)', flexShrink: 0 }} />
                </button>
              )}
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <Bell style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(88, 166, 255, 0.3)'
                  }}
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                style={{
                  height: '48px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: unreadCount === 0 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                className="hover:bg-white/5"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                {!isMobile && <span>Mark all read</span>}
              </button>
              <button
                onClick={() => navigate('/settings/notifications')}
                style={{
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover:bg-white/5"
                aria-label="Notification settings"
              >
                <Settings style={{ width: '24px', height: '24px', color: 'var(--text-secondary)', flexShrink: 0 }} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}
            role="group"
            aria-label="Notification filters"
          >
            {filterOptions.map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                style={{
                  height: '48px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: filter === filterType ? 'transparent' : 'var(--border-primary)',
                  background: filter === filterType
                    ? 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)'
                    : 'var(--bg-secondary)',
                  color: filter === filterType ? 'white' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: filter === filterType ? '0 2px 8px rgba(88, 166, 255, 0.3)' : 'none'
                }}
                aria-pressed={filter === filterType}
                aria-label={`Filter by ${filterType} notifications`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk Actions Bar */}
          {selectedNotifications.size > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-primary)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)'
                }}
              >
                {selectedNotifications.size} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleBulkMarkRead}
                  style={{
                    height: '48px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:opacity-90"
                  aria-label="Mark selected notifications as read"
                >
                  <Check style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  <span>Mark read</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    height: '48px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-red-700"
                  aria-label="Delete selected notifications"
                >
                  <Trash2 style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        style={{
          maxWidth: '896px',
          margin: '0 auto',
          padding: `${headerPaddingTop} ${pagePadding} 48px`
        }}
      >
        {indicator}

        {error ? (
          /* Error State */
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center'
            }}
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Failed to Load Notifications
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
            </p>
            <button
              onClick={fetchNotifications}
              style={{
                height: '48px',
                padding: '0 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:opacity-90 hover:shadow-lg"
              aria-label="Try again to load notifications"
            >
              Try Again
            </button>
          </div>
        ) : !isAuthenticated ? (
          /* Not Authenticated */
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border-primary)',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center'
            }}
            role="status"
          >
            <Bell style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', margin: '0 auto 16px' }} />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Sign In Required
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please sign in to view your notifications
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                height: '48px',
                padding: '0 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:opacity-90 hover:shadow-lg"
              aria-label="Sign in to view notifications"
            >
              Sign In
            </button>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.has(notification.id)}
                onToggleSelect={handleToggleSelect}
                onMarkAsRead={handleMarkAsRead}
                onClick={() => handleNotificationClick(notification)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyNotifications />
        )}

        {/* Delete All Button */}
        {notifications.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <button
              onClick={handleDeleteAll}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '12px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                backgroundColor: 'var(--bg-secondary)',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:border-red-500/40 hover:bg-red-500/5"
              aria-label="Delete all notifications"
            >
              <Trash2 style={{ width: '24px', height: '24px', flexShrink: 0 }} />
              Delete all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
