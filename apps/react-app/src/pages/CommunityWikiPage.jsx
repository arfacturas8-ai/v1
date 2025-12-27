import React, { memo } from 'react'
import { BookOpen, FileText, Search, Plus } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const CommunityWikiPage = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: isMobile ? '80px' : '88px',
      paddingBottom: isMobile ? '24px' : '40px',
      paddingLeft: isMobile ? '16px' : '20px',
      paddingRight: isMobile ? '16px' : '20px',
      background: '#FAFAFA',
      color: '#666666'
    }} role="main" aria-label="Community wiki page">
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '24px' : '32px'
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
            <BookOpen size={32} style={{ color: '#000000' }} />
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
            Community Wiki
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666666'
          }}>Knowledge base and documentation for the community</p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '24px',
          padding: isMobile ? '12px' : '16px',
          marginBottom: isMobile ? '16px' : '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}>
          <Search size={20} style={{
            flexShrink: 0,
            color: '#999999'
          }} />
          <input
            type="text"
            placeholder="Search wiki articles..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: isMobile ? '14px' : '16px',
              color: '#1A1A1A'
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(88, 166, 255, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(88, 166, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <FileText size={24} style={{ color: '#000000' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Getting Started</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Learn the basics of our community</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'
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
              marginBottom: '16px'
            }}>
              <FileText size={24} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Community Guidelines</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Rules and best practices</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            gridColumn: isTablet ? 'span 2' : 'auto',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'rgba(163, 113, 247, 0.5)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(163, 113, 247, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(163, 113, 247, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <FileText size={24} style={{ color: '#000000' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>FAQ</h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#666666',
              margin: 0
            }}>Frequently asked questions</p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '24px',
          padding: isMobile ? '20px' : '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '12px' : '0',
            marginBottom: isMobile ? '12px' : '16px'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              margin: 0,
              color: '#1A1A1A'
            }}>Recent Articles</h3>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 16px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: 'none',
              borderRadius: '18px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(88, 166, 255, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(88, 166, 255, 0.25)'
            }}
            >
              <Plus size={16} />
              New Article
            </button>
          </div>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            textAlign: 'center',
            padding: isMobile ? '24px' : '32px',
            color: '#666666',
            margin: 0
          }}>
            No wiki articles have been created yet.
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityWikiPage)
