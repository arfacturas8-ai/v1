import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
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

/**
 * DirectMessagesPage - Dedicated direct messaging interface
 * Features:
 * - Private 1-on-1 conversations
 * - Conversation list with search
 * - Real-time messaging via WebSocket
 * - File attachments and media
 * - User presence indicators
 * - Mobile-responsive design
 * - OpenSea-inspired dark theme
 * - Discord-like layout
 */

// Memoized conversation item component
const ConversationItem = memo(({ conversation, isActive, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'away': return '#F59E0B'
      case 'busy': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`conversation-item ${isActive ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Conversation with ${conversation.user.displayName}`}
    >
      <div className="conversation-avatar-wrapper">
        <img
          src={conversation.user.avatar || '/default-avatar.png'}
          alt={`${conversation.user.displayName}'s avatar`}
          className="conversation-avatar"
          loading="lazy"
        />
        <div
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(conversation.user.status) }}
          aria-label={`Status: ${conversation.user.status || 'offline'}`}
        />
      </div>

      <div className="conversation-info">
        <div className="conversation-header">
          <span className="conversation-name">{conversation.user.displayName}</span>
          {conversation.lastMessage && (
            <span className="conversation-time">
              {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
            </span>
          )}
        </div>

        {conversation.lastMessage && (
          <div className="conversation-preview">
            <span className="last-message">
              {conversation.lastMessage.type === 'image' ? (
                <><ImageIcon size={14} /> Image</>
              ) : conversation.lastMessage.type === 'file' ? (
                <><File size={14} /> File</>
              ) : (
                conversation.lastMessage.content
              )}
            </span>
          </div>
        )}
      </div>

      {conversation.unreadCount > 0 && (
        <div className="unread-badge" aria-label={`${conversation.unreadCount} unread messages`}>
          {conversation.unreadCount}
        </div>
      )}
    </div>
  )
})

ConversationItem.displayName = 'ConversationItem'

