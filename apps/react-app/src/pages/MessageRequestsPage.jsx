import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Check, X, Clock, User } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

export default function MessageRequestsPage() {
  const { isMobile, isTablet } = useResponsive()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  useEffect(() => {
    fetchMessageRequests()
  }, [filter])

  const fetchMessageRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages/requests?status=${filter}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Fetch requests error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await fetch(`/api/messages/requests/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include'
      })
      fetchMessageRequests()
    } catch (error) {
      console.error('Accept request error:', error)
    }
  }

  const handleDecline = async (requestId) => {
    try {
      await fetch(`/api/messages/requests/${requestId}/decline`, {
        method: 'POST',
        credentials: 'include'
      })
      fetchMessageRequests()
    } catch (error) {
      console.error('Decline request error:', error)
    }
  }

  return (
    <div
      role="main"
      aria-label="Message requests page"
      style={{
        minHeight: '100vh',
        paddingTop: headerOffset,
        paddingLeft: padding,
        paddingRight: padding,
        paddingBottom: '48px',
        background: 'var(--bg-primary)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Message Requests
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.6'
          }}>
            Review messages from people you don't follow
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0'
        }}>
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'declined', label: 'Declined' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                paddingLeft: isMobile ? '16px' : '20px',
                paddingRight: isMobile ? '16px' : '20px',
                paddingTop: '12px',
                paddingBottom: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: filter === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                color: filter === tab.id ? '#58a6ff' : 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.2s'
              }}
              aria-label={`View ${tab.label} requests`}
              aria-pressed={filter === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {requests.length === 0 && !isLoading ? (
          <div style={{
            textAlign: 'center',
            paddingTop: isMobile ? '48px' : '80px',
            paddingBottom: isMobile ? '48px' : '80px',
            paddingLeft: isMobile ? '16px' : '20px',
            paddingRight: isMobile ? '16px' : '20px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ marginBottom: isMobile ? '16px' : '24px', display: 'flex', justifyContent: 'center' }}>
              <MessageCircle
                style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', flexShrink: 0, color: 'var(--text-tertiary)' }}
                aria-hidden="true"
              />
            </div>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '600',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              No {filter} message requests
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: '1.6'
            }}>
              When people send you messages, they'll appear here
            </p>
          </div>
        ) : !isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((request, index) => (
              <div
                key={request.id || index}
                style={{
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User style={{ width: '24px', height: '24px', flexShrink: 0, color: 'var(--text-inverse)' }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      {request.username || 'Anonymous'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {request.message || 'Sent you a message request'}
                    </div>
                  </div>
                </div>
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleAccept(request.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        height: '36px',
                        background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-inverse)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <Check style={{ width: '16px', height: '16px', flexShrink: 0 }} aria-hidden="true" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        height: '36px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                    >
                      <X style={{ width: '16px', height: '16px', flexShrink: 0 }} aria-hidden="true" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
