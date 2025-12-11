import React, { useState, useEffect } from 'react';

const AnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/moderation/analytics?time_range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-[10px] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20">
        <div className="flex justify-center items-center p-12 text-gray-500">
          <div className="inline-block w-5 h-5 border-2 border-white/30 rounded-full border-t-white "></div>
          <span>Loading moderation analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white/90 backdrop-blur-[10px] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20">
        <div className="flex flex-col items-center p-12 text-red-600">
          <span>Failed to load analytics data</span>
          <button onClick={fetchAnalytics} className="bg-[#58a6ff] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-[#1a6fc7] hover:-translate-y-px">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-[10px] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
        <h2 className="text-xl font-semibold text-white m-0">Moderation Analytics</h2>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-2 py-2 border border-black/10 rounded-md text-sm bg-[#141414]/95"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={fetchAnalytics} className="bg-[#58a6ff] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-[#1a6fc7] hover:-translate-y-px">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-0 mb-6">
        <button
          className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            selectedMetric === 'overview' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-black/[0.02]'
          }`}
          onClick={() => setSelectedMetric('overview')}
        >
          Overview
        </button>
        <button
          className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            selectedMetric === 'reports' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-black/[0.02]'
          }`}
          onClick={() => setSelectedMetric('reports')}
        >
          Reports
        </button>
        <button
          className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            selectedMetric === 'actions' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-black/[0.02]'
          }`}
          onClick={() => setSelectedMetric('actions')}
        >
          Actions
        </button>
        <button
          className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            selectedMetric === 'ai' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-black/[0.02]'
          }`}
          onClick={() => setSelectedMetric('ai')}
        >
          AI Performance
        </button>
        <button
          className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            selectedMetric === 'moderators' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-black/[0.02]'
          }`}
          onClick={() => setSelectedMetric('moderators')}
        >
          Moderator Performance
        </button>
      </div>

      <div>
        {selectedMetric === 'overview' && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-2xl font-bold text-white mb-1">{formatNumber(analytics.summary?.total_reports || 0)}</div>
                <div className="text-sm text-gray-500 mb-1">Total Reports</div>
                <div className="text-xs text-green-500">+{formatNumber(analytics.summary?.new_reports || 0)} new</div>
              </div>

              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-white mb-1">{formatNumber(analytics.summary?.total_actions || 0)}</div>
                <div className="text-sm text-gray-500 mb-1">Moderation Actions</div>
                <div className="text-xs text-gray-500">{formatPercentage(analytics.summary?.auto_action_rate || 0)} automated</div>
              </div>

              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-white mb-1">{formatPercentage(analytics.ai_accuracy?.accuracy || 0)}</div>
                <div className="text-sm text-gray-500 mb-1">AI Accuracy</div>
                <div className="text-xs text-green-500">{formatPercentage(analytics.ai_accuracy?.precision || 0)} precision</div>
              </div>

              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="text-4xl mb-2">⏱️</div>
                <div className="text-2xl font-bold text-white mb-1">{analytics.summary?.avg_response_time || 0}m</div>
                <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
                <div className="text-xs text-red-500">-15% from last period</div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'reports' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Report Analytics - {getTimeRangeLabel(timeRange)}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4">
                <h4 className="text-base font-semibold text-white mb-3">Report Categories</h4>
                {analytics.top_violations?.map((violation, index) => (
                  <div key={index} className="mb-3">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-[#58a6ff]" style={{ width: `${(violation.count / analytics.top_violations[0].count) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{violation.category}</span>
                      <span className="text-white font-semibold">{violation.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4">
                <h4 className="text-base font-semibold text-white mb-3">Resolution Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-400">Resolved: {analytics.summary?.resolved_reports || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-gray-400">Pending: {analytics.summary?.pending_reports || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-gray-400">Escalated: {analytics.summary?.escalated_reports || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'actions' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Moderation Actions - {getTimeRangeLabel(timeRange)}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">🚫</div>
                <div className="text-2xl font-bold text-white mb-1">{analytics.summary?.bans || 0}</div>
                <div className="text-sm text-gray-500">User Bans</div>
              </div>
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <div className="text-2xl font-bold text-white mb-1">{analytics.summary?.warnings || 0}</div>
                <div className="text-sm text-gray-500">Warnings</div>
              </div>
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">🗑️</div>
                <div className="text-2xl font-bold text-white mb-1">{analytics.summary?.content_removed || 0}</div>
                <div className="text-sm text-gray-500">Content Removed</div>
              </div>
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">🔒</div>
                <div className="text-2xl font-bold text-white mb-1">{analytics.summary?.quarantined || 0}</div>
                <div className="text-sm text-gray-500">Quarantined</div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'ai' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI Performance Metrics - {getTimeRangeLabel(timeRange)}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4">
                <h4 className="text-base font-semibold text-white mb-3">Overall Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Accuracy</span>
                      <span className="text-white font-semibold">{formatPercentage(analytics.ai_accuracy?.accuracy || 0)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(analytics.ai_accuracy?.accuracy || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Precision</span>
                      <span className="text-white font-semibold">{formatPercentage(analytics.ai_accuracy?.precision || 0)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(analytics.ai_accuracy?.precision || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Recall</span>
                      <span className="text-white font-semibold">{formatPercentage(analytics.ai_accuracy?.recall || 0)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(analytics.ai_accuracy?.recall || 0) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4">
                <h4 className="text-base font-semibold text-white mb-3">Processing Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Processing Time</span>
                    <span className="text-white font-semibold">{analytics.ai_accuracy?.avg_processing_time || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Content Analyzed</span>
                    <span className="text-white font-semibold">{formatNumber(analytics.ai_accuracy?.total_analyzed || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auto-Actions Taken</span>
                    <span className="text-white font-semibold">{formatNumber(analytics.ai_accuracy?.auto_actions || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'moderators' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Moderator Performance - {getTimeRangeLabel(timeRange)}</h3>
            <div className="grid grid-cols-2 gap-4">
              {analytics.moderator_performance?.map((moderator, index) => (
                <div key={index} className="bg-[#141414]/60 backdrop-blur-[12px] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#58a6ff] flex items-center justify-center text-white font-bold">
                      {moderator.username?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{moderator.username || 'Anonymous'}</div>
                      <div className="text-sm text-gray-500">{moderator.role || 'Moderator'}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Actions Taken</span>
                      <span className="text-white">{moderator.actions_taken || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reports Resolved</span>
                      <span className="text-white">{moderator.reports_resolved || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Response Time</span>
                      <span className="text-white">{moderator.avg_response_time || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Appeal Rate</span>
                      <span className="text-white">{formatPercentage(moderator.appeal_rate || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
