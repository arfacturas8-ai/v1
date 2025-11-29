import React, { useState, useRef, useEffect } from 'react'
import { X, Reply, Users } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import MessageReactions from './MessageReactions'
import MessageActions from './MessageActions'

function MessageThread({ 
  isOpen, 
  onClose, 
  parentMessage, 
  replies = [], 
  onSendReply,
  onReact,
  onEdit,
  onDelete,
  currentUserId
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [editingReply, setEditingReply] = useState(null)
  const repliesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, replies])

  const scrollToBottom = () => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyMessage.trim()) return

    onSendReply(parentMessage.id, replyMessage.trim())
    setReplyMessage('')
  }

  const handleEditReply = (reply) => {
    setEditingReply(reply)
    setReplyMessage(reply.content)
  }

  const handleCancelEdit = () => {
    setEditingReply(null)
    setReplyMessage('')
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!replyMessage.trim() || !editingReply) return

    onEdit(editingReply.id, replyMessage.trim())
    setEditingReply(null)
    setReplyMessage('')
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isOpen || !parentMessage) return null

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end'
}}>
      <div style={{
  width: '100%',
  height: '100%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  flexDirection: 'column'
}}>
        {/* Header */}
        <div style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
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
              <Reply className="text-cyan-400" size={18} />
              <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Thread</h3>
              {replies.length > 0 && (
                <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
  padding: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thread Content */}
        <div style={{
  flex: '1'
}}>
          {/* Parent Message */}
          <div style={{
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
              <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                {parentMessage.avatar}
              </div>
              <div style={{
  flex: '1'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>{parentMessage.username}</span>
                  <span style={{
  color: '#ffffff'
}}>
                    {formatDate(parentMessage.timestamp)} at {formatTime(parentMessage.timestamp)}
                  </span>
                </div>
                <div style={{
  color: '#ffffff'
}}>
                  {parentMessage.content}
                </div>
                
                {/* Parent Message Reactions */}
                {parentMessage.reactions && Object.keys(parentMessage.reactions).length > 0 && (
                  <MessageReactions
                    reactions={parentMessage.reactions}
                    onAddReaction={(emoji) => onReact(parentMessage.id, emoji)}
                    onRemoveReaction={(emoji) => onReact(parentMessage.id, emoji)}
                    currentUserId={currentUserId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          <div style={{
  padding: '16px'
}}>
            {replies.length === 0 ? (
              <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
                <Reply style={{
  width: '48px',
  height: '48px',
  color: '#ffffff'
}} />
                <p style={{
  color: '#ffffff'
}}>No replies yet</p>
                <p style={{
  color: '#ffffff'
}}>Be the first to reply to this message</p>
              </div>
            ) : (
              replies.map((reply, index) => {
                const isOwnReply = reply.userId === currentUserId
                const showAvatar = index === 0 || replies[index - 1].userId !== reply.userId
                
                return (
                  <div key={reply.id} style={{
  position: 'relative'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                      {showAvatar ? (
                        <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                          {reply.avatar}
                        </div>
                      ) : (
                        <div style={{
  width: '32px',
  height: '32px'
}}></div>
                      )}
                      
                      <div style={{
  flex: '1'
}}>
                        {showAvatar && (
                          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                            <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                              {isOwnReply ? 'You' : reply.username}
                            </span>
                            <span style={{
  color: '#ffffff'
}}>{formatTime(reply.timestamp)}</span>
                          </div>
                        )}
                        
                        <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                          {reply.content}
                        </div>
                        
                        {/* Reply Reactions */}
                        {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                          <MessageReactions
                            reactions={reply.reactions}
                            onAddReaction={(emoji) => onReact(reply.id, emoji)}
                            onRemoveReaction={(emoji) => onReact(reply.id, emoji)}
                            currentUserId={currentUserId}
                          />
                        )}
                      </div>
                    </div>

                    {/* Reply Actions (shown on hover) */}
                    <div style={{
  position: 'absolute'
}}>
                      <MessageActions
                        message={reply}
                        isOwnMessage={isOwnReply}
                        onEdit={handleEditReply}
                        onDelete={onDelete}
                        onReply={() => {}} // Disable nested replies for now
                        onReact={(messageId, emoji) => onReact(messageId, emoji)}
                        className="transform -translate-y-2"
                      />
                    </div>
                  </div>
                )
              })
            )}
            <div ref={repliesEndRef} />
          </div>
        </div>

        {/* Reply Input */}
        <div style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
          <form onSubmit={editingReply ? handleSaveEdit : handleSendReply}>
            <RichTextEditor
              value={replyMessage}
              onChange={setReplyMessage}
              onSubmit={editingReply ? handleSaveEdit : handleSendReply}
              placeholder={
                editingReply 
                  ? 'Edit your reply...' 
                  : `Reply to ${parentMessage.username}...`
              }
              editingMessage={editingReply}
              onCancelEdit={handleCancelEdit}
            />
          </form>
        </div>

        {/* Thread Stats */}
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#ffffff'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Users size={12} />
                <span>
                  {[...new Set([parentMessage.userId, ...replies.map(r => r.userId)])].length} participant{[...new Set([parentMessage.userId, ...replies.map(r => r.userId)])].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Reply size={12} />
                <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



export default MessageThread