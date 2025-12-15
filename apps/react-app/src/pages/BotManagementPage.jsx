import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Bot, Plus, Settings, Trash2, RefreshCw, Copy, Eye, EyeOff, Activity, Power, PowerOff, Search, Filter, TrendingUp, Zap, Command } from 'lucide-react'
import botService from '../services/botService'

const BotManagementPage = () => {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [visibleTokens, setVisibleTokens] = useState({})
  const [activityLogs, setActivityLogs] = useState([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newBotData, setNewBotData] = useState({
    name: '',
    description: '',
    type: 'custom',
    prefix: '!',
    permissions: [],
    avatarUrl: ''
  })
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({
    totalBots: 0,
    activeBots: 0,
    commandsToday: 0
  })

  const botTypes = botService.getBotTypes()
  const availablePermissions = botService.getAvailablePermissions()

  useEffect(() => {
    loadBots()
  }, [])

  useEffect(() => {
    updateStats()
  }, [bots])

  const loadBots = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await botService.getBots()
      if (response?.success) {
        setBots(response?.data?.items || [])
      } else {
        setError('Failed to load bots. Please try again.')
      }
    } catch (err) {
      console.error('Failed to load bots:', err)
      setError(err?.message || 'Failed to load bots. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    const totalBots = bots?.length || 0
    const activeBots = (bots || []).filter(bot => bot?.enabled).length
    const commandsToday = (bots || []).reduce((sum, bot) => sum + (bot?.commandsToday || 0), 0)

    setStats({ totalBots, activeBots, commandsToday })
  }

  const handleCreateBot = async () => {
    if (!newBotData?.name?.trim()) {
      showMessage('Please enter a bot name', 'error')
      return
    }

    if ((newBotData?.permissions?.length || 0) === 0) {
      showMessage('Please select at least one permission', 'error')
      return
    }

    try {
      const response = await botService.createBot(newBotData)
      if (response?.success) {
        showMessage('Bot created successfully!', 'success')
        setNewBotData({ name: '', description: '', type: 'custom', prefix: '!', permissions: [], avatarUrl: '' })
        setShowCreateModal(false)
        loadBots()
      } else {
        showMessage(response?.error || 'Failed to create bot', 'error')
      }
    } catch (error) {
      console.error('Bot creation error:', error)
      showMessage(error?.message || 'Failed to create bot', 'error')
    }
  }

  const handleDeleteBot = async (botId, botName) => {
    if (!window.confirm(`Delete bot "${botName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await botService.deleteBot(botId)
      if (response?.success) {
        showMessage('Bot deleted successfully', 'success')
        loadBots()
      } else {
        showMessage(response?.error || 'Failed to delete bot', 'error')
      }
    } catch (error) {
      console.error('Bot deletion error:', error)
      showMessage(error?.message || 'Failed to delete bot', 'error')
    }
  }

  const handleRegenerateToken = async (botId, botName) => {
    if (!window.confirm(`Regenerate token for "${botName}"? The old token will stop working immediately.`)) {
      return
    }

    try {
      const response = await botService.regenerateToken(botId)
      if (response?.success) {
        showMessage('Token regenerated successfully', 'success')
        loadBots()
      } else {
        showMessage(response?.error || 'Failed to regenerate token', 'error')
      }
    } catch (error) {
      console.error('Token regeneration error:', error)
      showMessage(error?.message || 'Failed to regenerate token', 'error')
    }
  }

  const handleToggleBot = async (botId, currentStatus) => {
    try {
      const response = await botService.toggleBot(botId, !currentStatus)
      if (response?.success) {
        showMessage(`Bot ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success')
        loadBots()
      } else {
        showMessage(response?.error || 'Failed to toggle bot status', 'error')
      }
    } catch (error) {
      console.error('Bot toggle error:', error)
      showMessage(error?.message || 'Failed to toggle bot status', 'error')
    }
  }

  const viewActivityLogs = async (bot) => {
    setSelectedBot(bot)
    setShowActivityModal(true)
    try {
      const response = await botService.getActivityLogs(bot?.id)
      if (response?.success) {
        setActivityLogs(response?.data || [])
      } else {
        console.error('Failed to load activity logs:', response?.error)
        setActivityLogs([])
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error)
      setActivityLogs([])
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showMessage('Copied to clipboard!', 'success')
    } catch (error) {
      console.error('Clipboard error:', error)
      showMessage(error?.message || 'Failed to copy', 'error')
    }
  }

  const toggleTokenVisibility = (botId) => {
    setVisibleTokens(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }))
  }

  const togglePermission = (permissionId) => {
    setNewBotData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const maskToken = (token) => {
    if (!token) return ''
    return `${token.substring(0, 12)}...${token.substring(token.length - 4)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredBots = (bots || []).filter(bot => {
    const matchesSearch = bot?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         bot?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase())
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && bot?.enabled) ||
                         (filterStatus === 'inactive' && !bot?.enabled)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-rgb(var(--color-neutral-50)) text-secondary p-4 sm:p-6 lg:p-8" role="main" aria-label="Bot management page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-8">
        <div>
          <h1 style={{color: "var(--text-primary)"}} className="text-2xl sm:text-3xl font-bold  mb-2">Bot Management</h1>
          <p className="text-sm sm:text-base text-[#666666]">Manage and configure your automation bots</p>
        </div>
        <button
          style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-4 sm:px-6 py-3 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          onClick={() => setShowCreateModal(true)}
          aria-label="Add new bot"
        >
          <Plus size={20} aria-hidden="true" />
          Add New Bot
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded-2xl  text-sm font-medium z-[1000] animate-slide-in ${
          message?.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
            : 'bg-red-500/20 border border-red-500 text-red-400'
        }`}>
          {message?.text || ''}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:border-blue-500/30 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl shadow-sm bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-[#58a6ff]">
            <Bot size={24} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary leading-none mb-1">{stats.totalBots}</div>
            <div className="text-sm text-secondary font-medium">Total Bots</div>
          </div>
        </div>
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:border-blue-500/30 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl shadow-sm bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-500">
            <Power size={24} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary leading-none mb-1">{stats.activeBots}</div>
            <div className="text-sm text-secondary font-medium">Active Bots</div>
          </div>
        </div>
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:border-blue-500/30 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl shadow-sm bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-500">
            <Command size={24} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary leading-none mb-1">{stats.commandsToday}</div>
            <div className="text-sm text-secondary font-medium">Commands Today</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative min-w-0 sm:min-w-[300px]">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-rgb(var(--color-neutral-400))" />
          <input
            type="text"
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm sm:text-base placeholder:text-rgb(var(--color-neutral-400)) focus:outline-none focus:border-[#58a6ff] transition-all"
            aria-label="Search bots"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              className={`px-4 sm:px-5 py-3 rounded-2xl shadow-sm text-sm font-medium border transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-transparent'
                  : 'bg-white text-secondary border-rgb(var(--color-neutral-200)) hover:text-primary hover:border-[#58a6ff]'
              }`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm">
          <RefreshCw size={48} className="mx-auto mb-4 text-[#58a6ff] " />
          <p className="text-secondary">Loading bots...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm">
          <Bot size={48} className="mx-auto mb-4 text-[#58a6ff]" />
          <h3 className="text-xl text-primary mb-2">Error Loading Bots</h3>
          <p className="text-secondary mb-6">{error || 'An error occurred'}</p>
          <button
            style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            onClick={loadBots}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (filteredBots?.length || 0) === 0 && searchQuery === '' && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm">
          <Bot size={48} className="mx-auto mb-4 text-[#58a6ff]" />
          <h3 className="text-xl text-primary mb-2">No Bots Yet</h3>
          <p className="text-secondary mb-6">Create your first automation bot to get started</p>
          <button
            style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create your first bot"
          >
            <Plus size={16} aria-hidden="true" />
            Create Bot
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && (filteredBots?.length || 0) === 0 && searchQuery !== '' && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm">
          <Search size={48} className="mx-auto mb-4 text-[#58a6ff]" />
          <h3 className="text-xl text-primary mb-2">No Results Found</h3>
          <p className="text-secondary">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Bots Grid */}
      {!loading && !error && (filteredBots?.length || 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {(filteredBots || []).map((bot) => (
            <div key={bot?.id || Math.random()} className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl p-6 hover:border-blue-500/30 hover:shadow-lg transition-all">
              {/* Bot Header */}
              <div className="flex items-start gap-4 pb-4 mb-4 border-b border-rgb(var(--color-neutral-200))">
                <div style={{color: "var(--text-primary)"}} className="w-16 h-16 rounded-2xl shadow-sm bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  flex-shrink-0">
                  {bot?.avatarUrl ? (
                    <img src={bot?.avatarUrl} alt={bot?.name || 'Bot'} className="w-full h-full object-cover rounded-2xl shadow-sm" />
                  ) : (
                    <Bot size={32} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-primary truncate mb-2">{bot?.name || 'Unnamed Bot'}</h3>
                  <div className="inline-block px-3 py-1 bg-[#58a6ff]/20 text-[#58a6ff] rounded-md text-xs font-semibold">
                    {bot?.type || 'Custom Bot'}
                  </div>
                </div>
                <button
                  className={`w-12 h-7 rounded-full relative transition-all flex-shrink-0 ${
                    bot?.enabled ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-rgb(var(--color-neutral-200))'
                  }`}
                  onClick={() => handleToggleBot(bot?.id, bot?.enabled)}
                  aria-label={bot?.enabled ? 'Disable bot' : 'Enable bot'}
                >
                  <div className={`w-[22px] h-[22px] bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                    bot?.enabled ? 'left-[22px]' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              {/* Bot Description */}
              {bot?.description && (
                <p className="text-sm text-secondary leading-relaxed mb-4">{bot?.description}</p>
              )}

              {/* Bot Stats */}
              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-secondary">
                  <Activity size={16} className="text-[#58a6ff] flex-shrink-0" />
                  <span>{bot?.commandsToday || 0} commands today</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-secondary">
                  <Zap size={16} className="text-[#58a6ff] flex-shrink-0" />
                  <span>Prefix: {bot?.prefix || '!'}</span>
                </div>
              </div>

              {/* Bot Token */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-semibold text-secondary uppercase tracking-wider mb-2">API Token</label>
                <div className="bg-rgb(var(--color-neutral-50)) border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-3 flex justify-between items-center gap-3">
                  <code className="font-mono text-xs sm:text-sm text-emerald-600 flex-1 overflow-hidden text-ellipsis">
                    {visibleTokens?.[bot?.id] ? bot?.token : maskToken(bot?.token)}
                  </code>
                  <div className="flex gap-2">
                    <button
                      className="p-1.5 rounded-md hover:bg-rgb(var(--color-neutral-100)) text-secondary hover:text-primary transition-all"
                      onClick={() => toggleTokenVisibility(bot?.id)}
                      aria-label={visibleTokens?.[bot?.id] ? 'Hide token' : 'Show token'}
                    >
                      {visibleTokens?.[bot?.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-rgb(var(--color-neutral-100)) text-secondary hover:text-primary transition-all"
                      onClick={() => copyToClipboard(bot?.token)}
                      aria-label="Copy token"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {bot?.permissions && (bot?.permissions?.length || 0) > 0 ? (
                    <>
                      {(bot?.permissions || []).slice(0, 3).map((perm, idx) => (
                        <span key={idx} className="bg-[#58a6ff]/20 text-[#58a6ff] px-3 py-1.5 rounded-lg text-xs font-medium">
                          {perm}
                        </span>
                      ))}
                      {(bot?.permissions?.length || 0) > 3 && (
                        <span className="bg-[#58a6ff]/20 text-[#58a6ff] px-3 py-1.5 rounded-lg text-xs font-medium">
                          +{(bot?.permissions?.length || 0) - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-secondary text-sm">No permissions</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-rgb(var(--color-neutral-200))">
                <button
                  className="flex-1 bg-rgb(var(--color-neutral-50)) text-secondary border border-rgb(var(--color-neutral-200)) px-3 py-2.5 rounded-2xl shadow-sm text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-rgb(var(--color-neutral-100)) hover:border-[#58a6ff] transition-all"
                  onClick={() => viewActivityLogs(bot)}
                  aria-label={`View activity logs for ${bot?.name || 'bot'}`}
                >
                  <Activity size={16} aria-hidden="true" />
                  Activity
                </button>
                <button
                  className="flex-1 bg-rgb(var(--color-neutral-50)) text-secondary border border-rgb(var(--color-neutral-200)) px-3 py-2.5 rounded-2xl shadow-sm text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-rgb(var(--color-neutral-100)) hover:border-[#58a6ff] transition-all"
                  onClick={() => handleRegenerateToken(bot?.id, bot?.name)}
                  aria-label={`Regenerate token for ${bot?.name || 'bot'}`}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Regenerate
                </button>
                <button
                  className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 rounded-2xl shadow-sm hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                  onClick={() => handleDeleteBot(bot?.id, bot?.name)}
                  aria-label={`Delete ${bot?.name || 'bot'}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 /50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-rgb(var(--color-neutral-200)) flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Create New Bot</h2>
              <button
                className="text-secondary hover:bg-rgb(var(--color-neutral-100)) hover:text-primary w-8 h-8 flex items-center justify-center rounded-lg text-2xl leading-none transition-all"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close create bot modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Bot Name */}
              <div>
                <label className="block font-semibold text-sm text-secondary mb-2">Bot Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 bg-rgb(var(--color-neutral-50)) border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm placeholder:text-rgb(var(--color-neutral-400)) focus:outline-none focus:border-[#58a6ff] transition-all"
                  placeholder="Enter bot name"
                  value={newBotData.name}
                  onChange={(e) => setNewBotData({ ...newBotData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-sm text-secondary mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2.5 bg-rgb(var(--color-neutral-50)) border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm placeholder:text-rgb(var(--color-neutral-400)) focus:outline-none focus:border-[#58a6ff] transition-all resize-vertical min-h-[80px]"
                  rows="3"
                  placeholder="What does this bot do?"
                  value={newBotData.description}
                  onChange={(e) => setNewBotData({ ...newBotData, description: e.target.value })}
                />
              </div>

              {/* Prefix */}
              <div>
                <label className="block font-semibold text-sm text-secondary mb-2">Command Prefix</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 bg-rgb(var(--color-neutral-50)) border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm placeholder:text-rgb(var(--color-neutral-400)) focus:outline-none focus:border-[#58a6ff] transition-all"
                  placeholder="!"
                  value={newBotData.prefix}
                  onChange={(e) => setNewBotData({ ...newBotData, prefix: e.target.value })}
                />
              </div>

              {/* Bot Type */}
              <div>
                <label className="block font-semibold text-sm text-secondary mb-2">Bot Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {botTypes.map((type) => (
                    <label key={type.id} className="flex gap-3 p-4 bg-rgb(var(--color-neutral-50)) border-2 border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm cursor-pointer hover:border-[#58a6ff] hover:bg-rgb(var(--color-neutral-100)) transition-all">
                      <input
                        type="radio"
                        name="botType"
                        value={type.id}
                        checked={newBotData.type === type.id}
                        onChange={(e) => setNewBotData({ ...newBotData, type: e.target.value })}
                        className="mt-1 accent-[#58a6ff]"
                      />
                      <div>
                        <strong className="block text-sm text-primary mb-1">{type.name}</strong>
                        <small className="block text-xs text-secondary leading-relaxed">{type.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block font-semibold text-sm text-secondary mb-2">Permissions *</label>
                <div className="space-y-2.5">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex gap-3 p-3.5 bg-rgb(var(--color-neutral-50)) border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm cursor-pointer hover:bg-rgb(var(--color-neutral-100)) hover:border-[#58a6ff] transition-all">
                      <input
                        type="checkbox"
                        checked={newBotData.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="mt-1 accent-[#58a6ff]"
                      />
                      <div>
                        <strong className="block text-sm text-primary mb-1">{permission.name}</strong>
                        <small className="block text-xs text-secondary">{permission.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-rgb(var(--color-neutral-200)) flex justify-end gap-3">
              <button
                className="px-4 py-2.5 bg-rgb(var(--color-neutral-50)) text-secondary border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm font-medium hover:bg-rgb(var(--color-neutral-100)) transition-all"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                style={{color: "var(--text-primary)"}} className="px-4 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                onClick={handleCreateBot}
              >
                Create Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showActivityModal && (
        <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 /50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setShowActivityModal(false)}>
          <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-rgb(var(--color-neutral-200)) flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Activity Logs - {selectedBot?.name || 'Bot'}</h2>
              <button
                className="text-secondary hover:bg-rgb(var(--color-neutral-100)) hover:text-primary w-8 h-8 flex items-center justify-center rounded-lg text-2xl leading-none transition-all"
                onClick={() => setShowActivityModal(false)}
                aria-label="Close activity modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                {(activityLogs?.length || 0) > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-rgb(var(--color-neutral-200))">
                        <th className="text-left px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Time</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Event</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Details</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activityLogs || []).map((log, idx) => (
                        <tr key={idx} className="border-b border-rgb(var(--color-neutral-200)) hover:bg-rgb(var(--color-neutral-50)) transition-colors">
                          <td className="px-3 py-4 text-secondary text-sm">{formatDate(log?.timestamp)}</td>
                          <td className="px-3 py-4 text-secondary text-sm">{log?.event || 'Activity'}</td>
                          <td className="px-3 py-4 text-secondary text-sm">{log?.message || ''}</td>
                          <td className="px-3 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${
                              log?.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                              log?.status === 'error' ? 'bg-red-500/20 text-red-400' :
                              'bg-[#58a6ff]/20 text-[#58a6ff]'
                            }`}>
                              {log?.status || 'info'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-secondary">
                    <Activity size={32} className="mx-auto mb-4 text-[#58a6ff]" />
                    <p>No activity logs yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-rgb(var(--color-neutral-200)) flex justify-end">
              <button
                className="px-4 py-2.5 bg-rgb(var(--color-neutral-50)) text-secondary border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm font-medium hover:bg-rgb(var(--color-neutral-100)) transition-all"
                onClick={() => setShowActivityModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

BotManagementPage.propTypes = {}

export default BotManagementPage
