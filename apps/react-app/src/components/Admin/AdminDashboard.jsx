import React, { useState, useEffect } from 'react'
import {
  Shield, Users, FileText, AlertTriangle, BarChart3,
  Settings, Ban, CheckCircle, Clock, TrendingUp,
  MessageSquare, Flag, Activity, Database, Cpu,
  DollarSign, Eye, UserX, Trash2, RefreshCw
} from 'lucide-react'
import { useConfirmationDialog } from '../ui/modal'
const AdminDashboard = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    reportedContent: 0,
    pendingReports: 0,
    bannedUsers: 0,
    serverHealth: 'healthy'
  })
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    fetchAdminData()
  }, [activeTab])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.stats || stats)
      }

      // Fetch reports if on moderation tab
      if (activeTab === 'moderation') {
        const reportsResponse = await fetch('/api/admin/moderation/reports', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (reportsResponse.ok) {
          const data = await reportsResponse.json()
          setReports(data.reports || [])
        }
      }

      // Fetch users if on users tab
      if (activeTab === 'users') {
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (usersResponse.ok) {
          const data = await usersResponse.json()
          setUsers(data.users || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId, duration = 'permanent') => {
    const confirmed = await confirm({
      type: 'error',
      title: 'Ban User',
      description: `Are you sure you want to ban this user? This will immediately restrict their access to the platform.`,
      confirmText: 'Ban User',
      confirmVariant: 'destructive'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ duration })
      })

      if (response.ok) {
        fetchAdminData()
        alert('User banned successfully')
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  const handleDeleteContent = async (contentId, contentType) => {
    try {
      const response = await fetch(`/api/admin/content/${contentType}/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        fetchAdminData()
        alert('Content deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
    }
  }

  const handleResolveReport = async (reportId, action) => {
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        fetchAdminData()
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('Failed to resolve report:', error)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'moderation', name: 'Moderation', icon: Shield },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="stat-change positive">+12% this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeUsers.toLocaleString()}</h3>
            <p>Active Users</p>
            <span className="stat-change positive">+5% today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon posts">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPosts.toLocaleString()}</h3>
            <p>Total Posts</p>
            <span className="stat-change positive">+234 today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reports">
            <Flag size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingReports}</h3>
            <p>Pending Reports</p>
            <span className="stat-change negative">Needs attention</span>
          </div>
        </div>
      </div>

      <div className="admin-charts">
        <div className="chart-container">
          <h3>User Growth</h3>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <p>Chart visualization here</p>
          </div>
        </div>

        <div className="chart-container">
          <h3>Content Activity</h3>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <p>Activity metrics here</p>
          </div>
        </div>
      </div>

      <div className="system-health">
        <h3>System Health</h3>
        <div className="health-indicators">
          <div className="health-item good">
            <CheckCircle size={20} />
            <span>API Server</span>
          </div>
          <div className="health-item good">
            <CheckCircle size={20} />
            <span>Database</span>
          </div>
          <div className="health-item good">
            <CheckCircle size={20} />
            <span>Redis Cache</span>
          </div>
          <div className="health-item warning">
            <AlertTriangle size={20} />
            <span>CDN (High Load)</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderModeration = () => (
    <div className="admin-moderation">
      <div className="moderation-header">
        <h3>Content Reports</h3>
        <button className="btn-refresh" onClick={fetchAdminData}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <p>No pending reports</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="report-item">
              <div className="report-header">
                <span className="report-type">{report.type}</span>
                <span className="report-time">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="report-content">
                <p className="report-reason">{report.reason}</p>
                <p className="reported-content">{report.content?.substring(0, 100)}...</p>
              </div>
              <div className="report-actions">
                <button 
                  className="btn-view"
                  onClick={() => setSelectedReport(report)}
                >
                  <Eye size={14} />
                  View
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteContent(report.contentId, report.contentType)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button 
                  className="btn-dismiss"
                  onClick={() => handleResolveReport(report.id, 'dismiss')}
                >
                  <X size={14} />
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="admin-users">
      <div className="users-header">
        <h3>User Management</h3>
        <div className="user-filters">
          <select className="filter-select">
            <option>All Users</option>
            <option>Active</option>
            <option>Banned</option>
            <option>New (7 days)</option>
          </select>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Posts</th>
              <th>Reports</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <img src={user.avatar || '/default-avatar.png'} alt="" />
                    <div>
                      <p className="username">{user.username}</p>
                      <p className="email">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.postCount || 0}</td>
                <td>
                  <span className={`report-count ${user.reportCount > 0 ? 'has-reports' : ''}`}>
                    {user.reportCount || 0}
                  </span>
                </td>
                <td>
                  <span className={`status ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-action" title="View Profile">
                      <Eye size={14} />
                    </button>
                    <button 
                      className="btn-action ban"
                      title="Ban User"
                      onClick={() => handleBanUser(user.id)}
                    >
                      <Ban size={14} />
                    </button>
                    <button className="btn-action delete" title="Delete Account">
                      <UserX size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="admin-analytics">
      <h3>Platform Analytics</h3>
      <div className="analytics-grid">
        <div className="metric-card">
          <h4>Engagement Rate</h4>
          <div className="metric-value">68.5%</div>
          <div className="metric-chart">
            <TrendingUp size={32} />
          </div>
        </div>

        <div className="metric-card">
          <h4>Avg. Session Duration</h4>
          <div className="metric-value">12m 34s</div>
          <div className="metric-change positive">+2m 15s</div>
        </div>

        <div className="metric-card">
          <h4>Daily Active Users</h4>
          <div className="metric-value">4,892</div>
          <div className="metric-change positive">+324</div>
        </div>

        <div className="metric-card">
          <h4>Content Created Today</h4>
          <div className="metric-value">1,247</div>
          <div className="metric-breakdown">
            <span>Posts: 234</span>
            <span>Comments: 1,013</span>
          </div>
        </div>
      </div>

      <div className="detailed-analytics">
        <div className="analytics-section">
          <h4>Top Communities</h4>
          <div className="top-list">
            <div className="top-item">
              <span className="rank">1</span>
              <span className="name">CryptoTrading</span>
              <span className="count">12.4k members</span>
            </div>
            <div className="top-item">
              <span className="rank">2</span>
              <span className="name">Web3Development</span>
              <span className="count">8.2k members</span>
            </div>
            <div className="top-item">
              <span className="rank">3</span>
              <span className="name">Gaming</span>
              <span className="count">6.8k members</span>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h4>Server Performance</h4>
          <div className="performance-metrics">
            <div className="perf-item">
              <span className="label">CPU Usage</span>
              <div className="progress-bar">
                <div className="progress" style={{width: '45%'}}></div>
              </div>
              <span className="value">45%</span>
            </div>
            <div className="perf-item">
              <span className="label">Memory</span>
              <div className="progress-bar">
                <div className="progress" style={{width: '62%'}}></div>
              </div>
              <span className="value">62%</span>
            </div>
            <div className="perf-item">
              <span className="label">Storage</span>
              <div className="progress-bar">
                <div className="progress" style={{width: '38%'}}></div>
              </div>
              <span className="value">38%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!user?.isAdmin) {
    return (
      <div className="admin-unauthorized">
        <Shield size={48} />
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to access the admin dashboard.</p>
        <button onClick={onClose}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <Shield size={24} />
          <h2>Admin Dashboard</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg' : 'bg-[#1A1A1A] text-[#666666] hover:bg-[#30363d] hover:text-white'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading admin data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'moderation' && renderModeration()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'content' && (
              <div className="admin-content-mgmt">
                <h3>Content Management</h3>

                <div className="content-tabs">
                  <button style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  font-medium text-sm shadow-lg">All Content</button>
                  <button style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#666666] hover:bg-[#30363d] hover: font-medium text-sm transition-all">Posts</button>
                  <button style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#666666] hover:bg-[#30363d] hover: font-medium text-sm transition-all">Comments</button>
                  <button style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#666666] hover:bg-[#30363d] hover: font-medium text-sm transition-all">Flagged</button>
                </div>

                <div className="content-search">
                  <input
                    type="search"
                    placeholder="Search content..."
                    className="search-input"
                  />
                  <select className="filter-select">
                    <option>All Types</option>
                    <option>Posts</option>
                    <option>Comments</option>
                    <option>Messages</option>
                  </select>
                  <select className="filter-select">
                    <option>All Status</option>
                    <option>Published</option>
                    <option>Flagged</option>
                    <option>Removed</option>
                  </select>
                </div>

                <div className="content-list">
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>No content found matching your filters</p>
                    <p className="text-sm text-muted">Content will appear here when users create posts, comments, or other content</p>
                  </div>
                </div>

                <div className="bulk-actions">
                  <button className="btn-secondary" disabled>
                    <CheckCircle size={14} />
                    Approve Selected
                  </button>
                  <button className="btn-danger" disabled>
                    <Trash2 size={14} />
                    Remove Selected
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="admin-settings">
                <h3>Platform Configuration</h3>

                <div className="settings-sections">
                  <div className="settings-section">
                    <h4>General Settings</h4>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Platform Name</span>
                        <input type="text" defaultValue="CRYB" style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-2.5 bg-[#1A1A1A] border  rounded-lg  placeholder-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all" />
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Allow New Registrations</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Require Email Verification</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4>Content Moderation</h4>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Auto-Moderation</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Require Post Approval</span>
                        <input type="checkbox" className="form-checkbox" />
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Profanity Filter</span>
                        <select className="form-select">
                          <option>Off</option>
                          <option selected>Medium</option>
                          <option>Strict</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4>User Settings</h4>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Default User Role</span>
                        <select className="form-select">
                          <option selected>Member</option>
                          <option>Verified</option>
                          <option>Contributor</option>
                        </select>
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Max Upload Size (MB)</span>
                        <input type="number" defaultValue="10" min="1" max="100" style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-2.5 bg-[#1A1A1A] border  rounded-lg  placeholder-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4>Security</h4>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Enable Two-Factor Auth</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </label>
                    </div>
                    <div className="setting-item">
                      <label>
                        <span className="setting-label">Session Timeout (minutes)</span>
                        <input type="number" defaultValue="30" min="5" max="1440" style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-2.5 bg-[#1A1A1A] border  rounded-lg  placeholder-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-actions">
                  <button className="btn-secondary">Reset to Defaults</button>
                  <button className="btn-primary">Save Settings</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {ConfirmationDialog}
    </div>
  )
}



export default AdminDashboard