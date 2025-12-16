import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { Link } from 'react-router-dom'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function ActivityFeedPage() {
  const { user: currentUser } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, friends, following

  useEffect(() => {
    loadActivityFeed()
  }, [filter])

  const loadActivityFeed = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('filter', filter)
      }

      const response = await apiService.get(`/activity/feed?${params}`)

      if (response.success && response.data) {
        setActivities(response.data.activities || response.data || [])
      } else {
        setActivities([])
      }
    } catch (error) {
      console.error('Error loading activity feed:', error)
      setError('Failed to load activity feed. Please try again.')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'post_created':
        return (
          <div aria-hidden="true" className="w-8 h-8 bg-primary-trust rounded-lg flex items-center justify-center">
            <svg aria-hidden="true" style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        )
      case 'comment_created':
        return (
          <div className="w-8 h-8 bg-accent-cyan rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
        )
      case 'post_liked':
        return (
          <div className="w-8 h-8 bg-error rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        )
      case 'user_followed':
        return (
          <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM2 16v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            </svg>
          </div>
        )
      case 'community_joined':
        return (
          <div className="w-8 h-8 bg-warning rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        )
      case 'achievement_earned':
        return (
          <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
            </svg>
          </div>
        )
      case 'friend_added':
        return (
          <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
            <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM20 22h2v2h-2v-2zM8 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-rgb(var(--color-neutral-200)) rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-rgb(var(--color-neutral-600))" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return time.toLocaleDateString()
    }
  }

  const renderActivityContent = (activity) => {
    switch (activity.type) {
      case 'post_created':
        return (
          <div>
            <p style={{color: "var(--text-primary)"}} className="">
              <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
                {activity.displayName}
              </Link>{' '}
              <span className="text-rgb(var(--color-neutral-600))">created a new post</span>
            </p>
            {activity.content && (
              <div className="mt-2 p-3 bg-rgb(var(--color-neutral-200)) rounded-lg border border-rgb(var(--color-neutral-300))">
                <h4 style={{color: "var(--text-primary)"}} className="font-medium ">{activity.content.title}</h4>
                {activity.content.excerpt && (
                  <p className="text-rgb(var(--color-neutral-600)) text-sm mt-1">{activity.content.excerpt}</p>
                )}
              </div>
            )}
          </div>
        )
      
      case 'comment_created':
        return (
          <div>
            <p style={{color: "var(--text-primary)"}} className="">
              <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
                {activity.displayName}
              </Link>{' '}
              <span className="text-rgb(var(--color-neutral-600))">commented on a post</span>
            </p>
            {activity.content && (
              <div className="mt-2 p-3 bg-rgb(var(--color-neutral-200)) rounded-lg border border-rgb(var(--color-neutral-300))">
                <p style={{color: "var(--text-primary)"}} className="">{activity.content.comment}</p>
              </div>
            )}
          </div>
        )
      
      case 'post_liked':
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">liked a post: "</span>
            <span style={{color: "var(--text-primary)"}} className="">{activity.content?.title || 'Untitled'}</span>
            <span className="text-rgb(var(--color-neutral-600))">"</span>
          </p>
        )
      
      case 'user_followed':
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">started following </span>
            <Link to={`/user/${activity.content?.targetUsername}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.content?.targetName}
            </Link>
          </p>
        )
      
      case 'community_joined':
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">joined the </span>
            <Link to={`/c/${activity.content?.communityName}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.content?.communityName}
            </Link>
            <span className="text-rgb(var(--color-neutral-600))"> community</span>
          </p>
        )
      
      case 'achievement_earned':
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">earned the "</span>
            <span className="text-success font-medium">{activity.content?.badgeName}</span>
            <span className="text-rgb(var(--color-neutral-600))">" achievement</span>
          </p>
        )
      
      case 'friend_added':
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">and </span>
            <Link to={`/user/${activity.content?.friendUsername}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.content?.friendName}
            </Link>
            <span className="text-rgb(var(--color-neutral-600))"> are now friends</span>
          </p>
        )
      
      default:
        return (
          <p style={{color: "var(--text-primary)"}} className="">
            <Link to={`/user/${activity.username}`} className="font-semibold text-rgb(var(--color-primary-500)) hover:text-accent-cyan transition-colors">
              {activity.displayName}
            </Link>{' '}
            <span className="text-rgb(var(--color-neutral-600))">{activity.content?.message || 'had some activity'}</span>
          </p>
        )
    }
  }

  if (error) {
    return (
      <div role="main" aria-label="Activity feed page" className="container py-fluid-lg">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card" role="alert" aria-live="polite">
            <div className="text-error mb-4" aria-hidden="true">
              <svg aria-hidden="true" className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2 style={{color: "var(--text-primary)"}} className="text-xl font-bold  mb-2">Error Loading Activity Feed</h2>
            <p className="text-rgb(var(--color-neutral-600)) mb-6">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <button
              onClick={loadActivityFeed}
              className="btn btn-primary"
              aria-label="Retry loading activity feed"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen  py-8 px-4" role="main" aria-label="Activity feed page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 style={{color: "var(--text-primary)"}} className="text-3xl font-bold  mb-2">Activity Feed</h1>
          <p style={{color: "var(--text-secondary)"}} className="">Stay updated with what your friends and followed users are up to</p>
        </div>

        {/* Filter Tabs */}
        <div style={{borderColor: "var(--border-subtle)"}} className="border-b  mb-6">
          <nav className="flex gap-6" role="navigation" aria-label="Activity filter">
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'friends', label: 'Friends' },
              { id: 'following', label: 'Following' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.id
                    ? 'border-[#58a6ff] text-[#58a6ff]'
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-white/10'
                }`}
                aria-pressed={filter === tab.id}
                aria-label={`Show ${tab.label.toLowerCase()} activity`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-6 ">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#21262d] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#21262d] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#21262d] rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} style={{borderColor: "var(--border-subtle)"}} className="card   border border-white/10 rounded-2xl  p-6 hover: transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Link to={`/user/${activity.username}`} className="block">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7] shadow-lg">
                        <span style={{color: "var(--text-primary)"}} className=" font-bold text-lg">{activity.avatar}</span>
                      </div>
                    </Link>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getActivityIcon(activity.type)}
                      <span style={{color: "var(--text-secondary)"}} className="text-sm ">{formatTimeAgo(activity.timestamp)}</span>
                    </div>

                    {renderActivityContent(activity)}

                    {/* Engagement */}
                    <div className="flex items-center gap-4 mt-4">
                      <button style={{color: "var(--text-secondary)"}} className="flex items-center gap-2 text-sm  hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        Like
                      </button>
                      <button style={{color: "var(--text-secondary)"}} className="flex items-center gap-2 text-sm  hover:text-[#58a6ff] transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        Comment
                      </button>
                      <button style={{color: "var(--text-secondary)"}} className="flex items-center gap-2 text-sm  hover:text-green-400 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg style={{color: "var(--text-secondary)"}} className="mx-auto h-16 w-16 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
            </div>
            <h3 style={{color: "var(--text-primary)"}} className="text-xl font-bold  mb-2">No activity yet</h3>
            <p style={{color: "var(--text-secondary)"}} className=" mb-6 max-w-md mx-auto">
              {filter === 'friends'
                ? "Your friends haven't been active recently"
                : filter === 'following'
                ? "Users you follow haven't been active recently"
                : "Start following users and making friends to see their activity"}
            </p>
            <div className="flex gap-3 justify-center">
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{borderColor: "var(--border-subtle)"}} className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border  rounded-lg  font-medium transition-all"
                >
                  View All Activity
                </button>
              )}
              {filter === 'all' && (
                <Link
                  to="/users"
                  style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 rounded-lg  font-medium transition-all"
                >
                  Discover Users
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Load More */}
        {activities.length > 0 && activities.length % 10 === 0 && (
          <div className="text-center mt-8">
            <button style={{borderColor: "var(--border-subtle)"}} className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] border  rounded-2xl   font-medium transition-all">
              Load More Activity
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeedPage
