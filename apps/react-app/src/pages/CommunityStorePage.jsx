import React, { memo } from 'react'
import { Store, ShoppingBag, Tag, Gift } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const CommunityStorePage = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: isMobile ? '80px' : '88px',
      paddingBottom: isMobile ? '24px' : '40px',
      paddingLeft: isMobile ? '16px' : '20px',
      paddingRight: isMobile ? '16px' : '20px',
      background: '#FAFAFA',
      color: '#1A1A1A'
    }} role="main" aria-label="Community store page">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <div style={{
            width: isMobile ? '64px' : '72px',
            height: isMobile ? '64px' : '72px',
            background: 'rgba(88, 166, 255, 0.1)',
            border: '1px solid rgba(88, 166, 255, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: isMobile ? '12px' : '16px'
          }}>
            <Store size={32} style={{ color: '#58a6ff' }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            Community Store
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666666'
          }}>Exclusive items and merchandise for community members</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            textAlign: 'center',
            border: '1px solid #E8EAED',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(88, 166, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <ShoppingBag size={24} style={{ color: '#58a6ff' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Digital Items</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Badges, emotes, and profile customizations</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Tag size={24} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Special Offers</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Exclusive discounts for members</p>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            textAlign: 'center',
            border: '1px solid #E8EAED',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            gridColumn: isTablet ? 'span 2' : 'auto',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(163, 113, 247, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Gift size={24} style={{ color: '#a371f7' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Rewards</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Redeem your community points</p>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: isMobile ? '20px' : '24px',
          border: '1px solid #E8EAED',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            marginBottom: isMobile ? '12px' : '16px',
            color: '#1A1A1A'
          }}>Available Items</h3>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            textAlign: 'center',
            padding: isMobile ? '24px' : '32px',
            color: '#666666',
            margin: 0
          }}>
            No items available in the store yet. Check back soon!
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityStorePage)
