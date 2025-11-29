import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '32px',
  paddingBottom: '32px'
}} style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div style={{
  display: 'grid',
  gap: '32px'
}}>
          <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
            <div style={{
  fontWeight: 'bold'
}}>
              CRYB
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The next-generation community platform where conversations come alive.
            </p>
          </div>
          
          <div>
            <h3 style={{
  fontWeight: '600'
}} style={{ color: 'var(--text-primary)' }}>Platform</h3>
            <ul style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}} style={{ color: 'var(--text-muted)' }}>
              <li>
                <Link to="/communities" className="hover-text">
                  Communities
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover-text">
                  Live Chat
                </Link>
              </li>
              <li>
                <Link to="/users" className="hover-text">
                  Users
                </Link>
              </li>
              <li>
                <Link to="/crypto" className="hover-text">
                  Web3 & Crypto
                </Link>
              </li>
              <li>
                <Link to="/tokenomics" className="hover-text">
                  Token Economics
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 style={{
  fontWeight: '600'
}} style={{ color: 'var(--text-primary)' }}>Support</h3>
            <ul style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}} style={{ color: 'var(--text-muted)' }}>
              <li>
                <Link to="/help" className="hover-text">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover-text">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover-text">
                  Bug Reports
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 style={{
  fontWeight: '600'
}} style={{ color: 'var(--text-primary)' }}>Legal</h3>
            <ul style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}} style={{ color: 'var(--text-muted)' }}>
              <li>
                <Link to="/privacy" className="hover-text">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover-text">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover-text">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{
  textAlign: 'center'
}} style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            &copy; 2025 CRYB Platform. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Made with ❤️ by <span style={{
  fontWeight: '600'
}}>Cryb.ai</span>
          </p>
        </div>
      </div>
    </footer>
  )
}




export default Footer
