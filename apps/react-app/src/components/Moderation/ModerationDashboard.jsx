import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
// Sub-components
import ModerationQueue from './ModerationQueue';
import ReportingSystem from './ReportingSystem';
import AnalyticsPanel from './AnalyticsPanel';

const ModerationDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [moderatorStats, setModeratorStats] = useState({});
  const [liveEvents, setLiveEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [queueFilters, setQueueFilters] = useState({
    status: 'pending',
    priority: '',
    content_type: '',
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const socketConnection = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai', {
      auth: { token },
      transports: ['websocket'],
    });

    socketConnection.on('connect', () => {
      setIsConnected(true);

      // Authenticate as moderator
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      socketConnection.emit('authenticate_moderator', {
        userId: user.id,
        token,
      });
    });

    socketConnection.on('disconnect', () => {
      setIsConnected(false);
    });

    socketConnection.on('moderator_authenticated', (data) => {
      setModeratorStats(data);
    });

    socketConnection.on('authentication_failed', (error) => {
      console.error('Moderator authentication failed:', error);
      // Redirect to login or show error
    });

    socketConnection.on('moderation_event', (event) => {
      setLiveEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    });

    socketConnection.on('urgent_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);

      // Show browser notification for urgent items
      if (notification.type === 'urgent' && 'Notification' in window) {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/warning.png',
        });
      }
    });

    socketConnection.on('live_stats_update', (stats) => {
      setModeratorStats(prev => ({ ...prev, ...stats }));
    });

    socketConnection.on('queue_item_assigned', (data) => {
      // Refresh queue if needed
    });

    socketConnection.on('action_applied', (result) => {
      // Show success message
      showToast('Moderation action applied successfully', 'success');
    });

    socketConnection.on('action_error', (error) => {
      console.error('Moderation action error:', error);
      showToast(`Error: ${error.error}`, 'error');
    });

    setSocket(socketConnection);

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    // Implement toast notification system
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    setActiveTab('user_history');
  };

  const handleQuickAction = async (action, targetId, reason) => {
    if (!socket) return;

    socket.emit('apply_moderation_action', {
      action_type: action,
      target_user_id: targetId,
      reason,
      duration_minutes: getDefaultDuration(action),
    });
  };

  const handleQueueItemAction = async (queueId, action, notes) => {
    if (!socket) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/moderation/queue/${queueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          status: action,
          notes,
        }),
      });

      if (response.ok) {
        showToast('Queue item updated successfully', 'success');
      } else {
        showToast('Failed to update queue item', 'error');
      }
    } catch (error) {
      console.error('Error updating queue item:', error);
      showToast('Error updating queue item', 'error');
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getDefaultDuration = (action) => {
    switch (action) {
      case 'timeout': return 60; // 1 hour
      case 'mute': return 1440; // 24 hours
      case 'ban': return 10080; // 7 days
      default: return undefined;
    }
  };

  const connectionStatus = isConnected ? 'connected' : 'disconnected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#58a6ff] to-[#a371f7] font-sans">
      <div className="bg-white/95 backdrop-blur-[10px] border-b border-white/20 px-8 py-4 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <h1 className="m-0 text-2xl font-semibold text-white">Moderation Dashboard</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-[20px] text-sm font-medium ${
            isConnected ? 'bg-green-500/10 text-[#38a169]' : 'bg-red-500/10 text-[#e53e3e]'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              isConnected ? 'bg-[#38a169]' : 'bg-[#e53e3e]'
            }`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <div className="relative cursor-pointer group">
              <span className="absolute -top-2 -right-2 bg-[#e53e3e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                {notifications.length}
              </span>
              <div className="hidden group-hover:block absolute top-full right-0 bg-[#161b22]/95 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[300px] max-w-[400px] z-[1000] border border-black/10">
                {notifications.slice(0, 5).map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-black/5 cursor-pointer transition-colors hover:bg-black/[0.02] last:border-b-0 ${
                      notification.type === 'urgent' ? 'border-l-4 border-l-[#e53e3e]' :
                      notification.type === 'high' ? 'border-l-4 border-l-[#f56500]' :
                      notification.type === 'medium' ? 'border-l-4 border-l-[#d69e2e]' :
                      notification.type === 'low' ? 'border-l-4 border-l-[#38a169]' : ''
                    }`}
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <div className="font-semibold text-white mb-1">{notification.title}</div>
                    <div className="text-sm text-gray-500 mb-1">{notification.message}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-[5px] border-b border-white/20 px-8 sticky top-[73px] z-[99]">
        <nav className="flex gap-0">
          <button
            className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
              activeTab === 'queue' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
            }`}
            onClick={() => handleTabChange('queue')}
          >
            Queue ({moderatorStats.queue?.pending_queue || 0})
          </button>
          <button
            className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
              activeTab === 'reports' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
            }`}
            onClick={() => handleTabChange('reports')}
          >
            Reports ({moderatorStats.reports?.pending_reports || 0})
          </button>
          <button
            className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
              activeTab === 'analytics' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
            }`}
            onClick={() => handleTabChange('analytics')}
          >
            Analytics
          </button>
          <button
            className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
              activeTab === 'live_feed' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
            }`}
            onClick={() => handleTabChange('live_feed')}
          >
            Live Feed
          </button>
          <button
            className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
              activeTab === 'quick_actions' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
            }`}
            onClick={() => handleTabChange('quick_actions')}
          >
            Quick Actions
          </button>
          {selectedUser && (
            <button
              className={`bg-none border-none px-6 py-4 text-sm font-medium cursor-pointer border-b-2 border-transparent transition-all relative ${
                activeTab === 'user_history' ? 'text-[#58a6ff] border-b-[#58a6ff] bg-[#667eea]/5' : 'text-gray-500 hover:text-white hover:bg-black/[0.02]'
              }`}
              onClick={() => handleTabChange('user_history')}
            >
              User History
            </button>
          )}
        </nav>
      </div>

      <div className="flex min-h-[calc(100vh-146px)]">
        <div className="flex-1 p-8 bg-white/10 backdrop-blur-[5px]">
          {activeTab === 'queue' && (
            <ModerationQueue
              socket={socket}
              filters={queueFilters}
              onFiltersChange={setQueueFilters}
              onItemAction={handleQueueItemAction}
              onUserSelect={handleUserSelect}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel />
          )}
        </div>

        <div className="w-[300px] bg-white/95 backdrop-blur-[10px] border-l border-white/20 p-8">
          <div className="mb-8">
            <h3 className="m-0 mb-4 text-base font-semibold text-white">Active Moderators</h3>
            <div className="text-xl font-bold text-[#38a169]">
              {moderatorStats.online_moderators || 0} online
            </div>
          </div>

          <div className="mb-8">
            <h3 className="m-0 mb-4 text-base font-semibold text-white">Recent Notifications</h3>
            <div>
              {notifications.slice(0, 3).map(notification => (
                <div
                  key={notification.id}
                  className={`bg-black/[0.02] rounded-md mb-2 p-3 ${
                    notification.type === 'urgent' ? 'border-l-4 border-l-[#e53e3e]' :
                    notification.type === 'high' ? 'border-l-4 border-l-[#f56500]' :
                    notification.type === 'medium' ? 'border-l-4 border-l-[#d69e2e]' :
                    notification.type === 'low' ? 'border-l-4 border-l-[#38a169]' : ''
                  }`}
                >
                  <div className="font-semibold text-white">{notification.title}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="m-0 mb-4 text-base font-semibold text-white">Quick Stats</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center p-3 bg-black/[0.02] rounded-md border-l-[3px] border-l-[#58a6ff]">
                <span className="text-sm text-gray-500">Pending Reports</span>
                <span className="text-lg font-bold text-white">{moderatorStats.reports?.pending_reports || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/[0.02] rounded-md border-l-[3px] border-l-[#58a6ff]">
                <span className="text-sm text-gray-500">Queue Items</span>
                <span className="text-lg font-bold text-white">{moderatorStats.queue?.total_queue_items || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/[0.02] rounded-md border-l-[3px] border-l-[#58a6ff]">
                <span className="text-sm text-gray-500">High Priority</span>
                <span className="text-lg font-bold text-white">{moderatorStats.queue?.high_priority_queue || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/[0.02] rounded-md border-l-[3px] border-l-[#58a6ff]">
                <span className="text-sm text-gray-500">24h Reports</span>
                <span className="text-lg font-bold text-white">{moderatorStats.reports?.reports_24h || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
