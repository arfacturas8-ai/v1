import React, { useState, useEffect } from 'react'
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
        setError(result.error)
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
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-8 h-8 border-3 border-gray-700 border-t-sky-500 rounded-full  mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="mb-3">{error}</p>
          <button
            onClick={loadAnalytics}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
          <h2 className="flex items-center gap-2 mb-1 text-white text-2xl font-semibold">
            <BarChart3 size={24} />
            Community Analytics
          </h2>
          <p className="text-gray-400 text-sm">Track your community's growth and engagement</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-all">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
            <Users size={20} />
            <span>Total Members</span>
          </div>
          <div className="text-white text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.totalMembers)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.memberGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.memberGrowth) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {getChangeIcon(analytics?.memberGrowth)}
            {formatPercentage(analytics?.memberGrowth)}
          </div>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
            <MessageSquare size={20} />
            <span>Total Posts</span>
          </div>
          <div className="text-white text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.totalPosts)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.postGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.postGrowth) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {getChangeIcon(analytics?.postGrowth)}
            {formatPercentage(analytics?.postGrowth)}
          </div>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
            <Activity size={20} />
            <span>Daily Active</span>
          </div>
          <div className="text-white text-3xl font-bold mb-2 leading-none">
            {formatNumber(analytics?.dailyActiveUsers)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.activeChange) > 0 ? 'text-emerald-500' : Number(analytics?.activeChange) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {getChangeIcon(analytics?.activeChange)}
            {formatPercentage(analytics?.activeChange)}
          </div>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
            <TrendingUp size={20} />
            <span>Engagement Rate</span>
          </div>
          <div className="text-white text-3xl font-bold mb-2 leading-none">
            {analytics?.engagementRate?.toFixed(1)}%
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${Number(analytics?.engagementGrowth) > 0 ? 'text-emerald-500' : Number(analytics?.engagementGrowth) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {getChangeIcon(analytics?.engagementGrowth)}
            {formatPercentage(analytics?.engagementGrowth)}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl mb-8 overflow-hidden">
        <div className="flex bg-gray-900/50 border-b border-gray-700">
          <button
            className={`flex-1 px-4 py-4 text-gray-400 font-medium transition-all relative ${activeMetric === 'overview' ? 'text-sky-500 bg-gray-800/60' : 'hover:bg-gray-800/30 hover:text-white'}`}
            onClick={() => setActiveMetric('overview')}
          >
            Overview
            {activeMetric === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-gray-400 font-medium transition-all relative ${activeMetric === 'members' ? 'text-sky-500 bg-gray-800/60' : 'hover:bg-gray-800/30 hover:text-white'}`}
            onClick={() => setActiveMetric('members')}
          >
            Members
            {activeMetric === 'members' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-gray-400 font-medium transition-all relative ${activeMetric === 'content' ? 'text-sky-500 bg-gray-800/60' : 'hover:bg-gray-800/30 hover:text-white'}`}
            onClick={() => setActiveMetric('content')}
          >
            Content
            {activeMetric === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>}
          </button>
          <button
            className={`flex-1 px-4 py-4 text-gray-400 font-medium transition-all relative ${activeMetric === 'engagement' ? 'text-sky-500 bg-gray-800/60' : 'hover:bg-gray-800/30 hover:text-white'}`}
            onClick={() => setActiveMetric('engagement')}
          >
            Engagement
            {activeMetric === 'engagement' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>}
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
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <h3 className="mb-4 text-white text-lg font-semibold">Member Activity</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">New Members</span>
              <span className="text-white font-semibold">{analytics?.newMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">Active Members</span>
              <span className="text-white font-semibold">{analytics?.activeMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">Retention Rate</span>
              <span className="text-white font-semibold">{analytics?.retentionRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <h3 className="mb-4 text-white text-lg font-semibold">Content Performance</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">Posts per Day</span>
              <span className="text-white font-semibold">{analytics?.postsPerDay?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">Comments per Post</span>
              <span className="text-white font-semibold">{analytics?.commentsPerPost?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-400 text-sm">Avg. Post Score</span>
              <span className="text-white font-semibold">{analytics?.avgPostScore?.toFixed(1) || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <h3 className="mb-4 text-white text-lg font-semibold">Top Contributors</h3>
          <div className="flex flex-col gap-3">
            {analytics?.topContributors?.slice(0, 5).map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  #{index + 1}
                </div>
                <img
                  src={contributor.avatar || '/default-avatar.png'}
                  alt={contributor.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-white font-medium text-sm">{contributor.username}</span>
                  <span className="text-gray-400 text-xs">{contributor.postCount} posts</span>
                </div>
                <div className="text-sky-500 font-semibold text-sm">{contributor.karma}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
        <h3 className="mb-5 text-white text-lg font-semibold">Growth Milestones</h3>
        <div className="relative before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-700">
          {analytics?.milestones?.map((milestone, index) => (
            <div key={index} className="relative pl-10 mb-6 last:mb-0">
              <div className="absolute left-2 top-1.5 w-2 h-2 bg-sky-500 rounded-full border-2 border-gray-800/60"></div>
              <div className="mb-1 text-gray-400 text-xs">
                {new Date(milestone.date).toLocaleDateString()}
              </div>
              <div>
                <h4 className="mb-1 text-white text-sm font-medium">{milestone.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{milestone.description}</p>
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
        <h4 className="mb-1 text-white text-lg font-medium">Community Overview</h4>
        <p className="text-gray-400 text-xs">Members, posts, and engagement over time</p>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        {/* In a real implementation, you would use a charting library like Chart.js or Recharts */}
        <div className="w-full h-[200px] relative">
          <div className="flex items-end justify-around h-full gap-2">
            {data?.chartData?.map((point, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-sky-500 to-sky-400 rounded-t min-w-[20px] hover:from-sky-500 hover:to-sky-500 hover:scale-y-105 transition-all cursor-pointer"
                style={{ height: `${(point.value / data.maxValue) * 100}%` }}
                title={`${point.label}: ${point.value}`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-5 mt-4 text-xs text-gray-400">
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
        <h4 className="mb-1 text-white text-lg font-medium">Member Growth</h4>
        <p className="text-gray-400 text-xs">New members and retention over time</p>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px] relative bg-gradient-to-br from-sky-500/10 to-transparent">
          <div className="relative h-full w-full">
            {data?.growthData?.map((point, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 bg-sky-500 rounded-full border-2 border-white -translate-x-1/2 translate-y-1/2"
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
        <h4 className="mb-1 text-white text-lg font-medium">Content Activity</h4>
        <p className="text-gray-400 text-xs">Posts and comments distribution</p>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px]">
          <div className="grid grid-cols-7 auto-rows-fr gap-0.5 h-full">
            {data?.activityData?.map((day, index) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded-sm min-h-[12px] hover:scale-110 transition-transform cursor-pointer"
                style={{
                  backgroundColor: `rgba(14, 165, 233, ${day.intensity})`,
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
        <h4 className="mb-1 text-white text-lg font-medium">Engagement Metrics</h4>
        <p className="text-gray-400 text-xs">Likes, comments, and shares</p>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-5 min-h-[200px] flex items-center justify-center">
        <div className="w-full h-[200px]">
          <div className="flex justify-around items-center h-full">
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform" title="Likes">
              <span>{data?.likes || 0}</span>
            </div>
            <div className="w-20 h-20 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform" title="Comments">
              <span>{data?.comments || 0}</span>
            </div>
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform" title="Shares">
              <span>{data?.shares || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
