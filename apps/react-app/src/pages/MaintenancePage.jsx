import React, { useState, useEffect } from 'react'
import { Wrench, Clock, CheckCircle2, Twitter, MessageCircle } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

export default function MaintenancePage() {
  const { isMobile } = useResponsive()
  const [currentTime, setCurrentTime] = useState(new Date())
  const estimatedEnd = new Date(Date.now() + 2 * 60 * 60 * 1000)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getTimeRemaining = () => {
    const diff = estimatedEnd - currentTime
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <>
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
      `}</style>
      <div
        role="main"
        aria-label="Maintenance page"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: isMobile ? '16px' : '20px',
          paddingRight: isMobile ? '16px' : '20px',
          background: 'var(--bg-primary)'
        }}
      >
        <div style={{
          textAlign: 'center',
          color: 'var(--text-primary)',
          maxWidth: isMobile ? '100%' : '700px',
          paddingLeft: isMobile ? '0' : '16px',
          paddingRight: isMobile ? '0' : '16px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '96px' : '120px',
            height: isMobile ? '96px' : '120px',
            border: '1px solid rgba(88, 166, 255, 0.3)',
            borderRadius: '50%',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            background: 'var(--bg-secondary)',
            position: 'relative'
          }}>
            <Wrench
              style={{
                width: isMobile ? '48px' : '64px',
                height: isMobile ? '48px' : '64px',
                flexShrink: 0,
                color: '#58a6ff'
              }}
              className="animate-wiggle"
              aria-hidden="true"
            />
          </div>

          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: 'bold',
            marginBottom: isMobile ? '16px' : '24px',
            background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            We'll Be Right Back!
          </h1>

          <p style={{
            fontSize: isMobile ? '18px' : '20px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            lineHeight: '1.6',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Cryb.ai is currently undergoing scheduled maintenance to bring you a better experience.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid var(--border-subtle)'
            }}>
              <Clock
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  flexShrink: 0,
                  marginBottom: '16px',
                  color: '#58a6ff',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block'
                }}
                aria-hidden="true"
              />
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Estimated Duration
              </div>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                {getTimeRemaining()}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid var(--border-subtle)'
            }}>
              <CheckCircle2
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  flexShrink: 0,
                  marginBottom: '16px',
                  color: '#10b981',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block'
                }}
                aria-hidden="true"
              />
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Expected Back
              </div>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                {formatTime(estimatedEnd)}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: isMobile ? '24px' : '32px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              marginBottom: '16px',
              textAlign: 'center',
              color: 'var(--text-primary)'
            }}>
              What's Being Improved?
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '2'
            }}>
              {[
                'Performance enhancements for faster loading',
                'Security updates and bug fixes',
                'New features and improvements',
                'Database optimization'
              ].map((item, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2
                    style={{ width: '18px', height: '18px', flexShrink: 0, color: '#10b981' }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '24px' : '32px',
            border: '1px solid var(--border-subtle)'
          }}>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              Stay updated on our progress:
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://twitter.com/crybplatform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Twitter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: isMobile ? '16px' : '20px',
                  paddingRight: isMobile ? '16px' : '20px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-inverse)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <Twitter style={{ width: '18px', height: '18px', flexShrink: 0 }} aria-hidden="true" />
                Twitter
              </a>
              <a
                href="https://status.cryb.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Check status page"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: isMobile ? '16px' : '20px',
                  paddingRight: isMobile ? '16px' : '20px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  height: '40px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#58a6ff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-secondary)'
                }}
              >
                <MessageCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} aria-hidden="true" />
                Status Page
              </a>
            </div>
          </div>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            Thank you for your patience! We're working hard to get back online as quickly as possible.
            <br />
            Questions?{' '}
            <a
              href="mailto:support@cryb.app"
              style={{ color: '#58a6ff', textDecoration: 'underline', fontWeight: '600' }}
            >
              Contact support
            </a>
          </p>

          <div style={{
            marginTop: isMobile ? '24px' : '32px',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px'
          }}>
            <p style={{ margin: 0 }}>
              Maintenance ID: MAINT-{Math.random().toString(36).substring(7).toUpperCase()}
              <br />
              Started: {formatTime(new Date())}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
