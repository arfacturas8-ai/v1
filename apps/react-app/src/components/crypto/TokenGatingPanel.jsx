import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Progress, Tabs, Dialog } from '@radix-ui/themes';
import { 
  Shield, Lock, Unlock, Crown, Star, Users, 
  CheckCircle, XCircle, AlertTriangle, Info,
  Coins, Image, TrendingUp, Settings
} from 'lucide-react';
import { 
  tokenGatingService, 
  COMMUNITY_ACCESS_LEVELS, 
  ACCESS_REQUIREMENT_TYPES,
  COMMUNITY_CONFIGS,
  PERMISSIONS
} from '../../services/tokenGatingService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

const TokenGatingPanel = ({ communityId = null, showGlobalAccess = true }) => {
  const [userAccess, setUserAccess] = useState(null);
  const [globalAccessLevel, setGlobalAccessLevel] = useState(null);
  const [userCommunities, setUserCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(communityId);
  const [showRequirements, setShowRequirements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user access data
  useEffect(() => {
    if (walletManager.isConnected) {
      loadUserAccess();
    } else {
      setIsLoading(false);
    }
  }, [walletManager.isConnected, selectedCommunity]);

  const loadUserAccess = async () => {
    try {
      setIsLoading(true);
      const userAddress = walletManager.account;

      // Load global access level
      if (showGlobalAccess) {
        const globalLevel = await tokenGatingService.getUserGlobalAccessLevel(userAddress);
        setGlobalAccessLevel(globalLevel);
      }

      // Load specific community access
      if (selectedCommunity) {
        const access = await tokenGatingService.getUserCommunityAccess(userAddress, selectedCommunity);
        setUserAccess(access);
      }

      // Load all accessible communities
      const communities = await tokenGatingService.getUserCommunities(userAddress);
      setUserCommunities(communities);
    } catch (error) {
      console.error('Failed to load user access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccess = async () => {
    setRefreshing(true);
    tokenGatingService.clearCache();
    await loadUserAccess();
    setRefreshing(false);
  };

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case 0: return <Shield style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />;
      case 1: return <Shield style={{
  width: '16px',
  height: '16px'
}} />;
      case 2: return <Shield style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />;
      case 3: return <Crown style={{
  width: '16px',
  height: '16px'
}} />;
      case 4: return <Crown style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />;
      case 5: return <Star style={{
  width: '16px',
  height: '16px'
}} />;
      default: return <Shield style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />;
    }
  };

  const getRequirementIcon = (type) => {
    switch (type) {
      case ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE:
        return <Coins style={{
  width: '16px',
  height: '16px'
}} />;
      case ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP:
        return <Image style={{
  width: '16px',
  height: '16px'
}} />;
      case ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT:
        return <TrendingUp style={{
  width: '16px',
  height: '16px'
}} />;
      case ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE:
        return <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />;
      default:
        return <Shield style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />;
    }
  };

  const formatRequirementText = (requirement) => {
    switch (requirement.type) {
      case ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE:
        const amount = (parseFloat(requirement.minAmount) / 1e18).toLocaleString();
        return `Hold ${amount} CRYB tokens`;
      case ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP:
        return `Own ${requirement.minCount || 1} NFT(s) from collection`;
      case ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT:
        const stakeAmount = (parseFloat(requirement.minAmount) / 1e18).toLocaleString();
        return `Stake ${stakeAmount} CRYB tokens`;
      case ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE:
        return 'Have verified badge';
      case ACCESS_REQUIREMENT_TYPES.SOCIAL_SCORE:
        return `Social score ≥ ${requirement.minScore}`;
      default:
        return 'Unknown requirement';
    }
  };

  // Wallet connection prompt
  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
        <div className="mb-4">
          <Lock style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
        </div>
        <h3 style={{
  fontWeight: '600'
}}>Connect Wallet to View Access</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Connect your wallet to check your community access levels and permissions
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  borderRadius: '50%',
  height: '24px',
  width: '24px'
}}></div>
          <span>Checking access requirements...</span>
        </div>
      </Card>
    );
  }

  // Global Access Level Component
  const GlobalAccessLevel = () => (
    <Card style={{
  padding: '16px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Global Access Level</h3>
        <Button variant="ghost" size="sm" onClick={refreshAccess} disabled={refreshing}>
          <Settings style={{
  width: '16px',
  height: '16px'
}} />
        </Button>
      </div>
      
      {globalAccessLevel && (
        <div className="space-y-3">
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            {getAccessLevelIcon(globalAccessLevel.level)}
            <div>
              <p style={{
  fontWeight: '500'
}} style={{ color: globalAccessLevel.color }}>
                {globalAccessLevel.name}
              </p>
              <p style={{
  color: '#A0A0A0'
}}>Level {globalAccessLevel.level}</p>
            </div>
          </div>
          
          <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '12px',
  borderRadius: '12px'
}}>
            <p style={{
  fontWeight: '500'
}}>Benefits:</p>
            <ul style={{
  color: '#A0A0A0'
}}>
              {globalAccessLevel.benefits.map((benefit, index) => (
                <li key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );

  // Community Access Component
  const CommunityAccess = () => {
    if (!selectedCommunity || !userAccess) return null;

    const community = COMMUNITY_CONFIGS[selectedCommunity];

    return (
      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h3 style={{
  fontWeight: '600'
}}>{community?.name || 'Community Access'}</h3>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            {userAccess.hasAccess ? (
              <Badge color="green">
                <Unlock style={{
  width: '12px',
  height: '12px'
}} />
                Access Granted
              </Badge>
            ) : (
              <Badge color="red">
                <Lock style={{
  width: '12px',
  height: '12px'
}} />
                Access Denied
              </Badge>
            )}
          </div>
        </div>

        {community && (
          <p style={{
  color: '#A0A0A0'
}}>{community.description}</p>
        )}

        {userAccess.hasAccess ? (
          <div className="space-y-4">
            {/* Access Level */}
            <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />
                <span style={{
  fontWeight: '500'
}}>
                  {userAccess.accessLevel?.name} Access
                </span>
              </div>
              <p className="text-sm text-green-700">
                {userAccess.accessLevel?.description}
              </p>
            </div>

            {/* Permissions */}
            <div>
              <p style={{
  fontWeight: '500'
}}>Your Permissions:</p>
              <div style={{
  display: 'grid',
  gap: '8px'
}}>
                {userAccess.permissions.map((permission) => (
                  <div key={permission} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                    <span>{PERMISSIONS[permission] || permission}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Failed Requirements */}
            <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <XCircle style={{
  width: '16px',
  height: '16px'
}} />
                <span style={{
  fontWeight: '500'
}}>Access Requirements Not Met</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {userAccess.failedRequirements?.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>

            {/* Show Requirements Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowRequirements(true)}
              style={{
  width: '100%'
}}
            >
              <Info style={{
  width: '16px',
  height: '16px'
}} />
              View Requirements
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // Accessible Communities Component
  const AccessibleCommunities = () => (
    <Card style={{
  padding: '16px'
}}>
      <h3 style={{
  fontWeight: '600'
}}>Your Communities</h3>
      
      {userCommunities.length > 0 ? (
        <div className="space-y-3">
          {userCommunities.map(({ communityId, community, accessLevel }) => (
            <div 
              key={communityId}
              style={{
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              onClick={() => setSelectedCommunity(communityId)}
            >
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <div>
                  <p style={{
  fontWeight: '500'
}}>{community.name}</p>
                  <p style={{
  color: '#A0A0A0'
}}>{accessLevel.name} Access</p>
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <Badge color="green" size="sm">
                    <Users style={{
  width: '12px',
  height: '12px'
}} />
                    Member
                  </Badge>
                  {selectedCommunity === communityId && (
                    <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
  textAlign: 'center',
  paddingTop: '24px',
  paddingBottom: '24px'
}}>
          <Users style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
          <p style={{
  color: '#A0A0A0'
}}>No accessible communities</p>
          <p style={{
  color: '#A0A0A0'
}}>
            Acquire tokens or NFTs to unlock community access
          </p>
        </div>
      )}
    </Card>
  );

  // Requirements Dialog
  const RequirementsDialog = () => {
    const community = COMMUNITY_CONFIGS[selectedCommunity];
    
    return (
      <Dialog.Root open={showRequirements} onOpenChange={setShowRequirements}>
        <Dialog.Content className="max-w-lg">
          <Dialog.Title style={{
  fontWeight: '600'
}}>
            Access Requirements for {community?.name}
          </Dialog.Title>
          
          <div className="space-y-4">
            {community?.requirements.map((requirement, index) => (
              <div key={index} style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  {getRequirementIcon(requirement.type)}
                  <span style={{
  fontWeight: '500'
}}>
                    {formatRequirementText(requirement)}
                  </span>
                </div>
                
                {requirement.type === ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS && (
                  <div className="ml-6 space-y-2">
                    <p style={{
  color: '#A0A0A0',
  fontWeight: '500'
}}>
                      {requirement.operator} of the following:
                    </p>
                    {requirement.conditions.map((condition, condIndex) => (
                      <div key={condIndex} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        {getRequirementIcon(condition.type)}
                        <span>{formatRequirementText(condition)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
            <Button variant="outline" onClick={() => setShowRequirements(false)}>
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    );
  };

  return (
    <div className="space-y-4">
      {/* Global Access Level */}
      {showGlobalAccess && <GlobalAccessLevel />}
      
      {/* Community Selection Tabs */}
      {Object.keys(COMMUNITY_CONFIGS).length > 1 && (
        <Card style={{
  padding: '16px'
}}>
          <h3 style={{
  fontWeight: '600'
}}>Select Community</h3>
          <div style={{
  display: 'grid',
  gap: '8px'
}}>
            {Object.entries(COMMUNITY_CONFIGS).map(([id, community]) => (
              <Button
                key={id}
                variant={selectedCommunity === id ? 'solid' : 'outline'}
                onClick={() => setSelectedCommunity(id)}
                style={{
  justifyContent: 'flex-start'
}}
              >
                {community.name}
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Community Access Details */}
      <CommunityAccess />
      
      {/* Accessible Communities List */}
      <AccessibleCommunities />
      
      {/* Requirements Dialog */}
      <RequirementsDialog />
    </div>
  );
};




export default TokenGatingPanel
