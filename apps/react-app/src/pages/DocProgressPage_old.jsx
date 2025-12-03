import React, { useState, useEffect } from 'react'
import '../styles/doc-progress.css'

// PlantUML encoder
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
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const compressed = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        compressed.set(chunk, offset)
        offset += chunk.length
      }
      let binaryString = ''
      for (let i = 0; i < compressed.length; i++) {
        binaryString += String.fromCharCode(compressed[i])
      }
      return encode64(binaryString)
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

// PlantUML Diagram Component
function PlantUMLDiagram({ code, title }) {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

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
          <div className="error-message">{error}</div>
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
      {title && <h4 style={{fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem'}}>{title}</h4>}
      <div className="diagram-image-wrapper">
        <img src={imageUrl} alt={title} className="diagram-image" onError={() => setError('Failed to load')} />
      </div>
    </div>
  )
}

// Progress Bar
function ProgressBar({ value, max = 100, label }) {
  const percentage = Math.round((value / max) * 100)
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-value">{value}/{max}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{width: `${percentage}%`}}></div>
      </div>
    </div>
  )
}

// Stat Card
function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
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
            {tab.label}
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
          <div className="feature-checkbox">✓</div>
          <div style={{flex: 1}}>
            <span className="feature-text">{f.name}</span>
            {f.count && <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--cryb-primary)', marginLeft: '0.5rem'}}>{f.count}</span>}
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
    { id: 'overview', label: 'Overview' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'database', label: 'Database' },
    { id: 'web3', label: 'Web3' },
    { id: 'realtime', label: 'Real-time' },
    { id: 'infrastructure', label: 'Infrastructure' }
  ]

  const diagrams = {
    system: `@startuml
!theme cyborg
title System Architecture
package "Client" { [React Web] }
package "API" { [Fastify Server] }
package "Data" { [PostgreSQL] }
[React Web] --> [Fastify Server]
[Fastify Server] --> [PostgreSQL]
@enduml`,
    deployment: `@startuml
!theme cyborg
title Deployment
node "Load Balancer" as LB
node "API Cluster" as API
database "PostgreSQL" as DB
LB --> API
API --> DB
@enduml`
  }

  const stats = {
    pages: 149,
    components: 235,
    models: 73,
    services: 144,
    contracts: 9,
    tests: 210
  }

  const renderOverview = () => (
    <div>
      <div className="doc-stats-grid">
        <StatCard label="Total Pages" value={stats.pages} color="blue" />
        <StatCard label="Components" value={`${stats.components}+`} color="purple" />
        <StatCard label="DB Models" value={stats.models} color="gradient" />
        <StatCard label="Services" value={stats.services} color="blue" />
      </div>

      <div className="tab-content-section" style={{marginTop: '2rem'}}>
        <h3 className="subsection-title" style={{fontSize: '1.5rem', marginBottom: '2rem'}}>Development Progress</h3>
        <ProgressBar value={95} label="Overall Completion" />
        <ProgressBar value={100} label="Core Features" />
        <ProgressBar value={90} label="Web3 Integration" />
        <ProgressBar value={85} label="Test Coverage" />
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem'}}>
        <div className="tab-content-section">
          <h4 className="subsection-title" style={{fontSize: '1.125rem'}}>✓ Completed</h4>
          <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>Full authentication system</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>Real-time messaging</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>NFT marketplace</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>Voice/Video calls</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>DAO governance</li>
          </ul>
        </div>

        <div className="tab-content-section">
          <h4 className="subsection-title" style={{fontSize: '1.125rem', color: 'var(--cryb-secondary)'}}>⚙️ In Production</h4>
          <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Docker containers</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Kubernetes orchestration</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Prometheus monitoring</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Redis caching</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Elasticsearch</li>
          </ul>
        </div>

        <div className="tab-content-section" style={{background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(163, 113, 247, 0.15) 100%)', borderColor: 'rgba(88, 166, 255, 0.5)'}}>
          <h4 className="subsection-title" style={{fontSize: '1.125rem'}}>⚡ Web3 Ready</h4>
          <ul style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#CBD5E1'}}>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>Multi-chain support (5)</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>SIWE authentication</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>Token gating</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-secondary)'}}>•</span>Crypto payments</li>
            <li style={{display: 'flex', alignItems: 'start', gap: '0.5rem'}}><span style={{color: 'var(--cryb-primary)'}}>•</span>9 smart contracts</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const renderArchitecture = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <PlantUMLDiagram code={diagrams.system} title="System Architecture" />
      <PlantUMLDiagram code={diagrams.deployment} title="Deployment Architecture" />
    </div>
  )

  const renderFrontend = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Frontend Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Pages" value={149} color="blue" />
            <StatCard label="Components" value="235+" color="purple" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Tech Stack</h4>
          <FeatureList features={[
            { name: 'React 18 with Hooks' },
            { name: 'Vite Build System' },
            { name: 'Tailwind CSS' },
            { name: 'Zustand State' },
            { name: 'React Query' },
            { name: 'PWA Support' }
          ]} />
        </div>
      </div>
    </div>
  )

  const renderBackend = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Backend Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="API Routes" value={68} color="blue" />
            <StatCard label="Services" value={144} color="purple" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Categories</h4>
          <FeatureList features={[
            { name: 'Authentication', count: '10' },
            { name: 'Media Processing', count: '12' },
            { name: 'Moderation', count: '12' },
            { name: 'Web3 Services', count: '6' },
            { name: 'Notifications', count: '6' }
          ]} />
        </div>
      </div>
    </div>
  )

  const renderDatabase = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Database</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Models" value={73} color="blue" />
            <StatCard label="Migrations" value={45} color="purple" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Core Models</h4>
          <FeatureList features={[
            { name: 'Users & Profiles' },
            { name: 'Servers & Channels' },
            { name: 'Messages & Threads' },
            { name: 'Communities & Posts' },
            { name: 'NFTs & Collections' }
          ]} />
        </div>
      </div>
    </div>
  )

  const renderWeb3 = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-cryb-blue/20 to-cryb-purple/20 rounded-xl border border-cryb-blue/50 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Web3 Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Contracts" value={9} color="gradient" />
            <StatCard label="Chains" value={5} color="gradient" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-purple/30 p-8">
          <h4 className="text-xl font-bold text-cryb-purple mb-6">Smart Contracts</h4>
          <FeatureList features={[
            { name: 'CRYBToken (ERC-20)' },
            { name: 'CRYBStaking' },
            { name: 'CRYBGovernance' },
            { name: 'NFTMarketplace' },
            { name: 'TokenGating' }
          ]} />
        </div>
      </div>
    </div>
  )

  const renderRealtime = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Real-time</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Socket Impls" value={42} color="blue" />
            <StatCard label="Latency" value="<50ms" color="purple" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold text-cryb-blue mb-6">Socket.io Features</h4>
          <FeatureList features={[
            { name: 'Real-time Messaging' },
            { name: 'Presence Tracking' },
            { name: 'Typing Indicators' },
            { name: 'Read Receipts' },
            { name: 'Voice State Sync' }
          ]} />
        </div>
      </div>
    </div>
  )

  const renderInfrastructure = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold bg-gradient-to-r from-cryb-blue to-cryb-purple bg-clip-text text-transparent mb-6">Infrastructure</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Docker Configs" value={15} color="blue" />
            <StatCard label="Microservices" value={11} color="purple" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-cryb-blue/30 p-8">
          <h4 className="text-xl font-bold text-cryb-blue mb-6">DevOps Stack</h4>
          <FeatureList features={[
            { name: 'Docker & Compose' },
            { name: 'Kubernetes' },
            { name: 'PM2 Manager' },
            { name: 'Nginx LB' },
            { name: 'CI/CD Pipelines' }
          ]} />
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
          <h1 className="doc-progress-title">CRYB Platform</h1>
          <p className="doc-progress-subtitle">Development Progress & Technical Documentation</p>
        </div>

        {/* Content */}
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {renderContent()}

        {/* Footer */}
        <div style={{borderTop: '1px solid rgba(88, 166, 255, 0.2)', marginTop: '5rem', padding: '2rem 0', textAlign: 'center'}}>
          <div style={{fontSize: '0.875rem', color: '#6B7280'}}>
            <span className="stat-value" style={{fontSize: '0.875rem', display: 'inline'}}>CRYB Platform</span>
            <span style={{margin: '0 0.75rem'}}>•</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
