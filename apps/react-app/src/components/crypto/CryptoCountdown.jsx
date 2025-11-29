import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Zap } from 'lucide-react'

function CryptoCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isClient, setIsClient] = useState(false)

  // Launch date - approximately 3 months from now
  const launchDate = new Date()
  launchDate.setMonth(launchDate.getMonth() + 3)
  launchDate.setHours(0, 0, 0, 0) // Set to midnight for clean countdown

  useEffect(() => {
    setIsClient(true)
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const distance = launchDate.getTime() - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      }
    }

    calculateTimeLeft() // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  const milestones = [
    {
      phase: 'Phase 1',
      title: 'Wallet Integration',
      description: 'Connect your favorite Web3 wallets',
      status: 'upcoming',
      date: 'Q1 2024'
    },
    {
      phase: 'Phase 2',
      title: 'NFT Features',
      description: 'Profile pictures and collection showcase',
      status: 'upcoming',
      date: 'Q2 2024'
    },
    {
      phase: 'Phase 3',
      title: 'Crypto Payments',
      description: 'Send and receive cryptocurrency',
      status: 'upcoming',
      date: 'Q2 2024'
    },
    {
      phase: 'Phase 4',
      title: 'Token Gating & DAO',
      description: 'Exclusive communities and governance',
      status: 'upcoming',
      date: 'Q3 2024'
    }
  ]

  if (!isClient) {
    return (
      <div style={{
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <Clock style={{
  height: '20px',
  width: '20px'
}} />
            <span style={{
  fontWeight: '600'
}}>Launch Timeline</span>
          </div>
          <div className="text-muted">Loading countdown...</div>
        </div>
      </div>
    )
  }

  const timeBlocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ]

  return (
    <div style={{
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
      {/* Countdown Timer */}
      <div style={{
  textAlign: 'center'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <Clock style={{
  height: '20px',
  width: '20px'
}} />
          <span style={{
  fontWeight: '600'
}}>Launch Countdown</span>
        </div>

        <div style={{
  display: 'grid'
}}>
          {timeBlocks.map((block, index) => (
            <div key={block.label} style={{
  borderRadius: '12px'
}}>
              <div style={{
  fontWeight: 'bold'
}}>
                {block.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm text-muted uppercase tracking-wide">
                {block.label}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-secondary mt-lg">
          Until Web3 features launch
        </p>
      </div>

      {/* Launch Milestones - Mobile */}
      <div className="md:hidden">
        <h3 style={{
  fontWeight: '600',
  textAlign: 'center'
}}>Roadmap</h3>
        <div className="space-y-md">
          {milestones.map((milestone, index) => (
            <div key={index} style={{
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Zap style={{
  height: '16px',
  width: '16px'
}} />
                </div>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <span style={{
  fontWeight: '500'
}}>{milestone.phase}</span>
                    <span className="text-xs text-muted">• {milestone.date}</span>
                  </div>
                  <h4 style={{
  fontWeight: '600'
}}>{milestone.title}</h4>
                  <p className="text-xs text-secondary">{milestone.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Milestones - Desktop & Tablet */}
      <div style={{
  display: 'none'
}}>
        <h3 style={{
  fontWeight: '600',
  textAlign: 'center'
}}>Development Roadmap</h3>
        
        <div style={{
  position: 'relative'
}}>
          {/* Timeline Line */}
          <div style={{
  position: 'absolute'
}}></div>
          
          <div style={{
  display: 'grid',
  position: 'relative'
}}>
            {milestones.map((milestone, index) => (
              <div key={index} style={{
  position: 'relative'
}}>
                {/* Timeline Node */}
                <div style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
                
                {/* Milestone Card */}
                <div style={{
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                  <div style={{
  textAlign: 'center'
}}>
                    <div style={{
  display: 'inline-flex',
  borderRadius: '12px'
}}>
                      <Zap style={{
  height: '20px',
  width: '20px'
}} />
                    </div>
                    
                    <div style={{
  fontWeight: '500'
}}>
                      {milestone.phase}
                    </div>
                    
                    <h4 style={{
  fontWeight: '600'
}}>
                      {milestone.title}
                    </h4>
                    
                    <p className="text-sm text-secondary mb-md">
                      {milestone.description}
                    </p>
                    
                    <div style={{
  display: 'inline-flex',
  borderRadius: '50%'
}}>
                      <Calendar style={{
  height: '12px',
  width: '12px'
}} />
                      <span className="text-xs text-accent-light">{milestone.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{
  textAlign: 'center'
}}>
        <div style={{
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '50%'
}}>
          <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
          <span className="text-sm text-secondary">Development in progress</span>
        </div>
      </div>
    </div>
  )
}




export default CryptoCountdown
