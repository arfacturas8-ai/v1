/**
 * ServersPage - Server discovery and management
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

import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Users, TrendingUp, Globe, Lock, Hash, Volume2, ArrowRight } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import serverService from '../services/serverService'
import CreateServerModal from '../components/servers/CreateServerModal'
import InviteModal from '../components/servers/InviteModal'
import { useResponsive } from '../hooks/useResponsive'

function ServersPage() {
  const { isMobile, isTablet } = useResponsive()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [publicServers, setPublicServers] = useState([])
  const [myServers, setMyServers] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [message, setMessage] = useState('')

  const categories = [
    { id: 'all', label: 'All Servers', icon: <Globe size={20} /> },
    { id: 'tech', label: 'Technology', icon: <Hash size={20} /> },
    { id: 'gaming', label: 'Gaming', icon: <Volume2 size={20} /> },
    { id: 'crypto', label: 'Crypto', icon: <TrendingUp size={20} /> },
    { id: 'community', label: 'Community', icon: <Users size={20} /> }
  ]

  useEffect(() => {
    loadServers()
  }, [activeTab, selectedCategory])

  const loadServers = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'discover') {
        const filters = selectedCategory !== 'all' ? { category: selectedCategory } : {}
        const result = await serverService.searchPublicServers(searchQuery, filters)

        if (result?.success) {
          setPublicServers(result?.servers || [])
        } else {
          setError('Failed to load servers. Please try again.')
        }
      } else {
        const result = await serverService.getServers()

        if (result?.success) {
          setMyServers(result?.servers || [])
        } else {
          setError('Failed to load servers. Please try again.')
        }
      }
    } catch (err) {
      console.error('Failed to load servers:', err)
      setError('Failed to load servers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadServers()
  }

  const handleJoinServer = async (serverId) => {
    try {
      const result = await serverService.joinServer(serverId)

      if (result?.success) {
        setMessage({ type: 'success', text: 'Successfully joined server!' })
        loadServers()

        setTimeout(() => {
          navigate('/chat')
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result?.error || 'Failed to join server' })
      }
    } catch (error) {
      console.error('Failed to join server:', error)
      setMessage({ type: 'error', text: error?.message || 'Failed to join server' })
    }
  }

  const handleServerCreated = (newServer) => {
    setShowCreateModal(false)
    setMessage({ type: 'success', text: 'Server created successfully!' })
    setActiveTab('myServers')
    loadServers()
  }

  const handleInviteJoin = (server) => {
    setMessage({ type: 'success', text: `Joined ${server?.name || 'server'}!` })
    setShowInviteModal(false)
    loadServers()
  }

  const ServerCard = ({ server, isMember = false }) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: '24px',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
        {/* Server Icon */}
        <div style={{ flexShrink: 0 }}>
          {server?.icon ? (
            <img
              src={server?.icon}
              alt={server?.name || 'Server'}
              style={{ width: '64px', height: '64px', borderRadius: '16px' }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              {server?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
        </div>

        {/* Server Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', margin: 0 }}>
                  {server?.name || 'Unnamed Server'}
                </h3>
                {server?.isPublic ? (
                  <Globe size={20} style={{ color: '#666' }} />
                ) : (
                  <Lock size={20} style={{ color: '#666' }} />
                )}
              </div>
              {server?.description && (
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  {server?.description}
                </p>
              )}
            </div>

            {!isMember && (
              <Button
                size="sm"
                onClick={() => handleJoinServer(server?.id)}
                style={{ minHeight: '44px', flexShrink: 0 }}
              >
                Join
              </Button>
            )}

            {isMember && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/chat')}
                style={{ minHeight: '44px', flexShrink: 0 }}
              >
                <span style={{ display: isMobile ? 'none' : 'inline' }}>Open</span>
                <ArrowRight size={20} />
              </Button>
            )}
          </div>

          {/* Server Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#666' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={20} />
              <span>{server?.memberCount || 0} members</span>
            </div>
            {server?.onlineCount !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                <span>{server?.onlineCount || 0} online</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#FAFAFA' }}>
      <main style={{ maxWidth: '1200px', margin: '0 auto' }} role="main" aria-label="Page content">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'start' : 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>
                Server Discovery
              </h1>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Find and join communities or create your own
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(true)}
                style={{ minHeight: '44px' }}
              >
                Join via Invite
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={20} />
                Create Server
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <Input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '48px', height: '48px', minHeight: '44px', borderRadius: '16px' }}
              />
            </div>
          </form>

          {/* Message */}
          {message && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '16px',
              border: message?.type === 'error' ? '1px solid #ef4444' : '1px solid #10b981',
              background: message?.type === 'error' ? '#fef2f2' : '#f0fdf4'
            }}>
              <p style={{ fontSize: '14px', color: message?.type === 'error' ? '#ef4444' : '#10b981', margin: 0 }}>{message?.text || ''}</p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => setActiveTab('discover')}
              style={{
                padding: '16px 32px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'discover' ? '2px solid #000000' : '2px solid transparent',
                color: activeTab === 'discover' ? '#000000' : '#666',
                cursor: 'pointer'
              }}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('myServers')}
              style={{
                padding: '16px 32px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'myServers' ? '2px solid #000000' : '2px solid transparent',
                color: activeTab === 'myServers' ? '#000000' : '#666',
                cursor: 'pointer'
              }}
            >
              My Servers
            </button>
          </div>
        </div>

        {/* Categories (only in discover tab) */}
        {activeTab === 'discover' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  background: selectedCategory === category.id ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : '#fff',
                  color: selectedCategory === category.id ? '#fff' : '#000',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {category.icon}
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{category.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Server List */}
        {error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '24px', padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>
                Something went wrong
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              <Button onClick={loadServers} style={{ minHeight: '44px' }}>
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '16px' }}>Loading servers...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTab === 'discover' && (publicServers?.length || 0) === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Globe size={48} style={{ margin: '0 auto 16px', color: '#666', opacity: 0.3 }} />
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>
                  No servers found
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
                  Try adjusting your search or category filters
                </p>
              </div>
            )}

            {activeTab === 'myServers' && (myServers?.length || 0) === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Users size={48} style={{ margin: '0 auto 16px', color: '#666', opacity: 0.3 }} />
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>
                  You haven't joined any servers yet
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
                  Discover and join communities or create your own
                </p>
                <Button onClick={() => setActiveTab('discover')} style={{ minHeight: '44px' }}>
                  Discover Servers
                </Button>
              </div>
            )}

            {activeTab === 'discover' && (publicServers || []).map((server) => (
              <ServerCard key={server?.id || Math.random()} server={server} />
            ))}

            {activeTab === 'myServers' && (myServers || []).map((server) => (
              <ServerCard key={server?.id || Math.random()} server={server} isMember={true} />
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateServerModal
            onClose={() => setShowCreateModal(false)}
            onServerCreated={handleServerCreated}
          />
        )}

        {showInviteModal && (
          <InviteModal
            onClose={() => setShowInviteModal(false)}
            onJoin={handleInviteJoin}
          />
        )}
      </main>
    </div>
  )
}

export default ServersPage
