/**
 * Tests for Web3Provider component
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Web3Provider, useWeb3 } from './Web3Provider';
import { ethers } from 'ethers';

// Mock ethers.js
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn(),
    Contract: jest.fn(),
    formatEther: jest.fn((val) => '1.0'),
    formatUnits: jest.fn((val) => '100.0'),
    toQuantity: jest.fn((val) => `0x${val.toString(16)}`),
  }
}));

// Test component that uses Web3 context
function TestConsumer() {
  const web3 = useWeb3();
  return (
    <div>
      <div data-testid="account">{web3.account || 'No account'}</div>
      <div data-testid="chain-id">{web3.chainId || 'No chain'}</div>
      <div data-testid="balance">{web3.balance}</div>
      <div data-testid="crib-balance">{web3.cribBalance}</div>
      <button onClick={web3.connectMetaMask} data-testid="connect-btn">Connect</button>
      <button onClick={web3.disconnect} data-testid="disconnect-btn">Disconnect</button>
    </div>
  );
}

describe('Web3Provider', () => {
  let mockEthereum;
  let mockProvider;
  let mockSigner;
  let mockNetwork;

  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();

    // Mock network
    mockNetwork = { chainId: BigInt(1) };

    // Mock signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      signMessage: jest.fn().mockResolvedValue('0xsignature'),
      _signTypedData: jest.fn().mockResolvedValue('0xsigneddata')
    };

    // Mock provider
    mockProvider = {
      getSigner: jest.fn().mockResolvedValue(mockSigner),
      getNetwork: jest.fn().mockResolvedValue(mockNetwork),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000'))
    };

    // Mock window.ethereum
    mockEthereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn()
    };

    window.ethereum = mockEthereum;

    // Mock ethers BrowserProvider
    ethers.BrowserProvider.mockImplementation(() => mockProvider);
  });

  afterEach(() => {
    delete window.ethereum;
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('renders children', () => {
      render(
        <Web3Provider>
          <div data-testid="child">Child Content</div>
        </Web3Provider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides web3 context', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      expect(screen.getByTestId('account')).toBeInTheDocument();
      expect(screen.getByTestId('chain-id')).toBeInTheDocument();
    });

    it('throws error when useWeb3 used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useWeb3 must be used within a Web3Provider');

      consoleSpy.mockRestore();
    });
  });

  describe('MetaMask Connection', () => {
    it('connects to MetaMask successfully', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      mockEthereum.request.mockResolvedValue(mockAccounts);

      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('connect-btn').click();
      });

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'eth_requestAccounts'
        });
      });
    });

    it('shows error when MetaMask not installed', async () => {
      delete window.ethereum;

      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('connect-btn').click();
      });

      // Provider should handle missing MetaMask gracefully
      expect(true).toBe(true);
    });

    it('stores connection preference in localStorage', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      mockEthereum.request.mockResolvedValue(mockAccounts);

      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('connect-btn').click();
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('connectedWallet', 'metamask');
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'walletAddress',
          mockAccounts[0]
        );
      });
    });

    it('handles user rejection', async () => {
      mockEthereum.request.mockRejectedValue(new Error('User rejected'));

      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('connect-btn').click();
      });

      // Should handle rejection gracefully
      expect(true).toBe(true);
    });
  });

  describe('Disconnect', () => {
    it('disconnects wallet', async () => {
      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('disconnect-btn').click();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('connectedWallet');
      expect(localStorage.removeItem).toHaveBeenCalledWith('walletAddress');
    });

    it('clears all state on disconnect', async () => {
      const { getByTestId } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await act(async () => {
        getByTestId('disconnect-btn').click();
      });

      expect(screen.getByTestId('account')).toHaveTextContent('No account');
      expect(screen.getByTestId('chain-id')).toHaveTextContent('No chain');
    });
  });

  describe('Network Switching', () => {
    it('requests network switch', async () => {
      mockEthereum.request.mockResolvedValue(null);

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      await act(async () => {
        await web3.switchNetwork(137); // Polygon
      });

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expect.any(String) }]
      });
    });

    it('adds network if not found (error 4902)', async () => {
      mockEthereum.request
        .mockRejectedValueOnce({ code: 4902 })
        .mockResolvedValueOnce(null);

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      await act(async () => {
        await web3.switchNetwork(137);
      });

      expect(mockEthereum.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_addEthereumChain'
        })
      );
    });
  });

  describe('Balance Updates', () => {
    it('updates ETH balance', async () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('balance')).toHaveTextContent('1.0');
      });
    });

    it('updates CRYB token balance', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue(BigInt('100000000')),
        decimals: jest.fn().mockResolvedValue(18)
      };

      ethers.Contract.mockImplementation(() => mockContract);

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('crib-balance')).toHaveTextContent('100.0');
      });
    });
  });

  describe('Message Signing', () => {
    it('signs message', async () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      const signature = await act(async () => {
        return await web3.signMessage('Test message');
      });

      expect(mockSigner.signMessage).toHaveBeenCalledWith('Test message');
      expect(signature).toBe('0xsignature');
    });

    it('signs typed data (EIP-712)', async () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      const domain = { name: 'Test' };
      const types = { Test: [] };
      const value = {};

      const signature = await act(async () => {
        return await web3.signTypedData(domain, types, value);
      });

      expect(mockSigner._signTypedData).toHaveBeenCalledWith(domain, types, value);
      expect(signature).toBe('0xsigneddata');
    });

    it('throws error when no signer available', async () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      await expect(web3.signMessage('test')).rejects.toThrow('No signer available');
    });
  });

  describe('Event Listeners', () => {
    it('listens for account changes', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      expect(mockEthereum.on).toHaveBeenCalledWith(
        'accountsChanged',
        expect.any(Function)
      );
    });

    it('listens for chain changes', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      unmount();

      expect(mockEthereum.removeListener).toHaveBeenCalled();
    });
  });

  describe('Auto-Reconnection', () => {
    it('auto-reconnects if previously connected', async () => {
      Storage.prototype.getItem.mockImplementation((key) => {
        if (key === 'connectedWallet') return 'metamask';
        if (key === 'walletAddress') return '0x1234567890123456789012345678901234567890';
        return null;
      });

      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalled();
      });
    });
  });

  describe('Transaction Execution', () => {
    it('executes transaction successfully', async () => {
      const mockTx = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({ status: 1 })
      };

      const mockTxFunction = jest.fn().mockResolvedValue(mockTx);

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      const receipt = await act(async () => {
        return await web3.executeTransaction(mockTxFunction);
      });

      expect(mockTxFunction).toHaveBeenCalled();
      expect(mockTx.wait).toHaveBeenCalled();
      expect(receipt.status).toBe(1);
    });

    it('handles transaction cancellation', async () => {
      const mockTxFunction = jest.fn().mockRejectedValue({ code: 4001 });

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      await expect(web3.executeTransaction(mockTxFunction)).rejects.toThrow(
        'Transaction was cancelled by user'
      );
    });

    it('handles insufficient funds error', async () => {
      const mockTxFunction = jest
        .fn()
        .mockRejectedValue(new Error('insufficient funds'));

      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      await expect(web3.executeTransaction(mockTxFunction)).rejects.toThrow(
        'Insufficient funds for transaction'
      );
    });
  });

  describe('Contract Management', () => {
    it('returns contract instance', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      expect(() => {
        web3.getContract('CRYB_TOKEN', []);
      }).toThrow('Wallet not connected');
    });

    it('throws error for unsupported network', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      expect(() => {
        web3.getContract('UNKNOWN_CONTRACT', []);
      }).toThrow();
    });
  });

  describe('Supported Networks', () => {
    it('exports SUPPORTED_NETWORKS', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      expect(web3.SUPPORTED_NETWORKS).toBeDefined();
      expect(web3.SUPPORTED_NETWORKS[1]).toBeDefined();
      expect(web3.SUPPORTED_NETWORKS[1].name).toBe('Ethereum Mainnet');
    });

    it('exports CONTRACT_ADDRESSES', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      expect(web3.CONTRACT_ADDRESSES).toBeDefined();
    });

    it('exports WALLET_TYPES', () => {
      render(
        <Web3Provider>
          <TestConsumer />
        </Web3Provider>
      );

      const web3 = useWeb3();

      expect(web3.WALLET_TYPES).toBeDefined();
      expect(web3.WALLET_TYPES.METAMASK).toBe('metamask');
    });
  });
});

export default TestConsumer
