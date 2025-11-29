import React, { useState, useEffect, useContext, createContext } from 'react'
import {
  TrendingUp, MessageSquare, Share, Bookmark,
  Zap, Flame, Brain, Laugh,
  ChevronUp, ChevronDown, MoreHorizontal, Flag, Edit, Trash,
  Image, Link, Clock, Eye
} from 'lucide-react'
import FileUpload, { FileAttachment } from '../FileUpload/FileUploadSystem'
import ThreadedComments from '../Comments/ThreadedComments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardImage, CardBadge } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'

// OpenSea Color Scheme
const OPENSEA_COLORS = {
  primary: '#58a6ff',
  background: '#202225',
  secondary: '#2C2F36',
  accent: '#58a6ff',
  hover: '#1868B7'
}

// Post Types with OpenSea styling
const POST_TYPES = {
  DISCUSSION: { icon: MessageSquare, label: 'Discussion', color: '#58a6ff' },
  NEWS: { icon: Zap, label: 'News', color: '#F59E0B' },
  ANALYSIS: { icon: Brain, label: 'Analysis', color: '#8B5CF6' },
  MEME: { icon: Laugh, label: 'Meme', color: '#10B981' },
  PREDICTION: { icon: TrendingUp, label: 'Prediction', color: '#06B6D4' },
  ALERT: { icon: Flame, label: 'Alert', color: '#EF4444' }
}

// CRYB Reactions (beyond simple upvote/downvote)
const REACTIONS = {
  BULL: { emoji: '🚀', label: 'Bullish', value: 2, color: '#10B981' },
  BEAR: { emoji: '📉', label: 'Bearish', value: -2, color: '#EF4444' },
  SMART: { emoji: '🧠', label: 'Smart', value: 3, color: '#8B5CF6' },
  FUNNY: { emoji: '😂', label: 'Funny', value: 1, color: '#F59E0B' },
  FIRE: { emoji: '🔥', label: 'Fire', value: 2, color: '#F97316' },
  GEM: { emoji: '💎', label: 'Diamond', value: 4, color: '#06B6D4' },
  RUG: { emoji: '🗑️', label: 'Trash', value: -1, color: '#6B7280' }
}

