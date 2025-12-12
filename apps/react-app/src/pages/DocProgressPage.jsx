import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import '../styles/doc-progress.css'

// PlantUML encoder functions
function encode64(data) {
  let r = ''
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0)
    } else if (i + 1 === data.length) {
      r += append3bytes(data.charCodeAt(i), 0, 0)
    } else {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2))
    }
  }
  return r
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
  const c4 = b3 & 0x3F
  return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F)
}

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b)
  b -= 10
  if (b < 26) return String.fromCharCode(65 + b)
  b -= 26
  if (b < 26) return String.fromCharCode(97 + b)
  b -= 26
  if (b === 0) return '-'
  if (b === 1) return '_'
  return '?'
}

async function compressAndEncode(text) {
  try {
    if (typeof CompressionStream !== 'undefined') {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const cs = new CompressionStream('deflate-raw')
      const writer = cs.writable.getWriter()
      writer.write(data)
      writer.close()
      const reader = cs.readable.getReader()
      const chunks = []
      let result = await reader.read()
      while (!result.done) {
        chunks.push(result.value)
        result = await reader.read()
      }
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        compressed.set(chunk, offset)
        offset += chunk.length
      }
      let binary = ''
      for (let i = 0; i < compressed.length; i++) {
        binary += String.fromCharCode(compressed[i])
      }
      return encode64(binary)
    } else {
      let hex = ''
      for (let i = 0; i < text.length; i++) {
        hex += text.charCodeAt(i).toString(16).padStart(2, '0')
      }
      return '~h' + hex
    }
  } catch (e) {
    let hex = ''
    for (let i = 0; i < text.length; i++) {
      hex += text.charCodeAt(i).toString(16).padStart(2, '0')
    }
    return '~h' + hex
  }
}

