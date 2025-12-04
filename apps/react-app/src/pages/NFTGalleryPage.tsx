/**
 * NFT Gallery Page
 * User's NFT gallery with filtering, sorting, and collection grouping
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid3x3,
  List,
  Layers,
  Search,
  SlidersHorizontal,
  Wallet,
  Image as ImageIcon,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { SearchInput } from '../components/ui/input';
import { cn, formatNumber, debounce } from '../lib/utils';

// Types
interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  blockchain: string;
}

interface Collection {
  id: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  nftCount: number;
}

// NFT Card Component
const NFTCard: React.FC<{
  nft: NFT;
  onClick: () => void;
  viewMode: 'grid' | 'list';
  showCollection?: boolean;
}> = ({ nft, onClick, viewMode, showCollection = true }) => {
  if (viewMode === 'list') {
    return (
      <Card variant="interactive" onClick={onClick} className="cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/64/6366F1/FFFFFF?text=NFT';
            }}
          />
          <div className="flex-1">
            <h3 className="font-semibold">{nft.name}</h3>
            {showCollection && (
              <div className="flex items-center gap-1 mt-1">
                {nft.collection.avatar && (
                  <Avatar
                    src={nft.collection.avatar}
                    fallback={nft.collection.name.substring(0, 2)}
                    size="xs"
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {nft.collection.name}
                </span>
                {nft.collection.verified && (
                  <Badge variant="gradient-cyan" size="sm">
                    ✓
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <Badge variant="outline">{nft.blockchain}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="interactive" onClick={onClick} className="cursor-pointer group">
      <div className="aspect-square overflow-hidden rounded-t-lg relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300/6366F1/FFFFFF?text=NFT';
          }}
        />
        <Badge
          variant="glass"
          className="absolute top-2 right-2"
          size="sm"
        >
          {nft.blockchain}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-1">{nft.name}</h3>
        {showCollection && (
          <div className="flex items-center gap-1">
            {nft.collection.avatar && (
              <Avatar
                src={nft.collection.avatar}
                fallback={nft.collection.name.substring(0, 2)}
                size="xs"
              />
            )}
            <span className="text-sm text-muted-foreground truncate">
              {nft.collection.name}
            </span>
            {nft.collection.verified && (
              <Badge variant="gradient-cyan" size="sm">
                ✓
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Collection Group Component
const CollectionGroup: React.FC<{
  collection: Collection;
  nfts: NFT[];
  onNftClick: (nftId: string) => void;
  onCollectionClick: (collectionId: string) => void;
  viewMode: 'grid' | 'list';
}> = ({ collection, nfts, onNftClick, onCollectionClick, viewMode }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Collection Header */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => onCollectionClick(collection.id)}
        >
          <Avatar
            src={collection.avatar}
            fallback={collection.name.substring(0, 2)}
            size="sm"
          />
          <div>
            <div className="font-semibold flex items-center gap-2">
              {collection.name}
              {collection.verified && (
                <Badge variant="gradient-cyan" size="sm">
                  ✓
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatNumber(collection.nftCount)} items
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        </Button>
      </div>

      {/* NFTs Grid */}
      {expanded && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}
        >
          {nfts.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onClick={() => onNftClick(nft.id)}
              viewMode={viewMode}
              showCollection={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  walletConnected: boolean;
  onConnectWallet: () => void;
}> = ({ walletConnected, onConnectWallet }) => {
  if (!walletConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-12 text-center">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your NFT collection
          </p>
          <Button variant="primary" size="lg" onClick={onConnectWallet}>
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-12 text-center">
        <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
        <p className="text-muted-foreground mb-6">
          You don't have any NFTs in your wallet yet
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};

export function NFTGalleryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(true); // Mock wallet connection
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groupByCollection, setGroupByCollection] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'collection' | 'recent'>('recent');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load NFTs
    const loadNFTs = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch user's NFTs
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockCollections: Collection[] = [
          {
            id: 'bayc',
            name: 'Bored Ape Yacht Club',
            avatar: 'https://via.placeholder.com/100/F59E0B/FFFFFF?text=BAYC',
            verified: true,
            nftCount: 3,
          },
          {
            id: 'cryptopunks',
            name: 'CryptoPunks',
            avatar: 'https://via.placeholder.com/100/EC4899/FFFFFF?text=CP',
            verified: true,
            nftCount: 2,
          },
          {
            id: 'azuki',
            name: 'Azuki',
            avatar: 'https://via.placeholder.com/100/8B5CF6/FFFFFF?text=AZ',
            verified: true,
            nftCount: 1,
          },
        ];

        const mockNfts: NFT[] = [
          ...Array.from({ length: 3 }, (_, i) => ({
            id: `bayc-${i}`,
            tokenId: String(1000 + i),
            name: `Bored Ape #${1000 + i}`,
            image: `https://via.placeholder.com/300/F59E0B/FFFFFF?text=Ape+${1000 + i}`,
            collection: mockCollections[0],
            blockchain: 'Ethereum',
          })),
          ...Array.from({ length: 2 }, (_, i) => ({
            id: `punk-${i}`,
            tokenId: String(2000 + i),
            name: `CryptoPunk #${2000 + i}`,
            image: `https://via.placeholder.com/300/EC4899/FFFFFF?text=Punk+${2000 + i}`,
            collection: mockCollections[1],
            blockchain: 'Ethereum',
          })),
          {
            id: 'azuki-1',
            tokenId: '3000',
            name: 'Azuki #3000',
            image: 'https://via.placeholder.com/300/8B5CF6/FFFFFF?text=Azuki+3000',
            collection: mockCollections[2],
            blockchain: 'Ethereum',
          },
        ];

        setCollections(mockCollections);
        setNfts(mockNfts);
        setFilteredNfts(mockNfts);
      } catch (error) {
        console.error('Error loading NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (walletConnected) {
      loadNFTs();
    } else {
      setLoading(false);
    }
  }, [walletConnected]);

  // Filter and sort NFTs
  useEffect(() => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (nft) =>
          nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.tokenId.includes(searchQuery)
      );
    }

    // Apply collection filter
    if (selectedCollection) {
      filtered = filtered.filter((nft) => nft.collection.id === selectedCollection);
    }

    // Apply blockchain filter
    if (selectedBlockchain) {
      filtered = filtered.filter((nft) => nft.blockchain === selectedBlockchain);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'collection':
          return a.collection.name.localeCompare(b.collection.name);
        case 'recent':
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  }, [nfts, searchQuery, selectedCollection, selectedBlockchain, sortBy]);

  const handleSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const handleConnectWallet = () => {
    // TODO: Implement wallet connection
    setWalletConnected(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCollection(null);
    setSelectedBlockchain(null);
  };

  const handleNftClick = (nftId: string) => {
    navigate(`/nft/${nftId}`);
  };

  const handleCollectionClick = (collectionId: string) => {
    navigate(`/collection/${collectionId}`);
  };

  const blockchains = Array.from(new Set(nfts.map((nft) => nft.blockchain)));
  const activeFiltersCount =
    (selectedCollection ? 1 : 0) + (selectedBlockchain ? 1 : 0);

  // Group NFTs by collection
  const groupedNfts = groupByCollection
    ? collections
        .map((collection) => ({
          collection,
          nfts: filteredNfts.filter((nft) => nft.collection.id === collection.id),
        }))
        .filter((group) => group.nfts.length > 0)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-12 bg-muted rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My NFT Gallery</h1>
          <p className="text-muted-foreground">
            {walletConnected && nfts.length > 0
              ? `${formatNumber(nfts.length)} NFTs across ${collections.length} collections`
              : 'Manage and view your NFT collection'}
          </p>
        </div>

        {/* Empty State */}
        {!walletConnected || nfts.length === 0 ? (
          <EmptyState
            walletConnected={walletConnected}
            onConnectWallet={handleConnectWallet}
          />
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search NFTs or collections..."
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
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
                    <option value="recent">Recent</option>
                    <option value="name">Name</option>
                    <option value="collection">Collection</option>
                  </select>
                  <Button
                    variant={groupByCollection ? 'primary' : 'outline'}
                    size="icon"
                    onClick={() => setGroupByCollection(!groupByCollection)}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
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

              {/* Filters Panel */}
              {showFilters && (
                <Card>
                  <CardHeader>
                    <CardTitle>Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Collection Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Collection
                        </label>
                        <select
                          value={selectedCollection || ''}
                          onChange={(e) =>
                            setSelectedCollection(e.target.value || null)
                          }
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                        >
                          <option value="">All Collections</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.name} ({collection.nftCount})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Blockchain Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Blockchain
                        </label>
                        <select
                          value={selectedBlockchain || ''}
                          onChange={(e) =>
                            setSelectedBlockchain(e.target.value || null)
                          }
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                        >
                          <option value="">All Blockchains</option>
                          {blockchains.map((blockchain) => (
                            <option key={blockchain} value={blockchain}>
                              {blockchain}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* NFTs Display */}
            {filteredNfts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : groupByCollection && groupedNfts ? (
              <div className="space-y-8">
                {groupedNfts.map((group) => (
                  <CollectionGroup
                    key={group.collection.id}
                    collection={group.collection}
                    nfts={group.nfts}
                    onNftClick={handleNftClick}
                    onCollectionClick={handleCollectionClick}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                )}
              >
                {filteredNfts.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    nft={nft}
                    onClick={() => handleNftClick(nft.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NFTGalleryPage;
