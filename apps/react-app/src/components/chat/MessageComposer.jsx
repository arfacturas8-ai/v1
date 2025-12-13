import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Send, Paperclip, Smile, Bold, Italic, Code, Link, Hash,
  X, Image, File, Mic, MicOff, AtSign, Calendar, Gift,
  Plus, Volume2, Camera, Monitor, Zap
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import DOMPurify from 'dompurify'

/**
 * MessageComposer - Advanced Discord-style message input
 * Features: Rich text, file upload, emoji picker, mentions, slash commands, voice messages
 */
function MessageComposer({
  onSendMessage,
  onTyping,
  onStopTyping,
  replyToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  placeholder = 'Type a message...',
  channelId,
  user,
  typingUsers = [],
  disabled = false,
  isMobile = false,
  className = ''
}) {
  // Content state
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [mentions, setMentions] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFormatting, setShowFormatting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [slashQuery, setSlashQuery] = useState('')
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  
  // Refs
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const mentionsRef = useRef(null)

  // Mock data - replace with actual API calls
  const availableUsers = [
    { id: '1', username: 'alice', displayName: 'Alice Cooper', avatar: null },
    { id: '2', username: 'bob', displayName: 'Bob Wilson', avatar: null },
    { id: '3', username: 'charlie', displayName: 'Charlie Brown', avatar: null }
  ]

  const slashCommands = [
    { name: 'gif', description: 'Search for a GIF', icon: Gift },
    { name: 'shrug', description: 'Add ¯\\_(ツ)_/¯ to your message', icon: Hash },
    { name: 'tableflip', description: 'Add (╯°□°）╯︵ ┻━┻ to your message', icon: Hash },
    { name: 'nick', description: 'Change your nickname', icon: AtSign },
    { name: 'me', description: 'Send an action message', icon: Zap }
  ]

  // Initialize editing content
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content)
      focusInput()
    } else {
      setContent('')
    }
  }, [editingMessage])

  // Handle typing indicators
  useEffect(() => {
    if (content.trim() && !isTyping && !editingMessage) {
      setIsTyping(true)
      onTyping && onTyping()
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        onStopTyping && onStopTyping()
      }
    }, 1000)
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [content, isTyping, onTyping, onStopTyping, editingMessage])

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
      if (mentionsRef.current && !mentionsRef.current.contains(event.target)) {
        setShowMentions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input
  const focusInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setContent(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
    
    // Check for mentions
    const mentionMatch = value.match(/@(\w*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowMentions(true)
      setShowSlashCommands(false)
    } else {
      setShowMentions(false)
    }
    
    // Check for slash commands
    const slashMatch = value.match(/^\/(\w*)$/)
    if (slashMatch) {
      setSlashQuery(slashMatch[1])
      setShowSlashCommands(true)
      setShowMentions(false)
    } else {
      setShowSlashCommands(false)
    }
  }, [])

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) {
        handleSaveEdit()
      } else {
        handleSendMessage()
      }
    }
    
    if (e.key === 'Escape') {
      if (editingMessage) {
        handleCancelEdit()
      } else if (replyToMessage) {
        onCancelReply && onCancelReply()
      }
    }
    
    // Navigation in mentions/commands
    if (showMentions || showSlashCommands) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        // Handle mention/command selection
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        // Select first mention/command
        if (showMentions && filteredUsers.length > 0) {
          handleMentionSelect(filteredUsers[0])
        }
        if (showSlashCommands && filteredCommands.length > 0) {
          handleSlashCommandSelect(filteredCommands[0])
        }
      }
    }
  }, [editingMessage, replyToMessage, showMentions, showSlashCommands])

  // Send message
  const handleSendMessage = useCallback(() => {
    if ((!content.trim() && attachments.length === 0) || disabled) return
    
    const messageData = {
      content: content.trim(),
      attachments,
      mentions,
      replyTo: replyToMessage?.id,
      type: audioBlob ? 'voice' : 'text'
    }
    
    if (audioBlob) {
      messageData.audioBlob = audioBlob
    }
    
    onSendMessage && onSendMessage(messageData.content, messageData.type, messageData.attachments)
    
    // Reset state
    setContent('')
    setAttachments([])
    setMentions([])
    setAudioBlob(null)
    setShowEmojiPicker(false)
    setShowMentions(false)
    setShowSlashCommands(false)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content, attachments, mentions, replyToMessage, audioBlob, disabled, onSendMessage])

  // Save edit
  const handleSaveEdit = useCallback(() => {
    if (!content.trim() || !editingMessage) return
    
    onSaveEdit && onSaveEdit(content.trim())
    setContent('')
  }, [content, editingMessage, onSaveEdit])

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setContent('')
    onCancelEdit && onCancelEdit()
  }, [onCancelEdit])

  // File handling
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        alert('File size must be less than 25MB')
        return
      }
      
      const fileData = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }
      
      setAttachments(prev => [...prev, fileData])
    })
    
    e.target.value = '' // Reset input
  }, [])

  const removeAttachment = useCallback((attachmentId) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === attachmentId)
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter(a => a.id !== attachmentId)
    })
  }, [])

  // Emoji handling
  const handleEmojiClick = useCallback((emojiData) => {
    const emoji = emojiData.emoji
    const cursorPos = textareaRef.current?.selectionStart || content.length
    const newContent = content.slice(0, cursorPos) + emoji + content.slice(cursorPos)
    setContent(newContent)
    setShowEmojiPicker(false)
    
    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = cursorPos + emoji.length
        textareaRef.current.selectionEnd = cursorPos + emoji.length
        textareaRef.current.focus()
      }
    }, 0)
  }, [content])

  // Mention handling
  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5)

  const handleMentionSelect = useCallback((user) => {
    const mentionText = `@${user.username} `
    const newContent = content.replace(/@\w*$/, mentionText)
    setContent(newContent)
    setMentions(prev => [...prev, user.id])
    setShowMentions(false)
    focusInput()
  }, [content])

  // Slash command handling
  const filteredCommands = slashCommands.filter(cmd =>
    cmd.name.toLowerCase().includes(slashQuery.toLowerCase())
  ).slice(0, 5)

  const handleSlashCommandSelect = useCallback((command) => {
    let newContent = ''
    
    switch (command.name) {
      case 'shrug':
        newContent = '¯\\_(ツ)_/¯ '
        break
      case 'tableflip':
        newContent = '(╯°□°）╯︵ ┻━┻ '
        break
      case 'me':
        newContent = '/me '
        break
      default:
        newContent = `/${command.name} `
    }
    
    setContent(newContent)
    setShowSlashCommands(false)
    focusInput()
  }, [])

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioBlob(null)
      setRecordingDuration(0)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Text formatting
  const insertFormatting = useCallback((format) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end)
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'code':
        formattedText = selectedText.includes('\n') ? `\`\`\`\n${selectedText}\n\`\`\`` : `\`${selectedText}\``
        break
      case 'link':
        formattedText = `[${selectedText}](url)`
        break
    }
    
    const newContent = content.slice(0, start) + formattedText + content.slice(end)
    setContent(newContent)
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      if (format === 'link') {
        const urlStart = start + formattedText.indexOf('(url)') + 1
        textarea.setSelectionRange(urlStart, urlStart + 3)
      } else {
        const newPos = start + formattedText.length
        textarea.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }, [content])

  return (
    <div className={`glass ${className}`} style={{ borderTop: '1px solid var(--border-subtle)', background: 'white' }}>
      {/* Reply/Edit Header */}
      {(replyToMessage || editingMessage) && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'var(--bg-secondary)'
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
              {editingMessage ? (
                <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                  Editing message
                </span>
              ) : (
                <>
                  <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                    Replying to {replyToMessage.username}
                  </span>
                  <span style={{
  color: 'var(--text-secondary)'
}}>
                    {replyToMessage.content}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={editingMessage ? handleCancelEdit : onCancelReply}
              style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
            >
              <X style={{
  width: '16px',
  height: '16px'
}} />
            </button>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
            {attachments.map(attachment => (
              <div key={attachment.id} style={{
  position: 'relative'
}}>
                {attachment.type.startsWith('image/') ? (
                  <div style={{
  position: 'relative'
}}>
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      style={{
  width: '80px',
  height: '80px',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)'
}}
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      style={{
  position: 'absolute',
  color: 'var(--text-primary)',
  borderRadius: '50%',
  padding: '4px',
  background: 'white'
}}
                    >
                      <X style={{
  width: '12px',
  height: '12px'
}} />
                    </button>
                  </div>
                ) : (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-secondary)',
  borderRadius: '4px',
  padding: '8px'
}}>
                    <File style={{
  width: '24px',
  height: '24px',
  color: 'var(--text-secondary)'
}} />
                    <div>
                      <div style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                        {attachment.name}
                      </div>
                      <div style={{
  color: 'var(--text-secondary)'
}}>
                        {(attachment.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      style={{
  position: 'absolute',
  color: 'var(--text-primary)',
  borderRadius: '50%',
  padding: '4px',
  background: 'white'
}}
                    >
                      <X style={{
  width: '12px',
  height: '12px'
}} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recording */}
      {isRecording && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
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
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
              <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                Recording voice message
              </span>
              <span className="text-sm text-red-600">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <button
                onClick={stopRecording}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]"
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
              >
                Send
              </button>
              <button
                onClick={cancelRecording}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderRadius: '4px'
}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioBlob && !isRecording && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-secondary)',
  borderRadius: '4px',
  padding: '12px'
}}>
            <Volume2 style={{
  width: '20px',
  height: '20px',
  color: 'var(--text-primary)'
}} />
            <div style={{
  flex: '1'
}}>
              <div style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>Voice message</div>
              <div style={{
  color: 'var(--text-secondary)'
}}>{formatDuration(recordingDuration)}</div>
            </div>
            <button
              onClick={() => setAudioBlob(null)}
              style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
            >
              <X style={{
  width: '16px',
  height: '16px'
}} />
            </button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div style={{
  position: 'relative'
}}>
        {/* Mentions Dropdown */}
        {showMentions && filteredUsers.length > 0 && (
          <div
            ref={mentionsRef}
            style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}
          >
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'white',
  textAlign: 'left'
}}
                className="hover:bg-[#F8F9FA]"
              >
                <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}} />
                  ) : (
                    <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>{user.displayName}</div>
                  <div style={{
  color: 'var(--text-secondary)'
}}>@{user.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Slash Commands Dropdown */}
        {showSlashCommands && filteredCommands.length > 0 && (
          <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}>
            {filteredCommands.map((command, index) => {
              const Icon = command.icon
              return (
                <button
                  key={command.name}
                  onClick={() => handleSlashCommandSelect(command)}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'white',
  textAlign: 'left'
}}
                  className="hover:bg-[#F8F9FA]"
                >
                  <Icon style={{
  width: '20px',
  height: '20px',
  color: 'var(--text-secondary)'
}} />
                  <div>
                    <div style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>/{command.name}</div>
                    <div style={{
  color: 'var(--text-secondary)'
}}>{command.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Input Container */}
        <div className="flex items-end gap-2 p-4">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.color = '#58a6ff')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Main Input */}
          <div className="flex-1 relative mx-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={disabled ? 'This channel is read-only' : placeholder}
              disabled={disabled}
              className="input textarea"
              style={{ minHeight: '40px', maxHeight: '200px', resize: 'none' }}
            />

            {/* Format Toolbar */}
            {showFormatting && (
              <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}>
                <button
                  onClick={() => insertFormatting('bold')}
                  className="hover:bg-[#F8F9FA]"
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
                >
                  <Bold style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button
                  onClick={() => insertFormatting('italic')}
                  className="hover:bg-[#F8F9FA]"
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
                >
                  <Italic style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button
                  onClick={() => insertFormatting('code')}
                  className="hover:bg-[#F8F9FA]"
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
                >
                  <Code style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button
                  onClick={() => insertFormatting('link')}
                  className="hover:bg-[#F8F9FA]"
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'white',
  color: 'var(--text-secondary)'
}}
                >
                  <Link style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Formatting Toggle */}
            <button
              onClick={() => setShowFormatting(!showFormatting)}
              className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Code className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#58a6ff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme="dark"
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>

            {/* Voice Recording */}
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => !disabled && (e.currentTarget.style.color = '#58a6ff')}
                onMouseLeave={(e) => !disabled && (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={editingMessage ? handleSaveEdit : handleSendMessage}
              disabled={disabled || (!content.trim() && attachments.length === 0 && !audioBlob)}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white disabled:opacity-50"
              style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)' }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="px-4 pb-2">
            <div className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : `${typingUsers.length} people are typing...`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



export default MessageComposer