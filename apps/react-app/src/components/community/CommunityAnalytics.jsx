import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../../utils/errorUtils";
import {
  BarChart3, Users, MessageSquare, TrendingUp,
  Calendar, Clock, Activity, Heart, Eye,
  ArrowUp, ArrowDown, Filter, Download
} from 'lucide-react'
import communityService from '../../services/communityService'
import socketService from '../../services/socket'

export default function CommunityAnalytics({ communityId, timeRange = '30d' }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [activeMetric, setActiveMetric] = useState('overview')

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '365d', label: '1 Year' }
  ]

  useEffect(() => {
    loadAnalytics()
    
    // Set up real-time updates
    socketService.on('analytics_updated', handleAnalyticsUpdate)
    
    return () => {
      socketService.off('analytics_updated', handleAnalyticsUpdate)
    }
  }, [communityId, selectedTimeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await communityService.getCommunityAnalytics(communityId, selectedTimeRange)
      
      if (result.success) {
        setAnalytics(result.analytics)
      } else {
        setError(getErrorMessage(result.error, 'Failed to load analytics data'))
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyticsUpdate = (data) => {
    if (data.communityId === communityId) {
      setAnalytics(prev => ({
        ...prev,
        ...data.updates
      }))
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toString() || '0'
  }

  const formatPercentage = (num) => {
    const value = Number(num) || 0
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getChangeIcon = (change) => {
    const value = Number(change) || 0
    if (value > 0) return <ArrowUp size={16} className="positive" />
    if (value < 0) return <ArrowDown size={16} className="negative" />
    return null
  }

  const getChangeColor = (change) => {
    const value = Number(change) || 0
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return 'neutral'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
          <div style={{ width: "48px", height: "48px", flexShrink: 0 }}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
          <p className="mb-3">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          <button
            onClick={loadAnalytics}
            style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="flex items-center gap-2 mb-1 text-[var(--text-primary)] text-2xl font-semibold">
            <BarChart3 size={24} />
            Community Analytics
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">Track your community's growth and engagement</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-white border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          <button style={{color: "var(--text-primary)"}} className="flex items-center gap-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wide mb-3">
            <Users size={20} />
            <span>Total Members</span>
          </div>
          <div className="text-[var(--text-primary)] text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.totalMembers)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.memberGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.memberGrowth) < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            {getChangeIcon(analytics?.memberGrowth)}
            {formatPercentage(analytics?.memberGrowth)}
          </div>
        </div>

        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wide mb-3">
            <MessageSquare size={20} />
            <span>Total Posts</span>
          </div>
          <div className="text-[var(--text-primary)] text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.totalPosts)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.postGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.postGrowth) < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            {getChangeIcon(analytics?.postGrowth)}
            {formatPercentage(analytics?.postGrowth)}
          </div>
        </div>

        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wide mb-3">
            <Activity size={20} />
            <span>Daily Active</span>
          </div>
          <div className="text-[var(--text-primary)] text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.dailyActiveUsers)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.activeChange) > 0 ? 'text-emerald-500' : Number(analytics?.activeChange) < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            {getChangeIcon(analytics?.activeChange)}
            {formatPercentage(analytics?.activeChange)}
          </div>
        </div>

        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wide mb-3">
            <TrendingUp size={20} />
            <span>Engagement Rate</span>
          </div>
          <div className="text-[var(--text-primary)] text-3xl font-bold mb-2 leading-none">
            {analytics?.engagementRate?.toFixed(1)}%
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.engagementGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.engagementGrowth) < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            {getChangeIcon(analytics?.engagementGrowth)}
            {formatPercentage(analytics?.engagementGrowth)}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white border border-[var(--border-subtle)] rounded-xl mb-8 overflow-hidden">
        <div className="flex bg-gray-50 border-b border-[var(--border-subtle)]">
          <button
            className={`flex-1 px-4 py-4 text-[var(--text-secondary)] font-medium transition-all relative ${activeMetric === 'overview' ? 'text-blue-500 bg-white' : 'hover:bg-white hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveMetric('overview')}
          >
            Overview
            {activeMetric === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-[var(--text-secondary)] font-medium transition-all relative ${activeMetric === 'members' ? 'text-blue-500 bg-white' : 'hover:bg-white hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveMetric('members')}
          >
            Members
            {activeMetric === 'members' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-[var(--text-secondary)] font-medium transition-all relative ${activeMetric === 'content' ? 'text-blue-500 bg-white' : 'hover:bg-white hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveMetric('content')}
          >
            Content
            {activeMetric === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-[var(--text-secondary)] font-medium transition-all relative ${activeMetric === 'engagement' ? 'text-blue-500 bg-white' : 'hover:bg-white hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveMetric('engagement')}
          >
            Engagement
            {activeMetric === 'engagement' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
          </button>
        </div>

        <div className="p-6">
          {activeMetric === 'overview' && (
            <OverviewChart data={analytics?.overviewData} />
          )}
          {activeMetric === 'members' && (
            <MembersChart data={analytics?.memberData} />
          )}
          {activeMetric === 'content' && (
            <ContentChart data={analytics?.contentData} />
          )}
          {activeMetric === 'engagement' && (
            <EngagementChart data={analytics?.engagementData} />
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5">
          <h3 className="mb-4 text-[var(--text-primary)] text-lg font-semibold">Member Activity</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">New Members</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.newMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">Active Members</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.activeMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">Retention Rate</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.retentionRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5">
          <h3 className="mb-4 text-[var(--text-primary)] text-lg font-semibold">Content Performance</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">Posts per Day</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.postsPerDay?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">Comments per Post</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.commentsPerPost?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[var(--text-secondary)] text-sm">Avg. Post Score</span>
              <span className="text-[var(--text-primary)] font-semibold">{analytics?.avgPostScore?.toFixed(1) || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-5">
          <h3 className="mb-4 text-[var(--text-primary)] text-lg font-semibold">Top Contributors</h3>
          <div className="flex flex-col gap-3">
            {analytics?.topContributors?.slice(0, 5).map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div style={{color: "var(--text-primary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }}>
                  #{index + 1}
                </div>
                <img
                  src={contributor.avatar || '/default-avatar.png'}
                  alt={contributor.username}
                  style={{ width: "48px", height: "48px", flexShrink: 0 }}
                />
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[var(--text-primary)] font-medium text-sm">{contributor.username}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{contributor.postCount} posts</span>
                </div>
                <div className="text-blue-500 font-semibold text-sm">{contributor.karma}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-6">
        <h3 className="mb-5 text-[var(--text-primary)] text-lg font-semibold">Growth Milestones</h3>
        <div className="relative before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
          {analytics?.milestones?.map((milestone, index) => (
            <div key={index} className="relative pl-10 mb-6 last:mb-0">
              <div className="absolute left-2 top-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></div>
              <div className="mb-1 text-[var(--text-secondary)] text-xs">
                {new Date(milestone.date).toLocaleDateString()}
              </div>
              <div>
                <h4 className="mb-1 text-[var(--text-primary)] text-sm font-medium">{milestone.title}</h4>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chart Components (simplified for demo)
function OverviewChart({ data }) {
  return (
    <div className="min-h-[300px]">
      <div className="mb-5">
        <h4 className="mb-1 text-[var(--text-primary)] text-lg font-medium">Community Overview</h4>
        <p className="text-[var(--text-secondary)] text-xs">Members, posts, and engagement over time</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        {/* In a real implementation, you would use a charting library like Chart.js or Recharts */}
        <div className="w-full h-[200px] relative">
          <div className="flex items-end justify-around h-full gap-2">
            {data?.chartData?.map((point, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t min-w-[20px] hover:from-blue-500 hover:to-blue-500 hover:scale-y-105 transition-all cursor-pointer"
                style={{ height: `${(point.value / data.maxValue) * 100}%` }}
                title={`${point.label}: ${point.value}`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-5 mt-4 text-xs text-[var(--text-secondary)]">
            <span>Members</span>
            <span>Posts</span>
            <span>Engagement</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MembersChart({ data }) {
  return (
    <div className="min-h-[300px]">
      <div className="mb-5">
        <h4 className="mb-1 text-[var(--text-primary)] text-lg font-medium">Member Growth</h4>
        <p className="text-[var(--text-secondary)] text-xs">New members and retention over time</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px] relative bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="relative h-full w-full">
            {data?.growthData?.map((point, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 bg-blue-500 rounded-full border-2 border-white -translate-x-1/2 translate-y-1/2"
                style={{
                  left: `${(index / (data.growthData.length - 1)) * 100}%`,
                  bottom: `${(point.value / data.maxValue) * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentChart({ data }) {
  return (
    <div className="min-h-[300px]">
      <div className="mb-5">
        <h4 className="mb-1 text-[var(--text-primary)] text-lg font-medium">Content Activity</h4>
        <p className="text-[var(--text-secondary)] text-xs">Posts and comments distribution</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px]">
          <div className="grid grid-cols-7 auto-rows-fr gap-0.5 h-full">
            {data?.activityData?.map((day, index) => (
              <div
                key={index}
                className="bg-gray-200 rounded-sm min-h-[12px] hover:scale-110 transition-transform cursor-pointer"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${day.intensity})`,
                }}
                title={`${day.date}: ${day.posts} posts`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EngagementChart({ data }) {
  return (
    <div className="min-h-[300px]">
      <div className="mb-5">
        <h4 className="mb-1 text-[var(--text-primary)] text-lg font-medium">Engagement Metrics</h4>
        <p className="text-[var(--text-secondary)] text-xs">Likes, comments, and shares</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px]">
          <div className="flex justify-around items-center h-full">
            <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center  font-semibold cursor-pointer hover:scale-110 transition-transform" title="Likes">
              <span>{data?.likes || 0}</span>
            </div>
            <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center  font-semibold cursor-pointer hover:scale-110 transition-transform" title="Comments">
              <span>{data?.comments || 0}</span>
            </div>
            <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center  font-semibold cursor-pointer hover:scale-110 transition-transform" title="Shares">
              <span>{data?.shares || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
