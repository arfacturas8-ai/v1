/**
 * CRYB Platform - Notifications Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

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

const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  MENTION: 'mention',
  REACTION: 'reaction',
  FOLLOW: 'follow',
  AWARD: 'award',
  SYSTEM: 'system',
  REPLY: 'reply'
}

// Icon component with standard 20px sizing in 24px containers
const NotificationIcon = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return <MessageSquare style={{ width: '20px', height: '20px', color: '#58a6ff', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.MENTION:
        return <AtSign style={{ width: '20px', height: '20px', color: '#a371f7', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.REACTION:
        return <Heart style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.FOLLOW:
        return <UserPlus style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.AWARD:
        return <Award style={{ width: '20px', height: '20px', color: '#F59E0B', flexShrink: 0 }} />
      case NOTIFICATION_TYPES.REPLY:
        return <MessageSquare style={{ width: '20px', height: '20px', color: '#06B6D4', flexShrink: 0 }} />
      default:
        return <Bell style={{ width: '20px', height: '20px', color: '#666666', flexShrink: 0 }} />
    }
  }

  return (
    <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {getIcon()}
    </div>
  )
}

// Notification Card Component
const NotificationCard = ({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onClick,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isSelected ? '#58a6ff' : 'rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        borderLeftWidth: !notification.isRead ? '4px' : '1px',
        borderLeftColor: !notification.isRead ? '#58a6ff' : 'rgba(0, 0, 0, 0.06)',
        minHeight: '72px',
        padding: '20px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 8px 24px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
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
              borderRadius: '6px',
              borderWidth: '1px',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              accentColor: '#58a6ff'
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
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
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
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: '50%',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'white',
                boxShadow: '0 0 12px rgba(88, 166, 255, 0.6)'
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
                  color: !notification.isRead ? '#1A1A1A' : '#666666',
                  fontWeight: 600,
                  fontSize: '15px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em'
                }}
              >
                {notification.title}
              </span>
            </div>
            <span
              style={{
                color: '#999999',
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
              color: '#666666',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0
            }}
          >
            {notification.content}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {!notification.isRead && (
            <NotificationActionButton
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              icon={<Check style={{ width: '20px', height: '20px', color: '#58a6ff', flexShrink: 0 }} />}
              label="Mark as read"
              hoverBg="rgba(99, 102, 241, 0.08)"
            />
          )}
          <NotificationActionButton
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            icon={<Trash2 style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0 }} />}
            label="Delete"
            hoverBg="rgba(239, 68, 68, 0.08)"
          />
        </div>
      </div>
    </div>
  )
}

// Action Button Component
const NotificationActionButton = ({ onClick, icon, label, hoverBg }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: isHovered ? hoverBg : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
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
        // If API returns empty or not found, just show empty state (not an error)
        setNotifications([])
      }
    } catch (err) {
      console.error('Notifications API not available yet:', err)
      // Gracefully show empty state when API doesn't exist yet
      setNotifications([])
      setError(null) // Don't show error UI, just empty state
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
        backgroundColor: '#FAFAFA'
      }}
      role="main"
    >
      {/* Fixed Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'white',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: 'rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
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
                <BackButton onClick={() => navigate(-1)} />
              )}
              <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell style={{ width: '20px', height: '20px', color: '#58a6ff', flexShrink: 0 }} />
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeaderButton
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                icon={<CheckCheck style={{ width: '20px', height: '20px', flexShrink: 0 }} />}
                text={!isMobile ? 'Mark all read' : null}
                label="Mark all notifications as read"
              />
              <HeaderIconButton
                onClick={() => navigate('/settings/notifications')}
                icon={<Settings style={{ width: '20px', height: '20px', color: '#666666', flexShrink: 0 }} />}
                label="Notification settings"
              />
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
              <FilterButton
                key={filterType}
                isActive={filter === filterType}
                onClick={() => setFilter(filterType)}
                label={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              />
            ))}
          </div>

          {/* Bulk Actions Bar */}
          {selectedNotifications.size > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#666666'
                }}
              >
                {selectedNotifications.size} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <BulkActionButton
                  onClick={handleBulkMarkRead}
                  icon={<Check style={{ width: '20px', height: '20px', flexShrink: 0 }} />}
                  text="Mark read"
                  primary
                  label="Mark selected notifications as read"
                />
                <BulkActionButton
                  onClick={handleBulkDelete}
                  icon={<Trash2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />}
                  text="Delete"
                  danger
                  label="Delete selected notifications"
                />
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
              backgroundColor: 'white',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle style={{ width: '48px', height: '48px', color: '#EF4444', margin: '0 auto 16px' }} />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1A1A1A',
                marginBottom: '8px',
                letterSpacing: '-0.01em'
              }}
            >
              Failed to Load Notifications
            </h3>
            <p style={{ color: '#666666', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
              {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
            </p>
            <ActionButton
              onClick={fetchNotifications}
              text="Try Again"
              label="Try again to load notifications"
            />
          </div>
        ) : !isAuthenticated ? (
          /* Not Authenticated */
          <div
            style={{
              backgroundColor: 'white',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(0, 0, 0, 0.06)',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            role="status"
          >
            <Bell style={{ width: '48px', height: '48px', color: '#666666', margin: '0 auto 16px' }} />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1A1A1A',
                marginBottom: '8px',
                letterSpacing: '-0.01em'
              }}
            >
              Sign In Required
            </h3>
            <p style={{ color: '#666666', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
              Please sign in to view your notifications
            </p>
            <ActionButton
              onClick={() => navigate('/login')}
              text="Sign In"
              label="Sign in to view notifications"
            />
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
            <DeleteAllButton onClick={handleDeleteAll} />
          </div>
        )}
      </div>
    </div>
  )
}

// Reusable Button Components
const BackButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      aria-label="Go back"
    >
      <ArrowLeft style={{ width: '20px', height: '20px', color: '#666666', flexShrink: 0 }} />
    </button>
  )
}

