import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare, ChevronDown, ChevronRight, MoreVertical, 
  Reply, Heart, Flag, Edit, Trash, User, Clock
} from 'lucide-react'

// Bento Card Component
function BentoCard({ className = '', color = 'dark', size = 'medium', interactive = false, children, onClick }) {
  return (
    <div 
      className={`bento-card bento-${color} bento-${size} ${interactive ? 'bento-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Single Comment Component
function Comment({ 
  comment, 
  depth = 0, 
  onReply, 
  onReact, 
  onEdit, 
  onDelete, 
  currentUserId,
  maxDepth = 5 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const replyInputRef = useRef(null)

  useEffect(() => {
    if (showReplyForm && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [showReplyForm])

  const handleReply = (e) => {
    e.preventDefault()
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim())
      setReplyText('')
      setShowReplyForm(false)
    }
  }

  const handleEdit = () => {
    if (editText.trim() !== comment.content) {
      onEdit(comment.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(comment.content)
    setIsEditing(false)
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`
    return time.toLocaleDateString()
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className={`comment-thread depth-${Math.min(depth, maxDepth)}`}>
      <BentoCard 
        color="transparent" 
        className={`comment-card ${isCollapsed ? 'collapsed' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Comment Header */}
        <div className="comment-header">
          <div className="comment-collapse-btn">
            {hasReplies && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="collapse-btn"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
          
          <div className="comment-author">
            <div className="author-avatar">
              {comment.author.avatar ? (
                <img src={comment.author.avatar} alt={comment.author.username} />
              ) : (
                <User size={14} />
              )}
            </div>
            <span className="author-name">{comment.author.username}</span>
            {comment.author.reputation && (
              <span className="author-reputation">{comment.author.reputation}</span>
            )}
          </div>
          
          <div className="comment-metadata">
            <Clock size={12} />
            <span className="comment-time">{getTimeAgo(comment.timestamp)}</span>
            {comment.edited && <span className="edited-indicator">(edited)</span>}
          </div>

          {showActions && (
            <div className="comment-actions">
              <button className="comment-action-btn" title="More options">
                <MoreVertical size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {!isCollapsed && (
          <>
            <div className="comment-content">
              {isEditing ? (
                <div className="comment-edit-form">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="comment-edit-input"
                    rows={3}
                  />
                  <div className="edit-actions">
                    <button onClick={handleCancelEdit} className="btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button onClick={handleEdit} className="btn-primary btn-sm">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p>{comment.content}</p>
              )}
            </div>

            {/* Comment Actions */}
            <div className="comment-footer">
              <div className="comment-reactions">
                <button 
                  className={`reaction-btn ${comment.userReacted ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => onReact(comment.id, 'like')}
                >
                  <Heart size={14} />
                  <span>{comment.likes || 0}</span>
                </button>
              </div>

              <div className="comment-controls">
                <button 
                  className="control-btn"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply size={14} />
                  <span>Reply</span>
                </button>

                {currentUserId === comment.author.id && (
                  <>
                    <button 
                      className="control-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="control-btn danger"
                      onClick={() => onDelete(comment.id)}
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                <button className="control-btn">
                  <Flag size={14} />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <form onSubmit={handleReply} className="reply-form">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="reply-input"
                  rows={3}
                />
                <div className="reply-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowReplyForm(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="btn-primary btn-sm"
                  >
                    Reply
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </BentoCard>

      {/* Nested Replies */}
      {hasReplies && !isCollapsed && depth < maxDepth && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      {/* Load More Replies (if deeply nested) */}
      {hasReplies && !isCollapsed && depth >= maxDepth && (
        <BentoCard color="transparent" className="load-more-replies">
          <button className="load-more-btn">
            <MessageSquare size={14} />
            <span>View {comment.replies.length} more replies</span>
          </button>
        </BentoCard>
      )}
    </div>
  )
}

// Main Threaded Comments Component
function ThreadedComments({ 
  comments = [], 
  onAddComment, 
  onReply, 
  onReact, 
  onEdit, 
  onDelete, 
  currentUser,
  placeholder = "Add a comment..." 
}) {
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState('best') // best, newest, oldest

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  const sortComments = (comments) => {
    return [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp)
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp)
        case 'best':
        default:
          // Sort by likes and recent activity
          const aScore = (a.likes || 0) * 2 + (a.replies?.length || 0)
          const bScore = (b.likes || 0) * 2 + (b.replies?.length || 0)
          if (aScore === bScore) {
            return new Date(b.timestamp) - new Date(a.timestamp)
          }
          return bScore - aScore
      }
    })
  }

  const sortedComments = sortComments(comments)

  return (
    <div className="threaded-comments">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form-header">
          <div className="current-user-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} />
            ) : (
              <User size={20} />
            )}
          </div>
          <span className="current-user-name">{currentUser?.username || 'Anonymous'}</span>
        </div>
        
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={placeholder}
          className="comment-input"
          rows={3}
        />
        
        <div className="comment-form-actions">
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="btn-primary"
          >
            <MessageSquare size={16} />
            <span>Comment</span>
          </button>
        </div>
      </form>

      {/* Comments Header */}
      {comments.length > 0 && (
        <div className="comments-header">
          <div className="comments-count">
            <MessageSquare size={16} />
            <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="comments-sort">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="best">Best</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {sortedComments.length === 0 ? (
          <BentoCard color="transparent" className="no-comments">
            <MessageSquare size={32} />
            <h4>No comments yet</h4>
            <p>Be the first to share your thoughts!</p>
          </BentoCard>
        ) : (
          sortedComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={onReply}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>
    </div>
  )
}



export default ThreadedComments
export { Comment }
