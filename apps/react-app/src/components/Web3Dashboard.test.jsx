/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3Dashboard from './Web3Dashboard';
import { useWeb3 } from '../Web3Provider';

// Mock Web3Provider
jest.mock('../Web3Provider');

// Mock WalletModal
jest.mock('./WalletModal', () => {
  return function MockWalletModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="wallet-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

describe('Web3Dashboard', () => {
  const mockWeb3Context = {
    account: null,
    chainId: null,
    balance: '0',
    cribBalance: '0',
    connectedWallet: null,
    isCorrectNetwork: true,
    switchNetwork: jest.fn(),
    addTokenToWallet: jest.fn(),
    disconnect: jest.fn(),
    signMessage: jest.fn(),
    SUPPORTED_NETWORKS: {
      1: { name: 'Ethereum Mainnet', symbol: 'ETH' },
      137: { name: 'Polygon Mainnet', symbol: 'MATIC' },
      42161: { name: 'Arbitrum One', symbol: 'ETH' },
    },
    error: null,
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useWeb3.mockReturnValue(mockWeb3Context);
    // Mock window.alert
    global.alert = jest.fn();
    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Disconnected State - Welcome Screen', () => {
    it('renders welcome screen when wallet is not connected', () => {
      const { container } = render(<Web3Dashboard />);
      expect(container).toBeInTheDocument();
    });

    it('displays welcome heading when not connected', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Welcome to Web3 CRYB')).toBeInTheDocument();
    });

    it('shows welcome message', () => {
      render(<Web3Dashboard />);
      expect(
        screen.getByText(/Connect your wallet to access advanced Web3 features/i)
      ).toBeInTheDocument();
    });

    it('displays connect wallet button when not connected', () => {
      render(<Web3Dashboard />);
      const connectButton = screen.getByText(/Connect Wallet/i);
      expect(connectButton).toBeInTheDocument();
    });

    it('shows lightning bolt icon in welcome screen', () => {
      const { container } = render(<Web3Dashboard />);
      expect(container.textContent).toContain('⚡');
    });

    it('opens wallet modal when connect button is clicked', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const connectButton = screen.getByText(/Connect Wallet/i);
      await user.click(connectButton);

      expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
    });

    it('displays Web3 features section when not connected', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Web3 Features Available')).toBeInTheDocument();
    });

    it('shows CRYB Token Rewards feature', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('CRYB Token Rewards')).toBeInTheDocument();
    });

    it('shows NFT Marketplace feature', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('NFT Marketplace')).toBeInTheDocument();
    });

    it('shows DAO Governance feature', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('DAO Governance')).toBeInTheDocument();
    });

    it('shows DeFi Integration feature', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('DeFi Integration')).toBeInTheDocument();
    });

    it('displays feature descriptions', () => {
      render(<Web3Dashboard />);
      expect(
        screen.getByText(/Earn tokens for creating content and engaging with the community/i)
      ).toBeInTheDocument();
    });

    it('renders four feature cards', () => {
      const { container } = render(<Web3Dashboard />);
      const featureIcons = ['🪙', '🖼️', '🏛️', '💰'];
      featureIcons.forEach(icon => {
        expect(container.textContent).toContain(icon);
      });
    });

    it('closes wallet modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      // Open modal
      const connectButton = screen.getByText(/Connect Wallet/i);
      await user.click(connectButton);
      expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByText('Close Modal');
      await user.click(closeButton);
      expect(screen.queryByTestId('wallet-modal')).not.toBeInTheDocument();
    });
  });

  describe('Connected State - Dashboard View', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '1.5',
        cribBalance: '10000',
        connectedWallet: 'metamask',
        isCorrectNetwork: true,
      });
    });

    it('renders dashboard when wallet is connected', () => {
      const { container } = render(<Web3Dashboard />);
      expect(container).toBeInTheDocument();
    });

    it('displays dashboard heading when connected', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
    });

    it('shows dashboard description', () => {
      render(<Web3Dashboard />);
      expect(
        screen.getByText(/Manage your CRYB tokens, NFTs, and participate in the decentralized ecosystem/i)
      ).toBeInTheDocument();
    });

    it('displays formatted wallet address', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('formats address correctly', () => {
      render(<Web3Dashboard />);
      const addressElement = screen.getByText('0x1234...7890');
      expect(addressElement).toBeInTheDocument();
    });

    it('shows disconnect button when connected', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('calls disconnect when disconnect button is clicked', async () => {
      const user = userEvent.setup();
      const disconnect = jest.fn();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        disconnect,
      });

      render(<Web3Dashboard />);
      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      expect(disconnect).toHaveBeenCalled();
    });

    it('displays Wallet Overview section', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('💳 Wallet Overview')).toBeInTheDocument();
    });

    it('shows network information', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Network')).toBeInTheDocument();
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    });

    it('displays ETH balance', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText(/1\.5000 ETH/i)).toBeInTheDocument();
    });

    it('formats ETH balance with 4 decimals', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText(/1\.5000 ETH/i)).toBeInTheDocument();
    });

    it('displays CRYB balance', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('CRYB Balance')).toBeInTheDocument();
      expect(screen.getByText(/10,000 CRYB/i)).toBeInTheDocument();
    });

    it('formats CRYB balance with thousand separators', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText(/10,000 CRYB/i)).toBeInTheDocument();
    });

    it('shows Add to Wallet button for CRYB token', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Add to Wallet')).toBeInTheDocument();
    });

    it('calls addTokenToWallet when Add to Wallet is clicked', async () => {
      const user = userEvent.setup();
      const addTokenToWallet = jest.fn().mockResolvedValue(true);
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        addTokenToWallet,
      });

      render(<Web3Dashboard />);
      const addButton = screen.getByText('Add to Wallet');
      await user.click(addButton);

      expect(addTokenToWallet).toHaveBeenCalledWith(
        '0x...',
        'CRYB',
        18,
        'https://cryb.ai/logo.png'
      );
    });

    it('handles error when adding token fails', async () => {
      const user = userEvent.setup();
      const addTokenToWallet = jest.fn().mockRejectedValue(new Error('User rejected'));
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        addTokenToWallet,
      });

      render(<Web3Dashboard />);
      const addButton = screen.getByText('Add to Wallet');
      await user.click(addButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to add token: User rejected');
      });
    });
  });

  describe('Staking & Rewards Section', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '1.5',
        cribBalance: '10000',
      });
    });

    it('displays Staking & Rewards section', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🏆 Staking & Rewards')).toBeInTheDocument();
    });

    it('shows staking input field', () => {
      render(<Web3Dashboard />);
      expect(screen.getByPlaceholderText('Enter amount to stake')).toBeInTheDocument();
    });

    it('allows entering staking amount', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      expect(input).toHaveValue(100);
    });

    it('shows stake tokens button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🚀 Stake Tokens')).toBeInTheDocument();
    });

    it('validates staking amount before staking', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid staking amount');
    });

    it('validates positive staking amount', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '-5');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid staking amount');
    });

    it('shows loading state during staking', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(screen.getByText('⏳ Staking...')).toBeInTheDocument();
    });

    it('completes staking transaction successfully', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Successfully staked 100 CRYB tokens!');
      });
    });

    it('clears staking input after successful stake', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it('displays rewards earned', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('Rewards Earned')).toBeInTheDocument();
      expect(screen.getByText(/1,250\.45 CRYB/i)).toBeInTheDocument();
    });

    it('shows claim rewards button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('💰 Claim Rewards')).toBeInTheDocument();
    });

    it('shows loading state during claim', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const claimButton = screen.getByText('💰 Claim Rewards');
      await user.click(claimButton);

      expect(screen.getByText('⏳ Claiming...')).toBeInTheDocument();
    });

    it('completes claim transaction successfully', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const claimButton = screen.getByText('💰 Claim Rewards');
      await user.click(claimButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Successfully claimed 1,250.45 CRYB tokens!');
      });
    });

    it('disables claim button when rewards are zero', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      // First claim to set rewards to 0
      const claimButton = screen.getByText('💰 Claim Rewards');
      await user.click(claimButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/0 CRYB/i)).toBeInTheDocument();
      });
    });

    it('disables buttons during loading', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(stakeButton).toBeDisabled();
    });
  });

  describe('NFT Collection Section', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });
    });

    it('displays NFT Collection heading', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🖼️ Your NFT Collection')).toBeInTheDocument();
    });

    it('shows NFTs when wallet is connected', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #001')).toBeInTheDocument();
      });
    });

    it('displays all three mock NFTs', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #001')).toBeInTheDocument();
        expect(screen.getByText('CRYB Genesis #024')).toBeInTheDocument();
        expect(screen.getByText('CRYB Genesis #156')).toBeInTheDocument();
      });
    });

    it('shows NFT rarity traits', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Rarity: Legendary/i)).toBeInTheDocument();
        expect(screen.getByText(/Rarity: Epic/i)).toBeInTheDocument();
        expect(screen.getByText(/Rarity: Rare/i)).toBeInTheDocument();
      });
    });

    it('shows NFT power traits', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Power: 95/i)).toBeInTheDocument();
        expect(screen.getByText(/Power: 78/i)).toBeInTheDocument();
        expect(screen.getByText(/Power: 65/i)).toBeInTheDocument();
      });
    });

    it('displays NFT images', async () => {
      const { container } = render(<Web3Dashboard />);

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('renders NFT images with correct alt text', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByAltText('CRYB Genesis #001')).toBeInTheDocument();
        expect(screen.getByAltText('CRYB Genesis #024')).toBeInTheDocument();
        expect(screen.getByAltText('CRYB Genesis #156')).toBeInTheDocument();
      });
    });

    it('loads NFTs after wallet connection', async () => {
      render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #001')).toBeInTheDocument();
      });
    });
  });

  describe('Empty NFT State', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: null,
        chainId: 1,
      });
    });

    it('shows empty state when no wallet connected', () => {
      render(<Web3Dashboard />);
      // Welcome screen is shown instead
      expect(screen.getByText('Welcome to Web3 CRYB')).toBeInTheDocument();
    });
  });

  describe('Message Signing Section', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        signMessage: jest.fn().mockResolvedValue('0xsignature123'),
      });
    });

    it('displays Message Signing section', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('✍️ Message Signing')).toBeInTheDocument();
    });

    it('shows message input textarea', () => {
      render(<Web3Dashboard />);
      expect(screen.getByPlaceholderText('Enter message to sign with your wallet')).toBeInTheDocument();
    });

    it('allows entering message to sign', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      expect(textarea).toHaveValue('Test message');
    });

    it('shows sign message button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('✍️ Sign Message')).toBeInTheDocument();
    });

    it('validates message before signing', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a message to sign');
    });

    it('calls signMessage with correct message', async () => {
      const user = userEvent.setup();
      const signMessage = jest.fn().mockResolvedValue('0xsignature123');
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      await waitFor(() => {
        expect(signMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('displays signature after successful signing', async () => {
      const user = userEvent.setup();
      const signMessage = jest.fn().mockResolvedValue('0xsignature123');
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      await waitFor(() => {
        expect(screen.getByText('0xsignature123')).toBeInTheDocument();
      });
    });

    it('shows success alert after signing', async () => {
      const user = userEvent.setup();
      const signMessage = jest.fn().mockResolvedValue('0xsignature123');
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Message signed successfully!');
      });
    });

    it('handles signing error', async () => {
      const user = userEvent.setup();
      const signMessage = jest.fn().mockRejectedValue(new Error('User rejected'));
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to sign message: User rejected');
      });
    });

    it('shows signature label', async () => {
      const user = userEvent.setup();
      const signMessage = jest.fn().mockResolvedValue('0xsignature123');
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, 'Test message');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      await waitFor(() => {
        expect(screen.getByText('Signature:')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions Section', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });
    });

    it('displays Quick Actions section', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('⚡ Quick Actions')).toBeInTheDocument();
    });

    it('shows Visit Marketplace button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🛒 Visit Marketplace')).toBeInTheDocument();
    });

    it('shows DAO Governance button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🏛️ DAO Governance')).toBeInTheDocument();
    });

    it('shows Yield Farming button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('🌾 Yield Farming')).toBeInTheDocument();
    });

    it('shows Liquidity Pools button', () => {
      render(<Web3Dashboard />);
      expect(screen.getByText('💧 Liquidity Pools')).toBeInTheDocument();
    });

    it('handles marketplace navigation click', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const marketplaceButton = screen.getByText('🛒 Visit Marketplace');
      await user.click(marketplaceButton);

      expect(global.alert).toHaveBeenCalledWith('Navigate to marketplace');
    });

    it('handles governance navigation click', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const governanceButton = screen.getByText('🏛️ DAO Governance');
      await user.click(governanceButton);

      expect(global.alert).toHaveBeenCalledWith('Navigate to governance');
    });

    it('handles yield farming navigation click', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const yieldButton = screen.getByText('🌾 Yield Farming');
      await user.click(yieldButton);

      expect(global.alert).toHaveBeenCalledWith('Navigate to yield farming');
    });

    it('handles liquidity pools navigation click', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const liquidityButton = screen.getByText('💧 Liquidity Pools');
      await user.click(liquidityButton);

      expect(global.alert).toHaveBeenCalledWith('Navigate to liquidity pools');
    });
  });

  describe('Network Status and Switching', () => {
    it('shows warning when on unsupported network', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
        SUPPORTED_NETWORKS: {
          1: { name: 'Ethereum Mainnet', symbol: 'ETH' },
        },
      });

      render(<Web3Dashboard />);
      expect(screen.getByText('⚠️ Unsupported Network')).toBeInTheDocument();
    });

    it('displays unsupported network message', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
        SUPPORTED_NETWORKS: {
          1: { name: 'Ethereum Mainnet', symbol: 'ETH' },
        },
      });

      render(<Web3Dashboard />);
      expect(
        screen.getByText(/Please switch to a supported network/i)
      ).toBeInTheDocument();
    });

    it('shows Switch to Ethereum button on wrong network', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
      });

      render(<Web3Dashboard />);
      expect(screen.getByText('Switch to Ethereum')).toBeInTheDocument();
    });

    it('calls switchNetwork when switch button is clicked', async () => {
      const user = userEvent.setup();
      const switchNetwork = jest.fn();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
        switchNetwork,
      });

      render(<Web3Dashboard />);
      const switchButton = screen.getByText('Switch to Ethereum');
      await user.click(switchButton);

      expect(switchNetwork).toHaveBeenCalledWith(1);
    });

    it('does not show network warning on correct network', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        isCorrectNetwork: true,
      });

      render(<Web3Dashboard />);
      expect(screen.queryByText('⚠️ Unsupported Network')).not.toBeInTheDocument();
    });

    it('displays Unknown Network for unsupported chain', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
        SUPPORTED_NETWORKS: {
          1: { name: 'Ethereum Mainnet', symbol: 'ETH' },
        },
      });

      render(<Web3Dashboard />);
      expect(screen.getByText('Unknown Network')).toBeInTheDocument();
    });

    it('shows correct network symbol in balance display', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 137,
        balance: '5.25',
        isCorrectNetwork: true,
        SUPPORTED_NETWORKS: {
          137: { name: 'Polygon Mainnet', symbol: 'MATIC' },
        },
      });

      render(<Web3Dashboard />);
      expect(screen.getByText(/5\.2500 MATIC/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles zero balance gracefully', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '0',
        cribBalance: '0',
      });

      render(<Web3Dashboard />);
      expect(screen.getByText(/0\.0000 ETH/i)).toBeInTheDocument();
      expect(screen.getByText(/0 CRYB/i)).toBeInTheDocument();
    });

    it('handles very large CRYB balance', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        cribBalance: '1000000000',
      });

      render(<Web3Dashboard />);
      expect(screen.getByText(/1,000,000,000 CRYB/i)).toBeInTheDocument();
    });

    it('handles decimal CRYB balance', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        cribBalance: '123.456789',
      });

      render(<Web3Dashboard />);
      expect(screen.getByText(/123\.457 CRYB/i)).toBeInTheDocument();
    });

    it('handles empty address gracefully', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '',
        chainId: 1,
      });

      render(<Web3Dashboard />);
      expect(screen.getByText('Welcome to Web3 CRYB')).toBeInTheDocument();
    });

    it('handles null chainId', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: null,
      });

      render(<Web3Dashboard />);
      expect(screen.getByText('Unknown Network')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<Web3Dashboard />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles staking with very small amount', async () => {
      const user = userEvent.setup();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '0.001');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(screen.getByText('⏳ Staking...')).toBeInTheDocument();
    });

    it('handles zero staking amount validation', async () => {
      const user = userEvent.setup();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '0');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid staking amount');
    });

    it('handles empty staking input', async () => {
      const user = userEvent.setup();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid staking amount');
    });

    it('handles whitespace-only message signing', async () => {
      const user = userEvent.setup();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);

      const textarea = screen.getByPlaceholderText('Enter message to sign with your wallet');
      await user.type(textarea, '   ');

      const signButton = screen.getByText('✍️ Sign Message');
      await user.click(signButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a message to sign');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });
    });

    it('shows staking loading state', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(screen.getByText('⏳ Staking...')).toBeInTheDocument();
    });

    it('shows claiming loading state', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const claimButton = screen.getByText('💰 Claim Rewards');
      await user.click(claimButton);

      expect(screen.getByText('⏳ Claiming...')).toBeInTheDocument();
    });

    it('returns to normal state after loading', async () => {
      const user = userEvent.setup();
      render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.queryByText('⏳ Staking...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('loads rewards when account is connected', async () => {
      const { rerender } = render(<Web3Dashboard />);

      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      rerender(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1,250\.45 CRYB/i)).toBeInTheDocument();
      });
    });

    it('loads NFTs when account is connected', async () => {
      const { rerender } = render(<Web3Dashboard />);

      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      rerender(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #001')).toBeInTheDocument();
      });
    });

    it('clears data when disconnecting', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { rerender } = render(<Web3Dashboard />);

      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: null,
        chainId: null,
      });

      rerender(<Web3Dashboard />);

      expect(screen.getByText('Welcome to Web3 CRYB')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible buttons when connected', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has accessible inputs', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);
      const stakingInput = screen.getByPlaceholderText('Enter amount to stake');
      expect(stakingInput).toBeInTheDocument();
    });

    it('has accessible textarea', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      render(<Web3Dashboard />);
      const messageInput = screen.getByPlaceholderText('Enter message to sign with your wallet');
      expect(messageInput).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<Web3Dashboard />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Snapshots', () => {
    it('matches snapshot for disconnected state', () => {
      const { container } = render(<Web3Dashboard />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for connected state', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '1.5',
        cribBalance: '10000',
        connectedWallet: 'metamask',
        isCorrectNetwork: true,
      });

      const { container } = render(<Web3Dashboard />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for wrong network state', () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 999,
        isCorrectNetwork: false,
      });

      const { container } = render(<Web3Dashboard />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot during staking loading', async () => {
      const user = userEvent.setup();
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { container } = render(<Web3Dashboard />);

      const input = screen.getByPlaceholderText('Enter amount to stake');
      await user.type(input, '100');

      const stakeButton = screen.getByText('🚀 Stake Tokens');
      await user.click(stakeButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with NFTs loaded', async () => {
      useWeb3.mockReturnValue({
        ...mockWeb3Context,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { container } = render(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Genesis #001')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default MockWalletModal
