import React, { useState, useRef, useEffect } from 'react'

const MediaPreview = ({ 
  media, 
  title, 
  onExpand, 
  isExpanded = false,
  compact = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const videoRef = useRef(null)
  const imageRef = useRef(null)

  const handleImageLoad = () => {
    setIsLoaded(true)
    setHasError(false)
  }

  const handleImageError = () => {
    setHasError(true)
    setIsLoaded(false)
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleVideoClick = (e) => {
    e.stopPropagation()
    toggleVideoPlay()
  }

  const getMediaDimensions = () => {
    if (compact) {
      return { maxWidth: '120px', maxHeight: '120px' }
    }
    
    if (media.width && media.height) {
      const aspectRatio = media.height / media.width
      const maxWidth = 600
      const maxHeight = 400
      
      if (media.width <= maxWidth && media.height <= maxHeight) {
        return { width: media.width, height: media.height }
      }
      
      if (aspectRatio > maxHeight / maxWidth) {
        return { width: maxHeight / aspectRatio, height: maxHeight }
      } else {
        return { width: maxWidth, height: maxWidth * aspectRatio }
      }
    }
    
    return { maxWidth: '100%', maxHeight: compact ? '120px' : '400px' }
  }

  const dimensions = getMediaDimensions()

  const containerClasses = `
    relative overflow-hidden rounded-lg bg-bg-tertiary
    ${compact ? 'flex-shrink-0' : 'w-full'}
    ${!isLoaded && !hasError ? '' : ''}
  `

  if (media.type === 'image') {
    return (
      <div 
        className={containerClasses}
        style={dimensions}
        onClick={onExpand}
        role="button"
        tabIndex={0}
        aria-label="View full image"
      >
        {!isLoaded && !hasError && (
          <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%'
}} />
          </div>
        )}
        
        {hasError ? (
          <div style={{
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-2">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span className="text-xs">Failed to load image</span>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={media.url}
            alt={title || 'Post image'}
            style={{
  width: '100%',
  height: '100%'
}}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Expand Icon */}
        {!compact && isLoaded && !hasError && (
          <div style={{
  position: 'absolute',
  borderRadius: '50%',
  padding: '4px'
}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M1.5 10.5v4a.5.5 0 00.5.5h4a.5.5 0 000-1H3.207L6.5 10.707a.5.5 0 10-.707-.707L2.5 13.293V10.5a.5.5 0 00-1 0zm13-5v-4a.5.5 0 00-.5-.5h-4a.5.5 0 000 1h2.793L9.5 5.293a.5.5 0 10.707.707L13.5 2.707V5.5a.5.5 0 001 0z"/>
            </svg>
          </div>
        )}
      </div>
    )
  }

  if (media.type === 'video') {
    return (
      <div 
        className={containerClasses}
        style={dimensions}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={media.url}
          poster={media.thumbnail}
          style={{
  width: '100%',
  height: '100%'
}}
          onClick={handleVideoClick}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          preload="metadata"
          muted
          loop
        />

        {/* Play/Pause Overlay */}
        <div 
          style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center'
}}
          onClick={handleVideoClick}
        >
          <div style={{
  borderRadius: '50%',
  padding: '12px'
}}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>

        {/* Video Duration */}
        {media.duration && (
          <div style={{
  position: 'absolute',
  color: '#ffffff',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
            {media.duration}
          </div>
        )}
      </div>
    )
  }

  if (media.type === 'gif') {
    return (
      <div className={containerClasses} style={dimensions}>
        <img
          src={media.url}
          alt={title || 'GIF'}
          style={{
  width: '100%',
  height: '100%'
}}
          loading="lazy"
        />
        
        {/* GIF Badge */}
        <div style={{
  position: 'absolute',
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
          GIF
        </div>
      </div>
    )
  }

  if (media.type === 'gallery') {
    return (
      <div style={{
  display: 'grid',
  gap: '4px',
  ...dimensions
}}>
        {media.images?.slice(0, 4).map((image, index) => (
          <div key={index} style={{
  position: 'relative'
}}>
            <img
              src={image.url}
              alt={`Gallery image ${index + 1}`}
              style={{
  width: '100%',
  height: '100%'
}}
              loading="lazy"
            />
            
            {/* Show count overlay on last image if more than 4 */}
            {index === 3 && media.images.length > 4 && (
              <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <span style={{
  color: '#ffffff',
  fontWeight: '600'
}}>
                  +{media.images.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Fallback for unknown media types
  return (
    <div className={containerClasses} style={dimensions}>
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%'
}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-2">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <span className="text-xs">Media content</span>
      </div>
    </div>
  )
}



export default MediaPreview