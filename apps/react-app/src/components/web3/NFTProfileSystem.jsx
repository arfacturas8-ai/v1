import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Dialog, Tabs, Select, Progress } from '@radix-ui/themes';
import { 
  Image, User, Star, Sparkles, Shield, ExternalLink, 
  Upload, Edit, Trash2, Heart, Eye, Filter, Grid, List
} from 'lucide-react';
import { getCRYBNFTContract } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

const NFTProfileSystem = () => {
  const [userNFTs, setUserNFTs] = useState([]);
  const [profileNFT, setProfileNFT] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [isSettingProfile, setIsSettingProfile] = useState(false);

  const nftContract = getCRYBNFTContract(walletManager.currentChainId || 1);

  // Mock NFT metadata for development
  const mockNFTMetadata = {
    1: {
      name: 'CRYB Genesis #1',
      description: 'First NFT in the CRYB Genesis collection with unique cosmic traits',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400',
      attributes: [
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Background', value: 'Cosmic' },
        { trait_type: 'Eyes', value: 'Laser' },
        { trait_type: 'Power Level', value: '9000' }
      ],
      rarity: 'Legendary',
      staked: false
    },
    42: {
      name: 'CRYB Genesis #42',
      description: 'Rare NFT with unique nebula traits and diamond eyes',
      image: 'https://images.unsplash.com/photo-1635236066167-80e8a0ca42b3?w=400',
      attributes: [
        { trait_type: 'Rarity', value: 'Epic' },
        { trait_type: 'Background', value: 'Nebula' },
        { trait_type: 'Eyes', value: 'Diamond' },
        { trait_type: 'Power Level', value: '7500' }
      ],
      rarity: 'Epic',
      staked: true
    },
    123: {
      name: 'CRYB Genesis #123',
      description: 'Ultra-rare legendary NFT with maximum stats and galaxy background',
      image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400',
      attributes: [
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Background', value: 'Galaxy' },
        { trait_type: 'Eyes', value: 'Crystal' },
        { trait_type: 'Power Level', value: '9500' }
      ],
      rarity: 'Legendary',
      staked: false
    },
    456: {
      name: 'CRYB Genesis #456',
      description: 'Common NFT with standard traits perfect for beginners',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      attributes: [
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Background', value: 'Blue' },
        { trait_type: 'Eyes', value: 'Normal' },
        { trait_type: 'Power Level', value: '1000' }
      ],
      rarity: 'Common',
      staked: false
    }
  };

  // Load user NFTs and profile
  const loadUserNFTs = useCallback(async () => {
    if (!walletManager.isConnected) return;

    try {
      setLoading(true);

      const [userNFTData, collectionInfo] = await Promise.all([
        nftContract.getUserNFTs(walletManager.account),
        nftContract.getCollectionInfo()
      ]);

      // Enrich NFTs with metadata
      const enrichedNFTs = userNFTData.tokenIds.map(tokenId => ({
        tokenId,
        metadata: mockNFTMetadata[tokenId] || {
          name: `CRYB NFT #${tokenId}`,
          description: 'CRYB Collection NFT',
          image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400',
          attributes: [],
          rarity: 'Common',
          staked: userNFTData.stakedTokens.includes(tokenId)
        },
        isProfilePicture: userNFTData.profilePictureTokenId === tokenId,
        isStaked: userNFTData.stakedTokens.includes(tokenId)
      }));

      setUserNFTs(enrichedNFTs);
      
      // Set current profile NFT
      const profileNFT = enrichedNFTs.find(nft => nft.isProfilePicture);
      setProfileNFT(profileNFT || null);

    } catch (error) {
      console.error('Failed to load user NFTs:', error);
    } finally {
      setLoading(false);
    }
  }, [walletManager.isConnected, walletManager.account]);

  // Mint new NFT
  const handleMint = async () => {
    if (!walletManager.isConnected) return;

    try {
      setIsMinting(true);

      // Get collection info for pricing
      const collectionInfo = await nftContract.getCollectionInfo();
      const totalCost = BigInt(mintQuantity) * collectionInfo.publicPrice;

      // Execute minting transaction
      const txResult = await transactionManager.executeTransaction({
        to: nftContract.address,
        data: nftContract.abi.find(f => f.name === 'publicMint'),
        value: totalCost
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Reset form and close dialog
      setMintQuantity(1);
      setShowMintDialog(false);
      
      // Reload NFTs
      await loadUserNFTs();

    } catch (error) {
      console.error('Minting failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  // Set NFT as profile picture
  const handleSetProfilePicture = async (tokenId) => {
    if (!walletManager.isConnected) return;

    try {
      setIsSettingProfile(true);

      // Execute set profile picture transaction
      const txResult = await transactionManager.executeTransaction({
        to: nftContract.address,
        data: nftContract.abi.find(f => f.name === 'setProfilePicture'),
        value: 0
      }, {
        priority: 'fast',
        gasStrategy: 'moderate'
      });

      // Update local state
      setUserNFTs(prevNFTs => 
        prevNFTs.map(nft => ({
          ...nft,
          isProfilePicture: nft.tokenId === tokenId
        }))
      );

      const newProfileNFT = userNFTs.find(nft => nft.tokenId === tokenId);
      setProfileNFT(newProfileNFT);
      setShowProfileDialog(false);

    } catch (error) {
      console.error('Setting profile picture failed:', error);
    } finally {
      setIsSettingProfile(false);
    }
  };

  // Stake NFT
  const handleStakeNFT = async (tokenId) => {
    try {
      const txResult = await transactionManager.executeTransaction({
        to: nftContract.address,
        data: nftContract.abi.find(f => f.name === 'stakeToken'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Update local state
      setUserNFTs(prevNFTs => 
        prevNFTs.map(nft => 
          nft.tokenId === tokenId 
            ? { ...nft, isStaked: true, metadata: { ...nft.metadata, staked: true } }
            : nft
        )
      );

    } catch (error) {
      console.error('Staking NFT failed:', error);
    }
  };

  // Unstake NFT
  const handleUnstakeNFT = async (tokenId) => {
    try {
      const txResult = await transactionManager.executeTransaction({
        to: nftContract.address,
        data: nftContract.abi.find(f => f.name === 'unstakeToken'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Update local state
      setUserNFTs(prevNFTs => 
        prevNFTs.map(nft => 
          nft.tokenId === tokenId 
            ? { ...nft, isStaked: false, metadata: { ...nft.metadata, staked: false } }
            : nft
        )
      );

    } catch (error) {
      console.error('Unstaking NFT failed:', error);
    }
  };

  // Filter and sort NFTs
  const filteredNFTs = userNFTs
    .filter(nft => {
      switch (filterBy) {
        case 'profile':
          return nft.isProfilePicture;
        case 'staked':
          return nft.isStaked;
        case 'unstaked':
          return !nft.isStaked;
        case 'legendary':
          return nft.metadata.rarity === 'Legendary';
        case 'epic':
          return nft.metadata.rarity === 'Epic';
        case 'common':
          return nft.metadata.rarity === 'Common';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.tokenId - a.tokenId;
        case 'oldest':
          return a.tokenId - b.tokenId;
        case 'rarity':
          const rarityOrder = { 'Legendary': 3, 'Epic': 2, 'Common': 1 };
          return (rarityOrder[b.metadata.rarity] || 0) - (rarityOrder[a.metadata.rarity] || 0);
        case 'power':
          const getPowerLevel = (nft) => {
            const powerAttr = nft.metadata.attributes.find(attr => attr.trait_type === 'Power Level');
            return powerAttr ? parseInt(powerAttr.value) : 0;
          };
          return getPowerLevel(b) - getPowerLevel(a);
        default:
          return 0;
      }
    });

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary':
        return 'purple';
      case 'Epic':
        return 'blue';
      case 'Common':
        return 'gray';
      default:
        return 'gray';
    }
  };

  useEffect(() => {
    loadUserNFTs();
  }, [loadUserNFTs]);

  useEffect(() => {
    // Setup wallet event listeners
    const handleAccountChanged = () => loadUserNFTs();
    const handleChainChanged = () => loadUserNFTs();
    
    walletManager.on('accountChanged', handleAccountChanged);
    walletManager.on('chainChanged', handleChainChanged);
    
    return () => {
      walletManager.off('accountChanged', handleAccountChanged);
      walletManager.off('chainChanged', handleChainChanged);
    };
  }, [loadUserNFTs]);

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
        <div className="mb-4">
          <Image style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
        </div>
        <h3 style={{
  fontWeight: '600'
}}>Connect Wallet</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Connect your wallet to view and manage your NFT collection
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{
  padding: '24px'
}}>
        <div className=" space-y-4">
          <div style={{
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
  height: '256px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Profile NFT */}
      <Card style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h2 style={{
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center'
}}>
            <Image style={{
  width: '24px',
  height: '24px'
}} />
            <span>My NFT Collection</span>
          </h2>
          
          <div style={{
  display: 'flex'
}}>
            <Button onClick={() => setShowMintDialog(true)}>
              <Sparkles style={{
  width: '16px',
  height: '16px'
}} />
              Mint NFT
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowProfileDialog(true)}
              disabled={userNFTs.length === 0}
            >
              <User style={{
  width: '16px',
  height: '16px'
}} />
              Set Profile
            </Button>
          </div>
        </div>

        {/* Current Profile Section */}
        <div style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  position: 'relative'
}}>
              {profileNFT ? (
                <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
                  <img 
                    src={profileNFT.metadata.image} 
                    alt={profileNFT.metadata.name}
                    style={{
  width: '100%',
  height: '100%'
}}
                  />
                </div>
              ) : (
                <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'rgba(20, 20, 20, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <User style={{
  width: '32px',
  height: '32px',
  color: '#A0A0A0'
}} />
                </div>
              )}
              {profileNFT && (
                <div style={{
  position: 'absolute'
}}>
                  <Badge color="blue" className="text-xs">
                    <Star style={{
  width: '12px',
  height: '12px'
}} />
                  </Badge>
                </div>
              )}
            </div>
            
            <div style={{
  flex: '1'
}}>
              <h3 style={{
  fontWeight: '600'
}}>
                {profileNFT ? profileNFT.metadata.name : 'No Profile NFT Set'}
              </h3>
              <p style={{
  color: '#A0A0A0'
}}>
                {profileNFT ? 'Current profile picture' : 'Select an NFT to use as your profile picture'}
              </p>
              {profileNFT && (
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <Badge color={getRarityColor(profileNFT.metadata.rarity)} size="sm">
                    {profileNFT.metadata.rarity}
                  </Badge>
                  {profileNFT.isStaked && (
                    <Badge color="green" size="sm">
                      <Shield style={{
  width: '12px',
  height: '12px'
}} />
                      Staked
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div style={{
  textAlign: 'right'
}}>
              <p style={{
  fontWeight: 'bold'
}}>{userNFTs.length}</p>
              <p style={{
  color: '#A0A0A0'
}}>NFTs Owned</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Controls */}
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
        <div style={{
  display: 'flex'
}}>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <Select.Trigger style={{
  width: '128px'
}}>
              <Filter style={{
  width: '16px',
  height: '16px'
}} />
              {filterBy === 'all' ? 'All' : 
               filterBy === 'profile' ? 'Profile' :
               filterBy === 'staked' ? 'Staked' :
               filterBy === 'unstaked' ? 'Unstaked' :
               filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All NFTs</Select.Item>
              <Select.Item value="profile">Profile</Select.Item>
              <Select.Item value="staked">Staked</Select.Item>
              <Select.Item value="unstaked">Unstaked</Select.Item>
              <Select.Item value="legendary">Legendary</Select.Item>
              <Select.Item value="epic">Epic</Select.Item>
              <Select.Item value="common">Common</Select.Item>
            </Select.Content>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <Select.Trigger style={{
  width: '128px'
}}>
              {sortBy === 'newest' ? 'Newest' :
               sortBy === 'oldest' ? 'Oldest' :
               sortBy === 'rarity' ? 'Rarity' : 'Power Level'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="newest">Newest</Select.Item>
              <Select.Item value="oldest">Oldest</Select.Item>
              <Select.Item value="rarity">By Rarity</Select.Item>
              <Select.Item value="power">Power Level</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div style={{
  display: 'flex'
}}>
          <Button
            variant={viewMode === 'grid' ? 'solid' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid style={{
  width: '16px',
  height: '16px'
}} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'solid' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List style={{
  width: '16px',
  height: '16px'
}} />
          </Button>
        </div>
      </div>

      {/* NFT Collection */}
      {filteredNFTs.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredNFTs.map((nft) => (
            <Card 
              key={nft.tokenId} 
              style={{
  overflow: 'hidden'
}}
              onClick={() => setSelectedNFT(nft)}
            >
              {viewMode === 'grid' ? (
                <>
                  <div style={{
  position: 'relative'
}}>
                    <img 
                      src={nft.metadata.image} 
                      alt={nft.metadata.name}
                      style={{
  width: '100%',
  height: '192px'
}}
                    />
                    
                    {/* Badges */}
                    <div style={{
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column'
}}>
                      {nft.isProfilePicture && (
                        <Badge color="blue" size="sm">
                          <Star style={{
  width: '12px',
  height: '12px'
}} />
                          Profile
                        </Badge>
                      )}
                      {nft.isStaked && (
                        <Badge color="green" size="sm">
                          <Shield style={{
  width: '12px',
  height: '12px'
}} />
                          Staked
                        </Badge>
                      )}
                    </div>

                    <div style={{
  position: 'absolute'
}}>
                      <Badge color={getRarityColor(nft.metadata.rarity)} size="sm">
                        {nft.metadata.rarity}
                      </Badge>
                    </div>
                  </div>
                  
                  <div style={{
  padding: '16px'
}}>
                    <h3 style={{
  fontWeight: '600'
}}>{nft.metadata.name}</h3>
                    <p style={{
  color: '#A0A0A0'
}}>
                      {nft.metadata.description}
                    </p>
                    
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                      <span style={{
  color: '#A0A0A0'
}}>#{nft.tokenId}</span>
                      <div style={{
  display: 'flex'
}}>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNFT(nft);
                        }}>
                          <Eye style={{
  width: '12px',
  height: '12px'
}} />
                        </Button>
                        {!nft.isStaked && (
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            handleStakeNFT(nft.tokenId);
                          }}>
                            <Shield style={{
  width: '12px',
  height: '12px'
}} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <div style={{
  position: 'relative'
}}>
                    <img 
                      src={nft.metadata.image} 
                      alt={nft.metadata.name}
                      style={{
  width: '64px',
  height: '64px',
  borderRadius: '4px'
}}
                    />
                    {nft.isProfilePicture && (
                      <div style={{
  position: 'absolute'
}}>
                        <Badge color="blue" size="sm">
                          <Star style={{
  width: '12px',
  height: '12px'
}} />
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <h3 style={{
  fontWeight: '600'
}}>{nft.metadata.name}</h3>
                      <Badge color={getRarityColor(nft.metadata.rarity)} size="sm">
                        {nft.metadata.rarity}
                      </Badge>
                      {nft.isStaked && (
                        <Badge color="green" size="sm">
                          <Shield style={{
  width: '12px',
  height: '12px'
}} />
                          Staked
                        </Badge>
                      )}
                    </div>
                    <p style={{
  color: '#A0A0A0'
}}>
                      {nft.metadata.description}
                    </p>
                    <p style={{
  color: '#A0A0A0'
}}>Token ID: #{nft.tokenId}</p>
                  </div>

                  <div style={{
  display: 'flex'
}}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedNFT(nft)}>
                      <Eye style={{
  width: '12px',
  height: '12px'
}} />
                    </Button>
                    {!nft.isStaked && (
                      <Button size="sm" variant="outline" onClick={() => handleStakeNFT(nft.tokenId)}>
                        <Shield style={{
  width: '12px',
  height: '12px'
}} />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
          <Image style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
          <h3 style={{
  fontWeight: '600'
}}>
            {userNFTs.length === 0 ? 'No NFTs Found' : 'No NFTs Match Filter'}
          </h3>
          <p style={{
  color: '#A0A0A0'
}}>
            {userNFTs.length === 0 
              ? 'Start by minting your first NFT to join the CRYB community'
              : 'Try adjusting your filters to see more NFTs'
            }
          </p>
          {userNFTs.length === 0 && (
            <Button onClick={() => setShowMintDialog(true)}>
              <Sparkles style={{
  width: '16px',
  height: '16px'
}} />
              Mint Your First NFT
            </Button>
          )}
        </Card>
      )}

      {/* Mint Dialog */}
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>Mint CRYB NFT</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div style={{
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}>
              <h4 style={{
  fontWeight: '600'
}}>CRYB Genesis Collection</h4>
              <p className="text-sm text-blue-600 mb-3">
                Mint unique NFTs with cosmic traits and varying rarity levels
              </p>
              <div style={{
  display: 'grid',
  gap: '8px'
}}>
                <div className="text-blue-700">
                  <span style={{
  fontWeight: '600'
}}>Price:</span> 0.08 ETH
                </div>
                <div className="text-blue-700">
                  <span style={{
  fontWeight: '600'
}}>Supply:</span> 2,547 / 10,000
                </div>
              </div>
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Quantity to Mint
              </label>
              <Select value={mintQuantity.toString()} onValueChange={(value) => setMintQuantity(parseInt(value))}>
                <Select.Trigger>
                  {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}
                </Select.Trigger>
                <Select.Content>
                  {[1, 2, 3, 4, 5].map(num => (
                    <Select.Item key={num} value={num.toString()}>
                      {num} NFT{num > 1 ? 's' : ''}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '12px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span>Price per NFT:</span>
                <span style={{
  fontWeight: '600'
}}>0.08 ETH</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span>Quantity:</span>
                <span style={{
  fontWeight: '600'
}}>{mintQuantity}</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span style={{
  fontWeight: '600'
}}>Total Cost:</span>
                <span style={{
  fontWeight: '600'
}}>{(0.08 * mintQuantity).toFixed(2)} ETH</span>
              </div>
            </div>

            <div style={{
  display: 'flex'
}}>
              <Button
                variant="outline"
                style={{
  flex: '1'
}}
                onClick={() => setShowMintDialog(false)}
              >
                Cancel
              </Button>
              <Button
                style={{
  flex: '1'
}}
                onClick={handleMint}
                disabled={isMinting}
              >
                {isMinting ? (
                  <>
                    <div style={{
  borderRadius: '50%',
  height: '16px',
  width: '16px'
}} />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles style={{
  width: '16px',
  height: '16px'
}} />
                    Mint NFT{mintQuantity > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Profile Selection Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <Dialog.Content maxWidth="600px">
          <Dialog.Title>Select Profile Picture</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <p style={{
  color: '#A0A0A0'
}}>
              Choose an NFT from your collection to use as your profile picture
            </p>

            <div style={{
  display: 'grid',
  gap: '16px'
}}>
              {userNFTs.map((nft) => (
                <Card 
                  key={nft.tokenId}
                  style={{
  padding: '12px',
  background: 'rgba(20, 20, 20, 0.6)'
}}
                  onClick={() => handleSetProfilePicture(nft.tokenId)}
                >
                  <div style={{
  position: 'relative'
}}>
                    <img 
                      src={nft.metadata.image} 
                      alt={nft.metadata.name}
                      style={{
  width: '100%',
  height: '96px',
  borderRadius: '4px'
}}
                    />
                    {nft.isProfilePicture && (
                      <div style={{
  position: 'absolute'
}}>
                        <Badge color="blue" size="sm">
                          <Star style={{
  width: '12px',
  height: '12px'
}} />
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <h4 style={{
  fontWeight: '600'
}}>
                      {nft.metadata.name}
                    </h4>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                      <Badge color={getRarityColor(nft.metadata.rarity)} size="sm">
                        {nft.metadata.rarity}
                      </Badge>
                      <span style={{
  color: '#A0A0A0'
}}>#{nft.tokenId}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* NFT Detail Dialog */}
      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <Dialog.Content maxWidth="500px">
          {selectedNFT && (
            <>
              <Dialog.Title style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span>{selectedNFT.metadata.name}</span>
                <Badge color={getRarityColor(selectedNFT.metadata.rarity)}>
                  {selectedNFT.metadata.rarity}
                </Badge>
              </Dialog.Title>
              
              <div className="space-y-4 mt-4">
                <div style={{
  position: 'relative'
}}>
                  <img 
                    src={selectedNFT.metadata.image} 
                    alt={selectedNFT.metadata.name}
                    style={{
  width: '100%',
  height: '256px',
  borderRadius: '12px'
}}
                  />
                  
                  <div style={{
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column'
}}>
                    {selectedNFT.isProfilePicture && (
                      <Badge color="blue">
                        <Star style={{
  width: '12px',
  height: '12px'
}} />
                        Profile Picture
                      </Badge>
                    )}
                    {selectedNFT.isStaked && (
                      <Badge color="green">
                        <Shield style={{
  width: '12px',
  height: '12px'
}} />
                        Staked
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{
  fontWeight: '600'
}}>Description</h4>
                  <p style={{
  color: '#A0A0A0'
}}>
                    {selectedNFT.metadata.description}
                  </p>
                </div>

                <div>
                  <h4 style={{
  fontWeight: '600'
}}>Attributes</h4>
                  <div style={{
  display: 'grid',
  gap: '8px'
}}>
                    {selectedNFT.metadata.attributes.map((attr, index) => (
                      <div key={index} style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '8px',
  borderRadius: '4px'
}}>
                        <p style={{
  color: '#A0A0A0'
}}>{attr.trait_type}</p>
                        <p style={{
  fontWeight: '600'
}}>{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{
  fontWeight: '600'
}}>Details</h4>
                  <div className="space-y-1 text-sm">
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                      <span style={{
  color: '#A0A0A0'
}}>Token ID:</span>
                      <span style={{
  fontWeight: '600'
}}>#{selectedNFT.tokenId}</span>
                    </div>
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                      <span style={{
  color: '#A0A0A0'
}}>Contract:</span>
                      <span style={{
  fontWeight: '600'
}}>
                        {nftContract.address.slice(0, 6)}...{nftContract.address.slice(-4)}
                      </span>
                    </div>
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                      <span style={{
  color: '#A0A0A0'
}}>Standard:</span>
                      <span style={{
  fontWeight: '600'
}}>ERC-721</span>
                    </div>
                  </div>
                </div>

                <div style={{
  display: 'flex'
}}>
                  {!selectedNFT.isProfilePicture && (
                    <Button
                      style={{
  flex: '1'
}}
                      onClick={() => handleSetProfilePicture(selectedNFT.tokenId)}
                      disabled={isSettingProfile}
                    >
                      {isSettingProfile ? 'Setting...' : 'Set as Profile'}
                    </Button>
                  )}
                  
                  {selectedNFT.isStaked ? (
                    <Button
                      variant="outline"
                      style={{
  flex: '1'
}}
                      onClick={() => handleUnstakeNFT(selectedNFT.tokenId)}
                    >
                      <Shield style={{
  width: '16px',
  height: '16px'
}} />
                      Unstake
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      style={{
  flex: '1'
}}
                      onClick={() => handleStakeNFT(selectedNFT.tokenId)}
                    >
                      <Shield style={{
  width: '16px',
  height: '16px'
}} />
                      Stake
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog>
    </div>
  );
};




export default NFTProfileSystem
