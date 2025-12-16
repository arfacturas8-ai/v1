import React, { useState, useRef } from 'react'
import DOMPurify from 'dompurify'
import VoteControls from './VoteControls'
import Awards from './Awards'
import CommentActions from './CommentActions'
import { useResponsive } from '../../hooks/useResponsive'

const Comment = ({
  comment,
  level = 0,
  maxLevel = 8,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onSave,
  onReport,
  onAward,
  onToggleCollapse,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [isCollapsed, setIsCollapsed] = useState(comment.isCollapsed || false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const replyFormRef = useRef(null)

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 30) return `${days}d`
    return new Date(timestamp).toLocaleDateString()
  }

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggleCollapse?.(comment.id, newCollapsed)
  }

  const handleReply = (content) => {
    onReply?.(comment.id, content)
    setShowReplyForm(false)
  }

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(comment.id, editContent)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  const getIndentColor = (level) => {
    const colors = [
      'border-accent/30',
      'border-accent/25',
      'border-accent/20',
      'border-accent/15',
      'border-accent/12',
      'border-accent/10',
      'border-accent/8',
      'border-accent/6'
    ]
    return colors[level % colors.length]
  }

  const shouldShowContinueThread = level >= maxLevel && comment.replies && comment.replies.length > 0

  return (
    <div className="relative">
      <div className={`comment-container ${level > 0 ? (isMobile ? 'ml-2 pl-2' : 'ml-4 md:ml-6 pl-3 md:pl-4') : ''} ${level > 0 ? 'border-l-2' : ''} ${level > 0 ? getIndentColor(level - 1) : ''}`}>
        {/* Thread connector line */}
        {level > 0 && (
          <div className="absolute h-8 rounded-full" />
        )}

        <div className="flex items-start gap-1 sm:gap-2">
          {/* Collapse Button */}
          <button
            onClick={handleToggleCollapse}
            style={{ width: "24px", height: "24px", flexShrink: 0 }}
            aria-label={isCollapsed ? 'Expand comment' : 'Collapse comment'}
          >
            {isCollapsed ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 2l3 3-3 3"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l3 3 3-3"/>
              </svg>
            )}
          </button>

          {/* Vote Controls */}
          {!isMobile && (
            <div className="flex-shrink-0">
              <VoteControls
                postId={comment.id}
                initialScore={comment.score}
                userVote={comment.userVote}
                onVote={onVote}
                size="sm"
                orientation="vertical"
              />
            </div>
          )}

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {!isCollapsed && (
              <>
                {/* Comment Header */}
                <header className="flex items-center flex-wrap gap-1.5 mb-2 text-xs sm:text-sm">
                  <a
                    href={`/u/${comment.author}`}
                    className="font-medium hover:text-accent truncate"
                  >
                    u/{comment.author}
                  </a>

                  {comment.authorFlair && (
                    <span style={{borderColor: "var(--border-subtle)"}} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border  bg-accent/10 text-accent">
                      {comment.authorFlair}
                    </span>
                  )}

                  {comment.isOP && (
                    <span style={{color: "var(--text-primary)"}} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-accent ">
                      OP
                    </span>
                  )}

                  {comment.isModerator && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border border-green-500/30 bg-green-500/10 text-green-500">
                      MOD
                    </span>
                  )}

                  <span className="text-muted/40">•</span>
                  <time dateTime={comment.timestamp} className="text-muted/70 flex-shrink-0">
                    {formatTimestamp(comment.timestamp)}
                  </time>

                  {comment.edited && (
                    <>
                      <span className="text-muted/40 hidden sm:inline">•</span>
                      <span className="italic text-muted/60 text-xs hidden sm:inline">edited</span>
                    </>
                  )}

                  {comment.isGilded && (
                    <>
                      <span className="text-muted/40">•</span>
                      <span className="text-yellow-400 text-sm">🥇</span>
                    </>
                  )}
                </header>

                {/* Comment Content */}
                <div className="mb-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{borderColor: "var(--border-subtle)"}} className="w-full min-h-[80px] p-2 rounded-lg border  bg-surface/60 text-sm resize-y"
                        placeholder="What are your thoughts?"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleEdit}
                          className="btn btn-sm btn-primary w-full sm:w-auto"
                          disabled={!editContent.trim()}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-sm btn-ghost w-full sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs sm:text-sm text-secondary/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
                    />
                  )}
                </div>

                {/* Awards */}
                {comment.awards && comment.awards.length > 0 && (
                  <div className="mb-2">
                    <Awards awards={comment.awards} size="sm" />
                  </div>
                )}

                {/* Comment Actions */}
                <CommentActions
                  comment={comment}
                  onReply={() => setShowReplyForm(true)}
                  onEdit={() => setIsEditing(true)}
                  onDelete={onDelete}
                  onSave={onSave}
                  onReport={onReport}
                  onAward={onAward}
                />

                {/* Mobile Vote Controls */}
                {isMobile && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <VoteControls
                      postId={comment.id}
                      initialScore={comment.score}
                      userVote={comment.userVote}
                      onVote={onVote}
                      size="sm"
                      orientation="horizontal"
                    />
                  </div>
                )}

                {/* Reply Form */}
                {showReplyForm && (
                  <div className="mt-2 sm:mt-3">
                    <ReplyForm
                      ref={replyFormRef}
                      onSubmit={handleReply}
                      onCancel={() => setShowReplyForm(false)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Collapsed Comment Preview */}
            {isCollapsed && (
              <div className="flex items-center gap-2 py-1 text-xs sm:text-sm">
                <span className="font-medium truncate">u/{comment.author}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted flex-shrink-0">
                  {comment.score > 0 ? '+' : ''}{comment.score}
                </span>
                <span className="text-muted/40">•</span>
                <span className="text-muted flex-shrink-0">
                  {comment.replies?.length || 0} {comment.replies?.length === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nested Comments */}
        {!isCollapsed && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {shouldShowContinueThread ? (
              <div className={isMobile ? "ml-2 pl-2" : "ml-4 md:ml-6 pl-3 md:pl-4"}>
                <a
                  href={`/c/${comment.community}/comments/${comment.postId}/${comment.id}`}
                  className="inline-flex items-center gap-1 text-accent hover:underline text-xs sm:text-sm"
                >
                  <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Continue thread
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {comment.replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    level={level + 1}
                    maxLevel={maxLevel}
                    onVote={onVote}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSave={onSave}
                    onReport={onReport}
                    onAward={onAward}
                    onToggleCollapse={onToggleCollapse}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Reply Form Component
const ReplyForm = React.forwardRef(({ onSubmit, onCancel }, ref) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} style={{borderColor: "var(--border-subtle)"}} className="rounded-xl border  p-2 sm:p-3 bg-surface/40">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{borderColor: "var(--border-subtle)"}} className="w-full min-h-[80px] p-2 rounded-lg border  bg-surface/60 text-sm resize-y mb-2"
        placeholder="Share your thoughts..."
        disabled={isSubmitting}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-sm btn-ghost text-muted hover:text-primary w-full sm:w-auto"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm btn-primary w-full sm:w-auto"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Reply'}
        </button>
      </div>
    </form>
  )
})

ReplyForm.displayName = 'ReplyForm'



export default Comment