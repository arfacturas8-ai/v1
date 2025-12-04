import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Bookmark,
  X,
} from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../design-system/tokens';
import { formatNumber, debounce } from '../lib/utils';

// Types
type SearchCategory = 'all' | 'users' | 'posts' | 'nfts' | 'collections' | 'communities';
type SortOption = 'relevant' | 'recent' | 'popular' | 'price_high' | 'price_low';
type ViewMode = 'list' | 'grid';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

interface SearchFilters {
  category: SearchCategory;
  sort: SortOption;
  dateFilter: DateFilter;
  verifiedOnly: boolean;
  hasMedia: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  thumbnail?: string;
  verified?: boolean;
  metadata?: {
    followers?: number;
    members?: number;
    likes?: number;
    price?: string;
    currency?: string;
    timestamp?: Date;
  };
}

// Mock data
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'users',
    title: 'CryptoArtist',
    subtitle: '@cryptoartist',
    description: 'Digital artist creating NFT collections',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    verified: true,
    metadata: { followers: 125000, timestamp: new Date(Date.now() - 86400000) },
  },
  {
    id: '2',
    type: 'nfts',
    title: 'Cool NFT #1234',
    subtitle: 'Collection Name',
    thumbnail: 'https://picsum.photos/400/400?random=1',
    metadata: { price: '2.5', currency: 'ETH', likes: 1240, timestamp: new Date(Date.now() - 3600000) },
  },
  {
    id: '3',
    type: 'collections',
    title: 'Amazing Collection',
    subtitle: 'by Creator Name',
    thumbnail: 'https://picsum.photos/400/400?random=2',
    verified: true,
    metadata: { price: '0.5', currency: 'ETH', timestamp: new Date(Date.now() - 172800000) },
  },
  {
    id: '4',
    type: 'communities',
    title: 'Web3 Builders',
    subtitle: '24.5K members',
    description: 'Building the decentralized future together',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=web3builders',
    metadata: { members: 24500, timestamp: new Date(Date.now() - 259200000) },
  },
  {
    id: '5',
    type: 'posts',
    title: 'Amazing post about Web3',
    subtitle: 'by @username • 2h ago',
    description: 'This is an amazing post about the future of Web3 and decentralization...',
    thumbnail: 'https://picsum.photos/400/300?random=3',
    metadata: { likes: 456, timestamp: new Date(Date.now() - 7200000) },
  },
];

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    sort: 'relevant',
    dateFilter: 'all',
    verifiedOnly: false,
    hasMedia: false,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const resultsPerPage = 20;

  // Load results
  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters, currentPage]);

  // Load saved searches
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const performSearch = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filtered = [...mockResults];

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter((r) => r.type === filters.category);
    }

    // Filter by verified
    if (filters.verifiedOnly) {
      filtered = filtered.filter((r) => r.verified);
    }

    // Filter by media
    if (filters.hasMedia) {
      filtered = filtered.filter((r) => r.thumbnail);
    }

    // Sort
    switch (filters.sort) {
      case 'recent':
        filtered.sort(
          (a, b) => (b.metadata?.timestamp?.getTime() || 0) - (a.metadata?.timestamp?.getTime() || 0)
        );
        break;
      case 'popular':
        filtered.sort(
          (a, b) =>
            (b.metadata?.likes || b.metadata?.followers || b.metadata?.members || 0) -
            (a.metadata?.likes || a.metadata?.followers || a.metadata?.members || 0)
        );
        break;
      case 'price_high':
        filtered.sort(
          (a, b) => parseFloat(b.metadata?.price || '0') - parseFloat(a.metadata?.price || '0')
        );
        break;
      case 'price_low':
        filtered.sort(
          (a, b) => parseFloat(a.metadata?.price || '0') - parseFloat(b.metadata?.price || '0')
        );
        break;
    }

    setResults(filtered);
    setTotalResults(filtered.length);
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      setCurrentPage(1);
      performSearch();
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const toggleSaveSearch = () => {
    const searchKey = `${query}|${filters.category}|${filters.sort}`;
    const updated = savedSearches.includes(searchKey)
      ? savedSearches.filter((s) => s !== searchKey)
      : [...savedSearches, searchKey];

    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const isSaved = savedSearches.includes(`${query}|${filters.category}|${filters.sort}`);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'users', label: 'Users' },
    { id: 'posts', label: 'Posts' },
    { id: 'nfts', label: 'NFTs' },
    { id: 'collections', label: 'Collections' },
    { id: 'communities', label: 'Communities' },
  ] as const;

  const sortOptions = [
    { id: 'relevant', label: 'Most Relevant' },
    { id: 'recent', label: 'Most Recent' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'price_high', label: 'Price: High to Low' },
    { id: 'price_low', label: 'Price: Low to High' },
  ] as const;

  const dateOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ] as const;

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
              borderRadius: radii.full,
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
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

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                placeholder="Refine search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: `${spacing[3]} ${spacing[10]}`,
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radii.full,
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
          </form>

          <button
            onClick={toggleSaveSearch}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: radii.full,
              border: 'none',
              backgroundColor: isSaved ? colors.brand.primary : colors.bg.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              if (!isSaved) {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaved) {
                e.currentTarget.style.backgroundColor = colors.bg.elevated;
              }
            }}
            aria-label={isSaved ? 'Unsave search' : 'Save search'}
          >
            <Bookmark size={20} color={isSaved ? colors.text.primary : colors.text.secondary} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]} ${spacing[3]}`,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {tabs.map((tab) => {
            const isActive = filters.category === tab.id;
            const count =
              tab.id === 'all' ? results.length : results.filter((r) => r.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => handleFilterChange({ category: tab.id })}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: isActive ? colors.brand.primary : colors.bg.elevated,
                  color: isActive ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                  }
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{ marginLeft: spacing[2], fontSize: typography.fontSize.xs, opacity: 0.8 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[4],
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
        </div>

        <div style={{ display: 'flex', gap: spacing[2] }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: showFilters ? colors.brand.primary : colors.bg.elevated,
              border: 'none',
              borderRadius: radii.md,
              color: showFilters ? colors.text.primary : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          {(filters.category === 'nfts' || filters.category === 'collections') && (
            <div style={{ display: 'flex', gap: spacing[1], backgroundColor: colors.bg.elevated, borderRadius: radii.md, padding: spacing[1] }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: spacing[2],
                  backgroundColor: viewMode === 'list' ? colors.bg.hover : 'transparent',
                  border: 'none',
                  borderRadius: radii.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <List size={16} color={viewMode === 'list' ? colors.text.primary : colors.text.tertiary} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: spacing[2],
                  backgroundColor: viewMode === 'grid' ? colors.bg.hover : 'transparent',
                  border: 'none',
                  borderRadius: radii.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Grid size={16} color={viewMode === 'grid' ? colors.text.primary : colors.text.tertiary} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[4] }}>
            {/* Sort */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[2],
                }}
              >
                Sort by
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value as SortOption })}
                style={{
                  width: '100%',
                  padding: spacing[2],
                  backgroundColor: colors.bg.elevated,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  outline: 'none',
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[2],
                }}
              >
                Date
              </label>
              <select
                value={filters.dateFilter}
                onChange={(e) => handleFilterChange({ dateFilter: e.target.value as DateFilter })}
                style={{
                  width: '100%',
                  padding: spacing[2],
                  backgroundColor: colors.bg.elevated,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  outline: 'none',
                }}
              >
                {dateOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  cursor: 'pointer',
                  marginBottom: spacing[2],
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleFilterChange({ verifiedOnly: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                  Verified only
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.hasMedia}
                  onChange={(e) => handleFilterChange({ hasMedia: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                  Has media
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[4] }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${colors.bg.elevated}`,
                borderTopColor: colors.brand.primary,
                borderRadius: radii.full,
                margin: '0 auto',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: radii.full,
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <Search size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No results found
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div
            style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              ...(viewMode === 'grid'
                ? {
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: spacing[4],
                  }
                : {
                    flexDirection: 'column',
                    gap: spacing[3],
                  }),
            }}
          >
            {results.map((result) => (
              <ResultCard key={result.id} result={result} viewMode={viewMode} onClick={() => navigate(`/${result.type}/${result.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Result Card Component
interface ResultCardProps {
  result: SearchResult;
  viewMode: ViewMode;
  onClick: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, viewMode, onClick }) => {
  if (viewMode === 'grid') {
    return (
      <button
        onClick={onClick}
        style={{
          backgroundColor: colors.bg.secondary,
          border: 'none',
          borderRadius: radii.lg,
          overflow: 'hidden',
          cursor: 'pointer',
          textAlign: 'left',
          transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.bg.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.bg.secondary;
        }}
      >
        {result.thumbnail && (
          <img
            src={result.thumbnail}
            alt={result.title}
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
            }}
          />
        )}
        <div style={{ padding: spacing[3] }}>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[1],
            }}
          >
            {result.title}
          </div>
          {result.subtitle && (
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {result.subtitle}
            </div>
          )}
          {result.metadata?.price && (
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.brand.primary,
                marginTop: spacing[2],
              }}
            >
              {result.metadata.price} {result.metadata.currency}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: colors.bg.secondary,
        border: 'none',
        borderRadius: radii.lg,
        cursor: 'pointer',
        textAlign: 'left',
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.secondary;
      }}
    >
      {(result.avatar || result.thumbnail) && (
        <img
          src={result.avatar || result.thumbnail}
          alt={result.title}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: result.type === 'users' ? radii.full : radii.lg,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <span
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {result.title}
          </span>
          {result.verified && (
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

        {result.subtitle && (
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: spacing[1] }}>
            {result.subtitle}
          </div>
        )}

        {result.description && (
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginTop: spacing[2],
            }}
          >
            {result.description}
          </div>
        )}

        {result.metadata && (
          <div style={{ display: 'flex', gap: spacing[4], marginTop: spacing[2], fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
            {result.metadata.followers !== undefined && <span>{formatNumber(result.metadata.followers)} followers</span>}
            {result.metadata.members !== undefined && <span>{formatNumber(result.metadata.members)} members</span>}
            {result.metadata.likes !== undefined && <span>{formatNumber(result.metadata.likes)} likes</span>}
            {result.metadata.price && (
              <span style={{ color: colors.brand.primary, fontWeight: typography.fontWeight.semibold }}>
                {result.metadata.price} {result.metadata.currency}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
