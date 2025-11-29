import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Dialog, Progress, Tabs } from '@radix-ui/themes';
import { 
  Image, Crown, Star, Award, Shield, Zap,
  TrendingUp, Users, MessageCircle, Heart,
  CheckCircle, Calendar, ExternalLink, Copy,
  Upload, Edit, Save, X, Plus, Settings
} from 'lucide-react';
import { getCRYBNFTContract } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Achievement definitions
const ACHIEVEMENTS = {
  EARLY_ADOPTER: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined CRYB in the first month',
    icon: '🚀',
    rarity: 'legendary',
    requirement: 'Join before block 18000000',
    points: 1000,
    unlocked: true
  },
  FIRST_POST: {
    id: 'first_post',
    name: 'First Steps',
    description: 'Created your first post',
    icon: '📝',
    rarity: 'common',
    requirement: 'Create 1 post',
    points: 50,
    unlocked: true
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Followed 50+ users',
    icon: '🦋',
    rarity: 'rare',
    requirement: 'Follow 50 users',
    points: 250,
    unlocked: true
  },
  CONTENT_CREATOR: {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Created 100+ posts',
    icon: '🎨',
    rarity: 'epic',
    requirement: 'Create 100 posts',
    points: 500,
    unlocked: false
  },
  WHALE: {
    id: 'whale',
    name: 'CRYB Whale',
    description: 'Hold 100,000+ CRYB tokens',
    icon: '🐋',
    rarity: 'legendary',
    requirement: 'Hold 100,000 CRYB',
    points: 2000,
    unlocked: true
  },
  NFT_COLLECTOR: {
    id: 'nft_collector',
    name: 'NFT Collector',
    description: 'Own 10+ CRYB NFTs',
    icon: '🖼️',
    rarity: 'epic',
    requirement: 'Own 10 NFTs',
    points: 750,
    unlocked: false
  },
  COMMUNITY_LEADER: {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Created a successful community',
    icon: '👑',
    rarity: 'legendary',
    requirement: 'Create community with 1000+ members',
    points: 1500,
    unlocked: false
  },
  GENEROUS_TIPPER: {
    id: 'generous_tipper',
    name: 'Generous Tipper',
    description: 'Sent 100+ tips',
    icon: '💎',
    rarity: 'rare',
    requirement: 'Send 100 tips',
    points: 300,
    unlocked: true
  }
};

// Verification badge types
const VERIFICATION_BADGES = {
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    description: 'Verified account',
    icon: <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />,
    color: 'blue'
  },
  DEVELOPER: {
    id: 'developer',
    name: 'Developer',
    description: 'CRYB platform developer',
    icon: <Zap style={{
  width: '16px',
  height: '16px'
}} />,
    color: 'purple'
  },
  MODERATOR: {
    id: 'moderator',
    name: 'Moderator',
    description: 'Community moderator',
    icon: <Shield style={{
  width: '16px',
  height: '16px'
}} />,
    color: 'green'
  },
  CREATOR: {
    id: 'creator',
    name: 'Creator',
    description: 'Content creator',
    icon: <Star style={{
  width: '16px',
  height: '16px'
}} />,
    color: 'yellow'
  },
  AMBASSADOR: {
    id: 'ambassador',
    name: 'Ambassador',
    description: 'CRYB ambassador',
    icon: <Crown style={{
  width: '16px',
  height: '16px'
}} />,
    color: 'orange'
  }
};

