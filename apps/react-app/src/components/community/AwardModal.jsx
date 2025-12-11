import React, { useState, useRef, useEffect } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

const AwardModal = ({ post, onClose, onAward }) => {
  const { isMobile, isTablet } = useResponsive()
  const [selectedAward, setSelectedAward] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const awards = [
    {
      id: 'silver',
      name: 'Silver Award',
      emoji: '🥈',
      description: 'Shows appreciation with a silver medal',
      cost: 100,
      color: 'text-gray-400'
    },
    {
      id: 'gold',
      name: 'Gold Award', 
      emoji: '🥇',
      description: 'Gives the recipient 1 week of Premium and 100 coins',
      cost: 500,
      color: 'text-yellow-500',
      premium: true
    },
    {
      id: 'platinum',
      name: 'Platinum Award',
      emoji: '💎',
      description: 'Gives the recipient 1 month of Premium and 700 coins',
      cost: 1800,
      color: 'text-cyan-400',
      premium: true
    },
    {
      id: 'wholesome',
      name: 'Wholesome',
      emoji: '💖',
      description: 'When you come across a feel-good thing',
      cost: 125,
      color: 'text-pink-500'
    },
    {
      id: 'helpful',
      name: 'Helpful',
      emoji: '🤝',
      description: 'Thank you stranger!',
      cost: 125,
      color: 'text-green-500'
    },
    {
      id: 'rocket',
      name: 'Rocket Like',
      emoji: '🚀',
      description: 'When an upvote just isn\'t enough',
      cost: 150,
      color: 'text-orange-500'
    },
    {
      id: 'fire',
      name: 'Fire',
      emoji: '🔥',
      description: 'This is lit!',
      cost: 200,
      color: 'text-red-500'
    },
    {
      id: 'mind_blown',
      name: 'Mind Blown',
      emoji: '🤯',
      description: 'When you\'re speechless',
      cost: 175,
      color: 'text-purple-500'
    }
  ]

  const handleAwardSubmit = async () => {
    if (!selectedAward || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAward?.(post.id, selectedAward.id)
      onClose()
    } catch (error) {
      console.error('Failed to give award:', error)
      // Could show error toast here
    } finally {
      setIsSubmitting(false)
    }
  }

  const userCoins = 1250 // This would come from user context/API

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50" onClick={onClose}>
      <div
        ref={modalRef}
        className="w-full max-w-lg sm:max-w-xl rounded-2xl bg-gray-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-semibold">Give Award</h3>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* User Coins Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <span className="text-sm sm:text-base font-medium">Your Coins</span>
            </div>
            <span className="text-sm sm:text-base font-bold">{userCoins.toLocaleString()}</span>
          </div>

          {/* Post Preview */}
          <div className="p-3 border border-white/10 rounded-xl">
            <h4 className="text-sm sm:text-base font-medium mb-1">
              {post.title}
            </h4>
            <p className="text-xs text-muted">
              c/{post.community} • u/{post.author}
            </p>
          </div>

          {/* Awards Grid */}
          <div>
            <h4 className="text-sm sm:text-base font-medium mb-3">Choose an Award</h4>
            <div className="grid grid-cols-1 gap-3">
              {awards.map((award) => {
                const canAfford = userCoins >= award.cost
                const isSelected = selectedAward?.id === award.id

                return (
                  <button
                    key={award.id}
                    onClick={() => canAfford && setSelectedAward(award)}
                    disabled={!canAfford}
                    className={`flex items-start gap-3 p-3 border rounded-xl min-h-[44px] transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 hover:border-white/20'
                    } ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{award.emoji}</span>
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm sm:text-base font-medium">
                          {award.name}
                        </h5>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-sm">🪙</span>
                          <span className="text-sm font-medium">{award.cost}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted line-clamp-2 mb-2">
                        {award.description}
                      </p>

                      {award.premium && (
                        <div className="flex items-center">
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Premium</span>
                        </div>
                      )}

                      {!canAfford && (
                        <p className="text-xs text-red-400 mt-1">
                          Insufficient coins
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0 text-blue-500">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Award Summary */}
          {selectedAward && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{selectedAward.emoji}</span>
                <div>
                  <h5 className="text-sm sm:text-base font-medium">{selectedAward.name}</h5>
                  <p className="text-xs text-muted">
                    Cost: 🪙 {selectedAward.cost} coins
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-300 mb-2">
                {selectedAward.description}
              </p>

              {selectedAward.premium && (
                <div className="text-xs text-blue-400 mb-2">
                  ✨ This award includes CRYB Premium benefits
                </div>
              )}

              <div className="text-xs text-muted">
                Remaining coins after purchase: 🪙 {(userCoins - selectedAward.cost).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end px-4 sm:px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm sm:text-base rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleAwardSubmit}
            disabled={!selectedAward || isSubmitting}
            className="min-h-[44px] px-4 py-2 text-sm sm:text-base rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full  mr-2" />
                Giving Award...
              </>
            ) : (
              <>
                Give Award 🪙 {selectedAward?.cost || 0}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}



export default AwardModal