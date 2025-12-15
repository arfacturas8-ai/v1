import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

interface MediaPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  content: string;
  media: MediaItem[];
  likes: number;
  comments: number;
  reposts: number;
  timestamp: string;
  isLiked: boolean;
  isBookmarked: boolean;
}

const mockPost: MediaPost = {
  id: '1',
  author: {
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    isVerified: true,
  },
  content: 'Just dropped my latest collection! 🎨✨ Check out these unique pieces exploring digital identity in the metaverse.',
  media: [
    {
      id: '1',
      type: 'image',
      url: 'https://picsum.photos/seed/media1/1200/800',
      alt: 'Digital art piece 1',
    },
    {
      id: '2',
      type: 'image',
      url: 'https://picsum.photos/seed/media2/1200/800',
      alt: 'Digital art piece 2',
    },
    {
      id: '3',
      type: 'image',
      url: 'https://picsum.photos/seed/media3/1200/800',
      alt: 'Digital art piece 3',
    },
    {
      id: '4',
      type: 'image',
      url: 'https://picsum.photos/seed/media4/1200/800',
      alt: 'Digital art piece 4',
    },
  ],
  likes: 15600,
  comments: 1240,
  reposts: 3400,
  timestamp: '2024-01-15T10:30:00Z',
  isLiked: false,
  isBookmarked: false,
};

export default function MediaViewerPage() {
  const navigate = useNavigate();
  const { postId, mediaIndex } = useParams<{ postId: string; mediaIndex: string }>();
  const [currentIndex, setCurrentIndex] = useState(parseInt(mediaIndex || '0'));
  const [post, setPost] = useState<MediaPost>(mockPost);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < post.media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleLike = () => {
    setPost((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  const handleBookmark = () => {
    setPost((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
    }));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = post.media[currentIndex].url;
    link.download = `media-${currentIndex + 1}.jpg`;
    link.click();
  };

  const currentMedia = post.media[currentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-tertiary)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: spacing[4],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent)',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Close"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <X size={24} color="white" />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <button
            onClick={handleDownload}
            aria-label="Download"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Download size={20} color="white" />
          </button>

          <button
            onClick={() => {}}
            aria-label="Share"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Share2 size={20} color="white" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: spacing[4],
        }}
      >
        {/* Previous button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            aria-label="Previous"
            style={{
              position: 'absolute',
              left: spacing[4],
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ChevronLeft size={32} color="white" />
          </button>
        )}

        {/* Media display */}
        <div
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.alt || 'Media'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
              }}
            />
          )}
        </div>

        {/* Next button */}
        {currentIndex < post.media.length - 1 && (
          <button
            onClick={handleNext}
            aria-label="Next"
            style={{
              position: 'absolute',
              right: spacing[4],
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ChevronRight size={32} color="white" />
          </button>
        )}

        {/* Media counter */}
        {post.media.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: spacing[4],
              left: '50%',
              transform: 'translateX(-50%)',
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '20px',
              color: 'white',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {currentIndex + 1} / {post.media.length}
          </div>
        )}
      </div>

      {/* Post info sidebar */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '80px',
          bottom: 0,
          width: '400px',
          backgroundColor: colors.bg.primary,
          borderLeft: `1px solid ${colors.border.default}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Author info */}
        <div style={{ padding: spacing[4], borderBottom: `1px solid ${colors.border.default}` }}>
          <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
            <img
              src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${post.author.username}`}
              alt={post.author.displayName}
              onClick={() => navigate(`/user/${post.author.username}`)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                <span
                  onClick={() => navigate(`/user/${post.author.username}`)}
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    cursor: 'pointer',
                  }}
                >
                  {post.author.displayName}
                </span>
                {post.author.isVerified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: `0 ${spacing[1]}`,
                      backgroundColor: colors.semantic.success,
                      borderRadius: '2px',
                      fontSize: typography.fontSize.xs,
                      color: 'white',
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                @{post.author.username} · {formatTimestamp(post.timestamp)}
              </div>
            </div>
          </div>

          {/* Content */}
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.primary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {post.content}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: spacing[4],
            display: 'flex',
            alignItems: 'center',
            gap: spacing[4],
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Heart
              size={20}
              color={post.isLiked ? colors.semantic.error : colors.text.tertiary}
              fill={post.isLiked ? colors.semantic.error : 'none'}
            />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: post.isLiked ? colors.semantic.error : colors.text.tertiary,
              }}
            >
              {formatNumber(post.likes)}
            </span>
          </button>

          <button
            onClick={() => navigate(`/post/${post.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <MessageCircle size={20} color={colors.text.tertiary} />
            <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
              {formatNumber(post.comments)}
            </span>
          </button>

          <button
            onClick={handleBookmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginLeft: 'auto',
            }}
          >
            <Bookmark
              size={20}
              color={post.isBookmarked ? colors.brand.primary : colors.text.tertiary}
              fill={post.isBookmarked ? colors.brand.primary : 'none'}
            />
          </button>
        </div>

        {/* Comments placeholder */}
        <div style={{ padding: spacing[4] }}>
          <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, textAlign: 'center' }}>
            Comments coming soon
          </p>
        </div>
      </div>

      {/* Thumbnail strip for multiple images */}
      {post.media.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing[8],
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: spacing[2],
            padding: spacing[2],
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
            maxWidth: '80vw',
            overflowX: 'auto',
          }}
        >
          {post.media.map((media, index) => (
            <button
              key={media.id}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '60px',
                height: '60px',
                padding: 0,
                border: index === currentIndex ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: index === currentIndex ? 1 : 0.5,
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = index === currentIndex ? '1' : '0.5';
              }}
            >
              <img
                src={media.url}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
