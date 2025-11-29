import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Heart, Eye,
  Activity, Clock, Calendar, BarChart3, PieChart, Filter,
  Download, RefreshCw, ChevronUp, ChevronDown, Globe,
  Zap, Target, Award, Layers, Hash
} from 'lucide-react'
const AnalyticsDashboard = ({ user, community, onClose }) => {
  const [timeRange, setTimeRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      uniqueVisitors: 0,
      avgSessionDuration: '0m',
      bounceRate: 0,
      pageViews: [],
      topContent: [],
      userGrowth: [],
      engagementRate: 0
    },
    engagement: {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgEngagementRate: 0,
      topPosts: [],
      peakHours: [],
      contentTypes: []
    },
    audience: {
      demographics: {},
      locations: [],
      devices: {},
      interests: [],
      activeUsers: 0,
      newUsers: 0,
      returningUsers: 0
    },
    performance: {
      loadTime: 0,
      errorRate: 0,
      uptime: 99.9,
      apiLatency: 0,
      cdnPerformance: {},
      serverMetrics: {}
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, activeTab, community])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const endpoint = community 
        ? `/api/communities/${community.id}/analytics`
        : '/api/user/analytics'
      
      const response = await fetch(`${endpoint}?range=${timeRange}&tab=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(prev => ({
          ...prev,
          [activeTab]: data.analytics || prev[activeTab]
        }))
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = async (format = 'csv') => {
    try {
      const endpoint = community 
        ? `/api/communities/${community.id}/analytics/export`
        : '/api/user/analytics/export'
      
      const response = await fetch(`${endpoint}?format=${format}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${timeRange}.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export analytics:', error)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercent = (num, change = true) => {
    const formatted = `${num > 0 && change ? '+' : ''}${num.toFixed(1)}%`
    return formatted
  }

  const renderMetricCard = (title, value, change, icon, color = 'blue') => (
    <div className={`metric-card ${color}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon">
          {icon}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {change !== undefined && (
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {formatPercent(Math.abs(change))}
        </div>
      )}
    </div>
  )

  const renderOverview = () => {
    const data = analytics.overview
    return (
      <div className="analytics-overview">
        <div className="metrics-grid">
          {renderMetricCard('Total Views', formatNumber(data.totalViews), 12.5, <Eye size={20} />, 'purple')}
          {renderMetricCard('Unique Visitors', formatNumber(data.uniqueVisitors), 8.3, <Users size={20} />, 'blue')}
          {renderMetricCard('Avg. Session', data.avgSessionDuration, null, <Clock size={20} />, 'green')}
          {renderMetricCard('Bounce Rate', `${data.bounceRate}%`, -2.1, <Activity size={20} />, 'orange')}
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h3>Traffic Overview</h3>
            <div className="chart-controls">
              <button className="btn-icon" onClick={fetchAnalytics}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">
              <BarChart3 size={48} />
              <p>Traffic data visualization</p>
              <div className="mini-chart">
                {[40, 65, 45, 70, 55, 80, 60].map((height, i) => (
                  <div 
                    key={i} 
                    className="bar" 
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="content-performance">
          <h3>Top Performing Content</h3>
          <div className="content-list">
            {data.topContent.length > 0 ? data.topContent.map((content, index) => (
              <div key={content.id} className="content-item">
                <span className="content-rank">{index + 1}</span>
                <div className="content-details">
                  <p className="content-title">{content.title}</p>
                  <div className="content-stats">
                    <span><Eye size={14} /> {formatNumber(content.views)}</span>
                    <span><Heart size={14} /> {formatNumber(content.likes)}</span>
                    <span><MessageSquare size={14} /> {formatNumber(content.comments)}</span>
                  </div>
                </div>
                <div className="content-engagement">
                  {content.engagementRate}%
                </div>
              </div>
            )) : (
              <div className="empty-content">
                <p>No content data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderEngagement = () => {
    const data = analytics.engagement
    return (
      <div className="analytics-engagement">
        <div className="metrics-grid">
          {renderMetricCard('Total Likes', formatNumber(data.totalLikes), 15.2, <Heart size={20} />, 'red')}
          {renderMetricCard('Total Comments', formatNumber(data.totalComments), 22.8, <MessageSquare size={20} />, 'blue')}
          {renderMetricCard('Total Shares', formatNumber(data.totalShares), 10.5, <Zap size={20} />, 'green')}
          {renderMetricCard('Engagement Rate', `${data.avgEngagementRate}%`, 3.4, <Target size={20} />, 'purple')}
        </div>

        <div className="engagement-charts">
          <div className="chart-section half">
            <h3>Peak Activity Hours</h3>
            <div className="heatmap">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="heatmap-cell">
                  <div 
                    className="heat-level" 
                    style={{ 
                      opacity: Math.random() * 0.8 + 0.2,
                      background: 'var(--primary-trust)'
                    }}
                  />
                  <span className="hour-label">{i}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section half">
            <h3>Content Type Performance</h3>
            <div className="pie-chart-container">
              <PieChart size={120} />
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#0052FF' }} />
                  <span>Posts (45%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#00D4FF' }} />
                  <span>Comments (30%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#00FF88' }} />
                  <span>Media (25%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="top-posts">
          <h3>Most Engaging Posts</h3>
          <div className="posts-table">
            <table>
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Type</th>
                  <th>Engagement</th>
                  <th>Reach</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topPosts.length > 0 ? data.topPosts.map(post => (
                  <tr key={post.id}>
                    <td className="post-cell">
                      <p>{post.title}</p>
                      <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <span className="post-type">{post.type}</span>
                    </td>
                    <td>{post.engagementRate}%</td>
                    <td>{formatNumber(post.reach)}</td>
                    <td>
                      <span className="score">{post.score}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-row">No posts data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderAudience = () => {
    const data = analytics.audience
    return (
      <div className="analytics-audience">
        <div className="metrics-grid">
          {renderMetricCard('Active Users', formatNumber(data.activeUsers), 5.8, <Users size={20} />, 'blue')}
          {renderMetricCard('New Users', formatNumber(data.newUsers), 12.3, <Award size={20} />, 'green')}
          {renderMetricCard('Returning Users', formatNumber(data.returningUsers), -2.4, <RefreshCw size={20} />, 'purple')}
          {renderMetricCard('Avg. User Score', '850', 8.2, <Target size={20} />, 'orange')}
        </div>

        <div className="audience-insights">
          <div className="insight-section">
            <h3>Geographic Distribution</h3>
            <div className="geo-map">
              <Globe size={100} />
              <div className="location-list">
                {data.locations.length > 0 ? data.locations.map((loc, i) => (
                  <div key={i} className="location-item">
                    <span className="location-name">{loc.country}</span>
                    <div className="location-bar">
                      <div 
                        className="bar-fill"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                    <span className="location-percent">{loc.percentage}%</span>
                  </div>
                )) : (
                  <>
                    <div className="location-item">
                      <span className="location-name">United States</span>
                      <div className="location-bar">
                        <div className="bar-fill" style={{ width: '45%' }} />
                      </div>
                      <span className="location-percent">45%</span>
                    </div>
                    <div className="location-item">
                      <span className="location-name">United Kingdom</span>
                      <div className="location-bar">
                        <div className="bar-fill" style={{ width: '20%' }} />
                      </div>
                      <span className="location-percent">20%</span>
                    </div>
                    <div className="location-item">
                      <span className="location-name">Canada</span>
                      <div className="location-bar">
                        <div className="bar-fill" style={{ width: '15%' }} />
                      </div>
                      <span className="location-percent">15%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="insight-section">
            <h3>Device Breakdown</h3>
            <div className="device-stats">
              <div className="device-item">
                <div className="device-icon desktop">💻</div>
                <span className="device-name">Desktop</span>
                <span className="device-percent">52%</span>
              </div>
              <div className="device-item">
                <div className="device-icon mobile">📱</div>
                <span className="device-name">Mobile</span>
                <span className="device-percent">38%</span>
              </div>
              <div className="device-item">
                <div className="device-icon tablet">📱</div>
                <span className="device-name">Tablet</span>
                <span className="device-percent">10%</span>
              </div>
            </div>
          </div>

          <div className="insight-section">
            <h3>User Interests</h3>
            <div className="interests-cloud">
              {['Technology', 'Gaming', 'Crypto', 'NFTs', 'Web3', 'AI', 'Music', 'Art'].map(interest => (
                <span 
                  key={interest} 
                  className="interest-tag"
                  style={{ 
                    fontSize: `${Math.random() * 8 + 12}px`,
                    opacity: Math.random() * 0.4 + 0.6
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPerformance = () => {
    const data = analytics.performance
    return (
      <div className="analytics-performance">
        <div className="metrics-grid">
          {renderMetricCard('Load Time', `${data.loadTime}ms`, -5.2, <Zap size={20} />, 'green')}
          {renderMetricCard('Error Rate', `${data.errorRate}%`, -12.8, <AlertCircle size={20} />, 'red')}
          {renderMetricCard('Uptime', `${data.uptime}%`, 0.1, <Activity size={20} />, 'blue')}
          {renderMetricCard('API Latency', `${data.apiLatency}ms`, -8.5, <Layers size={20} />, 'purple')}
        </div>

        <div className="performance-details">
          <div className="perf-section">
            <h3>System Health</h3>
            <div className="health-metrics">
              <div className="health-item">
                <span className="health-label">CPU Usage</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '35%' }} />
                </div>
                <span className="health-value">35%</span>
              </div>
              <div className="health-item">
                <span className="health-label">Memory</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '58%' }} />
                </div>
                <span className="health-value">58%</span>
              </div>
              <div className="health-item">
                <span className="health-label">Disk I/O</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '22%' }} />
                </div>
                <span className="health-value">22%</span>
              </div>
              <div className="health-item">
                <span className="health-label">Network</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '45%' }} />
                </div>
                <span className="health-value">45%</span>
              </div>
            </div>
          </div>

          <div className="perf-section">
            <h3>Response Times</h3>
            <div className="response-chart">
              <div className="response-bars">
                {['API', 'Database', 'Cache', 'CDN', 'External'].map(service => (
                  <div key={service} className="response-item">
                    <span className="service-name">{service}</span>
                    <div className="response-bar">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${Math.random() * 60 + 20}%`,
                          background: `var(--${Math.random() > 0.7 ? 'warning' : 'success'})`
                        }}
                      />
                    </div>
                    <span className="response-time">{Math.floor(Math.random() * 100 + 20)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="alerts-section">
          <h3>Recent Alerts</h3>
          <div className="alerts-list">
            <div className="alert-item warning">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <p>High memory usage detected on server-2</p>
                <span className="alert-time">2 hours ago</span>
              </div>
            </div>
            <div className="alert-item info">
              <span className="alert-icon">ℹ️</span>
              <div className="alert-content">
                <p>CDN cache purge completed successfully</p>
                <span className="alert-time">5 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'engagement', name: 'Engagement', icon: Activity },
    { id: 'audience', name: 'Audience', icon: Users },
    { id: 'performance', name: 'Performance', icon: Zap }
  ]

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div className="header-left">
          <h2>
            {community ? (
              <>
                <Hash size={20} />
                {community.name} Analytics
              </>
            ) : (
              'Your Analytics'
            )}
          </h2>
          <p className="header-subtitle">
            Track performance and gain insights
          </p>
        </div>

        <div className="header-controls">
          <select 
            className="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          <button 
            className="btn-export"
            onClick={() => exportAnalytics('csv')}
          >
            <Download size={16} />
            Export
          </button>

          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`analytics-tab ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>

      <div className="analytics-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'engagement' && renderEngagement()}
            {activeTab === 'audience' && renderAudience()}
            {activeTab === 'performance' && renderPerformance()}
          </>
        )}
      </div>
    </div>
  )
}



export default AnalyticsDashboard