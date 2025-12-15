import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Edit, Trash2, Reply, Smile, Copy, Pin } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

function MessageActions({ 
  message, 
  isOwnMessage, 
  onEdit, 
  onDelete, 
  onReply, 
  onReact,
  onCopy,
  onPin,
  className = ''
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleAction = (action) => {
    setIsMenuOpen(false)
    action()
  }

  const handleEmojiSelect = (emoji) => {
    onReact(message.id, emoji)
    setShowEmojiPicker(false)
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content)
    onCopy && onCopy()
  }

  return (
    <div style={{
  position: 'relative'
}}>
      {/* Quick Actions (hover) */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '4px'
}}>
        <button
          onClick={() => onReact(message.id, '👍')}
          style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
          title="Like"
        >
          👍
        </button>
        <button
          onClick={() => onReact(message.id, '❤️')}
          style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
          title="Love"
        >
          ❤️
        </button>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
          title="Add reaction"
        >
          <Smile size={16} />
        </button>
        <button
          onClick={() => onReply(message)}
          style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
          title="Reply"
        >
          <Reply size={16} />
        </button>
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
          title="More actions"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
  position: 'absolute'
}}>
          <EmojiPicker onEmojiSelect={handleEmojiSelect} position="bottom" />
        </div>
      )}

      {/* Context Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          style={{
  position: 'absolute',
  width: '192px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  overflow: 'hidden'
}}
        >
          <div style={{
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
            <button
              onClick={() => handleAction(() => onReply(message))}
              style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
            >
              <Reply size={16} className="mr-3" />
              Reply
            </button>
            
            <button
              onClick={() => handleAction(copyMessage)}
              style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
            >
              <Copy size={16} className="mr-3" />
              Copy Message
            </button>

            {isOwnMessage && (
              <>
                <button
                  onClick={() => handleAction(() => onEdit(message))}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
                >
                  <Edit size={16} className="mr-3" />
                  Edit Message
                </button>
                
                <div style={{
  marginTop: '4px',
  marginBottom: '4px'
}}></div>
                
                <button
                  onClick={() => handleAction(() => onDelete(message.id))}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                >
                  <Trash2 size={16} className="mr-3" />
                  Delete Message
                </button>
              </>
            )}

            {!isOwnMessage && (
              <button
                onClick={() => handleAction(() => onPin(message.id))}
                style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
              >
                <Pin size={16} className="mr-3" />
                Pin Message
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



export default MessageActions