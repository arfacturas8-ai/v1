/**
 * BillingPage - Billing and subscription management
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { memo } from 'react'
import { CreditCard, Receipt, TrendingUp, Clock } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const BillingPage = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      padding: isMobile ? '40px 16px' : '40px 20px',
      paddingTop: '80px'
    }} role="main" aria-label="Billing page">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CreditCard size={isMobile ? 28 : 32} style={{ color: '#6366F1' }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '600',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Billing</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>Manage your subscription and payment methods</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Receipt size={24} style={{ color: '#6366F1' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>Current Plan</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Free Tier</p>
            <button style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >Upgrade Plan</button>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <TrendingUp size={24} style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>Usage This Month</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>0 / 1,000 API calls</p>
            <div style={{
              height: '8px',
              background: '#FAFAFA',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '0%',
                height: '100%',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '8px'
              }} />
            </div>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Clock size={24} style={{ color: '#8B5CF6' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>Next Billing</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>No upcoming charges</p>
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '24px',
          padding: isMobile ? '20px' : '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>Payment History</h3>
          <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No transactions yet</p>
        </div>
      </div>
    </div>
  )
}

export default memo(BillingPage)
