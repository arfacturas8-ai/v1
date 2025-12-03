import React, { useState, useEffect } from 'react'
import { 
  Star, Award, Crown, Heart, Flame, Zap, Trophy, Gift,
  Sparkles, Target, Shield, Rocket, Brain, ThumbsUp,
  Coffee, Gem, Music, Camera, Code, Lightbulb, X
} from 'lucide-react'

const EnhancedAwardSystem = ({ 
  post, 
  isOpen, 
  onClose, 
  onAward, 
  userCoins = 0,
  userPremium = false 
}) => {
  const [selectedAward, setSelectedAward] = useState(null)
  const [awardMessage, setAwardMessage] = useState('')
  const [isGiving, setIsGiving] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [customAwards, setCustomAwards] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchCustomAwards()
    }
  }, [isOpen])

  const fetchCustomAwards = async () => {
    try {
      const response = await fetch(`/api/communities/${post.community}/awards`)
      if (response.ok) {
        const awards = await response.json()
        setCustomAwards(awards)
      }
    } catch (error) {
      console.error('Failed to fetch custom awards:', error)
    }
  }

  const standardAwards = [
    {
      id: 'silver',
      name: 'Silver Award',
      description: 'Shows the post deserves recognition',
      icon: '🥈',
      cost: 100,
      karmaValue: 25,
      isPremium: false,
      animation: 'bounce'
    },
    {
      id: 'gold',
      name: 'Gold Award',
      description: 'Gives the author a week of CRYB Premium and 100 coins',
      icon: '🥇',
      cost: 500,
      karmaValue: 100,
      isPremium: false,
      animation: 'shine',
      benefits: ['1 week Premium', '100 coins']
    },
    {
      id: 'platinum',
      name: 'Platinum Award',
      description: 'Gives the author a month of CRYB Premium and 700 coins',
      icon: '💎',
      cost: 1800,
      karmaValue: 250,
      isPremium: true,
      animation: 'sparkle',
      benefits: ['1 month Premium', '700 coins']
    },
    {
      id: 'helpful',
      name: 'Helpful Award',
      description: 'When you want to show your appreciation',
      icon: '💙',
      cost: 150,
      karmaValue: 50,
      isPremium: false,
      animation: 'pulse'
    },
    {
      id: 'wholesome',
      name: 'Wholesome Award',
      description: 'When you come across a feel-good thing',
      icon: '🤍',
      cost: 125,
      karmaValue: 30,
      isPremium: false,
      animation: 'glow'
    },
    {
      id: 'rocket',
      name: 'Rocket Like',
      description: 'When an upvote just isn\'t enough',
      icon: '🚀',
      cost: 200,
      karmaValue: 75,
      isPremium: false,
      animation: 'rocket'
    },
    {
      id: 'fire',
      name: 'Fire Award',
      description: 'For when something is absolutely fire',
      icon: '🔥',
      cost: 300,
      karmaValue: 80,
      isPremium: false,
      animation: 'fire'
    },
    {
      id: 'mind_blown',
      name: 'Mind Blown',
      description: 'When your mind is completely blown',
      icon: '🤯',
      cost: 250,
      karmaValue: 60,
      isPremium: false,
      animation: 'explode'
    },
    {
      id: 'all_seeing_eye',
      name: 'All-Seeing Upvote',
      description: 'A glittering stamp for a Golden Person',
      icon: '👁️',
      cost: 1000,
      karmaValue: 200,
      isPremium: true,
      animation: 'mystical'
    },
    {
      id: 'argentium',
      name: 'Argentium',
      description: 'The ultra rare Argentium Award',
      icon: '⚡',
      cost: 20000,
      karmaValue: 2500,
      isPremium: true,
      animation: 'legendary',
      benefits: ['3 months Premium', '2500 coins']
    }
  ]

  const handleAwardGive = async () => {
    if (!selectedAward || isGiving) return

    if (userCoins < selectedAward.cost) {
      alert('Not enough coins to give this award')
      return
    }

    setIsGiving(true)
    setShowAnimation(true)

    try {
      const awardData = {
        postId: post.id,
        awardType: selectedAward.id,
        message: awardMessage,
        cost: selectedAward.cost,
        karmaValue: selectedAward.karmaValue,
        timestamp: Date.now()
      }

      await onAward(awardData)
      
      // Show success animation
      setTimeout(() => {
        setShowAnimation(false)
        onClose()
        setSelectedAward(null)
        setAwardMessage('')
      }, 2000)

    } catch (error) {
      console.error('Failed to give award:', error)
      setShowAnimation(false)
    } finally {
      setIsGiving(false)
    }
  }

  const getAwardsByCategory = () => {
    const affordable = standardAwards.filter(award => award.cost <= userCoins)
    const premium = standardAwards.filter(award => award.isPremium && userPremium)
    const custom = customAwards.filter(award => award.cost <= userCoins)

    return { affordable, premium, custom }
  }

  const { affordable, premium, custom } = getAwardsByCategory()

  const AwardCard = ({ award, category = 'standard' }) => {
    const canAfford = userCoins >= award.cost
    const canGive = canAfford && (!award.isPremium || userPremium)

    return (
      <div
        style={{
  position: 'relative',
  padding: '16px',
  borderRadius: '12px'
}}
        onClick={() => canGive && setSelectedAward(award)}
      >
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  position: 'relative'
}}>
            {award.icon}
            {award.isPremium && (
              <Crown style={{
  position: 'absolute',
  width: '12px',
  height: '12px'
}} />
            )}
          </div>
          <h3 style={{
  fontWeight: '600'
}}>{award.name}</h3>
          <p className="text-xs text-muted/70 mb-2 line-clamp-2">{award.description}</p>
          
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
              <span style={{
  fontWeight: '500'
}}>{award.cost}</span>
            </div>
          </div>

          {award.benefits && (
            <div className="text-xs text-accent/80 mb-2">
              {award.benefits.map((benefit, i) => (
                <div key={i}>+ {benefit}</div>
              ))}
            </div>
          )}

          <div style={{
  fontWeight: '500'
}}>
            +{award.karmaValue} karma
          </div>
        </div>

        {!canAfford && (
          <div style={{
  position: 'absolute',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <span style={{
  fontWeight: '500'
}}>Need {award.cost - userCoins} more coins</span>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  width: '100%'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <Gift style={{
  width: '24px',
  height: '24px'
}} />
              <div>
                <h2 style={{
  fontWeight: 'bold'
}}>Give Award</h2>
                <p style={{
  color: '#A0A0A0'
}}>Show appreciation for this post</p>
              </div>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%'
}}>
                <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
                <span style={{
  fontWeight: '500'
}}>{userCoins.toLocaleString()}</span>
              </div>
              <button onClick={onClose} style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                <X style={{
  width: '20px',
  height: '20px'
}} />
              </button>
            </div>
          </div>
        </div>

        <div style={{
  padding: '24px'
}}>
          {/* Award Categories */}
          <div className="space-y-6">
            {/* Affordable Awards */}
            {affordable.length > 0 && (
              <div>
                <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <Star style={{
  width: '20px',
  height: '20px'
}} />
                  Available Awards
                </h3>
                <div style={{
  display: 'grid',
  gap: '16px'
}}>
                  {affordable.map(award => (
                    <AwardCard key={award.id} award={award} category="affordable" />
                  ))}
                </div>
              </div>
            )}

            {/* Premium Awards */}
            {premium.length > 0 && userPremium && (
              <div>
                <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <Crown style={{
  width: '20px',
  height: '20px'
}} />
                  Premium Awards
                </h3>
                <div style={{
  display: 'grid',
  gap: '16px'
}}>
                  {premium.map(award => (
                    <AwardCard key={award.id} award={award} category="premium" />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Community Awards */}
            {custom.length > 0 && (
              <div>
                <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <Shield style={{
  width: '20px',
  height: '20px'
}} />
                  c/{post.community} Awards
                </h3>
                <div style={{
  display: 'grid',
  gap: '16px'
}}>
                  {custom.map(award => (
                    <AwardCard key={award.id} award={award} category="custom" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Award Details */}
          {selectedAward && (
            <div style={{
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
                <div className="text-4xl">{selectedAward.icon}</div>
                <div style={{
  flex: '1'
}}>
                  <h4 style={{
  fontWeight: '600'
}}>{selectedAward.name}</h4>
                  <p className="text-muted/70 mb-3">{selectedAward.description}</p>
                  
                  {/* Optional Message */}
                  <div className="mb-4">
                    <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                      Add a message (optional)
                    </label>
                    <textarea
                      value={awardMessage}
                      onChange={(e) => setAwardMessage(e.target.value)}
                      placeholder="Say something nice..."
                      style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                      rows={3}
                      maxLength={200}
                    />
                    <div className="text-xs text-muted/60 mt-1">
                      {awardMessage.length}/200 characters
                    </div>
                  </div>

                  {/* Award Details */}
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
                      <span>Cost: {selectedAward.cost}</span>
                    </div>
                    <div className="text-green-500">
                      +{selectedAward.karmaValue} karma to author
                    </div>
                    {selectedAward.benefits && (
                      <div className="text-accent/80">
                        {selectedAward.benefits.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
                <button
                  onClick={handleAwardGive}
                  disabled={isGiving}
                  style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#ffffff'
}}
                >
                  {isGiving ? 'Giving Award...' : `Give Award (${selectedAward.cost} coins)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Animation */}
      {showAnimation && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div className="text-6xl animate-bounce">
            {selectedAward?.icon}
          </div>
        </div>
      )}
    </div>
  )
}



export default EnhancedAwardSystem