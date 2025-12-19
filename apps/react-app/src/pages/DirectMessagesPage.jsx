/**
 * DirectMessagesPage - iOS Modern Aesthetic
 * Modernized messaging interface with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import socketService from '../services/socket'
import apiService from '../services/api'
import {
  Send,
  Paperclip,
  Smile,
  Search,
  MoreVertical,
  Phone,
  Video,
  Plus,
  ArrowLeft,
  Circle,
  Image as ImageIcon,
  File,
  Loader,
  AlertCircle,
  MessageSquare,
  X,
  Check,
  CheckCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  useLoadingAnnouncement,
  useErrorAnnouncement,
  useFocusTrap
} from '../utils/accessibility.jsx'
import { SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader'
import { EmptyMessages } from '../components/ui/EmptyState'
import usePullToRefresh from '../hooks/usePullToRefresh.jsx'
import { useResponsive } from '../hooks/useResponsive'

// Memoized conversation item component
const ConversationItem = memo(({ conversation, isActive, onClick, navigate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'away': return '#F59E0B'
      case 'busy': return '#EF4444'
      default: return '#666666'
    }
  }

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${conversation.user.username || conversation.user.id}`);
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Conversation with ${conversation.user.displayName}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '6px',
        background: isActive ? '#FFFFFF' : 'transparent',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#FFFFFF'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div
        onClick={handleAvatarClick}
        style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') handleAvatarClick(e);
        }}
        aria-label={`View ${conversation.user.displayName}'s profile`}
      >
        <img
          src={conversation.user.avatar || '/default-avatar.png'}
          alt={`${conversation.user.displayName}'s avatar`}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(conversation.user.status),
            border: '3px solid #FAFAFA'
          }}
          aria-label={`Status: ${conversation.user.status || 'offline'}`}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conversation.user.displayName}
          </span>
          {conversation.lastMessage && (
            <span style={{ fontSize: '12px', color: '#666666', flexShrink: 0, marginLeft: '8px' }}>
              {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
            </span>
          )}
        </div>

        {conversation.lastMessage && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontSize: '13px',
              color: '#666666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {conversation.lastMessage.type === 'image' ? (
                <><ImageIcon size={20} /> Image</>
              ) : conversation.lastMessage.type === 'video' ? (
                <><Video size={20} /> Video</>
              ) : conversation.lastMessage.type === 'file' ? (
                <><File size={20} /> File</>
              ) : (
                conversation.lastMessage.content
              )}
            </span>
          </div>
        )}
      </div>

      {conversation.unreadCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '12px',
            minWidth: '20px',
            textAlign: 'center',
            flexShrink: 0
          }}
          aria-label={`${conversation.unreadCount} unread messages`}
        >
          {conversation.unreadCount}
        </div>
      )}
    </div>
  )
})

ConversationItem.displayName = 'ConversationItem'
ConversationItem.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      displayName: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      status: PropTypes.string,
      username: PropTypes.string,
      id: PropTypes.string
    }).isRequired,
    lastMessage: PropTypes.shape({
      content: PropTypes.string,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string
    }),
    unreadCount: PropTypes.number
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired
}

// Memoized message component
const Message = memo(({ message, isOwn, user }) => {
  const getMessageStatus = () => {
    if (message.read) return <CheckCheck size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
    if (message.delivered) return <CheckCheck size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
    if (message.sent) return <Check size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
    return <Loader size={20} style={{ color: 'rgba(255,255,255,0.5)', animation: 'spin 1s linear infinite' }} />
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      maxWidth: '70%',
      marginLeft: isOwn ? 'auto' : '0',
      flexDirection: isOwn ? 'row-reverse' : 'row'
    }}>
      {!isOwn && (
        <img
          src={user?.avatar || '/default-avatar.png'}
          alt={`${user?.displayName}'s avatar`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!isOwn && (
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#666666', padding: '0 12px' }}>
            {user?.displayName}
          </div>
        )}

        <div style={{
          background: isOwn ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '20px',
          borderTopLeftRadius: isOwn ? '20px' : '4px',
          borderTopRightRadius: isOwn ? '4px' : '20px',
          color: isOwn ? '#FFFFFF' : '#000000',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {message.type === 'text' && (
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', wordWrap: 'break-word' }}>
              {message.content}
            </p>
          )}

          {message.type === 'image' && (
            <div style={{ maxWidth: '100%', borderRadius: '14px', overflow: 'hidden' }}>
              <img src={message.content} alt="Shared image" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          {message.type === 'video' && (
            <div style={{ maxWidth: '100%', borderRadius: '14px', overflow: 'hidden' }}>
              <video src={message.content} controls style={{ maxWidth: '100%', borderRadius: '14px' }} />
            </div>
          )}

          {message.type === 'file' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              minWidth: '200px'
            }}>
              <File size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{message.fileName}</div>
                <div style={{ fontSize: '12px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#666666' }}>{message.fileSize}</div>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            justifyContent: 'flex-end'
          }}>
            <span style={{ fontSize: '11px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#666666' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && getMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  )
})

Message.displayName = 'Message'
Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.string,
    read: PropTypes.bool,
    delivered: PropTypes.bool,
    sent: PropTypes.bool
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    displayName: PropTypes.string,
    avatar: PropTypes.string
  })
}

// New conversation modal
const NewConversationModal = memo(({ isOpen, onClose, onCreateConversation }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const modalRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (isOpen) {
      const searchUsers = async () => {
        setLoading(true)
        try {
          const response = await apiService.get(`/users/search?q=${searchTerm}`)
          if (response.success) {
            setUsers(response.data.users || [])
          } else {
            setUsers([])
          }
        } catch (err) {
          console.error('Failed to search users:', err)
          setUsers([])
        } finally {
          setLoading(false)
        }
      }

      if (searchTerm.length >= 2) {
        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
      } else {
        setUsers([])
      }
    }
  }, [searchTerm, isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 id="new-conversation-title" style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#000000' }}>
            New Conversation
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666666',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#666666'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666666', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              aria-label="Search users"
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px 0 48px',
                background: '#FAFAFA',
                border: '1px solid #E0E0E0',
                borderRadius: '16px',
                color: '#000000',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E0E0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '48px 24px', color: '#666666' }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0 }}>Searching...</p>
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div
                  key={user.id}
                  onClick={() => onCreateConversation(user)}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FAFAFA'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <img src={user.avatar || '/default-avatar.png'} alt={user.displayName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#000000', marginBottom: '2px' }}>{user.displayName}</div>
                    <div style={{ fontSize: '13px', color: '#666666' }}>@{user.username}</div>
                  </div>
                </div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#666666' }}>
                <p style={{ margin: 0 }}>No users found</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#666666' }}>
                <p style={{ margin: 0 }}>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

NewConversationModal.displayName = 'NewConversationModal'
NewConversationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateConversation: PropTypes.func.isRequired
}

function DirectMessagesPage() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { user: currentUser, isAuthenticated } = useAuth()
  const { isMobile, isTablet } = useResponsive()

  // State
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(conversationId)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [filePreview, setFilePreview] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Memoize active conversation data
  const currentConversation = useMemo(() =>
    conversations.find(c => c.id === activeConversation),
    [conversations, activeConversation]
  )

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, 'Loading direct messages')
  useErrorAnnouncement(error)

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await apiService.get('/messages/conversations')

        if (response.success && response.data) {
          setConversations(response.data.conversations || [])

          // Set first conversation as active if no conversationId in URL
          if (!conversationId && response.data.conversations?.length > 0) {
            setActiveConversation(response.data.conversations[0].id)
          }
        } else {
          setConversations([])
        }
      } catch (err) {
        console.error('Failed to load conversations:', err)
        setError('Failed to load conversations. Please try again later.')
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [isAuthenticated, conversationId])

  // Fetch messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !isAuthenticated) {
        setMessages([])
        return
      }

      setMessagesLoading(true)

      try {
        const response = await apiService.get(`/messages/conversations/${activeConversation}/messages`)

        if (response.success && response.data) {
          setMessages(response.data.messages || [])
        } else {
          setMessages([])
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
        setMessages([])
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchMessages()
  }, [activeConversation, isAuthenticated])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket events
  useEffect(() => {
    const handleDmReceived = (data) => {
      if (data.conversationId === activeConversation) {
        setMessages(prev => [...prev, data.message])
      }
      // Update conversation list
      setConversations(prev => prev.map(c =>
        c.id === data.conversationId
          ? { ...c, lastMessage: data.message, unreadCount: c.id === activeConversation ? 0 : (c.unreadCount || 0) + 1 }
          : c
      ))
    }

    const handleUserTyping = (data) => {
      if (data.conversationId === activeConversation) {
        setIsTyping(data.isTyping)
      }
    }

    const handleMessageRead = (data) => {
      if (data.conversationId === activeConversation) {
        setMessages(prev => prev.map(msg =>
          data.messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        ))
      }
    }

    socketService.on('dm_received', handleDmReceived)
    socketService.on('user_typing', handleUserTyping)
    socketService.on('message_read', handleMessageRead)

    return () => {
      socketService.off('dm_received', handleDmReceived)
      socketService.off('user_typing', handleUserTyping)
      socketService.off('message_read', handleMessageRead)
    }
  }, [activeConversation])

  // Event handlers
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeConversation) return

    const tempId = `msg-${Date.now()}`
    const newMessage = {
      id: tempId,
      content: messageInput,
      senderId: currentUser?.id || 'current-user',
      timestamp: Date.now(),
      type: 'text',
      sent: true,
      delivered: false,
      read: false
    }

    // Optimistic update
    setMessages(prev => [...prev, newMessage])
    setMessageInput('')

    try {
      const response = await apiService.post(`/messages/conversations/${activeConversation}/messages`, {
        content: messageInput,
        type: 'text'
      })

      if (response.success && response.data) {
        // Replace temp message with real one from server
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...response.data.message, sent: true, delivered: true } : msg
        ))

        // Emit via socket for real-time
        socketService.emit('dm_send', {
          conversationId: activeConversation,
          message: response.data.message
        })

        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.id === activeConversation
            ? { ...c, lastMessage: response.data.message }
            : c
        ))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessageInput(messageInput) // Restore input
    }
  }, [messageInput, activeConversation, currentUser])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value)

    // Emit typing indicator
    if (activeConversation && e.target.value.trim()) {
      socketService.emit('user_typing', {
        conversationId: activeConversation,
        isTyping: true
      })

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emit('user_typing', {
          conversationId: activeConversation,
          isTyping: false
        })
      }, 2000)
    }
  }, [activeConversation])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleConversationSelect = useCallback((convId) => {
    setActiveConversation(convId)
    setShowMobileList(false)

    // Mark as read
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, unreadCount: 0 } : c
    ))

    // Emit read receipt
    socketService.emit('messages_read', {
      conversationId: convId
    })
  }, [])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      let fileType = 'file'
      if (file.type.startsWith('image/')) {
        fileType = 'image'
      } else if (file.type.startsWith('video/')) {
        fileType = 'video'
      }

      setFilePreview({
        file,
        preview: event.target.result,
        type: fileType
      })
    }
    reader.onerror = (error) => {
      console.error('Failed to read file:', error)
      setError('Failed to read file. Please try again.')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileCancel = useCallback(() => {
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileSend = useCallback(async () => {
    if (!filePreview || !activeConversation) return

    // In a real app, upload to server first
    const tempId = `msg-${Date.now()}`
    const newMessage = {
      id: tempId,
      content: filePreview.preview,
      senderId: currentUser?.id || 'current-user',
      timestamp: Date.now(),
      type: filePreview.type,
      fileName: filePreview.file.name,
      fileSize: (filePreview.file.size / 1024).toFixed(2) + ' KB',
      sent: true,
      delivered: false,
      read: false
    }

    setMessages(prev => [...prev, newMessage])
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Emit via socket
    socketService.emit('dm_send', {
      conversationId: activeConversation,
      message: newMessage
    })
  }, [filePreview, activeConversation, currentUser])

  const handleCreateConversation = useCallback(async (user) => {
    try {
      const response = await apiService.post('/messages/conversations', {
        userId: user.id
      })

      if (response.success && response.data) {
        setConversations(prev => [response.data.conversation, ...prev])
        setActiveConversation(response.data.conversation.id)
        setShowNewConversation(false)
        setShowMobileList(false)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setError(err.message || 'Failed to create conversation. Please try again.')
    }
  }, [])

  const handleBackToList = useCallback(() => {
    setShowMobileList(true)
  }, [])

  const handleVoiceCall = useCallback(() => {
    if (currentConversation) {
      // Navigate to call screen with audio only
      navigate(`/call/${currentConversation.id}?type=audio&user=${currentConversation.user.displayName}`)
    }
  }, [currentConversation, navigate])

  const handleVideoCall = useCallback(() => {
    if (currentConversation) {
      // Navigate to call screen with video
      navigate(`/call/${currentConversation.id}?type=video&user=${currentConversation.user.displayName}`)
    }
  }, [currentConversation, navigate])

  // Memoize filtered conversations
  const filteredConversations = useMemo(() =>
    conversations.filter(c =>
      c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  )

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#FAFAFA', color: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 24px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#666666' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Authentication Required</h2>
          <p style={{ color: '#666666', margin: 0 }}>Please log in to access direct messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div role="main" aria-label="Direct messages page" style={{ display: 'flex', height: '100vh', background: '#FAFAFA', color: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Left Sidebar - Conversations List */}
      <div style={{
        width: '320px',
        background: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: isMobile && !showMobileList ? 'none' : 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Messages</h1>
            <button
              onClick={() => setShowNewConversation(true)}
              aria-label="Start new conversation"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '14px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Plus size={20} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666666', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px 0 48px',
                background: '#FAFAFA',
                border: '1px solid #E0E0E0',
                borderRadius: '16px',
                color: '#000000',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E0E0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {filteredConversations.length > 0 && !loading ? (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversation}
                onClick={() => handleConversationSelect(conv.id)}
                navigate={navigate}
              />
            ))
          ) : !loading ? (
            <EmptyMessages onAction={() => setShowNewConversation(true)} />
          ) : null}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div style={{ flex: 1, display: isMobile && showMobileList ? 'none' : 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        {currentConversation ? (
          <>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E0E0E0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <button
                    onClick={handleBackToList}
                    aria-label="Back to conversations"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#000000',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}

                <div
                  onClick={() => navigate(`/profile/${currentConversation.user.username || currentConversation.user.id}`)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '12px', transition: 'background 0.2s' }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/profile/${currentConversation.user.username || currentConversation.user.id}`)}
                  aria-label={`View ${currentConversation.user.displayName}'s profile`}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={currentConversation.user.avatar || '/default-avatar.png'}
                      alt={currentConversation.user.displayName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: currentConversation.user.status === 'online' ? '#10B981' :
                          currentConversation.user.status === 'away' ? '#F59E0B' :
                          currentConversation.user.status === 'busy' ? '#EF4444' : '#666666',
                        border: '2px solid #FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 2px 0' }}>{currentConversation.user.displayName}</h2>
                    <div style={{ fontSize: '13px', color: currentConversation.user.status === 'online' ? '#10B981' : '#666666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Circle size={8} fill="currentColor" />
                      {currentConversation.user.status === 'online' ? 'Online' :
                       currentConversation.user.status === 'away' ? 'Away' :
                       currentConversation.user.status === 'busy' ? 'Busy' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleVoiceCall}
                  aria-label="Start voice call"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F5'
                    e.currentTarget.style.color = '#000000'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666666'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={handleVideoCall}
                  aria-label="Start video call"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F5'
                    e.currentTarget.style.color = '#000000'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666666'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Video size={20} />
                </button>
                <button
                  aria-label="More options"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F5'
                    e.currentTarget.style.color = '#000000'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666666'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div role="log" aria-label="Messages" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messagesLoading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#666666' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ margin: 0 }}>Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === currentUser?.id}
                    user={msg.senderId === currentUser?.id ? currentUser : currentConversation.user}
                  />
                ))
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ color: '#666666' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Start the conversation!</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Send a message to {currentConversation.user.displayName}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {isTyping && (
              <div style={{ padding: '12px 24px', fontSize: '13px', color: '#666666', fontStyle: 'italic' }}>
                {currentConversation.user.displayName} is typing...
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E0E0E0', background: '#FFFFFF' }}>
              {filePreview && (
                <div style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#FAFAFA',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {filePreview.type === 'image' ? (
                    <img src={filePreview.preview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }} />
                  ) : filePreview.type === 'video' ? (
                    <video src={filePreview.preview} controls style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px' }} />
                  ) : (
                    <File size={20} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{filePreview.file.name}</div>
                    <div style={{ fontSize: '12px', color: '#666666' }}>
                      {(filePreview.file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    onClick={handleFileCancel}
                    aria-label="Cancel file upload"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={handleFileSend}
                    aria-label="Send file"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '10px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px',
                background: '#FAFAFA',
                border: '1px solid #E0E0E0',
                borderRadius: '16px',
                padding: '12px',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EEEEEE'
                      e.currentTarget.style.color = '#000000'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                  >
                    <Paperclip size={20} />
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Add emoji"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EEEEEE'
                      e.currentTarget.style.color = '#000000'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                  >
                    <Smile size={20} />
                  </button>
                </div>

                <textarea
                  placeholder={`Message ${currentConversation.user.displayName}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  aria-label="Message input"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '24px',
                    maxHeight: '120px',
                    fontFamily: 'inherit'
                  }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  aria-label="Send message"
                  style={{
                    background: messageInput.trim() ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#E0E0E0',
                    border: 'none',
                    color: messageInput.trim() ? '#FFFFFF' : '#999999',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: messageInput.trim() ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (messageInput.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (messageInput.trim()) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <Send size={20} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
                aria-label="File input"
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
            <MessageSquare size={80} style={{ color: '#666666' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Select a Conversation</h2>
            <p style={{ color: '#666666', margin: 0 }}>Choose a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onCreateConversation={handleCreateConversation}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

DirectMessagesPage.propTypes = {}

export default DirectMessagesPage
