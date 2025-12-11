/**
 * NFT Detail View Page
 * View-only NFT detail page with full metadata display, media viewer, and blockchain information
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  Flag,
  MoreVertical,
  ChevronRight,
  Copy,
  Check,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../components/ui/modal';
import { cn, formatDate, formatNumber, copyToClipboard, truncate } from '../lib/utils';

// Types
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
    rarity?: number;
  }>;
}

interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  blockchain: string;
  tokenStandard: string;
  metadata: NFTMetadata;
  owner: {
    address: string;
    name?: string;
    avatar?: string;
  };
  creator: {
    address: string;
    name?: string;
    avatar?: string;
  };
  collection: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  mintDate: string;
  likes: number;
  isLiked: boolean;
  transferHistory: Array<{
    from: string;
    to: string;
    timestamp: string;
    txHash: string;
  }>;
}

// Media Viewer Component
const MediaViewer: React.FC<{
  src: string;
  type: 'image' | 'video' | 'audio' | 'model';
  alt: string;
  className?: string;
  onFullscreen?: () => void;
}> = ({ src, type, alt, className, onFullscreen }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', className)}>
        <div className="text-center p-8">
          <div className="text-muted-foreground mb-2">Failed to load media</div>
          <Button variant="outline" size="sm" onClick={() => setError(false)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className={cn('relative group', className)}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
          onError={() => setError(true)}
        />
        {onFullscreen && (
          <Button
            variant="glass"
            size="icon"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className={cn('relative group', className)}>
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover rounded-lg"
          loop
          playsInline
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="glass"
            size="icon-lg"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="glass" size="icon" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          {onFullscreen && (
            <Button variant="glass" size="icon" onClick={onFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className={cn('relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-8', className)}>
        <audio ref={audioRef} src={src} loop onError={() => setError(true)} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">🎵</div>
          <div className="text-sm text-muted-foreground">{alt}</div>
          <div className="flex gap-2">
            <Button variant="primary" size="lg" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" size="lg" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'model') {
    return (
      <div className={cn('relative bg-muted rounded-lg flex items-center justify-center', className)}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🎨</div>
          <div className="text-sm text-muted-foreground mb-4">3D Model Viewer</div>
          <Button variant="primary" onClick={() => window.open(src, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View in 3D
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

// Fullscreen Modal
const FullscreenMediaModal: React.FC<{
  open: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video' | 'audio' | 'model';
  alt: string;
}> = ({ open, onClose, src, type, alt }) => {
  return (
    <Modal open={open} onOpenChange={onClose} size="full" variant="glass">
      <div className="relative w-full h-full flex items-center justify-center bg-black/95 p-4">
        <Button
          variant="glass"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <MediaViewer src={src} type={type} alt={alt} className="max-w-full max-h-full" />
      </div>
    </Modal>
  );
};

export function NFTDetailViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Simulate loading NFT data
    const loadNFT = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockNFT: NFT = {
          id: id || '1',
          tokenId: '8234',
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          blockchain: 'Ethereum',
          tokenStandard: 'ERC-721',
          metadata: {
            name: 'Bored Ape #8234',
            description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits.',
            image: 'https://via.placeholder.com/600x600/6366F1/FFFFFF?text=NFT+Image',
            external_url: 'https://boredapeyachtclub.com/',
            attributes: [
              { trait_type: 'Background', value: 'Blue', rarity: 12 },
              { trait_type: 'Fur', value: 'Brown', rarity: 8 },
              { trait_type: 'Clothes', value: 'Striped Tee', rarity: 5 },
              { trait_type: 'Eyes', value: 'Bored', rarity: 15 },
              { trait_type: 'Mouth', value: 'Bored', rarity: 10 },
              { trait_type: 'Hat', value: 'Beanie', rarity: 3 },
            ],
          },
          owner: {
            address: '0xabcdef1234567890abcdef1234567890abcdef12',
            name: 'CryptoWhale.eth',
            avatar: 'https://via.placeholder.com/100/10B981/FFFFFF?text=CW',
          },
          creator: {
            address: '0x9876543210fedcba9876543210fedcba98765432',
            name: 'Yuga Labs',
            avatar: 'https://via.placeholder.com/100/6366F1/FFFFFF?text=YL',
          },
          collection: {
            id: 'bayc',
            name: 'Bored Ape Yacht Club',
            avatar: 'https://via.placeholder.com/100/F59E0B/FFFFFF?text=BAYC',
            verified: true,
          },
          mintDate: '2021-04-30T12:00:00Z',
          likes: 1247,
          isLiked: false,
          transferHistory: [
            {
              from: '0x1111111111111111111111111111111111111111',
              to: '0xabcdef1234567890abcdef1234567890abcdef12',
              timestamp: '2023-11-15T10:30:00Z',
              txHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abc123',
            },
            {
              from: '0x9876543210fedcba9876543210fedcba98765432',
              to: '0x1111111111111111111111111111111111111111',
              timestamp: '2021-04-30T12:00:00Z',
              txHash: '0xdef456789abc123def456789abc123def456789abc123def456789abc123def456',
            },
          ],
        };

        setNft(mockNFT);
        setIsLiked(mockNFT.isLiked);
        setLikesCount(mockNFT.likes);
      } catch (error) {
        console.error('Error loading NFT:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNFT();
  }, [id]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const getMediaType = (metadata: NFTMetadata): 'image' | 'video' | 'audio' | 'model' => {
    if (metadata.animation_url) {
      if (metadata.animation_url.includes('.mp4') || metadata.animation_url.includes('.webm')) {
        return 'video';
      }
      if (metadata.animation_url.includes('.mp3') || metadata.animation_url.includes('.wav')) {
        return 'audio';
      }
      if (metadata.animation_url.includes('.glb') || metadata.animation_url.includes('.gltf')) {
        return 'model';
      }
    }
    return 'image';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className=" space-y-4">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">NFT Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The NFT you're looking for doesn't exist or has been removed.
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

  const mediaType = getMediaType(nft.metadata);
  const mediaSrc = nft.metadata.animation_url || nft.metadata.image;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={cn(isLiked && 'text-red-500')}
              >
                <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Media */}
          <div className="space-y-4">
            <MediaViewer
              src={mediaSrc}
              type={mediaType}
              alt={nft.metadata.name}
              className="aspect-square w-full"
              onFullscreen={() => setFullscreenMedia(true)}
            />

            {/* Collection Badge */}
            <Card
              variant="interactive"
              className="cursor-pointer"
              onClick={() => navigate(`/collection/${nft.collection.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={nft.collection.avatar}
                    fallback={nft.collection.name.substring(0, 2)}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm text-muted-foreground">Collection</div>
                    <div className="font-semibold flex items-center gap-1">
                      {nft.collection.name}
                      {nft.collection.verified && (
                        <Badge variant="gradient-cyan" size="sm">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{nft.metadata.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Heart className="h-4 w-4" />
                <span>{formatNumber(likesCount)} likes</span>
              </div>
              <p className="text-muted-foreground">{nft.metadata.description}</p>
            </div>

            {/* Owner Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${nft.owner.address}`)}
                  >
                    <div className="text-sm text-muted-foreground mb-2">Owner</div>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={nft.owner.avatar}
                        fallback={nft.owner.name?.substring(0, 2) || 'UN'}
                        size="sm"
                      />
                      <span className="font-medium">
                        {nft.owner.name || truncate(nft.owner.address, 12)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${nft.creator.address}`)}
                  >
                    <div className="text-sm text-muted-foreground mb-2">Creator</div>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={nft.creator.avatar}
                        fallback={nft.creator.name?.substring(0, 2) || 'UN'}
                        size="sm"
                      />
                      <span className="font-medium">
                        {nft.creator.name || truncate(nft.creator.address, 12)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Coming Soon */}
            <Card variant="gradient">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Marketplace Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  NFT trading features will be available in the next update
                </p>
              </CardContent>
            </Card>

            {/* Properties */}
            {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nft.metadata.attributes.map((attr, index) => (
                      <Card key={index} variant="glass" className="p-3">
                        <div className="text-xs text-accent-cyan mb-1">
                          {attr.trait_type}
                        </div>
                        <div className="font-semibold mb-1">{attr.value}</div>
                        {attr.rarity && (
                          <div className="text-xs text-muted-foreground">
                            {attr.rarity}% rarity
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Contract Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {truncate(nft.contractAddress, 12)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(nft.contractAddress, 'contract')}
                    >
                      {copiedField === 'contract' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        window.open(
                          `https://etherscan.io/address/${nft.contractAddress}`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Token ID</span>
                  <span className="font-mono">{nft.tokenId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Blockchain</span>
                  <Badge variant="outline">{nft.blockchain}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Token Standard</span>
                  <Badge variant="outline">{nft.tokenStandard}</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Minted</span>
                  <span>{formatDate(nft.mintDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nft.transferHistory.map((transfer, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium mb-1">Transfer</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            From: <span className="font-mono">{truncate(transfer.from, 12)}</span>
                          </div>
                          <div>
                            To: <span className="font-mono">{truncate(transfer.to, 12)}</span>
                          </div>
                          <div>{formatDate(transfer.timestamp)}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          window.open(`https://etherscan.io/tx/${transfer.txHash}`, '_blank')
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => {}}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
              {nft.metadata.external_url && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => window.open(nft.metadata.external_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Modal */}
      <FullscreenMediaModal
        open={fullscreenMedia}
        onClose={() => setFullscreenMedia(false)}
        src={mediaSrc}
        type={mediaType}
        alt={nft.metadata.name}
      />

      {/* Share Modal */}
      <Modal open={showShareModal} onOpenChange={setShowShareModal}>
        <ModalHeader>
          <ModalTitle>Share NFT</ModalTitle>
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
              <Button
                variant="outline"
                onClick={() => handleCopy(window.location.href, 'url')}
              >
                {copiedField === 'url' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default NFTDetailViewPage;
