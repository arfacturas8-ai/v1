import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import MessageActions from './MessageActions'
import MessageReactions from './MessageReactions'
import { Card } from '../ui/Card'
import { IconButton } from '../ui/Button'

/**
 * MessageBubble Component
 * Touch-friendly message bubble with swipe gestures and interactive elements
 */
function MessageBubble({
  message,
  isOwnMessage = false,
  isMobile = false,
  isSelected = false,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy,
  currentUserId = 'current-user',
  className = ''
}) {
  const [touchStart, setTouchStart] = useState(null)
  const [touchCurrent, setTouchCurrent] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const bubbleRef = useRef(null)
  const swipeThreshold = 80
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥']

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e) => {
    if (!isMobile) return
    
    const touch = e.touches[0]
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    })
    setTouchCurrent({ x: touch.clientX, y: touch.clientY })
    setIsSwipeActive(true)
  }

  const handleTouchMove = (e) => {
    if (!isMobile || !touchStart || !isSwipeActive) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    
    // Only allow horizontal swipes
    if (Math.abs(deltaY) > 50) {
      setIsSwipeActive(false)
      return
    }
    
    // Limit swipe direction based on message ownership
    const maxOffset = isOwnMessage ? -swipeThreshold : swipeThreshold
    const constrainedOffset = isOwnMessage 
      ? Math.max(deltaX, -swipeThreshold) 
      : Math.min(deltaX, swipeThreshold)
    
    setSwipeOffset(constrainedOffset)
    setTouchCurrent({ x: touch.clientX, y: touch.clientY })
    
    // Show quick reactions when swiped enough
    if (Math.abs(constrainedOffset) > swipeThreshold * 0.7) {
      setShowQuickReactions(true)
    } else {
      setShowQuickReactions(false)
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || !touchStart || !isSwipeActive) return
    
    const swipeDistance = Math.abs(swipeOffset)
    const swipeDirection = swipeOffset > 0 ? 'right' : 'left'
    
    if (swipeDistance > swipeThreshold * 0.6) {
      // Trigger action based on swipe direction
      if (swipeDirection === 'right' && !isOwnMessage) {
        // Swipe right on others' messages = reply
        onReply && onReply(message)
      } else if (swipeDirection === 'left' && isOwnMessage) {
        // Swipe left on own messages = edit/delete
        setShowQuickReactions(true)
      }
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30)
      }
    }
    
    // Reset swipe state
    setTimeout(() => {
      setSwipeOffset(0)
      setIsSwipeActive(false)
      setShowQuickReactions(false)
    }, 200)
    
    setTouchStart(null)
    setTouchCurrent(null)
  }

  // Handle quick reaction selection
  const handleQuickReaction = (emoji) => {
    onReact && onReact(message.id, emoji)
    setShowQuickReactions(false)
    setSwipeOffset(0)
  }

  // Handle message actions
  const handleReaction = (messageId, emoji) => {
    onReact && onReact(messageId, emoji)
  }

  const handleRemoveReaction = (messageId, emoji) => {
    // Implementation would remove user from reaction
    onReact && onReact(messageId, emoji, 'remove')
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      // Could show a toast notification here
    })
    onCopy && onCopy(content)
  }

  const handlePin = (message) => {
    onPin && onPin(message)
  }

  // Detect links, mentions, and other interactive content
  const parseContent = (content) => {
    // Simple URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const mentionRegex = /@(\w+)/g
    const hashtagRegex = /#(\w+)/g
    
    return content
      .replace(urlRegex, '[$1]($1)')  // Convert URLs to markdown links
      .replace(mentionRegex, '**@$1**')  // Bold mentions
      .replace(hashtagRegex, '**#$1**')  // Bold hashtags
  }

  // Handle long press for context menu
  useEffect(() => {
    let longPressTimer
    
    const startLongPress = () => {
      longPressTimer = setTimeout(() => {
        if (isMobile) {
          setShowQuickReactions(true)
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
        }
      }, 500)
    }
    
    const clearLongPress = () => {
      clearTimeout(longPressTimer)
    }
    
    const bubbleElement = bubbleRef.current
    if (bubbleElement && isMobile) {
      bubbleElement.addEventListener('touchstart', startLongPress)
      bubbleElement.addEventListener('touchend', clearLongPress)
      bubbleElement.addEventListener('touchmove', clearLongPress)
      
      return () => {
        bubbleElement.removeEventListener('touchstart', startLongPress)
        bubbleElement.removeEventListener('touchend', clearLongPress)
        bubbleElement.removeEventListener('touchmove', clearLongPress)
      }
    }
  }, [isMobile])

  // Get bubble styles based on message type and state - Light Theme Design
  const getBubbleStyles = () => {
    const baseStyles = {
      transform: `translateX(${swipeOffset}px)`,
      transition: isSwipeActive ? 'none' : 'var(--transition-normal)',
      maxWidth: isMobile ? '85%' : '70%',
      position: 'relative',
    }

    // Light Theme - User messages with gradient
    if (isOwnMessage) {
      return {
        ...baseStyles,
        background: isSelected
          ? 'var(--brand-gradient)'
          : 'var(--brand-gradient)',
        color: 'var(--text-inverse)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)',
        marginLeft: 'auto',
        boxShadow: isSelected
          ? 'var(--shadow-lg)'
          : 'var(--shadow-md)',
        border: 'none',
      }
    } else {
      return {
        ...baseStyles,
        background: isSelected
          ? 'var(--bg-hover)'
          : 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        boxShadow: isSelected
          ? 'var(--shadow-md)'
          : 'var(--shadow-sm)',
      }
    }
  }

  // Render file attachments
  const renderAttachment = (content) => {
    if (content.includes('📎')) {
      // File attachment
      return (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  borderRadius: '4px'
}}>
          <svg style={{
  width: '20px',
  height: '20px'
}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{content.replace('📎 ', '')}</span>
        </div>
      )
    } else if (content.includes('🎵')) {
      // Voice message
      return (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '4px'
}}>
          <button style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff'
}}>
            <svg style={{
  width: '20px',
  height: '20px'
}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
          <div style={{
  flex: '1'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  flex: '1',
  height: '4px',
  borderRadius: '4px'
}}>
                <div style={{
  height: '4px',
  borderRadius: '4px',
  width: '40%'
}}></div>
              </div>
              <span className="text-xs opacity-70">0:42</span>
            </div>
          </div>
        </div>
      )
    }
    
    return null
  }

  return (
    <div style={{
  position: 'relative'
}}>
      {/* Swipe action indicators */}
      {isSwipeActive && swipeOffset !== 0 && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center'
}}>
          {swipeOffset > 0 && !isOwnMessage && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  color: '#ffffff'
}}>
              <svg style={{
  width: '24px',
  height: '24px'
}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {swipeOffset < 0 && isOwnMessage && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}>
              <svg style={{
  width: '24px',
  height: '24px'
}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div
        ref={bubbleRef}
        style={{
  position: 'relative',
  paddingLeft: '20px',
  paddingRight: '20px',
  paddingTop: '12px',
  paddingBottom: '12px',
          ...getBubbleStyles(),
          animation: 'messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Special content rendering */}
        {renderAttachment(message.content) || (
          <ReactMarkdown 
            className="prose prose-invert prose-sm max-w-none message-content"
            components={{
              p: ({ children }) => <span className="inline">{children}</span>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  style={{ color: isOwnMessage ? 'rgba(255,255,255,0.9)' : 'var(--brand-primary)' }}
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code
                  style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: 'var(--radius-sm)',
                    backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                    color: isOwnMessage ? 'var(--text-inverse)' : 'var(--brand-primary)'
                  }}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
  padding: '8px',
  borderRadius: 'var(--radius-md)',
                    backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)',
                  }}
                >
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong style={{ color: isOwnMessage ? 'var(--text-inverse)' : 'var(--text-primary)', fontWeight: 'var(--font-semibold)' }}>
                  {children}
                </strong>
              )
            }}
          >
            {parseContent(message.content)}
          </ReactMarkdown>
        )}

        {/* Message status indicators */}
        {isOwnMessage && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end'
}}>
            {/* Delivery status */}
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <svg className="w-3.5 h-3.5 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {/* Read receipt (double check) */}
              {message.readBy && message.readBy.length > 1 && (
                <svg className="w-3.5 h-3.5 -ml-1 text-accent-light transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-xs opacity-60">
              {new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </span>
          </div>
        )}

        {/* Message Actions (Hover) */}
        {isHovered && !isMobile && (
          <MessageActions
            message={message}
            isOwnMessage={isOwnMessage}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={handleReaction}
            onPin={handlePin}
            onCopy={handleCopy}
            position={isOwnMessage ? 'top-left' : 'top-right'}
          />
        )}
      </div>

      {/* Message Reactions */}
      <MessageReactions
        reactions={message.reactions || {}}
        onAddReaction={handleReaction}
        onRemoveReaction={handleRemoveReaction}
        currentUserId={currentUserId}
        messageId={message.id}
        className="mt-1"
      />

      {/* Quick reactions overlay */}
      {showQuickReactions && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-default)',
          background: 'var(--bg-secondary)',
          top: '-60px',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {quickReactions.map((emoji, index) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              style={{
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
                animation: `reactionPop 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              {emoji}
            </button>
          ))}
          
          {/* Close button */}
          <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}}></div>
          <button
            onClick={() => {
              setShowQuickReactions(false)
              setSwipeOffset(0)
            }}
            style={{
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  color: '#ffffff'
}}
          >
            <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        .message-content a {
          word-break: break-all;
        }
        
        .message-content p {
          margin: 0;
          display: inline;
        }
        
        .message-content strong {
          font-weight: 600;
        }
        
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes reactionPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(10px);
          }
          80% {
            transform: scale(1.1) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}



export default MessageBubble