// Post Creation Modal - OpenSea Design
function CreatePostModal({ isOpen, onClose, onCreatePost, channelId }) {
  const [postData, setPostData] = useState({
    type: 'DISCUSSION',
    title: '',
    content: '',
    tags: [],
    newTag: '',
    attachments: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (postData.title.trim() && postData.content.trim()) {
      onCreatePost({
        ...postData,
        channelId,
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        author: {
          id: 'current_user',
          username: 'DemoUser',
          avatar: null,
          reputation: 1247
        },
        timestamp: new Date().toISOString(),
        reactions: {},
        reactionCounts: {},
        commentCount: 0,
        views: 0,
        rewards: 0
      })

      setPostData({
        type: 'DISCUSSION',
        title: '',
        content: '',
        tags: [],
        newTag: '',
        attachments: []
      })
      onClose()
    }
  }

  const addTag = () => {
    if (postData.newTag.trim() && !postData.tags.includes(postData.newTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }))
    }
  }

  const removeTag = (tagToRemove) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleFilesUploaded = (files) => {
    const attachments = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }))

    setPostData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...attachments]
    }))
  }

  if (!isOpen) return null

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      <Card style={{
  width: '100%',
  margin: '16px'
}} variant="elevated">
        <CardHeader style={{
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <CardTitle className="text-2xl">Create Post</CardTitle>
          <IconButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </IconButton>
        </CardHeader>

        <form onSubmit={handleSubmit} style={{
  padding: '24px'
}}>
          {/* Post Type Selection */}
          <div className="space-y-2">
            <label style={{
  fontWeight: '500'
}}>Post Type</label>
            <div style={{
  display: 'grid',
  gap: '8px'
}}>
              {Object.entries(POST_TYPES).map(([key, type]) => {
                const IconComponent = type.icon
                const isSelected = postData.type === key
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPostData(prev => ({ ...prev, type: key }))}
                    style={{
  justifyContent: 'flex-start'
}}
                    style={isSelected ? { backgroundColor: type.color } : {}}
                  >
                    <IconComponent size={16} />
                    {type.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label style={{
  fontWeight: '500'
}}>Title</label>
            <input
              type="text"
              value={postData.title}
              onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What's your post about?"
              required
              maxLength={200}
              style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            />
            <small className="text-xs text-text-muted">{postData.title.length}/200</small>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label style={{
  fontWeight: '500'
}}>Content</label>
            <textarea
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, analysis, or discussion..."
              rows={6}
              required
              style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label style={{
  fontWeight: '500'
}}>Tags</label>
            <div style={{
  display: 'flex',
  gap: '8px'
}}>
              <input
                type="text"
                value={postData.newTag}
                onChange={(e) => setPostData(prev => ({ ...prev, newTag: e.target.value }))}
                placeholder="Add tags..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                style={{
  flex: '1',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
              />
              <Button type="button" onClick={addTag} size="sm">Add</Button>
            </div>

            {postData.tags.length > 0 && (
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
                {postData.tags.map(tag => (
                  <span key={tag} style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%'
}}>
                    <Hash size={12} />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-primary hover:text-primary-hover">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <label style={{
  fontWeight: '500'
}}>Attachments</label>
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              maxFiles={10}
              compact={false}
            />
          </div>

          <div style={{
  display: 'flex',
  gap: '12px'
}}>
            <Button type="button" onClick={onClose} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Create Post
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// Reaction Button Component - OpenSea Design
function ReactionButton({ reaction, count = 0, active = false, onClick }) {
  const reactionData = REACTIONS[reaction]
  if (!reactionData) return null

  return (
    <Button
      variant={active ? 'primary' : 'ghost'}
      size="sm"
      onClick={() => onClick(reaction)}
      className={`transition-all hover:scale-105 ${active ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      style={active ? { backgroundColor: reactionData.color } : {}}
      title={reactionData.label}
    >
      <span className="text-base">{reactionData.emoji}</span>
      {count > 0 && <span style={{
  fontWeight: '600'
}}>{count}</span>}
    </Button>
  )
}

// Post Component
function Post({ post, onReaction, onComment, onReply, onEditComment, onDeleteComment, currentUser, compact = false }) {
  const [showComments, setShowComments] = useState(false)
  const [userReaction, setUserReaction] = useState(null)

  const postType = POST_TYPES[post.type] || POST_TYPES.DISCUSSION
  const PostTypeIcon = postType.icon

  const handleReaction = (reactionType) => {
    const wasActive = userReaction === reactionType
    setUserReaction(wasActive ? null : reactionType)
    onReaction(post.id, reactionType, !wasActive)
  }

  const handleAddComment = (content) => {
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: post.id,
      content,
      author: {
        id: currentUser?.id || 'current_user',
        username: currentUser?.username || 'DemoUser',
        avatar: currentUser?.avatar || null,
        reputation: currentUser?.reputation || 1247
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      userReacted: false,
      replies: []
    }
    onComment(post.id, newComment)
  }

  const handleReplyToComment = (parentCommentId, content) => {
    const newReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentId: parentCommentId,
      postId: post.id,
      content,
      author: {
        id: currentUser?.id || 'current_user',
        username: currentUser?.username || 'DemoUser',
        avatar: currentUser?.avatar || null,
        reputation: currentUser?.reputation || 1247
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      userReacted: false,
      replies: []
    }
    onReply(post.id, parentCommentId, newReply)
  }

  const handleCommentReaction = (commentId, reactionType) => {
    // Handle comment reactions
  }

  const handleEditComment = (commentId, newContent) => {
    onEditComment(post.id, commentId, newContent)
  }

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDeleteComment(post.id, commentId)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    return `${Math.floor(diffMins / 1440)}d`
  }

  return (
    <Card
      variant="interactive"
      hoverEffect="medium"
      className={`mb-4 ${compact ? 'compact' : ''}`}
    >
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
          <span
            style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}
            style={{ backgroundColor: `${postType.color}15`, color: postType.color }}
          >
            <PostTypeIcon size={14} />
            {postType.label}
          </span>

          <IconButton
            variant="ghost"
            size="icon-sm"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </IconButton>
        </div>

        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '600'
}}>
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.username} style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}} />
            ) : (
              <span>{post.author.username[0].toUpperCase()}</span>
            )}
          </div>
          <div style={{
  flex: '1'
}}>
            <p style={{
  fontWeight: '500'
}}>{post.author.username}</p>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <span>{formatNumber(post.author.reputation)} rep</span>
              <span>•</span>
              <span>{getTimeAgo(post.timestamp)}</span>
              <span>•</span>
              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Eye size={12} />
                {formatNumber(post.views)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Post Title */}
        <CardTitle className="text-xl">{post.title}</CardTitle>

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                <Hash size={10} />
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-text-muted">+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Post Content */}
        {!compact && (
          <CardDescription className="text-base text-text-primary leading-relaxed">
            {post.content}
          </CardDescription>
        )}

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2">
            {post.attachments.map((attachment) => (
              <FileAttachment
                key={attachment.id}
                attachment={attachment}
                compact={false}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter style={{
  flexDirection: 'column',
  gap: '12px'
}}>
        {/* Reactions Bar */}
        <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
          {Object.keys(REACTIONS).slice(0, 4).map(reactionKey => (
            <ReactionButton
              key={reactionKey}
              reaction={reactionKey}
              count={post.reactionCounts?.[reactionKey] || 0}
              active={userReaction === reactionKey}
              onClick={handleReaction}
            />
          ))}
        </div>

        {/* Post Actions */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              leftIcon={<MessageSquare size={16} />}
            >
              {formatNumber(post.commentCount || 0)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Share size={16} />}
            >
              Share
            </Button>

            <IconButton
              variant="ghost"
              size="icon-sm"
              aria-label="Bookmark"
            >
              <Bookmark size={16} />
            </IconButton>
          </div>

          {post.rewards > 0 && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
              <Award size={14} />
              {post.rewards} CRYB
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-4 border-t border-border">
            <ThreadedComments
              comments={post.comments || []}
              onAddComment={handleAddComment}
              onReply={handleReplyToComment}
              onReact={handleCommentReaction}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              currentUser={currentUser}
              placeholder="Share your thoughts on this post..."
            />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Posts Feed Component
function PostsFeed({ channelId, posts, onCreatePost, onReaction, onComment, onReply, onEditComment, onDeleteComment, currentUser }) {
  const [sortBy, setSortBy] = useState('hot')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return new Date(b.timestamp) - new Date(a.timestamp)
      case 'top':
        return (b.reactions?.total || 0) - (a.reactions?.total || 0)
      case 'hot':
      default:
        // Simple hot algorithm: recent posts with engagement
        const aScore = (a.reactions?.total || 0) + (a.commentCount || 0) * 2
        const bScore = (b.reactions?.total || 0) + (b.commentCount || 0) * 2
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        const timeDecay = 3600000 // 1 hour
        
        const aHot = aScore / (1 + (Date.now() - aTime) / timeDecay)
        const bHot = bScore / (1 + (Date.now() - bTime) / timeDecay)
        
        return bHot - aHot
    }
  })

  return (
    <div style={{
  padding: '16px'
}}>
      {/* Feed Header - OpenSea Style */}
      <Card variant="elevated" style={{
  position: 'sticky'
}}>
        <CardHeader>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Hash size={20} />
              </div>
              <CardTitle className="text-2xl">Community Posts</CardTitle>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<MessageSquare size={16} />}
              className="shadow-lg hover:shadow-xl"
            >
              Create Post
            </Button>
          </div>

          {/* Sort Options */}
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            {['hot', 'new', 'top'].map(option => (
              <Button
                key={option}
                variant={sortBy === option ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSortBy(option)}
                leftIcon={
                  option === 'hot' ? <Flame size={14} /> :
                  option === 'new' ? <Clock size={14} /> :
                  <TrendingUp size={14} />
                }
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {sortedPosts.length === 0 ? (
          <Card variant="elevated" style={{
  textAlign: 'center',
  paddingTop: '64px',
  paddingBottom: '64px'
}}>
            <CardContent className="space-y-4">
              <div style={{
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <MessageSquare size={48} />
              </div>
              <CardTitle>No posts yet</CardTitle>
              <CardDescription>
                Be the first to start a discussion in this channel!
              </CardDescription>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedPosts.map(post => (
            <Post
              key={post.id}
              post={post}
              onReaction={onReaction}
              onComment={onComment}
              onReply={onReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePost={onCreatePost}
        channelId={channelId}
      />
    </div>
  )
}




export default OPENSEA_COLORS
