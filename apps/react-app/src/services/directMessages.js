/**
 * Direct Messages Service for CRYB Platform
 * Handles direct message conversations and real-time messaging
 */
import socketService from './socket'
import apiService from './api'

class DirectMessagesService {
  constructor() {
    this.conversations = []
    this.messages = new Map() // conversationId -> messages[]
    this.listeners = new Map()
    this.setupSocketListeners()
  }

  setupSocketListeners() {
    // Listen for direct message events
    socketService.on('direct_message_received', (message) => {
      this.handleDirectMessageReceived(message)
    })

    socketService.on('direct_message_sent', (message) => {
      this.handleDirectMessageSent(message)
    })

    socketService.on('conversation_created', (conversation) => {
      this.handleConversationCreated(conversation)
    })

    socketService.on('conversations_list', (conversations) => {
      this.conversations = conversations
      this.emit('conversations_updated', conversations)
    })

    socketService.on('direct_messages_list', (data) => {
      const { conversationId, messages } = data
      this.messages.set(conversationId, messages)
      this.emit('messages_updated', { conversationId, messages })
    })

    socketService.on('conversation_updated', (conversation) => {
      this.updateConversation(conversation)
    })
  }

  // Event management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`DirectMessages event error (${event}):`, error)
        }
      })
    }
  }

  // API methods
  async loadConversations() {
    try {
      // Try API first
      const response = await apiService.get('/conversations')
      this.conversations = response.data
      this.emit('conversations_updated', this.conversations)
      return this.conversations
    } catch (error) {
      console.error('Failed to load conversations from API:', error)
      // Fallback to socket
      socketService.getDirectConversations()
      return this.conversations
    }
  }

  async loadMessages(conversationId) {
    try {
      // Try API first
      const response = await apiService.get(`/conversations/${conversationId}/messages`)
      const messages = response.data
      this.messages.set(conversationId, messages)
      this.emit('messages_updated', { conversationId, messages })
      return messages
    } catch (error) {
      console.error('Failed to load messages from API:', error)
      // Fallback to socket
      socketService.getDirectMessages(conversationId)
      return this.messages.get(conversationId) || []
    }
  }

  async sendMessage(conversationId, content, attachments = []) {
    try {
      // Try API first for immediate response
      const tempMessage = {
        id: `temp_${Date.now()}`,
        conversationId,
        content,
        attachments,
        senderId: 'current_user', // This should be the current user ID
        timestamp: new Date().toISOString(),
        status: 'sending'
      }

      // Add optimistic update
      const currentMessages = this.messages.get(conversationId) || []
      this.messages.set(conversationId, [...currentMessages, tempMessage])
      this.emit('messages_updated', { 
        conversationId, 
        messages: this.messages.get(conversationId) 
      })

      // Send via socket for real-time delivery
      const recipient = this.getConversationRecipient(conversationId)
      if (recipient) {
        socketService.sendDirectMessage(recipient.id, content, attachments)
      }

      return tempMessage
    } catch (error) {
      console.error('Failed to send direct message:', error)
      throw error
    }
  }

  async startConversation(userId) {
    try {
      const response = await apiService.post('/conversations', { userId })
      const conversation = response.data
      this.handleConversationCreated(conversation)
      return conversation
    } catch (error) {
      console.error('Failed to start conversation:', error)
      // Fallback to socket
      socketService.startDirectConversation(userId)
      throw error
    }
  }

  async markAsRead(conversationId) {
    try {
      await apiService.patch(`/conversations/${conversationId}/read`)
      socketService.markConversationAsRead(conversationId)
      
      // Update local conversation
      const conversation = this.conversations.find(c => c.id === conversationId)
      if (conversation) {
        conversation.unreadCount = 0
        conversation.lastMessage.isRead = true
        this.emit('conversations_updated', this.conversations)
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  // Event handlers
  handleDirectMessageReceived(message) {
    const conversationId = message.conversationId
    const currentMessages = this.messages.get(conversationId) || []
    
    // Check for duplicates
    const exists = currentMessages.find(m => m.id === message.id)
    if (!exists) {
      this.messages.set(conversationId, [...currentMessages, message])
      this.emit('messages_updated', { 
        conversationId, 
        messages: this.messages.get(conversationId) 
      })

      // Update conversation last message
      this.updateConversationLastMessage(conversationId, message)
      
      // Emit notification
      this.emit('message_received', message)
    }
  }

  handleDirectMessageSent(message) {
    const conversationId = message.conversationId
    const currentMessages = this.messages.get(conversationId) || []
    
    // Replace temp message or add new one
    const tempIndex = currentMessages.findIndex(m => m.tempId === message.tempId)
    if (tempIndex > -1) {
      currentMessages[tempIndex] = message
    } else {
      currentMessages.push(message)
    }
    
    this.messages.set(conversationId, currentMessages)
    this.emit('messages_updated', { 
      conversationId, 
      messages: this.messages.get(conversationId) 
    })

    this.updateConversationLastMessage(conversationId, message)
  }

  handleConversationCreated(conversation) {
    const exists = this.conversations.find(c => c.id === conversation.id)
    if (!exists) {
      this.conversations.unshift(conversation)
      this.emit('conversations_updated', this.conversations)
    }
  }

  updateConversation(updatedConversation) {
    const index = this.conversations.findIndex(c => c.id === updatedConversation.id)
    if (index > -1) {
      this.conversations[index] = updatedConversation
      this.emit('conversations_updated', this.conversations)
    }
  }

  updateConversationLastMessage(conversationId, message) {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (conversation) {
      conversation.lastMessage = {
        content: message.content,
        timestamp: message.timestamp,
        isRead: message.senderId === 'current_user' // Mark as read if sent by current user
      }
      if (message.senderId !== 'current_user') {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1
      }
      this.emit('conversations_updated', this.conversations)
    }
  }

  // Utility methods
  getConversations() {
    return this.conversations
  }

  getMessages(conversationId) {
    return this.messages.get(conversationId) || []
  }

  getConversation(conversationId) {
    return this.conversations.find(c => c.id === conversationId)
  }

  getConversationRecipient(conversationId) {
    const conversation = this.getConversation(conversationId)
    return conversation?.user || null
  }

  searchConversations(query) {
    return this.conversations.filter(conversation => 
      conversation.user.username.toLowerCase().includes(query.toLowerCase()) ||
      conversation.user.displayName.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Clean up
  destroy() {
    this.listeners.clear()
    this.conversations = []
    this.messages.clear()
  }
}

// Export singleton instance
const directMessagesService = new DirectMessagesService()
export default directMessagesService