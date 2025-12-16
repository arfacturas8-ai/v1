import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, Users, Clock, 
  Star, Award, Target, Zap, Eye, Calendar, Filter,
  ChevronRight, ChevronDown, Activity, Flame
} from 'lucide-react';
import { DEFAULT_REACTIONS } from './ReactionPicker';
// Analytics card component
function AnalyticsCard({ title, value, subtitle, icon: Icon, trend, color, onClick }) {
  return (
    <div
      className={`relative overflow-hidden bg-zinc-800 border border-zinc-700 rounded-xl p-5 transition-all duration-200 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:opacity-80 ${
        onClick ? 'cursor-pointer hover:bg-zinc-700 hover:border-current hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]' : ''
      }`}
      onClick={onClick}
      style={{ '--tw-border-opacity': onClick ? 1 : undefined, borderColor: onClick ? color : undefined, '--tw-gradient-from': color }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{color: "var(--text-primary)"}} className="flex items-center justify-center w-9 h-9 rounded-lg "
          style={{ backgroundColor: color }}
        >
          <Icon size={24} />
        </div>
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</div>
      </div>

      <div style={{color: "var(--text-primary)"}} className="text-[32px] font-bold  mb-1 leading-none">{value}</div>

      {subtitle && <div className="text-xs text-gray-500 mb-2">{subtitle}</div>}

      {trend && (
        <div className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          <span>{trend === 'up' ? 'Trending up' : 'Trending down'}</span>
        </div>
      )}
    </div>
  );
}

