/**
 * SharedMediaGalleryPage - iOS Modern Aesthetic
 * Shared media gallery with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Image, File, Link, Download, ExternalLink,
  Search, Filter, Grid, List, Calendar
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const SharedMediaGalleryPage = () => {
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const [activeTab, setActiveTab] = useState('media')
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const mediaItems = [
    { id: 1, type: 'image', url: 'https://picsum.photos/400/300?random=1', name: 'Screenshot 2024.png', date: '2024-01-15', size: '2.5 MB' },
    { id: 2, type: 'image', url: 'https://picsum.photos/400/300?random=2', name: 'Photo.jpg', date: '2024-01-14', size: '1.8 MB' },
    { id: 3, type: 'video', url: '', name: 'Video.mp4', date: '2024-01-13', size: '15.2 MB' },
    { id: 4, type: 'image', url: 'https://picsum.photos/400/300?random=3', name: 'Design.png', date: '2024-01-12', size: '3.1 MB' }
  ]

  const fileItems = [
    { id: 1, name: 'Project_Proposal.pdf', type: 'PDF', size: '2.5 MB', date: '2024-01-15' },
    { id: 2, name: 'Budget_2024.xlsx', type: 'Excel', size: '856 KB', date: '2024-01-14' },
    { id: 3, name: 'Meeting_Notes.docx', type: 'Word', size: '124 KB', date: '2024-01-13' },
    { id: 4, name: 'Code_Review.zip', type: 'ZIP', size: '45.2 MB', date: '2024-01-12' }
  ]

  const linkItems = [
    { id: 1, url: 'https://github.com/example/repo', title: 'GitHub Repository', date: '2024-01-15' },
    { id: 2, url: 'https://docs.example.com', title: 'Documentation', date: '2024-01-14' },
    { id: 3, url: 'https://figma.com/file/123', title: 'Design Mockups', date: '2024-01-13' }
  ]

  const getFileIcon = (type) => {
    const colors = {
      PDF: '#EF4444',
      Excel: '#10B981',
      Word: '#6366F1',
      ZIP: '#8B5CF6'
    }
    return colors[type] || '#666666'
  }

  const tabs = [
    { id: 'media', label: 'Media', icon: Image, count: mediaItems.length },
    { id: 'files', label: 'Files', icon: File, count: fileItems.length },
    { id: 'links', label: 'Links', icon: Link, count: linkItems.length }
  ]

  return (
    <div role="main" aria-label="Shared media gallery page" style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#000000',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5F5F5'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#000000', margin: 0 }}>
                Shared Media
              </h1>
              <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>All shared content from this conversation</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                role="tab"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px 12px 0 0',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' : 'transparent',
                  color: activeTab === tab.id ? '#6366F1' : '#666666',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = '#F5F5F5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <tab.icon size={20} />
                {tab.label}
                <span style={{
                  padding: '2px 8px',
                  background: activeTab === tab.id ? '#6366F1' : '#E0E0E0',
                  color: activeTab === tab.id ? '#FFFFFF' : '#666666',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666666', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px 0 48px',
                background: '#FAFAFA',
                border: '1px solid #E0E0E0',
                borderRadius: '16px',
                color: '#000000',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E0E0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666666',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#666666'
            }}
          >
            <Filter size={20} />
          </button>

          <div style={{ display: 'flex', gap: '4px', background: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '4px' }}>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: viewMode === 'grid' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : 'transparent',
                color: viewMode === 'grid' ? '#6366F1' : '#666666',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: viewMode === 'list' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : 'transparent',
                color: viewMode === 'list' ? '#6366F1' : '#666666',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'media' && (
          <div style={viewMode === 'grid' ? { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' } : { display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mediaItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={viewMode === 'grid' ? {
                  aspectRatio: '1',
                  position: 'relative',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #E0E0E0',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                } : {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {viewMode === 'grid' ? (
                  <>
                    {item.type === 'image' && (
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {item.type === 'video' && (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>🎥</div>
                    )}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                    >
                      <button style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000'
                      }}>
                        <Download size={20} />
                      </button>
                      <button style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000'
                      }}>
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '64px', height: '64px', background: '#FAFAFA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E0E0E0', flexShrink: 0 }}>
                      {item.type === 'image' && <Image size={32} style={{ color: '#666666' }} />}
                      {item.type === 'video' && <span style={{ fontSize: '32px' }}>🎥</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#000000', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '14px', color: '#666666' }}>{item.size} • {item.date}</div>
                    </div>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                      e.currentTarget.style.color = '#000000'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                    >
                      <Download size={20} />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fileItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <File size={32} style={{ color: getFileIcon(item.type) }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#000000', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '14px', color: '#666666' }}>{item.type} • {item.size} • {item.date}</div>
                </div>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F5'
                    e.currentTarget.style.color = '#000000'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666666'
                  }}
                >
                  <Download size={20} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {linkItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link size={32} style={{ color: '#6366F1' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#000000', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '14px', color: '#6366F1', marginBottom: '4px' }}>{item.url}</div>
                  <div style={{ fontSize: '12px', color: '#666666' }}>{item.date}</div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F5'
                    e.currentTarget.style.color = '#000000'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666666'
                  }}
                >
                  <ExternalLink size={20} />
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(SharedMediaGalleryPage)
