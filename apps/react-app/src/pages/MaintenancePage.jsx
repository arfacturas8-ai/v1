/**
 * MaintenancePage.jsx
 * Maintenance mode page with iOS-inspired design aesthetic
 * Features: Live countdown timer, gradient accents, soft shadows, smooth animations
 */

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
          background: '#FAFAFA'
        }}
      >
        <div style={{
          textAlign: 'center',
          color: '#1A1A1A',
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
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '50%',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            background: 'white',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            position: 'relative'
          }}>
            <Wrench
              style={{
                width: isMobile ? '48px' : '64px',
                height: isMobile ? '48px' : '64px',
                flexShrink: 0,
                color: '#1A1A1A'
              }}
              className="animate-wiggle"
              aria-hidden="true"
            />
          </div>

          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: 'bold',
            marginBottom: isMobile ? '16px' : '24px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            We'll Be Right Back!
          </h1>

          <p style={{
            fontSize: isMobile ? '18px' : '20px',
            color: '#666666',
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
              background: 'white',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Clock
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  flexShrink: 0,
                  marginBottom: '16px',
                  color: '#1A1A1A',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block'
                }}
                aria-hidden="true"
              />
              <div style={{
                fontSize: '14px',
                color: '#666666',
                marginBottom: '8px'
              }}>
                Estimated Duration
              </div>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                color: '#1A1A1A'
              }}>
                {getTimeRemaining()}
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
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
                color: '#666666',
                marginBottom: '8px'
              }}>
                Expected Back
              </div>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                color: '#1A1A1A'
              }}>
                {formatTime(estimatedEnd)}
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: isMobile ? '24px' : '32px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              marginBottom: '16px',
              textAlign: 'center',
              color: '#1A1A1A'
            }}>
              What's Being Improved?
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '14px',
              color: '#1A1A1A',
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
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '24px' : '32px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#1A1A1A',
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
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
                }}
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
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  color: '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#F9FAFB'
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white'
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <MessageCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} aria-hidden="true" />
                Status Page
              </a>
            </div>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6'
          }}>
            Thank you for your patience! We're working hard to get back online as quickly as possible.
            <br />
            Questions?{' '}
            <a
              href="mailto:support@cryb.app"
              style={{ color: '#1A1A1A', textDecoration: 'underline', fontWeight: '600' }}
            >
              Contact support
            </a>
          </p>

          <div style={{
            marginTop: isMobile ? '24px' : '32px',
            padding: '16px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            fontSize: '12px',
            color: '#999999'
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
