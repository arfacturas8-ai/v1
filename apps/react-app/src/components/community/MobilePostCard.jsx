import React, { useState, useRef, useEffect } from 'react'
import VoteControls from './VoteControls'
import MediaPreview from './MediaPreview'
import Awards from './Awards'
import { useResponsive } from '../../hooks/useResponsive'

const MobilePostCard = ({
  post,
  onVote,
  onComment,
  onShare,
  onSave,
  onReport,
  onAward,
  onSwipeLeft,
  onSwipeRight,
  showCommunity = true,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const cardRef = useRef(null)

  // Minimum distance in px to register as a swipe
  const minSwipeDistance = 50

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwipeActive(true)
  }

  const handleTouchMove = (e) => {
    if (!touchStart || !isSwipeActive) return
    
    const currentTouch = e.targetTouches[0].clientX
    const distance = currentTouch - touchStart
    
    // Limit the swipe distance to create a rubber band effect
    const limitedDistance = distance > 0 
      ? Math.min(distance, 100) 
      : Math.max(distance, -100)
    
    setSwipeOffset(limitedDistance)
    setTouchEnd(currentTouch)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !isSwipeActive) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      onSwipeLeft?.(post.id)
    } else if (isRightSwipe) {
      onSwipeRight?.(post.id)
    }

    // Reset swipe state
    setSwipeOffset(0)
    setIsSwipeActive(false)
    setTouchStart(null)
    setTouchEnd(null)
  }

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - new Date(timestamp).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return 'now'
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(timestamp).toLocaleDateString()
  }

  const formatScore = (num) => {
    if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <article
      ref={cardRef}
      style={{borderColor: "var(--border-subtle)"}} className="relative bg-surface/40 backdrop-blur-sm border  rounded-xl p-3 transition-transform touch-pan-y"
      style={{
        transform: `translateX(${swipeOffset}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Action Indicators */}
      {swipeOffset !== 0 && (
        <>
          {/* Left Swipe Action (Save/Unsave) */}
          {swipeOffset < 0 && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-accent/20 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                <path d="M2 2a2 2 0 012-2h16a2 2 0 012 2v20l-10-6-10 6V2z"/>
              </svg>
            </div>
          )}

          {/* Right Swipe Action (Upvote) */}
          {swipeOffset > 0 && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
                <path d="M12 2l6 6h-4v6h-4V8H6l6-6z"/>
              </svg>
            </div>
          )}
        </>
      )}

      {/* Post Header */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 text-xs text-muted">
          {showCommunity && (
            <>
              <a
                href={`/c/${post.community}`}
                className="font-medium hover:text-accent truncate"
              >
                c/{post.community}
              </a>
              <span className="text-muted/40 flex-shrink-0">•</span>
            </>
          )}
          <a
            href={`/u/${post.author}`}
            className="hover:text-accent flex-shrink-0 truncate"
          >
            u/{post.author}
          </a>
          <span className="text-muted/40 flex-shrink-0">•</span>
          <time dateTime={post.timestamp} className="flex-shrink-0">
            {formatTimestamp(post.timestamp)}
          </time>
          {post.edited && (
            <>
              <span className="text-muted/40 flex-shrink-0 hidden sm:inline">•</span>
              <span className="italic hidden sm:inline">edited</span>
            </>
          )}
        </div>

        {/* Quick Vote Score */}
        <div className="flex items-center ml-2 flex-shrink-0">
          <span className="font-medium text-sm px-2 py-1 rounded bg-white/5">
            {formatScore(post.score)}
          </span>
        </div>
      </header>

      {/* Post Title */}
      <h2 className="font-semibold text-base mb-2 line-clamp-3">
        {post.title}
      </h2>

      {/* Flair */}
      {post.flair && (
        <div className="mb-2">
          <span style={{borderColor: "var(--border-subtle)"}} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border  bg-accent/10 text-accent">
            {post.flair}
          </span>
        </div>
      )}

      {/* Post Content Preview */}
      {post.content && (
        <div className="mb-3">
          <p className="text-secondary text-sm leading-relaxed line-clamp-3">
            {post.content.replace(/<[^>]*>/g, '')} {/* Strip HTML tags for preview */}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media && (
        <div className="mb-3 w-full">
          <MediaPreview
            media={post.media}
            title={post.title}
            compact={false}
          />
        </div>
      )}

      {/* Link Preview */}
      {post.linkUrl && (
        <div className="mb-3">
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{borderColor: "var(--border-subtle)"}} className="block border  rounded-lg p-2 hover:border-accent/50 transition-colors"
          >
            <div className="flex gap-2">
              {post.linkThumbnail && (
                <img
                  src={post.linkThumbnail}
                  alt=""
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {post.linkTitle || post.linkUrl}
                </h3>
                <p className="text-muted text-xs truncate">
                  {new URL(post.linkUrl).hostname}
                </p>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Awards */}
      {post.awards && post.awards.length > 0 && (
        <div className="mb-3">
          <Awards awards={post.awards} size="sm" maxVisible={isMobile ? 4 : 6} />
        </div>
      )}

      {/* Mobile Actions Row */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {/* Vote Controls */}
        <VoteControls
          postId={post.id}
          initialScore={post.score}
          userVote={post.userVote}
          onVote={onVote}
          size="sm"
          orientation="horizontal"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center gap-1 text-muted hover:text-accent transition-colors touch-target"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H6.414l-2.707 2.707A1 1 0 012 12V3z"/>
            </svg>
            <span className="text-xs">{formatScore(post.commentCount || 0)}</span>
          </button>

          <button
            onClick={() => onShare?.(post.id)}
            className="flex items-center gap-1 text-muted hover:text-accent transition-colors touch-target"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 2.5a2.5 2.5 0 11.603 1.628l-6.718 3.12a2.499 2.499 0 010 1.504l6.718 3.12a2.5 2.5 0 11-.488.876l-6.718-3.12a2.5 2.5 0 110-3.256l6.718-3.12A2.5 2.5 0 0111 2.5z"/>
            </svg>
          </button>

          <button
            onClick={() => onSave?.(post.id, !post.isSaved)}
            className={`flex items-center gap-1 transition-colors touch-target ${post.isSaved ? 'text-accent' : 'text-muted hover:text-accent'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill={post.isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13l-6-3-6 3V2z"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}



export default MobilePostCard