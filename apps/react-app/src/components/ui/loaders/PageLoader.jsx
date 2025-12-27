import React from 'react';
/**
 * PageLoader Component
 * Full-page loading indicator with animations
 */

export function PageLoader({
  message = '',
  logo = true,
  progress = null,
  className = '',
}) {
  return (
    
      <div
        style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.5)'
}}
      >
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
          {/* Logo or spinner */}
          {logo ? (
            <div
              style={{
  position: 'relative'
}}
            >
              <div
                style={{
  width: '80px',
  height: '80px',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
              >
                <span style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>C</span>
              </div>

              {/* Orbiting dots */}
              <div
                style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
              >
                <div style={{
  position: 'relative',
  width: '128px',
  height: '128px'
}}>
                  {[0, 120, 240].map((angle, i) => (
                    <div
                      key={i}
                      style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${angle}deg) translateY(-60px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Spinner size="lg" />
          )}

          {/* Loading message */}
          <div
            style={{
  textAlign: 'center'
}}
          >
            <p style={{
  fontWeight: '500',
  color: '#A0A0A0'
}}>
              {message}
            </p>
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div
              style={{
  width: '256px',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '50%',
  overflow: 'hidden'
}}
            >
              <div
                style={{
  height: '100%',
  borderRadius: '50%',
  width: `${progress}%`
}}
              />
            </div>
          )}
        </div>
      </div>
    
  );
}

export function Spinner({
  size = 'md',
  color = 'blue',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      style={{
  borderRadius: '50%'
}}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  );
}

export function DotLoader({
  size = 'md',
  color = 'blue',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  const colorClasses = {
    blue: 'bg-[#58a6ff]',
    purple: 'bg-[#a371f7]',
    gray: 'bg-gray-600',
    white: 'bg-white',
  };

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
  borderRadius: '50%'
}}
        />
      ))}
      <span className="sr-only"></span>
    </div>
  );
}

export function PulseLoader({
  size = 'md',
  color = 'blue',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'bg-[#58a6ff]',
    purple: 'bg-[#a371f7]',
    gray: 'bg-gray-600',
    white: 'bg-white',
  };

  return (
    <div style={{
  position: 'relative'
}} role="status" aria-label="Loading">
      <div
        style={{
  position: 'absolute',
  borderRadius: '50%'
}}
      />
      <div
        style={{
  position: 'absolute',
  borderRadius: '50%'
}}
      />
      <span className="sr-only"></span>
    </div>
  );
}

export function BarLoader({
  width = '100%',
  height = '4px',
  color = 'blue',
  className = '',
}) {
  const colorClasses = {
    blue: 'bg-[#58a6ff]',
    purple: 'bg-[#a371f7]',
    gray: 'bg-gray-600',
    white: 'bg-white',
  };

  return (
    <div
      style={{
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '50%',
  background: 'rgba(0, 0, 0, 0.5)'
}}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    >
      <div
        style={{
  position: 'absolute',
  height: '100%',
  borderRadius: '50%',
  width: '50%'
}}
      />
      <span className="sr-only"></span>
    </div>
  );
}




export default PageLoader
