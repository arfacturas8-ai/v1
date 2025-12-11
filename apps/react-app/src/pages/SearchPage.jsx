import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import { useLocation, Link, useNavigate } from 'react-router-dom'
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

  // POST ACTION HANDLERS

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

  // USER ACTION HANDLERS

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
  const tabs = useMemo(() => [
    { id: 'all', label: 'All', count: (results?.communities?.length || 0) + (results?.posts?.length || 0) + (results?.users?.length || 0) },
    { id: 'communities', label: 'Communities', count: results?.communities?.length || 0 },
    { id: 'posts', label: 'Posts', count: results?.posts?.length || 0 },
    { id: 'users', label: 'Users', count: results?.users?.length || 0 }
  ], [results])

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
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          input[type="text"]::placeholder {
            color: #666666;
            opacity: 1;
          }

          input[type="text"]:focus::placeholder {
            color: #6e7681;
          }
        `}
      </style>
      <div
        role="main"
        aria-label="Search page"
        style={{
          padding: isMobile ? '12px' : '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: '100vh',
          backgroundColor: '#0D0D0D'
        }}
      >
      {/* Search Header */}
      <div style={{ marginBottom: `${spacing.xl}px` }}>
        <h1 style={{
          fontSize: `${fontSize['3xl']}px`,
          fontWeight: 'bold',
          marginBottom: `${spacing.md}px`,
          background: 'linear-gradient(to right, #58a6ff, #a371f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Search
        </h1>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: `${spacing.lg}px` }}>
          {/* Search Icon */}
          <svg
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#666666',
              pointerEvents: 'none'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for communities, posts, or users..."
            aria-label="Search input"
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px 10px 44px' : '12px 16px 12px 48px',
              fontSize: `${fontSize.base}px`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backgroundColor: '#0D0D0D',
              color: '#ffffff',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(88, 166, 255, 0.3)'
              e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '4px' : '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: `${spacing.lg}px`
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              aria-label={`${tab.label} tab`}
              aria-selected={activeTab === tab.id}
              className="touch-target"
              style={{
                padding: isMobile ? '10px 12px' : '12px 16px',
                fontSize: `${fontSize.sm}px`,
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#58a6ff' : '#666666',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = '#A0A0A0'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = '#666666'
                }
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '12px',
                  background: activeTab === tab.id ? 'linear-gradient(to right, #58a6ff, #a371f7)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results Count */}
        {query && (
          <div style={{ marginBottom: `${spacing.md}px`, color: '#666666' }}>
            {totalResults > 0 ? (
              <p>{totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
            ) : !loading && (
              <p>No results found for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {!query ? (
        <EmptySearch />
      ) : totalResults === 0 ? (
        <EmptySearch query={query} />
      ) : (
        <>
          {/* Communities */}
          {filteredResults?.communities?.length > 0 && (
            <section style={{ marginBottom: `${spacing['2xl']}px` }} aria-labelledby="communities-heading">
              <h2 id="communities-heading" style={{
                fontSize: `${fontSize.xl}px`,
                fontWeight: '600',
                marginBottom: `${spacing.md}px`,
                color: '#A0A0A0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                Communities
                <span style={{
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                  color: '#ffffff'
                }}>
                  {filteredResults?.communities?.length || 0}
                </span>
              </h2>
              <div style={{
                display: 'grid',
                gap: `${spacing.md}px`,
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
            <section style={{ marginBottom: `${spacing['2xl']}px` }} aria-labelledby="posts-heading">
              <h2 id="posts-heading" style={{
                fontSize: `${fontSize.xl}px`,
                fontWeight: '600',
                marginBottom: `${spacing.md}px`,
                color: '#A0A0A0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                Posts
                <span style={{
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                  color: '#ffffff'
                }}>
                  {filteredResults?.posts?.length || 0}
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
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
            <section style={{ marginBottom: `${spacing['2xl']}px` }} aria-labelledby="users-heading">
              <h2 id="users-heading" style={{
                fontSize: `${fontSize.xl}px`,
                fontWeight: '600',
                marginBottom: `${spacing.md}px`,
                color: '#A0A0A0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                Users
                <span style={{
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                  color: '#ffffff'
                }}>
                  {filteredResults?.users?.length || 0}
                </span>
              </h2>
              <div style={{
                display: 'grid',
                gap: `${spacing.md}px`,
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

