import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'

function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()

  // Check if user has admin role
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (!isAdmin) {
    navigate('/forbidden')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Admin dashboard page">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p style={{color: "var(--text-secondary)"}} className=" text-base sm:text-lg">
            Manage all platform operations and configurations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border border-white/10 rounded-2xl  p-4 sm:p-6 hover: transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-[#58a6ff]">45.2K</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Total Users</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">+12% from last month</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border border-white/10 rounded-2xl  p-4 sm:p-6 hover: transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">892</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Communities</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">+8 new this week</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border border-white/10 rounded-2xl  p-4 sm:p-6 hover: transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#a371f7] to-[#a371f7] rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-[#a371f7]">128.5K</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Total Posts</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">+234 today</p>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border border-white/10 rounded-2xl  p-4 sm:p-6 hover: transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 sm:w-6 sm:h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">24</span>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className=" font-medium mb-1 text-sm sm:text-base">Pending Reports</h3>
            <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm">Requires attention</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h2 style={{color: "var(--text-primary)"}} className="text-lg sm:text-xl font-bold  mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button style={{borderColor: "var(--border-subtle)"}} className="flex items-center gap-3 p-3.5 sm:p-4 bg-[#21262d]/60 hover:bg-[#21262d] border  rounded-lg transition-all group min-h-[44px]">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-lg flex items-center justify-center shrink-0">
                    <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p style={{color: "var(--text-primary)"}} className=" font-medium group-hover:text-[#58a6ff] transition-colors text-sm sm:text-base">Manage Users</p>
                    <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm truncate">View and manage all users</p>
                  </div>
                  <svg style={{color: "var(--text-primary)"}} style={{color: "var(--text-secondary)"}} className="w-5 h-5  group-hover: group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button style={{borderColor: "var(--border-subtle)"}} className="flex items-center gap-3 p-3.5 sm:p-4 bg-[#21262d]/60 hover:bg-[#21262d] border  rounded-lg transition-all group min-h-[44px]">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p style={{color: "var(--text-primary)"}} className=" font-medium group-hover:text-emerald-400 transition-colors text-sm sm:text-base">Communities</p>
                    <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm truncate">Manage communities</p>
                  </div>
                  <svg style={{color: "var(--text-primary)"}} style={{color: "var(--text-secondary)"}} className="w-5 h-5  group-hover: group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button style={{borderColor: "var(--border-subtle)"}} className="flex items-center gap-3 p-3.5 sm:p-4 bg-[#21262d]/60 hover:bg-[#21262d] border  rounded-lg transition-all group min-h-[44px]">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p style={{color: "var(--text-primary)"}} className=" font-medium group-hover:text-red-400 transition-colors text-sm sm:text-base">Moderation</p>
                    <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm truncate">Review reports & flags</p>
                  </div>
                  <svg style={{color: "var(--text-primary)"}} style={{color: "var(--text-secondary)"}} className="w-5 h-5  group-hover: group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button style={{borderColor: "var(--border-subtle)"}} className="flex items-center gap-3 p-3.5 sm:p-4 bg-[#21262d]/60 hover:bg-[#21262d] border  rounded-lg transition-all group min-h-[44px]">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg style={{color: "var(--text-primary)"}} className="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p style={{color: "var(--text-primary)"}} className=" font-medium group-hover:text-amber-400 transition-colors text-sm sm:text-base">Settings</p>
                    <p style={{color: "var(--text-secondary)"}} className=" text-xs sm:text-sm truncate">Platform configuration</p>
                  </div>
                  <svg style={{color: "var(--text-primary)"}} style={{color: "var(--text-secondary)"}} className="w-5 h-5  group-hover: group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-bold  mb-3 sm:mb-4">System Health</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span style={{color: "var(--text-secondary)"}} className="">API Status</span>
                    <span className="text-emerald-400 font-semibold">Operational</span>
                  </div>
                  <div className="w-full h-2 bg-[#21262d]/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span style={{color: "var(--text-secondary)"}} className="">Database</span>
                    <span className="text-emerald-400 font-semibold">98.2%</span>
                  </div>
                  <div className="w-full h-2 bg-[#21262d]/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98.2%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span style={{color: "var(--text-secondary)"}} className="">Cache</span>
                    <span className="text-amber-400 font-semibold">85.4%</span>
                  </div>
                  <div className="w-full h-2 bg-[#21262d]/60 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[85.4%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 sm:p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-bold  mb-3 sm:mb-4">Recent Activity</h3>
              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { action: 'User banned', time: '2m ago', icon: '🚫' },
                  { action: 'Community created', time: '15m ago', icon: '✨' },
                  { action: 'Report resolved', time: '1h ago', icon: '✅' },
                  { action: 'Settings updated', time: '2h ago', icon: '⚙️' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                    <span className="text-lg sm:text-xl shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{color: "var(--text-primary)"}} className=" truncate">{item.action}</p>
                      <p style={{color: "var(--text-secondary)"}} className=" text-xs">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gradient-to-r from-[#58a6ff]/10 via-[#a371f7]/10 to-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-2xl  p-4 sm:p-6 text-center ">
          <h3 style={{color: "var(--text-primary)"}} className="text-lg sm:text-xl font-bold  mb-2">Full Admin Panel Coming Soon</h3>
          <p style={{color: "var(--text-primary)"}} className=" mb-3 sm:mb-4 text-sm sm:text-base">
            Advanced analytics, detailed reporting, and more powerful tools are being developed.
          </p>
          <button style={{color: "var(--text-primary)"}} className="px-5 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-lg font-medium hover:opacity-90 transition-all text-sm sm:text-base min-h-[44px]">
            View Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
