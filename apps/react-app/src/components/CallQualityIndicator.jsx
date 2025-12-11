import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Signal, SignalHigh, SignalMedium, SignalLow } from 'lucide-react'

function CallQualityIndicator({ 
  connectionQuality = 'good', // 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'
  networkStats = null,
  showDetails = false,
  compact = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Simulate network stats if not provided (for demo)
  const [stats, setStats] = useState(networkStats || {
    bandwidth: 1200, // kbps
    latency: 45, // ms
    packetLoss: 0.1, // %
    jitter: 12 // ms
  })

  useEffect(() => {
    if (!networkStats) {
      // Simulate changing network conditions
      const interval = setInterval(() => {
        setStats(prev => ({
          bandwidth: prev.bandwidth + (Math.random() - 0.5) * 200,
          latency: Math.max(10, prev.latency + (Math.random() - 0.5) * 20),
          packetLoss: Math.max(0, Math.min(5, prev.packetLoss + (Math.random() - 0.5) * 0.5)),
          jitter: Math.max(0, prev.jitter + (Math.random() - 0.5) * 10)
        }))
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [networkStats])

  const getQualityInfo = () => {
    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: SignalHigh,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400/30',
          label: 'Excellent',
          description: 'HD quality available'
        }
      case 'good':
        return {
          icon: Signal,
          color: 'text-blue-400',
          bgColor: 'bg-[#58a6ff]/20',
          borderColor: 'border-blue-400/30',
          label: 'Good',
          description: 'Quality is stable'
        }
      case 'fair':
        return {
          icon: SignalMedium,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-400/30',
          label: 'Fair',
          description: 'Some quality reduction'
        }
      case 'poor':
        return {
          icon: SignalLow,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-400/30',
          label: 'Poor',
          description: 'Connection unstable'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-400/30',
          label: 'Disconnected',
          description: 'Reconnecting...'
        }
      default:
        return {
          icon: Wifi,
          color: 'text-white/60',
          bgColor: 'bg-white/10',
          borderColor: 'border-white/20',
          label: 'Unknown',
          description: 'Checking connection'
        }
    }
  }

  const qualityInfo = getQualityInfo()
  const IconComponent = qualityInfo.icon

  if (compact) {
    return (
      <div
        style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
        title={`${qualityInfo.label} - ${qualityInfo.description}`}
      >
        <IconComponent size={14} className={qualityInfo.color} />
        <span style={{
  fontWeight: '500'
}}>
          {qualityInfo.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{
  position: 'relative'
}}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
        title="Click for detailed network stats"
      >
        <IconComponent 
          size={16} 
          className={`${qualityInfo.color} ${connectionQuality === 'disconnected' ? '' : ''}`} 
        />
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
}}>
          <span style={{
  fontWeight: '500'
}}>
            {qualityInfo.label}
          </span>
          {showDetails && (
            <span style={{
  color: '#ffffff'
}}>
              {Math.round(stats.latency)}ms • {stats.packetLoss.toFixed(1)}% loss
            </span>
          )}
        </div>
        
        {/* Signal strength bars */}
        <div style={{
  display: 'flex',
  alignItems: 'flex-end'
}}>
          {[1, 2, 3, 4].map((bar) => {
            let isActive = false
            switch (connectionQuality) {
              case 'excellent':
                isActive = true
                break
              case 'good':
                isActive = bar <= 3
                break
              case 'fair':
                isActive = bar <= 2
                break
              case 'poor':
                isActive = bar <= 1
                break
              default:
                isActive = false
            }
            
            return (
              <div
                key={bar}
                style={{
  width: '4px'
}}
                style={{ height: `${bar * 3 + 2}px` }}
              />
            )
          })}
        </div>
      </button>

      {/* Detailed Stats Dropdown */}
      {isExpanded && (
        <div style={{
  position: 'absolute',
  width: '256px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
          <div style={{
  padding: '16px'
}}>
            <h4 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Network Statistics</h4>
            <div style={{
  display: 'grid',
  gap: '12px'
}}>
              <div style={{
  borderRadius: '12px',
  padding: '8px'
}}>
                <div style={{
  color: '#ffffff'
}}>Bandwidth</div>
                <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {Math.round(stats.bandwidth)} kbps
                </div>
              </div>
              <div style={{
  borderRadius: '12px',
  padding: '8px'
}}>
                <div style={{
  color: '#ffffff'
}}>Latency</div>
                <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {Math.round(stats.latency)} ms
                </div>
              </div>
              <div style={{
  borderRadius: '12px',
  padding: '8px'
}}>
                <div style={{
  color: '#ffffff'
}}>Packet Loss</div>
                <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {stats.packetLoss.toFixed(2)}%
                </div>
              </div>
              <div style={{
  borderRadius: '12px',
  padding: '8px'
}}>
                <div style={{
  color: '#ffffff'
}}>Jitter</div>
                <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {Math.round(stats.jitter)} ms
                </div>
              </div>
            </div>
          </div>
          
          {/* Quality Recommendations */}
          <div style={{
  padding: '12px'
}}>
            <div style={{
  color: '#ffffff'
}}>Recommendations:</div>
            {connectionQuality === 'excellent' && (
              <div className="text-xs text-green-400">• HD video quality available</div>
            )}
            {connectionQuality === 'good' && (
              <div className="text-xs text-blue-400">• Connection is stable</div>
            )}
            {connectionQuality === 'fair' && (
              <div className="text-xs text-yellow-400">• Consider moving closer to router</div>
            )}
            {connectionQuality === 'poor' && (
              <div className="text-xs text-orange-400">• Check network connection</div>
            )}
            {connectionQuality === 'disconnected' && (
              <div className="text-xs text-red-400">• Attempting to reconnect...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}




export default CallQualityIndicator
