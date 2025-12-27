/**
 * ChatPage - iOS Modern Aesthetic
 * Real-time chat interface with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

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
          background: '#FAFAFA',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        role="main"
        aria-label="Chat error"
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '448px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
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
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '8px'
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#666666',
              marginBottom: '24px'
            }}
          >
            {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
          </p>
          <button
            onClick={loadChatData}
            style={{
              height: '56px',
              padding: '0 24px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
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
          background: '#FAFAFA',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
              border: '4px solid #E0E0E0',
              borderTopColor: '#58a6ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
            role="status"
            aria-hidden="true"
          />
          <p style={{ color: '#666666' }} aria-live="polite">
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
          background: '#FAFAFA',
          color: '#1A1A1A',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
          style={{ display: isMobile && activeChannel ? 'none' : 'flex' }}
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
                  background: '#FFFFFF',
                  borderBottom: '1px solid #E0E0E0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: '#666666'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F5F5F5'
                        e.currentTarget.style.color = '#58a6ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#666666'
                      }}
                      aria-label="Back to channels"
                    >
                      <svg
                        style={{ width: '20px', height: '20px', flexShrink: 0 }}
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
                        color: '#1A1A1A',
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
                        color: '#1A1A1A',
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
                        color: '#666666',
                        borderLeft: '1px solid #E0E0E0'
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
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#666666'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                      e.currentTarget.style.color = '#58a6ff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    aria-label="Search messages"
                    title="Search (Ctrl+K)"
                  >
                    <svg
                      style={{ width: '20px', height: '20px', flexShrink: 0 }}
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
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#666666',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                      e.currentTarget.style.color = '#58a6ff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} unread)` : ''}`}
                    title="Notifications"
                  >
                    <svg
                      style={{ width: '20px', height: '20px', flexShrink: 0 }}
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
                          background: '#EF4444',
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
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#666666'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                      e.currentTarget.style.color = '#58a6ff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    aria-label="Channel members"
                    title="Members"
                  >
                    <svg
                      style={{ width: '20px', height: '20px', flexShrink: 0 }}
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
                style={{ flex: 1 }}
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
                background: '#FAFAFA'
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
                      color: '#CCCCCC',
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
                    fontWeight: 600,
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}
                >
                  Select a channel to start chatting
                </h2>
                <p
                  style={{
                    color: '#666666',
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
                      background: '#FFFFFF',
                      border: '1px solid #E0E0E0',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#666666'
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
            style={{ display: isDesktop ? 'block' : 'none' }}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default ChatPage
