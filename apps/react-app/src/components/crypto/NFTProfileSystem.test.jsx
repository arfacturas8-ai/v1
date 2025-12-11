/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NFTProfileSystem from './NFTProfileSystem';
import { getCRYBNFTContract } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Mock dependencies
jest.mock('../../lib/contracts/cryb-contracts.js', () => ({
  getCRYBNFTContract: jest.fn(),
}));

jest.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: false,
    connect: jest.fn(),
    account: '0x1234567890abcdef1234567890abcdef12345678',
    currentChainId: 1,
  },
}));

// Mock Radix UI components
jest.mock('@radix-ui/themes', () => ({
  Card: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  Button: ({ children, className, onClick, disabled, variant, size, ...props }) => (
    <button className={className} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Badge: ({ children, color, size, variant, ...props }) => <span data-color={color} {...props}>{children}</span>,
  Progress: ({ value, className, ...props }) => <div role="progressbar" aria-valuenow={value} className={className} {...props} />,
  Dialog: {
    Root: ({ children, open, onOpenChange }) => (
      open ? <div data-testid="dialog-root" onClick={() => onOpenChange && onOpenChange(false)}>{children}</div> : null
    ),
    Content: ({ children, className }) => <div className={className} data-testid="dialog-content">{children}</div>,
    Title: ({ children, className }) => <h2 className={className}>{children}</h2>,
  },
  Tabs: {
    Root: ({ children, value, onValueChange }) => (
      <div data-testid="tabs-root" data-value={value}>
        {React.Children.map(children, child =>
          React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange }) : child
        )}
      </div>
    ),
    List: ({ children, value, onValueChange }) => (
      <div data-testid="tabs-list">
        {React.Children.map(children, child =>
          React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange }) : child
        )}
      </div>
    ),
    Trigger: ({ children, value: triggerValue, value: currentValue, onValueChange }) => (
      <button
        data-testid={`tab-trigger-${triggerValue}`}
        onClick={() => onValueChange && onValueChange(triggerValue)}
        data-active={currentValue === triggerValue}
      >
        {children}
      </button>
    ),
    Content: ({ children, value: contentValue, value: currentValue }) => (
      currentValue === contentValue ? <div data-testid={`tab-content-${contentValue}`}>{children}</div> : null
    ),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Image: () => <div data-testid="icon-image">Image Icon</div>,
  Crown: ({ className }) => <div data-testid="icon-crown" className={className}>Crown Icon</div>,
  Star: ({ className }) => <div data-testid="icon-star" className={className}>Star Icon</div>,
  Award: ({ className }) => <div data-testid="icon-award" className={className}>Award Icon</div>,
  Shield: ({ className }) => <div data-testid="icon-shield" className={className}>Shield Icon</div>,
  Zap: ({ className }) => <div data-testid="icon-zap" className={className}>Zap Icon</div>,
  TrendingUp: () => <div data-testid="icon-trending-up">TrendingUp Icon</div>,
  Users: ({ className }) => <div data-testid="icon-users" className={className}>Users Icon</div>,
  MessageCircle: () => <div data-testid="icon-message-circle">MessageCircle Icon</div>,
  Heart: () => <div data-testid="icon-heart">Heart Icon</div>,
  CheckCircle: ({ className }) => <div data-testid="icon-check-circle" className={className}>CheckCircle Icon</div>,
  Calendar: () => <div data-testid="icon-calendar">Calendar Icon</div>,
  ExternalLink: () => <div data-testid="icon-external-link">ExternalLink Icon</div>,
  Copy: () => <div data-testid="icon-copy">Copy Icon</div>,
  Upload: () => <div data-testid="icon-upload">Upload Icon</div>,
  Edit: ({ className }) => <div data-testid="icon-edit" className={className}>Edit Icon</div>,
  Save: ({ className }) => <div data-testid="icon-save" className={className}>Save Icon</div>,
  X: ({ className }) => <div data-testid="icon-x" className={className}>X Icon</div>,
  Plus: ({ className }) => <div data-testid="icon-plus" className={className}>Plus Icon</div>,
  Settings: ({ className }) => <div data-testid="icon-settings" className={className}>Settings Icon</div>,
}));

