import React, { memo } from 'react'

const LoadingSpinner = memo(({ 
  size = 'md', 
  color = 'accent',
  variant = 'spinner',
  className = '',
  text = null,
  inline = false,
  fullscreen = false,
  'aria-label': ariaLabel = 'Loading'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    accent: 'text-accent',
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted',
    white: 'text-white',
    inherit: 'text-current'
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const getSpinnerContent = () => {
    const baseClasses = `${sizeClasses[size]} ${colorClasses[color]} `
    
    switch (variant) {
      case 'dots':
        return (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
}}>
            <div style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  animationDelay: '0ms'
}}></div>
            <div style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  animationDelay: '150ms'
}}></div>
            <div style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  animationDelay: '300ms'
}}></div>
          </div>
        )
      
      case 'pulse':
        return (
          <div style={{
  borderRadius: '50%'
}}></div>
        )
      
      case 'bars':
        return (
          <div style={{
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '4px'
}}>
            <div style={{
  width: '4px',
  height: '60%',
  animationDelay: '0ms'
}}></div>
            <div style={{
  width: '4px',
  height: '100%',
  animationDelay: '150ms'
}}></div>
            <div style={{
  width: '4px',
  height: '80%',
  animationDelay: '300ms'
}}></div>
            <div style={{
  width: '4px',
  height: '90%',
  animationDelay: '450ms'
}}></div>
          </div>
        )
      
      case 'ring':
        return (
          <div className={baseClasses}>
            <svg 
              style={{
  width: '100%',
  height: '100%'
}} 
              viewBox="0 0 50 50" 
              fill="none"
              role="img"
              aria-hidden="true"
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeOpacity="0.2"
                fill="none"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="80"
                strokeDashoffset="60"
                fill="none"
                strokeLinecap="round"
                className=""
                style={{ transformOrigin: 'center' }}
              />
            </svg>
          </div>
        )
      
      default: // 'spinner'
        return (
          <div
            style={{
              borderRadius: '50%',
              borderTopColor: 'transparent',
              borderRightColor: 'currentColor',
              borderBottomColor: 'currentColor',
              borderLeftColor: 'currentColor'
            }}
          />
        )
    }
  }

  if (fullscreen) {
    return (
      <div 
        style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
        role="status" 
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}}>
          {getSpinnerContent()}
          {text && (
            <span style={{
  fontWeight: '500',
  textAlign: 'center'
}}>
              {text}
            </span>
          )}
        </div>
      </div>
    )
  }

  const containerClasses = inline 
    ? `inline-flex items-center gap-sm ${className}`
    : `flex ${text ? 'flex-col' : 'items-center justify-center'} items-center gap-sm ${className}`

  return (
    <div 
      className={containerClasses}
      role="status" 
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {getSpinnerContent()}
      {text && (
        <span style={{
  textAlign: 'center'
}}>
          {text}
        </span>
      )}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'



export default LoadingSpinner