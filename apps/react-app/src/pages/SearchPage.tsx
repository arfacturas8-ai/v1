import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, Hash } from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../design-system/tokens';
import { debounce, formatNumber } from '../lib/utils';

// Types
type SearchCategory = 'all' | 'users' | 'posts' | 'nfts' | 'collections' | 'communities';

interface RecentSearch {
  id: string;
  query: string;
  timestamp: Date;
}

interface TrendingSearch {
  id: string;
  query: string;
  count: number;
}

interface SearchSuggestion {
  id: string;
  text: string;
  category: SearchCategory;
}

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  avatar?: string;
  thumbnail?: string;
  verified?: boolean;
  metadata?: Record<string, any>;
}

// Mock data
const mockTrending: TrendingSearch[] = [
  { id: '1', query: 'Web3 Gaming', count: 15420 },
  { id: '2', query: 'NFT Drops', count: 12340 },
  { id: '3', query: 'DeFi Alpha', count: 9870 },
  { id: '4', query: 'Metaverse Land', count: 8560 },
  { id: '5', query: 'AI Art', count: 7230 },
];

const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'users',
    title: 'CryptoArtist',
    subtitle: '@cryptoartist • Digital artist creating NFT collections',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    verified: true,
    metadata: { followers: 125000 },
  },
  {
    id: '2',
    type: 'communities',
    title: 'Web3 Builders',
    subtitle: '24.5K members • Building the decentralized future',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=web3builders',
  },
  {
    id: '3',
    type: 'nfts',
    title: 'Cool NFT #1234',
    subtitle: 'Collection Name • 2.5 ETH',
    thumbnail: 'https://picsum.photos/200/200?random=1',
    metadata: { price: '2.5', currency: 'ETH' },
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRecentSearches(
        parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) }))
      );
    }
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock filtering based on query
    const filtered = mockResults.filter((result) =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(filtered);
    setIsLoading(false);

    // Add to recent searches
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: new Date(),
    };

    const updated = [newSearch, ...recentSearches.filter((s) => s.query !== searchQuery)].slice(
      0,
      10
    );
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 300),
    [performSearch]
  );

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (value.trim()) {
      setShowSuggestions(true);
      debouncedSearch(value);
    } else {
      setResults([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      setSearchParams({ q: query });
    }
  };

  // Handle recent search click
  const handleRecentClick = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
    setSearchParams({ q: searchQuery });
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Clear input
  const clearInput = () => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'users':
        navigate(`/user/${result.title.toLowerCase()}`);
        break;
      case 'communities':
        navigate(`/community/${result.id}`);
        break;
      case 'nfts':
        navigate(`/nft/${result.id}`);
        break;
      case 'collections':
        navigate(`/collection/${result.id}`);
        break;
      case 'posts':
        navigate(`/post/${result.id}`);
        break;
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'users', label: 'Users' },
    { id: 'posts', label: 'Posts' },
    { id: 'nfts', label: 'NFTs' },
    { id: 'collections', label: 'Collections' },
    { id: 'communities', label: 'Communities' },
  ] as const;

  const filteredResults =
    activeTab === 'all' ? results : results.filter((r) => r.type === activeTab);

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
          padding: spacing[4],
        }}
      >
        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <div style={{ position: 'relative', marginBottom: spacing[4] }}>
            <Search
              size={20}
              color={colors.text.tertiary}
              style={{
                position: 'absolute',
                left: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for users, posts, NFTs, collections..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[12]}`,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.full,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
            {query && (
              <button
                type="button"
                onClick={clearInput}
                style={{
                  position: 'absolute',
                  right: spacing[4],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing[1],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text.tertiary,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </form>

        {/* Tabs - Only show when there are results */}
        {results.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count =
                tab.id === 'all'
                  ? results.length
                  : results.filter((r) => r.type === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                    <span
                      style={{
                        marginLeft: spacing[2],
                        fontSize: typography.fontSize.xs,
                        opacity: 0.8,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* Empty State - Before Search */}
        {!query && results.length === 0 && (
          <div>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section style={{ marginBottom: spacing[8] }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing[4],
                  }}
                >
                  <h2
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      margin: 0,
                    }}
                  >
                    Recent Searches
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.brand.primary,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      cursor: 'pointer',
                      padding: spacing[2],
                    }}
                  >
                    Clear all
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {recentSearches.slice(0, 5).map((search) => (
                    <button
                      key={search.id}
                      onClick={() => handleRecentClick(search.query)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[3],
                        padding: spacing[3],
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
                      <Clock size={18} color={colors.text.tertiary} />
                      <span
                        style={{
                          flex: 1,
                          color: colors.text.primary,
                          fontSize: typography.fontSize.base,
                        }}
                      >
                        {search.query}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Searches */}
            <section>
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  marginBottom: spacing[4],
                }}
              >
                Trending Searches
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {mockTrending.map((trend, index) => (
                  <button
                    key={trend.id}
                    onClick={() => handleRecentClick(trend.query)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
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
                    <div
                      style={{
                        width: '28px',
                        textAlign: 'center',
                        color: colors.text.tertiary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {index + 1}
                    </div>
                    <TrendingUp size={18} color={colors.brand.primary} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: colors.text.primary,
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.medium,
                        }}
                      >
                        {trend.query}
                      </div>
                      <div
                        style={{
                          color: colors.text.tertiary,
                          fontSize: typography.fontSize.sm,
                        }}
                      >
                        {formatNumber(trend.count)} searches
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
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
        )}

        {/* Results */}
        {!isLoading && query && results.length > 0 && (
          <div>
            <div
              style={{
                marginBottom: spacing[4],
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{query}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
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
                  {/* Avatar/Thumbnail */}
                  {(result.avatar || result.thumbnail) && (
                    <img
                      src={result.avatar || result.thumbnail}
                      alt={result.title}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: result.type === 'users' ? radii.full : radii.lg,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {/* Content */}
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
                      <div
                        style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary,
                          marginTop: spacing[1],
                        }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && query && results.length === 0 && (
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
              Try searching for something else or check your spelling
            </p>

            {/* Suggestions */}
            <div style={{ marginTop: spacing[6] }}>
              <h3
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[3],
                }}
              >
                Popular searches
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' }}>
                {mockTrending.slice(0, 3).map((trend) => (
                  <button
                    key={trend.id}
                    onClick={() => handleRecentClick(trend.query)}
                    style={{
                      padding: `${spacing[2]} ${spacing[4]}`,
                      backgroundColor: colors.bg.elevated,
                      border: 'none',
                      borderRadius: radii.full,
                      color: colors.text.secondary,
                      fontSize: typography.fontSize.sm,
                      cursor: 'pointer',
                      transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                      e.currentTarget.style.color = colors.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                      e.currentTarget.style.color = colors.text.secondary;
                    }}
                  >
                    {trend.query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
