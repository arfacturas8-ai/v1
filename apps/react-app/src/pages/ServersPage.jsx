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
  const [activeTab, setActiveTab] = useState('discover') // discover, myServers
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [publicServers, setPublicServers] = useState([])
  const [myServers, setMyServers] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [message, setMessage] = useState('')

  const categories = [
    { id: 'all', label: 'All Servers', icon: <Globe className="h-4 w-4" /> },
    { id: 'tech', label: 'Technology', icon: <Hash className="h-4 w-4" /> },
    { id: 'gaming', label: 'Gaming', icon: <Volume2 className="h-4 w-4" /> },
    { id: 'crypto', label: 'Crypto', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="h-4 w-4" /> }
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

        // Navigate to chat with this server
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
      className="bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 hover:border-[#58a6ff]/30 transition-all"
    >
      <div className="flex items-start gap-3 md:gap-4">
        {/* Server Icon */}
        <div className="flex-shrink-0">
          {server?.icon ? (
            <img
              src={server?.icon}
              alt={server?.name || 'Server'}
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center text-white text-xl md:text-2xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7]"
            >
              {server?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
        </div>

        {/* Server Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base md:text-lg font-bold text-white truncate">
                  {server?.name || 'Unnamed Server'}
                </h3>
                {server?.isPublic ? (
                  <Globe className="h-4 w-4 text-[#58a6ff] flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-[#8b949e] flex-shrink-0" />
                )}
              </div>
              {server?.description && (
                <p className="text-sm text-[#8b949e] line-clamp-2">
                  {server?.description}
                </p>
              )}
            </div>

            {!isMember && (
              <Button
                size="sm"
                onClick={() => handleJoinServer(server?.id)}
                className="min-h-[44px] flex-shrink-0"
              >
                Join
              </Button>
            )}

            {isMember && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/chat')}
                className="min-h-[44px] flex-shrink-0"
              >
                <span className="hidden md:inline">Open</span>
                <ArrowRight className="h-4 w-4 md:ml-1" />
              </Button>
            )}
          </div>

          {/* Server Stats */}
          <div className="flex items-center gap-3 md:gap-4 text-sm text-[#8b949e]">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs md:text-sm">{server?.memberCount || 0} members</span>
            </div>
            {server?.onlineCount !== undefined && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#10b981] flex-shrink-0"></div>
                <span className="text-xs md:text-sm">{server?.onlineCount || 0} online</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  return (
    <div className="container py-6 md:py-8 lg:py-12">
      <main id="main-content" className="max-w-6xl mx-auto" role="main" aria-label="Page content">
        {/* Header */}
        <div className="mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2">
                Server Discovery
              </h1>
              <p className="text-sm md:text-base text-secondary">
                Find and join communities or create your own
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(true)}
                className="min-h-[44px] whitespace-nowrap"
              >
                Join via Invite
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="min-h-[44px] whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Server
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6 md:mb-8">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-rgb(var(--color-neutral-400))" />
              <Input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 h-12 md:h-14 min-h-[44px]"
              />
            </div>
          </form>

          {/* Message */}
          {message && (
            <div className={`mb-6 md:mb-8 p-3 md:p-4 rounded-lg border ${
              message?.type === 'error'
                ? 'bg-error/10 border-error/20 text-rgb(var(--color-error-600))'
                : 'bg-success/10 border-success/20 text-rgb(var(--color-primary-500))'
            }`}>
              <p className="text-sm md:text-base">{message?.text || ''}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 md:gap-3 border-b border-rgb(var(--color-neutral-200))">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 md:px-6 lg:px-8 py-3 md:py-4 font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === 'discover'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="text-sm md:text-base">Discover</span>
            </button>
            <button
              onClick={() => setActiveTab('myServers')}
              className={`px-4 md:px-6 lg:px-8 py-3 md:py-4 font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === 'myServers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="text-sm md:text-base">My Servers</span>
            </button>
          </div>
        </div>

        {/* Categories (only in discover tab) */}
        {activeTab === 'discover' && (
          <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10 lg:mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-2 md:py-3 rounded-full border transition-colors min-h-[44px] ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-transparent'
                    : 'bg-[#21262d] text-[#c9d1d9] border-white/10 hover:border-[#58a6ff]/50'
                }`}
              >
                {category.icon}
                <span className="text-xs md:text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Server List */}
        {error ? (
          <div className="text-center py-12 md:py-16 lg:py-20">
            <div className="bg-error/10 border border-error/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8 lg:p-10 max-w-md mx-auto">
              <div className="text-4xl md:text-5xl lg:text-6xl mb-3 md:mb-4">⚠️</div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                Something went wrong
              </h3>
              <p className="text-sm md:text-base text-rgb(var(--color-neutral-600)) mb-4 md:mb-6 lg:mb-8">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              <Button onClick={loadServers} className="min-h-[44px]">
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12 md:py-16 lg:py-20">
            <div className="inline-block  rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-sm md:text-base text-secondary mt-3 md:mt-4">Loading servers...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-5 lg:gap-6">
            {activeTab === 'discover' && (publicServers?.length || 0) === 0 && (
              <div className="text-center py-12 md:py-16 lg:py-20">
                <Globe className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-rgb(var(--color-neutral-300)) mx-auto mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                  No servers found
                </h3>
                <p className="text-sm md:text-base text-secondary mb-4 md:mb-6 lg:mb-8">
                  Try adjusting your search or category filters
                </p>
              </div>
            )}

            {activeTab === 'myServers' && (myServers?.length || 0) === 0 && (
              <div className="text-center py-12 md:py-16 lg:py-20">
                <Users className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-rgb(var(--color-neutral-300)) mx-auto mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                  You haven't joined any servers yet
                </h3>
                <p className="text-sm md:text-base text-secondary mb-4 md:mb-6 lg:mb-8">
                  Discover and join communities or create your own
                </p>
                <Button onClick={() => setActiveTab('discover')} className="min-h-[44px]">
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
