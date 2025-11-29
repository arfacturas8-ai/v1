import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Code, Link, Send, Paperclip, Camera, Mic } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

function RichTextEditor({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = 'Type a message...', 
  onFileUpload,
  disabled = false,
  replyingTo = null,
  onCancelReply,
  editingMessage = null,
  onCancelEdit,
  isMobile = false,
  onEmojiSelect,
  showEmojiButton = true,
  isRecording = false,
  onVoiceRecord
}) {
  const [isFormatting, setIsFormatting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const recordButtonRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Auto-resize textarea
      textarea.style.height = 'auto'
      const maxHeight = isMobile ? 100 : 120
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
    }
  }, [value, isMobile])

  useEffect(() => {
    // Focus on textarea when editing or replying
    if (editingMessage || replyingTo) {
      textareaRef.current?.focus()
    }
  }, [editingMessage, replyingTo])

  const insertFormatting = (before, after = '', placeholder = 'text') => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = selectedText || placeholder
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end)
    onChange(newText)
    
    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    // Submit on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSubmit(e)
      }
    }
    
    // Formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertFormatting('**', '**', 'bold text')
          break
        case 'i':
          e.preventDefault()
          insertFormatting('*', '*', 'italic text')
          break
        case 'k':
          e.preventDefault()
          insertFormatting('[', '](url)', 'link text')
          break
        case 'e':
          e.preventDefault()
          insertFormatting('`', '`', 'code')
          break
      }
    }
  }

  const handleEmojiSelect = useCallback((emoji) => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const newText = value.substring(0, start) + emoji + value.substring(end)
    onChange(newText)
    
    // Set cursor position after emoji
    setTimeout(() => {
      const newCursorPos = start + emoji.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
    
    setShowEmojiPicker(false)
    
    // Call parent handler if provided
    if (onEmojiSelect) {
      onEmojiSelect(emoji)
    }
  }, [value, onChange, onEmojiSelect])

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files)
    }
    // Reset file input
    e.target.value = ''
  }, [onFileUpload])

  const handleCameraCapture = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files)
    }
    e.target.value = ''
  }, [onFileUpload])

  const handleVoiceRecord = useCallback(() => {
    if (onVoiceRecord) {
      onVoiceRecord()
    }
  }, [onVoiceRecord])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // Close emoji picker when losing focus (but not immediately)
    setTimeout(() => {
      if (!document.activeElement?.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }, 200)
  }, [])

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault()
    if (value.trim() && !disabled) {
      onSubmit()
    }
  }, [value, disabled, onSubmit])

  const containerStyles = {
    backgroundColor: 'var(--bg-secondary)',
    border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
    borderRadius: isMobile ? '12px' : '8px',
    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
    transition: 'all 0.2s ease'
  }

  return (
    <div style={{
  position: 'relative',
  marginLeft: '8px',
  marginRight: '8px'
}} style={containerStyles}>
      {/* Reply/Edit Header */}
      {(replyingTo || editingMessage) && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}
             style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  flex: '1'
}}>
            {replyingTo && (
              <>
                <div style={{
  width: '4px',
  height: '16px',
  borderRadius: '50%'
}} style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                <span className={`text-xs ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text-muted)' }}>
                  Replying to <span style={{ color: 'var(--accent-primary)' }}>{replyingTo.username}</span>
                </span>
                <span className={`text-xs truncate ${isMobile ? 'max-w-24' : 'max-w-xs'}`} style={{ color: 'var(--text-muted)' }}>
                  {replyingTo.content}
                </span>
              </>
            )}
            {editingMessage && (
              <>
                <div style={{
  width: '4px',
  height: '16px',
  borderRadius: '50%'
}}></div>
                <span className={`text-xs ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text-muted)' }}>Editing message</span>
              </>
            )}
          </div>
          <button
            onClick={replyingTo ? onCancelReply : onCancelEdit}
            className={`${isMobile ? 'touch-target p-2' : 'p-1'} transition-colors`}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Formatting Toolbar - Hidden on mobile */}
      {isFormatting && !isMobile && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  display: 'flex',
  alignItems: 'center'
}} style={{ borderColor: 'var(--border-primary)' }}>
          <button
            onClick={() => insertFormatting('**', '**', 'bold text')}
            style={{
  padding: '8px',
  borderRadius: '4px'
}}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', 'italic text')}
            style={{
  padding: '8px',
  borderRadius: '4px'
}}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => insertFormatting('`', '`', 'code')}
            style={{
  padding: '8px',
  borderRadius: '4px'
}}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            title="Code (Ctrl+E)"
          >
            <Code size={16} />
          </button>
          <button
            onClick={() => insertFormatting('[', '](url)', 'link text')}
            style={{
  padding: '8px',
  borderRadius: '4px'
}}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            title="Link (Ctrl+K)"
          >
            <Link size={16} />
          </button>
          <button
            onClick={() => insertFormatting('```\n', '\n```', 'code block')}
            style={{
  padding: '8px',
  borderRadius: '4px'
}}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            title="Code Block"
          >
            <span className="text-xs font-mono">{'{}'}</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={{
  display: 'flex',
  alignItems: 'flex-end'
}}>
        <div style={{
  flex: '1'
}}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            style={{
  width: '100%',
  background: 'transparent'
}}
            style={{ 
              lineHeight: '1.5',
              color: 'var(--text-primary)',
              '::placeholder': {
                color: 'var(--text-muted)'
              }
            }}
          />
        </div>

        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{
  display: 'none'
}}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{
  display: 'none'
}}
          />

          {/* Mobile-specific buttons */}
          {isMobile && (
            <>
              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
  padding: '8px',
  borderRadius: '12px'
}}
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
                title="Take photo/video"
              >
                <Camera size={20} />
              </button>
              
              {/* Voice record button */}
              {onVoiceRecord && (
                <button
                  ref={recordButtonRef}
                  onClick={handleVoiceRecord}
                  style={{
  padding: '8px',
  borderRadius: '12px'
}}
                  style={{ 
                    color: isRecording ? 'white' : 'var(--text-muted)',
                    backgroundColor: isRecording ? '#ef4444' : 'transparent'
                  }}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                >
                  <Mic size={20} />
                </button>
              )}
            </>
          )}

          {/* File upload button */}
          {!isMobile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
  padding: '8px',
  borderRadius: '12px'
}}
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.target.style.color = 'var(--accent-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
          )}

          {/* Emoji Picker */}
          {showEmojiButton && (
            <div className="emoji-picker-container">
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect} 
                position="top"
                isMobile={isMobile}
                isOpen={showEmojiPicker}
                onToggle={setShowEmojiPicker}
              />
            </div>
          )}

          {/* Formatting Toggle - Desktop only */}
          {!isMobile && (
            <button
              onClick={() => setIsFormatting(!isFormatting)}
              style={{
  padding: '8px',
  borderRadius: '12px'
}}
              style={{
                color: isFormatting ? 'var(--accent-primary)' : 'var(--text-muted)',
                backgroundColor: isFormatting ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
              }}
              onMouseEnter={(e) => !isFormatting && (e.target.style.backgroundColor = 'var(--hover-bg)')}
              onMouseLeave={(e) => !isFormatting && (e.target.style.backgroundColor = 'transparent')}
              title="Toggle formatting"
            >
              <span className="text-sm font-mono">Aa</span>
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            style={{
  borderRadius: '12px'
}}
            style={{
              backgroundColor: value.trim() && !disabled ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: 'white'
            }}
            title="Send message (Enter)"
          >
            <Send size={isMobile ? 20 : 18} />
          </button>
        </div>
      </div>

      {/* Typing Indicator - Desktop only */}
      {!isMobile && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}} style={{ color: 'var(--text-muted)' }}>
          Press <kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Enter</kbd> to send, 
          <kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Shift + Enter</kbd> for new line
        </div>
      )}
      
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        textarea::placeholder {
          color: var(--text-muted);
        }
        
        @media (max-width: 768px) {
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
        }
      `}</style>
    </div>
  )
}




export default RichTextEditor
