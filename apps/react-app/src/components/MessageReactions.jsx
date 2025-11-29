import React from 'react'
import { Plus } from 'lucide-react'

function MessageReactions({ reactions = {}, onAddReaction, onRemoveReaction, currentUserId }) {
  const reactionEntries = Object.entries(reactions)
  
  if (reactionEntries.length === 0) {
    return null
  }

  const handleReactionClick = (emoji) => {
    const reaction = reactions[emoji]
    const hasReacted = reaction.users.includes(currentUserId)
    
    if (hasReacted) {
      onRemoveReaction(emoji)
    } else {
      onAddReaction(emoji)
    }
  }

  return (
    <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
}}>
      {reactionEntries.map(([emoji, reaction]) => {
        const hasReacted = reaction.users.includes(currentUserId)
        const count = reaction.count
        
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff'
}}
            title={`${reaction.users.length} reaction${reaction.users.length !== 1 ? 's' : ''}`}
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-xs">{count}</span>
          </button>
        )
      })}
      
      <button
        onClick={() => onAddReaction()}
        style={{
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
        title="Add reaction"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}



export default MessageReactions