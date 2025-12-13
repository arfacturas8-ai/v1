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
      <div className="card" style={{ borderRadius: 'var(--radius-2xl)', border: `1px solid var(--border-subtle)`, padding: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Clock style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)', color: 'var(--brand-primary)' }} />
            <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>Launch Timeline</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading countdown...</div>
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
    <div className="card" style={{ borderRadius: 'var(--radius-2xl)', border: `1px solid var(--border-subtle)`, padding: 'var(--space-6)' }}>
      {/* Countdown Timer */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Clock style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)', color: 'var(--brand-primary)' }} />
          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Launch Countdown</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {timeBlocks.map((block, index) => (
            <div key={block.label} className="card-elevated" style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', background: 'var(--bg-gradient-subtle)' }}>
              <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                {block.value.toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {block.label}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Until Web3 features launch
        </p>
      </div>

      {/* Launch Milestones - Mobile */}
      <div className="show-mobile-only" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 'var(--font-semibold)', textAlign: 'center', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Roadmap</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {milestones.map((milestone, index) => (
            <div key={index} className="card" style={{ borderRadius: 'var(--radius-lg)', border: `1px solid var(--border-subtle)`, padding: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', borderRadius: 'var(--radius-full)', background: 'var(--bg-gradient-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap style={{ height: 'var(--icon-xs)', width: 'var(--icon-xs)', color: 'var(--brand-primary)' }} />
                </div>
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{milestone.phase}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>• {milestone.date}</span>
                  </div>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{milestone.title}</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{milestone.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Milestones - Desktop & Tablet */}
      <div className="hide-mobile" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 'var(--font-semibold)', textAlign: 'center', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Development Roadmap</h3>

        <div style={{ position: 'relative', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          {/* Timeline Line */}
          <div style={{ position: 'absolute', top: 'var(--space-8)', left: '0', right: '0', height: '2px', background: 'var(--border-subtle)' }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', position: 'relative' }}>
            {milestones.map((milestone, index) => (
              <div key={index} style={{ position: 'relative' }}>
                {/* Timeline Node */}
                <div style={{ position: 'absolute', top: '-var(--space-2)', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: 'var(--radius-full)', background: 'var(--brand-gradient)', border: `2px solid var(--bg-secondary)` }}></div>

                {/* Milestone Card */}
                <div className="card" style={{ borderRadius: 'var(--radius-lg)', border: `1px solid var(--border-subtle)`, padding: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', background: 'var(--bg-gradient-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                      <Zap style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)', color: 'var(--brand-primary)' }} />
                    </div>

                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                      {milestone.phase}
                    </div>

                    <h4 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                      {milestone.title}
                    </h4>

                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                      {milestone.description}
                    </p>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-3)' }}>
                      <Calendar style={{ height: 'var(--icon-xs)', width: 'var(--icon-xs)', color: 'var(--brand-primary)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{milestone.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-4)' }}>
          <div className="spinner" style={{ width: '8px', height: '8px', borderWidth: '2px' }}></div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Development in progress</span>
        </div>
      </div>
    </div>
  )
}




export default CryptoCountdown
