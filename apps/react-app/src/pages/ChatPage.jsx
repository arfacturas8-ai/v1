import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import ChatInterface from '../components/chat/ChatInterface'
import ChannelSidebar from '../components/chat/ChannelSidebar'
import MessageComposer from '../components/chat/MessageComposer'
import ThreadView from '../components/chat/ThreadView'
import MessageSearch from '../components/chat/MessageSearch'
import DirectMessagesPanel from '../components/chat/DirectMessagesPanel'
import UserPresenceSystem from '../components/chat/UserPresenceSystem'
import VoiceChannelInterface from '../components/chat/VoiceChannelInterface'
import NotificationCenter from '../components/chat/NotificationCenter'
import KeyboardShortcuts from '../components/chat/KeyboardShortcuts'
import { useIsMobile } from '../components/chat/MobileOptimizations'
import { useResponsive } from '../hooks/useResponsive'
import socketService from '../services/socket'
import apiService from '../services/api'
import channelService from '../services/channelService'
import { useAuth } from '../contexts/AuthContext'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement
} from '../utils/accessibility.jsx'

/**
 * ChatPage - Complete professional real-time chat interface
 * Integrates all 12 major components for a premium chat experience:
 * - ChatInterface: Main layout and orchestration
 * - ChannelSidebar: Server/channel navigation
 * - MessageComposer: Rich text input with formatting
 * - ThreadView: Message threading system
 * - MessageSearch: Advanced search functionality
 * - DirectMessagesPanel: Private conversations
 * - UserPresenceSystem: Online status and member list
 * - VoiceChannelInterface: WebRTC voice/video calling
 * - NotificationCenter: Real-time notifications
 * - KeyboardShortcuts: Accessibility and shortcuts
 * - MobileOptimizations: Touch gestures and responsive design
 */

