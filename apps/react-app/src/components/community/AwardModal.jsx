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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '640px' : '576px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderBottom: '1px solid #E8EAED'
        }}>
          <h3 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: '#1A1A1A',
            margin: 0
          }}>
            Give Award
          </h3>
          <button
            onClick={onClose}
            style={{
              minHeight: '40px',
              minWidth: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              color: '#666666'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <div style={{
          padding: isMobile ? '16px 20px' : '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* User Coins Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '12px',
            background: '#F8F9FA',
            border: '1px solid #E8EAED'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🪙</span>
              <span style={{
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: '600',
                color: '#1A1A1A'
              }}>
                Your Coins
              </span>
            </div>
            <span style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: '700',
              color: '#1A1A1A'
            }}>
              {userCoins.toLocaleString()}
            </span>
          </div>

          {/* Post Preview */}
          <div style={{
            padding: '16px',
            border: '1px solid #E8EAED',
            borderRadius: '12px',
            background: '#F8F9FA'
          }}>
            <h4 style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: '4px',
              margin: 0
            }}>
              {post.title}
            </h4>
            <p style={{
              fontSize: '13px',
              color: '#666666',
              margin: 0
            }}>
              c/{post.community} • u/{post.author}
            </p>
          </div>

          {/* Awards Grid */}
          <div>
            <h4 style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: '12px',
              margin: 0
            }}>
              Choose an Award
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px'
            }}>
              {awards.map((award) => {
                const canAfford = userCoins >= award.cost
                const isSelected = selectedAward?.id === award.id

                return (
                  <button
                    key={award.id}
                    onClick={() => canAfford && setSelectedAward(award)}
                    disabled={!canAfford}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      border: isSelected ? '2px solid #58a6ff' : '1px solid #E8EAED',
                      borderRadius: '12px',
                      minHeight: '48px',
                      background: isSelected ? 'rgba(88, 166, 255, 0.1)' : '#FFFFFF',
                      cursor: !canAfford ? 'not-allowed' : 'pointer',
                      opacity: !canAfford ? 0.5 : 1,
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (canAfford && !isSelected) {
                        e.currentTarget.style.borderColor = '#CCCCCC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canAfford && !isSelected) {
                        e.currentTarget.style.borderColor = '#E8EAED';
                      }
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontSize: '32px' }}>{award.emoji}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <h5 style={{
                          fontSize: isMobile ? '14px' : '15px',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: 0
                        }}>
                          {award.name}
                        </h5>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: '14px' }}>🪙</span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1A1A1A'
                          }}>
                            {award.cost}
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: '13px',
                        color: '#666666',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        margin: '0 0 8px 0'
                      }}>
                        {award.description}
                      </p>

                      {award.premium && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            fontWeight: '600'
                          }}>
                            Premium
                          </span>
                        </div>
                      )}

                      {!canAfford && (
                        <p style={{
                          fontSize: '12px',
                          color: '#EF4444',
                          marginTop: '4px',
                          margin: '4px 0 0 0'
                        }}>
                          Insufficient coins
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <div style={{ flexShrink: 0, color: '#58a6ff' }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
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
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(88, 166, 255, 0.1)',
              border: '1px solid rgba(88, 166, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>{selectedAward.emoji}</span>
                <div>
                  <h5 style={{
                    fontSize: isMobile ? '14px' : '15px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {selectedAward.name}
                  </h5>
                  <p style={{
                    fontSize: '13px',
                    color: '#666666',
                    margin: 0
                  }}>
                    Cost: 🪙 {selectedAward.cost} coins
                  </p>
                </div>
              </div>

              <p style={{
                fontSize: '13px',
                color: '#666666',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>
                {selectedAward.description}
              </p>

              {selectedAward.premium && (
                <div style={{
                  fontSize: '13px',
                  color: '#58a6ff',
                  marginBottom: '12px'
                }}>
                  ✨ This award includes CRYB Premium benefits
                </div>
              )}

              <div style={{
                fontSize: '13px',
                color: '#666666'
              }}>
                Remaining coins after purchase: 🪙 {(userCoins - selectedAward.cost).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          justifyContent: 'flex-end',
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderTop: '1px solid #E8EAED'
        }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              minHeight: '48px',
              padding: '12px 20px',
              fontSize: isMobile ? '14px' : '15px',
              borderRadius: '12px',
              background: '#F8F9FA',
              border: '1px solid #E8EAED',
              color: '#666666',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#F0F2F5')}
            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#F8F9FA')}
          >
            Cancel
          </button>
          <button
            onClick={handleAwardSubmit}
            disabled={!selectedAward || isSubmitting}
            style={{
              minHeight: '48px',
              padding: '12px 20px',
              fontSize: isMobile ? '14px' : '15px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: '600',
              cursor: !selectedAward || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: !selectedAward || isSubmitting ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedAward && !isSubmitting) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAward && !isSubmitting) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isSubmitting ? (
              <>
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