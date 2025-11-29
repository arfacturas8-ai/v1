import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ModerationPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Check if user has moderator or admin role
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
    <div className="min-h-screen bg-[#0d1117]" role="main" aria-label="Moderation page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Moderation Dashboard
          </h1>
          <p className="text-[#8b949e] text-lg">
            Manage content, users, and reports across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-red-400">24</span>
            </div>
            <h3 className="text-[#c9d1d9] font-medium mb-1">Pending Reports</h3>
            <p className="text-[#8b949e] text-sm">Requires immediate attention</p>
          </div>

          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#58a6ff] to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-400">156</span>
            </div>
            <h3 className="text-[#c9d1d9] font-medium mb-1">Flagged Content</h3>
            <p className="text-[#8b949e] text-sm">Auto-detected violations</p>
          </div>

          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-400">892</span>
            </div>
            <h3 className="text-[#c9d1d9] font-medium mb-1">Resolved Today</h3>
            <p className="text-[#8b949e] text-sm">Closed in last 24h</p>
          </div>

          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-[#a371f7] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-purple-400">12</span>
            </div>
            <h3 className="text-[#c9d1d9] font-medium mb-1">Active Bans</h3>
            <p className="text-[#8b949e] text-sm">Temporary suspensions</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Recent Reports</h2>
              </div>
              <div className="divide-y divide-white/10">
                {[
                  { id: 1, type: 'spam', content: 'Promotional content in comment', user: 'user123', time: '5m ago', severity: 'high' },
                  { id: 2, type: 'harassment', content: 'Abusive language in post', user: 'troll456', time: '12m ago', severity: 'critical' },
                  { id: 3, type: 'misinformation', content: 'False claims about product', user: 'fakeNews789', time: '23m ago', severity: 'medium' },
                  { id: 4, type: 'inappropriate', content: 'NSFW content without tag', user: 'poster321', time: '34m ago', severity: 'high' },
                  { id: 5, type: 'copyright', content: 'Unauthorized image use', user: 'copycat654', time: '45m ago', severity: 'medium' }
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
                          <span className="text-[#8b949e] text-sm">{report.time}</span>
                        </div>
                        <p className="text-[#c9d1d9] mb-1">{report.content}</p>
                        <p className="text-[#8b949e] text-sm">Reported user: <span className="text-[#c9d1d9]">{report.user}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white text-sm rounded-lg transition-colors">
                        Review
                      </button>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors">
                        Remove
                      </button>
                      <button className="px-4 py-2 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white text-sm rounded-lg transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>Ban User</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full px-4 py-3 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>Remove Content</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full px-4 py-3 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>Issue Warning</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full px-4 py-3 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white rounded-lg font-medium transition-all text-left flex items-center justify-between group">
                  <span>View Audit Log</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Moderator Info */}
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">Actions Today</span>
                  <span className="text-white font-semibold">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">This Week</span>
                  <span className="text-white font-semibold">312</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">Accuracy Rate</span>
                  <span className="text-green-400 font-semibold">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">Avg Response Time</span>
                  <span className="text-[#58a6ff] font-semibold">8.3m</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
              <h3 className="text-lg font-bold text-white mb-3">Guidelines</h3>
              <ul className="space-y-2 text-sm text-[#8b949e]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Review context before action</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Document all decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Escalate serious violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

