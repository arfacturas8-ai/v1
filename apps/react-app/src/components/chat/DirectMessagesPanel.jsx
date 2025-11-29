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
    if (!conversation) return 'Loading...'
    
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
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%'
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
  color: '#c9d1d9'
}}>Loading conversation...</div>
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
            {/* Avatar/Group Icon */}
            <div style={{
  position: 'relative'
}}>
              {conversation?.type === 'group' ? (
                <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Users style={{
  width: '20px',
  height: '20px',
  color: '#ffffff'
}} />
                </div>
              ) : (
                <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {participants[0]?.avatar ? (
                    <img 
                      src={participants[0].avatar} 
                      alt={participants[0].username}
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
                      {getConversationTitle().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              
              {/* Status indicator for DMs */}
              {conversation?.type === 'direct' && participants[0] && (
                <div style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)'
}} />
              )}
            </div>
            
            <div>
              <h2 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
                {getConversationTitle()}
              </h2>
              <p style={{
  color: '#c9d1d9'
}}>
                {getConversationSubtitle()}
              </p>
            </div>
          </div>
          
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            {/* Call buttons */}
            {!inCall && (
              <>
                <button
                  onClick={() => startCall('voice')}
                  style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                  title="Start voice call"
                >
                  <Phone style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button
                  onClick={() => startCall('video')}
                  style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                  title="Start video call"
                >
                  <Video style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </>
            )}
            
            {/* Add participant (group chat) */}
            {conversation?.type === 'group' && (
              <button
                style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="Add participant"
              >
                <UserPlus style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            )}
            
            {/* Search */}
            <button
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              title="Search in conversation"
            >
              <Search style={{
  width: '16px',
  height: '16px'
}} />
            </button>
            
            {/* Info */}
            <button
              onClick={() => setShowConversationInfo(!showConversationInfo)}
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              title="Conversation info"
            >
              <Info style={{
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
  height: '16px'
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
  height: '16px'
}} />
            </button>
          </div>
        </div>
        
        {/* Call status */}
        {inCall && (
          <div style={{
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
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
                {callType === 'video' ? (
                  <Video style={{
  width: '16px',
  height: '16px'
}} />
                ) : (
                  <Phone style={{
  width: '16px',
  height: '16px'
}} />
                )}
                <span style={{
  fontWeight: '500'
}}>
                  {callType === 'video' ? 'Video call' : 'Voice call'} in progress
                </span>
              </div>
              <button
                onClick={endCall}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
              >
                End call
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
  flex: '1',
  display: 'flex'
}}>
        <div style={{
  flex: '1',
  display: 'flex',
  flexDirection: 'column'
}}>
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
          <div style={{
  width: '320px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
            <div style={{
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
                Conversation Info
              </h3>
              
              {/* Participants */}
              <div className="mb-6">
                <h4 style={{
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                  Participants ({participants.length})
                </h4>
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div key={participant.id} style={{
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                      <div style={{
  position: 'relative'
}}>
                        <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                          {participant.avatar ? (
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
  fontWeight: '500',
  color: '#ffffff'
}}>
                              {participant.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{
  position: 'absolute',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(22, 27, 34, 0.6)'
}} />
                      </div>
                      <div style={{
  flex: '1'
}}>
                        <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                          {participant.displayName}
                        </div>
                        <div style={{
  color: '#c9d1d9'
}}>
                          @{participant.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Settings */}
              <div className="mb-6">
                <h4 style={{
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                  Settings
                </h4>
                <div className="space-y-3">
                  <label style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <span className="text-sm">Notifications</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
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
                    <span className="text-sm">Pin conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.pinned}
                      onChange={(e) => updateSetting('pinned', e.target.checked)}
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
                    <span className="text-sm">Star conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.starred}
                      onChange={(e) => updateSetting('starred', e.target.checked)}
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
                    <span className="text-sm">Archive conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.archived}
                      onChange={(e) => updateSetting('archived', e.target.checked)}
                      style={{
  borderRadius: '4px'
}}
                    />
                  </label>
                </div>
              </div>
              
              {/* Conversation details */}
              <div style={{
  color: '#c9d1d9'
}}>
                <div className="mb-1">
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