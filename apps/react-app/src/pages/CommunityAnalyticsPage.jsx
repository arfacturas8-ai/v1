import React, { memo } from 'react'
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react'

const CommunityAnalyticsPage = () => {
  return (
    <div style={{color: "var(--text-primary)"}} className="min-h-screen   py-6 px-4 sm:py-10 sm:px-5" role="main" aria-label="Community analytics page">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <BarChart3 size={32} className="text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Community Analytics
          </h1>
          <p style={{color: "var(--text-secondary)"}} className="text-sm sm:text-base ">Track your community's growth and engagement</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-5 sm:p-6 text-center">
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <Users size={24} className="text-[#58a6ff]" />
            </div>
            <div style={{color: "var(--text-primary)"}} className="text-2xl sm:text-3xl font-bold  mb-1">0</div>
            <div style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm ">Total Members</div>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-5 sm:p-6 text-center">
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <TrendingUp size={24} className="text-emerald-500" />
            </div>
            <div style={{color: "var(--text-primary)"}} className="text-2xl sm:text-3xl font-bold  mb-1">0%</div>
            <div style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm ">Growth Rate</div>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-5 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <Activity size={24} className="text-[#a371f7]" />
            </div>
            <div style={{color: "var(--text-primary)"}} className="text-2xl sm:text-3xl font-bold  mb-1">0</div>
            <div style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm ">Active Users</div>
          </div>
        </div>

        <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-5 sm:p-6">
          <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-semibold  mb-4 sm:mb-6">Activity Overview</h3>
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <BarChart3 size={48} style={{color: "var(--text-secondary)"}} className="" />
            <p style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm  mt-3 sm:mt-4">No data available yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityAnalyticsPage)

