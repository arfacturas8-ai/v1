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
      <div className="flex items-center justify-center h-full bg-[#0d1117]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#8b949e]">Loading conversation...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#161b22]/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar/Group Icon */}
            <div className="relative">
              {conversation?.type === 'group' ? (
                <div className="w-10 h-10 rounded-full bg-[#161b22]/60 border border-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#161b22]/60 border border-white/10 flex items-center justify-center">
                  {participants[0]?.avatar ? (
                    <img
                      src={participants[0].avatar}
                      alt={participants[0].username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium text-white">
                      {getConversationTitle().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              {/* Status indicator for DMs */}
              {conversation?.type === 'direct' && participants[0] && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#161b22]" />
              )}
            </div>

            <div>
              <h2 className="font-semibold text-white">
                {getConversationTitle()}
              </h2>
              <p className="text-sm text-[#8b949e]">
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
                  className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
                  title="Start voice call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
                  title="Start video call"
                >
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Add participant (group chat) */}
            {conversation?.type === 'group' && (
              <button
                className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
                title="Add participant"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}

            {/* Search */}
            <button
              className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
              title="Search in conversation"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Info */}
            <button
              onClick={() => setShowConversationInfo(!showConversationInfo)}
              className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
              title="Conversation info"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* More options */}
            <button className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#161b22] transition-colors text-[#8b949e] hover:text-[#58a6ff]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Call status */}
        {inCall && (
          <div className="mt-3 p-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {callType === 'video' ? (
                  <Video className="w-5 h-5 text-[#58a6ff]" />
                ) : (
                  <Phone className="w-5 h-5 text-[#58a6ff]" />
                )}
                <span className="font-medium text-white">
                  {callType === 'video' ? 'Video call' : 'Voice call'} in progress
                </span>
              </div>
              <button
                onClick={endCall}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
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
          <div className="w-80 bg-[#161b22]/60 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Conversation Info
              </h3>
              
              {/* Participants */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#8b949e] mb-2">
                  Participants ({participants.length})
                </h4>
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0d1117] transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#0d1117] border border-white/10 flex items-center justify-center">
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-white text-sm">
                              {participant.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#161b22]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {participant.displayName}
                        </div>
                        <div className="text-xs text-[#8b949e] truncate">
                          @{participant.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Settings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#8b949e] mb-2">
                  Settings
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#0d1117] transition-colors cursor-pointer">
                    <span className="text-sm text-white">Notifications</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-[#0d1117] text-[#58a6ff] focus:ring-[#58a6ff]/50"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#0d1117] transition-colors cursor-pointer">
                    <span className="text-sm text-white">Pin conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.pinned}
                      onChange={(e) => updateSetting('pinned', e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-[#0d1117] text-[#58a6ff] focus:ring-[#58a6ff]/50"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#0d1117] transition-colors cursor-pointer">
                    <span className="text-sm text-white">Star conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.starred}
                      onChange={(e) => updateSetting('starred', e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-[#0d1117] text-[#58a6ff] focus:ring-[#58a6ff]/50"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#0d1117] transition-colors cursor-pointer">
                    <span className="text-sm text-white">Archive conversation</span>
                    <input
                      type="checkbox"
                      checked={conversationSettings.archived}
                      onChange={(e) => updateSetting('archived', e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-[#0d1117] text-[#58a6ff] focus:ring-[#58a6ff]/50"
                    />
                  </label>
                </div>
              </div>
              
              {/* Conversation details */}
              <div className="text-xs text-[#8b949e] space-y-1">
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