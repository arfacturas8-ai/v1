import React, { useState, useEffect } from 'react'
import {
  Star, TrendingUp, TrendingDown, Award, Target, Zap,
  Trophy, Medal, Shield, Heart, MessageSquare, Users,
  ChevronUp, ChevronDown, Info, Gift, Flame, Crown,
  Activity, BarChart3, Calendar, Clock, ArrowUp
} from 'lucide-react'
const KarmaSystem = ({ user, onClose }) => {
  const [karmaData, setKarmaData] = useState({
    totalKarma: user?.karma || 0,
    weeklyKarma: 0,
    monthlyKarma: 0,
    rank: 'Novice',
    percentile: 0,
    nextRank: 'Contributor',
    karmaToNext: 100,
    breakdown: {
      posts: 0,
      comments: 0,
      awards: 0,
      helpfulness: 0,
      consistency: 0
    },
    history: [],
    achievements: [],
    leaderboard: []
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKarmaData()
  }, [timeRange])

  const fetchKarmaData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/user/karma?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setKarmaData(data)
      }
    } catch (error) {
      console.error('Failed to fetch karma data:', error)
    } finally {
      setLoading(false)
    }
  }

  const karmaRanks = [
    { name: 'Novice', min: 0, max: 99, icon: '🌱', color: '#888' },
    { name: 'Contributor', min: 100, max: 499, icon: '⭐', color: '#00D4FF' },
    { name: 'Member', min: 500, max: 999, icon: '🔷', color: '#0052FF' },
    { name: 'Regular', min: 1000, max: 2499, icon: '💎', color: '#7057FF' },
    { name: 'Trusted', min: 2500, max: 4999, icon: '🛡️', color: '#00FF88' },
    { name: 'Expert', min: 5000, max: 9999, icon: '🏆', color: '#FFB800' },
    { name: 'Master', min: 10000, max: 24999, icon: '🔥', color: '#FF6600' },
    { name: 'Legend', min: 25000, max: 49999, icon: '⚡', color: '#FF00FF' },
    { name: 'Mythic', min: 50000, max: Infinity, icon: '👑', color: '#FFD700' }
  ]

  const getCurrentRank = (karma) => {
    return karmaRanks.find(rank => karma >= rank.min && karma <= rank.max)
  }

  const getNextRank = (karma) => {
    const currentIndex = karmaRanks.findIndex(rank => karma >= rank.min && karma <= rank.max)
    return currentIndex < karmaRanks.length - 1 ? karmaRanks[currentIndex + 1] : null
  }

  const currentRank = getCurrentRank(karmaData.totalKarma)
  const nextRank = getNextRank(karmaData.totalKarma)
  const progressToNext = nextRank 
    ? ((karmaData.totalKarma - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100

  const renderOverview = () => (
    <div className="karma-overview">
      <div className="karma-header-stats">
        <div className="total-karma">
          <div className="karma-value">
            <span className="karma-icon">{currentRank?.icon}</span>
            <div>
              <h2>{karmaData.totalKarma.toLocaleString()}</h2>
              <p>Total Karma</p>
            </div>
          </div>
          <div className="karma-change">
            {karmaData.weeklyKarma >= 0 ? (
              <TrendingUp size={24} className="positive" />
            ) : (
              <TrendingDown size={24} className="negative" />
            )}
            <span className={karmaData.weeklyKarma >= 0 ? 'positive' : 'negative'}>
              {karmaData.weeklyKarma >= 0 ? '+' : ''}{karmaData.weeklyKarma} this week
            </span>
          </div>
        </div>

        <div className="rank-info">
          <div className="current-rank" style={{ borderColor: currentRank?.color }}>
            <h3>{currentRank?.name}</h3>
            <p>Current Rank</p>
          </div>
          <div className="rank-progress">
            <div className="progress-header">
              <span>Progress to {nextRank?.name || 'Max Rank'}</span>
              <span>{nextRank ? `${karmaData.karmaToNext} karma needed` : 'Max rank achieved!'}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${progressToNext}%`,
                  background: `linear-gradient(90deg, ${currentRank?.color} 0%, ${nextRank?.color || currentRank?.color} 100%)`
                }}
              />
            </div>
          </div>
        </div>

        <div className="percentile-badge">
          <Trophy size={24} />
          <div>
            <span className="percentile-value">Top {karmaData.percentile}%</span>
            <p>of all users</p>
          </div>
        </div>
      </div>

      <div className="karma-breakdown">
        <h3>Karma Breakdown</h3>
        <div className="breakdown-items">
          <div className="breakdown-item">
            <div className="item-header">
              <MessageSquare size={24} />
              <span>Posts</span>
            </div>
            <div className="item-bar">
              <div 
                className="bar-fill posts"
                style={{ width: `${(karmaData.breakdown.posts / karmaData.totalKarma) * 100}%` }}
              />
            </div>
            <span className="item-value">{karmaData.breakdown.posts}</span>
          </div>

          <div className="breakdown-item">
            <div className="item-header">
              <MessageSquare size={24} />
              <span>Comments</span>
            </div>
            <div className="item-bar">
              <div 
                className="bar-fill comments"
                style={{ width: `${(karmaData.breakdown.comments / karmaData.totalKarma) * 100}%` }}
              />
            </div>
            <span className="item-value">{karmaData.breakdown.comments}</span>
          </div>

          <div className="breakdown-item">
            <div className="item-header">
              <Award size={24} />
              <span>Awards</span>
            </div>
            <div className="item-bar">
              <div 
                className="bar-fill awards"
                style={{ width: `${(karmaData.breakdown.awards / karmaData.totalKarma) * 100}%` }}
              />
            </div>
            <span className="item-value">{karmaData.breakdown.awards}</span>
          </div>

          <div className="breakdown-item">
            <div className="item-header">
              <Heart size={24} />
              <span>Helpfulness</span>
            </div>
            <div className="item-bar">
              <div 
                className="bar-fill helpfulness"
                style={{ width: `${(karmaData.breakdown.helpfulness / karmaData.totalKarma) * 100}%` }}
              />
            </div>
            <span className="item-value">{karmaData.breakdown.helpfulness}</span>
          </div>

          <div className="breakdown-item">
            <div className="item-header">
              <Activity size={24} />
              <span>Consistency</span>
            </div>
            <div className="item-bar">
              <div 
                className="bar-fill consistency"
                style={{ width: `${(karmaData.breakdown.consistency / karmaData.totalKarma) * 100}%` }}
              />
            </div>
            <span className="item-value">{karmaData.breakdown.consistency}</span>
          </div>
        </div>
      </div>

      <div className="karma-tips">
        <h3>How to Earn Karma</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <MessageSquare size={24} />
            <h4>Quality Content</h4>
            <p>Create helpful posts and thoughtful comments</p>
            <span className="karma-reward">+10-50 karma</span>
          </div>
          <div className="tip-card">
            <Heart size={24} />
            <h4>Get Upvoted</h4>
            <p>Receive upvotes on your contributions</p>
            <span className="karma-reward">+1 karma each</span>
          </div>
          <div className="tip-card">
            <Award size={24} />
            <h4>Earn Awards</h4>
            <p>Receive awards from other users</p>
            <span className="karma-reward">+25-100 karma</span>
          </div>
          <div className="tip-card">
            <Users size={24} />
            <h4>Help Others</h4>
            <p>Answer questions and provide support</p>
            <span className="karma-reward">+5-20 karma</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHistory = () => (
    <div className="karma-history">
      <div className="history-header">
        <h3>Karma History</h3>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-select"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="history-chart">
        <div className="chart-placeholder">
          <BarChart3 size={48} />
          <p>Karma trend visualization</p>
          <div className="mini-chart">
            {[30, 45, 35, 60, 55, 70, 65, 80, 75, 90, 85, 95].map((height, i) => (
              <div 
                key={i}
                className="history-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="history-list">
        <h4>Recent Activity</h4>
        {karmaData.history.length > 0 ? (
          karmaData.history.map((item, index) => (
            <div key={index} className="history-item">
              <div className="history-icon">
                {item.type === 'post' && <MessageSquare size={24} />}
                {item.type === 'comment' && <MessageSquare size={24} />}
                {item.type === 'award' && <Award size={24} />}
                {item.type === 'upvote' && <Heart size={24} />}
              </div>
              <div className="history-details">
                <p>{item.description}</p>
                <span className="history-time">
                  <Clock size={24} />
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <span className={`history-points ${item.points > 0 ? 'positive' : 'negative'}`}>
                {item.points > 0 ? '+' : ''}{item.points}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-history">
            <Activity size={48} />
            <p>No recent karma activity</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderAchievements = () => (
    <div className="karma-achievements">
      <h3>Achievements & Badges</h3>
      
      <div className="achievements-grid">
        {[
          { id: 1, name: 'First Post', desc: 'Create your first post', icon: '📝', earned: true },
          { id: 2, name: 'Helpful', desc: 'Receive 10 helpful awards', icon: '🤝', earned: true },
          { id: 3, name: 'Popular', desc: 'Get 100 upvotes', icon: '❤️', earned: true },
          { id: 4, name: 'Consistent', desc: '30 day streak', icon: '🔥', earned: false, progress: 22 },
          { id: 5, name: 'Expert', desc: 'Reach Expert rank', icon: '🏆', earned: false, progress: 65 },
          { id: 6, name: 'Influencer', desc: '1000 followers', icon: '👥', earned: false, progress: 45 }
        ].map(achievement => (
          <div key={achievement.id} className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}>
            <div className="achievement-icon">{achievement.icon}</div>
            <h4>{achievement.name}</h4>
            <p>{achievement.desc}</p>
            {!achievement.earned && achievement.progress && (
              <div className="achievement-progress">
                <div className="progress-bar small">
                  <div 
                    className="progress-fill"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <span>{achievement.progress}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="milestones">
        <h4>Upcoming Milestones</h4>
        <div className="milestone-list">
          <div className="milestone-item">
            <Trophy size={24} />
            <div>
              <p>Reach 1,000 Karma</p>
              <span>250 karma away</span>
            </div>
          </div>
          <div className="milestone-item">
            <Star size={24} />
            <div>
              <p>Unlock Member Rank</p>
              <span>Next rank milestone</span>
            </div>
          </div>
          <div className="milestone-item">
            <Flame size={24} />
            <div>
              <p>7 Day Streak</p>
              <span>3 days to go</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLeaderboard = () => (
    <div className="karma-leaderboard">
      <div className="leaderboard-header">
        <h3>Karma Leaderboard</h3>
        <div className="leaderboard-filters">
          <button className="filter-btn active">Global</button>
          <button className="filter-btn">Friends</button>
          <button className="filter-btn">Community</button>
        </div>
      </div>

      <div className="leaderboard-list">
        {[
          { rank: 1, username: 'CryptoKing', karma: 125430, change: 'up', icon: '👑' },
          { rank: 2, username: 'Web3Master', karma: 98765, change: 'up', icon: '🔥' },
          { rank: 3, username: 'NFTExpert', karma: 87654, change: 'down', icon: '💎' },
          { rank: 4, username: 'DeFiWizard', karma: 76543, change: 'same', icon: '⚡' },
          { rank: 5, username: 'BlockchainGuru', karma: 65432, change: 'up', icon: '🚀' },
          { rank: 42, username: user?.username || 'You', karma: karmaData.totalKarma, change: 'up', highlight: true }
        ].map(entry => (
          <div key={entry.rank} className={`leaderboard-entry ${entry.highlight ? 'highlight' : ''}`}>
            <div className="entry-rank">
              {entry.rank <= 3 ? (
                <span className="rank-icon">{entry.icon}</span>
              ) : (
                <span className="rank-number">#{entry.rank}</span>
              )}
            </div>
            <div className="entry-user">
              <img
                src={`/avatar-${entry.rank}.png`}
                alt={`${entry.username} avatar`}
                style={{ width: "64px", height: "64px", flexShrink: 0 }}
                onError={(e) => e.target.src = '/default-avatar.png'}
              />
              <span className="username">{entry.username}</span>
            </div>
            <div className="entry-karma">
              <span className="karma-amount">{entry.karma.toLocaleString()}</span>
              {entry.change === 'up' && <ChevronUp size={24} className="change-up" />}
              {entry.change === 'down' && <ChevronDown size={24} className="change-down" />}
            </div>
          </div>
        ))}
      </div>

      <button className="view-more-btn">
        View Full Leaderboard
      </button>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Star },
    { id: 'history', name: 'History', icon: Clock },
    { id: 'achievements', name: 'Achievements', icon: Trophy },
    { id: 'leaderboard', name: 'Leaderboard', icon: Crown }
  ]

  return (
    <div className="karma-system-modal">
      <div className="karma-system-container">
        <div className="karma-modal-header">
          <div className="header-content">
            <Star size={24} className="header-icon" />
            <div>
              <h2>Karma System</h2>
              <p>Track your contribution and reputation</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="karma-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`karma-tab ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={24} />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading karma data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'achievements' && renderAchievements()}
              {activeTab === 'leaderboard' && renderLeaderboard()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}




export default KarmaSystem
