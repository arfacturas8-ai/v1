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
      case 0: return <Shield style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--text-tertiary)' }} />;
      case 1: return <Shield style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      case 2: return <Shield style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--text-tertiary)' }} />;
      case 3: return <Crown style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      case 4: return <Crown style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--text-tertiary)' }} />;
      case 5: return <Star style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      default: return <Shield style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--text-tertiary)' }} />;
    }
  };

  const getRequirementIcon = (type) => {
    switch (type) {
      case ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE:
        return <Coins style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      case ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP:
        return <Image style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      case ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT:
        return <TrendingUp style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      case ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE:
        return <CheckCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />;
      default:
        return <Shield style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--text-tertiary)' }} />;
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
      <Card className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Lock style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)', color: 'var(--text-tertiary)', margin: '0 auto' }} />
        </div>
        <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>Connect Wallet to View Access</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          Connect your wallet to check your community access levels and permissions
        </p>
        <Button className="btn-primary" onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Checking access requirements...</span>
        </div>
      </Card>
    );
  }

  // Global Access Level Component
  const GlobalAccessLevel = () => (
    <Card className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>Global Access Level</h3>
        <Button variant="ghost" size="sm" onClick={refreshAccess} disabled={refreshing}>
          <Settings style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
        </Button>
      </div>

      {globalAccessLevel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {getAccessLevelIcon(globalAccessLevel.level)}
            <div>
              <p style={{ fontWeight: 'var(--font-medium)', color: globalAccessLevel.color }}>
                {globalAccessLevel.name}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Level {globalAccessLevel.level}</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>Benefits:</p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', paddingLeft: 'var(--space-4)' }}>
              {globalAccessLevel.benefits.map((benefit, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <CheckCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-success)' }} />
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
      <Card className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{community?.name || 'Community Access'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {userAccess.hasAccess ? (
              <Badge color="green">
                <Unlock style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                Access Granted
              </Badge>
            ) : (
              <Badge color="red">
                <Lock style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                Access Denied
              </Badge>
            )}
          </div>
        </div>

        {community && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>{community.description}</p>
        )}

        {userAccess.hasAccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Access Level */}
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: `1px solid var(--border-subtle)`, background: 'var(--color-success-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <CheckCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-success)' }} />
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                  {userAccess.accessLevel?.name} Access
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-dark)' }}>
                {userAccess.accessLevel?.description}
              </p>
            </div>

            {/* Permissions */}
            <div>
              <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>Your Permissions:</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {userAccess.permissions.map((permission) => (
                  <div key={permission} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CheckCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-success)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{PERMISSIONS[permission] || permission}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Failed Requirements */}
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: `1px solid var(--border-subtle)`, background: 'var(--color-error-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <XCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-error)' }} />
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Access Requirements Not Met</span>
              </div>
              <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-dark)', paddingLeft: 'var(--space-4)' }}>
                {userAccess.failedRequirements?.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>

            {/* Show Requirements Button */}
            <Button
              variant="outline"
              onClick={() => setShowRequirements(true)}
              style={{ width: '100%' }}
            >
              <Info style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
              View Requirements
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // Accessible Communities Component
  const AccessibleCommunities = () => (
    <Card className="card" style={{ padding: 'var(--space-4)' }}>
      <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Your Communities</h3>

      {userCommunities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {userCommunities.map(({ communityId, community, accessLevel }) => (
            <div
              key={communityId}
              style={{
                padding: 'var(--space-3)',
                border: `1px solid var(--border-subtle)`,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)'
              }}
              onClick={() => setSelectedCommunity(communityId)}
              className="card-interactive"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{community.name}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{accessLevel.name} Access</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge color="green" size="sm">
                    <Users style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                    Member
                  </Badge>
                  {selectedCommunity === communityId && (
                    <CheckCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--brand-primary)' }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
          <Users style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)', color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>No accessible communities</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
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
          <Dialog.Title style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
            Access Requirements for {community?.name}
          </Dialog.Title>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {community?.requirements.map((requirement, index) => (
              <div key={index} style={{ border: `1px solid var(--border-subtle)`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  {getRequirementIcon(requirement.type)}
                  <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    {formatRequirementText(requirement)}
                  </span>
                </div>

                {requirement.type === ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS && (
                  <div style={{ marginLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                      {requirement.operator} of the following:
                    </p>
                    {requirement.conditions.map((condition, condIndex) => (
                      <div key={condIndex} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getRequirementIcon(condition.type)}
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formatRequirementText(condition)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <Button variant="outline" onClick={() => setShowRequirements(false)}>
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Global Access Level */}
      {showGlobalAccess && <GlobalAccessLevel />}

      {/* Community Selection Tabs */}
      {Object.keys(COMMUNITY_CONFIGS).length > 1 && (
        <Card className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Select Community</h3>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {Object.entries(COMMUNITY_CONFIGS).map(([id, community]) => (
              <Button
                key={id}
                variant={selectedCommunity === id ? 'solid' : 'outline'}
                onClick={() => setSelectedCommunity(id)}
                style={{ justifyContent: 'flex-start' }}
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
