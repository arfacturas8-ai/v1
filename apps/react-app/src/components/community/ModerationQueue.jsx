import React, { useState, useEffect } from 'react'
import {
  Shield, AlertTriangle, Check, X, Eye,
  MessageSquare, Flag, Ban, User, Clock,
  Filter, Search, MoreVertical, ChevronDown
} from 'lucide-react'
import communityService, { MODERATION_ACTIONS } from '../../services/communityService'
import socketService from '../../services/socket'

export default function ModerationQueue({
  communityId,
  currentUser,
  canModerate = false
}) {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [moderationReason, setModerationReason] = useState('')

  useEffect(() => {
    if (canModerate) {
      loadModerationQueue()

      socketService.subscribeModerationQueue(communityId)
      socketService.on('moderation_queue_updated', handleQueueUpdate)
      socketService.on('content_moderated', handleContentModerated)

      return () => {
        socketService.unsubscribeModerationQueue(communityId)
        socketService.off('moderation_queue_updated', handleQueueUpdate)
        socketService.off('content_moderated', handleContentModerated)
      }
    }
  }, [communityId, canModerate])

  useEffect(() => {
    if (filterType !== 'all' || filterStatus !== 'pending' || searchQuery) {
      loadModerationQueue()
    }
  }, [filterType, filterStatus, searchQuery])

  const loadModerationQueue = async () => {
    try {
      setLoading(true)
      setError(null)

      const options = {
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus,
        search: searchQuery || undefined
      }

      const result = await communityService.getModerationQueue(communityId, options)

      if (result.success) {
        setQueue(result.queue)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to load moderation queue:', error)
      setError('Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }

  const handleQueueUpdate = (data) => {
    if (data.communityId === communityId) {
      loadModerationQueue()
    }
  }

  const handleContentModerated = (data) => {
    if (data.communityId === communityId) {
      setQueue(prev => prev.filter(item => item.id !== data.itemId))
    }
  }

  const handleModerateItem = async (itemId, action, reason = '') => {
    try {
      const result = await communityService.moderateContent(communityId, itemId, action, reason)

      if (result.success) {
        setQueue(prev => prev.filter(item => item.id !== itemId))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to moderate content:', error)
      setError('Failed to moderate content')
    }
  }

  const handleBulkModeration = async (action) => {
    if (selectedItems.size === 0) return

    const reason = moderationReason || `Bulk ${action} by moderator`

    try {
      const promises = Array.from(selectedItems).map(itemId =>
        communityService.moderateContent(communityId, itemId, action, reason)
      )

      await Promise.all(promises)

      setQueue(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      setModerationReason('')
      setShowBulkActions(false)
    } catch (error) {
      console.error('Failed to bulk moderate:', error)
      setError('Failed to perform bulk moderation')
    }
  }

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedItems(new Set(queue.map(item => item.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const getItemTypeIcon = (type) => {
    switch (type) {
      case 'post':
        return <MessageSquare size={16} />
      case 'comment':
        return <MessageSquare size={16} />
      case 'report':
        return <Flag size={16} />
      default:
        return <AlertTriangle size={16} />
    }
  }

  const getItemTypeColor = (type) => {
    switch (type) {
      case 'post':
        return '#0ea5e9'
      case 'comment':
        return '#10b981'
      case 'report':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const itemDate = new Date(date)
    const diffInHours = Math.floor((now - itemDate) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - itemDate) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  if (!canModerate) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="text-center py-16 text-red-500">
          <Shield size={48} className="mx-auto mb-4 opacity-70" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access the moderation queue.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full  mb-4"></div>
          <p>Loading moderation queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white mb-1">
            <Shield size={24} />
            Moderation Queue
          </h2>
          <p className="text-sm text-gray-400">{queue.length} items pending review</p>
        </div>

        {selectedItems.size > 0 && (
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              {selectedItems.size} selected
              <ChevronDown size={16} />
            </button>

            {showBulkActions && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 min-w-[200px] z-50 shadow-xl animate-fadeIn">
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Moderation reason (optional)"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleBulkModeration(MODERATION_ACTIONS.APPROVE)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-green-500 hover:bg-gray-700 rounded text-xs transition-colors"
                >
                  <Check size={14} />
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkModeration(MODERATION_ACTIONS.REMOVE)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-red-500 hover:bg-gray-700 rounded text-xs transition-colors"
                >
                  <X size={14} />
                  Remove All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-5 p-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 flex-1 md:max-w-xs">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-gray-400 min-h-[28px]"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer focus:outline-none focus:border-blue-500 min-h-[44px]"
          >
            <option value="all">All Types</option>
            <option value="posts">Posts</option>
            <option value="comments">Comments</option>
            <option value="reports">Reports</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer focus:outline-none focus:border-blue-500 min-h-[44px]"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="removed">Removed</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={selectAll} className="border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition-colors min-h-[44px]">
            Select All
          </button>
          <button onClick={deselectAll} className="border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition-colors min-h-[44px]">
            Deselect All
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-500 text-sm">
          <AlertTriangle size={16} />
          {typeof error === 'string' ? error : 'An error occurred'}
        </div>
      )}

      {/* Queue List */}
      <div className="flex flex-col gap-3">
        {queue.map(item => (
          <div key={item.id} className={`flex flex-col md:flex-row items-start gap-3 bg-gray-800/60 backdrop-blur-sm border rounded-lg p-4 transition-all ${selectedItems.has(item.id) ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:border-blue-500/30'}`}>
            {/* Checkbox */}
            <div className="flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleItemSelection(item.id)}
                className="w-4 h-4 cursor-pointer min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              />
            </div>

            {/* Type Icon */}
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 flex-shrink-0" style={{ color: getItemTypeColor(item.type) }}>
              {getItemTypeIcon(item.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold uppercase">{item.type}</span>
                  {item.priority && (
                    <span className="text-white px-1.5 py-0.5 rounded text-xs font-semibold uppercase" style={{ backgroundColor: getPriorityColor(item.priority) }}>
                      {item.priority}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={12} />
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <img
                    src={item.author?.avatar || '/default-avatar.png'}
                    alt={item.author?.username}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-gray-400">@{item.author?.username}</span>
                </div>
              </div>

              <div>
                {item.title && <h4 className="text-white font-semibold mb-1">{item.title}</h4>}
                <p className="text-gray-300 text-sm leading-relaxed break-words">{item.content}</p>
              </div>

              {item.reports && item.reports.length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <h5 className="text-red-500 font-semibold text-sm mb-2">Reports ({item.reports.length}):</h5>
                  <div className="flex flex-col gap-1">
                    {item.reports.slice(0, 3).map((report, index) => (
                      <div key={index} className="text-xs text-gray-400">
                        <strong className="text-red-500">{report.reason}:</strong> {report.details}
                      </div>
                    ))}
                    {item.reports.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{item.reports.length - 3} more reports
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.media && item.media.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {item.media.map((media, index) => (
                    <img
                      key={index}
                      src={media.url}
                      alt={`Media ${index + 1}`}
                      className="w-15 h-15 object-cover rounded border border-gray-700"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex md:flex-col gap-1.5 self-center">
              <button
                className="flex items-center justify-center min-w-[44px] w-8 h-8 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                onClick={() => handleModerateItem(item.id, MODERATION_ACTIONS.APPROVE)}
                title="Approve"
              >
                <Check size={16} />
              </button>

              <button
                className="flex items-center justify-center min-w-[44px] w-8 h-8 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                onClick={() => handleModerateItem(item.id, MODERATION_ACTIONS.REMOVE, 'Removed by moderator')}
                title="Remove"
              >
                <X size={16} />
              </button>

              <button
                className="flex items-center justify-center min-w-[44px] w-8 h-8 border border-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 rounded-lg transition-all"
                title="View Full Content"
              >
                <Eye size={16} />
              </button>

              <div className="relative group">
                <button className="flex items-center justify-center min-w-[44px] w-8 h-8 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-all">
                  <MoreVertical size={16} />
                </button>
                <div className="hidden group-hover:block absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[140px] z-50 shadow-xl">
                  <button
                    onClick={() => handleModerateItem(item.id, MODERATION_ACTIONS.FLAG)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-white hover:bg-gray-700 text-xs transition-colors"
                  >
                    <Flag size={14} />
                    Flag for Review
                  </button>
                  <button
                    onClick={() => handleModerateItem(item.id, MODERATION_ACTIONS.LOCK)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-white hover:bg-gray-700 text-xs transition-colors"
                  >
                    <Ban size={14} />
                    Lock Content
                  </button>
                  {item.author && (
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-white hover:bg-gray-700 text-xs transition-colors">
                      <User size={14} />
                      View User Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {queue.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Shield size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No items in queue</h3>
            <p className="text-sm">All content has been reviewed. Great job keeping the community safe!</p>
          </div>
        )}
      </div>
    </div>
  )
}

