import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ModerationQueuePage() {
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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Moderation queue page">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" style={{ color: 'var(--text-primary)' }}>
            Moderation Queue
          </h1>
          <p style={{color: "var(--text-secondary)"}} className=" text-base sm:text-lg">
            Review flagged content awaiting moderation
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-yellow-400">43</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Pending Review</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">Awaiting action</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-red-400">12</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">High Priority</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">Requires immediate attention</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-green-400">127</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Processed Today</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">Last 24 hours</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6 hover:border-[#58a6ff]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#58a6ff] to-blue-500 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-blue-400">8.5m</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Avg Response Time</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">Queue processing</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Queue Items */}
          <div className="lg:col-span-2">
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  overflow-hidden">
              <div style={{borderColor: "var(--border-subtle)"}} className="p-4 sm:p-6 border-b ">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 style={{color: "var(--text-primary)"}} className="text-lg sm:text-xl font-bold ">Queue Items</h2>
                  <div className="flex gap-2">
                    <select style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="px-3 py-2 bg-[#21262d] border  rounded-lg  text-sm focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none">
                      <option>All Priorities</option>
                      <option>High Priority</option>
                      <option>Normal</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {[
                  { id: 1, type: 'spam', content: 'Promotional link in comments', user: 'spammer123', priority: 'high', flagged: '5m ago', reports: 3 },
                  { id: 2, type: 'harassment', content: 'Abusive language towards users', user: 'toxic456', priority: 'critical', flagged: '12m ago', reports: 8 },
                  { id: 3, type: 'inappropriate', content: 'NSFW content without tag', user: 'poster789', priority: 'high', flagged: '18m ago', reports: 5 },
                  { id: 4, type: 'misinformation', content: 'False health claims', user: 'misinfo321', priority: 'medium', flagged: '25m ago', reports: 2 },
                  { id: 5, type: 'copyright', content: 'Copyrighted image usage', user: 'copier654', priority: 'medium', flagged: '34m ago', reports: 1 }
                ].map(item => (
                  <div key={item.id} className="p-3 sm:p-4 hover:bg-[#21262d]/50 transition-colors">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-lg font-medium whitespace-nowrap ${
                            item.priority === 'critical' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                            item.priority === 'high' ? 'bg-orange-900/50 text-orange-400 border border-orange-700/50' :
                            'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                          }`}>
                            {item.type}
                          </span>
                          <span style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm whitespace-nowrap">{item.flagged}</span>
                          <span className="px-2 py-1 text-xs rounded-lg font-medium bg-blue-900/50 text-blue-400 border border-blue-700/50 whitespace-nowrap">
                            {item.reports} reports
                          </span>
                        </div>
                        <p style={{color: "var(--text-primary)"}} className=" mb-1 text-sm sm:text-base break-words">{item.content}</p>
                        <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">User: <span style={{color: "var(--text-primary)"}} className="">{item.user}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button style={{color: "var(--text-primary)"}} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  text-xs sm:text-sm rounded-lg transition-colors">
                        Review
                      </button>
                      <button style={{color: "var(--text-primary)"}} className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-500  text-xs sm:text-sm rounded-lg transition-colors">
                        Remove
                      </button>
                      <button style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="px-3 sm:px-4 py-2 bg-[#21262d] border  hover:bg-[#30363d]  text-xs sm:text-sm rounded-lg transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Queue Settings */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-bold  mb-4">Queue Settings</h3>
              <div className="space-y-3">
                <button style={{color: "var(--text-primary)"}} className="w-full px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  rounded-lg font-medium transition-all text-left flex items-center justify-between group text-sm sm:text-base">
                  <span>Auto-assign Items</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-3 bg-[#21262d] border  hover:bg-[#30363d]  rounded-lg font-medium transition-all text-left flex items-center justify-between group text-sm sm:text-base">
                  <span>Clear Completed</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-3 bg-[#21262d] border  hover:bg-[#30363d]  rounded-lg font-medium transition-all text-left flex items-center justify-between group text-sm sm:text-base">
                  <span>Export Queue</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-bold  mb-4">Priority Breakdown</h3>
              <div className="space-y-3">
                {[
                  { priority: 'Critical', count: 12, color: 'text-red-400' },
                  { priority: 'High', count: 31, color: 'text-orange-400' },
                  { priority: 'Medium', count: 28, color: 'text-yellow-400' },
                  { priority: 'Low', count: 15, color: 'text-blue-400' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span style={{color: "var(--text-secondary)"}} className=" text-sm sm:text-base">{item.priority}</span>
                    <span className={`font-semibold ${item.color} text-sm sm:text-base`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-bold  mb-3">Quick Tips</h3>
              <ul style={{color: "var(--text-secondary)"}} className="space-y-2 text-xs sm:text-sm ">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Process high priority items first</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Review full context before action</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Document decisions in audit log</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#58a6ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Escalate unclear cases to admin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