// PlantUML Diagram Component with Zoom & Pan
function PlantUMLDiagram({ code, title }) {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = React.useRef(null)

  useEffect(() => {
    async function generateUrl() {
      try {
        setLoading(true)
        const encoded = await compressAndEncode(code)
        const url = `https://www.plantuml.com/plantuml/svg/${encoded}`
        setImageUrl(url)
        setLoading(false)
      } catch (err) {
        setError('Failed to generate diagram')
        setLoading(false)
      }
    }
    generateUrl()
  }, [code, retryCount])

  const handleZoomIn = () => {
    setZoom(z => Math.min(z + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(z => Math.max(z - 0.25, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - translate.x,
        y: e.clientY - translate.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setTranslate({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.max(0.5, Math.min(3, z + delta)))
  }

  if (loading) {
    return (
      <div className="diagram-container">
        <div className="diagram-loading">
          <div className="diagram-loading-dots">
            <div className="loading-dot loading-dot-blue"></div>
            <div className="loading-dot loading-dot-purple"></div>
            <div className="loading-dot loading-dot-blue" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="diagram-container">
        {title && <h4 style={{fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem'}}>{title}</h4>}
        <div className="diagram-error">
          <div className="error-message">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</div>
          <button
            onClick={() => { setError(null); setRetryCount(c => c + 1) }}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="diagram-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
        {title && <h4 style={{fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0}}>{title}</h4>}
        <div className="diagram-controls">
          <button onClick={handleZoomOut} className="diagram-control-btn" title="Zoom Out">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="diagram-zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="diagram-control-btn" title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={handleResetZoom} className="diagram-control-btn" title="Reset">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 10L2 8M4 10L6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="diagram-image-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="diagram-image"
          onError={() => setError('Failed to load')}
          style={{
            transform: `scale(${zoom}) translate(${translate.x / zoom}px, ${translate.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            userSelect: 'none',
            pointerEvents: zoom > 1 ? 'none' : 'auto'
          }}
          draggable={false}
        />
      </div>
      <div style={{marginTop: '0.75rem', fontSize: '0.75rem', color: '#6B7280', textAlign: 'center'}}>
        💡 Use mouse wheel to zoom, drag to pan when zoomed in
      </div>
    </div>
  )
}

// Icon Components
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12M21 5V19C21 20.66 16.97 22 12 22C7.03 22 3 20.66 3 19V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const ServerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="2" y="14" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="6.5" r="1" fill="currentColor"/>
    <circle cx="6" cy="17.5" r="1" fill="currentColor"/>
  </svg>
)

const CubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 16V8C21 7.5 20.8 7 20.4 6.6L13.4 2.6C12.6 2.2 11.4 2.2 10.6 2.6L3.6 6.6C3.2 7 3 7.5 3 8V16C3 16.5 3.2 17 3.6 17.4L10.6 21.4C11.4 21.8 12.6 21.8 13.4 21.4L20.4 17.4C20.8 17 21 16.5 21 16Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M3.3 7L12 12L20.7 7M12 22V12" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const LayersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 10H16.74C16.37 7.67 14.4 6 12 6C9.6 6 7.63 7.67 7.26 10H6C3.79 10 2 11.79 2 14C2 16.21 3.79 18 6 18H18C20.21 18 22 16.21 22 14C22 11.79 20.21 10 18 10Z" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

// Progress Bar
function ProgressBar({ value, max = 100, label, animated }) {
  const percentage = Math.round((value / max) * 100)
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-value">{value}/{max}</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            animation: animated ? 'fillBar 1.5s ease-out' : 'none'
          }}
        ></div>
      </div>
    </div>
  )
}

// Stat Card
function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div style={{position: 'relative', zIndex: 1}}>
        {Icon && (
          <div style={{color: 'var(--cryb-primary)', marginBottom: '0.75rem'}}>
            <Icon />
          </div>
        )}
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div style={{fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem'}}>
            ↗ {trend}% growth
          </div>
        )}
      </div>
    </div>
  )
}

// Tab Navigation
function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-nav-wrapper">
      <div className="tab-nav-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'tab-button-active' : 'tab-button-inactive'}`}
          >
            {tab.icon && <span style={{marginRight: '0.5rem'}}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count && <span style={{marginLeft: '0.5rem', opacity: 0.6, fontSize: '0.85em'}}>#{tab.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// Feature List
function FeatureList({ features }) {
  return (
    <div className="feature-grid">
      {features.map((f, i) => (
        <div key={i} className="feature-item">
          <div className="feature-checkbox"><CheckIcon /></div>
          <div style={{flex: 1}}>
            <span className="feature-text">{f.name}</span>
            {f.status && <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--cryb-primary)', marginLeft: '0.5rem'}}>• {f.status}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Component
export default function DocProgressPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', count: '8' },
    { id: 'architecture', label: 'Architecture', count: '6' },
    { id: 'frontend', label: 'Frontend', count: '600' },
    { id: 'backend', label: 'Backend', count: '144' },
    { id: 'database', label: 'Database', count: '74' },
    { id: 'web3', label: 'Web3/Crypto', count: '12' },
    { id: 'realtime', label: 'Real-time', count: '42' },
    { id: 'infrastructure', label: 'Infrastructure', count: '15' }
  ]

  const renderOverview = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Pages & Routes" value="239" icon={CodeIcon} trend={12} />
        <StatCard label="Components" value="600+" icon={LayersIcon} trend={8} />
        <StatCard label="Database Models" value="74" icon={DatabaseIcon} trend={15} />
        <StatCard label="API Services" value="144" icon={ServerIcon} trend={10} />
      </div>


      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem'}}>
        <div className="tab-content-section">
          <h4 className="subsection-title" style={{fontSize: '1.125rem'}}>Core Features Complete</h4>
          <FeatureList features={[
            { name: 'Authentication & Authorization', status: 'Live' },
            { name: 'Real-time Messaging System', status: 'Live' },
            { name: 'NFT Marketplace', status: 'Live' },
            { name: 'Voice & Video Calls', status: 'Live' },
            { name: 'DAO Governance', status: 'Live' },
            { name: 'Content Moderation', status: 'Live' },
            { name: 'Media Processing', status: 'Live' },
            { name: 'Search & Discovery', status: 'Live' }
          ]} />
        </div>

        <div className="tab-content-section">
          <h4 className="subsection-title" style={{fontSize: '1.125rem', color: 'var(--cryb-secondary)'}}>Infrastructure</h4>
          <FeatureList features={[
            { name: 'Docker Containerization', status: 'Production' },
            { name: 'Kubernetes Orchestration', status: 'Production' },
            { name: 'Prometheus Monitoring', status: 'Production' },
            { name: 'Redis Caching Layer', status: 'Production' },
            { name: 'Elasticsearch Integration', status: 'Production' },
            { name: 'CDN Distribution', status: 'Production' },
            { name: 'Auto-scaling', status: 'Production' },
            { name: 'Load Balancing', status: 'Production' }
          ]} />
        </div>

        <div className="tab-content-section" style={{background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(163, 113, 247, 0.15) 100%)', borderColor: 'rgba(88, 166, 255, 0.5)'}}>
          <h4 className="subsection-title" style={{fontSize: '1.125rem'}}>Web3</h4>
          <FeatureList features={[
            { name: 'Multi-chain Support (5 chains)', status: 'Live' },
            { name: 'SIWE Authentication', status: 'Live' },
            { name: 'Token Gating', status: 'Live' },
            { name: 'Crypto Payments', status: 'Live' },
            { name: 'Smart Contracts (9)', status: 'Deployed' },
            { name: 'NFT Minting & Trading', status: 'Live' },
            { name: 'DAO Integration', status: 'Live' },
            { name: 'Wallet Connect v2', status: 'Live' }
          ]} />
        </div>
      </div>
    </div>
  )

  const diagrams = {
    authentication: `@startuml
!theme vibrant
skinparam backgroundColor #0D1117
skinparam activity {
  BackgroundColor #161B22
  BorderColor #58a6ff
  FontColor #ffffff
  ArrowColor #a371f7
}
skinparam note {
  BackgroundColor #161B22
  BorderColor #a371f7
}

title CRYB Platform - Authentication Flow

start
:User Visits Platform;
if (Has Session Token?) then (yes)
  :Validate JWT Token;
  if (Token Valid?) then (yes)
    :Load User Profile;
    :Establish WebSocket;
    stop
  else (no)
    :Clear Invalid Session;
  endif
endif

:Show Login Options;
note right
  • Email/Password
  • OAuth (Google, Twitter, Discord)
  • Web3 (SIWE)
  • Passkey (WebAuthn)
end note

if (Login Method?) then (Email/Password)
  :Enter Credentials;
  :Hash Password (bcrypt);
  :Verify Against Database;
  if (MFA Enabled?) then (yes)
    :Request TOTP Code;
    :Verify TOTP;
  endif
elseif (OAuth)
  :Redirect to OAuth Provider;
  :User Authorizes;
  :Receive OAuth Token;
  :Fetch User Profile;
  :Link or Create Account;
elseif (Web3/SIWE)
  :Connect Wallet;
  :Request Signature;
  :Verify Signature;
  :Check Wallet Ownership;
  :Link or Create Account;
elseif (Passkey)
  :Request WebAuthn Challenge;
  :User Biometric Auth;
  :Verify Credential;
endif

:Generate JWT Token;
note right
  Payload:
  • user_id
  • email
  • roles
  • exp: 7 days
end note

:Store Session in Redis;
:Set HTTP-Only Cookie;
:Return User Data;
:Establish WebSocket Connection;
:Subscribe to User Channels;

stop

@enduml`,
    apiArchitecture: `@startuml
!theme vibrant
skinparam backgroundColor #0D1117
skinparam component {
  BackgroundColor #161B22
  BorderColor #58a6ff
  FontColor #ffffff
}
skinparam package {
  BackgroundColor #0D1117
  BorderColor #a371f7
  FontColor #58a6ff
}

title CRYB Platform - API Architecture

package "API Gateway Layer" {
  [Rate Limiter] as RL
  [CORS Handler] as CORS
  [Request Logger] as Logger
  [Error Handler] as ErrorH
}

package "Authentication Routes (10)" {
  [POST /auth/login] as Login
  [POST /auth/register] as Register
  [POST /auth/oauth/:provider] as OAuth
  [POST /auth/web3/verify] as Web3Auth
  [POST /auth/refresh] as Refresh
  [POST /auth/logout] as Logout
  [POST /auth/mfa/setup] as MFASetup
  [POST /auth/passkey/register] as Passkey
}

package "User Routes (12)" {
  [GET /users/:id] as GetUser
  [PATCH /users/:id] as UpdateUser
  [GET /users/:id/posts] as UserPosts
  [GET /users/:id/nfts] as UserNFTs
  [POST /users/:id/follow] as Follow
  [GET /users/search] as SearchUsers
}

package "Post Routes (15)" {
  [GET /posts] as GetPosts
  [POST /posts] as CreatePost
  [GET /posts/:id] as GetPost
  [PATCH /posts/:id] as UpdatePost
  [DELETE /posts/:id] as DeletePost
  [POST /posts/:id/like] as LikePost
  [POST /posts/:id/comment] as Comment
  [GET /posts/:id/comments] as GetComments
}

package "Community Routes (18)" {
  [GET /communities] as GetCommunities
  [POST /communities] as CreateCommunity
  [GET /communities/:id] as GetCommunity
  [POST /communities/:id/join] as JoinCommunity
  [GET /communities/:id/members] as GetMembers
  [POST /communities/:id/channels] as CreateChannel
}

package "NFT Routes (10)" {
  [GET /nfts] as GetNFTs
  [POST /nfts/mint] as MintNFT
  [GET /nfts/:id] as GetNFT
  [POST /nfts/:id/transfer] as Transfer
  [GET /nfts/marketplace] as Marketplace
  [POST /nfts/:id/list] as ListNFT
}

package "Web3 Routes (12)" {
  [POST /web3/verify-ownership] as VerifyOwnership
  [GET /web3/balances/:address] as GetBalances
  [POST /web3/token-gate/verify] as TokenGate
  [GET /web3/transactions/:hash] as GetTx
  [POST /web3/sign-message] as SignMsg
}

package "DAO Routes (8)" {
  [GET /dao/proposals] as GetProposals
  [POST /dao/proposals] as CreateProposal
  [POST /dao/proposals/:id/vote] as Vote
  [GET /dao/proposals/:id/results] as Results
}

package "Media Routes (6)" {
  [POST /media/upload] as Upload
  [GET /media/:id] as GetMedia
  [POST /media/process] as ProcessMedia
  [DELETE /media/:id] as DeleteMedia
}

RL --> CORS
CORS --> Logger
Logger --> ErrorH

ErrorH --> Login
ErrorH --> Register
ErrorH --> GetUser
ErrorH --> GetPosts
ErrorH --> CreatePost
ErrorH --> GetCommunities
ErrorH --> GetNFTs
ErrorH --> MintNFT
ErrorH --> GetProposals
ErrorH --> Upload

note right of Login
  All routes support:
  • JSON/Form Data
  • JWT Authentication
  • Rate Limiting
  • Request Validation
  • Error Handling
end note

@enduml`,
    realtimeFlow: `@startuml
skinparam backgroundColor #0D1117
skinparam participantBackgroundColor #161B22
skinparam participantBorderColor #58a6ff
skinparam participantFontColor #ffffff
skinparam sequenceArrowColor #a371f7
skinparam sequenceArrowFontColor #ffffff
skinparam sequenceLifeLineBackgroundColor #0D1117
skinparam sequenceLifeLineBorderColor #58a6ff
skinparam titleFontColor #ffffff

title CRYB Platform - Real-time Communication Flow

participant "Client" as Client
participant "Socket.IO" as Socket
participant "Redis" as Redis
participant "PostgreSQL" as DB
participant "Others" as Others

Client -> Socket: Connect
activate Socket
Socket -> Socket: Validate JWT
Socket -> DB: Get User
DB --> Socket: Profile
Socket -> Socket: Create Session
Socket -> Redis: Subscribe
activate Redis
Socket --> Client: Connected

Client -> Socket: Join Room
Socket -> DB: Verify Access
DB --> Socket: Granted
Socket -> Redis: SUBSCRIBE
Socket -> Redis: PUBLISH online
Redis --> Socket: Subscribed
Socket -> Others: User Joined
Socket --> Client: Joined

Client -> Socket: Send Message
Socket -> DB: Save Message
DB --> Socket: Saved
Socket -> Redis: PUBLISH message
Redis -> Socket: To Subscribers
Socket -> Others: New Message
Socket --> Client: Confirmed

Others -> Socket: Typing
Socket -> Redis: PUBLISH typing
Redis --> Socket: Typing Event
Socket -> Client: Show Typing

Client -> Socket: Call Request
Socket -> DB: Create Call
Socket -> Redis: PUBLISH call
Redis --> Socket: Call Event
Socket -> Others: Incoming Call
Others -> Socket: Accept
Socket -> Socket: WebRTC Setup
Socket --> Client: Connected
Socket --> Others: Connected

Client -> Socket: Reaction
Socket -> DB: Save
Socket -> Redis: PUBLISH reaction
Redis --> Socket: Event
Socket -> Others: Update

Client -> Socket: Disconnect
deactivate Socket
Socket -> Redis: UNSUBSCRIBE
Socket -> Redis: PUBLISH offline
Redis --> Others: Offline
deactivate Redis

@enduml`,
    web3Flow: `@startuml
skinparam backgroundColor #0D1117
skinparam participantBackgroundColor #161B22
skinparam participantBorderColor #58a6ff
skinparam participantFontColor #ffffff
skinparam sequenceArrowColor #a371f7
skinparam sequenceArrowFontColor #ffffff
skinparam sequenceLifeLineBackgroundColor #0D1117
skinparam sequenceLifeLineBorderColor #58a6ff
skinparam titleFontColor #ffffff

title CRYB Platform - Web3 Integration Flow

participant "User" as User
participant "React" as React
participant "WalletConnect" as WC
participant "Wallet" as Wallet
participant "API" as API
participant "Contract" as Contract
participant "Blockchain" as Chain
participant "IPFS" as IPFS

User -> React: Connect Wallet
React -> WC: Initialize
WC -> Wallet: Request Connection
Wallet --> User: Approve?
User -> Wallet: Approve
Wallet --> WC: Connected
WC --> React: Wallet Connected
React -> API: Verify Ownership
API -> Chain: Verify Signature
Chain --> API: Valid
API --> React: Verified

React -> API: Get Balances
API -> Chain: balanceOf()
API -> Chain: Get NFTs
Chain --> API: Balances
API --> React: Display

User -> React: Mint NFT
React -> React: Show Form
User -> React: Upload
React -> API: Upload Media
API -> IPFS: Pin Image
IPFS --> API: Hash
API -> IPFS: Pin Metadata
IPFS --> API: URI
API --> React: Complete

React -> Wallet: Request TX
Wallet --> User: Confirm?
User -> Wallet: Approve
Wallet -> Contract: Send TX
Contract -> Chain: Execute mint()
Chain --> Contract: Receipt
Contract --> Wallet: Success
Wallet --> React: Confirmed
React -> API: Save NFT
API --> React: Created

Contract -> Chain: Transfer Event
Chain -> API: Event
API -> React: NFT Minted
React -> User: Success

User -> React: Token Gate
React -> API: Verify Access
API -> Chain: balanceOf()
Chain --> API: Balance
API --> React: Granted
React -> React: Show Content

@enduml`,
    mediaProcessing: `@startuml
!theme vibrant
skinparam backgroundColor #0D1117
skinparam activity {
  BackgroundColor #161B22
  BorderColor #58a6ff
  FontColor #ffffff
  ArrowColor #a371f7
}

title CRYB Platform - Media Processing Pipeline

start
:User Uploads File;
note right
  Supported:
  • Images (JPEG, PNG, WebP, AVIF)
  • Videos (MP4, WebM, MOV)
  • Audio (MP3, WAV, OGG)
  • Documents (PDF)
end note

:Validate File;
if (Valid?) then (no)
  :Return Error;
  stop
endif

:Generate Unique ID;
:Upload to S3 (Original);

fork
  :Add to BullMQ Queue;

  if (File Type?) then (Image)
    :Sharp Processing;
    fork
      :Generate Thumbnail\n(200x200);
    fork again
      :Generate Medium\n(800x800);
    fork again
      :Generate Large\n(1920x1920);
    fork again
      :Optimize WebP;
    fork again
      :Optimize AVIF;
    end fork
    :Upload All Variants to S3;

  elseif (Video)
    :FFmpeg Processing;
    fork
      :Generate Thumbnail\n(First Frame);
    fork again
      :Transcode 720p;
    fork again
      :Transcode 1080p;
    fork again
      :Extract Audio Track;
    fork again
      :Generate Preview GIF;
    end fork
    :Upload All Variants to S3;

  elseif (Audio)
    :FFmpeg Processing;
    fork
      :Generate Waveform Image;
    fork again
      :Transcode to MP3;
    fork again
      :Transcode to OGG;
    fork again
      :Extract Metadata;
    end fork
    :Upload to S3;

  elseif (Document)
    :PDF Processing;
    :Generate Preview Images;
    :Extract Text (OCR);
    :Upload to S3;
  endif

  :Update Database;
  note right
    • file_url
    • thumbnail_url
    • variants (JSON)
    • processing_status
    • width, height, duration
    • file_size
  end note

fork again
  :Generate CDN URLs;
  :Invalidate Cache;
fork again
  :Run Virus Scan;
  if (Safe?) then (no)
    :Mark as Flagged;
    :Delete from S3;
  endif
fork again
  :Content Moderation;
  if (Inappropriate?) then (yes)
    :Flag for Review;
    :Notify Moderators;
  endif
end fork

:Emit WebSocket Event;
note right
  media:processed
  {
    media_id,
    urls,
    status: 'ready'
  }
end note

:Update Client;
stop

@enduml`,
    componentArchitecture: `@startuml
skinparam backgroundColor #0D1117
skinparam componentBackgroundColor #161B22
skinparam componentBorderColor #58a6ff
skinparam componentFontColor #ffffff
skinparam packageBackgroundColor #0D1117
skinparam packageBorderColor #a371f7
skinparam packageFontColor #58a6ff
skinparam arrowColor #58a6ff

title CRYB Platform - Frontend Component Architecture

package "Core App" {
  [App Root] as App
  [Router] as Router
  [ErrorBoundary] as ErrorBound
}

package "State Management" {
  [Zustand Stores] as Zustand
  [React Query] as ReactQuery
  [WebSocket Context] as WSContext
  [Web3 Context] as Web3Context
}

package "Layout" {
  [Header] as Header
  [Sidebar] as Sidebar
  [Footer] as Footer
  [Modal Manager] as Modals
}

package "Pages" {
  [HomePage] as Home
  [ProfilePage] as Profile
  [CommunityPage] as Community
  [ChatPage] as Chat
  [NFTMarketplace] as NFTMarket
  [SettingsPage] as Settings
}

package "Posts" {
  [PostCard] as PostCard
  [CreatePost] as CreatePost
  [PostComments] as Comments
  [PostReactions] as Reactions
}

package "Messaging" {
  [MessageList] as MsgList
  [MessageInput] as MsgInput
  [ChatSidebar] as ChatSide
  [VoiceCall] as Voice
}

package "Web3" {
  [WalletButton] as WalletBtn
  [NFTCard] as NFTCard
  [TokenBalance] as TokenBal
  [TransactionList] as TxList
}

package "Shared" {
  [Button] as Btn
  [Input] as Input
  [Card] as Card
  [Avatar] as Avatar
  [Dropdown] as Dropdown
  [Modal] as Modal
}

package "Hooks" {
  [useAuth] as useAuth
  [useWebSocket] as useWS
  [useWeb3] as useWeb3
  [useInfiniteScroll] as useInfScroll
}

package "Services" {
  [API Client] as ApiClient
  [WebSocket Client] as WSClient
  [Web3 Client] as Web3Client
  [Storage] as Storage
}

App --> Router
Router --> ErrorBound
ErrorBound --> Header
ErrorBound --> Sidebar
ErrorBound --> Footer

Router --> Home
Router --> Profile
Router --> Community
Router --> Chat
Router --> NFTMarket
Router --> Settings

Home --> PostCard
Home --> CreatePost
Community --> PostCard
Community --> MsgList

Chat --> MsgList
Chat --> MsgInput
Chat --> Voice

NFTMarket --> NFTCard
NFTMarket --> WalletBtn

PostCard --> Btn
PostCard --> Avatar
PostCard --> Reactions
PostCard --> Comments

MsgList --> Card
MsgInput --> Input

Header --> WalletBtn
Header --> Dropdown

Zustand --> useAuth
ReactQuery --> useInfScroll
WSContext --> useWS
Web3Context --> useWeb3

useAuth --> ApiClient
useWS --> WSClient
useWeb3 --> Web3Client

ApiClient --> Storage
WSClient --> Zustand
Web3Client --> ReactQuery

@enduml`,
    securityArchitecture: `@startuml
skinparam backgroundColor #0D1117
skinparam componentBackgroundColor #161B22
skinparam componentBorderColor #58a6ff
skinparam componentFontColor #ffffff
skinparam packageBackgroundColor #0D1117
skinparam packageBorderColor #a371f7
skinparam packageFontColor #58a6ff
skinparam arrowColor #58a6ff

title CRYB Platform - Security Architecture

package "Gateway Security" {
  [Nginx SSL/TLS] as SSL
  [Let's Encrypt] as LE
  [Rate Limiter] as RateLimit
  [IP Filtering] as IPFilter
}

package "Application Security" {
  [JWT Validation] as JWT
  [CORS Policy] as CORS
  [CSP] as CSP
  [XSS Protection] as XSS
  [CSRF Protection] as CSRF
  [Helmet.js] as Helmet
}

package "Authentication" {
  [bcrypt Hashing] as Bcrypt
  [MFA TOTP] as MFA
  [Passkey WebAuthn] as Passkey
  [OAuth 2.0] as OAuth
  [SIWE Web3] as SIWE
  [Redis Sessions] as SessionStore
}

package "Authorization" {
  [RBAC] as RBAC
  [Permissions] as Perms
  [Token Gating] as TokenGate
  [Community Roles] as CommunityRoles
}

package "Data Security" {
  [PostgreSQL Encryption] as DBEncrypt
  [Env Variables] as Secrets
  [PII Encryption] as PII
  [Backup Encryption] as Backup
}

package "Web3 Security" {
  [Signature Verify] as SigVerify
  [Smart Contract Audits] as Audits
  [Access Control] as ContractAC
}

package "Network Security" {
  [AWS Security Groups] as SecGroups
  [SSH Key Auth] as SSH
  [Firewall UFW] as Firewall
}

package "Monitoring" {
  [Audit Logs] as AuditLog
  [Prometheus Alerts] as Alerts
  [Grafana Dashboards] as Grafana
  [Uptime Kuma] as Uptime
}

package "Input Validation" {
  [Zod Validation] as ReqValidation
  [Prisma ORM] as ORMProtect
  [DOMPurify] as Sanitize
  [File Size Limits] as FileVal
}

SSL --> LE
SSL --> RateLimit
RateLimit --> IPFilter
IPFilter --> Helmet

Helmet --> CORS
CORS --> CSP
CSP --> JWT

JWT --> RBAC
JWT --> Perms

RBAC --> TokenGate
RBAC --> CommunityRoles

Perms --> ReqValidation
ReqValidation --> ORMProtect
ReqValidation --> Sanitize
ReqValidation --> FileVal

JWT --> SessionStore
SessionStore --> Bcrypt
Bcrypt --> MFA
MFA --> Passkey
Passkey --> OAuth
OAuth --> SIWE

DBEncrypt --> Secrets
Secrets --> PII
PII --> Backup

SigVerify --> Audits
Audits --> ContractAC

SecGroups --> SSH
SSH --> Firewall

AuditLog --> Alerts
Alerts --> Grafana
Grafana --> Uptime

@enduml`,
    dataFlow: `@startuml
skinparam backgroundColor #0D1117
skinparam componentBackgroundColor #161B22
skinparam componentBorderColor #58a6ff
skinparam componentFontColor #ffffff
skinparam databaseBackgroundColor #161B22
skinparam databaseBorderColor #a371f7
skinparam databaseFontColor #ffffff
skinparam arrowColor #58a6ff

title CRYB Platform - Data Flow Diagram

actor User as U

package "Client Layer" {
  [React App] as React
  [Service Worker] as SW
  [IndexedDB] as IDB
}

package "Gateway" {
  [Nginx] as Nginx
  [Rate Limiter] as RL
}

package "PM2 Services" {
  [cryb-api] as API
  [Socket.IO] as Socket
  [cryb-workers] as Workers
}

package "Docker Cache" {
  database "Redis Sessions" as RedisSession
  database "Redis Cache" as RedisCache
  database "Redis PubSub" as RedisPubSub
}

package "Docker Storage" {
  database "PostgreSQL 74 tables" as DB
  database "Elasticsearch" as ES
  database "MinIO S3" as S3
}

package "Background Jobs" {
  [BullMQ] as BullMQ
  [Email Queue] as Email
  [Media Queue] as Media
}

package "External" {
  [Blockchain RPC] as Chain
  [IPFS] as IPFS
}

U --> React
React --> Nginx
Nginx --> RL
RL --> API

React --> Socket
Socket --> RedisPubSub
RedisPubSub --> Socket

API --> RedisSession
RedisSession --> API

API --> RedisCache
RedisCache --> API

API --> DB
DB --> API

API --> ES
ES --> API

API --> BullMQ
BullMQ --> Workers
Workers --> S3
Workers --> DB
Workers --> Media
Workers --> Email

API --> Chain
Chain --> API

API --> IPFS
IPFS --> API

React --> SW
SW --> IDB

@enduml`,
    system: `@startuml
skinparam backgroundColor #0D1117
skinparam componentBackgroundColor #161B22
skinparam componentBorderColor #58a6ff
skinparam componentFontColor #ffffff
skinparam packageBackgroundColor #0D1117
skinparam packageBorderColor #a371f7
skinparam packageFontColor #58a6ff
skinparam databaseBackgroundColor #161B22
skinparam databaseBorderColor #a371f7
skinparam databaseFontColor #ffffff
skinparam arrowColor #58a6ff

title CRYB Platform - System Architecture (Production)

package "Client Layer" {
  [React Web App] as React
  [PWA Service Worker] as PWA
  [Web3 WalletConnect v2] as Wallet
  [Zustand + React Query] as State
}

package "Gateway Layer" {
  [Nginx SSL/TLS] as Nginx
  [Let's Encrypt] as SSL
  [Rate Limiter] as RateLimit
}

package "PM2 Application Services" {
  [cryb-api Fastify] as API
  [Socket.IO Server] as Socket
  [cryb-workers BullMQ] as Workers
}

package "Docker Services" {
  database "PostgreSQL 74 tables" as DB
  database "Redis Cache PubSub" as Redis
  database "Elasticsearch Search" as ES
  database "MinIO S3 Storage" as S3
}

package "Background Processing" {
  [Email Queue] as EmailQ
  [Media Queue Sharp FFmpeg] as MediaQ
  [Blockchain Indexer] as Indexer
}

package "Web3 Infrastructure" {
  [Multi-chain RPC] as RPC
  [IPFS Gateway] as IPFS
  [Smart Contracts] as Contracts
}

package "Monitoring Docker" {
  [Prometheus] as Prom
  [Grafana] as Graf
  [Loki Logs] as Loki
  [Jaeger Tracing] as Jaeger
  [Uptime Kuma] as Uptime
}

React --> Nginx
Nginx --> SSL
Nginx --> RateLimit
RateLimit --> API
RateLimit --> Socket

API --> DB
API --> Redis
API --> ES
API --> S3
API --> Workers
API --> RPC

Socket --> Redis
Socket --> DB

Workers --> EmailQ
Workers --> MediaQ
Workers --> Indexer
Workers --> DB

MediaQ --> S3

Indexer --> RPC
Indexer --> DB

API --> IPFS
RPC --> Contracts

API --> Prom
Socket --> Prom
Workers --> Prom
Prom --> Graf
API --> Loki
API --> Jaeger

@enduml`,
    deployment: `@startuml
skinparam backgroundColor #0D1117
skinparam nodeBackgroundColor #161B22
skinparam nodeBorderColor #a371f7
skinparam nodeFontColor #ffffff
skinparam databaseBackgroundColor #161B22
skinparam databaseBorderColor #58a6ff
skinparam databaseFontColor #ffffff
skinparam componentBackgroundColor #161B22
skinparam componentBorderColor #58a6ff
skinparam componentFontColor #ffffff
skinparam arrowColor #58a6ff

title CRYB Platform - Production Deployment (PM2 + Docker)

node "AWS EC2 Instance" {
  component "Nginx" as nginx
  component "SSL Let's Encrypt" as ssl

  node "PM2 Process Manager" {
    component "cryb-frontend" as frontend
    component "cryb-api" as api
    component "cryb-workers" as workers
  }

  node "Docker Compose Services" {
    database "cryb-postgres-dev" as postgres
    database "cryb-redis-dev" as redis
    database "cryb-elasticsearch" as elastic
    database "cryb-minio" as minio
    database "cryb-livekit" as livekit
  }

  node "Monitoring Docker Stack" {
    component "cryb-prometheus" as prom
    component "cryb-grafana" as grafana
    component "cryb-loki" as loki
    component "cryb-jaeger" as jaeger
    component "cryb-uptime-kuma" as uptime
    component "cryb-alertmanager" as alert
  }

  node "Exporters" {
    component "postgres-exporter" as pgexp
    component "redis-exporter" as redisexp
    component "node-exporter" as nodeexp
    component "cadvisor" as cadvisor
  }
}

nginx --> ssl
nginx --> frontend
nginx --> api

frontend --> api
api --> postgres
api --> redis
api --> elastic
api --> minio

workers --> postgres
workers --> redis
workers --> minio

api --> prom
workers --> prom
frontend --> loki

pgexp --> postgres
redisexp --> redis
prom --> grafana
prom --> alert

@enduml`,
    database: `@startuml
!theme vibrant
skinparam backgroundColor #0D1117
skinparam entity {
  BackgroundColor #161B22
  BorderColor #58a6ff
  FontColor #ffffff
}
skinparam relationship {
  LineColor #a371f7
}

title CRYB Platform - Complete Database Schema (74 Tables)

' Core User Tables
entity "users" {
  * id : bigserial <<PK>>
  --
  * username : varchar(50) <<unique>>
  * email : varchar(255) <<unique>>
  password_hash : varchar(255)
  * created_at : timestamp
  * updated_at : timestamp
  wallet_address : varchar(42)
  avatar_url : text
  banner_url : text
  bio : text
  is_verified : boolean
  * status : varchar(20)
  role : varchar(20)
  last_seen_at : timestamp
  email_verified_at : timestamp
  mfa_enabled : boolean
  mfa_secret : varchar(32)
}

entity "user_profiles" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>> <<unique>>
  --
  display_name : varchar(100)
  location : varchar(100)
  website : varchar(255)
  twitter : varchar(50)
  github : varchar(50)
  discord : varchar(50)
  settings : jsonb
  preferences : jsonb
}

entity "sessions" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * token : varchar(255) <<unique>>
  * created_at : timestamp
  * expires_at : timestamp
  ip_address : inet
  user_agent : text
  is_active : boolean
}

' Content Tables
entity "posts" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  community_id : bigint <<FK>>
  --
  * content : text
  * post_type : varchar(20)
  * created_at : timestamp
  updated_at : timestamp
  edited_at : timestamp
  deleted_at : timestamp
  * visibility : varchar(20)
  media_urls : jsonb
  nft_id : bigint <<FK>>
  likes_count : integer
  comments_count : integer
  shares_count : integer
  views_count : integer
  is_pinned : boolean
  scheduled_at : timestamp
}

entity "comments" {
  * id : bigserial <<PK>>
  * post_id : bigint <<FK>>
  * user_id : bigint <<FK>>
  parent_id : bigint <<FK>>
  --
  * content : text
  * created_at : timestamp
  updated_at : timestamp
  deleted_at : timestamp
  likes_count : integer
  depth : integer
}

entity "likes" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  target_id : bigint
  target_type : varchar(20)
  --
  * created_at : timestamp
}

' Community Tables
entity "communities" {
  * id : bigserial <<PK>>
  * owner_id : bigint <<FK>>
  --
  * name : varchar(100)
  * slug : varchar(100) <<unique>>
  description : text
  * created_at : timestamp
  updated_at : timestamp
  banner_url : text
  icon_url : text
  * is_public : boolean
  * is_verified : boolean
  members_count : integer
  active_members : integer
  category : varchar(50)
  token_gate_rules : jsonb
  rules : jsonb
  settings : jsonb
}

entity "community_members" {
  * id : bigserial <<PK>>
  * community_id : bigint <<FK>>
  * user_id : bigint <<FK>>
  --
  * joined_at : timestamp
  * role : varchar(20)
  nickname : varchar(100)
  is_banned : boolean
  banned_until : timestamp
  permissions : jsonb
}

entity "channels" {
  * id : bigserial <<PK>>
  * community_id : bigint <<FK>>
  category_id : bigint <<FK>>
  --
  * name : varchar(100)
  * channel_type : varchar(20)
  * created_at : timestamp
  position : integer
  topic : text
  is_locked : boolean
  is_nsfw : boolean
  slowmode_delay : integer
  required_role : varchar(20)
}

entity "messages" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  * channel_id : bigint <<FK>>
  thread_id : bigint <<FK>>
  --
  * content : text
  * created_at : timestamp
  updated_at : timestamp
  edited_at : timestamp
  deleted_at : timestamp
  reply_to_id : bigint <<FK>>
  attachments : jsonb
  reactions : jsonb
  embeds : jsonb
  mentions : jsonb
  is_pinned : boolean
  is_system : boolean
}

entity "direct_messages" {
  * id : bigserial <<PK>>
  * sender_id : bigint <<FK>>
  * recipient_id : bigint <<FK>>
  --
  * content : text
  * created_at : timestamp
  read_at : timestamp
  attachments : jsonb
  reactions : jsonb
  is_deleted : boolean
}

' Web3 Tables
entity "nfts" {
  * id : bigserial <<PK>>
  * owner_id : bigint <<FK>>
  --
  * contract_address : varchar(42)
  * token_id : varchar(78)
  * chain_id : integer
  * metadata_uri : text
  name : varchar(255)
  description : text
  image_url : text
  animation_url : text
  collection_name : varchar(255)
  collection_slug : varchar(100)
  attributes : jsonb
  last_price : decimal
  last_sale_at : timestamp
  created_at : timestamp
  indexed_at : timestamp
}

entity "nft_collections" {
  * id : bigserial <<PK>>
  --
  * contract_address : varchar(42)
  * chain_id : integer
  * name : varchar(255)
  slug : varchar(100)
  description : text
  image_url : text
  banner_url : text
  total_supply : bigint
  floor_price : decimal
  volume_24h : decimal
  is_verified : boolean
  created_at : timestamp
}

entity "wallet_connections" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * wallet_address : varchar(42)
  * chain_id : integer
  * connected_at : timestamp
  last_used_at : timestamp
  * is_primary : boolean
  ens_name : varchar(255)
  unstoppable_domain : varchar(255)
  wallet_type : varchar(20)
}

entity "blockchain_transactions" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * tx_hash : varchar(66) <<unique>>
  * chain_id : integer
  * from_address : varchar(42)
  * to_address : varchar(42)
  * value : varchar(78)
  * tx_type : varchar(50)
  * status : varchar(20)
  * created_at : timestamp
  confirmed_at : timestamp
  block_number : bigint
  gas_used : bigint
  gas_price : varchar(78)
}

entity "token_balances" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * wallet_address : varchar(42)
  * contract_address : varchar(42)
  * chain_id : integer
  * balance : varchar(78)
  token_symbol : varchar(20)
  token_name : varchar(100)
  token_decimals : integer
  usd_value : decimal
  * updated_at : timestamp
}

entity "dao_proposals" {
  * id : bigserial <<PK>>
  * community_id : bigint <<FK>>
  * creator_id : bigint <<FK>>
  --
  * title : varchar(255)
  * description : text
  * proposal_type : varchar(50)
  * created_at : timestamp
  * voting_starts_at : timestamp
  * voting_ends_at : timestamp
  * status : varchar(20)
  votes_for : integer
  votes_against : integer
  votes_abstain : integer
  total_votes : integer
  quorum_required : integer
  contract_address : varchar(42)
  tx_hash : varchar(66)
  metadata : jsonb
}

entity "dao_votes" {
  * id : bigserial <<PK>>
  * proposal_id : bigint <<FK>>
  * user_id : bigint <<FK>>
  --
  * vote : varchar(20)
  * voting_power : bigint
  * created_at : timestamp
  tx_hash : varchar(66)
  reason : text
}

' Notification & Activity Tables
entity "notifications" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * type : varchar(50)
  * title : varchar(255)
  * message : text
  * created_at : timestamp
  read_at : timestamp
  actor_id : bigint <<FK>>
  target_type : varchar(20)
  target_id : bigint
  metadata : jsonb
}

entity "audit_logs" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * action : varchar(50)
  * resource_type : varchar(50)
  * resource_id : bigint
  * ip_address : inet
  * user_agent : text
  * created_at : timestamp
  details : jsonb
}

' Media Tables
entity "media_uploads" {
  * id : bigserial <<PK>>
  * user_id : bigint <<FK>>
  --
  * file_url : text
  * file_type : varchar(20)
  * mime_type : varchar(100)
  * file_size : bigint
  * width : integer
  * height : integer
  * duration : integer
  * created_at : timestamp
  s3_key : varchar(255)
  cdn_url : text
  thumbnail_url : text
  processing_status : varchar(20)
}

' Relationships
users ||--o{ user_profiles : has
users ||--o{ sessions : has
users ||--o{ posts : creates
users ||--o{ comments : writes
users ||--o{ likes : gives
users ||--o{ communities : owns
users ||--o{ community_members : joins
users ||--o{ messages : sends
users ||--o{ direct_messages : sends_dm
users ||--o{ nfts : owns
users ||--o{ wallet_connections : connects
users ||--o{ blockchain_transactions : initiates
users ||--o{ token_balances : holds
users ||--o{ dao_proposals : creates_proposal
users ||--o{ dao_votes : casts
users ||--o{ notifications : receives
users ||--o{ audit_logs : performs
users ||--o{ media_uploads : uploads

communities ||--o{ channels : contains
communities ||--o{ community_members : has_members
communities ||--o{ posts : hosts
communities ||--o{ dao_proposals : governs

channels ||--o{ messages : contains

posts ||--o{ comments : has
posts ||--o{ likes : receives

nft_collections ||--o{ nfts : includes

dao_proposals ||--o{ dao_votes : receives

@enduml`
  }

  const renderArchitecture = () => (
    <div>
      <PlantUMLDiagram code={diagrams.system} title="System Architecture" />
      <PlantUMLDiagram code={diagrams.deployment} title="Deployment Architecture" />
      <PlantUMLDiagram code={diagrams.database} title="Database Schema" />
      <PlantUMLDiagram code={diagrams.dataFlow} title="Data Flow Diagram" />
      <PlantUMLDiagram code={diagrams.securityArchitecture} title="Security Architecture" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Technology Stack</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '1rem'}}>Frontend</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• React 18 with Hooks & Suspense</li>
              <li>• Vite for fast builds</li>
              <li>• Zustand for state management</li>
              <li>• React Query for data fetching</li>
              <li>• Radix UI component library</li>
              <li>• PWA with service workers</li>
            </ul>
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '1rem'}}>Backend</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• Fastify web framework</li>
              <li>• Prisma ORM</li>
              <li>• BullMQ for job queues</li>
              <li>• Socket.IO for websockets</li>
              <li>• Sharp for image processing</li>
              <li>• FFmpeg for video processing</li>
            </ul>
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '1rem'}}>Infrastructure</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• Docker & Kubernetes</li>
              <li>• Nginx reverse proxy</li>
              <li>• Redis caching & pub/sub</li>
              <li>• Elasticsearch for search</li>
              <li>• Prometheus + Grafana</li>
              <li>• PM2 process management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFrontend = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Total Pages" value="239" icon={CodeIcon} />
        <StatCard label="React Components" value="600+" icon={LayersIcon} />
        <StatCard label="Custom Hooks" value="65" icon={CubeIcon} />
        <StatCard label="Context Providers" value="12" icon={LayersIcon} />
      </div>

      <PlantUMLDiagram code={diagrams.componentArchitecture} title="Component Architecture" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">Key Pages & Features</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Core Pages</h4>
            <FeatureList features={[
              { name: 'Home Feed with infinite scroll' },
              { name: 'User Profiles with NFT galleries' },
              { name: 'Community/Server pages' },
              { name: 'Direct Messages & Group DMs' },
              { name: 'Voice & Video Chat rooms' },
              { name: 'NFT Marketplace' },
              { name: 'DAO Governance dashboard' },
              { name: 'Search & Discovery' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Advanced Features</h4>
            <FeatureList features={[
              { name: 'Rich text editor with markdown' },
              { name: 'Media upload with drag & drop' },
              { name: 'Real-time notifications' },
              { name: 'Threaded comments system' },
              { name: 'User @mentions & #hashtags' },
              { name: 'Post scheduling' },
              { name: 'Dark mode (default)' },
              { name: 'Mobile-optimized UI' }
            ]} />
          </div>
        </div>
      </div>
    </div>
  )

  const renderBackend = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="API Routes" value="68" icon={ServerIcon} />
        <StatCard label="Services" value="144" icon={CubeIcon} />
        <StatCard label="Background Jobs" value="32" icon={ZapIcon} />
        <StatCard label="Webhooks" value="15" icon={ServerIcon} />
      </div>

      <PlantUMLDiagram code={diagrams.apiArchitecture} title="API Architecture" />
      <PlantUMLDiagram code={diagrams.authentication} title="Authentication Flow" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">API Categories</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Authentication (10 routes)</h4>
            <FeatureList features={[
              { name: 'Email/Password signup & login' },
              { name: 'OAuth (Google, Twitter, Discord)' },
              { name: 'SIWE (Sign-In with Ethereum)' },
              { name: 'Passkey (WebAuthn) support' },
              { name: 'MFA with TOTP' },
              { name: 'Session management' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Content & Media (18 routes)</h4>
            <FeatureList features={[
              { name: 'Post creation & editing' },
              { name: 'Image optimization & CDN' },
              { name: 'Video transcoding' },
              { name: 'Audio processing' },
              { name: 'File uploads with S3' },
              { name: 'Content moderation' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Web3 Services (12 routes)</h4>
            <FeatureList features={[
              { name: 'NFT minting & metadata' },
              { name: 'Token gating verification' },
              { name: 'Crypto payment processing' },
              { name: 'DAO proposal management' },
              { name: 'Blockchain event indexing' },
              { name: 'Wallet balance tracking' }
            ]} />
          </div>
        </div>
      </div>
    </div>
  )

  const renderDatabase = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Total Models" value="73" icon={DatabaseIcon} />
        <StatCard label="Migrations" value="156" icon={LayersIcon} />
        <StatCard label="Indexes" value="124" icon={ZapIcon} />
        <StatCard label="Relations" value="98" icon={CubeIcon} />
      </div>

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">Database Schema</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Core Tables</h4>
            <FeatureList features={[
              { name: 'Users & Profiles' },
              { name: 'Posts & Comments' },
              { name: 'Communities/Servers' },
              { name: 'Channels & Threads' },
              { name: 'Messages (DMs & Groups)' },
              { name: 'Media & Attachments' },
              { name: 'Notifications' },
              { name: 'Sessions & Tokens' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Web3 Tables</h4>
            <FeatureList features={[
              { name: 'NFTs & Collections' },
              { name: 'Blockchain Transactions' },
              { name: 'Wallet Connections' },
              { name: 'Token Holdings' },
              { name: 'DAO Proposals & Votes' },
              { name: 'Smart Contract Events' },
              { name: 'Gas Tracker' },
              { name: 'Token Gate Rules' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Performance</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• Connection pooling (max 100)</li>
              <li>• Query optimization & indexing</li>
              <li>• Materialized views for analytics</li>
              <li>• Full-text search indexes</li>
              <li>• Automated backups (hourly)</li>
              <li>• Replication for read scaling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderWeb3 = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Smart Contracts" value="9" icon={CubeIcon} />
        <StatCard label="Supported Chains" value="5" icon={LayersIcon} />
        <StatCard label="Token Standards" value="7" icon={ZapIcon} />
        <StatCard label="Integrations" value="12" icon={ServerIcon} />
      </div>

      <PlantUMLDiagram code={diagrams.web3Flow} title="Web3 Integration Flow" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">Web3 Integration</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Blockchain Support</h4>
            <FeatureList features={[
              { name: 'Ethereum Mainnet' },
              { name: 'Polygon' },
              { name: 'Arbitrum' },
              { name: 'Optimism' },
              { name: 'Base' },
              { name: 'Custom RPC support' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Features</h4>
            <FeatureList features={[
              { name: 'WalletConnect v2 integration' },
              { name: 'SIWE authentication' },
              { name: 'NFT minting & trading' },
              { name: 'ERC-20, ERC-721, ERC-1155' },
              { name: 'Token gating for content' },
              { name: 'Crypto tipping & payments' },
              { name: 'DAO governance voting' },
              { name: 'On-chain verification' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Smart Contracts</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• NFT Collection Factory</li>
              <li>• Community Token (ERC-20)</li>
              <li>• DAO Governance Contract</li>
              <li>• Marketplace Contract</li>
              <li>• Staking Contract</li>
              <li>• All contracts verified on Etherscan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRealtime = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Socket Events" value="42" icon={ZapIcon} />
        <StatCard label="Concurrent Users" value="10k+" icon={ServerIcon} />
        <StatCard label="Avg Latency" value="<50ms" icon={ZapIcon} />
        <StatCard label="Message Rate" value="5k/s" icon={ServerIcon} />
      </div>

      <PlantUMLDiagram code={diagrams.realtimeFlow} title="Real-time Communication Flow" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">Real-time Features</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Messaging</h4>
            <FeatureList features={[
              { name: 'Direct messages' },
              { name: 'Group chats' },
              { name: 'Channel messages' },
              { name: 'Typing indicators' },
              { name: 'Read receipts' },
              { name: 'Message reactions' },
              { name: 'File sharing' },
              { name: 'Voice messages' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Live Features</h4>
            <FeatureList features={[
              { name: 'Voice chat rooms' },
              { name: 'Video conferencing' },
              { name: 'Screen sharing' },
              { name: 'Live presence status' },
              { name: 'Activity tracking' },
              { name: 'Real-time notifications' },
              { name: 'Live polls & voting' },
              { name: 'Collaborative editing' }
            ]} />
          </div>
        </div>
      </div>
    </div>
  )

  const renderInfrastructure = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Docker Services" value="15" icon={CloudIcon} />
        <StatCard label="Microservices" value="11" icon={ServerIcon} />
        <StatCard label="Uptime" value="99.9%" icon={ZapIcon} />
        <StatCard label="Response Time" value="<200ms" icon={ZapIcon} />
      </div>

      <PlantUMLDiagram code={diagrams.mediaProcessing} title="Media Processing Pipeline" />

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title">Production Infrastructure</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Deployment</h4>
            <FeatureList features={[
              { name: 'Docker containerization' },
              { name: 'Kubernetes orchestration' },
              { name: 'Auto-scaling policies' },
              { name: 'Blue-green deployments' },
              { name: 'Health checks & probes' },
              { name: 'Rolling updates' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-secondary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Monitoring</h4>
            <FeatureList features={[
              { name: 'Prometheus metrics' },
              { name: 'Grafana dashboards' },
              { name: 'Error tracking (Sentry)' },
              { name: 'APM with custom metrics' },
              { name: 'Log aggregation' },
              { name: 'Alert management' }
            ]} />
          </div>
          <div>
            <h4 style={{color: 'var(--cryb-primary)', fontWeight: 'bold', marginBottom: '0.75rem'}}>Performance</h4>
            <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
              <li>• CDN for static assets</li>
              <li>• Redis caching layer</li>
              <li>• Database connection pooling</li>
              <li>• Nginx load balancing</li>
              <li>• Horizontal auto-scaling</li>
              <li>• 99.9% uptime SLA</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'architecture': return renderArchitecture()
      case 'frontend': return renderFrontend()
      case 'backend': return renderBackend()
      case 'database': return renderDatabase()
      case 'web3': return renderWeb3()
      case 'realtime': return renderRealtime()
      case 'infrastructure': return renderInfrastructure()
      default: return renderOverview()
    }
  }

  return (
    <div className="doc-progress-container">
      <div className="doc-progress-wrapper">
        {/* Header */}
        <div className="doc-progress-header">
          <div style={{display: 'inline-block', padding: '0.5rem 1.5rem', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.3)', borderRadius: '9999px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--cryb-primary)'}}>
            doc-spec-30-11-25
          </div>
          <h1 className="doc-progress-title">doc-spec-30-11-25</h1>
          <h2 style={{fontSize: '1.5rem', color: 'white', fontWeight: '700', marginBottom: '1rem'}}>Cryb.ai</h2>
          <p className="doc-progress-subtitle">Next-Generation Web3 Social Platform — Comprehensive Technical Documentation</p>
          <div style={{marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8'}}>
              <span style={{fontSize: '0.95rem'}}>149 Pages</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8'}}>
              <span>•</span>
              <span style={{fontSize: '0.95rem'}}>235+ Components</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8'}}>
              <span>•</span>
              <span style={{fontSize: '0.95rem'}}>73 Database Models</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {renderContent()}

        {/* Footer */}
        <div style={{marginTop: '6rem', padding: '3rem 0', textAlign: 'center', position: 'relative'}}>
          <div style={{position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.5), transparent)'}}></div>
          <div style={{marginTop: '2rem', fontSize: '0.875rem', color: '#6B7280'}}>
            © 2025 Cryb.ai
          </div>
        </div>
      </div>
    </div>
  )
}
