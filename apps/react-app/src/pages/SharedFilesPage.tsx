import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, File, FileText, Image as ImageIcon, Video, Music, Download, ExternalLink } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface SharedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  size: number;
  url: string;
  thumbnail?: string;
  sharedBy: {
    username: string;
    displayName: string;
  };
  sharedAt: string;
}

const mockFiles: SharedFile[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'document',
    size: 2456789,
    url: '#',
    sharedBy: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
    },
    sharedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    name: 'Design Mockups.fig',
    type: 'other',
    size: 15678901,
    url: '#',
    sharedBy: {
      username: 'bob_designer',
      displayName: 'Bob Smith',
    },
    sharedAt: '2024-01-14T10:15:00Z',
  },
  {
    id: '3',
    name: 'Screenshot 2024-01-13.png',
    type: 'image',
    size: 1234567,
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100',
    sharedBy: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
    },
    sharedAt: '2024-01-13T16:45:00Z',
  },
  {
    id: '4',
    name: 'Meeting Recording.mp4',
    type: 'video',
    size: 45678901,
    url: '#',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=100',
    sharedBy: {
      username: 'bob_designer',
      displayName: 'Bob Smith',
    },
    sharedAt: '2024-01-12T11:20:00Z',
  },
  {
    id: '5',
    name: 'Requirements.docx',
    type: 'document',
    size: 987654,
    url: '#',
    sharedBy: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
    },
    sharedAt: '2024-01-10T09:00:00Z',
  },
];

export default function SharedFilesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [files] = useState<SharedFile[]>(mockFiles);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document' | 'other'>('all');

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || file.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} color={colors.text.tertiary} />;
      case 'video':
        return <Video size={20} color={colors.text.tertiary} />;
      case 'audio':
        return <Music size={20} color={colors.text.tertiary} />;
      case 'document':
        return <FileText size={20} color={colors.text.tertiary} />;
      default:
        return <File size={20} color={colors.text.tertiary} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
              Shared files
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={20}
              color={colors.text.tertiary}
              style={{
                position: 'absolute',
                left: spacing[3],
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '24px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]} ${spacing[4]}`,
            overflowX: 'auto',
          }}
        >
          {['all', 'image', 'video', 'document', 'other'].map((typeFilter) => (
            <button
              key={typeFilter}
              onClick={() => setFilter(typeFilter as typeof filter)}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: '24px',
                border: 'none',
                backgroundColor: filter === typeFilter ? colors.brand.primary : colors.bg.secondary,
                color: filter === typeFilter ? 'white' : colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
              }}
            >
              {/* Thumbnail or icon */}
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    backgroundColor: colors.bg.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getFileIcon(file.type)}
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    marginBottom: spacing[1],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  {formatFileSize(file.size)}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Shared by {file.sharedBy.displayName} • {formatDate(file.sharedAt)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
                <button
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
                  <Download size={20} color={colors.text.tertiary} />
                </button>
                <button
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
                  <ExternalLink size={20} color={colors.text.tertiary} />
                </button>
              </div>
            </div>
          ))
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
              <File size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No files found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No files match "${searchQuery}"`
                : 'Files shared in this conversation will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
