import React, { useState, useEffect } from 'react'
import CommunityFeed from './CommunityFeed'
import { Home, TrendingUp, Clock, Star, Users, Plus } from 'lucide-react'
const HomeFeed = ({ user }) => {
  const [feedType, setFeedType] = useState('home') // home, popular, all
  const [sortBy, setSortBy] = useState('hot') // hot, new, top, rising
  const [timeFilter, setTimeFilter] = useState('day') // hour, day, week, month, year, all

  const feedTypes = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      description: 'Posts from communities you\'ve joined'
    },
    {
      id: 'popular',
      name: 'Popular',
      icon: TrendingUp,
      description: 'Trending posts from all communities'
    },
    {
      id: 'all',
      name: 'All',
      icon: Users,
      description: 'All posts from every community'
    }
  ]

  const sortTypes = [
    { id: 'hot', name: 'Hot', icon: TrendingUp, description: 'Rising posts' },
    { id: 'new', name: 'New', icon: Clock, description: 'Newest posts' },
    { id: 'top', name: 'Top', icon: Star, description: 'Highest voted' },
    { id: 'rising', name: 'Rising', icon: TrendingUp, description: 'Quickly gaining votes' }
  ]

  const timeFilters = [
    { id: 'hour', name: 'Hour' },
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'Week' },
    { id: 'month', name: 'Month' },
    { id: 'year', name: 'Year' },
    { id: 'all', name: 'All Time' }
  ]

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6 max-w-screen-2xl mx-auto p-5">
      {/* Header */}
      <div className="col-span-2 bg-card border border-border-primary rounded-xl p-5 mb-4">
        <div className="flex gap-2 mb-4 border-b border-border-primary pb-4">
          {feedTypes.map(type => {
            const IconComponent = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setFeedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-none rounded-lg bg-transparent text-text-secondary text-sm font-medium cursor-pointer transition-all relative hover:bg-hover hover:text-text-primary ${feedType === type.id ? 'bg-accent-primary text-white' : ''}`}
                title={type.description}
              >
                <IconComponent size={18} />
                <span>{type.name}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label>Sort:</label>
            <div className="flex gap-1">
              {sortTypes.map(sort => {
                const SortIcon = sort.icon
                return (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 border border-border-primary rounded-md bg-background-secondary text-text-secondary text-xs font-medium cursor-pointer transition-all hover:bg-hover hover:text-text-primary ${sortBy === sort.id ? 'bg-accent-primary text-white border-accent-primary' : ''}`}
                    title={sort.description}
                  >
                    <SortIcon size={14} />
                    <span>{sort.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Filter - only show for 'top' sort */}
          {sortBy === 'top' && (
            <div className="flex items-center gap-2">
              <label>Time:</label>
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-border-primary rounded-md bg-input text-text-primary text-xs cursor-pointer"
              >
                {timeFilters.map(filter => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Info Bar */}
      {feedType === 'home' && (
        <div className="col-span-2 flex items-center justify-between px-4 py-3 bg-background-secondary border border-border-primary rounded-lg mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-[13px]">
            <Home size={16} />
            <span>
              {user?.joinedCommunities?.length > 0 
                ? `Showing posts from your ${user.joinedCommunities.length} joined communities`
                : 'Join communities to see posts in your home feed'
              }
            </span>
          </div>
          {(!user?.joinedCommunities?.length) && (
            <button className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary text-white border-none rounded-md text-xs font-medium cursor-pointer transition-all hover:bg-accent-secondary hover:-translate-y-0.5">
              <Plus size={14} />
              Browse Communities
            </button>
          )}
        </div>
      )}

      {feedType === 'popular' && (
        <div className="col-span-2 flex items-center justify-between px-4 py-3 bg-background-secondary border border-border-primary rounded-lg mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-[13px]">
            <TrendingUp size={16} />
            <span>Popular posts from communities with high engagement</span>
          </div>
        </div>
      )}

      {feedType === 'all' && (
        <div className="col-span-2 flex items-center justify-between px-4 py-3 bg-background-secondary border border-border-primary rounded-lg mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-[13px]">
            <Users size={16} />
            <span>All posts from every community on CRYB</span>
          </div>
        </div>
      )}

      {/* Community Feed */}
      <div className="min-w-0">
        <CommunityFeed
          feedType={feedType}
          initialSortBy={sortBy}
          initialTimeFilter={timeFilter}
          className="bg-card border border-border-primary rounded-xl p-0 overflow-hidden"
        />
      </div>

      {/* Quick Actions Sidebar */}
      <aside className="flex flex-col gap-5">
        <div className="bg-card border border-border-primary rounded-xl p-5">
          <h3>Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-accent-primary rounded-lg bg-accent-primary text-white text-sm font-medium cursor-pointer transition-all text-center hover:bg-accent-secondary hover:-translate-y-0.5">
              <Plus size={16} />
              Create Post
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border-primary rounded-lg bg-background-secondary text-text-secondary text-sm font-medium cursor-pointer transition-all text-center hover:bg-hover hover:text-text-primary hover:-translate-y-0.5">
              <Users size={16} />
              Browse Communities
            </button>
          </div>
        </div>

        {user?.joinedCommunities?.length > 0 && (
          <div className="bg-card border border-border-primary rounded-xl p-5">
            <h3>Your Communities</h3>
            <div className="flex flex-col gap-2">
              {user.joinedCommunities.slice(0, 5).map(community => (
                <button
                  key={community.id}
                  className="flex items-center gap-3 px-2.5 py-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all text-left hover:bg-hover"
                  onClick={() => {/* Navigate to community */}}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {community.icon ? (
                      <img src={community.icon} alt={community.name} />
                    ) : (
                      <div className="w-full h-full bg-accent-primary text-white flex items-center justify-center font-semibold text-sm">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-text-primary mb-0.5">c/{community.name}</span>
                    <span className="block text-[11px] text-text-secondary">{community.members} members</span>
                  </div>
                </button>
              ))}
              {user.joinedCommunities.length > 5 && (
                <button className="px-3 py-2 bg-transparent border border-dashed border-border-primary rounded-md text-text-secondary text-xs cursor-pointer transition-all text-center hover:bg-hover hover:text-text-primary">
                  View all {user.joinedCommunities.length} communities
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-card border border-border-primary rounded-xl p-5">
          <h3>Trending Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              '#cryptocurrency',
              '#webdevelopment', 
              '#gaming',
              '#digitalart',
              '#music'
            ].map(topic => (
              <button key={topic} className="px-2.5 py-1.5 bg-background-secondary border border-border-primary rounded-2xl text-text-secondary text-[11px] cursor-pointer transition-all hover:bg-accent-primary hover:text-white hover:border-accent-primary">
                {topic}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}




export default HomeFeed