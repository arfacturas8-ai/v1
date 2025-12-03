import React, { useState, useEffect, useCallback } from 'react'
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
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center" role="main" aria-label="Moderation page">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading moderation dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]" role="main" aria-label="Moderation page">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl text-white mb-2">Error Loading Data</h2>
            <p className="text-[#666666] mb-6">{error}</p>
            <button
              onClick={loadModerationData}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
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
    <div className="min-h-screen bg-[#0D0D0D]" role="main" aria-label="Moderation page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Moderation Dashboard
          </h1>
          <p className="text-[#666666] text-lg">
            Manage content, users, and reports across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-red-400">{stats.pendingReports}</span>
            </div>
            <h3 className="text-[#A0A0A0] font-medium mb-1">Pending Reports</h3>
            <p className="text-[#666666] text-sm">Requires immediate attention</p>
          </div>

          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#58a6ff] to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.flaggedContent}</span>
            </div>
            <h3 className="text-[#A0A0A0] font-medium mb-1">Flagged Content</h3>
            <p className="text-[#666666] text-sm">Auto-detected violations</p>
          </div>

          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-400">{stats.resolvedToday}</span>
            </div>
            <h3 className="text-[#A0A0A0] font-medium mb-1">Resolved Today</h3>
            <p className="text-[#666666] text-sm">Closed in last 24h</p>
          </div>

          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-[#a371f7] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-purple-400">{stats.activeBans}</span>
            </div>
            <h3 className="text-[#A0A0A0] font-medium mb-1">Active Bans</h3>
            <p className="text-[#666666] text-sm">Temporary suspensions</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Recent Reports</h2>
              </div>
              {reports.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-[#58a6ff] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl text-white mb-2">No Reports</h3>
                  <p className="text-[#666666]">All clear! No pending reports at this time.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {reports.map(report => (
                    <div key={report.id} className="p-4 hover:bg-[#1A1A1A]/50 transition-colors">
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
                            <span className="text-[#666666] text-sm">{report.time}</span>
                          </div>
                          <p className="text-[#A0A0A0] mb-1">{report.content}</p>
                          <p className="text-[#666666] text-sm">Reported user: <span className="text-[#A0A0A0]">{report.user}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewReport(report.id)}
                          className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white text-sm rounded-lg transition-colors"
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
                          className="px-4 py-2 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
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
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleQuickAction('ban-user')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  aria-label="Ban user"
                >
                  <span>Ban User</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('remove-content')}
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  aria-label="Remove content"
                >
                  <span>Remove Content</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('issue-warning')}
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  aria-label="Issue warning"
                >
                  <span>Issue Warning</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('audit-log')}
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group"
                  aria-label="View audit log"
                >
                  <span>View Audit Log</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Moderator Info */}
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Actions Today</span>
                  <span className="text-white font-semibold">{moderatorStats.actionsToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">This Week</span>
                  <span className="text-white font-semibold">{moderatorStats.actionsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Accuracy Rate</span>
                  <span className="text-green-400 font-semibold">{moderatorStats.accuracyRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Avg Response Time</span>
                  <span className="text-[#58a6ff] font-semibold">{moderatorStats.avgResponseTime}</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-3">Guidelines</h3>
              <ul className="space-y-2 text-sm text-[#666666]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Review context before action</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Document all decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Escalate serious violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
