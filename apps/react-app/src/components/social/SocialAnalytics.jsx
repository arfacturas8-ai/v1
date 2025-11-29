import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, TrendingUp, Users, Heart, MessageSquare, 
  Eye, Calendar, Target, Zap, Award, Star, Share2,
  ArrowUp, ArrowDown, Minus, Filter, Download,
  PieChart, Activity, Globe, MapPin, Clock, X
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
const SocialAnalytics = ({ onClose, userId = null, timeframe = '30d' }) => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [analytics, setAnalytics] = useState({
    overview: {},
    growth: {},
    engagement: {},
    network: {},
    demographics: {},
    influence: {}
  })

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'growth', label: 'Growth', icon: <TrendingUp size={16} /> },
    { id: 'engagement', label: 'Engagement', icon: <Heart size={16} /> },
    { id: 'network', label: 'Network', icon: <Users size={16} /> },
    { id: 'influence', label: 'Influence', icon: <Zap size={16} /> }
  ]

  useEffect(() => {
    loadAnalytics()
  }, [selectedTimeframe, userId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const [socialAnalytics, networkStats] = await Promise.all([
        socialService.getSocialAnalytics(userId, selectedTimeframe),
        socialService.getNetworkStats(userId)
      ])

      setAnalytics({
        overview: socialAnalytics.overview || generateMockOverview(),
        growth: socialAnalytics.growth || generateMockGrowth(),
        engagement: socialAnalytics.engagement || generateMockEngagement(),
        network: networkStats || generateMockNetwork(),
        demographics: socialAnalytics.demographics || generateMockDemographics(),
        influence: socialAnalytics.influence || generateMockInfluence()
      })
      
    } catch (error) {
      console.error('Error loading analytics:', error)
      showToast('Failed to load analytics', 'error')
      
      // Use mock data for demo
      setAnalytics({
        overview: generateMockOverview(),
        growth: generateMockGrowth(),
        engagement: generateMockEngagement(),
        network: generateMockNetwork(),
        demographics: generateMockDemographics(),
        influence: generateMockInfluence()
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockOverview = () => ({
    totalFollowers: 1234,
    totalFollowing: 567,
    totalFriends: 89,
    totalConnections: 1890,
    profileViews: 5432,
    engagementRate: 0.084,
    growthRate: 0.12,
    influenceScore: 0.76,
    changes: {
      followers: { value: 45, percentage: 3.8 },
      following: { value: 12, percentage: 2.1 },
      friends: { value: 8, percentage: 9.9 },
      profileViews: { value: 234, percentage: 4.5 },
      engagementRate: { value: 0.007, percentage: 9.1 },
      influenceScore: { value: 0.04, percentage: 5.6 }
    }
  })

  const generateMockGrowth = () => ({
    followersGrowth: [
      { date: '2024-01-01', value: 1000 },
      { date: '2024-01-08', value: 1045 },
      { date: '2024-01-15', value: 1120 },
      { date: '2024-01-22', value: 1189 },
      { date: '2024-01-29', value: 1234 }
    ],
    followingGrowth: [
      { date: '2024-01-01', value: 520 },
      { date: '2024-01-08', value: 535 },
      { date: '2024-01-15', value: 548 },
      { date: '2024-01-22', value: 559 },
      { date: '2024-01-29', value: 567 }
    ],
    friendsGrowth: [
      { date: '2024-01-01', value: 75 },
      { date: '2024-01-08', value: 78 },
      { date: '2024-01-15', value: 82 },
      { date: '2024-01-22', value: 86 },
      { date: '2024-01-29', value: 89 }
    ],
    milestones: [
      { date: '2024-01-15', type: 'followers', value: 1000, description: 'Reached 1K followers' },
      { date: '2024-01-22', type: 'engagement', value: 8, description: '8% engagement rate' }
    ]
  })

  const generateMockEngagement = () => ({
    averageEngagementRate: 0.084,
    totalEngagements: 2345,
    engagementByType: {
      likes: 1456,
      comments: 432,
      shares: 234,
      mentions: 123,
      profileViews: 100
    },
    topEngagingContent: [
      { id: '1', type: 'post', content: 'Web3 development insights...', engagements: 234, date: '2024-01-28' },
      { id: '2', type: 'comment', content: 'Great perspective on DeFi...', engagements: 156, date: '2024-01-26' },
      { id: '3', type: 'post', content: 'NFT marketplace trends...', engagements: 189, date: '2024-01-24' }
    ],
    engagementTrends: [
      { date: '2024-01-01', rate: 0.072 },
      { date: '2024-01-08', rate: 0.078 },
      { date: '2024-01-15', rate: 0.081 },
      { date: '2024-01-22', rate: 0.084 },
      { date: '2024-01-29', rate: 0.087 }
    ]
  })

  const generateMockNetwork = () => ({
    networkSize: 1890,
    networkDensity: 0.045,
    centralityScore: 0.73,
    clusteringCoefficient: 0.34,
    mutualConnections: 234,
    networkReach: 45678,
    influentialConnections: 23,
    connectionStrength: {
      strong: 156,
      medium: 567,
      weak: 1167
    },
    networkGrowth: {
      newConnections: 67,
      lostConnections: 12,
      netGrowth: 55
    },
    topConnectors: [
      { id: '1', name: 'Tech Guru', connections: 45, mutualWith: 12 },
      { id: '2', name: 'Crypto King', connections: 38, mutualWith: 8 },
      { id: '3', name: 'NFT Artist', connections: 34, mutualWith: 15 }
    ]
  })

  const generateMockDemographics = () => ({
    followerDemographics: {
      byLocation: [
        { location: 'United States', count: 456, percentage: 37 },
        { location: 'United Kingdom', count: 234, percentage: 19 },
        { location: 'Canada', count: 123, percentage: 10 },
        { location: 'Germany', count: 89, percentage: 7 },
        { location: 'Other', count: 332, percentage: 27 }
      ],
      byInterests: [
        { interest: 'Web3', count: 567, percentage: 46 },
        { interest: 'Cryptocurrency', count: 445, percentage: 36 },
        { interest: 'NFTs', count: 334, percentage: 27 },
        { interest: 'DeFi', count: 223, percentage: 18 },
        { interest: 'Blockchain', count: 189, percentage: 15 }
      ],
      byActivity: [
        { level: 'Very Active', count: 234, percentage: 19 },
        { level: 'Active', count: 567, percentage: 46 },
        { level: 'Moderate', count: 345, percentage: 28 },
        { level: 'Low', count: 88, percentage: 7 }
      ]
    }
  })

  const generateMockInfluence = () => ({
    overallScore: 0.76,
    components: {
      reach: 0.82,
      engagement: 0.78,
      authority: 0.71,
      consistency: 0.74
    },
    influenceGrowth: [
      { date: '2024-01-01', score: 0.68 },
      { date: '2024-01-08', score: 0.71 },
      { date: '2024-01-15', score: 0.73 },
      { date: '2024-01-22', score: 0.75 },
      { date: '2024-01-29', score: 0.76 }
    ],
    influenceAreas: [
      { area: 'Web3 Development', score: 0.89, rank: 15 },
      { area: 'Cryptocurrency', score: 0.67, rank: 234 },
      { area: 'Technology', score: 0.72, rank: 156 }
    ],
    viralContent: [
      { id: '1', content: 'Web3 development best practices', reach: 15678, engagement: 1234 },
      { id: '2', content: 'DeFi security considerations', reach: 12345, engagement: 987 }
    ]
  })

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`

  const getTrendIcon = (change) => {
    if (change > 0) return <ArrowUp size={12} className="trend-up" />
    if (change < 0) return <ArrowDown size={12} className="trend-down" />
    return <Minus size={12} className="trend-flat" />
  }

  const StatCard = ({ title, value, change, icon, suffix = '' }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">
        {typeof value === 'number' ? formatNumber(value) : value}{suffix}
      </div>
      {change && (
        <div className={`stat-change ${change.value > 0 ? 'positive' : change.value < 0 ? 'negative' : 'neutral'}`}>
          {getTrendIcon(change.value)}
          <span>{Math.abs(change.percentage).toFixed(1)}%</span>
        </div>
      )}
    </div>
  )

  const ProgressBar = ({ value, max, label, color = '#00FF88' }) => (
    <div className="progress-bar-container">
      <div className="progress-label">
        <span>{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${(value / max) * 100}%`,
            backgroundColor: color 
          }} 
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="social-analytics-modal">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-title">
            <BarChart3 size={24} />
            <div>
              <h2>Social Analytics</h2>
              <p>Insights into your social network performance</p>
            </div>
          </div>
          
          <div className="header-controls">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="timeframe-select"
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
            
            <button
              className="export-btn"
              onClick={() => {
                // Export analytics data as JSON
                const dataToExport = {
                  exportDate: new Date().toISOString(),
                  timeframe: selectedTimeframe,
                  analytics: {
                    overview: analytics.overview,
                    growth: analytics.growth,
                    engagement: analytics.engagement,
                    network: analytics.network,
                    demographics: analytics.demographics,
                    influence: analytics.influence
                  }
                }

                const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `social-analytics-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                showToast('Analytics data exported successfully', 'success')
              }}
              title="Export analytics data"
            >
              <Download size={16} />
            </button>
            
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="analytics-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="analytics-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="stats-grid">
                <StatCard
                  title="Followers"
                  value={analytics.overview.totalFollowers}
                  change={analytics.overview.changes?.followers}
                  icon={<Users size={20} />}
                />
                <StatCard
                  title="Following"
                  value={analytics.overview.totalFollowing}
                  change={analytics.overview.changes?.following}
                  icon={<Eye size={20} />}
                />
                <StatCard
                  title="Friends"
                  value={analytics.overview.totalFriends}
                  change={analytics.overview.changes?.friends}
                  icon={<Heart size={20} />}
                />
                <StatCard
                  title="Profile Views"
                  value={analytics.overview.profileViews}
                  change={analytics.overview.changes?.profileViews}
                  icon={<Activity size={20} />}
                />
                <StatCard
                  title="Engagement Rate"
                  value={analytics.overview.engagementRate}
                  change={analytics.overview.changes?.engagementRate}
                  icon={<Target size={20} />}
                  suffix="%"
                />
                <StatCard
                  title="Influence Score"
                  value={analytics.overview.influenceScore}
                  change={analytics.overview.changes?.influenceScore}
                  icon={<Zap size={20} />}
                  suffix="/1.0"
                />
              </div>

              <div className="section">
                <h3>Quick Insights</h3>
                <div className="insights-grid">
                  <div className="insight-card">
                    <TrendingUp size={24} className="insight-icon positive" />
                    <div>
                      <h4>Growing Influence</h4>
                      <p>Your influence score increased by {formatPercentage(analytics.overview.changes?.influenceScore?.value || 0)} this period</p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <Users size={24} className="insight-icon primary" />
                    <div>
                      <h4>Strong Network</h4>
                      <p>You have {analytics.overview.totalConnections} total connections across the platform</p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <Heart size={24} className="insight-icon positive" />
                    <div>
                      <h4>High Engagement</h4>
                      <p>Your content receives {formatPercentage(analytics.overview.engagementRate)} engagement rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Growth Tab */}
          {activeTab === 'growth' && (
            <div className="tab-content">
              <div className="section">
                <h3>Growth Trends</h3>
                <div className="growth-chart-placeholder">
                  <TrendingUp size={48} />
                  <p>Growth chart visualization would be displayed here</p>
                  <div className="growth-stats">
                    <div className="growth-stat">
                      <span className="growth-label">Followers Growth</span>
                      <span className="growth-value">+{analytics.overview.changes?.followers?.value || 0}</span>
                    </div>
                    <div className="growth-stat">
                      <span className="growth-label">Following Growth</span>
                      <span className="growth-value">+{analytics.overview.changes?.following?.value || 0}</span>
                    </div>
                    <div className="growth-stat">
                      <span className="growth-label">Friends Growth</span>
                      <span className="growth-value">+{analytics.overview.changes?.friends?.value || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <h3>Milestones</h3>
                <div className="milestones-list">
                  {analytics.growth.milestones?.map((milestone, index) => (
                    <div key={index} className="milestone-item">
                      <div className="milestone-icon">
                        <Award size={16} />
                      </div>
                      <div className="milestone-content">
                        <h4>{milestone.description}</h4>
                        <span className="milestone-date">{new Date(milestone.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === 'engagement' && (
            <div className="tab-content">
              <div className="section">
                <h3>Engagement Breakdown</h3>
                <div className="engagement-stats">
                  {Object.entries(analytics.engagement.engagementByType || {}).map(([type, count]) => (
                    <ProgressBar
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      value={count}
                      max={Math.max(...Object.values(analytics.engagement.engagementByType || {}))}
                    />
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>Top Engaging Content</h3>
                <div className="content-list">
                  {analytics.engagement.topEngagingContent?.map((content, index) => (
                    <div key={content.id} className="content-item">
                      <div className="content-rank">#{index + 1}</div>
                      <div className="content-details">
                        <p>{content.content}</p>
                        <div className="content-meta">
                          <span>{content.engagements} engagements</span>
                          <span>{new Date(content.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="tab-content">
              <div className="stats-grid">
                <StatCard
                  title="Network Size"
                  value={analytics.network.networkSize}
                  icon={<Users size={20} />}
                />
                <StatCard
                  title="Network Reach"
                  value={analytics.network.networkReach}
                  icon={<Globe size={20} />}
                />
                <StatCard
                  title="Mutual Connections"
                  value={analytics.network.mutualConnections}
                  icon={<Share2 size={20} />}
                />
                <StatCard
                  title="Centrality Score"
                  value={analytics.network.centralityScore}
                  icon={<Target size={20} />}
                  suffix="/1.0"
                />
              </div>

              <div className="section">
                <h3>Connection Strength</h3>
                <div className="connection-strength">
                  <ProgressBar
                    label="Strong Connections"
                    value={analytics.network.connectionStrength?.strong || 0}
                    max={analytics.network.networkSize}
                    color="#00FF88"
                  />
                  <ProgressBar
                    label="Medium Connections"
                    value={analytics.network.connectionStrength?.medium || 0}
                    max={analytics.network.networkSize}
                    color="#FFB800"
                  />
                  <ProgressBar
                    label="Weak Connections"
                    value={analytics.network.connectionStrength?.weak || 0}
                    max={analytics.network.networkSize}
                    color="#666"
                  />
                </div>
              </div>

              <div className="section">
                <h3>Top Connectors</h3>
                <div className="connectors-list">
                  {analytics.network.topConnectors?.map((connector, index) => (
                    <div key={connector.id} className="connector-item">
                      <div className="connector-rank">#{index + 1}</div>
                      <div className="connector-info">
                        <h4>{connector.name}</h4>
                        <span>{connector.connections} connections • {connector.mutualWith} mutual</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Influence Tab */}
          {activeTab === 'influence' && (
            <div className="tab-content">
              <div className="influence-overview">
                <div className="influence-score">
                  <div className="score-circle">
                    <span className="score-value">{formatPercentage(analytics.influence.overallScore)}</span>
                    <span className="score-label">Influence Score</span>
                  </div>
                </div>
                <div className="influence-components">
                  {Object.entries(analytics.influence.components || {}).map(([component, score]) => (
                    <div key={component} className="component-item">
                      <span className="component-label">{component.charAt(0).toUpperCase() + component.slice(1)}</span>
                      <div className="component-bar">
                        <div 
                          className="component-fill" 
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="component-value">{formatPercentage(score)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>Influence Areas</h3>
                <div className="influence-areas">
                  {analytics.influence.influenceAreas?.map((area, index) => (
                    <div key={index} className="area-item">
                      <div className="area-info">
                        <h4>{area.area}</h4>
                        <span className="area-rank">Rank #{area.rank}</span>
                      </div>
                      <div className="area-score">{formatPercentage(area.score)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



export default SocialAnalytics