const NFTProfileSystem = () => {
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedProfileNFT, setSelectedProfileNFT] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [verificationBadges, setVerificationBadges] = useState(['verified', 'creator']);
  const [profileStats, setProfileStats] = useState({
    totalPosts: 156,
    totalFollowers: 2430,
    totalFollowing: 487,
    totalLikes: 12890,
    joinDate: '2024-01-15',
    totalTips: 89,
    crybBalance: '25,847',
    achievementPoints: 3850
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: 'CryptoExplorer',
    bio: 'Building the future of Web3 social media 🚀',
    location: 'Metaverse',
    website: 'https://cryb.ai',
    twitter: '@crybplatform'
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (walletManager.isConnected) {
      loadProfileData();
    }
  }, [walletManager.isConnected]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const chainId = walletManager.currentChainId || 1;
      const userAddress = walletManager.account;
      const nftContract = getCRYBNFTContract(chainId);

      // Load user NFTs
      const nftData = await nftContract.getUserNFTs(userAddress);
      const nftsWithMetadata = await Promise.all(
        nftData.tokenIds.map(async (tokenId) => {
          const tokenURI = await nftContract.getTokenURI(tokenId);
          // Mock metadata - in real implementation would fetch from IPFS
          return {
            tokenId,
            name: `CRYB Genesis #${tokenId}`,
            description: `Unique CRYB NFT #${tokenId}`,
            image: `https://api.cryb.ai/nft/${tokenId}/image`,
            attributes: [
              { trait_type: 'Rarity', value: Math.random() > 0.8 ? 'Legendary' : Math.random() > 0.5 ? 'Rare' : 'Common' },
              { trait_type: 'Background', value: ['Cosmic', 'Nebula', 'Galaxy', 'Stars'][Math.floor(Math.random() * 4)] },
              { trait_type: 'Type', value: ['Avatar', 'Badge', 'Frame', 'Effect'][Math.floor(Math.random() * 4)] }
            ],
            isProfilePicture: tokenId === nftData.profilePictureTokenId
          };
        })
      );

      setUserNFTs(nftsWithMetadata);
      setSelectedProfileNFT(nftsWithMetadata.find(nft => nft.isProfilePicture) || null);

      // Load achievements
      const unlockedAchievements = Object.values(ACHIEVEMENTS).filter(achievement => 
        achievement.unlocked
      );
      setAchievements(unlockedAchievements);

    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfilePicture = async (nft) => {
    try {
      const chainId = walletManager.currentChainId || 1;
      const nftContract = getCRYBNFTContract(chainId);
      
      const txHash = await nftContract.setProfilePicture(nft.tokenId);
      
      setSelectedProfileNFT(nft);
      setUserNFTs(prev => prev.map(n => ({
        ...n,
        isProfilePicture: n.tokenId === nft.tokenId
      })));
    } catch (error) {
      console.error('Failed to set profile picture:', error);
    }
  };

  const saveProfile = () => {
    // In real implementation, would save to backend
    setEditMode(false);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'gray';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Profile Overview Component
  const ProfileOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
          {/* Profile Picture */}
          <div style={{
  position: 'relative'
}}>
            <div style={{
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  padding: '4px'
}}>
              <div style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                {selectedProfileNFT ? (
                  <img 
                    src={selectedProfileNFT.image} 
                    alt={selectedProfileNFT.name}
                    style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Image style={{
  width: '32px',
  height: '32px',
  color: '#c9d1d9'
}} />
                </div>
              </div>
            </div>
            
            {/* Verification Badges */}
            <div style={{
  position: 'absolute',
  display: 'flex'
}}>
              {verificationBadges.map(badgeId => {
                const badge = VERIFICATION_BADGES[badgeId];
                return badge ? (
                  <div 
                    key={badgeId}
                    style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                    title={badge.description}
                  >
                    {badge.icon}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Profile Info */}
          <div style={{
  flex: '1'
}}>
            {editMode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({...prev, displayName: e.target.value}))}
                  style={{
  fontWeight: 'bold',
  background: 'transparent'
}}
                />
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                  style={{
  width: '100%',
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  rows={2}
                  maxLength={160}
                />
                <div style={{
  display: 'grid',
  gap: '8px'
}}>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({...prev, location: e.target.value}))}
                    placeholder="Location"
                    style={{
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  />
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({...prev, website: e.target.value}))}
                    placeholder="Website"
                    style={{
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <h1 style={{
  fontWeight: 'bold'
}}>{profileData.displayName}</h1>
                  {verificationBadges.map(badgeId => {
                    const badge = VERIFICATION_BADGES[badgeId];
                    return badge ? badge.icon : null;
                  })}
                </div>
                <p style={{
  color: '#c9d1d9'
}}>{profileData.bio}</p>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#c9d1d9'
}}>
                  <span>📍 {profileData.location}</span>
                  <span>🌐 {profileData.website}</span>
                  <span>📅 Joined {formatDate(profileStats.joinDate)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
  display: 'flex'
}}>
            {editMode ? (
              <>
                <Button onClick={saveProfile}>
                  <Save style={{
  width: '16px',
  height: '16px'
}} />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  <X style={{
  width: '16px',
  height: '16px'
}} />
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Edit style={{
  width: '16px',
  height: '16px'
}} />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>{profileStats.totalPosts}</div>
          <div style={{
  color: '#c9d1d9'
}}>Posts</div>
        </Card>
        <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>{profileStats.totalFollowers.toLocaleString()}</div>
          <div style={{
  color: '#c9d1d9'
}}>Followers</div>
        </Card>
        <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>{profileStats.totalLikes.toLocaleString()}</div>
          <div style={{
  color: '#c9d1d9'
}}>Likes</div>
        </Card>
        <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>{profileStats.achievementPoints.toLocaleString()}</div>
          <div style={{
  color: '#c9d1d9'
}}>Achievement Points</div>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card style={{
  padding: '24px'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Recent Achievements</h3>
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          {achievements.slice(0, 4).map((achievement) => (
            <div key={achievement.id} style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px'
}}>
              <span className="text-2xl">{achievement.icon}</span>
              <div style={{
  flex: '1'
}}>
                <p style={{
  fontWeight: '500'
}}>{achievement.name}</p>
                <p style={{
  color: '#c9d1d9'
}}>{achievement.description}</p>
              </div>
              <Badge color={getRarityColor(achievement.rarity)}>
                +{achievement.points}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // NFT Collection Component
  const NFTCollection = () => (
    <div className="space-y-6">
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <h2 style={{
  fontWeight: 'bold'
}}>My NFT Collection</h2>
        <Badge variant="outline">{userNFTs.length} NFTs</Badge>
      </div>

      {userNFTs.length > 0 ? (
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          {userNFTs.map((nft) => (
            <Card key={nft.tokenId} style={{
  overflow: 'hidden'
}}>
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  style={{
  width: '100%',
  height: '100%'
}}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Image style={{
  width: '48px',
  height: '48px',
  color: '#c9d1d9'
}} />
                </div>
              </div>
              
              <div style={{
  padding: '16px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <h3 style={{
  fontWeight: '600'
}}>{nft.name}</h3>
                  {nft.isProfilePicture && (
                    <Badge color="blue" size="sm">Profile</Badge>
                  )}
                </div>
                
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <div style={{
  color: '#c9d1d9'
}}>
                    #{nft.tokenId}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setProfilePicture(nft)}
                    disabled={nft.isProfilePicture}
                  >
                    {nft.isProfilePicture ? 'Active' : 'Use'}
                  </Button>
                </div>
                
                {/* Attributes */}
                <div className="mt-3 space-y-1">
                  {nft.attributes.slice(0, 2).map((attr, index) => (
                    <div key={index} style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                      <span style={{
  color: '#c9d1d9'
}}>{attr.trait_type}:</span>
                      <span style={{
  fontWeight: '500'
}}>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{
  padding: '32px',
  textAlign: 'center'
}}>
          <Image style={{
  width: '64px',
  height: '64px',
  color: '#c9d1d9'
}} />
          <h3 style={{
  fontWeight: '600'
}}>No NFTs Found</h3>
          <p style={{
  color: '#c9d1d9'
}}>
            Mint or purchase CRYB NFTs to customize your profile
          </p>
          <Button>
            <Plus style={{
  width: '16px',
  height: '16px'
}} />
            Browse NFTs
          </Button>
        </Card>
      )}
    </div>
  );

  // Achievements Component
  const AchievementsSection = () => (
    <div className="space-y-6">
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <h2 style={{
  fontWeight: 'bold'
}}>Achievements</h2>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <Badge variant="outline">{achievements.length}/{Object.keys(ACHIEVEMENTS).length} Unlocked</Badge>
          <Badge color="orange">{profileStats.achievementPoints} Points</Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
          <span style={{
  fontWeight: '500'
}}>Achievement Progress</span>
          <span style={{
  color: '#c9d1d9'
}}>
            {Math.round((achievements.length / Object.keys(ACHIEVEMENTS).length) * 100)}%
          </span>
        </div>
        <Progress 
          value={(achievements.length / Object.keys(ACHIEVEMENTS).length) * 100} 
          style={{
  height: '8px'
}}
        />
      </Card>

      {/* Achievement Grid */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        {Object.values(ACHIEVEMENTS).map((achievement) => (
          <Card 
            key={achievement.id} 
            style={{
  padding: '16px'
}}
          >
            <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
              <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </div>
              
              <div style={{
  flex: '1'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <h3 style={{
  fontWeight: '600'
}}>{achievement.name}</h3>
                  <Badge color={getRarityColor(achievement.rarity)} size="sm">
                    {achievement.rarity}
                  </Badge>
                </div>
                
                <p style={{
  color: '#c9d1d9'
}}>{achievement.description}</p>
                
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#c9d1d9'
}}>{achievement.requirement}</span>
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <Badge variant="outline" size="sm">+{achievement.points}</Badge>
                    {achievement.unlocked && (
                      <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '32px',
  textAlign: 'center'
}}>
        <Image style={{
  width: '64px',
  height: '64px',
  color: '#c9d1d9'
}} />
        <h2 style={{
  fontWeight: 'bold'
}}>Connect Wallet</h2>
        <p style={{
  color: '#c9d1d9'
}}>
          Connect your wallet to view your NFT profile and achievements
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card style={{
  padding: '32px',
  textAlign: 'center'
}}>
        <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
        <p>Loading your profile...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <div>
          <h1 style={{
  fontWeight: 'bold'
}}>NFT Profile</h1>
          <p style={{
  color: '#c9d1d9'
}}>Customize your profile with NFTs and earn achievements</p>
        </div>
        
        <Button variant="outline">
          <Settings style={{
  width: '16px',
  height: '16px'
}} />
          Settings
        </Button>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">
            <Users style={{
  width: '16px',
  height: '16px'
}} />
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="nfts">
            <Image style={{
  width: '16px',
  height: '16px'
}} />
            NFT Collection
          </Tabs.Trigger>
          <Tabs.Trigger value="achievements">
            <Award style={{
  width: '16px',
  height: '16px'
}} />
            Achievements
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <ProfileOverview />
        </Tabs.Content>

        <Tabs.Content value="nfts">
          <NFTCollection />
        </Tabs.Content>

        <Tabs.Content value="achievements">
          <AchievementsSection />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};




export default ACHIEVEMENTS
