import React, { useEffect, useRef, useCallback } from 'react'
import { Loader } from 'lucide-react'

/**
 * InfiniteScroll Component
 * Automatically loads more items when scrolling to bottom
 */

const InfiniteScroll = ({
  children,
  hasMore = true,
  loading = false,
  onLoadMore,
  threshold = 200,
  loader,
  endMessage,
  className = ''
}) => {
  const observerTarget = useRef(null)

  const handleObserver = useCallback((entries) => {
    const [entry] = entries
    if (entry.isIntersecting && hasMore && !loading) {
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore])

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    }

    const observer = new IntersectionObserver(handleObserver, options)
    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver, threshold])

  return (
    <div className={className}>
      {children}

      {/* Observer target */}
      <div ref={observerTarget} style={{
  width: '100%',
  height: '40px'
}} />

      {/* Loading indicator */}
      {loading && (
        loader || (
          <div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Loader style={{
  width: '32px',
  height: '32px'
}} />
          </div>
        )
      )}

      {/* End message */}
      {!hasMore && !loading && (
        endMessage || (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px',
  color: '#8b949e'
}}>
            <p>You've reached the end</p>
          </div>
        )
      )}
    </div>
  )
}




export default InfiniteScroll
