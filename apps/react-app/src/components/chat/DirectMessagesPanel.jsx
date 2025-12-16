import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  X, Phone, Video, UserPlus, Settings, Search, Pin, Info,
  Users, MessageCircle, Image, File, Mic, MoreHorizontal,
  Archive, Bell, BellOff, Star, Hash, Lock, Crown
} from 'lucide-react'
import MessageList from './MessageList'
import MessageComposer from './MessageComposer'
import UserPresenceSystem from './UserPresenceSystem'
import socketService from '../../services/socket'

/**
 * DirectMessagesPanel - Private conversations and group chats
 * Features: 1-on-1 DMs, group chats, file sharing, voice/video calls, conversation management
 */
function DirectMessagesPanel({
  conversationId,
  user,
  onClose,
  isMobile = false,
  className = ''
}) {
  // State
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  
  // UI state
  const [showParticipants, setShowParticipants] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [conversationSettings, setConversationSettings] = useState({
    notifications: true,
    archived: false,
    pinned: false,
    starred: false
  })
  
  // Call state
  const [inCall, setInCall] = useState(false)
  const [callType, setCallType] = useState(null) // 'voice' | 'video'
  const [callParticipants, setCallParticipants] = useState([])
  
  // Refs
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Load conversation data
  useEffect(() => {
    if (conversationId) {
      loadConversation()
      loadMessages()
      joinConversation()
    }

    return () => {
      if (conversationId) {
        leaveConversation()
      }
    }
  }, [conversationId])

  // Socket listeners
  useEffect(() => {
    const handleDirectMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message])
        scrollToBottom(true)
      }
    }

    const handleTypingStart = (data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => new Set([...prev, data.userId]))
        
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }, 3000)
      }
    }

    const handleTypingStop = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    }

    const handleConversationUpdated = (updatedConversation) => {
      if (updatedConversation.id === conversationId) {
        setConversation(updatedConversation)
      }
    }

    const handleCallStarted = (callData) => {
      if (callData.conversationId === conversationId) {
        setInCall(true)
        setCallType(callData.type)
        setCallParticipants(callData.participants)
      }
    }

    const handleCallEnded = (callData) => {
      if (callData.conversationId === conversationId) {
        setInCall(false)
        setCallType(null)
        setCallParticipants([])
      }
    }

    socketService.on('direct_message_received', handleDirectMessage)
    socketService.on('dm_typing_start', handleTypingStart)
    socketService.on('dm_typing_stop', handleTypingStop)
    socketService.on('conversation_updated', handleConversationUpdated)
    socketService.on('call_started', handleCallStarted)
    socketService.on('call_ended', handleCallEnded)

    return () => {
      socketService.off('direct_message_received', handleDirectMessage)
      socketService.off('dm_typing_start', handleTypingStart)
      socketService.off('dm_typing_stop', handleTypingStop)
      socketService.off('conversation_updated', handleConversationUpdated)
      socketService.off('call_started', handleCallStarted)
      socketService.off('call_ended', handleCallEnded)
    }
  }, [conversationId, user?.id])

  // Load conversation details
  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      
      setConversation(data.conversation)
      setParticipants(data.participants || [])
      setConversationSettings({
        notifications: data.conversation.notifications ?? true,
        archived: data.conversation.archived ?? false,
        pinned: data.conversation.pinned ?? false,
        starred: data.conversation.starred ?? false
      })
    } catch (error) {
      console.error('Failed to load conversation:', error)
      // Mock data for demo
      setConversation({
        id: conversationId,
        type: 'direct',
        name: 'Direct Message',
        participants: ['user1', 'user2'],
        lastActivity: new Date().toISOString(),
        created: new Date(Date.now() - 86400000).toISOString()
      })
      setParticipants([
        { id: 'user1', username: 'alice', displayName: 'Alice Cooper', avatar: null, status: 'online' },
        { id: 'user2', username: 'bob', displayName: 'Bob Wilson', avatar: null, status: 'away' }
      ])
    }
  }

  // Load messages
  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      const data = await response.json()
      
      setMessages(data.messages || [])
      setHasMore(data.hasMore || false)
      
      setTimeout(() => scrollToBottom(false), 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
      // Mock messages for demo
      setMessages([
        {
          id: '1',
          content: 'Hey! How are you doing?',
          userId: 'user1',
          username: 'alice',
          avatar: null,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text'
        },
        {
          id: '2',
          content: 'I\'m doing great! Working on some exciting new features.',
          userId: user?.id || 'user2',
          username: user?.username || 'bob',
          avatar: user?.avatar || null,
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          type: 'text'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Load more messages
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?before=${messages[0]?.id}`)
      const data = await response.json()
      
      setMessages(prev => [...(data.messages || []), ...prev])
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Join/leave conversation
  const joinConversation = () => {
    socketService.send('join_conversation', { conversationId })
  }

  const leaveConversation = () => {
    socketService.send('leave_conversation', { conversationId })
  }

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'end'
      })
    }
  }, [])

  // Send message
  const sendMessage = async (content, type = 'text', attachments = []) => {
    if (!content.trim() && attachments.length === 0) return

    try {
      const messageData = {
        content,
        type,
        attachments,
        conversationId
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

      setMessages(prev => [...prev, tempMessage])
      scrollToBottom(true)

      // Send via socket
      socketService.sendDirectMessage(conversationId, content, attachments)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle typing
  const handleTyping = () => {
    socketService.send('dm_typing_start', { conversationId })
  }

  const handleStopTyping = () => {
    socketService.send('dm_typing_stop', { conversationId })
  }

  // Start voice/video call
  const startCall = async (type) => {
    try {
      setCallType(type)
      setInCall(true)
      
      socketService.send('start_call', {
        conversationId,
        type,
        participants: conversation.participants
      })
    } catch (error) {
      console.error('Failed to start call:', error)
      setInCall(false)
      setCallType(null)
    }
  }

  const endCall = () => {
    setInCall(false)
    setCallType(null)
    setCallParticipants([])
    
    socketService.send('end_call', { conversationId })
  }

  // Add participant (group chat)
  const addParticipant = async (userId) => {
    try {
      await fetch(`/api/conversations/${conversationId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      // Reload conversation
      loadConversation()
    } catch (error) {
      console.error('Failed to add participant:', error)
    }
  }

  // Update conversation settings
  const updateSetting = async (key, value) => {
    try {
      await fetch(`/api/conversations/${conversationId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })
      
      setConversationSettings(prev => ({ ...prev, [key]: value }))
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  // Get conversation title
  const getConversationTitle = () => {
    if (!conversation) return ''
    
    if (conversation.type === 'group') {
      return conversation.name || `Group chat (${participants.length})`
    } else {
      const otherParticipant = participants.find(p => p.id !== user?.id)
      return otherParticipant?.displayName || otherParticipant?.username || 'Direct Message'
    }
  }

  // Get conversation subtitle
  const getConversationSubtitle = () => {
    if (!conversation) return ''
    
    if (conversation.type === 'group') {
      return `${participants.length} members`
    } else {
      const otherParticipant = participants.find(p => p.id !== user?.id)
      return otherParticipant?.status || 'Last seen recently'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div style={{ width: "64px", height: "64px", flexShrink: 0 }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading conversation...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-4 py-3  border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar/Group Icon */}
            <div className="relative">
              {conversation?.type === 'group' ? (
                <div style={{ width: "48px", height: "48px", flexShrink: 0 }} style={{ borderColor: 'var(--border-subtle)' }}>
                  <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} style={{ color: 'var(--text-primary)' }} />
                </div>
              ) : (
                <div style={{ width: "48px", height: "48px", flexShrink: 0 }} style={{ borderColor: 'var(--border-subtle)' }}>
                  {participants[0]?.avatar ? (
                    <img
                      src={participants[0].avatar}
                      alt={participants[0].username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {getConversationTitle().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              {/* Status indicator for DMs */}
              {conversation?.type === 'direct' && participants[0] && (
                <div style={{ width: "24px", height: "24px", flexShrink: 0 }} style={{ borderColor: 'var(--bg-secondary)' }} />
              )}
            </div>

            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {getConversationTitle()}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {getConversationSubtitle()}
              </p>
            </div>
          </div>


          <div className="flex items-center gap-1">
            {/* Call buttons */}
            {!inCall && (
              <>
                <button
                  onClick={() => startCall('voice')}
                  className="p-2 rounded-xl transition-colors hover:bg-white"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Start voice call"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Phone style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 rounded-xl transition-colors hover:bg-white"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Start video call"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Video style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </button>
              </>
            )}

            {/* Add participant (group chat) */}
            {conversation?.type === 'group' && (
              <button
                className="p-2 rounded-xl transition-colors hover:bg-white"
                style={{ color: 'var(--text-secondary)' }}
                title="Add participant"
                onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <UserPlus style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </button>
            )}

            {/* Search */}
            <button
              className="p-2 rounded-xl transition-colors hover:bg-white"
              style={{ color: 'var(--text-secondary)' }}
              title="Search in conversation"
              onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Search style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>

            {/* Info */}
            <button
              onClick={() => setShowConversationInfo(!showConversationInfo)}
              className="p-2 rounded-xl transition-colors hover:bg-white"
              style={{ color: 'var(--text-secondary)' }}
              title="Conversation info"
              onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Info style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>

            {/* More options */}
            <button
              className="p-2 rounded-xl transition-colors hover:bg-white"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <MoreHorizontal style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:bg-white"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </div>
        </div>
        
        {/* Call status */}
        {inCall && (
          <div className="mt-3 p-3 bg-white  border rounded-xl" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {callType === 'video' ? (
                  <Video style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                ) : (
                  <Phone style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                )}
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {callType === 'video' ? 'Video call' : 'Voice call'} in progress
                </span>
              </div>
              <button
                onClick={endCall}
                style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-red-600 hover:bg-red-700  rounded-xl transition-colors"
              >
                End call
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            onLoadMore={loadMoreMessages}
            hasMore={hasMore}
            isLoading={loadingMore}
            typingUsers={Array.from(typingUsers)}
            isMobile={isMobile}
            compact={true}
          />
          
          <MessageComposer
            onSendMessage={sendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            placeholder={`Message ${getConversationTitle()}...`}
            user={user}
            typingUsers={Array.from(typingUsers)}
            isMobile={isMobile}
          />
        </div>
        
        {/* Conversation Info Sidebar */}
        {showConversationInfo && (
          <div className="w-80 bg-white  border-l overflow-y-auto" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Conversation Info
              </h3>

              {/* Participants */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Participants ({participants.length})
                </h4>
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-xl transition-colors" style={{ ':hover': { background: 'var(--bg-primary)' } }}>
                      <div className="relative">
                        <div style={{ width: "48px", height: "48px", flexShrink: 0 }} style={{ borderColor: 'var(--border-subtle)' }}>
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {participant.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2" style={{ borderColor: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {participant.displayName}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          @{participant.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Settings
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer hover:bg-[#F8F9FA]">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
                      style={{ width: "24px", height: "24px", flexShrink: 0 }}
                      style={{ borderColor: 'var(--border-subtle)', background: 'white' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer hover:bg-[#F8F9FA]">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Pin conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.pinned}
                      onChange={(e) => updateSetting('pinned', e.target.checked)}
                      style={{ width: "24px", height: "24px", flexShrink: 0 }}
                      style={{ borderColor: 'var(--border-subtle)', background: 'white' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer hover:bg-[#F8F9FA]">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Star conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.starred}
                      onChange={(e) => updateSetting('starred', e.target.checked)}
                      style={{ width: "24px", height: "24px", flexShrink: 0 }}
                      style={{ borderColor: 'var(--border-subtle)', background: 'white' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer hover:bg-[#F8F9FA]">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Archive conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.archived}
                      onChange={(e) => updateSetting('archived', e.target.checked)}
                      style={{ width: "24px", height: "24px", flexShrink: 0 }}
                      style={{ borderColor: 'var(--border-subtle)', background: 'white' }}
                    />
                  </label>
                </div>
              </div>

              {/* Conversation details */}
              <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  Created {formatTimestamp(conversation?.created)}
                </div>
                <div>
                  Last activity {formatTimestamp(conversation?.lastActivity)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



export default DirectMessagesPanel