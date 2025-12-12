import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../../utils/errorUtils";
import { Search, Users, TrendingUp, Filter, Grid, List, Star } from 'lucide-react'
import CommunityCard from './CommunityCard'
const CommunityBrowser = () => {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('trending') // trending, members, new, name
  const [category, setCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [showFilters, setShowFilters] = useState(false)

  // Mock categories - in real app these would come from API
  const categories = [
    { id: 'all', name: 'All Communities', icon: Grid },
    { id: 'crypto', name: 'Crypto & Finance', icon: TrendingUp },
    { id: 'gaming', name: 'Gaming', icon: Users },
    { id: 'tech', name: 'Technology', icon: Star },
    { id: 'art', name: 'Art & Design', icon: Users },
    { id: 'music', name: 'Music', icon: Users },
    { id: 'sports', name: 'Sports', icon: Users },
    { id: 'science', name: 'Science', icon: Users }
  ]

  // Mock community data - in real app this would come from API
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCommunities = [
        {
          id: 'crypto-trading',
          name: 'CryptoTrading',
          displayName: 'Crypto Trading Hub',
          description: 'Professional cryptocurrency trading discussions, market analysis, and investment strategies.',
          members: 45892,
          category: 'crypto',
          isVerified: true,
          isJoined: false,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: true,
          growthRate: 12.5,
          posts24h: 234,
          tags: ['trading', 'crypto', 'bitcoin', 'ethereum']
        },
        {
          id: 'web3-development',
          name: 'Web3Development',
          displayName: 'Web3 Development',
          description: 'Everything about building on blockchain - smart contracts, dApps, and Web3 infrastructure.',
          members: 23456,
          category: 'tech',
          isVerified: true,
          isJoined: true,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: true,
          growthRate: 8.3,
          posts24h: 89,
          tags: ['web3', 'blockchain', 'solidity', 'ethereum']
        },
        {
          id: 'gaming-lounge',
          name: 'GamingLounge',
          displayName: 'Gaming Lounge',
          description: 'Share your gaming experiences, find teammates, discuss the latest releases and gaming news.',
          members: 78234,
          category: 'gaming',
          isVerified: false,
          isJoined: false,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: false,
          growthRate: 5.2,
          posts24h: 145,
          tags: ['gaming', 'esports', 'streaming']
        },
        {
          id: 'digital-art',
          name: 'DigitalArt',
          displayName: 'Digital Art Community',
          description: 'Showcase your digital artwork, get feedback, learn techniques, and connect with artists.',
          members: 34567,
          category: 'art',
          isVerified: true,
          isJoined: false,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: true,
          growthRate: 15.7,
          posts24h: 67,
          tags: ['art', 'digital', 'design', 'nft']
        },
        {
          id: 'music-producers',
          name: 'MusicProducers',
          displayName: 'Music Production Hub',
          description: 'For music producers, beatmakers, and audio engineers. Share beats, collaborate, get feedback.',
          members: 19876,
          category: 'music',
          isVerified: false,
          isJoined: true,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: false,
          growthRate: 3.4,
          posts24h: 45,
          tags: ['music', 'production', 'beats', 'audio']
        },
        {
          id: 'space-exploration',
          name: 'SpaceExploration',
          displayName: 'Space & Astronomy',
          description: 'Discuss space exploration, astronomy, astrophysics, and the latest discoveries from the cosmos.',
          members: 52341,
          category: 'science',
          isVerified: true,
          isJoined: false,
          banner: '/api/placeholder/400/200',
          icon: '/api/placeholder/64/64',
          trending: true,
          growthRate: 7.8,
          posts24h: 78,
          tags: ['space', 'astronomy', 'nasa', 'science']
        }
      ]

      setCommunities(mockCommunities)
      setLoading(false)
    }

    fetchCommunities()
  }, [])

  // Filter and sort communities
  const filteredCommunities = communities
    .filter(community => {
      const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = category === 'all' || community.category === category
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          if (a.trending && !b.trending) return -1
          if (!a.trending && b.trending) return 1
          return b.growthRate - a.growthRate
        case 'members':
          return b.members - a.members
        case 'new':
          return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const handleJoinCommunity = async (communityId) => {
    try {
      // In real app, make API call to join community
      setCommunities(prev => prev.map(community =>
        community.id === communityId
          ? { ...community, isJoined: !community.isJoined, members: community.members + (community.isJoined ? -1 : 1) }
          : community
      ))
    } catch (error) {
      console.error('Failed to join community:', error)
    }
  }

  const getSortIcon = (sort) => {
    switch (sort) {
      case 'trending': return TrendingUp
      case 'members': return Users
      case 'new': return Clock
      case 'name': return Filter
      default: return Filter
    }
  }

  if (loading) {
    return (
      <div className="community-browser">
        <div className="community-browser-header">
          <h1>Discover Communities</h1>
          <div className="skeleton-loader">
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-button"></div>
          </div>
        </div>
        
        <div className="community-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="community-card-skeleton">
              <div className="skeleton skeleton-banner"></div>
              <div className="skeleton skeleton-avatar"></div>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="community-browser">
      {/* Header */}
      <div className="community-browser-header">
        <div className="header-main">
          <h1>Discover Communities</h1>
          <p className="subtitle">Find and join communities that match your interests</p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="view-controls">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`control-btn ${showFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`control-btn ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`control-btn ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-section">
            <div className="filter-group">
              <label>Category:</label>
              <div className="category-pills">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`category-pill ${category === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  >
                    <cat.icon size={16} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <div className="sort-pills">
                {[
                  { id: 'trending', name: 'Trending' },
                  { id: 'members', name: 'Most Members' },
                  { id: 'new', name: 'Newest' },
                  { id: 'name', name: 'Name' }
                ].map(sort => {
                  const SortIcon = getSortIcon(sort.id)
                  return (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id)}
                      className={`sort-pill ${sortBy === sort.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                    >
                      <SortIcon size={16} />
                      {sort.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="browse-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredCommunities.length}</span>
          <span className="stat-label">Communities Found</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredCommunities.filter(c => c.trending).length}</span>
          <span className="stat-label">Trending</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredCommunities.filter(c => c.isJoined).length}</span>
          <span className="stat-label">Joined</span>
        </div>
      </div>

        {/* Section Tabs */}
        <div className="section-tabs">
          <button
            onClick={() => setActiveSection('all')}
            className={`section-tab ${activeSection === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Globe size={16} />
            All Communities
          </button>
          <button
            onClick={() => setActiveSection('featured')}
            className={`section-tab ${activeSection === 'featured' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Star size={16} />
            Featured
          </button>
          <button
            onClick={() => setActiveSection('recommended')}
            className={`section-tab ${activeSection === 'recommended' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Bookmark size={16} />
            Recommended
          </button>
        </div>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <div className="trending-topics">
            <h4>Trending Topics</h4>
            <div className="topics-list">
              {trendingTopics.slice(0, 10).map((topic, index) => (
                <button
                  key={index}
                  className="topic-tag"
                  onClick={() => setSearchQuery(topic.name)}
                >
                  #{topic.name}
                  <span className="topic-count">+{topic.growth}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Communities Grid/List */}
        <div className={`communities-container ${viewMode}`}>
          {displayCommunities.length > 0 ? (
            <>
              {displayCommunities.map(community => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onJoin={handleJoinCommunity}
                  viewMode={viewMode}
                />
              ))}
              
              {/* Load More Button */}
              {activeSection === 'all' && pagination.hasMore && (
                <div className="load-more-container">
                  <button 
                    className="load-more-btn"
                    onClick={loadMoreCommunities}
                    disabled={loading}
                  >
                    {loading ? '' : 'Load More Communities'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <Search size={48} />
              <h3>No communities found</h3>
              <p>Try adjusting your search terms or filters</p>
              <button 
                className="create-community-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create a Community
              </button>
            </div>
          )}
        </div>

        {/* Create Community FAB */}
        <button 
          className="create-fab"
          onClick={() => setShowCreateModal(true)}
          title="Create Community"
        >
          <Plus size={24} />
        </button>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <button onClick={() => loadCommunities(true)}>Retry</button>
          </div>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <CreateCommunity
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCommunity}
          />
        )}
    </div>
  )
}



export default CommunityBrowser