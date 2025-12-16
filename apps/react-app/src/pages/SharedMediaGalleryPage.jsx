import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Image, File, Link, Download, ExternalLink,
  Search, Filter, Grid, List, Calendar
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

/**
 * SharedMediaGalleryPage Component
 * View all shared media, files, and links in a conversation
 */
const SharedMediaGalleryPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const [activeTab, setActiveTab] = useState('media') // media, files, links
  const [viewMode, setViewMode] = useState('grid') // grid, list
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
      PDF: 'text-red-500',
      Excel: 'text-green-500',
      Word: 'text-[#58a6ff]',
      ZIP: 'text-purple-500'
    }
    return colors[type] || 'text-[#8b949e]'
  }

  const tabs = [
    { id: 'media', label: 'Media', icon: Image, count: mediaItems.length },
    { id: 'files', label: 'Files', icon: File, count: fileItems.length },
    { id: 'links', label: 'Links', icon: Link, count: linkItems.length }
  ]

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen " role="main" aria-label="Shared media gallery page">
      {/* Header */}
      <div style={{borderColor: "var(--border-subtle)"}} className="card   border-b ">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              style={{color: "var(--text-primary)"}} className="p-2 hover:bg-[#21262d] rounded-lg  transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
            <div>
              <h1 style={{color: "var(--text-primary)"}} className="text-2xl font-bold ">
                Shared Media
              </h1>
              <p style={{color: "var(--text-secondary)"}} className="text-sm ">All shared content from this conversation</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#58a6ff]/10 text-[#58a6ff] border-b-2 border-[#58a6ff]'
                    : 'text-[#8b949e] hover:bg-[#21262d]'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                <tab.icon style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                {tab.label}
                <span className="px-2 py-0.5 bg-[#21262d] rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{borderColor: "var(--border-subtle)"}} className="card   border-b ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search style={{color: "var(--text-secondary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{borderColor: "var(--border-subtle)"}} className="w-full pl-10 pr-4 py-2 bg-[#21262d] border  rounded-lg focus:outline-none focus:border-[#58a6ff]  placeholder-[#8b949e]"
            />
          </div>

          <button style={{color: "var(--text-secondary)"}} className="p-2 hover:bg-[#21262d] rounded-lg ">
            <Filter style={{ width: "24px", height: "24px", flexShrink: 0 }} />
          </button>

          <div style={{borderColor: "var(--border-subtle)"}} className="flex gap-1 bg-[#21262d] border  rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'
              }`}
              aria-label="Grid view"
            >
              <Grid style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'
              }`}
              aria-label="List view"
            >
              <List style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'media' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
            {mediaItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-4 p-4 bg-[#161b22]/60  border border-white/10 rounded-2xl '}
              >
                {viewMode === 'grid' ? (
                  <div style={{borderColor: "var(--border-subtle)"}} className="relative h-full bg-[#21262d] rounded-2xl  overflow-hidden group cursor-pointer border ">
                    {item.type === 'image' && (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    )}
                    {item.type === 'video' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-6xl">🎥</div>
                      </div>
                    )}
                    <div style={{background: "var(--bg-primary)"}} className="absolute inset-0 /60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button className="card card p-3 /60  hover:  rounded-lg backdrop-blur-sm">
                        <Download style={{color: "var(--text-primary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      </button>
                      <button className="card card p-3 /60  hover:  rounded-lg backdrop-blur-sm">
                        <ExternalLink style={{color: "var(--text-primary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{borderColor: "var(--border-subtle)"}} className="w-16 h-16 bg-[#21262d] rounded-lg flex items-center justify-center border ">
                      {item.type === 'image' && <Image style={{color: "var(--text-secondary)"}} style={{ width: "48px", height: "48px", flexShrink: 0 }} />}
                      {item.type === 'video' && <span className="text-3xl">🎥</span>}
                    </div>
                    <div className="flex-1">
                      <div style={{color: "var(--text-primary)"}} className="font-medium ">{item.name}</div>
                      <div style={{color: "var(--text-secondary)"}} className="text-sm ">{item.size} • {item.date}</div>
                    </div>
                    <button style={{color: "var(--text-secondary)"}} className="p-2 hover:bg-[#21262d] rounded-lg ">
                      <Download style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-3">
            {fileItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{borderColor: "var(--border-subtle)"}} className="card flex items-center gap-4 p-4   border  rounded-2xl  hover:border-[#58a6ff]/30 transition-all"
              >
                <div className={`w-12 h-12 flex items-center justify-center ${getFileIcon(item.type)}`}>
                  <File style={{ width: "48px", height: "48px", flexShrink: 0 }} />
                </div>
                <div className="flex-1">
                  <div style={{color: "var(--text-primary)"}} className="font-medium ">{item.name}</div>
                  <div style={{color: "var(--text-secondary)"}} className="text-sm ">{item.type} • {item.size} • {item.date}</div>
                </div>
                <button style={{color: "var(--text-secondary)"}} className="p-2 hover:bg-[#21262d] rounded-lg ">
                  <Download style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-3">
            {linkItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{borderColor: "var(--border-subtle)"}} className="card flex items-center gap-4 p-4   border  rounded-2xl  hover:border-[#58a6ff]/30 transition-all"
              >
                <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                  <Link style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </div>
                <div className="flex-1">
                  <div style={{color: "var(--text-primary)"}} className="font-medium ">{item.title}</div>
                  <div className="text-sm text-[#58a6ff] hover:underline">{item.url}</div>
                  <div style={{color: "var(--text-secondary)"}} className="text-xs  mt-1">{item.date}</div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: "var(--text-secondary)"}} className="p-2 hover:bg-[#21262d] rounded-lg "
                >
                  <ExternalLink style={{ width: "24px", height: "24px", flexShrink: 0 }} />
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