// Memoized message component
const Message = memo(({ message, isOwn, user }) => {
  const getMessageStatus = () => {
    if (message.read) return <CheckCheck size={14} className="message-status read" />
    if (message.delivered) return <CheckCheck size={14} className="message-status delivered" />
    if (message.sent) return <Check size={14} className="message-status sent" />
    return <Loader size={14} className="message-status sending" />
  }

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <img
          src={user?.avatar || '/default-avatar.png'}
          alt={`${user?.displayName}'s avatar`}
          className="message-avatar"
        />
      )}

      <div className="message-content-wrapper">
        {!isOwn && (
          <div className="message-author">{user?.displayName}</div>
        )}

        <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
          {message.type === 'text' && (
            <p className="message-text">{message.content}</p>
          )}

          {message.type === 'image' && (
            <div className="message-image-container">
              <img src={message.content} alt="Shared image" className="message-image" />
            </div>
          )}

          {message.type === 'file' && (
            <div className="message-file">
              <File size={24} />
              <div className="file-info">
                <div className="file-name">{message.fileName}</div>
                <div className="file-size">{message.fileSize}</div>
              </div>
            </div>
          )}

          <div className="message-meta">
            <span className="message-time">
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
          }
        } catch (err) {
          console.error('Failed to search users:', err)
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
      >
        <div className="modal-header">
          <h2 id="new-conversation-title">New Conversation</h2>
          <button
            onClick={onClose}
            className="modal-close-btn touch-target"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          <div className="users-list">
            {loading ? (
              <div className="loading-container">
                <Loader size={24} className="spinner" />
                <p>Searching...</p>
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div
                  key={user.id}
                  className="user-item"
                  onClick={() => onCreateConversation(user)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={user.avatar || '/default-avatar.png'} alt={user.displayName} />
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                </div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="empty-state-small">
                <p>No users found</p>
              </div>
            ) : (
              <div className="empty-state-small">
                <p>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

NewConversationModal.displayName = 'NewConversationModal'

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
      setFilePreview({
        file,
        preview: event.target.result,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      })
    }
    reader.onerror = () => {
      console.error('Failed to read file')
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
    }
  }, [])

  const handleBackToList = useCallback(() => {
    setShowMobileList(true)
  }, [])

  const handleVoiceCall = useCallback(() => {
    if (currentConversation) {
      alert(`Starting voice call with ${currentConversation.user.displayName}`)
      // Voice call logic would go here
    }
  }, [currentConversation])

  const handleVideoCall = useCallback(() => {
    if (currentConversation) {
      alert(`Starting video call with ${currentConversation.user.displayName}`)
      // Video call logic would go here
    }
  }, [currentConversation])

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
      <div className="dm-page">
        <div className="empty-state-container">
          <AlertCircle size={64} />
          <h2>Authentication Required</h2>
          <p>Please log in to access direct messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dm-page" role="main" aria-label="Direct messages page">
      <style>{`
        .dm-page {
          display: flex;
          height: 100vh;
          background: #0d1117;
          color: #c9d1d9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        /* Left Sidebar - Conversations List */
        .conversations-sidebar {
          width: 320px;
          background: rgba(22, 27, 34, 0.8);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
        }

        .sidebar-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .sidebar-title h1 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .new-conversation-btn {
          background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
          border: none;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
        }

        .new-conversation-btn:hover {
          opacity: 0.9;
          transform: scale(1.05);
        }

        .search-container {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8A8A8A;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: rgba(13, 17, 23, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: rgba(88, 166, 255, 0.5);
          background: rgba(22, 27, 34, 0.8);
        }

        .search-input::placeholder {
          color: #6B7280;
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .conversations-list::-webkit-scrollbar {
          width: 8px;
        }

        .conversations-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .conversations-list::-webkit-scrollbar-thumb {
          background: #2D2D2D;
          border-radius: 4px;
        }

        .conversations-list::-webkit-scrollbar-thumb:hover {
          background: #3D3D3D;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .conversation-item:hover {
          background: #2D2D2D;
        }

        .conversation-item.active {
          background: #2D2D2D;
          border-left: 3px solid #58a6ff;
          padding-left: 7px;
        }

        .conversation-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .conversation-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid #1A1A1A;
        }

        .conversation-info {
          flex: 1;
          min-width: 0;
        }

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .conversation-name {
          font-weight: 600;
          font-size: 15px;
          color: #FFFFFF;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conversation-time {
          font-size: 12px;
          color: #8A8A8A;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .conversation-preview {
          display: flex;
          align-items: center;
        }

        .last-message {
          font-size: 13px;
          color: #8A8A8A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .unread-badge {
          background: #58a6ff;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          min-width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        /* Right Panel - Chat */
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0d1117;
        }

        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(22, 27, 34, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          display: none;
          background: transparent;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #2D2D2D;
        }

        .chat-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar-wrapper {
          position: relative;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .chat-user-details h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }

        .user-status {
          font-size: 13px;
          color: #10B981;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-status.offline {
          color: #6B7280;
        }

        .user-status.away {
          color: #F59E0B;
        }

        .chat-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: transparent;
          border: 1px solid #2D2D2D;
          color: #FFFFFF;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #2D2D2D;
          border-color: #58a6ff;
          color: #58a6ff;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #2D2D2D;
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #3D3D3D;
        }

        .typing-indicator {
          padding: 12px 24px;
          font-size: 13px;
          color: #8A8A8A;
          font-style: italic;
        }

        .message-wrapper {
          display: flex;
          gap: 12px;
          max-width: 70%;
        }

        .message-wrapper.own {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .message-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-author {
          font-size: 13px;
          font-weight: 600;
          color: #8A8A8A;
          padding: 0 12px;
        }

        .message-bubble {
          background: rgba(22, 27, 34, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          border-radius: 16px;
          border-top-left-radius: 4px;
        }

        .message-bubble.own {
          background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
          border: none;
          border-radius: 16px;
          border-top-right-radius: 4px;
        }

        .message-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .message-image-container {
          max-width: 100%;
          border-radius: 12px;
          overflow: hidden;
        }

        .message-image {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .message-file {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: #0D0D0D;
          border-radius: 8px;
          min-width: 200px;
        }

        .file-info {
          flex: 1;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .file-size {
          font-size: 12px;
          color: #8A8A8A;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          justify-content: flex-end;
        }

        .message-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .message-status {
          flex-shrink: 0;
        }

        .message-status.sending {
          color: #8A8A8A;
          animation: spin 1s linear infinite;
        }

        .message-status.sent {
          color: #8A8A8A;
        }

        .message-status.delivered {
          color: #8A8A8A;
        }

        .message-status.read {
          color: #58a6ff;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Message Composer */
        .message-composer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(22, 27, 34, 0.6);
          backdrop-filter: blur(12px);
        }

        .file-preview-container {
          margin-bottom: 12px;
          padding: 12px;
          background: #0D0D0D;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-preview-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
        }

        .file-preview-info {
          flex: 1;
        }

        .file-preview-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .file-preview-size {
          font-size: 12px;
          color: #8A8A8A;
        }

        .file-preview-cancel {
          background: transparent;
          border: none;
          color: #EF4444;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .file-preview-cancel:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .composer-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: rgba(13, 17, 23, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          transition: all 0.2s;
        }

        .composer-wrapper:focus-within {
          border-color: rgba(88, 166, 255, 0.5);
        }

        .composer-actions-left {
          display: flex;
          gap: 8px;
        }

        .composer-btn {
          background: transparent;
          border: none;
          color: #8A8A8A;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .composer-btn:hover {
          background: #2D2D2D;
          color: #FFFFFF;
        }

        .message-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #FFFFFF;
          font-size: 15px;
          outline: none;
          resize: none;
          min-height: 24px;
          max-height: 120px;
          font-family: inherit;
        }

        .message-input::placeholder {
          color: #6B7280;
        }

        .send-btn {
          background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
          border: none;
          color: #FFFFFF;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .send-btn:hover {
          opacity: 0.9;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: #6B7280;
          cursor: not-allowed;
          transform: none;
        }

        /* Empty States */
        .empty-state-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #8A8A8A;
          text-align: center;
          padding: 48px 24px;
        }

        .empty-state-container h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #FFFFFF;
        }

        .empty-state-container p {
          font-size: 15px;
          margin: 0;
        }

        .loading-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #8A8A8A;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .modal-content {
          background: rgba(22, 27, 34, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 600px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #8A8A8A;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: #2D2D2D;
          color: #FFFFFF;
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 16px;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-item:hover {
          background: #2D2D2D;
        }

        .user-item img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .user-username {
          font-size: 13px;
          color: #8A8A8A;
        }

        .empty-state-small {
          text-align: center;
          padding: 48px 24px;
          color: #8A8A8A;
        }

        .empty-state-small p {
          margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .conversations-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 10;
            transform: translateX(0);
            transition: transform 0.3s;
          }

          .conversations-sidebar.hidden {
            transform: translateX(-100%);
          }

          .chat-panel.hidden {
            display: none;
          }

          .back-btn {
            display: flex;
          }

          .message-wrapper {
            max-width: 85%;
          }

          .chat-header {
            padding: 12px 16px;
          }

          .messages-container {
            padding: 16px;
          }

          .message-composer {
            padding: 12px 16px;
          }
        }

        @media (max-width: 480px) {
          .conversations-sidebar {
            width: 100%;
          }

          .sidebar-title h1 {
            font-size: 18px;
          }

          .chat-header h2 {
            font-size: 14px;
          }

          .chat-actions {
            gap: 4px;
          }

          .action-btn {
            padding: 8px;
          }

          .message-wrapper {
            max-width: 90%;
          }

          .composer-wrapper {
            padding: 8px;
          }
        }

        /* Hidden file input */
        .hidden-file-input {
          display: none;
        }
      `}</style>

      {/* Left Sidebar - Conversations List */}
      <div className={`conversations-sidebar ${!showMobileList ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h1>Direct Messages</h1>
            <button
              className="new-conversation-btn touch-target"
              onClick={() => setShowNewConversation(true)}
              aria-label="Start new conversation"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search conversations"
            />
          </div>
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="loading-container">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} className="h-20 mb-2" />
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversation}
                onClick={() => handleConversationSelect(conv.id)}
              />
            ))
          ) : (
            <EmptyMessages onAction={() => setShowNewConversation(true)} />
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className={`chat-panel ${showMobileList ? 'hidden' : ''}`}>
        {currentConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <button
                  className="back-btn touch-target"
                  onClick={handleBackToList}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="chat-user-info">
                  <div className="chat-avatar-wrapper">
                    <img
                      src={currentConversation.user.avatar || '/default-avatar.png'}
                      alt={currentConversation.user.displayName}
                      className="chat-avatar"
                      loading="lazy"
                    />
                    <div
                      className="status-indicator"
                      style={{
                        backgroundColor: currentConversation.user.status === 'online' ? '#10B981' :
                          currentConversation.user.status === 'away' ? '#F59E0B' :
                          currentConversation.user.status === 'busy' ? '#EF4444' : '#6B7280'
                      }}
                    />
                  </div>

                  <div className="chat-user-details">
                    <h2>{currentConversation.user.displayName}</h2>
                    <div className={`user-status ${currentConversation.user.status === 'online' ? '' : 'offline'}`}>
                      <Circle size={8} fill="currentColor" />
                      {currentConversation.user.status === 'online' ? 'Online' :
                       currentConversation.user.status === 'away' ? 'Away' :
                       currentConversation.user.status === 'busy' ? 'Busy' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-actions">
                <button
                  className="action-btn touch-target"
                  onClick={handleVoiceCall}
                  aria-label="Start voice call"
                >
                  <Phone size={20} />
                </button>
                <button
                  className="action-btn touch-target"
                  onClick={handleVideoCall}
                  aria-label="Start video call"
                >
                  <Video size={20} />
                </button>
                <button
                  className="action-btn touch-target"
                  aria-label="More options"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="messages-container" role="log" aria-label="Messages">
              {messagesLoading ? (
                <div className="loading-container">
                  <Loader size={32} className="spinner" />
                  <p>Loading messages...</p>
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
                <div className="empty-state-container">
                  <MessageSquare size={64} />
                  <h2>Start the conversation!</h2>
                  <p>Send a message to {currentConversation.user.displayName}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {isTyping && (
              <div className="typing-indicator">
                {currentConversation.user.displayName} is typing...
              </div>
            )}

            <div className="message-composer">
              {filePreview && (
                <div className="file-preview-container">
                  {filePreview.type === 'image' ? (
                    <img src={filePreview.preview} alt="Preview" className="file-preview-image" />
                  ) : (
                    <File size={32} />
                  )}
                  <div className="file-preview-info">
                    <div className="file-preview-name">{filePreview.file.name}</div>
                    <div className="file-preview-size">
                      {(filePreview.file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    className="file-preview-cancel"
                    onClick={handleFileCancel}
                    aria-label="Cancel file upload"
                  >
                    <X size={20} />
                  </button>
                  <button
                    className="send-btn touch-target"
                    onClick={handleFileSend}
                    aria-label="Send file"
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}

              <div className="composer-wrapper">
                <div className="composer-actions-left">
                  <button
                    className="composer-btn touch-target"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                  >
                    <Paperclip size={20} />
                  </button>
                  <button
                    className="composer-btn touch-target"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Add emoji"
                  >
                    <Smile size={20} />
                  </button>
                </div>

                <textarea
                  className="message-input"
                  placeholder={`Message ${currentConversation.user.displayName}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  aria-label="Message input"
                />

                <button
                  className="send-btn touch-target"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden-file-input"
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
                aria-label="File input"
              />
            </div>
          </>
        ) : (
          <div className="empty-state-container">
            <MessageSquare size={80} />
            <h2>Select a Conversation</h2>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  )
}

export default DirectMessagesPage
