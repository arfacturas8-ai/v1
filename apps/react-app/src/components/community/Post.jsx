import React, { useState, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import VoteControls from './VoteControls'
import PostActions from './PostActions'
import Awards from './Awards'
import MediaPreview from './MediaPreview'
import { useResponsive } from '../../hooks/useResponsive'

const Post = ({
  post,
  onVote,
  onComment,
  onShare,
  onSave,
  onReport,
  onAward,
  compact = false,
  showCommunity = true,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState('auto')

  useEffect(() => {
    if (contentRef.current && post.content && post.content.length > 500) {
      setContentHeight(isExpanded ? 'auto' : '120px')
    }
  }, [isExpanded, post.content])

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 30) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const truncateText = (text, maxLength = 500) => {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const handlePostClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.vote-controls')) {
      return
    }
    // Handle post navigation
    window.location.href = `/c/${post.community.name || post.community}/posts/${post.id}`
  }

  return (
    <article
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8EAED',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s',
        marginBottom: '8px'
      }}
      role="article"
      aria-labelledby={`post-${post.id}-title`}
    >
      <div className={isMobile ? "flex flex-col gap-2" : "flex gap-3"}>
        {/* Vote Controls */}
        {!isMobile && (
          <div className="flex-shrink-0">
            <VoteControls
              postId={post.id}
              initialScore={post.score}
              userVote={post.userVote}
              onVote={onVote}
              size={compact ? 'sm' : 'md'}
              orientation="vertical"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <header className="flex items-center flex-wrap gap-1.5 mb-2 text-xs sm:text-sm text-muted">
            {showCommunity && (
              <>
                <a
                  href={`/c/${post.community}`}
                  className="font-medium hover:text-accent truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  c/{post.community}
                </a>
                <span className="text-muted/40">•</span>
              </>
            )}
            <span className="hidden sm:inline">by</span>
            <a
              href={`/u/${post.author}`}
              className="font-medium hover:text-accent truncate"
              onClick={(e) => e.stopPropagation()}
            >
              u/{post.author}
            </a>
            <span className="text-muted/40">•</span>
            <time dateTime={post.timestamp} className="flex-shrink-0">
              {formatTimestamp(post.timestamp)}
            </time>
            {post.edited && (
              <>
                <span className="text-muted/40 hidden sm:inline">•</span>
                <span className="italic text-muted/60 hidden sm:inline">edited</span>
              </>
            )}
          </header>

          {/* Post Title */}
          <h2
            id={`post-${post.id}-title`}
            className="font-semibold text-base sm:text-lg md:text-xl mb-2 cursor-pointer hover:text-accent line-clamp-3"
            onClick={handlePostClick}
          >
            {post.title}
          </h2>

          {/* Flair */}
          {post.flair && (
            <div className="mb-2">
              <span className="badge" style={{
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--color-info-light)',
                color: 'var(--brand-primary)'
              }}>
                {post.flair}
              </span>
            </div>
          )}

          {/* Media Content */}
          {post.media && !compact && (
            <div className="mb-3 w-full">
              <MediaPreview
                media={post.media}
                title={post.title}
                onExpand={() => setShowFullImage(!showFullImage)}
                isExpanded={showFullImage}
              />
            </div>
          )}

          {/* Text Content */}
          {post.content && (
            <div className="mb-3">
              <div
                ref={contentRef}
                className="text-sm sm:text-base text-secondary/90 leading-relaxed overflow-hidden"
                style={{ maxHeight: contentHeight }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(isExpanded ? post.content : truncateText(post.content))
                }}
              />
              {post.content.length > 500 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className="mt-2 text-accent font-medium inline-flex items-center gap-1 text-sm hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Link Preview */}
          {post.linkUrl && !compact && (
            <div className="mb-3">
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  display: 'block',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-2)',
                  transition: 'all var(--transition-normal)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {post.linkThumbnail && (
                    <img
                      src={post.linkThumbnail}
                      alt=""
                      className="w-full sm:w-16 sm:h-16 h-32 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-1">
                      {post.linkTitle || post.linkUrl}
                    </h3>
                    {post.linkDescription && (
                      <p className="text-muted/80 text-xs sm:text-sm line-clamp-2 mb-1">
                        {post.linkDescription}
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-muted text-xs">
                      <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate">{new URL(post.linkUrl).hostname}</span>
                    </p>
                  </div>
                </div>
              </a>
            </div>
          )}

          {/* Awards */}
          {post.awards && post.awards.length > 0 && (
            <div className="mb-3">
              <Awards awards={post.awards} size={compact || isMobile ? 'sm' : 'md'} />
            </div>
          )}

          {/* Post Actions */}
          <PostActions
            post={post}
            onComment={onComment}
            onShare={onShare}
            onSave={onSave}
            onReport={onReport}
            onAward={onAward}
            compact={compact || isMobile}
          />

          {/* Mobile Vote Controls */}
          {isMobile && (
            <div style={{borderColor: "var(--border-subtle)"}} className="mt-3 pt-3 border-t ">
              <VoteControls
                postId={post.id}
                initialScore={post.score}
                userVote={post.userVote}
                onVote={onVote}
                size="sm"
                orientation="horizontal"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Media Preview for Compact View */}
      {post.media && compact && (
        <div className="mt-3 ml-0 sm:ml-8 md:ml-12 sm:pl-3 sm:border-l border-border-primary/20 w-full">
          <MediaPreview
            media={post.media}
            title={post.title}
            compact={true}
          />
        </div>
      )}
    </article>
  )
}



export default Post