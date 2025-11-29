import React, { useState } from 'react'
import { 
  Reply, MoreHorizontal, Edit3, Trash2, Copy, Pin, 
  ThumbsUp, Heart, Laugh, Angry, Frown 
} from 'lucide-react'

const MessageActions = ({ 
  message,
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onCopy,
  className = '',
  position = 'top-right' // top-right, top-left, bottom-right, bottom-left
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false)

  const quickReactions = [
    { emoji: '👍', icon: ThumbsUp, label: 'Thumbs up' },
    { emoji: '❤️', icon: Heart, label: 'Love' },
    { emoji: '😂', icon: Laugh, label: 'Laugh' },
    { emoji: '😮', icon: Heart, label: 'Surprised' },
    { emoji: '😢', icon: Frown, label: 'Sad' },
    { emoji: '😠', icon: Angry, label: 'Angry' }
  ]

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0 -translate-y-full -translate-x-4'
      case 'top-right':
        return 'top-0 right-0 -translate-y-full translate-x-4'
      case 'bottom-left':
        return 'bottom-0 left-0 translate-y-full -translate-x-4'
      case 'bottom-right':
        return 'bottom-0 right-0 translate-y-full translate-x-4'
      default:
        return 'top-0 right-0 -translate-y-full translate-x-4'
    }
  }

  const handleQuickReaction = (emoji) => {
    onReact(message.id, emoji)
  }

  const handleAction = (action) => {
    setShowMoreActions(false)
    action()
  }

  return (
    <div style={{
  position: 'absolute'
}}>
      {/* Main Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '4px',
          background: 'rgba(21, 21, 23, 0.95)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Quick Reactions */}
        {quickReactions.slice(0, 3).map(({ emoji, icon: Icon, label }, index) => (
          <button
            key={emoji}
            onClick={() => handleQuickReaction(emoji)}
            style={{
              padding: '8px',
              borderRadius: '12px',
              animation: `actionPop 0.2s ease-out ${index * 0.05}s both`
            }}
            title={`React with ${label}`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">
              {emoji}
            </span>
          </button>
        ))}

        {/* Divider */}
        <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}}></div>

        {/* Reply Button */}
        <button
          onClick={() => onReply(message)}
          style={{
  padding: '8px',
  borderRadius: '12px'
}}
          title="Reply to message"
        >
          <Reply size={16} className="text-tertiary group-hover:text-accent-cyan transition-colors" />
        </button>

        {/* More Actions */}
        <div style={{
  position: 'relative'
}}>
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            style={{
  padding: '8px',
  borderRadius: '12px'
}}
            title="More actions"
          >
            <MoreHorizontal size={16} className="text-tertiary group-hover:text-primary transition-colors" />
          </button>

          {/* More Actions Dropdown */}
          {showMoreActions && (
            <div
              style={{
                position: 'absolute',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px',
                background: 'rgba(21, 21, 23, 0.95)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* More Reactions */}
              <div className="mb-2 pb-2 border-b border-secondary/30">
                <div style={{
  fontWeight: '500',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>React</div>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  {quickReactions.slice(3).map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      onClick={() => handleAction(() => handleQuickReaction(emoji))}
                      style={{
  borderRadius: '12px'
}}
                      title={`React with ${label}`}
                    >
                      <span className="text-sm">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Copy Message */}
              <button
                onClick={() => handleAction(() => onCopy(message.content))}
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
              >
                <Copy size={14} className="text-tertiary" />
                <span className="text-primary">Copy Message</span>
              </button>

              {/* Pin Message */}
              <button
                onClick={() => handleAction(() => onPin(message))}
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
              >
                <Pin size={14} className="text-tertiary" />
                <span className="text-primary">Pin Message</span>
              </button>

              {/* Own Message Actions */}
              {isOwnMessage && (
                <>
                  <div style={{
  marginTop: '8px',
  marginBottom: '8px'
}}></div>
                  
                  <button
                    onClick={() => handleAction(() => onEdit(message))}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
                  >
                    <Edit3 size={14} className="text-tertiary" />
                    <span className="text-primary">Edit Message</span>
                  </button>

                  <button
                    onClick={() => handleAction(() => onDelete(message))}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
                  >
                    <Trash2 size={14} className="text-error" />
                    <span className="text-error">Delete Message</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close overlay */}
      {showMoreActions && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={() => setShowMoreActions(false)}
        />
      )}

      <style jsx>{`
        @keyframes actionPop {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(5px);
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



export default MessageActions