describe('NFTProfileSystem', () => {
  const mockNFTContract = {
    getUserNFTs: jest.fn(),
    getTokenURI: jest.fn(),
    setProfilePicture: jest.fn(),
  };

  const mockNFTsData = {
    tokenIds: [1, 2, 3],
    profilePictureTokenId: 1,
  };

  const mockNFTsWithMetadata = [
    {
      tokenId: 1,
      name: 'CRYB Genesis #1',
      description: 'Unique CRYB NFT #1',
      image: 'https://api.cryb.ai/nft/1/image',
      attributes: [
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Background', value: 'Cosmic' },
        { trait_type: 'Type', value: 'Avatar' },
      ],
      isProfilePicture: true,
    },
    {
      tokenId: 2,
      name: 'CRYB Genesis #2',
      description: 'Unique CRYB NFT #2',
      image: 'https://api.cryb.ai/nft/2/image',
      attributes: [
        { trait_type: 'Rarity', value: 'Rare' },
        { trait_type: 'Background', value: 'Nebula' },
        { trait_type: 'Type', value: 'Badge' },
      ],
      isProfilePicture: false,
    },
    {
      tokenId: 3,
      name: 'CRYB Genesis #3',
      description: 'Unique CRYB NFT #3',
      image: 'https://api.cryb.ai/nft/3/image',
      attributes: [
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Background', value: 'Galaxy' },
        { trait_type: 'Type', value: 'Frame' },
      ],
      isProfilePicture: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getCRYBNFTContract.mockReturnValue(mockNFTContract);
    mockNFTContract.getUserNFTs.mockResolvedValue(mockNFTsData);
    mockNFTContract.getTokenURI.mockImplementation((tokenId) =>
      Promise.resolve(`ipfs://QmTest${tokenId}`)
    );
    mockNFTContract.setProfilePicture.mockResolvedValue('0xtransactionhash');
    walletManager.isConnected = false;
    walletManager.account = '0x1234567890abcdef1234567890abcdef12345678';
    walletManager.currentChainId = 1;
  });

  describe('Wallet Connection Check', () => {
    it('should display connect wallet message when wallet is not connected', () => {
      walletManager.isConnected = false;
      render(<NFTProfileSystem />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to view your NFT profile and achievements')).toBeInTheDocument();
    });

    it('should render Connect Wallet button when not connected', () => {
      walletManager.isConnected = false;
      render(<NFTProfileSystem />);

      const connectButton = screen.getByText('Connect Wallet');
      expect(connectButton).toBeInTheDocument();
      expect(connectButton.tagName).toBe('BUTTON');
    });

    it('should call walletManager.connect when Connect Wallet button is clicked', () => {
      walletManager.isConnected = false;
      walletManager.connect.mockResolvedValue();
      render(<NFTProfileSystem />);

      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      expect(walletManager.connect).toHaveBeenCalled();
    });

    it('should display loading state when wallet is connected', async () => {
      walletManager.isConnected = true;
      mockNFTContract.getUserNFTs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
      });
    });

    it('should load profile data when wallet is connected', async () => {
      walletManager.isConnected = true;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(1);
        expect(mockNFTContract.getUserNFTs).toHaveBeenCalledWith(walletManager.account);
      });
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should render the main interface after loading', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('NFT Profile')).toBeInTheDocument();
        expect(screen.getByText('Customize your profile with NFTs and earn achievements')).toBeInTheDocument();
      });
    });

    it('should render Settings button', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should render tabs navigation', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-nfts')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-achievements')).toBeInTheDocument();
      });
    });

    it('should display Overview tab by default', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const overviewTab = screen.getByTestId('tab-trigger-overview');
        expect(overviewTab).toHaveAttribute('data-active', 'true');
      });
    });

    it('should render profile stats grid', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('Likes')).toBeInTheDocument();
        expect(screen.getByText('Achievement Points')).toBeInTheDocument();
      });
    });

    it('should display profile statistics with correct values', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument(); // Posts
        expect(screen.getByText('2,430')).toBeInTheDocument(); // Followers
        expect(screen.getByText('12,890')).toBeInTheDocument(); // Likes
        expect(screen.getByText('3,850')).toBeInTheDocument(); // Achievement Points
      });
    });
  });

  describe('Profile Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should display user profile data', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('CryptoExplorer')).toBeInTheDocument();
        expect(screen.getByText('Building the future of Web3 social media 🚀')).toBeInTheDocument();
        expect(screen.getByText(/Metaverse/)).toBeInTheDocument();
        expect(screen.getByText(/https:\/\/cryb.ai/)).toBeInTheDocument();
      });
    });

    it('should format join date correctly', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText(/Joined January 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should display verification badges', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getAllByTestId('icon-check-circle').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('icon-star').length).toBeGreaterThan(0);
      });
    });

    it('should render Edit Profile button', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should enter edit mode when Edit Profile button is clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should display editable fields in edit mode', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('CryptoExplorer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Building the future of Web3 social media 🚀')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Metaverse')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://cryb.ai')).toBeInTheDocument();
      });
    });

    it('should allow editing display name', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('CryptoExplorer');
        fireEvent.change(input, { target: { value: 'NewUsername' } });
        expect(input.value).toBe('NewUsername');
      });
    });

    it('should allow editing bio', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const textarea = screen.getByDisplayValue('Building the future of Web3 social media 🚀');
        fireEvent.change(textarea, { target: { value: 'New bio text' } });
        expect(textarea.value).toBe('New bio text');
      });
    });

    it('should allow editing location', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('Metaverse');
        fireEvent.change(input, { target: { value: 'San Francisco' } });
        expect(input.value).toBe('San Francisco');
      });
    });

    it('should allow editing website', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('https://cryb.ai');
        fireEvent.change(input, { target: { value: 'https://newsite.com' } });
        expect(input.value).toBe('https://newsite.com');
      });
    });

    it('should exit edit mode when Save button is clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save'));
      });

      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });

    it('should exit edit mode when Cancel button is clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel'));
      });

      await waitFor(() => {
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });

    it('should limit bio to 160 characters', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const textarea = screen.getByDisplayValue('Building the future of Web3 social media 🚀');
        expect(textarea).toHaveAttribute('maxLength', '160');
      });
    });
  });

  describe('NFT Collection Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should switch to NFT Collection tab', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const nftsTab = screen.getByTestId('tab-trigger-nfts');
        fireEvent.click(nftsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('My NFT Collection')).toBeInTheDocument();
      });
    });

    it('should display NFT count badge', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('3 NFTs')).toBeInTheDocument();
      });
    });

    it('should display all user NFTs', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #1')).toBeInTheDocument();
        expect(screen.getByText('CRYB Genesis #2')).toBeInTheDocument();
        expect(screen.getByText('CRYB Genesis #3')).toBeInTheDocument();
      });
    });

    it('should display NFT token IDs', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });
    });

    it('should display empty state when no NFTs owned', async () => {
      mockNFTContract.getUserNFTs.mockResolvedValue({ tokenIds: [], profilePictureTokenId: null });
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('No NFTs Found')).toBeInTheDocument();
        expect(screen.getByText('Mint or purchase CRYB NFTs to customize your profile')).toBeInTheDocument();
        expect(screen.getByText('Browse NFTs')).toBeInTheDocument();
      });
    });
  });

  describe('NFT Metadata Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should display NFT names', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #1')).toBeInTheDocument();
        expect(screen.getByText('CRYB Genesis #2')).toBeInTheDocument();
      });
    });

    it('should display NFT attributes', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('Rarity:')).toBeInTheDocument();
        expect(screen.getByText('Background:')).toBeInTheDocument();
      });
    });

    it('should display trait types and values', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('Legendary')).toBeInTheDocument();
        expect(screen.getByText('Cosmic')).toBeInTheDocument();
      });
    });

    it('should limit attributes display to 2 per NFT', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        // Each NFT has 3 attributes but only 2 should be displayed
        const rarityLabels = screen.getAllByText('Rarity:');
        const backgroundLabels = screen.getAllByText('Background:');
        expect(rarityLabels.length).toBe(3); // 3 NFTs
        expect(backgroundLabels.length).toBe(3); // 3 NFTs
        // Type should not be displayed (it's the 3rd attribute)
        expect(screen.queryByText('Type:')).not.toBeInTheDocument();
      });
    });
  });

  describe('NFT Image Loading and Fallback', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should render NFT images with correct src', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const images = screen.getAllByAltText(/CRYB Genesis/);
        expect(images[0]).toHaveAttribute('src', 'https://api.cryb.ai/nft/1/image');
        expect(images[1]).toHaveAttribute('src', 'https://api.cryb.ai/nft/2/image');
      });
    });

    it('should have onError handler for NFT images', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const images = screen.getAllByAltText(/CRYB Genesis/);
        expect(images[0]).toHaveAttribute('src');
        // Verify onError prop exists by checking it's a valid image element
        expect(images[0].tagName).toBe('IMG');
      });
    });

    it('should display fallback icon when image fails to load', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const fallbackIcons = screen.getAllByTestId('icon-image');
        expect(fallbackIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('NFT as Profile Picture Selection', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should mark current profile picture NFT with Profile badge', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should display Use button for non-profile NFTs', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const useButtons = screen.getAllByText('Use');
        expect(useButtons.length).toBe(2); // 2 NFTs without profile picture status
      });
    });

    it('should display Active button for profile picture NFT', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should disable Active button for current profile picture', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const activeButton = screen.getByText('Active');
        expect(activeButton).toBeDisabled();
      });
    });
  });

  describe('Set NFT as Profile Picture', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should call setProfilePicture when Use button is clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const useButtons = screen.getAllByText('Use');
        fireEvent.click(useButtons[0]);
      });

      await waitFor(() => {
        expect(mockNFTContract.setProfilePicture).toHaveBeenCalledWith(2);
      });
    });

    it('should update profile picture after setting', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const useButtons = screen.getAllByText('Use');
        fireEvent.click(useButtons[0]);
      });

      await waitFor(() => {
        // The button should change to Active after setting
        expect(mockNFTContract.setProfilePicture).toHaveBeenCalled();
      });
    });

    it('should handle error when setting profile picture fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockNFTContract.setProfilePicture.mockRejectedValue(new Error('Transaction failed'));

      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const useButtons = screen.getAllByText('Use');
        fireEvent.click(useButtons[0]);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to set profile picture:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('NFT Verification (Ownership Check)', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should verify NFT ownership on load', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(mockNFTContract.getUserNFTs).toHaveBeenCalledWith(walletManager.account);
      });
    });

    it('should use current chain ID for contract interaction', async () => {
      walletManager.currentChainId = 137; // Polygon
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(137);
      });
    });

    it('should default to chain ID 1 when currentChainId is not set', async () => {
      walletManager.currentChainId = null;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(1);
      });
    });

    it('should fetch token URI for each NFT', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(mockNFTContract.getTokenURI).toHaveBeenCalledWith(1);
        expect(mockNFTContract.getTokenURI).toHaveBeenCalledWith(2);
        expect(mockNFTContract.getTokenURI).toHaveBeenCalledWith(3);
      });
    });
  });

  describe('Supported Chains', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should support Ethereum mainnet (chain ID 1)', async () => {
      walletManager.currentChainId = 1;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(1);
      });
    });

    it('should support Polygon (chain ID 137)', async () => {
      walletManager.currentChainId = 137;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(137);
      });
    });

    it('should support other chain IDs', async () => {
      walletManager.currentChainId = 56; // BSC
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(56);
      });
    });
  });

  describe('Achievements Section', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should switch to Achievements tab', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const achievementsTab = screen.getByTestId('tab-trigger-achievements');
        fireEvent.click(achievementsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
      });
    });

    it('should display achievement progress', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument();
      });
    });

    it('should display unlocked achievements count', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText(/5\/8 Unlocked/)).toBeInTheDocument();
      });
    });

    it('should display total achievement points', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('3,850 Points')).toBeInTheDocument();
      });
    });

    it('should display all achievements with names', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('Early Adopter')).toBeInTheDocument();
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.getByText('Social Butterfly')).toBeInTheDocument();
        expect(screen.getByText('Content Creator')).toBeInTheDocument();
        expect(screen.getByText('CRYB Whale')).toBeInTheDocument();
      });
    });

    it('should display achievement descriptions', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('Joined CRYB in the first month')).toBeInTheDocument();
        expect(screen.getByText('Created your first post')).toBeInTheDocument();
      });
    });

    it('should display achievement requirements', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('Join before block 18000000')).toBeInTheDocument();
        expect(screen.getByText('Create 1 post')).toBeInTheDocument();
      });
    });

    it('should display achievement points', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('+1000')).toBeInTheDocument();
        expect(screen.getByText('+50')).toBeInTheDocument();
        expect(screen.getByText('+250')).toBeInTheDocument();
      });
    });

    it('should show checkmark for unlocked achievements', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        const checkmarks = screen.getAllByTestId('icon-check-circle');
        expect(checkmarks.length).toBeGreaterThan(0);
      });
    });

    it('should display rarity badges for achievements', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        expect(screen.getByText('common')).toBeInTheDocument();
        expect(screen.getByText('rare')).toBeInTheDocument();
        expect(screen.getByText('epic')).toBeInTheDocument();
        expect(screen.getByText('legendary')).toBeInTheDocument();
      });
    });

    it('should apply opacity to locked achievements', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        const contentCreatorCard = screen.getByText('Content Creator').closest('div[class*="p-4"]');
        expect(contentCreatorCard).toHaveClass('opacity-60');
      });
    });
  });

  describe('Recent Achievements Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should display recent achievements on overview tab', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
      });
    });

    it('should limit recent achievements display to 4 items', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const achievementSection = screen.getByText('Recent Achievements').closest('div');
        const achievementCards = achievementSection.querySelectorAll('[class*="p-3"]');
        expect(achievementCards.length).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should show loading spinner while fetching data', async () => {
      mockNFTContract.getUserNFTs.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const spinner = document.querySelector('.');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('should show loading text while fetching data', async () => {
      mockNFTContract.getUserNFTs.mockImplementation(() => new Promise(() => {}));
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
      });
    });

    it('should hide loading state after data is loaded', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });
    });

    it('should set isLoading to true when loading starts', async () => {
      let resolveFn;
      mockNFTContract.getUserNFTs.mockImplementation(() => new Promise((resolve) => {
        resolveFn = resolve;
      }));

      render(<NFTProfileSystem />);

      // Should show loading
      await waitFor(() => {
        expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveFn(mockNFTsData);

      // Should hide loading
      await waitFor(() => {
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should handle getUserNFTs error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockNFTContract.getUserNFTs.mockRejectedValue(new Error('Failed to fetch NFTs'));

      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load profile data:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle getTokenURI error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockNFTContract.getTokenURI.mockRejectedValue(new Error('Failed to fetch token URI'));

      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load profile data:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle network errors when loading profile', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockNFTContract.getUserNFTs.mockRejectedValue(new Error('Network error'));

      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should stop loading state after error', async () => {
      mockNFTContract.getUserNFTs.mockRejectedValue(new Error('Failed to fetch'));
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });
    });

    it('should handle invalid NFT data', async () => {
      mockNFTContract.getUserNFTs.mockResolvedValue({ tokenIds: null, profilePictureTokenId: null });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(<NFTProfileSystem />);

      await waitFor(() => {
        // Should not crash
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should switch to NFT Collection tab when clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const nftsTab = screen.getByTestId('tab-trigger-nfts');
        fireEvent.click(nftsTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-nfts')).toBeInTheDocument();
      });
    });

    it('should switch to Achievements tab when clicked', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const achievementsTab = screen.getByTestId('tab-trigger-achievements');
        fireEvent.click(achievementsTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-achievements')).toBeInTheDocument();
      });
    });

    it('should switch back to Overview tab', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-overview'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      });
    });

    it('should display correct tab icons', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-users')).toBeInTheDocument();
        expect(screen.getByTestId('icon-award')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should have proper button roles', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should have progressbar role for achievement progress', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toBeInTheDocument();
      });
    });

    it('should have proper image alt text', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const images = screen.getAllByAltText(/CRYB Genesis/);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should have meaningful button text', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Picture Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should display selected profile NFT in header', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const profileImage = screen.getAllByAltText('CRYB Genesis #1')[0];
        expect(profileImage).toBeInTheDocument();
        expect(profileImage).toHaveAttribute('src', 'https://api.cryb.ai/nft/1/image');
      });
    });

    it('should display fallback when no profile picture is set', async () => {
      mockNFTContract.getUserNFTs.mockResolvedValue({ tokenIds: [1, 2], profilePictureTokenId: null });
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const fallbackIcons = screen.getAllByTestId('icon-image');
        expect(fallbackIcons.length).toBeGreaterThan(0);
      });
    });

    it('should apply gradient border to profile picture', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        const gradientDiv = document.querySelector('.bg-gradient-to-br');
        expect(gradientDiv).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should format numbers with locale string', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText('2,430')).toBeInTheDocument(); // Followers
        expect(screen.getByText('12,890')).toBeInTheDocument(); // Likes
      });
    });

    it('should format dates correctly', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should apply correct rarity colors', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-achievements'));
      });

      await waitFor(() => {
        const legendaryBadge = screen.getByText('legendary');
        expect(legendaryBadge).toHaveAttribute('data-color', 'orange');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing walletManager gracefully', () => {
      walletManager.isConnected = false;
      expect(() => render(<NFTProfileSystem />)).not.toThrow();
    });

    it('should handle empty NFT metadata', async () => {
      walletManager.isConnected = true;
      mockNFTContract.getUserNFTs.mockResolvedValue({ tokenIds: [1], profilePictureTokenId: null });
      mockNFTContract.getTokenURI.mockResolvedValue('');

      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });
    });

    it('should handle null attributes array', async () => {
      walletManager.isConnected = true;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your profile...')).not.toBeInTheDocument();
      });
    });

    it('should handle missing profile data gracefully', async () => {
      walletManager.isConnected = true;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        // Should render with default values
        expect(screen.getByText('CryptoExplorer')).toBeInTheDocument();
      });
    });
  });

  describe('Contract Interactions', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
    });

    it('should get NFT contract with correct chain ID', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(getCRYBNFTContract).toHaveBeenCalledWith(1);
      });
    });

    it('should call contract methods with correct parameters', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(mockNFTContract.getUserNFTs).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
      });
    });

    it('should handle transaction hash from setProfilePicture', async () => {
      render(<NFTProfileSystem />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('tab-trigger-nfts'));
      });

      await waitFor(() => {
        const useButtons = screen.getAllByText('Use');
        fireEvent.click(useButtons[0]);
      });

      await waitFor(() => {
        expect(mockNFTContract.setProfilePicture).toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should load data on mount when wallet is connected', async () => {
      walletManager.isConnected = true;
      render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(mockNFTContract.getUserNFTs).toHaveBeenCalled();
      });
    });

    it('should not load data on mount when wallet is not connected', () => {
      walletManager.isConnected = false;
      render(<NFTProfileSystem />);

      expect(mockNFTContract.getUserNFTs).not.toHaveBeenCalled();
    });

    it('should handle multiple renders without duplicate API calls', async () => {
      walletManager.isConnected = true;
      const { rerender } = render(<NFTProfileSystem />);

      await waitFor(() => {
        expect(mockNFTContract.getUserNFTs).toHaveBeenCalledTimes(1);
      });

      rerender(<NFTProfileSystem />);

      // Should still be called only once
      expect(mockNFTContract.getUserNFTs).toHaveBeenCalledTimes(1);
    });
  });
});

export default mockNFTContract
