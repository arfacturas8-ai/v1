/**
 * AdminPage.jsx
 * iOS-styled admin dashboard with modern card-based interface
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import apiService from '../services/api'

function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCommunities: 0,
    totalPosts: 0,
    pendingReports: 0,
    usersGrowth: '+0%',
    communitiesGrowth: '+0',
    postsGrowth: '+0',
  })
  const [systemHealth, setSystemHealth] = useState({
    apiStatus: 'Loading...',
    apiPercent: 0,
    database: '0%',
    databasePercent: 0,
    cache: '0%',
    cachePercent: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!isAdmin) {
      navigate('/forbidden')
      return
    }

    loadAdminData()
  }, [isAuthenticated, isAdmin, navigate])

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch admin stats
      const statsResponse = await apiService.get('/admin/stats')
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Fetch system health
      const healthResponse = await apiService.get('/admin/system-health')
      if (healthResponse.success && healthResponse.data) {
        setSystemHealth(healthResponse.data)
      }

      // Fetch recent activity
      const activityResponse = await apiService.get('/admin/recent-activity')
      if (activityResponse.success && activityResponse.data) {
        setRecentActivity(activityResponse.data.activities || [])
      }
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError(err.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      style={{
        background: '#FAFAFA',
        minHeight: '100vh',
        paddingTop: headerOffset
      }}
      role="main"
      aria-label="Admin dashboard page"
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `${padding} ${isMobile ? '16px' : isTablet ? '24px' : '32px'}`
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1
            style={{
              fontSize: isMobile ? '28px' : '40px',
              fontWeight: 'bold',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#000000'
            }}
          >
            Admin Dashboard
          </h1>
          <p
            style={{
              color: '#666666',
              fontSize: isMobile ? '14px' : '16px',
              margin: 0
            }}
          >
            Manage all platform operations and configurations
          </p>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '24px' : '32px'
          }}
        >
          {loading ? (
            // Loading state
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: isMobile ? '16px' : '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ color: '#999', fontSize: '14px' }}>Loading...</div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div style={{
              gridColumn: isMobile ? '1' : 'span 4',
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              color: '#ef4444'
            }}>
              {error}
            </div>
          ) : (
            [
              { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', change: stats.usersGrowth || '+0%', color: '#58a6ff', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { label: 'Communities', value: stats.totalCommunities?.toLocaleString() || '0', change: stats.communitiesGrowth || '+0', color: '#10b981', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { label: 'Total Posts', value: stats.totalPosts?.toLocaleString() || '0', change: stats.postsGrowth || '+0', color: '#a371f7', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { label: 'Pending Reports', value: stats.pendingReports?.toLocaleString() || '0', change: stats.pendingReports > 0 ? 'Requires attention' : 'No pending', color: '#f59e0b', iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
            ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg
                    style={{ width: '20px', height: '20px', flexShrink: 0, color: '#000000' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.iconPath} />
                  </svg>
                </div>
                <span style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</span>
              </div>
              <div>
                <h3 style={{ color: '#000000', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>{stat.label}</h3>
                <p style={{ color: '#666666', fontSize: '12px', margin: 0 }}>{stat.change}</p>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Quick Actions & System Health */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '24px' : '32px'
          }}
        >
          <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <h2 style={{ color: '#000000', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', margin: '0 0 24px 0' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Manage Users', desc: 'View and manage all users', color: '#58a6ff', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                  { label: 'Communities', desc: 'Manage communities', color: '#10b981', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { label: 'Moderation', desc: 'Review reports & flags', color: '#ef4444', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                  { label: 'Settings', desc: 'Platform configuration', color: '#f59e0b', iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
                ].map((action, index) => (
                  <button
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: '#FAFAFA',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '56px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FAFAFA'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <svg
                        style={{ width: '20px', height: '20px', flexShrink: 0, color: '#000000' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.iconPath} />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#000000', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                        {action.label}
                      </p>
                      <p style={{ color: '#666666', fontSize: '12px', margin: 0 }}>{action.desc}</p>
                    </div>
                    <svg
                      style={{ width: '20px', height: '20px', flexShrink: 0, color: '#666666' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                System Health
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Loading...</div>
                ) : (
                  [
                    { label: 'API Status', value: systemHealth.apiStatus || 'Loading...', percent: systemHealth.apiPercent || 0, color: systemHealth.apiPercent >= 95 ? '#10b981' : systemHealth.apiPercent >= 70 ? '#f59e0b' : '#ef4444' },
                    { label: 'Database', value: systemHealth.database || '0%', percent: systemHealth.databasePercent || 0, color: systemHealth.databasePercent >= 95 ? '#10b981' : systemHealth.databasePercent >= 70 ? '#f59e0b' : '#ef4444' },
                    { label: 'Cache', value: systemHealth.cache || '0%', percent: systemHealth.cachePercent || 0, color: systemHealth.cachePercent >= 95 ? '#10b981' : systemHealth.cachePercent >= 70 ? '#f59e0b' : '#ef4444' }
                  ].map((item, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#666666', fontSize: '12px' }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: '12px', fontWeight: '600' }}>{item.value}</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: '#FAFAFA',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.percent}%`,
                          background: item.color,
                          borderRadius: '4px',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                  <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Loading...</div>
                ) : recentActivity.length === 0 ? (
                  <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '16px' }}>No recent activity</div>
                ) : (
                  recentActivity.slice(0, 4).map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#000000', fontSize: '13px', margin: '0 0 2px 0' }}>{item.action}</p>
                      <p style={{ color: '#666666', fontSize: '11px', margin: 0 }}>{item.time}</p>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: isMobile ? '24px' : '32px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <h3 style={{ color: '#000000', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Full Admin Panel Coming Soon
          </h3>
          <p style={{ color: '#666666', fontSize: isMobile ? '14px' : '16px', margin: '0 0 16px 0' }}>
            Advanced analytics, detailed reporting, and more powerful tools are being developed.
          </p>
          <button
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              height: '48px',
              minWidth: '140px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            View Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
