import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const isModerator = user?.role === 'moderator' || user?.role === 'admin'

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (!isModerator) {
    navigate('/forbidden')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Reports page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" style={{ color: 'var(--text-primary)' }}>
            Reports Dashboard
          </h1>
          <p style={{color: "var(--text-secondary)"}} className=" text-lg">
            Review and manage user-submitted reports
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-orange-400">24</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1">Pending Reports</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-sm">Requires review</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-400">156</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1">Under Review</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-sm">Being investigated</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-400">892</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1">Resolved Today</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-sm">Last 24 hours</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                <svg style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-red-400">45</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1">Rejected</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-sm">False reports</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-2">
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  overflow-hidden">
              <div style={{borderColor: "var(--border-subtle)"}} className="p-6 border-b ">
                <h2 style={{color: "var(--text-primary)"}} className="text-xl font-bold ">Recent Reports</h2>
              </div>
              <div className="divide-y divide-white/10">
                {[
                  { id: 1, type: 'spam', reason: 'Excessive promotional content', reported: 'user123', reportedBy: 'mod_team', time: '5m ago', severity: 'high', status: 'pending' },
                  { id: 2, type: 'harassment', reason: 'Abusive language and threats', reported: 'troll456', reportedBy: 'user_report', time: '12m ago', severity: 'critical', status: 'under_review' },
                  { id: 3, type: 'misinformation', reason: 'Spreading false information', reported: 'fakeNews789', reportedBy: 'community', time: '23m ago', severity: 'medium', status: 'pending' },
                  { id: 4, type: 'inappropriate', reason: 'NSFW content without warning', reported: 'poster321', reportedBy: 'auto_detect', time: '34m ago', severity: 'high', status: 'under_review' },
                  { id: 5, type: 'copyright', reason: 'Unauthorized use of copyrighted material', reported: 'copycat654', reportedBy: 'copyright_bot', time: '45m ago', severity: 'medium', status: 'pending' }
                ].map(report => (
                  <div key={report.id} className="p-4 hover:bg-[#21262d]/50 transition-colors">
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
                          <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                            report.status === 'pending' ? 'bg-orange-900/50 text-orange-400 border border-orange-700/50' :
                            'bg-blue-900/50 text-blue-400 border border-blue-700/50'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                          <span style={{color: "var(--text-secondary)"}} className=" text-sm">{report.time}</span>
                        </div>
                        <p style={{color: "var(--text-primary)"}} className=" mb-2">{report.reason}</p>
                        <div style={{color: "var(--text-secondary)"}} className="flex items-center gap-4 text-sm ">
                          <span>Reported: <span style={{color: "var(--text-primary)"}} className="">{report.reported}</span></span>
                          <span>By: <span style={{color: "var(--text-primary)"}} className="">{report.reportedBy}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  text-sm rounded-lg transition-colors">
                        Review
                      </button>
                      <button style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-red-600 hover:bg-red-500  text-sm rounded-lg transition-colors">
                        Take Action
                      </button>
                      <button style={{borderColor: "var(--border-subtle)"}} className="px-4 py-2 bg-[#21262d] border  hover:bg-[#30363d]  text-sm rounded-lg transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-lg font-bold  mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button style={{color: "var(--text-primary)"}} className="w-full px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>View All Reports</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-3 bg-[#21262d] border  hover:bg-[#30363d]  rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>Export Reports</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-3 bg-[#21262d] border  hover:bg-[#30363d]  rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>View Analytics</span>
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Report Categories */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-lg font-bold  mb-4">Report Categories</h3>
              <div className="space-y-3">
                {[
                  { name: 'Spam', count: 45, color: 'text-[#58a6ff]' },
                  { name: 'Harassment', count: 28, color: 'text-red-400' },
                  { name: 'Misinformation', count: 19, color: 'text-yellow-400' },
                  { name: 'Inappropriate', count: 32, color: 'text-orange-400' },
                  { name: 'Copyright', count: 12, color: 'text-[#a371f7]' }
                ].map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span style={{color: "var(--text-secondary)"}} className="">{category.name}</span>
                    <span className={`font-semibold ${category.color}`}>{category.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-lg font-bold  mb-3">Review Guidelines</h3>
              <ul style={{color: "var(--text-secondary)"}} className="space-y-2 text-sm ">
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Check full context before deciding</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Document your decision rationale</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Escalate severe violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Follow community guidelines</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

