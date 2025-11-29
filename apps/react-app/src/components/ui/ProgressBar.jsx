import React from 'react'

/**
 * ProgressBar Component
 * Displays upload/download progress
 */

const ProgressBar = ({
  progress = 0,
  className = '',
  size = 'md', // sm, md, lg
  color = 'blue', // blue, green, purple, red
  label,
  showPercentage = true
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-[#58a6ff]',
    green: 'bg-green-600',
    purple: 'bg-[#a371f7]',
    red: 'bg-red-600',
    gradient: 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7]'
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
          {label && (
            <span style={{
  fontWeight: '500',
  color: '#8b949e'
}}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span style={{
  fontWeight: '500',
  color: '#8b949e'
}}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div style={{
  width: '100%',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
        <div
          style={{
  borderRadius: '50%',
  width: `${clampedProgress}%`
}}
        />
      </div>
    </div>
  )
}

export const CircularProgress = ({
  progress = 0,
  size = 64,
  strokeWidth = 4,
  color = 'blue',
  children
}) => {
  const colorClasses = {
    blue: '#58a6ff',
    green: '#10b981',
    purple: '#a371f7',
    red: '#ef4444'
  }

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div style={{
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          style={{
  color: '#8b949e'
}}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClasses[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {children && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          {children}
        </div>
      )}
    </div>
  )
}




export default ProgressBar
