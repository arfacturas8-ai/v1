/**
 * UserManagementPage.jsx
 * iOS-styled user management page with clean table interface
 */
import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, MoreVertical } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const UserManagementPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const users = [
    { id: 1, username: 'alice', email: 'alice@example.com', status: 'active', role: 'user' },
    { id: 2, username: 'bob', email: 'bob@example.com', status: 'active', role: 'moderator' }
  ]

  return (
    <div
      style={{
        background: '#FAFAFA',
        minHeight: '100vh',
        padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
      }}
      role="main"
      aria-label="User management page"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: isMobile ? '24px' : '32px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}
        >
          <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
            <Users style={{ color: '#000000', width: '20px', height: '20px', flexShrink: 0 }} aria-hidden="true" />
          </div>
          User Management
        </h1>
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  <th
                    style={{
                      color: '#666666',
                      textAlign: 'left',
                      padding: isMobile ? '12px' : '16px',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500'
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      color: '#666666',
                      textAlign: 'left',
                      padding: isMobile ? '12px' : '16px',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500'
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      color: '#666666',
                      textAlign: 'left',
                      padding: isMobile ? '12px' : '16px',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500'
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    style={{
                      borderTop: '1px solid #FAFAFA',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
                  >
                    <td
                      style={{
                        color: '#000000',
                        padding: isMobile ? '12px' : '16px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    >
                      {u.username}
                    </td>
                    <td
                      style={{
                        color: '#000000',
                        padding: isMobile ? '12px' : '16px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ padding: isMobile ? '12px' : '16px' }}>
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontWeight: '500'
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default memo(UserManagementPage)
