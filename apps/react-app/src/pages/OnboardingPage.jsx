/**
 * CRYB Platform - Onboarding Page
 * Redirects to home and triggers Driver.js interactive tour
 */

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Mark as first visit to trigger tour on home page
    localStorage.setItem('cryb_visited_before', 'false')
    localStorage.removeItem('cryb_tour_completed')

    // Redirect to home where tour will start
    setTimeout(() => {
      navigate('/home', { replace: true })
    }, 500)
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <span style={{
            color: '#FFFFFF',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>C</span>
        </div>
        <p style={{
          fontSize: '16px',
          color: '#666666',
          fontWeight: '500'
        }}>
          Preparing your experience...
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
