import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import MessageReactions from '../MessageReactions'
import MessageActions from '../MessageActions'
import ReactMarkdown from 'react-markdown'

/**
 * MessageList Component
 * Optimized for performance with virtual scrolling and mobile touch interactions
 */
function MessageList({
  messages = [],
  currentUserId,
  onMessageEdit,
  onMessageDelete,
  onMessageReply,
  onMessageReact,
  onMessageCopy,
  onMessagePin,
  onMessageSelect,
  onOpenThread,
  isMobile = false,
  isLoading = false,
  hasMore = false,
  onLoadMore
}) {
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  
  const containerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const observerRef = useRef(null)
  const itemHeights = useRef(new Map())
  const lastScrollTop = useRef(0)

  // Constants for virtual scrolling
  const ESTIMATED_ITEM_HEIGHT = 80
  const BUFFER_SIZE = 10
  const OVERSCAN = 5

  // Memoized grouped messages for better performance
  const groupedMessages = useMemo(() => {
    const groups = {}
    
    messages.forEach(message => {
      const dateKey = new Date(message.timestamp).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }, [messages])

  // Memoized flat message list with date separators
  const flatMessageList = useMemo(() => {
    const flatList = []
    
    Object.entries(groupedMessages).forEach(([dateKey, dateMessages]) => {
      // Add date separator
      flatList.push({
        type: 'date-separator',
        id: `date-${dateKey}`,
        dateKey,
        date: new Date(dateKey)
      })
      
      // Add messages
      dateMessages.forEach((message, index) => {
        const prevMessage = dateMessages[index - 1]
        const showAvatar = !prevMessage || prevMessage.userId !== message.userId
        
        flatList.push({
          type: 'message',
          ...message,
          showAvatar,
          isOwnMessage: message.userId === currentUserId
        })
      })
    })
    
    return flatList
  }, [groupedMessages, currentUserId])

  // Virtual scrolling calculations
  const getItemHeight = useCallback((index) => {
    return itemHeights.current.get(index) || ESTIMATED_ITEM_HEIGHT
  }, [])

  const getTotalHeight = useCallback(() => {
    let total = 0
    for (let i = 0; i < flatMessageList.length; i++) {
      total += getItemHeight(i)
    }
    return total
  }, [flatMessageList.length, getItemHeight])

  const getVisibleRange = useCallback((scrollTop, containerHeight) => {
    let start = 0
    let offset = 0
    
    // Find start index
    while (start < flatMessageList.length && offset + getItemHeight(start) < scrollTop) {
      offset += getItemHeight(start)
      start++
    }
    
    // Find end index
    let end = start
    let visibleHeight = 0
    while (end < flatMessageList.length && visibleHeight < containerHeight + BUFFER_SIZE * ESTIMATED_ITEM_HEIGHT) {
      visibleHeight += getItemHeight(end)
      end++
    }
    
    // Add overscan
    start = Math.max(0, start - OVERSCAN)
    end = Math.min(flatMessageList.length, end + OVERSCAN)
    
    return { start, end }
  }, [flatMessageList.length, getItemHeight])

  // Scroll handler with throttling
  const handleScroll = useCallback((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target
    
    // Update visible range for virtual scrolling
    const newRange = getVisibleRange(scrollTop, clientHeight)
    if (newRange.start !== visibleRange.start || newRange.end !== visibleRange.end) {
      setVisibleRange(newRange)
    }
    
    // Load more messages when near top
    if (scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore()
    }
    
    lastScrollTop.current = scrollTop
  }, [getVisibleRange, visibleRange, hasMore, isLoading, onLoadMore])

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'end'
      })
    }
  }, [])

  // Check if user is at bottom
  const isAtBottom = useCallback(() => {
    if (!containerRef.current) return true
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 50
  }, [])

  // Auto-scroll when new messages arrive (only if at bottom)
  useEffect(() => {
    if (messages.length > 0 && isAtBottom()) {
      scrollToBottom(true)
    }
  }, [messages.length, scrollToBottom, isAtBottom])

  // Touch handlers for mobile interactions
  const handleTouchStart = useCallback((e, message) => {
    if (!isMobile) return
    
    const touch = e.touches[0]
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      messageId: message.id
    })
    setTouchEnd(null)
  }, [isMobile])

  const handleTouchMove = useCallback((e, message) => {
    if (!isMobile || !touchStart) return
    
    const touch = e.touches[0]
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      messageId: message.id
    })
  }, [isMobile, touchStart])

  const handleTouchEnd = useCallback((e, message) => {
    if (!isMobile || !touchStart || !touchEnd) return
    
    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const deltaTime = Date.now() - touchStart.timestamp
    
    // Detect swipe gestures
    const minSwipeDistance = 50
    const maxSwipeTime = 500
    
    if (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime && Math.abs(deltaY) < 100) {
      if (deltaX > 0) {
        // Swipe right - reply to message
        onMessageReply && onMessageReply(message)
      } else {
        // Swipe left - show actions
        setSelectedMessages(new Set([message.id]))
        setIsSelectionMode(true)
      }
    } else if (deltaTime > 500) {
      // Long press - select message
      setSelectedMessages(new Set([message.id]))
      setIsSelectionMode(true)
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }, [isMobile, touchStart, touchEnd, onMessageReply])

  // Format date helper
  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }, [])

  // Format time helper
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }, [])

  // Item renderer for virtual scrolling
  const renderItem = useCallback((item, index) => {
    if (item.type === 'date-separator') {
      return (
        <div key={item.id} className="flex items-center justify-center my-8">
          <div className="flex items-center w-full px-4">
            <div className="flex-1 border-t border-white/10"></div>
            <div className="px-4 py-2 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              <span className="text-sm font-medium text-[#8b949e]">
                {formatDate(item.date)}
              </span>
            </div>
            <div className="flex-1 border-t border-white/10"></div>
          </div>
        </div>
      )
    }

    const { message, showAvatar, isOwnMessage } = item
    const readCount = message.readBy ? message.readBy.length : 1
    const threadCount = message.threadReplies?.length || 0
    const isSelected = selectedMessages.has(message.id)

    return (
      <div
        key={message.id}
        id={`message-${message.id}`}
        style={{
  position: 'relative',
          transform: touchStart?.messageId === message.id && touchEnd
            ? `translateX(${touchEnd.x - touchStart.x}px)`
            : 'translateX(0)',
          transition: touchStart?.messageId === message.id ? 'none' : 'all 0.2s ease'
        }}
        onTouchStart={(e) => handleTouchStart(e, message)}
        onTouchMove={(e) => handleTouchMove(e, message)}
        onTouchEnd={(e) => handleTouchEnd(e, message)}
      >
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  padding: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          
          {/* Avatar */}
          {showAvatar ? (
            <div 
              style={{
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold',
  backgroundColor: isOwnMessage ? 'var(--accent-primary)' : '#6b7280'
}}
            >
              {message.avatar}
            </div>
          ) : (
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} flex-shrink-0`}></div>
          )}
          
          {/* Message content */}
          <div style={{
  flex: '1'
}}>
            
            {/* Username and timestamp */}
            {showAvatar && (
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                  {isOwnMessage ? 'You' : message.username}
                </span>
                <span style={{
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-muted)'
}}>
                  {formatTime(message.timestamp)}
                  {message.edited && (
                    <span className="ml-1">(edited)</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Message bubble */}
            <MessageBubble
              message={message}
              isOwnMessage={isOwnMessage}
              isMobile={isMobile}
              isSelected={isSelected}
              onReact={onMessageReact}
            />
            
            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className={`mt-2 ${isOwnMessage ? 'text-right' : ''}`}>
                <MessageReactions
                  reactions={message.reactions}
                  onAddReaction={(emoji) => onMessageReact && onMessageReact(message.id, emoji)}
                  onRemoveReaction={(emoji) => onMessageReact && onMessageReact(message.id, emoji)}
                  currentUserId={currentUserId}
                  isMobile={isMobile}
                />
              </div>
            )}
            
            {/* Thread indicator */}
            {threadCount > 0 && (
              <button
                onClick={() => onOpenThread && onOpenThread(message)}
                style={{
  display: 'flex',
  alignItems: 'center',
  color: 'var(--accent-primary)'
}}
              >
                <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
                <span>{threadCount} {threadCount === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
            
            {/* Read receipts */}
            {isOwnMessage && readCount > 1 && (
              <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
                <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                  Read by {readCount - 1}
                </span>
              </div>
            )}
          </div>

          {/* Message Actions */}
          <div style={{
  position: 'absolute'
}}>
            <MessageActions
              message={message}
              isOwnMessage={isOwnMessage}
              onEdit={onMessageEdit}
              onDelete={onMessageDelete}
              onReply={onMessageReply}
              onReact={onMessageReact}
              onCopy={onMessageCopy}
              onPin={onMessagePin}
              className="transform -translate-y-2"
              isMobile={isMobile}
              isVisible={isMobile || undefined}
            />
          </div>
        </div>
      </div>
    )
  }, [
    currentUserId, selectedMessages, touchStart, touchEnd, isMobile,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    formatDate, formatTime, onMessageEdit, onMessageDelete,
    onMessageReply, onMessageReact, onMessageCopy, onMessagePin, onOpenThread
  ])

  // Get items to render based on visible range
  const itemsToRender = useMemo(() => {
    return flatMessageList.slice(visibleRange.start, visibleRange.end)
      .map((item, index) => renderItem(item, visibleRange.start + index))
  }, [flatMessageList, visibleRange, renderItem])

  // Calculate spacer heights for virtual scrolling
  const getSpacerHeight = useCallback((start, end) => {
    let height = 0
    for (let i = start; i < end; i++) {
      height += getItemHeight(i)
    }
    return height
  }, [getItemHeight])

  const topSpacerHeight = getSpacerHeight(0, visibleRange.start)
  const bottomSpacerHeight = getSpacerHeight(visibleRange.end, flatMessageList.length)

  return (
    <div className="flex flex-col h-full relative">

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Messages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
        onScroll={handleScroll}
      >
        {/* Virtual scrolling implementation */}
        <div style={{ height: getTotalHeight(), position: 'relative' }}>
          
          {/* Top spacer */}
          {topSpacerHeight > 0 && (
            <div style={{ height: topSpacerHeight }} />
          )}
          
          {/* Visible items */}
          <div>
            {itemsToRender}
          </div>
          
          {/* Bottom spacer */}
          {bottomSpacerHeight > 0 && (
            <div style={{ height: bottomSpacerHeight }} />
          )}
          
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Selection mode actions */}
      {isSelectionMode && selectedMessages.size > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between p-4 bg-[#161b22]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <span className="font-medium text-white">
              {selectedMessages.size} message{selectedMessages.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  selectedMessages.forEach(messageId => {
                    const message = messages.find(m => m.id === messageId)
                    if (message) onMessageCopy && onMessageCopy(message)
                  })
                  setIsSelectionMode(false)
                  setSelectedMessages(new Set())
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-medium hover:shadow-[0_8px_32px_rgba(88,166,255,0.3)] transition-all"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedMessages(new Set())
                }}
                className="px-4 py-2 bg-[#0d1117] border border-white/10 text-white rounded-xl font-medium hover:bg-[#161b22] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Scroll to bottom button */}
      {!isAtBottom() && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-4 p-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-full shadow-[0_8px_32px_rgba(88,166,255,0.4)] hover:shadow-[0_12px_40px_rgba(88,166,255,0.5)] transition-all z-10"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}



export default MessageList