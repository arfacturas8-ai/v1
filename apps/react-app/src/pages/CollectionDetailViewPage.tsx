/**
 * Collection Detail View Page
 * View-only collection page with filtering, sorting, and NFT grid
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  MoreVertical,
  Search,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  Users,
  Image as ImageIcon,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { SearchInput } from '../components/ui/input';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../components/ui/modal';
import { cn, formatNumber, truncate, debounce } from '../lib/utils';

// Types
interface Collection {
  id: string;
  name: string;
  description: string;
  banner: string;
  avatar: string;
  verified: boolean;
  contractAddress: string;
  blockchain: string;
  creator: {
    address: string;
    name?: string;
    avatar?: string;
  };
  stats: {
    itemsCount: number;
    ownersCount: number;
    floorPrice?: number;
    totalVolume?: number;
  };
  socialLinks?: {
    website?: string;
    twitter?: string;
    discord?: string;
  };
}

interface NFTCard {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// NFT Card Component
const NFTCardComponent: React.FC<{
  nft: NFTCard;
  onClick: () => void;
  viewMode: 'grid' | 'list';
}> = ({ nft, onClick, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card variant="interactive" onClick={onClick} className="cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{nft.name}</h3>
            <p className="text-sm text-muted-foreground">Token ID: {nft.tokenId}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline">View</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="interactive" onClick={onClick} className="cursor-pointer group">
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-1">{nft.name}</h3>
        <p className="text-sm text-muted-foreground">#{nft.tokenId}</p>
      </CardContent>
    </Card>
  );
};

// Filter Panel Component
const FilterPanel: React.FC<{
  traits: Record<string, string[]>;
  selectedTraits: Record<string, string[]>;
  onTraitToggle: (traitType: string, value: string) => void;
  onClearAll: () => void;
}> = ({ traits, selectedTraits, onTraitToggle, onClearAll }) => {
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());

  const toggleTrait = (traitType: string) => {
    const newExpanded = new Set(expandedTraits);
    if (newExpanded.has(traitType)) {
      newExpanded.delete(traitType);
    } else {
      newExpanded.add(traitType);
    }
    setExpandedTraits(newExpanded);
  };

  const hasSelectedTraits = Object.values(selectedTraits).some((values) => values.length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filters</CardTitle>
        {hasSelectedTraits && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(traits).map(([traitType, values]) => (
          <div key={traitType} className="border-b border-border pb-4 last:border-0">
            <button
              onClick={() => toggleTrait(traitType)}
              className="w-full flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
            >
              <span className="font-medium">{traitType}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  expandedTraits.has(traitType) && 'rotate-180'
                )}
              />
            </button>
            {expandedTraits.has(traitType) && (
              <div className="space-y-2 mt-2">
                {values.map((value) => {
                  const isSelected =
                    selectedTraits[traitType]?.includes(value) || false;
                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onTraitToggle(traitType, value)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{value}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.floor(Math.random() * 100)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export function CollectionDetailViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [nfts, setNfts] = useState<NFTCard[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFTCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'tokenId' | 'name' | 'recent'>('tokenId');
  const [showFilters, setShowFilters] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
  const [availableTraits, setAvailableTraits] = useState<Record<string, string[]>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Simulate loading collection data
    const loadCollection = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockCollection: Collection = {
          id: id || '1',
          name: 'Bored Ape Yacht Club',
          description:
            'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits.',
          banner: 'https://via.placeholder.com/1200x300/6366F1/FFFFFF?text=Collection+Banner',
          avatar: 'https://via.placeholder.com/200/F59E0B/FFFFFF?text=BAYC',
          verified: true,
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          blockchain: 'Ethereum',
          creator: {
            address: '0x9876543210fedcba9876543210fedcba98765432',
            name: 'Yuga Labs',
            avatar: 'https://via.placeholder.com/100/6366F1/FFFFFF?text=YL',
          },
          stats: {
            itemsCount: 10000,
            ownersCount: 6400,
            floorPrice: 30.5,
            totalVolume: 654321,
          },
          socialLinks: {
            website: 'https://boredapeyachtclub.com',
            twitter: 'https://twitter.com/BoredApeYC',
            discord: 'https://discord.gg/bayc',
          },
        };

        // Mock NFTs
        const mockNfts: NFTCard[] = Array.from({ length: 24 }, (_, i) => ({
          id: `nft-${i}`,
          tokenId: String(i + 1000),
          name: `Bored Ape #${i + 1000}`,
          image: `https://via.placeholder.com/300/6366F1/FFFFFF?text=Ape+${i + 1000}`,
          attributes: [
            { trait_type: 'Background', value: ['Blue', 'Orange', 'Purple'][i % 3] },
            { trait_type: 'Fur', value: ['Brown', 'Tan', 'Black'][i % 3] },
            { trait_type: 'Clothes', value: ['Striped Tee', 'Leather Jacket', 'Sailor Shirt'][i % 3] },
          ],
        }));

        // Extract available traits
        const traits: Record<string, Set<string>> = {};
        mockNfts.forEach((nft) => {
          nft.attributes?.forEach((attr) => {
            if (!traits[attr.trait_type]) {
              traits[attr.trait_type] = new Set();
            }
            traits[attr.trait_type].add(String(attr.value));
          });
        });

        const traitsObject: Record<string, string[]> = {};
        Object.entries(traits).forEach(([key, value]) => {
          traitsObject[key] = Array.from(value);
        });

        setCollection(mockCollection);
        setNfts(mockNfts);
        setFilteredNfts(mockNfts);
        setAvailableTraits(traitsObject);
      } catch (error) {
        console.error('Error loading collection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [id]);

  // Filter and sort NFTs
  useEffect(() => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (nft) =>
          nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.tokenId.includes(searchQuery)
      );
    }

    // Apply trait filters
    Object.entries(selectedTraits).forEach(([traitType, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((nft) =>
          nft.attributes?.some(
            (attr) => attr.trait_type === traitType && values.includes(String(attr.value))
          )
        );
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tokenId':
          return Number(a.tokenId) - Number(b.tokenId);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  }, [nfts, searchQuery, selectedTraits, sortBy]);

  const handleSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const handleTraitToggle = (traitType: string, value: string) => {
    setSelectedTraits((prev) => {
      const current = prev[traitType] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      if (newValues.length === 0) {
        const { [traitType]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [traitType]: newValues,
      };
    });
  };

  const handleClearFilters = () => {
    setSelectedTraits({});
    setSearchQuery('');
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simulate loading more NFTs
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In a real app, you would fetch more NFTs from the API
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="">
          <div className="h-64 bg-muted" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-32 bg-muted rounded-lg mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Collection Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The collection you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeFiltersCount = Object.values(selectedTraits).reduce(
    (sum, values) => sum + values.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-primary to-secondary">
        <img
          src={collection.banner}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div style={{background: "var(--bg-primary)"}} className="absolute inset-0 /20" />
        <Button
          variant="glass"
          size="icon"
          className="absolute top-4 left-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="glass" size="icon" onClick={() => setShowShareModal(true)}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="glass" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Collection Info */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Avatar
              src={collection.avatar}
              fallback={collection.name.substring(0, 2)}
              size="2xl"
              className="ring-4 ring-background"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                {collection.verified && (
                  <Badge variant="gradient-cyan" size="lg">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{collection.description}</p>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Items</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(collection.stats.itemsCount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owners</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(collection.stats.ownersCount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Blockchain</div>
                  <div className="text-xl font-semibold">{collection.blockchain}</div>
                </div>
              </div>
              {collection.socialLinks && (
                <div className="flex gap-2">
                  {collection.socialLinks.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(collection.socialLinks?.website, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Website
                    </Button>
                  )}
                  {collection.socialLinks.twitter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(collection.socialLinks?.twitter, '_blank')}
                    >
                      Twitter
                    </Button>
                  )}
                  {collection.socialLinks.discord && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(collection.socialLinks?.discord, '_blank')}
                    >
                      Discord
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Marketplace Coming Soon */}
        <Card variant="gradient" className="mb-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Marketplace Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              NFT trading features will be available in the next update
            </p>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by name or token ID..."
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="tokenId">Token ID</option>
                <option value="name">Name</option>
                <option value="recent">Recently Added</option>
              </select>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {Object.entries(selectedTraits).map(([traitType, values]) =>
                values.map((value) => (
                  <Badge
                    key={`${traitType}-${value}`}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleTraitToggle(traitType, value)}
                  >
                    {traitType}: {value}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))
              )}
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <FilterPanel
                traits={availableTraits}
                selectedTraits={selectedTraits}
                onTraitToggle={handleTraitToggle}
                onClearAll={handleClearFilters}
              />
            </div>
          )}

          {/* NFT Grid */}
          <div className={cn('lg:col-span-3', !showFilters && 'lg:col-span-4')}>
            {filteredNfts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                  )}
                >
                  {filteredNfts.map((nft) => (
                    <NFTCardComponent
                      key={nft.id}
                      nft={nft}
                      viewMode={viewMode}
                      onClick={() => navigate(`/nft/${nft.id}`)}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      loading={loadingMore}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal open={showShareModal} onOpenChange={setShowShareModal}>
        <ModalHeader>
          <ModalTitle>Share Collection</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
              <Button variant="outline">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default CollectionDetailViewPage;
