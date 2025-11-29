import React, { useState, useRef, useCallback, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Code, Quote, Eye, Edit3, Smile, Video, Paperclip } from 'lucide-react'

const RichTextEditor = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'What\'s on your mind?',
  maxLength = 40000,
  showToolbar = true,
  autoFocus = false,
  onImageUpload = null,
  onVideoUpload = null,
  onFileUpload = null,
  allowMarkdown = true,
  readOnly = false,
  className = '',
  minHeight = 'min-h-32'
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  // Common emoji shortcuts
  const commonEmojis = [
    '😀', '😂', '😍', '🤔', '😎', '😭', '👍', '👎', '❤️', '🔥', 
    '💯', '🎉', '👀', '🤯', '😱', '🙌', '🤝', '💪', '🚀', '✨'
  ]

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleTextChange = (e) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
      setCursorPosition(e.target.selectionStart)
    }
  }

  const insertAtCursor = useCallback((text, selectText = false) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = value || ''
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    onChange(newValue)

    // Set cursor position after insertion
    setTimeout(() => {
      if (selectText) {
        textarea.setSelectionRange(start, start + text.length)
      } else {
        textarea.setSelectionRange(start + text.length, start + text.length)
      }
      textarea.focus()
    }, 0)
  }, [value, onChange])

  const wrapSelection = useCallback((prefix, suffix = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const currentValue = value || ''
    
    if (selectedText) {
      const wrapped = prefix + selectedText + (suffix || prefix)
      const newValue = currentValue.substring(0, start) + wrapped + currentValue.substring(end)
      onChange(newValue)
      
      setTimeout(() => {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length)
        textarea.focus()
      }, 0)
    } else {
      insertAtCursor(prefix + (suffix || prefix))
    }
  }, [value, onChange, insertAtCursor])

  // Toolbar actions
  const formatBold = () => wrapSelection('**')
  const formatItalic = () => wrapSelection('*')
  const formatUnderline = () => wrapSelection('__')
  const formatStrikethrough = () => wrapSelection('~~')
  const formatCode = () => wrapSelection('`')
  const formatCodeBlock = () => insertAtCursor('\n```\n\n```\n')
  const formatQuote = () => insertAtCursor('\n> ')
  const formatUnorderedList = () => insertAtCursor('\n- ')
  const formatOrderedList = () => insertAtCursor('\n1. ')
  const formatH1 = () => insertAtCursor('\n# ')
  const formatH2 = () => insertAtCursor('\n## ')
  const formatH3 = () => insertAtCursor('\n### ')

  const insertLink = () => {
    if (linkUrl) {
      const linkMarkdown = linkText ? `[${linkText}](${linkUrl})` : `[${linkUrl}](${linkUrl})`
      insertAtCursor(linkMarkdown)
      setShowLinkDialog(false)
      setLinkUrl('')
      setLinkText('')
    }
  }

  const insertEmoji = (emoji) => {
    insertAtCursor(emoji)
    setShowEmojiPicker(false)
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0 && onImageUpload) {
      onImageUpload(files)
    }
  }

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0 && onVideoUpload) {
      onVideoUpload(files)
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files)
    }
  }

  // Convert markdown to basic HTML for preview
  const renderPreview = (text) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>')

    // Wrap consecutive li elements in ul/ol
    html = html.replace(/(<li>.*?<\/li>)/g, (match) => {
      return match.includes('1.') ? `<ol>${match}</ol>` : `<ul>${match}</ul>`
    })

    return html
  }

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatBold()
          break
        case 'i':
          e.preventDefault()
          formatItalic()
          break
        case 'u':
          e.preventDefault()
          formatUnderline()
          break
        case 'k':
          e.preventDefault()
          setShowLinkDialog(true)
          break
        case 'Enter':
          e.preventDefault()
          setIsPreviewMode(!isPreviewMode)
          break
      }
    }

    // Auto-formatting
    if (e.key === 'Enter') {
      const textarea = e.target
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)
      const lastLine = textBeforeCursor.split('\n').pop()

      // Continue lists
      if (lastLine.match(/^(\s*)([-*+]|\d+\.)\s/)) {
        e.preventDefault()
        const match = lastLine.match(/^(\s*)([-*+]|\d+\.)\s(.*)/)
        if (match) {
          const [, indent, marker, content] = match
          if (content.trim() === '') {
            // Remove empty list item
            const newValue = value.substring(0, cursorPos - lastLine.length) + indent + value.substring(cursorPos)
            onChange(newValue)
            setTimeout(() => {
              textarea.setSelectionRange(cursorPos - lastLine.length + indent.length, cursorPos - lastLine.length + indent.length)
            }, 0)
          } else {
            // Continue list
            const nextMarker = marker.match(/\d+\./) ? `${parseInt(marker) + 1}.` : marker
            insertAtCursor(`\n${indent}${nextMarker} `)
          }
        }
      }
    }

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      insertAtCursor(e.shiftKey ? '  ' : '    ')
    }
  }

  const remainingChars = maxLength - (value?.length || 0)
  const isNearLimit = remainingChars < 500

  return (
    <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}} role="group" aria-label="Rich text editor">
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px',
  padding: '8px'
}} role="toolbar" aria-label="Text formatting tools">
          {/* Formatting Tools */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <button
              type="button"
              onClick={formatBold}
              className="toolbar-btn"
              title="Bold (Ctrl+B)"
              aria-label="Bold text"
              aria-pressed={value?.includes('**') ? 'true' : 'false'}
            >
              <Bold size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Bold</span>
            </button>
            <button
              type="button"
              onClick={formatItalic}
              className="toolbar-btn"
              title="Italic (Ctrl+I)"
              aria-label="Italic text"
              aria-pressed={value?.includes('*') && !value?.includes('**') ? 'true' : 'false'}
            >
              <Italic size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Italic</span>
            </button>
            <button
              type="button"
              onClick={formatUnderline}
              className="toolbar-btn"
              title="Underline (Ctrl+U)"
              aria-label="Underline text"
              aria-pressed={value?.includes('__') ? 'true' : 'false'}
            >
              <Underline size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Underline</span>
            </button>
            <button
              type="button"
              onClick={formatStrikethrough}
              className="toolbar-btn"
              title="Strikethrough"
              aria-label="Strikethrough text"
              aria-pressed={value?.includes('~~') ? 'true' : 'false'}
            >
              <Strikethrough size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Strikethrough</span>
            </button>
          </div>

          {/* Headers */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <button
              type="button"
              onClick={formatH1}
              style={{
  fontWeight: 'bold'
}}
              title="Heading 1"
              aria-label="Insert heading 1"
            >
              H1
              <span className="sr-only">Heading 1</span>
            </button>
            <button
              type="button"
              onClick={formatH2}
              style={{
  fontWeight: 'bold'
}}
              title="Heading 2"
              aria-label="Insert heading 2"
            >
              H2
              <span className="sr-only">Heading 2</span>
            </button>
            <button
              type="button"
              onClick={formatH3}
              style={{
  fontWeight: 'bold'
}}
              title="Heading 3"
              aria-label="Insert heading 3"
            >
              H3
              <span className="sr-only">Heading 3</span>
            </button>
          </div>

          {/* Lists and Code */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <button
              type="button"
              onClick={formatUnorderedList}
              className="toolbar-btn"
              title="Bullet List"
              aria-label="Insert bullet list"
            >
              <List size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Bullet List</span>
            </button>
            <button
              type="button"
              onClick={formatOrderedList}
              className="toolbar-btn"
              title="Numbered List"
              aria-label="Insert numbered list"
            >
              <ListOrdered size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Numbered List</span>
            </button>
            <button
              type="button"
              onClick={formatQuote}
              className="toolbar-btn"
              title="Quote"
              aria-label="Insert quote"
            >
              <Quote size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Quote</span>
            </button>
            <button
              type="button"
              onClick={formatCode}
              className="toolbar-btn"
              title="Inline Code"
              aria-label="Insert inline code"
            >
              <Code size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Inline Code</span>
            </button>
          </div>

          {/* Media and Links */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <button
              type="button"
              onClick={() => setShowLinkDialog(true)}
              className="toolbar-btn"
              title="Insert Link (Ctrl+K)"
              aria-label="Insert link"
            >
              <Link size={14} className="sm:w-4 sm:h-4" />
              <span className="sr-only">Insert Link</span>
            </button>
            
            {onImageUpload && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="toolbar-btn"
                title="Upload Image"
                aria-label="Upload image"
              >
                <Image size={14} className="sm:w-4 sm:h-4" />
                <span className="sr-only">Upload Image</span>
              </button>
            )}
            
            {onVideoUpload && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="toolbar-btn"
                title="Upload Video"
                aria-label="Upload video"
              >
                <Video size={14} className="sm:w-4 sm:h-4" />
                <span className="sr-only">Upload Video</span>
              </button>
            )}
            
            {onFileUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="toolbar-btn"
                title="Upload File"
                aria-label="Upload file"
              >
                <Paperclip size={14} className="sm:w-4 sm:h-4" />
                <span className="sr-only">Upload File</span>
              </button>
            )}

            <div style={{
  position: 'relative'
}}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="toolbar-btn"
                title="Insert Emoji"
                aria-label="Insert emoji"
                aria-expanded={showEmojiPicker}
                aria-controls="emoji-picker"
              >
                <Smile size={14} className="sm:w-4 sm:h-4" />
                <span className="sr-only">Insert Emoji</span>
              </button>
              
              {showEmojiPicker && (
                <div 
                  id="emoji-picker"
                  style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '8px'
}}
                  role="menu"
                  aria-label="Emoji picker"
                >
                  <div style={{
  display: 'grid',
  gap: '4px',
  width: '128px'
}}>
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        style={{
  padding: '4px',
  borderRadius: '4px'
}}
                        role="menuitem"
                        aria-label={`Insert ${emoji} emoji`}
                        title={`Insert ${emoji} emoji`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Toggle */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`toolbar-btn ${isPreviewMode ? 'bg-accent/20 text-accent' : ''}`}
              title="Preview (Ctrl+Enter)"
              aria-label={isPreviewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
              aria-pressed={isPreviewMode}
            >
              {isPreviewMode ? <Edit3 size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
              <span className="sr-only">{isPreviewMode ? 'Edit Mode' : 'Preview Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div style={{
  position: 'relative'
}}>
        {isPreviewMode ? (
          <div
            style={{
  padding: '12px'
}}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview(value || '') || '<p class="text-secondary/60">Nothing to preview yet...</p>') }}
            role="document"
            aria-label="Preview content"
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{
  width: '100%',
  padding: '12px',
  background: 'transparent'
}}
            style={{ fontFamily: 'inherit' }}
            aria-label="Rich text editor"
            aria-describedby="char-count"
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '8px',
  gap: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
          {allowMarkdown && (
            <span style={{
  display: 'none'
}}>
              Markdown supported
            </span>
          )}
        </div>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}} id="char-count">
          <span className={`text-xs ${isNearLimit ? 'text-warning' : 'text-secondary/60'}`} aria-live="polite">
            {remainingChars.toLocaleString()} characters remaining
          </span>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}} role="dialog" aria-modal="true" aria-labelledby="link-dialog-title">
          <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px',
  width: '100%'
}}>
            <h3 id="link-dialog-title" style={{
  fontWeight: '600'
}}>Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="link-url" style={{
  display: 'block',
  fontWeight: '500'
}}>URL</label>
                <input
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  autoFocus
                  required
                  aria-describedby="link-url-help"
                />
                <p id="link-url-help" className="text-xs text-secondary mt-1">Enter a valid URL starting with http:// or https://</p>
              </div>
              <div>
                <label htmlFor="link-text" style={{
  display: 'block',
  fontWeight: '500'
}}>Link Text (optional)</label>
                <input
                  id="link-text"
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link description"
                  style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  aria-describedby="link-text-help"
                />
                <p id="link-text-help" className="text-xs text-secondary mt-1">If empty, the URL will be used as the link text</p>
              </div>
              <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}}>
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  style={{
  flex: '1',
  color: '#ffffff',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  borderRadius: '12px'
}}
                >
                  Insert Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkDialog(false)
                    setLinkUrl('')
                    setLinkText('')
                  }}
                  style={{
  flex: '1',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  borderRadius: '12px'
}}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="sr-only"
        aria-label="Upload image files"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoUpload}
        className="sr-only"
        aria-label="Upload video files"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="sr-only"
        aria-label="Upload files"
      />

      <style jsx>{`
        .toolbar-btn {
          @apply p-1.5 sm:p-2 rounded hover:bg-bg-tertiary text-secondary hover:text-primary transition-colors flex items-center justify-center min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] focus:ring-2 focus:ring-accent/50 focus:outline-none;
        }
        
        .sr-only {
          @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
        }
        
        .prose h1 { @apply text-2xl font-bold mt-6 mb-3 text-primary; }
        .prose h2 { @apply text-xl font-bold mt-5 mb-3 text-primary; }
        .prose h3 { @apply text-lg font-bold mt-4 mb-2 text-primary; }
        .prose blockquote { @apply border-l-4 border-accent/30 pl-4 italic text-secondary; }
        .prose ul { @apply list-disc list-inside space-y-1; }
        .prose ol { @apply list-decimal list-inside space-y-1; }
        .prose code.inline-code { @apply bg-bg-tertiary px-1 py-0.5 rounded text-sm font-mono; }
        .prose strong { @apply font-bold text-primary; }
        .prose em { @apply italic; }
        .prose u { @apply underline; }
        .prose del { @apply line-through; }
        .prose a { @apply text-accent hover:text-accent/80 underline; }
      `}</style>
    </div>
  )
}




export default RichTextEditor
