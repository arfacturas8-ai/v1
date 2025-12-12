import React, { useState, useEffect, useRef } from 'react'
import { getErrorMessage } from "../../utils/errorUtils";
import {
  Plus, Filter, TrendingUp, Clock, MessageSquare,
  Pin, Eye, ArrowUp, ArrowDown, Share, Bookmark,
  MoreHorizontal, Flag, Edit, Trash2, Crown
} from 'lucide-react'
import communityService from '../../services/communityService'
import socketService from '../../services/socket'
import { useConfirmationDialog } from '../ui/modal'
import CreatePost from '../post/CreatePost'


export default function CommunityFeed({
  communityId,
  currentUser,
  community,
  canModerate = false
}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('hot') // hot, new, top, rising
  const [timeRange, setTimeRange] = useState('all') // hour, day, week, month, year, all
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, hasMore: true })
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostActions, setShowPostActions] = useState(null)
  const feedRef = useRef(null)

  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    loadPosts(true)
    
    // Subscribe to real-time updates
    socketService.subscribeToCommunity(communityId)
    
    // Set up event listeners
    socketService.on('community_post_created', handlePostCreated)
    socketService.on('community_post_updated', handlePostUpdated)
    socketService.on('community_post_deleted', handlePostDeleted)
    socketService.on('community_post_vote_updated', handleVoteUpdated)
    
    return () => {
      socketService.unsubscribeFromCommunity(communityId)
      socketService.off('community_post_created', handlePostCreated)
      socketService.off('community_post_updated', handlePostUpdated)
      socketService.off('community_post_deleted', handlePostDeleted)
      socketService.off('community_post_vote_updated', handleVoteUpdated)
    }
  }, [communityId])

  useEffect(() => {
    if (sortBy || timeRange) {
      loadPosts(true)
    }
  }, [sortBy, timeRange])

  const loadPosts = async (reset = false) => {
    try {
      setLoading(reset)
      setError(null)
      
      const options = {
        page: reset ? 1 : pagination.page,
        limit: 25,
        sort: sortBy,
        timeRange,
        communityId
      }
      
      const result = await communityService.getPosts(options)
      
      if (result.success) {
        if (reset) {
          setPosts(result.posts)
          setPagination({ page: 1, hasMore: result.pagination?.hasMore ?? false })
        } else {
          setPosts(prev => [...prev, ...result.posts])
          setPagination(prev => ({ 
            page: prev.page + 1, 
            hasMore: result.pagination?.hasMore ?? false 
          }))
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to load posts:', error)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  // Real-time event handlers
  const handlePostCreated = (post) => {
    if (post.communityId === communityId) {
      setPosts(prev => [post, ...prev])
    }
  }

  const handlePostUpdated = (updatedPost) => {
    if (updatedPost.communityId === communityId) {
      setPosts(prev => prev.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      ))
    }
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  const handleVoteUpdated = (data) => {
    if (data.communityId === communityId) {
      setPosts(prev => prev.map(post => 
        post.id === data.postId 
          ? { 
              ...post, 
              upvotes: data.upvotes, 
              downvotes: data.downvotes,
              userVote: data.userVote 
            }
          : post
      ))
    }
  }

  const handleVote = async (postId, voteType) => {
    try {
      // Optimistic update
      const post = posts.find(p => p.id === postId)
      if (!post) return
      
      let newUpvotes = post.upvotes
      let newDownvotes = post.downvotes
      let newUserVote = voteType
      
      // Remove previous vote
      if (post.userVote === 'up') newUpvotes--
      if (post.userVote === 'down') newDownvotes--
      
      // Add new vote or remove if same
      if (voteType === post.userVote) {
        newUserVote = null // Remove vote
      } else {
        if (voteType === 'up') newUpvotes++
        if (voteType === 'down') newDownvotes++
      }
      
      // Update UI immediately
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              upvotes: newUpvotes, 
              downvotes: newDownvotes,
              userVote: newUserVote 
            }
          : p
      ))
      
      // Send to server
      const result = await communityService.votePost(postId, newUserVote || 'remove')
      
      if (!result.success) {
        // Revert on error
        setPosts(prev => prev.map(p => 
          p.id === postId ? post : p
        ))
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      setError('Failed to vote on post')
    }
  }

  const handleSavePost = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId)
      const result = await communityService.savePost(postId, !post.isSaved)
      
      if (result.success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, isSaved: !p.isSaved } : p
        ))
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to save post:', error)
      setError('Failed to save post')
    }
  }

  const handleDeletePost = async (postId) => {
    const confirmed = await confirm({
      type: 'error',
      title: 'Delete Post',
      description: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'destructive'
    })

    if (!confirmed) return
    
    try {
      const result = await communityService.deletePost(postId)
      
      if (result.success) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      setError('Failed to delete post')
    }
  }

  const handlePinPost = async (postId, pin = true) => {
    try {
      const result = await communityService.updatePost(postId, { isPinned: pin })
      
      if (result.success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, isPinned: pin } : p
        ))
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to pin post:', error)
      setError('Failed to pin post')
    }
  }

  const handleCreatePost = (newPost) => {
    setPosts(prev => [newPost, ...prev])
    setShowCreatePost(false)
  }

  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      loadPosts()
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num?.toString() || '0'
  }

  const getTimeSince = (date) => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - postDate) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const canEditPost = (post) => {
    return post.authorId === currentUser?.id || canModerate
  }

  const canDeletePost = (post) => {
    return post.authorId === currentUser?.id || canModerate
  }

  const canPinPost = () => {
    return canModerate
  }

  if (loading && posts.length === 0) {
    return (
      <div className=\"community-feed\">
        <div className=\"loading-state\">
          <div className=\"spinner\"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"community-feed\" ref={feedRef}>
      {/* Feed Header */}
      <div className=\"feed-header\">
        <div className=\"sort-controls\">
          <button
            className={`sort-btn ${sortBy === 'hot' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setSortBy('hot')}
          >
            <TrendingUp size={16} />
            Hot
          </button>
          <button
            className={`sort-btn ${sortBy === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setSortBy('new')}
          >
            <Clock size={16} />
            New
          </button>
          <button
            className={`sort-btn ${sortBy === 'top' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setSortBy('top')}
          >
            <ArrowUp size={16} />
            Top
          </button>
          <button
            className={`sort-btn ${sortBy === 'rising' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setSortBy('rising')}
          >
            <TrendingUp size={16} />
            Rising
          </button>
        </div>

        {sortBy === 'top' && (
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className=\"time-range-select\"
          >
            <option value=\"hour\">Past Hour</option>
            <option value=\"day\">Past 24 Hours</option>
            <option value=\"week\">Past Week</option>
            <option value=\"month\">Past Month</option>
            <option value=\"year\">Past Year</option>
            <option value=\"all\">All Time</option>
          </select>
        )}

        <button 
          className=\"create-post-btn\"
          onClick={() => setShowCreatePost(true)}
        >
          <Plus size={16} />
          Create Post
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className=\"error-message\">
          <p>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Posts Feed */}
      <div className=\"posts-container\">
        {posts.map(post => (
          <div key={post.id} className={`post-card ${post.isPinned ? 'pinned' : ''}`}>
            {post.isPinned && (
              <div className=\"pin-indicator\">
                <Pin size={14} />
                <span>Pinned by moderators</span>
              </div>
            )}

            <div className=\"post-header\">
              <div className=\"post-author\">
                <img 
                  src={post.author?.avatar || '/default-avatar.png'} 
                  alt={post.author?.username}
                  className=\"author-avatar\"
                />
                <div className=\"author-info\">
                  <span className=\"author-name\">
                    {post.author?.username}
                    {post.author?.role === 'owner' && <Crown size={14} className=\"role-crown\" />}
                  </span>
                  <span className=\"post-time\">{getTimeSince(post.createdAt)}</span>
                </div>
              </div>

              <div className=\"post-actions-menu\">
                <button 
                  className=\"actions-btn\"
                  onClick={() => setShowPostActions(
                    showPostActions === post.id ? null : post.id
                  )}
                >
                  <MoreHorizontal size={16} />
                </button>

                {showPostActions === post.id && (
                  <div className=\"actions-dropdown\">
                    {canPinPost() && (
                      <button
                        onClick={() => handlePinPost(post.id, !post.isPinned)}
                        className=\"action-item\"
                      >
                        <Pin size={14} />
                        {post.isPinned ? 'Unpin' : 'Pin'} Post
                      </button>
                    )}
                    
                    {canEditPost(post) && (
                      <button className=\"action-item\">
                        <Edit size={14} />
                        Edit Post
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleSavePost(post.id)}
                      className=\"action-item\"
                    >
                      <Bookmark size={14} />
                      {post.isSaved ? 'Unsave' : 'Save'} Post
                    </button>
                    
                    <button className=\"action-item\">
                      <Share size={14} />
                      Share
                    </button>
                    
                    <button className=\"action-item\">
                      <Flag size={14} />
                      Report
                    </button>
                    
                    {canDeletePost(post) && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className=\"action-item danger\"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className=\"post-content\">
              <h3 className=\"post-title\">{post.title}</h3>
              
              {post.content && (
                <div className=\"post-body\">
                  {post.content}
                </div>
              )}
              
              {post.media && post.media.length > 0 && (
                <div className=\"post-media\">
                  {post.media.map((media, index) => (
                    <img 
                      key={index}
                      src={media.url} 
                      alt={`Post media ${index + 1}`}
                      className=\"media-item\"
                    />
                  ))}
                </div>
              )}
              
              {post.url && (
                <div className=\"post-link\">
                  <a href={post.url} target=\"_blank\" rel=\"noopener noreferrer\">
                    {post.url}
                  </a>
                </div>
              )}
            </div>

            <div className=\"post-footer\">
              <div className=\"vote-controls\">
                <button 
                  className={`vote-btn ${post.userVote === 'up' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => handleVote(post.id, 'up')}
                >
                  <ArrowUp size={16} />
                </button>
                <span className=\"vote-count\">
                  {formatNumber((post.upvotes || 0) - (post.downvotes || 0))}
                </span>
                <button 
                  className={`vote-btn ${post.userVote === 'down' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => handleVote(post.id, 'down')}
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              <button className=\"comment-btn\">
                <MessageSquare size={16} />
                {formatNumber(post.commentCount || 0)} comments
              </button>

              <div className=\"post-stats\">
                <span className=\"view-count\">
                  <Eye size={14} />
                  {formatNumber(post.viewCount || 0)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Load More */}
        {pagination.hasMore && (
          <div className=\"load-more-container\">
            <button 
              className=\"load-more-btn\"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? '' : 'Load More Posts'}
            </button>
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className=\"empty-feed\">
            <MessageSquare size={48} />
            <h3>No posts yet</h3>
            <p>Be the first to share something with this community!</p>
            <button 
              className=\"create-first-post\"
              onClick={() => setShowCreatePost(true)}
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          communityId={communityId}
          onClose={() => setShowCreatePost(false)}
          onCreate={handleCreatePost}
        />
      )}

      {ConfirmationDialog}
    </div>
  )
}
