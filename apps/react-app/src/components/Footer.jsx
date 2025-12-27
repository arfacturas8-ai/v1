import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useResponsive } from '../hooks/useResponsive'

function Footer() {
  const { isMobile, isTablet } = useResponsive()
  const [hoveredLink, setHoveredLink] = useState(null)

  const linkStyle = (linkId) => ({
    color: hoveredLink === linkId ? '#58a6ff' : '#666666',
    textDecoration: 'none',
    transition: 'color 0.2s',
    fontSize: isMobile ? '14px' : '15px'
  })

  return (
    <footer style={{
      paddingLeft: isMobile ? '16px' : '32px',
      paddingRight: isMobile ? '16px' : '32px',
      paddingTop: isMobile ? '32px' : '48px',
      paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom))' : '48px',
      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '32px' : '48px',
          marginBottom: isMobile ? '32px' : '48px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              fontWeight: '900',
              fontSize: isMobile ? '20px' : '24px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}>
              CRYB
            </div>
            <p style={{
              fontSize: isMobile ? '14px' : '15px',
              lineHeight: '1.6',
              color: '#666666',
              margin: 0
            }}>
              The next-generation community platform where conversations come alive.
            </p>
          </div>

          <div>
            <h3 style={{
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '15px',
              color: '#1A1A1A',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Platform
            </h3>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>
                <Link
                  to="/communities"
                  style={linkStyle('communities')}
                  onMouseEnter={() => setHoveredLink('communities')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Communities
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  style={linkStyle('chat')}
                  onMouseEnter={() => setHoveredLink('chat')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Live Chat
                </Link>
              </li>
              <li>
                <Link
                  to="/users"
                  style={linkStyle('users')}
                  onMouseEnter={() => setHoveredLink('users')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Users
                </Link>
              </li>
              <li>
                <Link
                  to="/tokenomics"
                  style={linkStyle('tokenomics')}
                  onMouseEnter={() => setHoveredLink('tokenomics')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Token Economics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '15px',
              color: '#1A1A1A',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Support
            </h3>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>
                <Link
                  to="/help"
                  style={linkStyle('help')}
                  onMouseEnter={() => setHoveredLink('help')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  style={linkStyle('contact')}
                  onMouseEnter={() => setHoveredLink('contact')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/reports"
                  style={linkStyle('reports')}
                  onMouseEnter={() => setHoveredLink('reports')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Bug Reports
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '15px',
              color: '#1A1A1A',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Legal
            </h3>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>
                <Link
                  to="/privacy"
                  style={linkStyle('privacy')}
                  onMouseEnter={() => setHoveredLink('privacy')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  style={linkStyle('terms')}
                  onMouseEnter={() => setHoveredLink('terms')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/guidelines"
                  style={linkStyle('guidelines')}
                  onMouseEnter={() => setHoveredLink('guidelines')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          paddingTop: isMobile ? '24px' : '32px',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: '#666666',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            &copy; 2025 CRYB Platform. All rights reserved.
          </p>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: '#999999',
            margin: 0
          }}>
            Made with ❤️ by <span style={{ fontWeight: '600', color: '#1A1A1A' }}>Cryb.ai</span>
          </p>
        </div>
      </div>
    </footer>
  )
}




export default Footer
