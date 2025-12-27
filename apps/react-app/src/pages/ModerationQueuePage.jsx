/**
 * ModerationQueuePage.jsx
 * iOS-styled moderation queue with pending items
 * Design: #FAFAFA bg, #000/#666 text, white cards, 16-24px radius, gradient buttons
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

export default function ModerationQueuePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    pendingReview: 0,
    highPriority: 0,
    processedToday: 0,
    avgResponseTime: '0m'
  })
  const [queueItems, setQueueItems] = useState([])
  const [priorityBreakdown, setPriorityBreakdown] = useState([
    { priority: 'Critical', count: 0, color: '#ef4444' },
    { priority: 'High', count: 0, color: '#f97316' },
    { priority: 'Medium', count: 0, color: '#eab308' },
    { priority: 'Low', count: 0, color: '#3b82f6' }
  ])

  const isModerator = user?.role === 'moderator' || user?.role === 'admin'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!isModerator) {
      navigate('/forbidden')
      return
    }

    loadModerationData()
  }, [isAuthenticated, isModerator, navigate])

  const loadModerationData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch moderation queue stats
      const statsResponse = await apiService.get('/moderation/queue/stats')
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Fetch queue items
      const queueResponse = await apiService.get('/moderation/queue/items')
      if (queueResponse.success && queueResponse.data) {
        setQueueItems(queueResponse.data.items || [])
      }

      // Fetch priority breakdown
      const breakdownResponse = await apiService.get('/moderation/queue/priority-breakdown')
      if (breakdownResponse.success && breakdownResponse.data) {
        setPriorityBreakdown(breakdownResponse.data.breakdown || priorityBreakdown)
      }
    } catch (err) {
      console.error('Failed to load moderation queue data:', err)
      setError(err.message || 'Failed to load moderation queue data')
    } finally {
      setLoading(false)
    }
  }, [])

  if (!isAuthenticated || !isModerator) {
    return null
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '32px 16px' }} role="main" aria-label="Moderation queue page">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 'bold',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Moderation Queue
          </h1>
          <p style={{ color: '#666666', fontSize: '16px' }}>
            Review flagged content awaiting moderation
          </p>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#999', fontSize: '14px' }}>Loading...</div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '32px', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ color: '#eab308', width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#eab308' }}>{stats.pendingReview?.toLocaleString() || '0'}</span>
              </div>
              <h3 style={{ color: '#000000', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Pending Review</h3>
              <p style={{ color: '#666666', fontSize: '12px' }}>Awaiting action</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ color: '#ef4444', width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.highPriority?.toLocaleString() || '0'}</span>
              </div>
              <h3 style={{ color: '#000000', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>High Priority</h3>
              <p style={{ color: '#666666', fontSize: '12px' }}>Requires immediate attention</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ color: '#10b981', width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.processedToday?.toLocaleString() || '0'}</span>
              </div>
              <h3 style={{ color: '#000000', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Processed Today</h3>
              <p style={{ color: '#666666', fontSize: '12px' }}>Last 24 hours</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ color: '#3b82f6', width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgResponseTime || '0m'}</span>
              </div>
              <h3 style={{ color: '#000000', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Avg Response Time</h3>
              <p style={{ color: '#666666', fontSize: '12px' }}>Queue processing</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          {/* Queue Items */}
          <div>
            <div style={{ background: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ color: '#000000', fontSize: '20px', fontWeight: 'bold' }}>Queue Items</h2>
                <select style={{ padding: '10px 16px', background: '#FAFAFA', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', color: '#000000', cursor: 'pointer' }}>
                  <option>All Priorities</option>
                  <option>High Priority</option>
                  <option>Normal</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading queue items...</div>
                ) : queueItems.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No items in queue</div>
                ) : (
                  queueItems.map(item => (
                  <div key={item.id} style={{ padding: '20px', borderTop: '1px solid #F0F0F0', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          background: item.priority === 'critical' ? 'rgba(239, 68, 68, 0.1)' : item.priority === 'high' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: item.priority === 'critical' ? '#ef4444' : item.priority === 'high' ? '#f97316' : '#eab308'
                        }}>
                          {item.type}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666666' }}>{item.flagged}</span>
                        <span style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '12px', fontWeight: '600', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                          {item.reports} reports
                        </span>
                      </div>
                      <p style={{ color: '#000000', fontSize: '14px', marginBottom: '4px' }}>{item.content}</p>
                      <p style={{ fontSize: '12px', color: '#666666' }}>User: <span style={{ color: '#000000', fontWeight: '500' }}>{item.user}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button style={{ padding: '10px 20px', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        Review
                      </button>
                      <button style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}>
                        Remove
                      </button>
                      <button style={{ padding: '10px 20px', background: '#F0F0F0', color: '#000000', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#E5E5E5'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F0F0F0'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Queue Settings */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Queue Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <span>Auto-assign Items</span>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{ padding: '14px 16px', background: '#FAFAFA', color: '#000000', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <span>Clear Completed</span>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{ padding: '14px 16px', background: '#FAFAFA', color: '#000000', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <span>Export Queue</span>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Priority Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                  <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Loading...</div>
                ) : (
                  priorityBreakdown.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666666', fontSize: '14px' }}>{item.priority}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>{item.count}</span>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Quick Tips</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Process high priority items first',
                  'Review full context before action',
                  'Document decisions in audit log',
                  'Escalate unclear cases to admin'
                ].map((tip, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg style={{ width: '20px', height: '20px', flexShrink: 0, color: '#000000', marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span style={{ color: '#666666', fontSize: '13px' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
