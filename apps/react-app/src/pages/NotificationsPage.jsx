import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import socketService from '../services/socket'
import apiService from '../services/api'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Settings,
  MessageSquare,
  Heart,
  UserPlus,
  AtSign,
  Award,
  Zap,
  AlertCircle,
  ArrowLeft,
  Loader
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader'
import { EmptyNotifications } from '../components/ui/EmptyState'
import usePullToRefresh from '../hooks/usePullToRefresh.jsx'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

/**
 * NotificationsPage - Comprehensive notification center
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

const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MESSAGE:
      return <MessageSquare className="w-5 h-5 text-[#58a6ff]" />
    case NOTIFICATION_TYPES.MENTION:
      return <AtSign className="w-5 h-5 text-purple-500" />
    case NOTIFICATION_TYPES.REACTION:
      return <Heart className="w-5 h-5 text-red-500" />
    case NOTIFICATION_TYPES.FOLLOW:
      return <UserPlus className="w-5 h-5 text-green-500" />
    case NOTIFICATION_TYPES.AWARD:
      return <Award className="w-5 h-5 text-yellow-500" />
    case NOTIFICATION_TYPES.REPLY:
      return <MessageSquare className="w-5 h-5 text-cyan-500" />
    default:
      return <Bell className="w-5 h-5 text-[#666666]" />
  }
}

function NotificationsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  // State
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, unread, mentions, reactions
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
    // Optimistic update
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ))

    try {
      await apiService.put(`/notifications/${notificationId}/read`)
      socketService.emit('notification_read', { notificationId })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      // Revert on error
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: false } : n
      ))
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    // Optimistic update
    const previousNotifications = notifications
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

    try {
      await apiService.put('/notifications/read-all')
      socketService.emit('notification_mark_all_read')
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      // Revert on error
      setNotifications(previousNotifications)
    }
  }, [notifications])

  const handleDelete = useCallback(async (notificationId) => {
    // Optimistic update
    const previousNotifications = notifications
    setNotifications(prev => prev.filter(n => n.id !== notificationId))

    try {
      await apiService.delete(`/notifications/${notificationId}`)
      socketService.emit('notification_delete', { notificationId })
    } catch (err) {
      console.error('Failed to delete notification:', err)
      // Revert on error
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

    // Optimistic update
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

    // Optimistic update
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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-all duration-200 touch-target"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-[#666666]" aria-hidden="true" />
              </button>
              <Bell className="w-6 h-6 text-[#58a6ff]" aria-hidden="true" />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-xs font-semibold rounded-full shadow-lg" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="px-3 py-2 bg-white hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm border flex items-center gap-2 transition-all duration-200 touch-target"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">Mark all read</span>
              </button>
              <button className="p-2 rounded-lg transition-all duration-200 touch-target" style={{ color: 'var(--text-secondary)' }} aria-label="Notification settings">
                <Settings className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Notification filters">
            {filterOptions.map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 touch-target border
                  ${filter === filterType
                    ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg'
                    : 'bg-white'
                  }
                `}
                style={filter !== filterType ? { borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' } : {}}
                aria-pressed={filter === filterType}
                aria-label={`Filter by ${filterType} notifications`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="mt-3 p-3 bg-white border rounded-xl shadow-sm flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {selectedNotifications.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkMarkRead}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 rounded-lg text-sm text-white font-medium flex items-center gap-1.5 transition-all duration-200 touch-target"
                  aria-label="Mark selected notifications as read"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Mark read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white font-medium flex items-center gap-1.5 transition-all duration-200 touch-target"
                  aria-label="Delete selected notifications"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6" ref={containerRef}>
        {indicator}
        {error ? (
          /* Error State */
          <div className="bg-white border border-red-500/20 rounded-2xl shadow-sm p-8 text-center" style={{ borderColor: 'var(--border-subtle)' }} role="alert" aria-live="assertive">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Failed to Load Notifications</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <button
              onClick={fetchNotifications}
              className="px-6 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 hover:shadow-lg rounded-lg text-white font-medium transition-all duration-200 touch-target"
              aria-label="Try again to load notifications"
            >
              Try Again
            </button>
          </div>
        ) : !isAuthenticated ? (
          /* Not Authenticated */
          <div className="bg-white border rounded-2xl shadow-sm p-8 text-center" style={{ borderColor: 'var(--border-subtle)' }} role="status">
            <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In Required</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Please sign in to view your notifications</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 hover:shadow-lg rounded-lg text-white font-medium transition-all duration-200 touch-target"
              aria-label="Sign in to view notifications"
            >
              Sign In
            </button>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  bg-white border rounded-2xl shadow-sm p-4 transition-all duration-200 hover:shadow-md
                  ${!notification.isRead ? 'border-l-4 border-l-[#58a6ff]' : ''}
                  ${selectedNotifications.has(notification.id) ? 'border-[#58a6ff]/30' : ''}
                `}
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleToggleSelect(notification.id)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent checked:bg-gradient-to-r checked:from-[#58a6ff] checked:to-[#a371f7] focus:ring-2 focus:ring-[#58a6ff]/50 cursor-pointer transition-all"
                    aria-label={`Select notification: ${notification.title}`}
                  />

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-xl" aria-hidden="true">
                      {notification.avatar}
                    </div>
                    {!notification.isRead && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#58a6ff] rounded-full border-2 border-[#0D0D0D] shadow-[0_0_8px_rgba(88,166,255,0.6)]" aria-hidden="true"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <span className="font-semibold" style={{ color: !notification.isRead ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {notification.title}
                        </span>
                      </div>
                      <span className="text-xs whitespace-nowrap font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: !notification.isRead ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>{notification.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="p-2 hover:bg-[#58a6ff]/10 rounded-lg transition-all duration-200 group touch-target"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-[#58a6ff] group-hover:scale-110 transition-transform" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200 group touch-target"
                      aria-label="Delete notification"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNotifications />
        )}
      </div>

      {/* Delete All (if notifications exist) */}
      {notifications.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <button
            onClick={handleDeleteAll}
            className="w-full px-4 py-3 bg-white border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 rounded-2xl shadow-sm text-red-500 font-medium flex items-center justify-center gap-2 transition-all duration-200 touch-target"
            aria-label="Delete all notifications"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete all notifications
          </button>
        </div>
      )}
    </div>
  )
}


export default NOTIFICATION_TYPES
