import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Hash, Star, Filter, Search } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

// Helper components
function CommunityCard({ community }) {
  return (
    <Link
      to={`/community/${community.name}`}
      className="block p-5 bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 no-underline text-inherit transition-all hover:border-[#58a6ff]/30"
    >
      <h3 className="text-lg font-semibold text-white mb-2">
        {community.displayName || community.name}
      </h3>
      {community.description && (
        <p className="text-sm text-[#8b949e] mb-3">
          {community.description}
        </p>
      )}
      {community.memberCount !== undefined && (
        <span className="text-[13px] text-[#8b949e]">
          {community.memberCount} members
        </span>
      )}
    </Link>
  )
}

function TagChip({ tag }) {
  return (
    <Link
      to={`/tag/${tag.name}`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#58a6ff]/10 rounded-full no-underline text-[#58a6ff] text-sm font-medium transition-all border border-[#58a6ff]/30 hover:bg-[#58a6ff]/20"
    >
      #{tag.name}
      {tag.postCount !== undefined && (
        <span className="text-xs text-[#8b949e]">
          {tag.postCount}
        </span>
      )}
    </Link>
  )
}

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="block p-5 bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 no-underline text-inherit transition-all hover:border-[#58a6ff]/30"
    >
      <h3 className="text-base font-semibold text-white mb-1">
        {user.displayName || user.username}
      </h3>
      <p className="text-sm text-[#8b949e] mb-2">
        @{user.username}
      </p>
      {user.bio && (
        <p className="text-sm text-[#c9d1d9] mb-2">
          {user.bio}
        </p>
      )}
      {user.followers !== undefined && (
        <span className="text-[13px] text-[#8b949e]">
          {user.followers} followers
        </span>
      )}
    </Link>
  )
}

export default function DiscoverPage() {
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
  const [activeTab, setActiveTab] = useState('trending')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [trendingCommunities, setTrendingCommunities] = useState([])
  const [trendingTags, setTrendingTags] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])

  useEffect(() => {
    fetchDiscoverData()
  }, [activeTab])

  const fetchDiscoverData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/discover?type=${activeTab}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTrendingCommunities(data.communities || [])
        setTrendingTags(data.tags || [])
        setSuggestedUsers(data.users || [])
      }
    } catch (error) {
      console.error('Discover fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'people', label: 'People', icon: Star }
  ]
  return (
    <div
      role="main"
      aria-label="Discover page"
      className="min-h-screen bg-[#0d1117] pt-20"
    >
      <div className={`max-w-[1200px] mx-auto ${isMobile ? 'px-3' : 'px-4'} py-8`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-2`}>
            Discover
          </h1>
          <p className="text-base text-[#8b949e] leading-relaxed">
            Explore trending communities, topics, and people
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-8">
          <Search
            size={20}
            aria-hidden="true"
            className={`absolute ${isMobile ? 'left-3' : 'left-4'} top-1/2 -translate-y-1/2 text-[#8b949e]`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, tags, or people..."
            className={`w-full ${isMobile ? 'py-3 px-3' : 'py-3.5 px-4'} pl-12 text-base border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] outline-none transition-all bg-[#161b22]/60 backdrop-blur-xl text-white focus:border-[#58a6ff]`}
            aria-label="Search discover page"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 ${isMobile ? 'py-2.5 px-3' : 'py-3 px-5'} bg-transparent border-none ${activeTab === tab.id ? 'border-b-2 border-[#58a6ff] text-[#58a6ff]' : 'border-b-2 border-transparent text-[#8b949e]'} text-sm font-semibold cursor-pointer -mb-px transition-all whitespace-nowrap`}
                aria-label={`View ${tab.label}`}
                aria-pressed={activeTab === tab.id}
              >
                <Icon size={18} aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {!isLoading && (
          <>
            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div className="flex flex-col gap-8">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Trending Communities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingCommunities.slice(0, 6).map((community, index) => (
                      <CommunityCard key={community.id || index} community={community} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Trending Tags
                  </h2>
                  <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
                    {trendingTags.slice(0, 12).map((tag, index) => (
                      <TagChip key={tag.name || index} tag={tag} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingCommunities.map((community, index) => (
                  <CommunityCard key={community.id || index} community={community} />
                ))}
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
                {trendingTags.map((tag, index) => (
                  <TagChip key={tag.name || index} tag={tag} />
                ))}
              </div>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedUsers.map((user, index) => (
                  <UserCard key={user.id || index} user={user} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {((activeTab === 'communities' && trendingCommunities.length === 0) ||
              (activeTab === 'tags' && trendingTags.length === 0) ||
              (activeTab === 'people' && suggestedUsers.length === 0)) && (
              <div
                role="status"
                aria-live="polite"
                className={`text-center ${isMobile ? 'py-12 px-3' : 'py-16 px-5'} bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10`}
              >
                <Filter size={48} color="#8b949e" aria-hidden="true" className="mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No results found
                </h3>
                <p className="text-sm text-[#8b949e]">
                  Try adjusting your search or check back later
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


