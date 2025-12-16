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
 *
 * Master Prompt Standards Applied:
 * - All icons 24px in shrink-0 containers
 * - Channel header height: 72px desktop/tablet, 56px mobile
 * - Standard gaps: 16px inline elements, 8px small elements
 * - Consistent use of CSS variables
 * - Z-index scale for overlays (50, 60)
 *
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
  const { isMobile: isResponsiveMobile, isTablet, isDesktop } = useResponsive()

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
  const headerHeight = isDesktop || isTablet ? '72px' : '56px'

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
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}
        role="main"
        aria-label="Chat error"
      >
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--border-primary)',
            borderRadius: '12px',
            padding: '48px',
            maxWidth: '448px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}
          >
            {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
          </p>
          <button
            onClick={loadChatData}
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="hover:opacity-90"
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
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}
        role="main"
        aria-label="Chat loading"
        aria-live="polite"
        aria-busy="true"
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              border: '4px solid var(--border-primary)',
              borderTopColor: '#58a6ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
            role="status"
            aria-hidden="true"
          />
          <p style={{ color: 'var(--text-secondary)' }} aria-live="polite">
            Loading chat...
          </p>
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
        style={{
          height: '100vh',
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeChannel && currentChannel ? (
            <>
              {/* Channel Header */}
              <div
                style={{
                  height: headerHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  backdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.95)',
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--border-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  {isMobile && (
                    <button
                      onClick={() => setActiveChannel(null)}
                      style={{
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: 'var(--text-secondary)'
                      }}
                      className="hover:bg-white/5"
                      aria-label="Back to channels"
                    >
                      <svg
                        style={{ width: '24px', height: '24px', flexShrink: 0 }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <span
                      style={{
                        marginRight: '8px',
                        color: '#58a6ff',
                        fontSize: '20px'
                      }}
                      aria-hidden="true"
                    >
                      #
                    </span>
                    <h2
                      style={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {currentChannel?.name || 'Channel'}
                    </h2>
                  </div>
                  {currentChannel?.description && (
                    <div
                      style={{
                        display: isDesktop ? 'flex' : 'none',
                        alignItems: 'center',
                        marginLeft: '16px',
                        paddingLeft: '16px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        borderLeftWidth: '1px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: 'var(--border-primary)'
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {currentChannel?.description}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={handleSearchOpen}
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-secondary)'
                    }}
                    className="hover:bg-white/5"
                    aria-label="Search messages"
                    title="Search (Ctrl+K)"
                  >
                    <svg
                      style={{ width: '24px', height: '24px', flexShrink: 0 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNotificationOpen}
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-secondary)',
                      position: 'relative'
                    }}
                    className="hover:bg-white/5"
                    aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} unread)` : ''}`}
                    title="Notifications"
                  >
                    <svg
                      style={{ width: '24px', height: '24px', flexShrink: 0 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {(notifications?.length || 0) > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#ef4444',
                          borderRadius: '50%'
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <button
                    style={{
                      width: '48px',
                      height: '48px',
                      display: isDesktop ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-secondary)'
                    }}
                    className="hover:bg-white/5"
                    aria-label="Channel members"
                    title="Members"
                  >
                    <svg
                      style={{ width: '24px', height: '24px', flexShrink: 0 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  maxWidth: '448px',
                  padding: '0 24px'
                }}
                role="status"
                aria-live="polite"
              >
                <div style={{ marginBottom: '24px' }} aria-hidden="true">
                  <svg
                    style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto',
                      color: 'var(--text-secondary)',
                      opacity: 0.5
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                  }}
                >
                  Select a channel to start chatting
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    marginBottom: '24px'
                  }}
                >
                  Choose a channel from the sidebar to view messages and join the conversation.
                </p>
                {(servers?.length || 0) === 0 && (
                  <div
                    style={{
                      marginTop: '32px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--border-primary)',
                      borderRadius: '12px'
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
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
