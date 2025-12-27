/**
 * MessageRequestsPage - iOS Modern Aesthetic
 * Message requests interface with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Check, X, Clock, User } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

export default function MessageRequestsPage() {
  const { isMobile } = useResponsive()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

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
        padding: isMobile ? '72px 16px 48px' : '88px 80px 48px',
        background: '#FAFAFA',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1 style={{
            color: '#000000',
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            Message Requests
          </h1>
          <p style={{
            color: '#666666',
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.6',
            margin: 0
          }}>
            Review messages from people you don't follow
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #E0E0E0',
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
              aria-label={`View ${tab.label} requests`}
              aria-pressed={filter === tab.id}
              style={{
                padding: isMobile ? '12px 16px' : '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: filter === tab.id ? '2px solid #000000' : '2px solid transparent',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: filter === tab.id ? '#000000' : '#666666',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (filter !== tab.id) {
                  e.currentTarget.style.color = '#000000'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== tab.id) {
                  e.currentTarget.style.color = '#666666'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {requests.length === 0 && !isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '48px 16px' : '80px 20px',
            borderRadius: '20px',
            border: '1px solid #E0E0E0',
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ marginBottom: isMobile ? '16px' : '24px', display: 'flex', justifyContent: 'center' }}>
              <MessageCircle
                size={isMobile ? 48 : 64}
                style={{ color: '#CCCCCC' }}
                aria-hidden="true"
              />
            </div>
            <h3 style={{
              color: '#000000',
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 600,
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              No {filter} message requests
            </h3>
            <p style={{
              color: '#666666',
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: '1.6',
              margin: 0
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
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={20} style={{ color: '#FFFFFF' }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ color: '#000000', fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                      {request.username || 'Anonymous'}
                    </div>
                    <div style={{ color: '#666666', fontSize: '14px' }}>
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
                        padding: '0 16px',
                        height: '48px',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Check size={20} aria-hidden="true" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0 16px',
                        height: '48px',
                        background: '#FAFAFA',
                        border: '1px solid #E0E0E0',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0F0F0'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FAFAFA'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <X size={20} aria-hidden="true" />
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