function ChatPage({ user, onNavigate }) {
  const { user: currentUser } = useAuth()
  const { isMobile: isResponsiveMobile, isTablet } = useResponsive()

  // Core state
  const [activeServer, setActiveServer] = useState(null)
  const [activeChannel, setActiveChannel] = useState(null)
  const [activeThread, setActiveThread] = useState(null)
  const [showDirectMessages, setShowDirectMessages] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)

  // Data state
  const [servers, setServers] = useState([])
  const [users, setUsers] = useState({})
  const [directMessages, setDirectMessages] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI state
  const isMobile = useIsMobile()

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, 'Loading chat')
  useErrorAnnouncement(error)

  // Load servers and channels - extracted as callback for retry functionality
  const loadChatData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [serversRes, dmsRes] = await Promise.all([
        apiService.get('/chat/servers').catch(() => ({ success: false, data: [] })),
        apiService.get('/messages/conversations').catch(() => ({ success: false, data: [] }))
      ])

      if (serversRes.success && serversRes.data) {
        const serversList = serversRes.data.servers || serversRes.data || []
        setServers(serversList)

        if (serversList.length > 0 && !activeServer) {
          setActiveServer(serversList[0].id)
          if (serversList[0].channels?.length > 0) {
            setActiveChannel(serversList[0].channels[0].id)
          }
        }
      }

      if (dmsRes.success && dmsRes.data) {
        setDirectMessages(dmsRes.data.conversations || dmsRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load chat data:', err)
      setError('Failed to load chat data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeServer])

  // Initial data load
  useEffect(() => {
    loadChatData()
  }, [])

  // Load messages for active channel
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeServer || !activeChannel) return

      try {
        const response = await channelService.getMessages(activeChannel, { limit: 50 })

        if (response.success && response.messages) {
          setMessages(response.messages)
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
        setMessages([])
      }
    }

    loadMessages()
  }, [activeServer, activeChannel])
  
  // Memoize current server and channel data
  const currentServer = useMemo(() =>
    servers?.find(s => s?.id === activeServer) || servers?.[0],
    [servers, activeServer]
  )

  const currentChannel = useMemo(() =>
    currentServer?.channels?.find(c => c?.id === activeChannel) || currentServer?.channels?.[0],
    [currentServer, activeChannel]
  )

  // Memoize filtered users for presence system
  const onlineUsers = useMemo(() =>
    Object.values(users).filter(u => u.status === 'online'),
    [users]
  )

  const allUsers = useMemo(() =>
    Object.values(users),
    [users]
  )

  // Event handlers
  const handleServerChange = useCallback((serverId) => {
    setActiveServer(serverId)
    const server = servers?.find(s => s?.id === serverId)
    if (server?.channels?.length > 0) {
      setActiveChannel(server?.channels?.[0]?.id)
    }
  }, [servers])
  
  const handleChannelChange = useCallback((channelId) => {
    setActiveChannel(channelId)
    setActiveThread(null) // Close any open thread
  }, [])
  
  const handleMessageSend = useCallback((message) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: message.content,
      author: currentUser,
      timestamp: Date.now(),
      reactions: {},
      type: 'message',
      attachments: message.attachments || []
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Emit via socket
    socketService.emit('message_send', {
      channelId: activeChannel,
      message: newMessage
    })
  }, [activeChannel, currentUser])
  
  const handleThreadOpen = useCallback((messageId) => {
    setActiveThread(messageId)
  }, [])
  
  const handleDirectMessageOpen = useCallback(() => {
    setShowDirectMessages(true)
  }, [])
  
  const handleNotificationOpen = useCallback(() => {
    setShowNotifications(true)
  }, [])
  
  const handleSearchOpen = useCallback(() => {
    setShowSearch(true)
  }, [])
  
  const handleVoiceJoin = useCallback((channelId) => {
    setShowVoiceInterface(true)
    // Voice channel logic would go here
  }, [])

  // Socket.io integration
  useEffect(() => {
    // Set up real-time event listeners
    socketService.on('message_received', (data) => {
      if (data.channelId === activeChannel) {
        setMessages(prev => [...prev, data.message])
        
        // Add notification
        setNotifications(prev => [...(prev || []), {
          id: Date.now().toString(),
          type: 'message',
          title: `New message from ${data?.message?.author?.displayName || 'Unknown'}`,
          content: data?.message?.content || '',
          timestamp: Date.now(),
          channelId: data?.channelId
        }])
      }
    })
    
    socketService.on('user_joined', (data) => {
      setNotifications(prev => [...(prev || []), {
        id: Date.now().toString(),
        type: 'system',
        title: 'User joined',
        content: `${data?.user?.displayName || 'Someone'} joined the server`,
        timestamp: Date.now()
      }])
    })
    
    return () => {
      socketService.off('message_received')
      socketService.off('user_joined')
    }
  }, [activeChannel])

  // Main render
  // Show error state if data loading failed
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Chat error">
        <div className="card-elevated text-center max-w-md p-8" role="alert" aria-live="assertive">
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          <button
            onClick={loadChatData}
            className="btn-primary"
            aria-label="Try loading chat again"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show loading indicator during initial data load
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Chat loading" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" role="status" aria-hidden="true"></div>
          <p style={{ color: 'var(--text-secondary)' }} aria-live="polite">Loading chat...</p>
        </div>
      </div>
    )
  }


  return (
    <>
      <SkipToContent targetId="chat-main-content" />
      <KeyboardShortcuts
        onSearch={handleSearchOpen}
        onNotifications={handleNotificationOpen}
        onDirectMessages={handleDirectMessageOpen}
      />

      <div
        className="h-screen flex overflow-hidden"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        role="main"
        aria-label="Chat application"
      >
        {/* Left Sidebar - Servers & Channels */}
        <ChannelSidebar
          servers={servers}
          activeServer={activeServer}
          activeChannel={activeChannel}
          onServerChange={handleServerChange}
          onChannelChange={handleChannelChange}
          onDirectMessageOpen={handleDirectMessageOpen}
          onVoiceJoin={handleVoiceJoin}
          className={isMobile && activeChannel ? 'hidden' : ''}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChannel && currentChannel ? (
            <>
              {/* Channel Header */}
              <div className="h-14 flex items-center justify-between px-4 glass-strong" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center min-w-0 flex-1">
                  {isMobile && (
                    <button
                      onClick={() => setActiveChannel(null)}
                      className="btn-ghost mr-3"
                      aria-label="Back to channels"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-center min-w-0">
                    <span className="mr-2" style={{ color: 'var(--brand-primary)' }} aria-hidden="true">#</span>
                    <h2 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{currentChannel?.name || 'Channel'}</h2>
                  </div>
                  {currentChannel?.description && (
                    <div className="hidden md:flex items-center ml-4 text-sm pl-4" style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
                      <span className="truncate">{currentChannel?.description}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={handleSearchOpen}
                    className="btn-ghost"
                    aria-label="Search messages"
                    title="Search (Ctrl+K)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNotificationOpen}
                    className="btn-ghost relative"
                    aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} unread)` : ''}`}
                    title="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {(notifications?.length || 0) > 0 && (
                      <span className="badge-count" style={{ position: 'absolute', top: '4px', right: '4px' }} aria-hidden="true"></span>
                    )}
                  </button>
                  <button
                    className="btn-ghost hidden md:block"
                    aria-label="Channel members"
                    title="Members"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <ChatInterface
                id="chat-main-content"
                messages={messages}
                currentUser={currentUser}
                onThreadOpen={handleThreadOpen}
                activeThread={activeThread}
                channelId={activeChannel}
                channelName={currentChannel?.name || ''}
                className="flex-1"
              />

              {/* Message Composer */}
              <MessageComposer
                onSend={handleMessageSend}
                channelName={currentChannel?.name || ''}
                disabled={!activeChannel}
                placeholder={`Message #${currentChannel?.name || 'channel'}`}
              />
            </>
          ) : (
            /* Empty State - No Channel Selected */
            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-center max-w-md px-6" role="status" aria-live="polite">
                <div className="mb-6" aria-hidden="true">
                  <svg className="w-24 h-24 mx-auto" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Select a channel to start chatting
                </h2>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Choose a channel from the sidebar to view messages and join the conversation.
                </p>
                {(servers?.length || 0) === 0 && (
                  <div className="card mt-8">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      No servers available. Create or join a server to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - User Presence (Desktop only) */}
        {!isMobile && activeChannel && (
          <UserPresenceSystem
            users={allUsers}
            onlineUsers={onlineUsers}
            channelId={activeChannel}
            className="hidden lg:block"
          />
        )}
      </div>

      {/* Overlay Panels */}
      {activeThread && (
        <ThreadView
          messageId={activeThread}
          messages={messages}
          onClose={() => setActiveThread(null)}
          onSend={handleMessageSend}
          currentUser={currentUser}
        />
      )}

      {showDirectMessages && (
        <DirectMessagesPanel
          conversations={directMessages}
          currentUser={currentUser}
          onClose={() => setShowDirectMessages(false)}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onClear={() => setNotifications([])}
        />
      )}

      {showSearch && (
        <MessageSearch
          serverId={activeServer}
          onClose={() => setShowSearch(false)}
          onResultClick={(channelId, messageId) => {
            setActiveChannel(channelId)
            setShowSearch(false)
          }}
        />
      )}

      {showVoiceInterface && (
        <VoiceChannelInterface
          channelId={activeChannel}
          onClose={() => setShowVoiceInterface(false)}
        />
      )}
    </>
  )
}

export default ChatPage

