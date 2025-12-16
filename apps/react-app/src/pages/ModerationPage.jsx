import React, { useState, useEffect, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

export default function ModerationPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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

  // Accessibility announcements
  useLoadingAnnouncement(loading, 'Loading moderation dashboard')
  useErrorAnnouncement(error)

  // Check if user has moderator or admin role
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
      // Fetch moderation stats
      const statsResponse = await apiService.get('/moderation/stats')
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats || stats)
      }

      // Fetch recent reports
      const reportsResponse = await apiService.get('/moderation/reports')
      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data.reports || [])
      }

      // Fetch moderator stats
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
        // Navigate to detailed review page or open modal
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

  if (!isAuthenticated || !isModerator) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Moderation page">
        <div className="text-center">
          <div style={{ width: "64px", height: "64px", flexShrink: 0 }}></div>
          <p className="text-[#666666]">Loading moderation dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Moderation page">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-white  rounded-2xl p-8 text-center shadow-sm" style={{ border: '1px solid var(--border-subtle)' }}>
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Data</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <button
              onClick={loadModerationData}
              style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
              aria-label="Retry loading"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Moderation page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Moderation Dashboard
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Manage content, users, and reports across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white  rounded-2xl shadow-sm p-6 hover:border-[#58a6ff]/30 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-red-400">{stats.pendingReports}</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Pending Reports</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Requires immediate attention</p>
          </div>

          <div className="bg-white  rounded-2xl shadow-sm p-6 hover:border-[#58a6ff]/30 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.flaggedContent}</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Flagged Content</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Auto-detected violations</p>
          </div>

          <div className="bg-white  rounded-2xl shadow-sm p-6 hover:border-[#58a6ff]/30 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-400">{stats.resolvedToday}</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Resolved Today</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Closed in last 24h</p>
          </div>

          <div className="bg-white  rounded-2xl shadow-sm p-6 hover:border-[#58a6ff]/30 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-purple-400">{stats.activeBans}</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Active Bans</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Temporary suspensions</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <div className="bg-white  rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent Reports</h2>
              </div>
              {reports.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-[#58a6ff] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>No Reports</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>All clear! No pending reports at this time.</p>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {reports.map(report => (
                    <div key={report.id} className="p-4 transition-colors" style={{ borderTop: '1px solid var(--border-subtle)', hover: { background: 'var(--bg-secondary)' } }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                              report.severity === 'critical' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                              report.severity === 'high' ? 'bg-orange-900/50 text-orange-400 border border-orange-700/50' :
                              'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                            }`}>
                              {report.type}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{report.time}</span>
                          </div>
                          <p className="mb-1" style={{ color: 'var(--text-primary)' }}>{report.content}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reported user: <span style={{ color: 'var(--text-primary)' }}>{report.user}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewReport(report.id)}
                          style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  text-sm rounded-lg transition-colors"
                          disabled={processingReport === report.id}
                          aria-label={`Review report about ${report.type}`}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleRemoveContent(report.id)}
                          className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50"
                          disabled={processingReport === report.id}
                          aria-label={`Remove content for report about ${report.type}`}
                        >
                          {processingReport === report.id ? 'Processing...' : 'Remove'}
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          className="px-4 py-2 bg-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                          disabled={processingReport === report.id}
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

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white  rounded-2xl shadow-sm p-6" style={{ border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleQuickAction('ban-user')}
                  style={{color: "var(--text-primary)"}} className="w-full px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  aria-label="Ban user"
                >
                  <span>Ban User</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('remove-content')}
                  className="w-full px-4 py-3 bg-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  aria-label="Remove content"
                >
                  <span>Remove Content</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('issue-warning')}
                  className="w-full px-4 py-3 bg-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  aria-label="Issue warning"
                >
                  <span>Issue Warning</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('audit-log')}
                  className="w-full px-4 py-3 bg-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  aria-label="View audit log"
                >
                  <span>View Audit Log</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Moderator Info */}
            <div className="bg-white  rounded-2xl shadow-sm p-6" style={{ border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Actions Today</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{moderatorStats.actionsToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>This Week</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{moderatorStats.actionsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Accuracy Rate</span>
                  <span className="text-green-400 font-semibold">{moderatorStats.accuracyRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Avg Response Time</span>
                  <span className="text-[#58a6ff] font-semibold">{moderatorStats.avgResponseTime}</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white  rounded-2xl shadow-sm p-6" style={{ border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Guidelines</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Review context before action</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Document all decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Escalate serious violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Maintain professionalism</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

ModerationPage.propTypes = {}
