import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Hash, Volume2, Settings, Search, Phone, Video, Users, Pin, Bell } from 'lucide-react'
import MessageList from './MessageList'
import MessageComposer from './MessageComposer'
import ChannelSidebar from './ChannelSidebar'
import ThreadView from './ThreadView'
import MessageSearch from './MessageSearch'
import DirectMessagesPanel from './DirectMessagesPanel'
import UserPresenceSystem from './UserPresenceSystem'
import VoiceChannelInterface from './VoiceChannelInterface'
import NotificationCenter from './NotificationCenter'
import socketService from '../../services/socket'
import channelService from '../../services/channelService'
import { Card } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'

/**
 * ChatInterface - Professional real-time chat interface
 * Complete real-time messaging platform with channels, DMs, voice, threading, and search
 */
function ChatInterface({
  user,
  servers = [],
  channels = [],
  directMessages = [],
  onClose,
  isMobile = false,
  className = ''
}) {
  // Core state
  const [currentServer, setCurrentServer] = useState(servers[0]?.id || null)
  const [currentChannel, setCurrentChannel] = useState(channels[0]?.id || null)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [rightPanelContent, setRightPanelContent] = useState('members') // 'members', 'thread', 'search'
  const [selectedThread, setSelectedThread] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  // Message state
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [editingMessage, setEditingMessage] = useState(null)
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [pinnedMessages, setPinnedMessages] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  
  // Refs
  const chatContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messagesLoadedRef = useRef(false)

  // Initialize socket listeners
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect()
    }

    // Message events
    const handleMessageReceived = (message) => {
      setMessages(prev => [...prev, message])
      // Show notification if not in current channel
      if (message.channelId !== currentChannel) {
        addNotification({
          id: Date.now(),
          type: 'message',
          title: `#${getChannelName(message.channelId)}`,
          message: `${message.username}: ${message.content}`,
          timestamp: Date.now(),
          channelId: message.channelId
        })
      }
    }

    const handleMessageUpdated = (message) => {
      setMessages(prev => 
        prev.map(msg => msg.id === message.id ? { ...msg, ...message } : msg)
      )
    }

    const handleMessageDeleted = (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    }

    const handleUserTyping = (data) => {
      if (data.channelId === currentChannel && data.userId !== user?.id) {
        setTypingUsers(prev => new Set([...prev, data.userId]))
        
        // Clear typing after timeout
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }, 3000)
      }
    }

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    }

    const handleUserStatusChanged = (data) => {
      setOnlineUsers(prev => new Map(prev.set(data.userId, {
        status: data.status,
        lastSeen: data.lastSeen,
        activity: data.activity
      })))
    }

    // Register socket listeners
    socketService.on('message_received', handleMessageReceived)
    socketService.on('message_updated', handleMessageUpdated)
    socketService.on('message_deleted', handleMessageDeleted)
    socketService.on('user_typing', handleUserTyping)
    socketService.on('user_stopped_typing', handleUserStoppedTyping)
    socketService.on('user_status_changed', handleUserStatusChanged)

    return () => {
      // Cleanup socket listeners
      socketService.off('message_received', handleMessageReceived)
      socketService.off('message_updated', handleMessageUpdated)
      socketService.off('message_deleted', handleMessageDeleted)
      socketService.off('user_typing', handleUserTyping)
      socketService.off('user_stopped_typing', handleUserStoppedTyping)
      socketService.off('user_status_changed', handleUserStatusChanged)
    }
  }, [currentChannel, user?.id])

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannel && !messagesLoadedRef.current) {
      loadChannelMessages(currentChannel)
      messagesLoadedRef.current = true
    }
    
    return () => {
      messagesLoadedRef.current = false
    }
  }, [currentChannel])

  // Join/leave channels
  useEffect(() => {
    if (currentChannel) {
      socketService.joinChannel(currentChannel)
      return () => {
        if (currentChannel) {
          socketService.leaveChannel(currentChannel)
        }
      }
    }
  }, [currentChannel])

  // Helper functions
  const getChannelName = useCallback((channelId) => {
    const channel = channels.find(c => c.id === channelId)
    return channel?.name || 'Unknown'
  }, [channels])

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10))
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }, [])

  // Message operations
  const loadChannelMessages = async (channelId, options = {}) => {
    setLoadingMessages(true)
    try {
      const result = await channelService.getMessages(channelId, options)

      if (result.success && result.messages) {
        if (options.before) {
          setMessages(prev => [...result.messages, ...prev])
        } else {
          setMessages(result.messages)
        }

        setHasMoreMessages(result.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async (content, type = 'text', attachments = []) => {
    if (!currentChannel || !content.trim()) return

    try {
      const tempMessage = {
        id: `temp_${Date.now()}`,
        content,
        type,
        attachments,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date().toISOString(),
        channelId: currentChannel,
        replyTo: replyToMessage?.id,
        pending: true
      }

      // Optimistic update
      setMessages(prev => [...prev, tempMessage])
      setReplyToMessage(null)

      // Send via socket
      const result = socketService.sendMessage(currentChannel, content, attachments)
      
      if (result.tempId) {
        // Update temp message with actual ID when received
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessage.id 
                ? { ...msg, id: result.id || msg.id, pending: false }
                : msg
            )
          )
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    }
  }

  const editMessage = async (messageId, newContent) => {
    try {
      await socketService.editMessage(messageId, newContent)
      setEditingMessage(null)
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      await socketService.deleteMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const reactToMessage = async (messageId, emoji) => {
    try {
      await socketService.addReaction(messageId, emoji)
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const pinMessage = async (message) => {
    try {
      setPinnedMessages(prev => [...prev, message])
      addNotification({
        id: Date.now(),
        type: 'pin',
        title: 'Message Pinned',
        message: `${message.username}: ${message.content.slice(0, 50)}...`,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to pin message:', error)
    }
  }

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (currentChannel) {
      socketService.startTyping(currentChannel)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(currentChannel)
      }, 3000)
    }
  }, [currentChannel])

  const handleStopTyping = useCallback(() => {
    if (currentChannel) {
      socketService.stopTyping(currentChannel)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [currentChannel])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setRightPanelContent('search')
        setRightPanelOpen(true)
      }
      
      // Ctrl/Cmd + /: Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        // Show shortcuts modal
      }
      
      // Escape: Close panels/modals
      if (e.key === 'Escape') {
        setRightPanelOpen(false)
        setSelectedThread(null)
        setEditingMessage(null)
        setReplyToMessage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Current channel data
  const currentChannelData = channels.find(c => c.id === currentChannel)
  const isVoiceChannel = currentChannelData?.type === 'voice'
  const channelMembers = onlineUsers.size || 1

  return (
    <div style={{
  display: 'flex'
}}>
      {/* Channel Sidebar */}
      <div style={{
  overflow: 'hidden'
}}>
        <ChannelSidebar
          servers={servers}
          channels={channels}
          currentServer={currentServer}
          currentChannel={currentChannel}
          onServerChange={setCurrentServer}
          onChannelChange={setCurrentChannel}
          onVoiceChannelJoin={(channelId) => {
            setCurrentChannel(channelId)
            setShowVoiceInterface(true)
          }}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          directMessages={directMessages}
          onDirectMessageSelect={setCurrentConversation}
          user={user}
          onlineUsers={onlineUsers}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Main Chat Area */}
      <div style={{
  display: 'flex',
  flex: '1',
  flexDirection: 'column'
}}>
        {/* Channel Header - OpenSea Style */}
        <Card variant="flat" padding="sm" className="rounded-none border-x-0 border-t-0 shadow-sm">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              {sidebarCollapsed && (
                <IconButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Show sidebar"
                >
                  <Hash style={{
  width: '16px',
  height: '16px'
}} />
                </IconButton>
              )}

              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {isVoiceChannel ? (
                    <Volume2 style={{
  width: '20px',
  height: '20px'
}} />
                  ) : (
                    <Hash style={{
  width: '20px',
  height: '20px'
}} />
                  )}
                </div>
                <div>
                  <h2 style={{
  fontWeight: '600'
}}>
                    {currentChannelData?.name || 'General'}
                  </h2>
                  {currentChannelData?.description && (
                    <span style={{
  display: 'none'
}}>
                      {currentChannelData.description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              {/* Voice call controls */}
              {isVoiceChannel && (
                <>
                  <IconButton variant="ghost" size="icon-sm" aria-label="Start voice call">
                    <Phone style={{
  width: '16px',
  height: '16px'
}} />
                  </IconButton>
                  <IconButton variant="ghost" size="icon-sm" aria-label="Start video call">
                    <Video style={{
  width: '16px',
  height: '16px'
}} />
                  </IconButton>
                </>
              )}

              {/* Search */}
              <IconButton
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setRightPanelContent('search')
                  setRightPanelOpen(true)
                }}
                aria-label="Search messages"
              >
                <Search style={{
  width: '16px',
  height: '16px'
}} />
              </IconButton>

              {/* Members */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRightPanelContent('members')
                  setRightPanelOpen(!rightPanelOpen)
                }}
                leftIcon={<Users style={{
  width: '16px',
  height: '16px'
}} />}
                style={{
  display: 'none'
}}
              >
                {channelMembers}
              </Button>

              {/* Notifications */}
              <div style={{
  position: 'relative'
}}>
                <IconButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setRightPanelContent('notifications')
                    setRightPanelOpen(!rightPanelOpen)
                  }}
                  aria-label="Notifications"
                >
                  <Bell style={{
  width: '16px',
  height: '16px'
}} />
                </IconButton>
                {notifications.length > 0 && (
                  <span style={{
  position: 'absolute',
  color: '#ffffff',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* Settings */}
              <IconButton variant="ghost" size="icon-sm" aria-label="Settings">
                <Settings style={{
  width: '16px',
  height: '16px'
}} />
              </IconButton>

              {/* Close (mobile) */}
              {isMobile && onClose && (
                <IconButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close chat">
                  <X style={{
  width: '16px',
  height: '16px'
}} />
                </IconButton>
              )}
            </div>
          </div>
        </Card>

        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Pin style={{
  width: '16px',
  height: '16px'
}} />
              <span className="text-sm text-rgb(var(--color-warning-800)) dark:text-rgb(var(--color-warning-200))">
                {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Voice Channel Interface */}
        {showVoiceInterface && isVoiceChannel && (
          <VoiceChannelInterface
            channelId={currentChannel}
            channelName={currentChannelData?.name}
            participants={Array.from(onlineUsers.entries())}
            user={user}
            onLeave={() => setShowVoiceInterface(false)}
          />
        )}

        {/* Messages Area */}
        <div ref={chatContainerRef} style={{
  flex: '1',
  display: 'flex'
}}>
          {/* Message List */}
          <div style={{
  flex: '1',
  display: 'flex',
  flexDirection: 'column'
}}>
            <MessageList
              messages={messages}
              currentUserId={user?.id}
              onMessageEdit={setEditingMessage}
              onMessageDelete={deleteMessage}
              onMessageReply={setReplyToMessage}
              onMessageReact={reactToMessage}
              onMessagePin={pinMessage}
              onOpenThread={(message) => {
                setSelectedThread(message)
                setRightPanelContent('thread')
                setRightPanelOpen(true)
              }}
              isLoading={loadingMessages}
              hasMore={hasMoreMessages}
              onLoadMore={() => loadChannelMessages(currentChannel, { before: messages[0]?.id })}
              typingUsers={Array.from(typingUsers)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onSaveEdit={(messageId, content) => editMessage(messageId, content)}
              isMobile={isMobile}
            />

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={sendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              replyToMessage={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onSaveEdit={(content) => editMessage(editingMessage.id, content)}
              placeholder={`Message #${currentChannelData?.name || 'channel'}`}
              channelId={currentChannel}
              user={user}
              typingUsers={Array.from(typingUsers)}
              disabled={!currentChannel}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      {rightPanelOpen && (
        <div style={{
  width: '240px'
}}>
          {rightPanelContent === 'members' && (
            <UserPresenceSystem
              users={Array.from(onlineUsers.entries())}
              currentUserId={user?.id}
              onUserClick={(userId) => {
                // Start DM with user
                setCurrentConversation(userId)
                setCurrentChannel(null)
              }}
            />
          )}
          
          {rightPanelContent === 'thread' && selectedThread && (
            <ThreadView
              parentMessage={selectedThread}
              onClose={() => {
                setSelectedThread(null)
                setRightPanelOpen(false)
              }}
              user={user}
            />
          )}
          
          {rightPanelContent === 'search' && (
            <MessageSearch
              onSearch={(query) => setSearchQuery(query)}
              onResultSelect={(message) => {
                // Jump to message
                setRightPanelOpen(false)
              }}
              channelId={currentChannel}
            />
          )}
          
          {rightPanelContent === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              onNotificationClick={(notification) => {
                if (notification.channelId) {
                  setCurrentChannel(notification.channelId)
                }
                setRightPanelOpen(false)
              }}
              onClearAll={() => setNotifications([])}
            />
          )}
        </div>
      )}

      {/* Direct Messages Panel (overlay on mobile) */}
      {currentConversation && (
        <DirectMessagesPanel
          conversationId={currentConversation}
          user={user}
          onClose={() => setCurrentConversation(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}



export default ChatInterface