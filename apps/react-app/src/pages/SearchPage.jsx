import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Search, Users, FileText, Hash } from 'lucide-react'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import userService from '../services/userService'
import CommunityCard from '../components/community/CommunityCard'
import Post from '../components/community/Post'
import UserProfile from '../components/community/UserProfile'
import LoadingSpinner from '../components/community/LoadingSpinner'
import ReportingSystem from '../components/ReportingSystem'
import AwardModal from '../components/community/AwardModal'
import { useToast } from '../contexts/ToastContext'
import { SkeletonPost, SkeletonCard } from '../components/ui/SkeletonLoader'
import { EmptySearch } from '../components/ui/EmptyState'
import { SearchHighlight } from '../components/ui'
import { useResponsive } from '../hooks/useResponsive'

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function SearchPage() {
  const { isMobile, isTablet } = useResponsive()
  const location = useLocation()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [results, setResults] = useState({ communities: [], posts: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')

  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 500)

  // Modal states
  const [reportModal, setReportModal] = useState({ isOpen: false, contentType: null, contentId: null, contentData: null })
  const [awardModal, setAwardModal] = useState({ isOpen: false, post: null })

  // Cache for search results to avoid duplicate requests
  const searchCacheRef = useRef(new Map())

  // Standard responsive values
  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const searchQuery = urlParams.get('q')

    if (searchQuery && searchQuery !== query) {
      setQuery(searchQuery)
    }
  }, [location.search])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery, activeTab])

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return

    // Check cache first
    const cacheKey = `${searchQuery}-${activeTab}`
    if (searchCacheRef.current.has(cacheKey)) {
      setResults(searchCacheRef.current.get(cacheKey))
      return
    }

    setLoading(true)
    try {
      const searchResults = await communityService.searchAll(searchQuery.trim(), {
        type: activeTab,
        limit: 50
      })
      setResults(searchResults)

      // Cache results
      searchCacheRef.current.set(cacheKey, searchResults)

      // Clear old cache entries if too many
      if (searchCacheRef.current.size > 20) {
        const firstKey = searchCacheRef.current.keys().next().value
        searchCacheRef.current.delete(firstKey)
      }
    } catch (error) {
      console.error('Search failed:', error)
      showError('Failed to search. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    if (query) {
      performSearch(query)
    }
  }, [query, performSearch])

  const handleCommunityJoin = useCallback(async (communityName) => {
    try {
      await communityService.joinCommunity(communityName)
      // Update results
      setResults(prev => ({
        ...prev,
        communities: prev?.communities?.map(community =>
          community?.name === communityName
            ? { ...community, isJoined: true, memberCount: (community?.memberCount || 0) + 1 }
            : community
        ) || []
      }))
    } catch (error) {
      console.error('Failed to join community:', error)
      showError('Failed to join community. Please try again.')
    }
  }, [])

  const handleCommunityLeave = useCallback(async (communityName) => {
    try {
      await communityService.leaveCommunity(communityName)
      // Update results
      setResults(prev => ({
        ...prev,
        communities: prev?.communities?.map(community =>
          community?.name === communityName
            ? { ...community, isJoined: false, memberCount: Math.max(0, (community?.memberCount || 0) - 1) }
            : community
        ) || []
      }))
    } catch (error) {
      console.error('Failed to leave community:', error)
      showError('Failed to leave community. Please try again.')
    }
  }, [])

  const handlePostVote = useCallback(async (postId, voteType, newVote) => {
    try {
      await communityService.voteOnPost(postId, voteType, newVote)
      // Update results
      setResults(prev => ({
        ...prev,
        posts: prev?.posts?.map(post =>
          post?.id === postId
            ? { ...post, userVote: newVote, score: (post?.score || 0) + (newVote === 'upvote' ? 1 : -1) }
            : post
        ) || []
      }))
    } catch (error) {
      console.error('Vote failed:', error)
      showError('Failed to vote. Please try again.')
    }
  }, [])

  const handlePostShare = useCallback(async (postId) => {
    try {
      const post = results?.posts?.find(p => p?.id === postId)
      if (!post) return

      const shareUrl = `${window.location.origin}/c/${post?.community}/posts/${postId}`

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: post?.title || 'Post',
          text: post?.content ? `${post?.title}\n\n${post?.content.substring(0, 100)}...` : post?.title,
          url: shareUrl
        })
        showSuccess('Post shared successfully')
      } else {
        // Fallback to copying link to clipboard
        await navigator.clipboard.writeText(shareUrl)
        showSuccess('Link copied to clipboard')
      }
    } catch (error) {
      // User cancelled share or copy failed
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error)
        showError('Failed to share post')
      }
    }
  }, [results?.posts, showSuccess, showError])

  const handlePostSave = useCallback(async (postId) => {
    try {
      const post = results?.posts?.find(p => p?.id === postId)
      if (!post) return

      const newSavedStatus = !post?.isSaved

      // Optimistic update
      setResults(prev => ({
        ...prev,
        posts: prev?.posts?.map(p =>
          p?.id === postId
            ? { ...p, isSaved: newSavedStatus }
            : p
        ) || []
      }))

      await postsService.savePost(postId, newSavedStatus)
      showSuccess(newSavedStatus ? 'Post saved' : 'Post unsaved')
    } catch (error) {
      console.error('Save post failed:', error)

      // Revert optimistic update on error
      setResults(prev => ({
        ...prev,
        posts: prev?.posts?.map(p =>
          p?.id === postId
            ? { ...p, isSaved: !p?.isSaved }
            : p
        ) || []
      }))

      showError('Failed to save post')
    }
  }, [results?.posts, showSuccess, showError])

  const handlePostReport = useCallback((postId) => {
    const post = results?.posts?.find(p => p?.id === postId)
    if (!post) return

    setReportModal({
      isOpen: true,
      contentType: 'post',
      contentId: postId,
      contentData: {
        author: post?.author,
        text: (post?.title || '') + (post?.content ? `\n\n${post?.content}` : ''),
        image: post?.imageUrl || post?.media?.url
      }
    })
  }, [results?.posts])

  const handleReportSubmit = useCallback(async (reportData) => {
    try {
      await postsService.reportPost(reportData.contentId, {
        category: reportData.category,
        reason: reportData.reason,
        details: reportData.details
      })
      showSuccess('Report submitted successfully')
      setReportModal({ isOpen: false, contentType: null, contentId: null, contentData: null })
    } catch (error) {
      console.error('Report submission failed:', error)
      showError('Failed to submit report')
    }
  }, [showSuccess, showError])

  const handlePostAward = useCallback((postId) => {
    const post = results?.posts?.find(p => p?.id === postId)
    if (!post) return

    setAwardModal({
      isOpen: true,
      post: post
    })
  }, [results?.posts])

  const handleAwardSubmit = useCallback(async (postId, awardId) => {
    try {
      // Award API call would go here
      // await postsService.awardPost(postId, awardId)

      showSuccess('Award given successfully!')
      setAwardModal({ isOpen: false, post: null })

      // Update post awards count if needed
      setResults(prev => ({
        ...prev,
        posts: prev?.posts?.map(p =>
          p?.id === postId
            ? { ...p, awardCount: (p?.awardCount || 0) + 1 }
            : p
        ) || []
      }))
    } catch (error) {
      console.error('Award submission failed:', error)
      showError('Failed to give award')
    }
  }, [showSuccess, showError])

  const handleUserFollow = useCallback(async (username) => {
    try {
      // Optimistic update
      setResults(prev => ({
        ...prev,
        users: prev?.users?.map(u =>
          u?.username === username
            ? { ...u, isFollowing: true, followerCount: (u?.followerCount || 0) + 1 }
            : u
        ) || []
      }))

      await userService.followUser(username)
      showSuccess(`Following u/${username}`)
    } catch (error) {
      console.error('Follow user failed:', error)

      // Revert optimistic update on error
      setResults(prev => ({
        ...prev,
        users: prev?.users?.map(u =>
          u?.username === username
            ? { ...u, isFollowing: false, followerCount: Math.max(0, (u?.followerCount || 0) - 1) }
            : u
        ) || []
      }))

      showError('Failed to follow user')
    }
  }, [showSuccess, showError])

  const handleUserUnfollow = useCallback(async (username) => {
    try {
      // Optimistic update
      setResults(prev => ({
        ...prev,
        users: prev?.users?.map(u =>
          u?.username === username
            ? { ...u, isFollowing: false, followerCount: Math.max(0, (u?.followerCount || 0) - 1) }
            : u
        ) || []
      }))

      await userService.unfollowUser(username)
      showSuccess(`Unfollowed u/${username}`)
    } catch (error) {
      console.error('Unfollow user failed:', error)

      // Revert optimistic update on error
      setResults(prev => ({
        ...prev,
        users: prev?.users?.map(u =>
          u?.username === username
            ? { ...u, isFollowing: true, followerCount: (u?.followerCount || 0) + 1 }
            : u
        ) || []
      }))

      showError('Failed to unfollow user')
    }
  }, [showSuccess, showError])

  const handleUserMessage = useCallback((username) => {
    try {
      const user = results?.users?.find(u => u?.username === username)
      if (!user) return

      // Navigate to messages page with user ID
      navigate(`/messages/${user?.id || username}`)
    } catch (error) {
      console.error('Navigate to messages failed:', error)
      showError('Failed to open messages')
    }
  }, [results?.users, navigate, showError])

  // Memoize tabs with counts
  const tabs = useMemo(() => {
    const iconMap = {
      all: Hash,
      communities: Hash,
      posts: FileText,
      users: Users
    }

    return [
      { id: 'all', label: 'All', icon: iconMap.all, count: (results?.communities?.length || 0) + (results?.posts?.length || 0) + (results?.users?.length || 0) },
      { id: 'communities', label: 'Communities', icon: iconMap.communities, count: results?.communities?.length || 0 },
      { id: 'posts', label: 'Posts', icon: iconMap.posts, count: results?.posts?.length || 0 },
      { id: 'users', label: 'Users', icon: iconMap.users, count: results?.users?.length || 0 }
    ]
  }, [results])

  // Memoize total result count
  const totalResults = useMemo(() =>
    (results?.communities?.length || 0) + (results?.posts?.length || 0) + (results?.users?.length || 0),
    [results]
  )

  // Memoize filtered results based on active tab
  const filteredResults = useMemo(() => {
    return {
      communities: activeTab === 'all' || activeTab === 'communities' ? (results?.communities || []) : [],
      posts: activeTab === 'all' || activeTab === 'posts' ? (results?.posts || []) : [],
      users: activeTab === 'all' || activeTab === 'users' ? (results?.users || []) : []
    }
  }, [results, activeTab])

  // Memoized components
  const MemoizedCommunityCard = useMemo(() => memo(CommunityCard), [])
  const MemoizedPost = useMemo(() => memo(Post), [])
  const MemoizedUserProfile = useMemo(() => memo(UserProfile), [])

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          input[type="text"]::placeholder {
            color: var(--text-tertiary);
            opacity: 1;
          }

          input[type="text"]:focus::placeholder {
            color: var(--text-muted);
          }
        `}
      </style>
      <div
        role="main"
        aria-label="Search page"
        style={{
          paddingTop: headerOffset,
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: '48px',
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: '100vh',
          background: 'var(--bg-primary)'
        }}
      >
        {/* Search Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 'bold',
            marginBottom: '24px',
            background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'var(--text-primary)'
          }}>
            Search
          </h1>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            {/* Search Icon */}
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                flexShrink: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Search
                style={{ width: '24px', height: '24px', flexShrink: 0, color: 'var(--text-tertiary)' }}
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for communities, posts, or users..."
              aria-label="Search input"
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '16px',
                lineHeight: '1.5',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-primary)',
            marginBottom: '32px',
            paddingBottom: '8px'
          }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-label={`${tab.label} tab`}
                  aria-selected={isActive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    background: isActive ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'var(--bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: '24px', height: '24px', flexShrink: 0 }} aria-hidden="true" />
                  </div>
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-secondary)',
                      color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontWeight: '600'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Results Count */}
          {query && (
            <div style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {totalResults > 0 ? (
                <p>{totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
              ) : !loading && (
                <p>No results found for &ldquo;{query}&rdquo;</p>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <LoadingSpinner />
          </div>
        )}

        {/* Results */}
        {!query ? (
          <EmptySearch />
        ) : !loading && totalResults === 0 ? (
          <EmptySearch query={query} />
        ) : !loading && (
          <>
            {/* Communities */}
            {filteredResults?.communities?.length > 0 && (
              <section style={{ marginBottom: '48px' }} aria-labelledby="communities-heading">
                <h2 id="communities-heading" style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--text-primary)',
                  gap: '16px'
                }}>
                  Communities
                  <span style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'var(--text-inverse)'
                  }}>
                    {filteredResults?.communities?.length || 0}
                  </span>
                </h2>
                <div style={{
                  display: 'grid',
                  gap: '24px',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
                }}>
                  {filteredResults?.communities?.map(community => (
                    <MemoizedCommunityCard
                      key={community?.id || community?.name}
                      community={community}
                      onJoin={() => handleCommunityJoin(community?.name)}
                      onLeave={() => handleCommunityLeave(community?.name)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {filteredResults?.posts?.length > 0 && (
              <section style={{ marginBottom: '48px' }} aria-labelledby="posts-heading">
                <h2 id="posts-heading" style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--text-primary)',
                  gap: '16px'
                }}>
                  Posts
                  <span style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'var(--text-inverse)'
                  }}>
                    {filteredResults?.posts?.length || 0}
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {filteredResults?.posts?.map(post => (
                    <MemoizedPost
                      key={post?.id}
                      post={post}
                      onVote={(voteType, newVote) => handlePostVote(post?.id, voteType, newVote)}
                      onShare={() => handlePostShare(post?.id)}
                      onSave={() => handlePostSave(post?.id)}
                      onReport={() => handlePostReport(post?.id)}
                      onAward={() => handlePostAward(post?.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Users */}
            {filteredResults?.users?.length > 0 && (
              <section style={{ marginBottom: '48px' }} aria-labelledby="users-heading">
                <h2 id="users-heading" style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--text-primary)',
                  gap: '16px'
                }}>
                  Users
                  <span style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'var(--text-inverse)'
                  }}>
                    {filteredResults?.users?.length || 0}
                  </span>
                </h2>
                <div style={{
                  display: 'grid',
                  gap: '24px',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'
                }}>
                  {filteredResults?.users?.map(user => (
                    <MemoizedUserProfile
                      key={user?.id || user?.username}
                      user={user}
                      onFollow={() => handleUserFollow(user?.username)}
                      onUnfollow={() => handleUserUnfollow(user?.username)}
                      onMessage={() => handleUserMessage(user?.username)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Modals */}
        {reportModal.isOpen && (
          <ReportingSystem
            isOpen={reportModal.isOpen}
            onClose={() => setReportModal({ isOpen: false, contentType: null, contentId: null, contentData: null })}
            contentType={reportModal.contentType}
            contentId={reportModal.contentId}
            contentData={reportModal.contentData}
            onSubmit={handleReportSubmit}
          />
        )}

        {awardModal.isOpen && (
          <AwardModal
            isOpen={awardModal.isOpen}
            onClose={() => setAwardModal({ isOpen: false, post: null })}
            post={awardModal.post}
            onAward={handleAwardSubmit}
          />
        )}
      </div>
    </>
  )
}

SearchPage.propTypes = {}

export default SearchPage
