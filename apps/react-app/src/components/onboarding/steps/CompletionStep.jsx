import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { useOnboarding } from '../../../contexts/OnboardingContext'

const CompletionStep = ({ onComplete }) => {
  const { user } = useAuth()
  const { userProgress, getAvailableTutorials } = useOnboarding()
  const [rewards, setRewards] = useState({
    tokens: 100, // Welcome bonus
    achievements: ['Welcome to CRYB', 'Profile Setup Master'],
    nextSteps: []
  })
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Award completion tokens
    awardWelcomeBonus()
    setShowConfetti(true)
    
    // Stop confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const awardWelcomeBonus = async () => {
    try {
      await fetch('/api/user/award-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: 100,
          reason: 'Welcome bonus for completing onboarding'
        })
      })
    } catch (error) {
      console.error('Failed to award welcome bonus:', error)
    }
  }

  const availableTutorials = getAvailableTutorials()

  return (
    <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px',
  position: 'relative'
}}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div style={{
  position: 'absolute',
  overflow: 'hidden'
}}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 20 + 10}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            >
              {['🎉', '🎊', '⭐', '✨', '🎯', '🏆'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>
          Congratulations, {user?.username}!
        </h3>
        <p style={{
  color: '#c9d1d9'
}}>
          You've successfully completed the CRYB onboarding process. 
          Welcome to our amazing community!
        </p>
      </div>

      {/* Rewards Summary */}
      <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
        <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>Your Welcome Rewards</h4>
        
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <div className="text-2xl mb-2">💰</div>
            <div style={{
  fontWeight: '600'
}}>{rewards.tokens} CRYB</div>
            <div style={{
  color: '#c9d1d9'
}}>Welcome Bonus</div>
          </div>
          
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <div className="text-2xl mb-2">🏆</div>
            <div style={{
  fontWeight: '600'
}}>{userProgress.achievements.length}</div>
            <div style={{
  color: '#c9d1d9'
}}>Achievements Earned</div>
          </div>
          
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <div className="text-2xl mb-2">📚</div>
            <div style={{
  fontWeight: '600'
}}>{availableTutorials.length}</div>
            <div style={{
  color: '#c9d1d9'
}}>Tutorials Available</div>
          </div>
        </div>

        <div style={{
  color: '#c9d1d9'
}}>
          Keep earning CRYB tokens by participating in communities, creating posts, and helping others!
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
  display: 'grid',
  gap: '24px'
}}>
        <div style={{
  padding: '24px',
  borderRadius: '12px',
  textAlign: 'left'
}}>
          <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9',
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-2xl mr-2">🎯</span>
            Recommended Next Steps
          </h4>
          <ul style={{
  color: '#c9d1d9'
}}>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500 mr-2">✓</span>
              Explore communities and join ones you like
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500 mr-2">✓</span>
              Create your first post to introduce yourself
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500 mr-2">✓</span>
              Try voice chat in a community room
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500 mr-2">✓</span>
              Connect your crypto wallet for token rewards
            </li>
          </ul>
        </div>

        <div style={{
  padding: '24px',
  borderRadius: '12px',
  textAlign: 'left'
}}>
          <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9',
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-2xl mr-2">📚</span>
            Available Tutorials
          </h4>
          <div className="space-y-2 text-sm">
            {availableTutorials.slice(0, 4).map(tutorial => (
              <div key={tutorial.id} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span style={{
  color: '#c9d1d9'
}}>{tutorial.title}</span>
                <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                  +{tutorial.reward} CRYB
                </span>
              </div>
            ))}
            {availableTutorials.length > 4 && (
              <div style={{
  color: '#c9d1d9'
}}>
                +{availableTutorials.length - 4} more tutorials available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Guidelines Reminder */}
      <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '24px',
  borderRadius: '12px'
}}>
        <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>Remember Our Community Values</h4>
        <div style={{
  display: 'grid',
  gap: '16px',
  color: '#c9d1d9'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-xl mb-1">🤝</div>
            <div style={{
  fontWeight: '500'
}}>Be Respectful</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-xl mb-1">💡</div>
            <div style={{
  fontWeight: '500'
}}>Share Knowledge</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-xl mb-1">🌟</div>
            <div style={{
  fontWeight: '500'
}}>Stay Positive</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-xl mb-1">🔒</div>
            <div style={{
  fontWeight: '500'
}}>Keep It Safe</div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="mb-8">
        <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>Stay Connected</h4>
        <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
          <a
            href="https://twitter.com/cryb_platform"
            target="_blank"
            rel="noopener noreferrer"
            style={{
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
          >
            <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            <span>Twitter</span>
          </a>
          
          <a
            href="https://community.cryb.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
          >
            <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Community</span>
          </a>

          <a
            href="https://support.cryb.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
          >
            <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <span>Support</span>
          </a>
        </div>
      </div>

      <div style={{
  textAlign: 'center'
}}>
        <button
          onClick={onComplete}
          style={{
  paddingLeft: '32px',
  paddingRight: '32px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  fontWeight: '600',
  borderRadius: '12px'
}}
        >
          Start Exploring CRYB! 🚀
        </button>
        
        <p style={{
  color: '#c9d1d9'
}}>
          Need help? Check out our <a href="/help" className="text-blue-600 hover:underline">Help Center</a> or 
          ask questions in the <a href="/communities/help" className="text-blue-600 hover:underline">Help Community</a>
        </p>
      </div>
    </div>
  )
}




export default CompletionStep
