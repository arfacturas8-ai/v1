import React, { useState, useEffect, useRef } from 'react'
import { Clock, Square } from 'lucide-react'

function CallTimer({ 
  isActive = false,
  startTime = null,
  showControls = false,
  onRecord = null,
  isRecording = false,
  compact = false 
}) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(isActive)
  const intervalRef = useRef(null)
  const recordingTimeRef = useRef(0)
  
  useEffect(() => {
    if (isActive && startTime) {
      setIsRunning(true)
      const initialElapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(initialElapsed)
    } else if (!isActive) {
      setIsRunning(false)
      setElapsedTime(0)
    }
  }, [isActive, startTime])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTime) {
          const currentElapsed = Math.floor((Date.now() - startTime) / 1000)
          setElapsedTime(currentElapsed)
        } else {
          setElapsedTime(prev => prev + 1)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (compact) {
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getStatusColor = () => {
    if (!isActive) return 'text-white/40'
    if (elapsedTime < 60) return 'text-green-400'
    if (elapsedTime < 3600) return 'text-blue-400'
    return 'text-purple-400'
  }

  const getStatusBackground = () => {
    if (!isActive) return 'bg-white/5'
    if (elapsedTime < 60) return 'bg-green-500/10'
    if (elapsedTime < 3600) return 'bg-[#58a6ff]/10'
    return 'bg-[#a371f7]/10'
  }

  const getBorderColor = () => {
    if (!isActive) return 'border-white/10'
    if (elapsedTime < 60) return 'border-green-400/20'
    if (elapsedTime < 3600) return 'border-blue-400/20'
    return 'border-purple-400/20'
  }

  if (compact) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <Clock size={12} />
          <span style={{
  fontWeight: '500'
}}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        {isRecording && (
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
            <span style={{
  fontWeight: '500'
}}>REC</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}>
      {/* Timer Display */}
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
          <Clock size={16} className={getStatusColor()} />
        </div>
        <div style={{
  display: 'flex',
  flexDirection: 'column'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <span style={{
  fontWeight: 'bold'
}}>
              {formatTime(elapsedTime)}
            </span>
            {isActive && (
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
            )}
          </div>
          <div style={{
  color: '#ffffff'
}}>
            {isActive ? 'Call in progress' : 'Call ended'}
          </div>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
          <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
          <div style={{
  display: 'flex',
  flexDirection: 'column'
}}>
            <span style={{
  fontWeight: '500'
}}>Recording</span>
            <span className="text-xs text-red-400/80 font-mono">
              {formatTime(recordingTimeRef.current)}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && onRecord && (
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <button
            onClick={onRecord}
            style={{
  padding: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  color: '#ffffff'
}}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <Square size={16} /> : <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />}
          </button>
        </div>
      )}

      {/* Call Quality Badge */}
      {isActive && (
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {elapsedTime > 300 && ( // Show after 5 minutes
            <div style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '50%'
}}>
              <span style={{
  fontWeight: '500'
}}>Stable</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



export default CallTimer