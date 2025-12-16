import React, { useState, useEffect, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils"
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import apiService from '../services/api'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

export default function ModerationPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    pendingReports: 0,
    flaggedContent: 0,
    resolvedToday: 0,
    activeBans: 0
  })
  const [reports, setReports] = useState([])
  const [moderatorStats, setModeratorStats] = useState({
    actionsToday: 0,
    actionsThisWeek: 0,
    accuracyRate: 0,
    avgResponseTime: '0m'
  })
  const [processingReport, setProcessingReport] = useState(null)

  useLoadingAnnouncement(loading, 'Loading moderation dashboard')
  useErrorAnnouncement(error)

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

  const loadModerationData = async () => {
    setLoading(true)
    setError(null)

    try {
      const statsResponse = await apiService.get('/moderation/stats')
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats || stats)
      }

      const reportsResponse = await apiService.get('/moderation/reports')
      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data.reports || [])
      }

      const modStatsResponse = await apiService.get('/moderation/moderator-stats')
      if (modStatsResponse.success && modStatsResponse.data) {
        setModeratorStats(modStatsResponse.data.stats || moderatorStats)
      }
    } catch (err) {
      console.error('Failed to load moderation data:', err)
      setError(err.message || 'Failed to load moderation data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewReport = useCallback(async (reportId) => {
    try {
      const response = await apiService.post(`/moderation/reports/${reportId}/review`)
      if (response.success) {
        navigate(`/moderation/reports/${reportId}`)
      } else {
        setError(response.error || 'Failed to open report for review')
      }
    } catch (err) {
      console.error('Failed to review report:', err)
      setError(err.message || 'Failed to open report for review')
    }
  }, [navigate])

  const handleRemoveContent = useCallback(async (reportId) => {
    if (!window.confirm('Are you sure you want to remove this content?')) {
      return
    }

    setProcessingReport(reportId)
    try {
      const response = await apiService.post(`/moderation/reports/${reportId}/remove-content`)
      if (response.success) {
        loadModerationData()
      } else {
        setError(response.error || 'Failed to remove content')
      }
    } catch (err) {
      console.error('Failed to remove content:', err)
      setError(err.message || 'Failed to remove content')
    } finally {
      setProcessingReport(null)
    }
  }, [])

  const handleDismissReport = useCallback(async (reportId) => {
    setProcessingReport(reportId)
    try {
      const response = await apiService.post(`/moderation/reports/${reportId}/dismiss`)
      if (response.success) {
        loadModerationData()
      } else {
        setError(response.error || 'Failed to dismiss report')
      }
    } catch (err) {
      console.error('Failed to dismiss report:', err)
      setError(err.message || 'Failed to dismiss report')
    } finally {
      setProcessingReport(null)
    }
  }, [])

  const handleQuickAction = useCallback((action) => {
    navigate(`/moderation/${action}`)
  }, [navigate])

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  if (!isAuthenticated || !isModerator) {
    return null
  }

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        role="main"
        aria-label="Moderation page"
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid var(--border-subtle)',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading moderation dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          paddingTop: headerOffset
        }}
        role="main"
        aria-label="Moderation page"
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: `${padding} ${isMobile ? '16px' : isTablet ? '24px' : '32px'}`
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              textAlign: 'center'
            }}
          >
            <svg
              style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto 16px' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 style={{ color: 'var(--text-primary)', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Error Loading Data
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : '16px', margin: '0 0 24px 0' }}>
              {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
            </p>
            <button
              onClick={loadModerationData}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                height: '48px',
                minWidth: '120px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              aria-label="Retry loading"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statsData = [
    { label: 'Pending Reports', value: stats.pendingReports, desc: 'Requires immediate attention', color: '#ef4444', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Flagged Content', value: stats.flaggedContent, desc: 'Auto-detected violations', color: '#3b82f6', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Resolved Today', value: stats.resolvedToday, desc: 'Closed in last 24h', color: '#10b981', iconPath: 'M5 13l4 4L19 7' },
    { label: 'Active Bans', value: stats.activeBans, desc: 'Temporary suspensions', color: '#a371f7', iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ]

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        paddingTop: headerOffset
      }}
      role="main"
      aria-label="Moderation page"
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `${padding} ${isMobile ? '16px' : isTablet ? '24px' : '32px'}`
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1
            style={{
              fontSize: isMobile ? '28px' : '40px',
              fontWeight: 'bold',
              marginBottom: '8px',
              background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Moderation Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : '16px', margin: 0 }}>
            Manage content, users, and reports across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '24px' : '32px'
          }}
        >
          {statsData.map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg
                    style={{ width: '24px', height: '24px', flexShrink: 0, color: 'var(--text-primary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.iconPath} />
                  </svg>
                </div>
                <span style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</span>
              </div>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>{stat.label}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '16px' : '24px'
          }}
        >
          <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: isMobile ? '16px' : '24px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <h2 style={{ color: 'var(--text-primary)', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', margin: 0 }}>
                  Recent Reports
                </h2>
              </div>
              {reports.length === 0 ? (
                <div style={{ padding: isMobile ? '32px' : '48px', textAlign: 'center' }}>
                  <svg
                    style={{ width: '64px', height: '64px', color: '#58a6ff', margin: '0 auto 16px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>No Reports</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>All clear! No pending reports at this time.</p>
                </div>
              ) : (
                <div>
                  {reports.map(report => (
                    <div
                      key={report.id}
                      style={{
                        padding: '16px',
                        borderTop: '1px solid var(--border-subtle)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '8px',
                              fontWeight: '500',
                              background: report.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : report.severity === 'high' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                              color: report.severity === 'critical' ? '#ef4444' : report.severity === 'high' ? '#f97316' : '#eab308',
                              border: report.severity === 'critical' ? '1px solid rgba(239, 68, 68, 0.3)' : report.severity === 'high' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)'
                            }}
                          >
                            {report.type}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{report.time}</span>
                        </div>
                        <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '0 0 4px 0' }}>{report.content}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                          Reported user: <span style={{ color: 'var(--text-primary)' }}>{report.user}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleReviewReport(report.id)}
                          disabled={processingReport === report.id}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: processingReport === report.id ? 'not-allowed' : 'pointer',
                            height: '36px',
                            opacity: processingReport === report.id ? 0.5 : 1,
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => { if (processingReport !== report.id) e.currentTarget.style.opacity = '0.9' }}
                          onMouseLeave={(e) => { if (processingReport !== report.id) e.currentTarget.style.opacity = '1' }}
                          aria-label={`Review report about ${report.type}`}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleRemoveContent(report.id)}
                          disabled={processingReport === report.id}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: processingReport === report.id ? 'not-allowed' : 'pointer',
                            height: '36px',
                            opacity: processingReport === report.id ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (processingReport !== report.id) {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (processingReport !== report.id) {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                            }
                          }}
                          aria-label={`Remove content for report about ${report.type}`}
                        >
                          {processingReport === report.id ? 'Processing...' : 'Remove'}
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          disabled={processingReport === report.id}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: processingReport === report.id ? 'not-allowed' : 'pointer',
                            height: '36px',
                            opacity: processingReport === report.id ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { if (processingReport !== report.id) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                          onMouseLeave={(e) => { if (processingReport !== report.id) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                          aria-label={`Dismiss report about ${report.type}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            {/* Quick Actions */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px'
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Ban User', action: 'ban-user', primary: true },
                  { label: 'Remove Content', action: 'remove-content' },
                  { label: 'Issue Warning', action: 'issue-warning' },
                  { label: 'View Audit Log', action: 'audit-log' }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(item.action)}
                    style={{
                      padding: '12px 16px',
                      background: item.primary ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)' : 'var(--bg-secondary)',
                      color: item.primary ? 'white' : 'var(--text-primary)',
                      border: item.primary ? 'none' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = item.primary ? '0.9' : '1'
                      e.currentTarget.style.background = item.primary ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)' : 'var(--bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.background = item.primary ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)' : 'var(--bg-secondary)'
                    }}
                    aria-label={item.label}
                  >
                    <span>{item.label}</span>
                    <svg
                      style={{ width: '24px', height: '24px', flexShrink: 0 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Moderator Info */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px'
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                Your Stats
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Actions Today', value: moderatorStats.actionsToday, color: 'var(--text-primary)' },
                  { label: 'This Week', value: moderatorStats.actionsThisWeek, color: 'var(--text-primary)' },
                  { label: 'Accuracy Rate', value: `${moderatorStats.accuracyRate}%`, color: '#10b981' },
                  { label: 'Avg Response Time', value: moderatorStats.avgResponseTime, color: '#58a6ff' }
                ].map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.label}</span>
                    <span style={{ color: item.color, fontSize: '14px', fontWeight: '600' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px'
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                Guidelines
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Review context before action',
                  'Document all decisions',
                  'Escalate serious violations',
                  'Maintain professionalism'
                ].map((text, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg
                      style={{ width: '20px', height: '20px', flexShrink: 0, color: 'var(--text-secondary)', marginTop: '2px' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{text}</span>
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

ModerationPage.propTypes = {}
