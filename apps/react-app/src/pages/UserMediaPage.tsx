import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video, Grid3x3, LayoutGrid } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  postId: string;
  timestamp: string;
  likes: number;
  comments: number;
  caption?: string;
}

const mockMediaItems: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    postId: 'post1',
    timestamp: '2024-01-15T14:30:00Z',
    likes: 245,
    comments: 12,
    caption: 'Beautiful sunset in the city',
  },
  {
    id: '2',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
    postId: 'post2',
    timestamp: '2024-01-14T10:15:00Z',
    likes: 523,
    comments: 34,
    caption: 'Check out this amazing timelapse!',
  },
  {
    id: '3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800',
    postId: 'post3',
    timestamp: '2024-01-13T16:45:00Z',
    likes: 892,
    comments: 56,
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800',
    postId: 'post4',
    timestamp: '2024-01-12T09:20:00Z',
    likes: 134,
    comments: 8,
    caption: 'Morning vibes',
  },
  {
    id: '5',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400',
    postId: 'post5',
    timestamp: '2024-01-11T18:30:00Z',
    likes: 678,
    comments: 45,
  },
  {
    id: '6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    postId: 'post6',
    timestamp: '2024-01-10T12:00:00Z',
    likes: 1243,
    comments: 89,
    caption: 'Exploring new places',
  },
  {
    id: '7',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800',
    postId: 'post7',
    timestamp: '2024-01-09T15:15:00Z',
    likes: 456,
    comments: 23,
  },
  {
    id: '8',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
    postId: 'post8',
    timestamp: '2024-01-08T11:45:00Z',
    likes: 789,
    comments: 67,
    caption: 'Behind the scenes',
  },
  {
    id: '9',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800',
    postId: 'post9',
    timestamp: '2024-01-07T08:30:00Z',
    likes: 321,
    comments: 19,
  },
];

export default function UserMediaPage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [mediaItems] = useState<MediaItem[]>(mockMediaItems);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');

  const filteredItems = mediaItems.filter((item) => {
    if (filter === 'images') return item.type === 'image';
    if (filter === 'videos') return item.type === 'video';
    return true;
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              @{username}'s media
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Layout toggle */}
          <button
            onClick={() => setLayout(layout === 'grid' ? 'masonry' : 'grid')}
            aria-label="Toggle layout"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {layout === 'grid' ? (
              <LayoutGrid size={20} color={colors.text.primary} />
            ) : (
              <Grid3x3 size={20} color={colors.text.primary} />
            )}
          </button>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]} ${spacing[4]}`,
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: filter === 'all' ? colors.brand.primary : colors.bg.secondary,
              color: filter === 'all' ? 'white' : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('images')}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: filter === 'images' ? colors.brand.primary : colors.bg.secondary,
              color: filter === 'images' ? 'white' : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <ImageIcon size={16} />
            Images
          </button>
          <button
            onClick={() => setFilter('videos')}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: filter === 'videos' ? colors.brand.primary : colors.bg.secondary,
              color: filter === 'videos' ? 'white' : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <Video size={16} />
            Videos
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[4] }}>
        {filteredItems.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: layout === 'grid' ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: spacing[2],
            }}
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/post/${item.postId}`)}
                style={{
                  position: 'relative',
                  aspectRatio: layout === 'grid' ? '1 / 1' : 'auto',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: colors.bg.secondary,
                }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.media-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                {/* Media */}
                <img
                  src={item.type === 'video' && item.thumbnail ? item.thumbnail : item.url}
                  alt={item.caption || 'Media'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Video indicator */}
                {item.type === 'video' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: spacing[2],
                      right: spacing[2],
                      padding: `${spacing[1]} ${spacing[2]}`,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[1],
                    }}
                  >
                    <Video size={14} color="white" />
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className="media-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[4],
                    opacity: 0,
                    transition: 'opacity 150ms ease-out',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      color: 'white',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {formatNumber(item.likes)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      color: 'white',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                    </svg>
                    {formatNumber(item.comments)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <ImageIcon size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No {filter === 'all' ? 'media' : filter} yet
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {filter === 'all'
                ? 'When @' + username + ' posts media, it will show up here.'
                : `No ${filter} posted yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
