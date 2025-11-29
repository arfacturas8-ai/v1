import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'

const MessageReactions = ({ 
  reactions = {},
  onAddReaction,
  onRemoveReaction,
  currentUserId,
  messageId,
  className = ''
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Popular reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯']

  const handleQuickReaction = (emoji) => {
    const reactionData = reactions[emoji]
    const hasUserReacted = reactionData?.users?.includes(currentUserId)

    if (hasUserReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onAddReaction(messageId, emoji)
    }
  }

  const handleAddReaction = (emoji) => {
    onAddReaction(messageId, emoji)
    setShowEmojiPicker(false)
  }

  // Get reaction entries sorted by count
  const reactionEntries = Object.entries(reactions)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count)

  if (reactionEntries.length === 0 && !showEmojiPicker) {
    return null
  }

  return (
    <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px'
}}>
      {/* Existing Reactions */}
      {reactionEntries.map(([emoji, data]) => {
        const hasUserReacted = data.users?.includes(currentUserId)
        
        return (
          <button
            key={emoji}
            onClick={() => handleQuickReaction(emoji)}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
            title={`${data.users?.join(', ')} reacted with ${emoji}`}
          >
            <span className="text-sm">{emoji}</span>
            <span style={{
  fontWeight: '500'
}}>{data.count}</span>
          </button>
        )
      })}

      {/* Add Reaction Button */}
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
          title="Add reaction"
        >
          {showEmojiPicker ? (
            <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          ) : (
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          )}
        </button>

        {/* Quick Emoji Picker */}
        {showEmojiPicker && (
          <div style={{
  position: 'absolute',
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              {quickReactions.map((emoji, index) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    animation: `reactionPop 0.3s ease-out ${index * 0.05}s both`
                  }}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* More button */}
            <div className="mt-2 pt-2 border-t border-secondary/30">
              <button
                onClick={() => {
                  // This would open the full emoji picker
                  setShowEmojiPicker(false)
                }}
                style={{
  width: '100%',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
              >
                More emojis...
              </button>
            </div>
          </div>
        )}

        {/* Overlay to close picker */}
        {showEmojiPicker && (
          <div
            style={{
  position: 'fixed'
}}
            onClick={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes reactionPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(10px);
          }
          80% {
            transform: scale(1.1) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}



export default MessageReactions