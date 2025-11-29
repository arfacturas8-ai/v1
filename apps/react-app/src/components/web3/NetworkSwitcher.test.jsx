import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import NetworkSwitcher, { NetworkIndicator } from './NetworkSwitcher';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';

jest.mock('../../lib/hooks/useWeb3Auth');
jest.mock('../../utils/web3Utils', () => ({
  getNetworkByChainId: jest.fn((chainId) => {
    const networks = {
      1: { name: 'Ethereum Mainnet', chainId: 1 },
      11155111: { name: 'Sepolia Testnet', chainId: 11155111 },
    };
    return networks[chainId];
  }),
}));

const mockWeb3State = {
  isConnected: true,
  chainId: 1,
  account: '0x123',
  provider: {},
};

const mockWeb3Actions = {
  switchChain: jest.fn(),
};

describe('NetworkSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWeb3Auth.mockReturnValue({
      state: mockWeb3State,
      actions: mockWeb3Actions,
    });
    global.window.ethereum = {
      request: jest.fn(),
    };
  });

  afterEach(() => {
    delete global.window.ethereum;
  });

  describe('Not Connected State', () => {
    it('renders not connected state when wallet is not connected', () => {
      useWeb3Auth.mockReturnValue({
        state: { isConnected: false },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });

    it('disables button when not connected', () => {
      useWeb3Auth.mockReturnValue({
        state: { isConnected: false },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      const button = screen.getByRole('button', { name: /Not Connected/i });
      expect(button).toBeDisabled();
    });

    it('shows Globe icon when not connected', () => {
      useWeb3Auth.mockReturnValue({
        state: { isConnected: false },
        actions: mockWeb3Actions,
      });

      const { container } = render(<NetworkSwitcher />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies opacity-50 class when not connected', () => {
      useWeb3Auth.mockReturnValue({
        state: { isConnected: false },
        actions: mockWeb3Actions,
      });

      const { container } = render(<NetworkSwitcher />);
      expect(container.firstChild).toHaveClass('opacity-50');
    });
  });

  describe('Network Display', () => {
    it('displays current network name', () => {
      render(<NetworkSwitcher />);
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('displays network icon', () => {
      render(<NetworkSwitcher />);
      expect(screen.getByText('⟠')).toBeInTheDocument();
    });

    it('displays Sepolia network when connected to testnet', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: 11155111 },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      expect(screen.getByText('Sepolia')).toBeInTheDocument();
    });

    it('displays Unknown Network when chainId is not in supported networks', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: null },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      expect(screen.getByText('Unknown Network')).toBeInTheDocument();
    });

    it('shows chevron down icon when showDropdown is true', () => {
      const { container } = render(<NetworkSwitcher showDropdown={true} />);
      const button = screen.getByRole('button');
      expect(within(button).getByText('Ethereum')).toBeInTheDocument();
    });

    it('hides chevron down icon when showDropdown is false', () => {
      render(<NetworkSwitcher showDropdown={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Dropdown Rendering', () => {
    it('opens dropdown when button is clicked', () => {
      render(<NetworkSwitcher />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Select Network')).toBeInTheDocument();
    });

    it('closes dropdown when button is clicked again', () => {
      render(<NetworkSwitcher />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(screen.getByText('Select Network')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText('Select Network')).not.toBeInTheDocument();
    });

    it('does not open dropdown when showDropdown is false', () => {
      render(<NetworkSwitcher showDropdown={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.queryByText('Select Network')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', () => {
      const { container } = render(<NetworkSwitcher />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(screen.getByText('Select Network')).toBeInTheDocument();

      fireEvent.click(document.body);
      waitFor(() => {
        expect(screen.queryByText('Select Network')).not.toBeInTheDocument();
      });
    });

    it('displays dropdown subtitle', () => {
      render(<NetworkSwitcher />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Choose a blockchain network for your transactions')).toBeInTheDocument();
    });
  });

  describe('Current Network Display', () => {
    it('shows currently connected network in dropdown', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Currently connected')).toBeInTheDocument();
    });

    it('displays check icon for current network', () => {
      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const currentNetworkSection = screen.getByText('Currently connected').closest('div');
      expect(currentNetworkSection).toBeInTheDocument();
    });

    it('highlights current network with background color', () => {
      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const currentNetworkSection = screen.getByText('Currently connected').closest('div');
      expect(currentNetworkSection).toHaveClass('bg-accent-primary/10');
    });
  });

  describe('Available Networks List', () => {
    it('displays available networks header', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('AVAILABLE NETWORKS')).toBeInTheDocument();
    });

    it('shows Sepolia network in available networks when on Ethereum', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Sepolia')).toBeInTheDocument();
    });

    it('does not show current network in available networks list', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const availableSection = screen.getByText('AVAILABLE NETWORKS').parentElement;
      expect(within(availableSection).queryByText('Ethereum')).not.toBeInTheDocument();
    });

    it('displays network descriptions', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Ethereum testnet for development and testing')).toBeInTheDocument();
    });

    it('shows network fee information', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('shows network speed information', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Fast')).toBeInTheDocument();
    });
  });

  describe('Coming Soon Networks', () => {
    it('displays coming soon header', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('COMING SOON')).toBeInTheDocument();
    });

    it('shows Polygon in coming soon section', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      expect(within(comingSoonSection).getByText('Polygon')).toBeInTheDocument();
    });

    it('shows Arbitrum in coming soon section', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      expect(within(comingSoonSection).getByText('Arbitrum')).toBeInTheDocument();
    });

    it('shows Base in coming soon section', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      expect(within(comingSoonSection).getByText('Base')).toBeInTheDocument();
    });

    it('shows Optimism in coming soon section', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      expect(within(comingSoonSection).getByText('Optimism')).toBeInTheDocument();
    });

    it('displays Phase 2 label for coming soon networks', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const phase2Labels = screen.getAllByText('Phase 2');
      expect(phase2Labels.length).toBeGreaterThan(0);
    });

    it('applies opacity to coming soon networks', () => {
      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      const polygonItem = within(comingSoonSection).getByText('Polygon').closest('div');
      expect(polygonItem).toHaveClass('opacity-60');
    });

    it('disables cursor on coming soon networks', () => {
      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      const polygonItem = within(comingSoonSection).getByText('Polygon').closest('div');
      expect(polygonItem).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Network Switching', () => {
    it('calls switchChain when clicking available network', async () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(mockWeb3Actions.switchChain).toHaveBeenCalledWith(11155111);
      });
    });

    it('shows switching state during network switch', async () => {
      mockWeb3Actions.switchChain.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('Switching...')).toBeInTheDocument();
      });
    });

    it('shows loader icon during switching', async () => {
      mockWeb3Actions.switchChain.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('Switching...')).toBeInTheDocument();
      });
    });

    it('calls onNetworkChange callback after successful switch', async () => {
      const onNetworkChange = jest.fn();
      mockWeb3Actions.switchChain.mockResolvedValue();

      render(<NetworkSwitcher onNetworkChange={onNetworkChange} />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(onNetworkChange).toHaveBeenCalled();
      });
    });

    it('closes dropdown after switching network', async () => {
      mockWeb3Actions.switchChain.mockResolvedValue();

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.queryByText('Select Network')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error state when switch fails', async () => {
      mockWeb3Actions.switchChain.mockRejectedValue(new Error('User rejected'));

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('Switch Failed')).toBeInTheDocument();
      });
    });

    it('displays error message in tooltip', async () => {
      mockWeb3Actions.switchChain.mockRejectedValue(new Error('User rejected request'));

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('User rejected request')).toBeInTheDocument();
      });
    });

    it('shows alert triangle icon in error state', async () => {
      mockWeb3Actions.switchChain.mockRejectedValue(new Error('Error'));

      const { container } = render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('Switch Failed')).toBeInTheDocument();
      });
    });

    it('clears error when clicking error button', async () => {
      mockWeb3Actions.switchChain.mockRejectedValue(new Error('Error'));

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText('Switch Failed')).toBeInTheDocument();
      });

      const errorButton = screen.getByRole('button', { name: /Switch Failed/i });
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.queryByText('Switch Failed')).not.toBeInTheDocument();
      });
    });

    it('shows error for unsupported network switch attempt', async () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const comingSoonSection = screen.getByText('COMING SOON').parentElement;
      const polygonItem = within(comingSoonSection).getByText('Polygon').closest('div');

      expect(polygonItem).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Add Network to Wallet', () => {
    it('adds network to wallet when error code is 4902', async () => {
      const error = new Error('Network not found');
      error.code = 4902;
      mockWeb3Actions.switchChain.mockRejectedValueOnce(error).mockResolvedValueOnce();

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(window.ethereum.request).toHaveBeenCalledWith({
          method: 'wallet_addEthereumChain',
          params: expect.arrayContaining([
            expect.objectContaining({
              chainId: '0xa9d7cb',
              chainName: 'Sepolia Testnet',
            }),
          ]),
        });
      });
    });

    it('retries switch after adding network', async () => {
      const error = new Error('Network not found');
      error.code = 4902;
      mockWeb3Actions.switchChain.mockRejectedValueOnce(error).mockResolvedValueOnce();
      window.ethereum.request.mockResolvedValue();

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(mockWeb3Actions.switchChain).toHaveBeenCalledTimes(2);
      });
    });

    it('shows error when adding network fails', async () => {
      const error = new Error('Network not found');
      error.code = 4902;
      mockWeb3Actions.switchChain.mockRejectedValue(error);
      window.ethereum.request.mockRejectedValue(new Error('User rejected'));

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      const sepoliaButton = screen.getByText('Sepolia').closest('button');
      fireEvent.click(sepoliaButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to add/i)).toBeInTheDocument();
      });
    });
  });

  describe('Unsupported Network State', () => {
    it('shows unsupported network warning', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: 999 },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      expect(screen.getByText('Unsupported Network')).toBeInTheDocument();
    });

    it('shows alert triangle for unsupported network', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: 999 },
        actions: mockWeb3Actions,
      });

      const { container } = render(<NetworkSwitcher />);
      expect(screen.getByText('Unsupported Network')).toBeInTheDocument();
    });

    it('opens dropdown with supported networks from unsupported state', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: 999 },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText("You're connected to an unsupported network. Please switch to a supported network.")).toBeInTheDocument();
    });

    it('shows only supported networks in unsupported network dropdown', () => {
      useWeb3Auth.mockReturnValue({
        state: { ...mockWeb3State, chainId: 999 },
        actions: mockWeb3Actions,
      });

      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('Sepolia')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes', () => {
      const { container } = render(<NetworkSwitcher size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm');
    });

    it('applies medium size classes by default', () => {
      const { container } = render(<NetworkSwitcher />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base');
    });

    it('applies large size classes', () => {
      const { container } = render(<NetworkSwitcher size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-lg');
    });
  });

  describe('Variant Styles', () => {
    it('applies secondary variant by default', () => {
      const { container } = render(<NetworkSwitcher />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('applies primary variant classes', () => {
      const { container } = render(<NetworkSwitcher variant="primary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('applies outline variant classes', () => {
      const { container } = render(<NetworkSwitcher variant="outline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });
  });

  describe('Network Icons', () => {
    it('displays Ethereum icon', () => {
      render(<NetworkSwitcher />);
      expect(screen.getByText('⟠')).toBeInTheDocument();
    });

    it('displays network icons in dropdown', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getAllByText('⟠').length).toBeGreaterThan(0);
    });
  });

  describe('Network Comparison Info', () => {
    it('displays security information', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('All networks provide enterprise-grade security')).toBeInTheDocument();
    });

    it('displays transaction speed information', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Transaction speeds vary by network congestion')).toBeInTheDocument();
    });

    it('displays block explorer information', () => {
      render(<NetworkSwitcher />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('View network status and fees on block explorers')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(<NetworkSwitcher className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('NetworkIndicator', () => {
  it('renders network indicator with name', () => {
    render(<NetworkIndicator chainId={1} showName={true} />);
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('renders network indicator without name', () => {
    render(<NetworkIndicator chainId={1} showName={false} />);
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  it('shows success indicator for supported networks', () => {
    const { container } = render(<NetworkIndicator chainId={1} />);
    const indicator = container.querySelector('.bg-success');
    expect(indicator).toBeInTheDocument();
  });

  it('shows warning indicator for unsupported networks', () => {
    const { container } = render(<NetworkIndicator chainId={137} />);
    const indicator = container.querySelector('.bg-warning');
    expect(indicator).toBeInTheDocument();
  });

  it('shows error indicator for unknown networks', () => {
    const { container } = render(<NetworkIndicator chainId={999} />);
    const indicator = container.querySelector('.bg-error');
    expect(indicator).toBeInTheDocument();
  });

  it('displays Unknown text for unknown chainId', () => {
    render(<NetworkIndicator chainId={999} showName={true} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('applies small size class by default', () => {
    const { container } = render(<NetworkIndicator chainId={1} size="sm" />);
    const indicator = container.querySelector('.w-2');
    expect(indicator).toBeInTheDocument();
  });

  it('applies medium size class', () => {
    const { container } = render(<NetworkIndicator chainId={1} size="md" />);
    const indicator = container.querySelector('.w-3');
    expect(indicator).toBeInTheDocument();
  });

  it('applies large size class', () => {
    const { container } = render(<NetworkIndicator chainId={1} size="lg" />);
    const indicator = container.querySelector('.w-4');
    expect(indicator).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<NetworkIndicator chainId={1} className="custom-indicator" />);
    expect(container.firstChild).toHaveClass('custom-indicator');
  });

  it('shows Sepolia network name', () => {
    render(<NetworkIndicator chainId={11155111} showName={true} />);
    expect(screen.getByText('Sepolia')).toBeInTheDocument();
  });

  it('applies correct color class to network name', () => {
    const { container } = render(<NetworkIndicator chainId={1} showName={true} />);
    const nameElement = screen.getByText('Ethereum');
    expect(nameElement).toHaveClass('text-blue-500');
  });
});

export default networks
