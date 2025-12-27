/**
 * AnnouncementsPage - Platform announcements and updates
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Bell, Pin, Calendar, ChevronRight } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const AnnouncementsPage = () => {
  const { isMobile, isTablet } = useResponsive()
  const [announcements] = useState([
    { id: 1, title: 'Platform Update v2.0', content: 'We\'ve released a major platform update with new features and improvements.', date: '2024-01-15', pinned: true, type: 'update' },
    { id: 2, title: 'Scheduled Maintenance', content: 'There will be scheduled maintenance on January 20th from 2-4 AM UTC.', date: '2024-01-14', pinned: false, type: 'maintenance' },
    { id: 3, title: 'New Community Guidelines', content: 'We\'ve updated our community guidelines. Please review the changes.', date: '2024-01-12', pinned: false, type: 'policy' },
  ])

  return (
    <div
      role="main"
      aria-label="Announcements page"
      style={{ background: '#FAFAFA', minHeight: '100vh', padding: isMobile ? '16px' : isTablet ? '20px' : '24px', paddingTop: isMobile ? '72px' : '88px' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            borderRadius: isMobile ? '20px' : '24px',
            padding: isMobile ? '24px' : '32px',
            marginBottom: isMobile ? '24px' : '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Megaphone size={isMobile ? 24 : 28} style={{ color: '#fff' }} aria-hidden="true" />
            <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Announcements
            </h1>
          </div>
          <p style={{ color: '#fff', fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Stay updated with the latest news and updates
          </p>
        </motion.div>

        {/* Announcements List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: isMobile ? '20px' : '24px',
                padding: isMobile ? '20px' : '24px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {announcement.pinned && (
                      <Pin size={20} style={{ color: '#58a6ff' }} aria-hidden="true" />
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', margin: 0 }}>
                      {announcement.title}
                    </h3>
                  </div>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px', lineHeight: '1.6' }}>
                    {announcement.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
                    <Calendar size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: '#666', flexShrink: 0 }} aria-hidden="true" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(AnnouncementsPage)
