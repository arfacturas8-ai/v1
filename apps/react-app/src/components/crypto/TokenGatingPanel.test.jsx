import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenGatingPanel from './TokenGatingPanel';
import { tokenGatingService, COMMUNITY_ACCESS_LEVELS, ACCESS_REQUIREMENT_TYPES, COMMUNITY_CONFIGS, PERMISSIONS } from '../../services/tokenGatingService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

jest.mock('../../services/tokenGatingService.js');
jest.mock('../../lib/web3/WalletManager.js');

describe('TokenGatingPanel', () => {
  const mockUserAddress = '0x1234567890abcdef1234567890abcdef12345678';

  const mockGlobalAccessLevel = {
    level: 3,
    name: 'Gold',
    color: '#FFD700',
    benefits: ['Access to premium features', 'Early access to new releases', 'Priority support']
  };

  const mockCommunityAccess = {
    hasAccess: true,
    accessLevel: {
      name: 'Premium',
      description: 'Full access to all features'
    },
    permissions: ['CREATE_POST', 'COMMENT', 'VOTE', 'MODERATE']
  };

  const mockCommunityAccessDenied = {
    hasAccess: false,
    failedRequirements: ['Need 1000 CRYB tokens', 'Need verified badge']
  };

  const mockUserCommunities = [
    {
      communityId: 'community1',
      community: { name: 'Premium Community' },
      accessLevel: { name: 'Gold' }
    },
    {
      communityId: 'community2',
      community: { name: 'Elite Community' },
      accessLevel: { name: 'Platinum' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    walletManager.isConnected = true;
    walletManager.account = mockUserAddress;
    walletManager.connect = jest.fn();
    tokenGatingService.clearCache = jest.fn();
  });

  describe('Wallet Connection', () => {
    test('displays connect wallet prompt when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<TokenGatingPanel />);

      expect(screen.getByText('Connect Wallet to View Access')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to check your community access levels and permissions')).toBeInTheDocument();
    });

    test('shows lock icon when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<TokenGatingPanel />);

      const lockIcon = document.querySelector('.lucide-lock');
      expect(lockIcon).toBeInTheDocument();
    });

    test('clicking connect wallet button calls walletManager.connect', () => {
      walletManager.isConnected = false;

      render(<TokenGatingPanel />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      fireEvent.click(connectButton);

      expect(walletManager.connect).toHaveBeenCalled();
    });

    test('does not show loading state when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<TokenGatingPanel />);

      expect(screen.queryByText('Checking access requirements...')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('displays loading state while checking access requirements', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn(() => new Promise(() => {}));

      render(<TokenGatingPanel />);

      expect(screen.getByText('Checking access requirements...')).toBeInTheDocument();
    });

    test('shows spinner during loading', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn(() => new Promise(() => {}));

      render(<TokenGatingPanel />);

      const spinner = document.querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    test('removes loading state after data is loaded', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Checking access requirements...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Global Access Level Display', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
    });

    test('displays global access level section', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Global Access Level')).toBeInTheDocument();
      });
    });

    test('shows access level name and level number', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Gold')).toBeInTheDocument();
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });
    });

    test('displays all benefits', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Access to premium features')).toBeInTheDocument();
        expect(screen.getByText('Early access to new releases')).toBeInTheDocument();
        expect(screen.getByText('Priority support')).toBeInTheDocument();
      });
    });

    test('shows benefits section header', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Benefits:')).toBeInTheDocument();
      });
    });

    test('does not show global access when showGlobalAccess is false', async () => {
      render(<TokenGatingPanel showGlobalAccess={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Global Access Level')).not.toBeInTheDocument();
      });

      expect(tokenGatingService.getUserGlobalAccessLevel).not.toHaveBeenCalled();
    });

    test('displays refresh button in global access section', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  describe('Community Access Display', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        description: 'A test community description'
      };
    });

    test('displays community access when communityId is provided', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeInTheDocument();
      });
    });

    test('shows access granted badge when user has access', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Access Granted')).toBeInTheDocument();
      });
    });

    test('shows unlock icon when access is granted', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const unlockIcon = document.querySelector('.lucide-unlock');
        expect(unlockIcon).toBeInTheDocument();
      });
    });

    test('displays community description', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('A test community description')).toBeInTheDocument();
      });
    });

    test('shows access level name for granted access', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Premium Access')).toBeInTheDocument();
      });
    });

    test('displays access level description', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Full access to all features')).toBeInTheDocument();
      });
    });

    test('lists all user permissions', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Your Permissions:')).toBeInTheDocument();
      });
    });
  });

  describe('Access Denied States', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        description: 'A test community description',
        requirements: []
      };
    });

    test('shows access denied badge when user does not have access', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    test('shows lock icon when access is denied', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const lockIcons = document.querySelectorAll('.lucide-lock');
        expect(lockIcons.length).toBeGreaterThan(0);
      });
    });

    test('displays failed requirements message', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('Access Requirements Not Met')).toBeInTheDocument();
      });
    });

    test('lists all failed requirements', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText(/Need 1000 CRYB tokens/)).toBeInTheDocument();
        expect(screen.getByText(/Need verified badge/)).toBeInTheDocument();
      });
    });

    test('shows view requirements button when access is denied', async () => {
      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(screen.getByText('View Requirements')).toBeInTheDocument();
      });
    });

    test('opens requirements dialog when view requirements is clicked', async () => {
      COMMUNITY_CONFIGS['test-community'].requirements = [
        { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' }
      ];

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Access Requirements for Test Community')).toBeInTheDocument();
      });
    });
  });

  describe('Accessible Communities List', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue(mockUserCommunities);
    });

    test('displays accessible communities section', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Your Communities')).toBeInTheDocument();
      });
    });

    test('lists all accessible communities', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Premium Community')).toBeInTheDocument();
        expect(screen.getByText('Elite Community')).toBeInTheDocument();
      });
    });

    test('shows access level for each community', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Gold Access')).toBeInTheDocument();
        expect(screen.getByText('Platinum Access')).toBeInTheDocument();
      });
    });

    test('shows member badge for each community', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        const memberBadges = screen.getAllByText('Member');
        expect(memberBadges).toHaveLength(2);
      });
    });

    test('displays empty state when no communities are accessible', async () => {
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('No accessible communities')).toBeInTheDocument();
        expect(screen.getByText('Acquire tokens or NFTs to unlock community access')).toBeInTheDocument();
      });
    });

    test('clicking on a community selects it', async () => {
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      COMMUNITY_CONFIGS['community1'] = { name: 'Premium Community', description: 'Premium' };

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const community = screen.getByText('Premium Community');
        fireEvent.click(community);
      });

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunityAccess).toHaveBeenCalledWith(mockUserAddress, 'community1');
      });
    });
  });

  describe('Community Selection', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
      COMMUNITY_CONFIGS['community1'] = { name: 'Community One', description: 'First' };
      COMMUNITY_CONFIGS['community2'] = { name: 'Community Two', description: 'Second' };
    });

    afterEach(() => {
      delete COMMUNITY_CONFIGS['community1'];
      delete COMMUNITY_CONFIGS['community2'];
    });

    test('shows community selection section when multiple communities exist', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Select Community')).toBeInTheDocument();
      });
    });

    test('displays all available communities as buttons', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.getByText('Community One')).toBeInTheDocument();
        expect(screen.getByText('Community Two')).toBeInTheDocument();
      });
    });

    test('clicking community button loads that community access', async () => {
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const communityButton = screen.getByText('Community Two');
        fireEvent.click(communityButton);
      });

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunityAccess).toHaveBeenCalledWith(mockUserAddress, 'community2');
      });
    });
  });

  describe('Requirements Dialog', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
    });

    test('displays token balance requirement correctly', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Hold 1,000 CRYB tokens/)).toBeInTheDocument();
      });
    });

    test('displays NFT ownership requirement correctly', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP, minCount: 3 }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Own 3 NFT\(s\) from collection/)).toBeInTheDocument();
      });
    });

    test('displays staking requirement correctly', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT, minAmount: '5000000000000000000000' }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Stake 5,000 CRYB tokens/)).toBeInTheDocument();
      });
    });

    test('displays verification badge requirement correctly', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Have verified badge')).toBeInTheDocument();
      });
    });

    test('displays social score requirement correctly', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.SOCIAL_SCORE, minScore: 500 }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Social score ≥ 500')).toBeInTheDocument();
      });
    });

    test('closes dialog when close button is clicked', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: []
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Access Requirements for Test Community')).not.toBeInTheDocument();
      });
    });

    test('displays multiple requirements', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' },
          { type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP, minCount: 1 },
          { type: ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Hold 1,000 CRYB tokens/)).toBeInTheDocument();
        expect(screen.getByText(/Own 1 NFT\(s\) from collection/)).toBeInTheDocument();
        expect(screen.getByText('Have verified badge')).toBeInTheDocument();
      });
    });

    test('displays combined requirements with AND operator', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          {
            type: ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS,
            operator: 'AND',
            conditions: [
              { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' },
              { type: ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE }
            ]
          }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('AND of the following:')).toBeInTheDocument();
      });
    });

    test('displays combined requirements with OR operator', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          {
            type: ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS,
            operator: 'OR',
            conditions: [
              { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' },
              { type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP, minCount: 1 }
            ]
          }
        ]
      };

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('OR of the following:')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);
    });

    test('clicking refresh button clears cache', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(tokenGatingService.clearCache).toHaveBeenCalled();
      });
    });

    test('clicking refresh button reloads user access', async () => {
      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );

        tokenGatingService.getUserGlobalAccessLevel.mockClear();
        tokenGatingService.getUserCommunities.mockClear();

        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(tokenGatingService.getUserGlobalAccessLevel).toHaveBeenCalled();
        expect(tokenGatingService.getUserCommunities).toHaveBeenCalled();
      });
    });

    test('refresh button shows spinning animation while refreshing', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve(mockGlobalAccessLevel), 100))
      );

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );
        fireEvent.click(refreshButton);
      });

      const settingsIcon = document.querySelector('.lucide-settings.');
      expect(settingsIcon).toBeInTheDocument();
    });

    test('refresh button is disabled while refreshing', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve(mockGlobalAccessLevel), 100))
      );

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );
        fireEvent.click(refreshButton);
      });

      const refreshButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-settings')
      );
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    test('handles error when loading global access level fails', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockRejectedValue(new Error('API Error'));
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load user access:', expect.any(Error));
      });
    });

    test('handles error when loading community access fails', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockRejectedValue(new Error('API Error'));
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load user access:', expect.any(Error));
      });
    });

    test('handles error when loading user communities fails', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockRejectedValue(new Error('API Error'));

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load user access:', expect.any(Error));
      });
    });

    test('continues loading after error and shows empty states', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockRejectedValue(new Error('API Error'));
      tokenGatingService.getUserCommunities = jest.fn().mockRejectedValue(new Error('API Error'));

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Checking access requirements...')).not.toBeInTheDocument();
      });
    });

    test('handles error during refresh', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn()
        .mockResolvedValueOnce(mockGlobalAccessLevel)
        .mockRejectedValueOnce(new Error('Refresh Error'));
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('.lucide-settings')
        );
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load user access:', expect.any(Error));
      });
    });
  });

  describe('Access Level Icons', () => {
    test('displays correct icon for level 0', async () => {
      const levelZeroAccess = { ...mockGlobalAccessLevel, level: 0 };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(levelZeroAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const shieldIcon = document.querySelector('.lucide-shield');
        expect(shieldIcon).toBeInTheDocument();
      });
    });

    test('displays correct icon for level 1 (bronze)', async () => {
      const bronzeAccess = { ...mockGlobalAccessLevel, level: 1 };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(bronzeAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const shieldIcon = document.querySelector('.lucide-shield');
        expect(shieldIcon).toBeInTheDocument();
      });
    });

    test('displays correct icon for level 3 (gold)', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const crownIcon = document.querySelector('.lucide-crown');
        expect(crownIcon).toBeInTheDocument();
      });
    });

    test('displays correct icon for level 5', async () => {
      const levelFiveAccess = { ...mockGlobalAccessLevel, level: 5 };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(levelFiveAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const starIcon = document.querySelector('.lucide-star');
        expect(starIcon).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('calls getUserGlobalAccessLevel with correct user address', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(tokenGatingService.getUserGlobalAccessLevel).toHaveBeenCalledWith(mockUserAddress);
      });
    });

    test('calls getUserCommunityAccess with correct parameters', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunityAccess).toHaveBeenCalledWith(mockUserAddress, 'test-community');
      });
    });

    test('calls getUserCommunities with correct user address', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunities).toHaveBeenCalledWith(mockUserAddress);
      });
    });

    test('does not call getUserCommunityAccess when no communityId is provided', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(tokenGatingService.getUserGlobalAccessLevel).toHaveBeenCalled();
      });

      expect(tokenGatingService.getUserCommunityAccess).not.toHaveBeenCalled();
    });

    test('reloads data when selectedCommunity changes', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue(mockUserCommunities);
      COMMUNITY_CONFIGS['community1'] = { name: 'Premium Community', description: 'Premium' };
      COMMUNITY_CONFIGS['community2'] = { name: 'Elite Community', description: 'Elite' };

      render(<TokenGatingPanel />);

      await waitFor(() => {
        const community = screen.getByText('Elite Community');
        fireEvent.click(community);
      });

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunityAccess).toHaveBeenCalledWith(mockUserAddress, 'community2');
      });
    });
  });

  describe('Component Props', () => {
    test('uses communityId prop to load specific community', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="specific-community" />);

      await waitFor(() => {
        expect(tokenGatingService.getUserCommunityAccess).toHaveBeenCalledWith(mockUserAddress, 'specific-community');
      });
    });

    test('showGlobalAccess prop controls global access display', async () => {
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel showGlobalAccess={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Global Access Level')).not.toBeInTheDocument();
      });
    });

    test('showGlobalAccess defaults to true', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(tokenGatingService.getUserGlobalAccessLevel).toHaveBeenCalled();
        expect(screen.getByText('Global Access Level')).toBeInTheDocument();
      });
    });

    test('communityId prop defaults to null', async () => {
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccess);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel />);

      await waitFor(() => {
        expect(tokenGatingService.getUserGlobalAccessLevel).toHaveBeenCalled();
      });

      expect(tokenGatingService.getUserCommunityAccess).not.toHaveBeenCalled();
    });
  });

  describe('Requirement Type Icons', () => {
    test('shows coins icon for token balance requirement', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1000000000000000000000' }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        const coinsIcon = document.querySelector('.lucide-coins');
        expect(coinsIcon).toBeInTheDocument();
      });
    });

    test('shows image icon for NFT ownership requirement', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP, minCount: 1 }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        const imageIcon = document.querySelector('.lucide-image');
        expect(imageIcon).toBeInTheDocument();
      });
    });

    test('shows trending up icon for staking requirement', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT, minAmount: '1000000000000000000000' }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        const trendingIcon = document.querySelector('.lucide-trending-up');
        expect(trendingIcon).toBeInTheDocument();
      });
    });

    test('shows check circle icon for verification badge requirement', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        const checkIcons = document.querySelectorAll('.lucide-check-circle');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Token Amount Formatting', () => {
    test('formats token amounts with proper decimals', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE, minAmount: '1500000000000000000000' }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Hold 1,500 CRYB tokens/)).toBeInTheDocument();
      });
    });

    test('formats staking amounts with proper decimals', async () => {
      COMMUNITY_CONFIGS['test-community'] = {
        name: 'Test Community',
        requirements: [
          { type: ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT, minAmount: '10000000000000000000000' }
        ]
      };
      tokenGatingService.getUserGlobalAccessLevel = jest.fn().mockResolvedValue(mockGlobalAccessLevel);
      tokenGatingService.getUserCommunityAccess = jest.fn().mockResolvedValue(mockCommunityAccessDenied);
      tokenGatingService.getUserCommunities = jest.fn().mockResolvedValue([]);

      render(<TokenGatingPanel communityId="test-community" />);

      await waitFor(() => {
        const viewButton = screen.getByText('View Requirements');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Stake 10,000 CRYB tokens/)).toBeInTheDocument();
      });
    });
  });
});

export default mockUserAddress
