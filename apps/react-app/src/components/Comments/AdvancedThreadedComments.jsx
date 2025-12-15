import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  MessageSquare, ChevronDown, ChevronRight, MoreVertical, Reply, Heart,
  Flag, Edit, Trash, User, Clock, Award, Crown, Shield,
  ArrowUp, ArrowDown, Bookmark, Share, Eye, EyeOff, Filter,
  Search, RefreshCw, ChevronUp
} from 'lucide-react'

const AdvancedThreadedComments = ({ 
  postId,
  comments = [], 
  onAddComment, 
  onReply, 
  onVote,
  onReact, 
  onEdit, 
  onDelete,
  onReport,
  onAward,
  currentUser,
  loading = false,
  totalCount = 0
}) => {
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState('best')
  const [filterBy, setFilterBy] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedComments, setCollapsedComments] = useState(new Set())
  const [hiddenComments, setHiddenComments] = useState(new Set())
  const [expandedThreads, setExpandedThreads] = useState(new Set())
  const [viewMode, setViewMode] = useState('threaded') // threaded, flat, single
  const [showDeleted, setShowDeleted] = useState(false)
  const [autoCollapse, setAutoCollapse] = useState(true)
  const [maxDepth, setMaxDepth] = useState(8)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  const toggleCollapse = useCallback((commentId) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }, [])

  const collapseThread = useCallback((commentId) => {
    setCollapsedComments(prev => new Set([...prev, commentId]))
  }, [])

  const expandThread = useCallback((commentId) => {
    setExpandedThreads(prev => new Set([...prev, commentId]))
  }, [])

  const hideComment = useCallback((commentId) => {
    setHiddenComments(prev => new Set([...prev, commentId]))
  }, [])

  const processComments = useMemo(() => {
    let processed = [...comments]

    // Filter
    if (filterBy !== 'all') {
      processed = processed.filter(comment => {
        switch (filterBy) {
          case 'top':
            return comment.score > 10
          case 'controversial':
            return comment.controversialScore > 0.5
          case 'recent':
            return Date.now() - new Date(comment.timestamp).getTime() < 24 * 60 * 60 * 1000
          case 'author':
            return comment.author.id === currentUser?.id
          case 'awarded':
            return comment.awards && comment.awards.length > 0
          default:
            return true
        }
      })
    }

    // Search
    if (searchQuery) {
      processed = processed.filter(comment =>
        comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.author.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    processed.sort((a, b) => {
      switch (sortBy) {
        case 'best':
          return (b.score || 0) - (a.score || 0)
        case 'top':
          return (b.score || 0) - (a.score || 0)
        case 'new':
          return new Date(b.timestamp) - new Date(a.timestamp)
        case 'old':
          return new Date(a.timestamp) - new Date(b.timestamp)
        case 'controversial':
          return (b.controversialScore || 0) - (a.controversialScore || 0)
        case 'qa':
          // Q&A mode: OP's comments first, then by score
          if (a.author.isOP && !b.author.isOP) return -1
          if (!a.author.isOP && b.author.isOP) return 1
          return (b.score || 0) - (a.score || 0)
        default:
          return 0
      }
    })

    return processed
  }, [comments, filterBy, searchQuery, sortBy, currentUser])

  const CommentComponent = ({ 
    comment, 
    depth = 0, 
    isLastInThread = false,
    threadPath = [] 
  }) => {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [showActions, setShowActions] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(comment.content)
    const [voteDirection, setVoteDirection] = useState(comment.userVote || null)
    const [score, setScore] = useState(comment.score || 0)
    
    const replyInputRef = useRef(null)
    const commentRef = useRef(null)
    
    const isCollapsed = collapsedComments.has(comment.id)
    const isHidden = hiddenComments.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0
    const shouldShowContinueThread = depth >= maxDepth && hasReplies
    const isDeleted = comment.deleted
    const isRemoved = comment.removed

    // Auto-collapse threshold
    const shouldAutoCollapse = autoCollapse && depth > 3 && comment.score < -5

    useEffect(() => {
      if (shouldAutoCollapse && !collapsedComments.has(comment.id)) {
        collapseThread(comment.id)
      }
    }, [shouldAutoCollapse, comment.id, collapseThread])

    const handleVote = async (direction) => {
      const newDirection = voteDirection === direction ? null : direction
      const prevScore = score
      const prevDirection = voteDirection
      
      // Optimistic update
      let scoreChange = 0
      if (prevDirection === 'up' && newDirection === null) scoreChange = -1
      if (prevDirection === 'down' && newDirection === null) scoreChange = 1
      if (prevDirection === null && newDirection === 'up') scoreChange = 1
      if (prevDirection === null && newDirection === 'down') scoreChange = -1
      if (prevDirection === 'up' && newDirection === 'down') scoreChange = -2
      if (prevDirection === 'down' && newDirection === 'up') scoreChange = 2
      
      setVoteDirection(newDirection)
      setScore(prevScore + scoreChange)
      
      try {
        await onVote(comment.id, direction)
      } catch (error) {
        // Revert on error
        setVoteDirection(prevDirection)
        setScore(prevScore)
      }
    }

    const handleReply = async (e) => {
      e.preventDefault()
      if (replyText.trim()) {
        try {
          await onReply(comment.id, replyText.trim())
          setReplyText('')
          setShowReplyForm(false)
        } catch (error) {
          console.error('Failed to reply:', error)
        }
      }
    }

    const handleEdit = async () => {
      if (editText.trim() !== comment.content) {
        try {
          await onEdit(comment.id, editText.trim())
          setIsEditing(false)
        } catch (error) {
          console.error('Failed to edit comment:', error)
        }
      } else {
        setIsEditing(false)
      }
    }

    const formatTimestamp = (timestamp) => {
      const now = Date.now()
      const diff = now - new Date(timestamp).getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'now'
      if (minutes < 60) return `${minutes}m`
      if (hours < 24) return `${hours}h`
      if (days < 7) return `${days}d`
      return new Date(timestamp).toLocaleDateString()
    }

    const getScoreColor = (score) => {
      if (score > 0) return 'text-green-500'
      if (score < 0) return 'text-red-500'
      return 'text-muted/70'
    }

    if (isHidden) {
      return (
        <div className={`comment-hidden depth-${depth}`}>
          <button
            onClick={() => setHiddenComments(prev => {
              const newSet = new Set(prev)
              newSet.delete(comment.id)
              return newSet
            })}
            className="text-xs text-muted/60 hover:text-primary"
          >
            [+] Show hidden comment
          </button>
        </div>
      )
    }

    if (isDeleted || isRemoved) {
      if (!showDeleted) {
        return (
          <div className={`comment-deleted depth-${depth} ml-${depth * 4}`}>
            <div style={{
  padding: '8px'
}}>
              [{isDeleted ? 'deleted' : 'removed'}]
              {hasReplies && (
                <button
                  onClick={() => toggleCollapse(comment.id)}
                  className="ml-2 text-accent hover:text-accent/80"
                >
                  {isCollapsed ? 'show' : 'hide'} {comment.replies.length} replies
                </button>
              )}
            </div>
            {hasReplies && !isCollapsed && (
              <div className="ml-4">
                {comment.replies.map((reply, index) => (
                  <CommentComponent
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    isLastInThread={index === comment.replies.length - 1}
                    threadPath={[...threadPath, comment.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )
      }
    }

    return (
      <div 
        ref={commentRef}
        className={`
          comment-container depth-${depth} 
          ${depth > 0 ? `ml-${Math.min(depth * 4, 20)}` : ''}
          ${isCollapsed ? 'collapsed' : ''}
        `}
      >
        {/* Thread Lines */}
        {depth > 0 && (
          <div className="thread-lines">
            {Array.from({ length: depth }, (_, i) => (
              <div
                key={i}
                className={`thread-line depth-${i} ${i === depth - 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              />
            ))}
          </div>
        )}

        {/* Comment Card */}
        <div 
          style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '16px'
}}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {/* Collapse Button */}
              {hasReplies && (
                <button
                  onClick={() => toggleCollapse(comment.id)}
                  style={{
  padding: '4px',
  borderRadius: '4px'
}}
                  title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
                >
                  {isCollapsed ? (
                    <ChevronRight style={{
  width: '12px',
  height: '12px'
}} />
                  ) : (
                    <ChevronDown style={{
  width: '12px',
  height: '12px'
}} />
                  )}
                </button>
              )}

              {/* Author Info */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
                  {comment.author.avatar ? (
                    <img src={comment.author.avatar} alt={comment.author.username} style={{
  width: '100%',
  height: '100%'
}} />
                  ) : (
                    <User style={{
  width: '16px',
  height: '16px',
  margin: '4px'
}} />
                  )}
                </div>
                
                <span style={{
  fontWeight: '500'
}}>
                  {comment.author.username}
                </span>
                
                {comment.author.isOP && (
                  <span style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>OP</span>
                )}
                
                {comment.author.isVerified && (
                  <Shield style={{
  width: '12px',
  height: '12px'
}} />
                )}
                
                {comment.author.isPremium && (
                  <Crown style={{
  width: '12px',
  height: '12px'
}} />
                )}

                {comment.stickied && (
                  <span style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>Pinned</span>
                )}

                {comment.distinguished && (
                  <span style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>Mod</span>
                )}
              </div>

              {/* Metadata */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Clock style={{
  width: '12px',
  height: '12px'
}} />
                <span>{formatTimestamp(comment.timestamp)}</span>
                {comment.edited && (
                  <span className="italic">(edited)</span>
                )}
                {comment.gilded && (
                  <Award style={{
  width: '12px',
  height: '12px'
}} />
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <button
                  onClick={() => hideComment(comment.id)}
                  style={{
  padding: '4px',
  borderRadius: '4px'
}}
                  title="Hide comment"
                >
                  <EyeOff style={{
  width: '12px',
  height: '12px'
}} />
                </button>
                <button style={{
  padding: '4px',
  borderRadius: '4px'
}}>
                  <MoreVertical style={{
  width: '12px',
  height: '12px'
}} />
                </button>
              </div>
            )}
          </div>

          {/* Collapsed Info */}
          {isCollapsed ? (
            <div className="text-xs text-muted/60">
              {hasReplies && `${comment.replies.length} replies`}
              {comment.score !== undefined && ` • ${comment.score} points`}
            </div>
          ) : (
            <>
              {/* Content */}
              <div className="mb-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{
  width: '100%',
  padding: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                      rows={3}
                    />
                    <div style={{
  display: 'flex',
  gap: '8px'
}}>
                      <button
                        onClick={() => {
                          setEditText(comment.content)
                          setIsEditing(false)
                        }}
                        style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEdit}
                        style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                )}
              </div>

              {/* Awards */}
              {comment.awards && comment.awards.length > 0 && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  {comment.awards.map((award, index) => (
                    <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                      <span className="text-xs">{award.icon}</span>
                      {award.count > 1 && (
                        <span style={{
  fontWeight: '500'
}}>{award.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
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
                  {/* Voting */}
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    <button
                      onClick={() => handleVote('up')}
                      style={{
  padding: '4px',
  borderRadius: '4px'
}}
                    >
                      <ArrowUp style={{
  width: '16px',
  height: '16px'
}} />
                    </button>
                    
                    <span style={{
  fontWeight: '500',
  textAlign: 'center'
}}>
                      {score}
                    </span>
                    
                    <button
                      onClick={() => handleVote('down')}
                      style={{
  padding: '4px',
  borderRadius: '4px'
}}
                    >
                      <ArrowDown style={{
  width: '16px',
  height: '16px'
}} />
                    </button>
                  </div>

                  {/* Comment Actions */}
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                  >
                    <Reply style={{
  width: '12px',
  height: '12px'
}} />
                    Reply
                  </button>

                  {comment.author.id === currentUser?.id && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                      >
                        <Edit style={{
  width: '12px',
  height: '12px'
}} />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                      >
                        <Trash style={{
  width: '12px',
  height: '12px'
}} />
                        Delete
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onAward(comment.id)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                  >
                    <Award style={{
  width: '12px',
  height: '12px'
}} />
                    Award
                  </button>
                </div>

                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                    <Share style={{
  width: '12px',
  height: '12px'
}} />
                    Share
                  </button>
                  
                  <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                    <Flag style={{
  width: '12px',
  height: '12px'
}} />
                    Report
                  </button>
                </div>
              </div>

              {/* Reply Form */}
              {showReplyForm && (
                <form onSubmit={handleReply} className="mt-3 space-y-2">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.author.username}...`}
                    style={{
  width: '100%',
  padding: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                    rows={3}
                    autoFocus
                  />
                  <div style={{
  display: 'flex',
  gap: '8px'
}}>
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
                    >
                      Reply
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && !isCollapsed && (
          <div className="replies">
            {shouldShowContinueThread ? (
              <div className="continue-thread">
                <button
                  onClick={() => {
                    // Navigate to comment permalink
                    window.location.href = `/posts/${postId}/comments/${comment.id}`
                  }}
                  style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px'
}}
                >
                  <Link2 style={{
  width: '12px',
  height: '12px'
}} />
                  Continue this thread →
                </button>
              </div>
            ) : (
              comment.replies.map((reply, index) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  isLastInThread={index === comment.replies.length - 1}
                  threadPath={[...threadPath, comment.id]}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

return (
  <div className="advanced-threaded-comments">
    {/* Comments Header */}
    <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <MessageSquare style={{
  width: '20px',
  height: '20px'
}} />
          <h3 style={{
  fontWeight: '600'
}}>
            {totalCount > 0 ? (
              `${totalCount.toLocaleString()} Comment${totalCount !== 1 ? 's' : ''}`
            ) : (
              'Comments'
            )}
          </h3>
        </div>

        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  color: '#ffffff'
}}
          >
            {showDeleted ? 'Hide' : 'Show'} deleted
          </button>
          
          <button
            onClick={() => setAutoCollapse(!autoCollapse)}
            style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  color: '#ffffff'
}}
          >
            Auto-collapse
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '16px'
}}>
        {/* Search */}
        <div style={{
  position: 'relative'
}}>
          <Search style={{
  position: 'absolute',
  width: '12px',
  height: '12px'
}} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments..."
            style={{
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  width: '160px'
}}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
        >
          <option value="best">Best</option>
          <option value="top">Top</option>
          <option value="new">New</option>
          <option value="old">Old</option>
          <option value="controversial">Controversial</option>
          <option value="qa">Q&A</option>
        </select>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
        >
          <option value="all">All comments</option>
          <option value="top">Top comments</option>
          <option value="controversial">Controversial</option>
          <option value="recent">Recent</option>
          <option value="author">By author</option>
          <option value="awarded">Awarded</option>
        </select>

        {/* View Mode */}
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
        >
          <option value="threaded">Threaded</option>
          <option value="flat">Flat</option>
          <option value="single">Single thread</option>
        </select>
      </div>
    </div>

    {/* Add Comment Form */}
    <form onSubmit={handleSubmit} style={{
  borderRadius: '12px',
  padding: '16px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
        <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.username} style={{
  width: '100%',
  height: '100%'
}} />
          ) : (
            <User style={{
  width: '16px',
  height: '16px',
  margin: '8px'
}} />
          )}
        </div>
        <span style={{
  fontWeight: '500'
}}>{currentUser?.username || 'Anonymous'}</span>
      </div>
      
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        style={{
  width: '100%',
  padding: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
        rows={4}
      />
      
      <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
        <button
          type="submit"
          disabled={!newComment.trim()}
          style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
        >
          <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
          Comment
        </button>
      </div>
    </form>

    {/* Comments List */}
    <div className="comments-list">
      {loading ? (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
          <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
        </div>
      ) : processComments.length === 0 ? (
        <div style={{
  textAlign: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
          <MessageSquare style={{
  width: '64px',
  height: '64px'
}} />
          <h4 style={{
  fontWeight: '500'
}}>No comments yet</h4>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        processComments.map((comment) => (
          <CommentComponent
            key={comment.id}
            comment={comment}
            depth={0}
            threadPath={[]}
          />
        ))
      )}
    </div>
  </div>
)
}



export default AdvancedThreadedComments