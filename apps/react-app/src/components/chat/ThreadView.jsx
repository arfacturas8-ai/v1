import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageSquare, Users, Pin, MoreHorizontal, Reply, ChevronDown } from 'lucide-react'
import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'
import socketService from '../../services/socket'

/**
 * ThreadView - Discord-style message threading interface
 * Features: Threaded replies, thread participants, thread summaries, nested conversations
 */
function ThreadView({
  parentMessage,
  onClose,
  user,
  channelId,
  isMobile = false,
  className = ''
}) {
  // State
  const [threadMessages, setThreadMessages] = useState([])
  const [participants, setParticipants] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [threadNotifications, setThreadNotifications] = useState(true)
  
  // Refs
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  
  // Thread metadata
  const threadId = parentMessage?.threadId || parentMessage?.id
  const replyCount = threadMessages.length
  const lastReply = threadMessages[threadMessages.length - 1]
  const uniqueParticipants = new Set([parentMessage?.userId, ...threadMessages.map(m => m.userId)])

  // Load thread messages
  useEffect(() => {
    if (threadId) {
      loadThreadMessages()
      joinThread()
    }

    return () => {
      if (threadId) {
        leaveThread()
      }
    }
  }, [threadId])

  // Socket listeners for thread updates
  useEffect(() => {
    const handleThreadReply = (message) => {
      if (message.threadId === threadId) {
        setThreadMessages(prev => [...prev, message])
        updateParticipants(message.userId)
        scrollToBottom(true)
      }
    }

    const handleThreadTyping = (data) => {
      if (data.threadId === threadId && data.userId !== user?.id) {
        setTypingUsers(prev => new Set([...prev, data.userId]))
        
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }, 3000)
      }
    }

    const handleThreadStoppedTyping = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    }

    socketService.on('thread_reply', handleThreadReply)
    socketService.on('thread_typing', handleThreadTyping)
    socketService.on('thread_stopped_typing', handleThreadStoppedTyping)

    return () => {
      socketService.off('thread_reply', handleThreadReply)
      socketService.off('thread_typing', handleThreadTyping)
      socketService.off('thread_stopped_typing', handleThreadStoppedTyping)
    }
  }, [threadId, user?.id])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'end'
      })
    }
  }, [])

  // Load thread messages
  const loadThreadMessages = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      const response = await fetch(`/api/threads/${threadId}/messages`)
      const data = await response.json()
      
      setThreadMessages(data.messages || [])
      setHasMore(data.hasMore || false)
      
      // Load participants
      const participantsData = new Map()
      data.participants?.forEach(participant => {
        participantsData.set(participant.id, participant)
      })
      setParticipants(participantsData)
      
      setTimeout(() => scrollToBottom(false), 100)
    } catch (error) {
      console.error('Failed to load thread messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load more messages
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/threads/${threadId}/messages?before=${threadMessages[0]?.id}`)
      const data = await response.json()
      
      setThreadMessages(prev => [...(data.messages || []), ...prev])
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Join thread for real-time updates
  const joinThread = () => {
    socketService.send('join_thread', { threadId })
  }

  const leaveThread = () => {
    socketService.send('leave_thread', { threadId })
  }

  // Update participants
  const updateParticipants = (userId) => {
    if (!participants.has(userId)) {
      // Fetch user data and add to participants
      // This would be an API call in a real implementation
      setParticipants(prev => new Map(prev.set(userId, {
        id: userId,
        username: `User${userId}`,
        avatar: null
      })))
    }
  }

  // Send thread reply
  const sendReply = async (content, type = 'text', attachments = []) => {
    if (!content.trim() && attachments.length === 0) return

    try {
      const messageData = {
        content,
        type,
        attachments,
        threadId,
        parentMessageId: parentMessage.id
      }

      // Optimistic update
      const tempMessage = {
        id: `temp_${Date.now()}`,
        ...messageData,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date().toISOString(),
        pending: true
      }

      setThreadMessages(prev => [...prev, tempMessage])
      updateParticipants(user.id)
      scrollToBottom(true)

      // Send via socket
      socketService.send('send_thread_reply', messageData)
    } catch (error) {
      console.error('Failed to send thread reply:', error)
    }
  }

  // Handle typing
  const handleTyping = () => {
    socketService.send('thread_typing', { threadId })
  }

  const handleStopTyping = () => {
    socketService.send('thread_stopped_typing', { threadId })
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

  // Thread stats
  const threadStats = {
    replyCount,
    participantCount: uniqueParticipants.size,
    lastActivity: lastReply?.timestamp || parentMessage?.timestamp
  }

  if (loading) {
    return (
      <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
          <div style={{
  color: '#A0A0A0'
}}>Loading thread...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      {/* Thread Header */}
      <div className="flex-shrink-0 border-b border-white/10 dark:border-gray-700">
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
              <MessageSquare style={{
  width: '20px',
  height: '20px',
  color: '#A0A0A0'
}} />
              <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
                Thread
              </h3>
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                >
                  <ChevronDown style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              )}
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              {/* Thread notifications */}
              <button
                onClick={() => setThreadNotifications(!threadNotifications)}
                style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#A0A0A0'
}}
                title={threadNotifications ? 'Disable notifications' : 'Enable notifications'}
              >
                <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
              </button>
              
              {/* More options */}
              <button style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                <MoreHorizontal style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
              </button>
              
              {/* Close */}
              <button
                onClick={onClose}
                style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              >
                <X style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
              </button>
            </div>
          </div>

          {/* Thread Stats */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#A0A0A0'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Reply style={{
  width: '16px',
  height: '16px'
}} />
              <span>{threadStats.replyCount} replies</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Users style={{
  width: '16px',
  height: '16px'
}} />
              <span>{threadStats.participantCount} participants</span>
            </div>
            <div>
              Last activity {formatTimestamp(threadStats.lastActivity)}
            </div>
          </div>

          {/* Participants */}
          {!collapsed && threadStats.participantCount > 0 && (
            <div className="mt-3">
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span style={{
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                  Participants:
                </span>
                <div style={{
  display: 'flex'
}}>
                  {Array.from(uniqueParticipants).slice(0, 5).map(userId => {
                    const participant = participants.get(userId)
                    return (
                      <div
                        key={userId}
                        style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                        title={participant?.username || 'Unknown'}
                      >
                        {participant?.avatar ? (
                          <img 
                            src={participant.avatar} 
                            alt={participant.username}
                            style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                          />
                        ) : (
                          <span style={{
  fontWeight: '500'
}}>
                            {(participant?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {uniqueParticipants.size > 5 && (
                    <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                        +{uniqueParticipants.size - 5}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Original Message */}
      <div style={{
  background: 'rgba(22, 27, 34, 0.6)'
}}>
        <div style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              {parentMessage.avatar ? (
                <img 
                  src={parentMessage.avatar} 
                  alt={parentMessage.username}
                  style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                />
              ) : (
                <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {parentMessage.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            <div style={{
  flex: '1'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {parentMessage.username}
                </span>
                <span style={{
  color: '#A0A0A0'
}}>
                  {formatTimestamp(parentMessage.timestamp)}
                </span>
                <Pin style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} title="Original message" />
              </div>
              
              <div style={{
  color: '#A0A0A0'
}}>
                <MessageBubble
                  message={parentMessage}
                  isOwnMessage={parentMessage.userId === user?.id}
                  showActions={false}
                  style={{
  background: 'transparent'
}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div 
        ref={containerRef}
        style={{
  flex: '1',
  padding: '16px'
}}
        onScroll={(e) => {
          const { scrollTop } = e.target
          if (scrollTop === 0 && hasMore) {
            loadMoreMessages()
          }
        }}
      >
        {/* Load more indicator */}
        {loadingMore && (
          <div style={{
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
            <div style={{
  borderRadius: '50%',
  height: '16px',
  width: '16px'
}}></div>
          </div>
        )}
        
        {/* Thread messages */}
        {threadMessages.map((message, index) => {
          const prevMessage = threadMessages[index - 1]
          const showAvatar = !prevMessage || prevMessage.userId !== message.userId
          const isOwnMessage = message.userId === user?.id
          
          return (
            <div key={message.id} style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
              <div style={{
  width: '32px',
  height: '32px'
}}>
                {showAvatar ? (
                  <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                    {message.avatar ? (
                      <img 
                        src={message.avatar} 
                        alt={message.username}
                        style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                      />
                    ) : (
                      <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                        {message.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{
  width: '32px',
  height: '32px'
}} />
                )}
              </div>
              
              <div style={{
  flex: '1'
}}>
                {showAvatar && (
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                      {message.username}
                    </span>
                    <span style={{
  color: '#A0A0A0'
}}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.pending && (
                      <span style={{
  color: '#A0A0A0'
}}>Sending...</span>
                    )}
                  </div>
                )}
                
                <div style={{
  color: '#A0A0A0'
}}>
                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showActions={!message.pending}
                    compact={true}
                    style={{
  background: 'transparent'
}}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#A0A0A0'
}}>
            <div style={{
  display: 'flex'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%',
  animationDelay: '0ms'
}} />
              <div style={{
  width: '8px',
  height: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%',
  animationDelay: '150ms'
}} />
              <div style={{
  width: '8px',
  height: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%',
  animationDelay: '300ms'
}} />
            </div>
            <span>
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Thread Reply Composer */}
      <div className="flex-shrink-0">
        <MessageComposer
          onSendMessage={sendReply}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          placeholder={`Reply to thread...`}
          user={user}
          typingUsers={Array.from(typingUsers)}
          isMobile={isMobile}
          showFormatting={false}
          compact={true}
        />
      </div>
    </div>
  )
}



export default ThreadView