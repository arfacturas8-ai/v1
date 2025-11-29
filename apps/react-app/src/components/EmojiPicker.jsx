import React, { useState, useRef, useEffect } from 'react'
import EmojiPickerReact from 'emoji-picker-react'
import { Smile } from 'lucide-react'

function EmojiPicker({ 
  onEmojiSelect, 
  position = 'bottom', 
  isMobile = false,
  showButton = true,
  isOpen: controlledIsOpen = null,
  onToggle = null
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const pickerRef = useRef(null)
  const buttonRef = useRef(null)
  
  const isOpen = controlledIsOpen !== null ? controlledIsOpen : internalIsOpen
  const setIsOpen = controlledIsOpen !== null ? onToggle : setInternalIsOpen

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiClick = (emojiObject) => {
    onEmojiSelect(emojiObject.emoji)
    setIsOpen(false)
    
    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  const togglePicker = () => {
    setIsOpen(!isOpen)
  }

  // Quick emoji reactions for mobile
  const quickEmojis = ['😀', '😂', '😍', '👍', '❤️', '🔥', '👏', '💯']
  
  return (
    <div style={{
  position: 'relative'
}}>
      {/* Emoji button */}
      {showButton && (
        <button
          ref={buttonRef}
          onClick={togglePicker}
          style={{
  color: '#c9d1d9',
  borderRadius: '12px',
  position: 'relative'
}}
          title="Add emoji"
        >
          <Smile size={isMobile ? 22 : 20} className="transition-transform group-hover:scale-110" />
          {isOpen && (
            <div style={{
  position: 'absolute',
  borderRadius: '12px'
}}></div>
          )}
        </button>
      )}

      {/* Quick emoji bar for mobile */}
      {isMobile && isOpen && (
        <div style={{
  position: 'fixed'
}}>
          <div style={{
            padding: '24px',
            background: 'rgba(var(--color-neutral-50), 0.95)',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Header */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <h3 style={{
  color: '#ffffff',
  fontWeight: '600'
}}>Quick Reactions</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
  padding: '8px',
  borderRadius: '12px'
}}
              >
                <svg style={{
  width: '24px',
  height: '24px',
  color: '#ffffff'
}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Quick emoji grid */}
            <div style={{
  display: 'grid',
  gap: '12px'
}}>
              {quickEmojis.map((emoji, index) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick({ emoji })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    animation: `emojiPop 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Full picker toggle */}
            <button
              onClick={() => {
                // Show full picker in a modal
              }}
              style={{
  width: '100%',
  paddingTop: '16px',
  paddingBottom: '16px',
  color: '#ffffff',
  borderRadius: '24px',
  fontWeight: '600'
}}
            >
              <span style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <span>More Emojis</span>
                <svg style={{
  width: '20px',
  height: '20px'
}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop emoji picker */}
      {!isMobile && isOpen && (
        <div
          ref={pickerRef}
          style={{
  position: 'absolute'
}}
        >
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Custom header */}
            <div style={{
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Pick an emoji</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
  borderRadius: '12px'
}}
                >
                  <svg style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <EmojiPickerReact
              onEmojiClick={handleEmojiClick}
              theme="dark"
              searchDisabled={false}
              skinTonesDisabled={false}
              width={400}
              height={450}
              previewConfig={{
                showPreview: false
              }}
              searchPlaceholder="Search emojis..."
              emojiStyle="native"
              lazyLoadEmojis={true}
              categories={[
                {
                  name: 'Smileys & People',
                  category: 'smileys_people'
                },
                {
                  name: 'Animals & Nature',
                  category: 'animals_nature'
                },
                {
                  name: 'Food & Drink',
                  category: 'food_drink'
                },
                {
                  name: 'Activities',
                  category: 'activities'
                },
                {
                  name: 'Travel & Places',
                  category: 'travel_places'
                },
                {
                  name: 'Objects',
                  category: 'objects'
                },
                {
                  name: 'Symbols',
                  category: 'symbols'
                },
                {
                  name: 'Flags',
                  category: 'flags'
                }
              ]}
            />
          </div>
        </div>
      )}
      
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          style={{
  position: 'fixed'
}}
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        @keyframes emojiPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          80% {
            transform: scale(1.1) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}



export default EmojiPicker