// Reaction chart component
function ReactionChart({ data, timeframe, height = 200 }) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  
  const maxValue = Math.max(...data.map(d => Math.max(...Object.values(d.reactions || {}))));
  
  const getReactionColor = (reactionType) => {
    const reaction = DEFAULT_REACTIONS.find(r => r.type === reactionType);
    return reaction?.color || '#888';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === '24h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeframe === '7d') return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="reaction-chart">
      <div className="chart-header">
        <h3>Reaction Trends</h3>
        <div className="chart-legend">
          {Object.keys(data[0]?.reactions || {}).map(reactionType => {
            const reaction = DEFAULT_REACTIONS.find(r => r.type === reactionType);
            if (!reaction) return null;
            
            return (
              <button
                key={reactionType}
                className={`legend-item ${selectedReaction === reactionType ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setSelectedReaction(selectedReaction === reactionType ? null : reactionType)}
                style={{ '--reaction-color': reaction.color }}
              >
                <span className="legend-emoji">{reaction.emoji}</span>
                <span className="legend-label">{reaction.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="chart-container" style={{ height }}>
        <div className="chart-y-axis">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="y-axis-label">
              {Math.round((maxValue * (4 - i)) / 4)}
            </div>
          ))}
        </div>
        
        <div className="chart-content">
          {data.map((dataPoint, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-bars">
                {Object.entries(dataPoint.reactions || {}).map(([reactionType, count]) => {
                  if (selectedReaction && selectedReaction !== reactionType) return null;
                  
                  const heightPercent = (count / maxValue) * 100;
                  const color = getReactionColor(reactionType);
                  
                  return (
                    <div
                      key={reactionType}
                      className="chart-bar"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: color,
                        opacity: selectedReaction ? 1 : 0.8
                      }}
                      title={`${reactionType}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="chart-x-label">
                {formatDate(dataPoint.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Trending content component
function TrendingContent({ contentType, onViewContent }) {
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchTrendingData();
  }, [contentType, timeframe]);

  const fetchTrendingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reactions/trending?contentType=${contentType}&period=${timeframe}&limit=10`
      );
      const data = await response.json();
      
      if (data.success) {
        setTrendingData(data.data.trending);
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTrendScore = (score) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return Math.round(score).toString();
  };

  return (
    <div className="trending-content">
      <div className="trending-header">
        <h3>
          <Flame size={24} />
          Trending {contentType}
        </h3>
        
        <div className="timeframe-selector">
          {['1h', '6h', '24h', '7d'].map(period => (
            <button
              key={period}
              className={`timeframe-btn ${timeframe === period ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setTimeframe(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="trending-loading">
          <div className="loading-spinner" />
          <span>Finding trending content...</span>
        </div>
      ) : (
        <div className="trending-list">
          {(trendingData || []).map((item, index) => (
            <div key={item.content_id} className="trending-item">
              <div className="trending-rank">#{index + 1}</div>
              
              <div className="trending-content-info">
                <div className="content-preview">
                  {item.content_info?.title || item.content_info?.content?.substring(0, 100) + '...'}
                </div>
                
                <div className="trending-stats">
                  <div className="stat">
                    <TrendingUp size={24} />
                    <span>{formatTrendScore(item.trend_score)} trend</span>
                  </div>
                  <div className="stat">
                    <Activity size={24} />
                    <span>{item.total_reactions} reactions</span>
                  </div>
                  <div className="stat">
                    <Users size={24} />
                    <span>{item.total_unique_users} users</span>
                  </div>
                </div>
              </div>
              
              <button
                className="view-content-btn"
                onClick={() => onViewContent(item)}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          ))}
          
          {(trendingData || []).length === 0 && (
            <div className="no-trending">
              <Flame size={48} />
              <h4>No trending content</h4>
              <p>Check back later for trending {contentType}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// User reaction leaderboard
function ReactionLeaderboard({ timeframe = '30d', limit = 10 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reactions/leaderboard?timeframe=${timeframe}&limit=${limit}`
      );
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="reaction-leaderboard">
      <div className="leaderboard-header">
        <h3>
          <Award size={24} />
          Top Reactors
        </h3>
        <span className="timeframe-label">{timeframe}</span>
      </div>

      {loading ? (
        <div className="leaderboard-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <div key={user.user_id} className={`leaderboard-item rank-${index + 1}`}>
              <div className="rank">
                {index + 1 <= 3 ? (
                  <div className={`medal medal-${index + 1}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                ) : (
                  <span className="rank-number">#{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} style={{ width: "64px", height: "64px", flexShrink: 0 }} />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(user.display_name || user.username)[0].toUpperCase()}
                  </div>
                )}
                
                <div className="user-details">
                  <div className="username">{user.display_name || user.username}</div>
                  <div className="user-stats">
                    <span>{formatNumber(user.total_reactions_given)} given</span>
                    <span className="separator">•</span>
                    <span>{formatNumber(user.total_reactions_received)} received</span>
                  </div>
                </div>
              </div>
              
              <div className="achievements">
                {user.reaction_streak > 7 && (
                  <div className="achievement" title={`${user.reaction_streak} day streak`}>
                    <Flame size={24} />
                    <span>{user.reaction_streak}</span>
                  </div>
                )}
                
                {user.achievement_badges?.map((badge, i) => (
                  <div key={i} className="achievement-badge">
                    {badge.emoji || '🏆'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main analytics dashboard
function ReactionAnalytics({ 
  contentType, 
  contentId, 
  showTrending = true, 
  showLeaderboard = true,
  showChart = true,
  timeframe = '24h',
  onContentView
}) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (contentId) {
      fetchContentAnalytics();
    } else {
      fetchGlobalAnalytics();
    }
  }, [contentType, contentId, timeframe]);

  const fetchContentAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reactions/${contentType}/${contentId}?analytics=true&timeframe=${timeframe}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching content analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reactions/analytics/global?timeframe=${timeframe}&contentType=${contentType || 'all'}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching global analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'leaderboard', label: 'Top Users', icon: Award },
    { id: 'insights', label: 'Insights', icon: Target }
  ];

  if (loading) {
    return (
      <div className="reaction-analytics loading">
        <div className="analytics-loading">
          <div className="loading-spinner large" />
          <h3>Analyzing reactions...</h3>
          <p>Gathering insights from user engagement</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reaction-analytics">
      <div className="analytics-header">
        <h2>
          <BarChart3 size={24} />
          Reaction Analytics
        </h2>
        
        <div className="analytics-tabs">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={24} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="analytics-cards">
              <AnalyticsCard
                title="Total Reactions"
                value={analytics?.totalReactions || 0}
                subtitle="All time"
                icon={Activity}
                color="#58a6ff"
              />
              
              <AnalyticsCard
                title="Unique Users"
                value={analytics?.uniqueUsers || 0}
                subtitle="Who reacted"
                icon={Users}
                color="#28a745"
              />
              
              <AnalyticsCard
                title="Engagement Rate"
                value={`${analytics?.engagementRate || 0}%`}
                subtitle="Reactions per view"
                icon={Target}
                trend={analytics?.engagementTrend}
                color="#ffc107"
              />
              
              <AnalyticsCard
                title="Trending Score"
                value={analytics?.trendingScore || 0}
                subtitle="Current trend"
                icon={TrendingUp}
                trend={analytics?.trendDirection}
                color="#dc3545"
              />
            </div>

            {showChart && analytics?.chartData && (
              <ReactionChart 
                data={analytics.chartData} 
                timeframe={timeframe} 
              />
            )}
            
            <div className="popular-reactions">
              <h3>Most Popular Reactions</h3>
              <div className="reaction-breakdown">
                {Object.entries(analytics?.reactionBreakdown || {}).map(([type, count]) => {
                  const reaction = DEFAULT_REACTIONS.find(r => r.type === type);
                  if (!reaction || count === 0) return null;
                  
                  const percentage = (count / analytics.totalReactions) * 100;
                  
                  return (
                    <div key={type} className="reaction-stat">
                      <div className="reaction-info">
                        <span className="reaction-emoji">{reaction.emoji}</span>
                        <span className="reaction-name">{reaction.label}</span>
                      </div>
                      
                      <div className="reaction-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: reaction.color 
                          }}
                        />
                      </div>
                      
                      <div className="reaction-count">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trending' && showTrending && (
          <div className="trending-tab">
            {['post', 'comment', 'message'].map(type => (
              <TrendingContent
                key={type}
                contentType={type}
                onViewContent={onContentView}
              />
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && showLeaderboard && (
          <div className="leaderboard-tab">
            <ReactionLeaderboard timeframe={timeframe} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Peak Activity</h4>
                <p>Most reactions happen between {analytics?.peakHours?.start || '6PM'} - {analytics?.peakHours?.end || '9PM'}</p>
              </div>
              
              <div className="insight-card">
                <h4>Popular Content</h4>
                <p>{analytics?.contentInsights?.topType || 'Posts'} get the most reactions on average</p>
              </div>
              
              <div className="insight-card">
                <h4>User Behavior</h4>
                <p>Users tend to react {analytics?.behaviorInsights?.tendency || 'positively'} to content</p>
              </div>
              
              <div className="insight-card">
                <h4>Growth Trend</h4>
                <p>Reactions have {analytics?.growthTrend?.direction || 'increased'} by {analytics?.growthTrend?.percentage || '15'}% this week</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ReactionAnalytics;
export { AnalyticsCard, ReactionChart, TrendingContent, ReactionLeaderboard };
