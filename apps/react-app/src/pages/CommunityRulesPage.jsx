import React, { memo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, AlertTriangle, ChevronLeft, CheckCircle } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const CommunityRulesPage = () => {
  const { isMobile } = useResponsive()
  const { communityName } = useParams()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching rules
    setTimeout(() => {
      setRules([
        { id: 1, title: 'Be respectful and civil', description: 'Treat all members with respect. No harassment, hate speech, or personal attacks.' },
        { id: 2, title: 'No spam or self-promotion', description: 'Do not post spam, excessive self-promotion, or irrelevant content.' },
        { id: 3, title: 'Use appropriate content', description: 'All posts must be appropriate for the community. NSFW content must be tagged.' },
        { id: 4, title: 'Search before posting', description: 'Check if your question or topic has already been discussed.' },
        { id: 5, title: 'Follow content guidelines', description: 'Adhere to the platform-wide content policy and community-specific guidelines.' }
      ])
      setLoading(false)
    }, 500)
  }, [communityName])

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: isMobile ? '80px' : '88px',
      paddingBottom: isMobile ? '24px' : '40px',
      paddingLeft: isMobile ? '16px' : '20px',
      paddingRight: isMobile ? '16px' : '20px',
      background: '#FAFAFA'
    }} role="main" aria-label="Community rules page">
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        <Link
          to={`/community/${communityName}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            fontSize: isMobile ? '13px' : '14px',
            marginBottom: isMobile ? '16px' : '24px',
            color: '#666666',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ChevronLeft size={20} />
          Back to c/{communityName}
        </Link>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
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
            <Shield size={32} style={{ color: '#58a6ff' }} />
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
            Community Rules
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666666'
          }}>c/{communityName}</p>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: isMobile ? '20px' : '24px',
          marginBottom: isMobile ? '16px' : '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E8EAED'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '32px' : '40px',
              color: '#666666'
            }}>Loading rules...</div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '20px'
            }}>
              {rules.map((rule, index) => (
                <div key={rule.id} style={{
                  display: 'flex',
                  gap: isMobile ? '12px' : '16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: isMobile ? '15px' : '16px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: '#1A1A1A'
                    }}>{rule.title}</h3>
                    <p style={{
                      fontSize: isMobile ? '13px' : '14px',
                      lineHeight: '1.6',
                      color: '#666666',
                      margin: 0
                    }}>{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '24px',
          padding: isMobile ? '12px' : '16px',
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
        }}>
          <AlertTriangle size={20} style={{
            color: '#F59E0B',
            flexShrink: 0
          }} />
          <div>
            <h4 style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: '#F59E0B',
              marginBottom: isMobile ? '4px' : '8px'
            }}>Violations may result in</h4>
            <ul style={{
              margin: 0,
              paddingLeft: isMobile ? '16px' : '20px',
              fontSize: isMobile ? '13px' : '14px',
              lineHeight: '1.6',
              color: '#1A1A1A'
            }}>
              <li>Post removal</li>
              <li>Temporary or permanent ban</li>
              <li>Account suspension</li>
            </ul>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: isMobile ? '13px' : '14px',
          color: '#666666'
        }}>
          <CheckCircle size={16} style={{ color: '#10B981' }} />
          <span>By participating, you agree to follow these rules</span>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityRulesPage)
