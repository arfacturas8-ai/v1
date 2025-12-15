import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowToast(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div>
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50
          }}
        >
          <div style={{
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderRadius: '12px',
            background: isOnline ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ffffff',
            minWidth: '250px'
          }}>
            {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
            <span style={{
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {isOnline ? 'Back online' : 'No internet connection'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}




export default OfflineIndicator