const HeaderButton = ({ onClick, disabled, icon, text, label }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: '48px',
        padding: text ? '0 16px' : '0',
        width: text ? 'auto' : '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '14px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(0, 0, 0, 0.06)',
        backgroundColor: isHovered && !disabled ? 'rgba(0, 0, 0, 0.02)' : 'white',
        color: '#1A1A1A',
        fontSize: '14px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isHovered && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.06)' : 'none',
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)'
      }}
      aria-label={label}
    >
      {icon}
      {text && <span>{text}</span>}
    </button>
  )
}

const HeaderIconButton = ({ onClick, icon, label }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '14px',
        border: 'none',
        backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

const FilterButton = ({ isActive, onClick, label }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: '48px',
        padding: '0 20px',
        borderRadius: '14px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isActive ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
        background: isActive
          ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'
          : 'white',
        color: isActive ? 'white' : '#666666',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 16px rgba(99, 102, 241, 0.25)' : (isHovered ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none'),
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
      }}
      aria-pressed={isActive}
      aria-label={`Filter by ${label} notifications`}
    >
      {label}
    </button>
  )
}

const BulkActionButton = ({ onClick, icon, text, primary, danger, label }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStyles = () => {
    if (primary) {
      return {
        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        color: 'white',
        shadow: isHovered ? '0 8px 24px rgba(99, 102, 241, 0.35)' : '0 4px 16px rgba(99, 102, 241, 0.25)'
      }
    }
    if (danger) {
      return {
        background: '#EF4444',
        color: 'white',
        shadow: isHovered ? '0 8px 24px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(239, 68, 68, 0.25)'
      }
    }
    return {
      background: 'white',
      color: '#1A1A1A',
      shadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none'
    }
  }

  const styles = getStyles()

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: '48px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '14px',
        border: 'none',
        background: styles.background,
        color: styles.color,
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: styles.shadow,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
      aria-label={label}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}

const ActionButton = ({ onClick, text, label }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: '56px',
        padding: '0 32px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        color: 'white',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 12px 32px rgba(99, 102, 241, 0.4)' : '0 8px 24px rgba(99, 102, 241, 0.3)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
      aria-label={label}
    >
      {text}
    </button>
  )
}

const DeleteAllButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '16px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isHovered ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
        backgroundColor: isHovered ? 'rgba(239, 68, 68, 0.04)' : 'white',
        color: '#EF4444',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 4px 12px rgba(239, 68, 68, 0.1)' : 'none'
      }}
      aria-label="Delete all notifications"
    >
      <Trash2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
      Delete all notifications
    </button>
  )
}

export default NotificationsPage
