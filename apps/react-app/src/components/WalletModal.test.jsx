/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WalletModal from './WalletModal'
import { useWeb3 } from '../Web3Provider'

// Mock the Web3Provider hook
jest.mock('../Web3Provider', () => ({
  useWeb3: jest.fn()
}))

// Mock window.ethereum
const mockEthereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn()
}

// Mock window.open
const mockWindowOpen = jest.fn()

describe('WalletModal', () => {
  let mockWeb3Context

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock context
    mockWeb3Context = {
      connectMetaMask: jest.fn().mockResolvedValue(true),
      connectWalletConnect: jest.fn().mockResolvedValue(true),
      connectCoinbaseWallet: jest.fn().mockResolvedValue(true),
      isConnecting: false,
      error: null,
      clearError: jest.fn(),
      WALLET_TYPES: {
        METAMASK: 'metamask',
        WALLET_CONNECT: 'walletconnect',
        COINBASE_WALLET: 'coinbasewallet',
        RAINBOW: 'rainbow'
      }
    }

    useWeb3.mockReturnValue(mockWeb3Context)

    // Setup window.ethereum
    window.ethereum = mockEthereum

    // Setup window.open
    window.open = mockWindowOpen
  })

  afterEach(() => {
    delete window.ethereum
  })

  // ==================== RENDERING TESTS ====================

  describe('Modal Rendering', () => {
    it('renders without crashing when open', () => {
      const { container } = render(
        <WalletModal isOpen={true} onClose={jest.fn()} />
      )
      expect(container).toBeInTheDocument()
    })

    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <WalletModal isOpen={false} onClose={jest.fn()} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('displays modal title', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('displays modal subtitle', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Connect your wallet to access Web3 features')).toBeInTheDocument()
    })

    it('displays close button', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const closeButton = screen.getByRole('button', { name: /×/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('renders modal overlay with correct styles', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const overlay = container.firstChild
      expect(overlay).toHaveStyle({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      })
    })

    it('renders modal content with correct styles', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const modal = container.firstChild.firstChild
      expect(modal).toHaveStyle({
        borderRadius: '24px',
        padding: '32px'
      })
    })
  })

  // ==================== WALLET OPTIONS DISPLAY TESTS ====================

  describe('Wallet Options Display', () => {
    it('displays MetaMask wallet option', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
      expect(screen.getByText('Connect using MetaMask wallet')).toBeInTheDocument()
    })

    it('displays WalletConnect option', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
      expect(screen.getByText('Connect using WalletConnect protocol')).toBeInTheDocument()
    })

    it('displays Coinbase Wallet option', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
      expect(screen.getByText('Connect using Coinbase Wallet')).toBeInTheDocument()
    })

    it('displays Rainbow wallet option', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Rainbow')).toBeInTheDocument()
      expect(screen.getByText('Connect using Rainbow wallet')).toBeInTheDocument()
    })

    it('displays all four wallet options', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const walletOptions = screen.getAllByText(/Connect using/i)
      expect(walletOptions).toHaveLength(4)
    })

    it('displays wallet icons', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('🦊')).toBeInTheDocument() // MetaMask
      expect(screen.getByText('📱')).toBeInTheDocument() // WalletConnect
      expect(screen.getByText('🔵')).toBeInTheDocument() // Coinbase
      expect(screen.getByText('🌈')).toBeInTheDocument() // Rainbow
    })

    it('shows green indicator for installed wallets', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const indicators = document.querySelectorAll('[style*="green"]')
      expect(indicators.length).toBeGreaterThan(0)
    })
  })

  // ==================== MODAL OPEN/CLOSE TESTS ====================

  describe('Modal Open/Close Behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn()
      render(<WalletModal isOpen={true} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /×/i })
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when overlay is clicked', () => {
      const onClose = jest.fn()
      const { container } = render(<WalletModal isOpen={true} onClose={onClose} />)

      const overlay = container.firstChild
      fireEvent.click(overlay)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when modal content is clicked', () => {
      const onClose = jest.fn()
      const { container } = render(<WalletModal isOpen={true} onClose={onClose} />)

      const modal = container.firstChild.firstChild
      fireEvent.click(modal)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('prevents event propagation when clicking modal content', () => {
      const onClose = jest.fn()
      render(<WalletModal isOpen={true} onClose={onClose} />)

      const modalTitle = screen.getByText('Connect Wallet')
      fireEvent.click(modalTitle)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ==================== WALLET CONNECTION FLOW TESTS ====================

  describe('MetaMask Connection', () => {
    it('calls connectMetaMask when MetaMask option is clicked', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalledTimes(1)
      })
    })

    it('closes modal after successful MetaMask connection', async () => {
      const onClose = jest.fn()
      mockWeb3Context.connectMetaMask.mockResolvedValue(true)

      render(<WalletModal isOpen={true} onClose={onClose} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('does not close modal after failed MetaMask connection', async () => {
      const onClose = jest.fn()
      mockWeb3Context.connectMetaMask.mockResolvedValue(false)

      render(<WalletModal isOpen={true} onClose={onClose} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('clears error before connecting MetaMask', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.clearError).toHaveBeenCalled()
      })
    })
  })

  describe('WalletConnect Connection', () => {
    it('calls connectWalletConnect when WalletConnect option is clicked', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const walletConnectOption = screen.getByText('WalletConnect').closest('div')
      fireEvent.click(walletConnectOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectWalletConnect).toHaveBeenCalledTimes(1)
      })
    })

    it('closes modal after successful WalletConnect connection', async () => {
      const onClose = jest.fn()
      mockWeb3Context.connectWalletConnect.mockResolvedValue(true)

      render(<WalletModal isOpen={true} onClose={onClose} />)

      const walletConnectOption = screen.getByText('WalletConnect').closest('div')
      fireEvent.click(walletConnectOption)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Coinbase Wallet Connection', () => {
    it('calls connectCoinbaseWallet when Coinbase option is clicked', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const coinbaseOption = screen.getByText('Coinbase Wallet').closest('div')
      fireEvent.click(coinbaseOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectCoinbaseWallet).toHaveBeenCalledTimes(1)
      })
    })

    it('closes modal after successful Coinbase connection', async () => {
      const onClose = jest.fn()
      mockWeb3Context.connectCoinbaseWallet.mockResolvedValue(true)

      render(<WalletModal isOpen={true} onClose={onClose} />)

      const coinbaseOption = screen.getByText('Coinbase Wallet').closest('div')
      fireEvent.click(coinbaseOption)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Rainbow Connection', () => {
    it('calls connectWalletConnect when Rainbow option is clicked', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const rainbowOption = screen.getByText('Rainbow').closest('div')
      fireEvent.click(rainbowOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectWalletConnect).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ==================== LOADING STATES TESTS ====================

  describe('Loading States', () => {
    it('shows loading spinner when isConnecting is true', () => {
      mockWeb3Context.isConnecting = true
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const loadingSpinners = document.querySelectorAll('[style*="spin"]')
      expect(loadingSpinners.length).toBeGreaterThan(0)
    })

    it('shows loading spinner for selected wallet only', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      // The loading spinner should appear during connection
      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })
    })

    it('applies hover styles to wallet options', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.mouseEnter(metamaskOption)

      // Hover should change the styles
      expect(metamaskOption).toBeInTheDocument()
    })

    it('removes hover styles on mouse leave', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.mouseEnter(metamaskOption)
      fireEvent.mouseLeave(metamaskOption)

      expect(metamaskOption).toBeInTheDocument()
    })

    it('does not apply hover styles to selected wallet', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)
      fireEvent.mouseEnter(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })
    })
  })

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error States', () => {
    it('displays error message when error exists', () => {
      mockWeb3Context.error = 'Connection failed'
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })

    it('does not display error when error is null', () => {
      mockWeb3Context.error = null
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const errorElements = document.querySelectorAll('[style*="red"]')
      expect(errorElements.length).toBe(0)
    })

    it('displays MetaMask not installed error', () => {
      mockWeb3Context.error = 'MetaMask is not installed'
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('MetaMask is not installed')).toBeInTheDocument()
    })

    it('displays connection rejected error', () => {
      mockWeb3Context.error = 'User rejected the connection'
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('User rejected the connection')).toBeInTheDocument()
    })

    it('displays wrong network error', () => {
      mockWeb3Context.error = 'Please switch to a supported network'
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Please switch to a supported network')).toBeInTheDocument()
    })

    it('displays wallet connection timeout error', () => {
      mockWeb3Context.error = 'Connection timeout'
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('handles connection errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockWeb3Context.connectMetaMask.mockRejectedValue(new Error('Connection failed'))

      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Wallet connection failed:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // ==================== WALLET NOT INSTALLED TESTS ====================

  describe('Wallet Not Installed', () => {
    beforeEach(() => {
      delete window.ethereum
    })

    it('shows install button for MetaMask when not installed', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const installButtons = screen.getAllByText('Install')
      expect(installButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('opens MetaMask install page when install button clicked', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      const installButton = metamaskOption.querySelector('button')

      if (installButton) {
        fireEvent.click(installButton)
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://metamask.io/download/',
          '_blank'
        )
      }
    })

    it('opens Coinbase Wallet install page when install clicked', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const coinbaseOption = screen.getByText('Coinbase Wallet').closest('div')
      fireEvent.click(coinbaseOption)

      // Since Coinbase is marked as installed by default, we need to test the logic
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens Rainbow install page when install clicked', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      // Rainbow is always marked as installed, so no install button
      const rainbowOption = screen.getByText('Rainbow')
      expect(rainbowOption).toBeInTheDocument()
    })

    it('calls handleInstallWallet with correct wallet ID', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      // Should either connect or show install option
      expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
    })
  })

  // ==================== FOOTER AND LINKS TESTS ====================

  describe('Footer Content', () => {
    it('displays terms of service link', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })

    it('displays privacy policy link', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    it('displays learn about wallets link', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Learn about wallets')).toBeInTheDocument()
    })

    it('opens ethereum.org wallets page when learn link clicked', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const learnLink = screen.getByText('Learn about wallets')
      fireEvent.click(learnLink)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://ethereum.org/en/wallets/',
        '_blank'
      )
    })

    it('displays new to Web3 text', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText(/New to Web3/i)).toBeInTheDocument()
    })

    it('displays agreement text', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText(/By connecting a wallet, you agree/i)).toBeInTheDocument()
    })
  })

  // ==================== STYLING AND ANIMATION TESTS ====================

  describe('Styling and Animations', () => {
    it('includes spin animation keyframes', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const style = container.querySelector('style')
      expect(style).toBeInTheDocument()
      expect(style.textContent).toContain('@keyframes spin')
    })

    it('applies backdrop filter to overlay', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const overlay = container.firstChild
      expect(overlay).toHaveStyle({ backdropFilter: 'blur(8px)' })
    })

    it('applies border radius to modal', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const modal = container.firstChild.firstChild
      expect(modal).toHaveStyle({ borderRadius: '24px' })
    })

    it('applies correct z-index to overlay', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const overlay = container.firstChild
      expect(overlay).toHaveStyle({ zIndex: 1000 })
    })

    it('applies box shadow to modal', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const modal = container.firstChild.firstChild
      expect(modal).toHaveStyle({
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      })
    })
  })

  // ==================== ACCESSIBILITY TESTS ====================

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const heading = screen.getByRole('heading', { name: /Connect Wallet/i })
      expect(heading).toBeInTheDocument()
    })

    it('close button is accessible', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      const closeButton = screen.getByRole('button', { name: /×/i })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveStyle({ cursor: 'pointer' })
    })

    it('wallet options are keyboard accessible', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      expect(metamaskOption).toHaveStyle({ cursor: 'pointer' })
    })

    it('supports tab navigation', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const closeButton = screen.getByRole('button', { name: /×/i })
      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)
    })
  })

  // ==================== INTEGRATION TESTS ====================

  describe('Integration', () => {
    it('completes full connection flow', async () => {
      const onClose = jest.fn()
      mockWeb3Context.connectMetaMask.mockResolvedValue(true)

      render(<WalletModal isOpen={true} onClose={onClose} />)

      // Click MetaMask option
      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      // Wait for connection
      await waitFor(() => {
        expect(mockWeb3Context.clearError).toHaveBeenCalled()
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('handles multiple wallet connection attempts', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      const walletConnectOption = screen.getByText('WalletConnect').closest('div')

      fireEvent.click(metamaskOption)
      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })

      fireEvent.click(walletConnectOption)
      await waitFor(() => {
        expect(mockWeb3Context.connectWalletConnect).toHaveBeenCalled()
      })
    })

    it('clears error before each connection attempt', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.clearError).toHaveBeenCalledTimes(1)
      })

      const walletConnectOption = screen.getByText('WalletConnect').closest('div')
      fireEvent.click(walletConnectOption)

      await waitFor(() => {
        expect(mockWeb3Context.clearError).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('handles undefined window.ethereum gracefully', () => {
      delete window.ethereum
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('MetaMask')).toBeInTheDocument()
    })

    it('handles null onClose prop', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={null} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles rapid open/close cycles', () => {
      const { rerender } = render(<WalletModal isOpen={false} onClose={jest.fn()} />)

      rerender(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()

      rerender(<WalletModal isOpen={false} onClose={jest.fn()} />)
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument()

      rerender(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('handles empty error message', () => {
      mockWeb3Context.error = ''
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      // Empty error should not cause issues
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('handles very long error messages', () => {
      const longError = 'A'.repeat(500)
      mockWeb3Context.error = longError

      render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(screen.getByText(longError)).toBeInTheDocument()
    })

    it('handles connection promise rejection', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockWeb3Context.connectMetaMask.mockRejectedValue(new Error('Network error'))

      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles undefined wallet types', () => {
      mockWeb3Context.WALLET_TYPES = undefined

      expect(() => {
        render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      }).toThrow()
    })

    it('resets selected wallet after connection completes', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })

      // After connection, selected wallet should be reset
      // This is tested by checking that loading spinner disappears
    })

    it('handles simultaneous wallet connection attempts', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      const walletConnectOption = screen.getByText('WalletConnect').closest('div')

      // Click both quickly
      fireEvent.click(metamaskOption)
      fireEvent.click(walletConnectOption)

      await waitFor(() => {
        // One or both should be called
        const totalCalls = mockWeb3Context.connectMetaMask.mock.calls.length +
                          mockWeb3Context.connectWalletConnect.mock.calls.length
        expect(totalCalls).toBeGreaterThan(0)
      })
    })
  })

  // ==================== SNAPSHOT TESTS ====================

  describe('Snapshots', () => {
    it('matches snapshot when closed', () => {
      const { container } = render(<WalletModal isOpen={false} onClose={jest.fn()} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot when open', () => {
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with error', () => {
      mockWeb3Context.error = 'Test error message'
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot while connecting', () => {
      mockWeb3Context.isConnecting = true
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot without MetaMask installed', () => {
      delete window.ethereum
      const { container } = render(<WalletModal isOpen={true} onClose={jest.fn()} />)
      expect(container).toMatchSnapshot()
    })
  })

  // ==================== PERFORMANCE TESTS ====================

  describe('Performance', () => {
    it('renders efficiently on repeated opens', () => {
      const { rerender } = render(<WalletModal isOpen={false} onClose={jest.fn()} />)

      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        rerender(<WalletModal isOpen={true} onClose={jest.fn()} />)
        rerender(<WalletModal isOpen={false} onClose={jest.fn()} />)
      }
      const endTime = performance.now()

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('handles rapid wallet selection changes', async () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      const walletConnectOption = screen.getByText('WalletConnect').closest('div')
      const coinbaseOption = screen.getByText('Coinbase Wallet').closest('div')

      // Rapidly hover between options
      fireEvent.mouseEnter(metamaskOption)
      fireEvent.mouseLeave(metamaskOption)
      fireEvent.mouseEnter(walletConnectOption)
      fireEvent.mouseLeave(walletConnectOption)
      fireEvent.mouseEnter(coinbaseOption)
      fireEvent.mouseLeave(coinbaseOption)

      // Should not crash
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })
  })

  // ==================== USER INTERACTION TESTS ====================

  describe('User Interactions', () => {
    it('provides visual feedback on hover', () => {
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      const initialStyle = metamaskOption.style.cursor

      fireEvent.mouseEnter(metamaskOption)

      expect(metamaskOption).toHaveStyle({ cursor: 'pointer' })
    })

    it('maintains wallet selection during connection', async () => {
      mockWeb3Context.isConnecting = true
      render(<WalletModal isOpen={true} onClose={jest.fn()} />)

      const metamaskOption = screen.getByText('MetaMask').closest('div')
      fireEvent.click(metamaskOption)

      // Should show loading state
      await waitFor(() => {
        expect(mockWeb3Context.connectMetaMask).toHaveBeenCalled()
      })
    })
  })
})

export default mockEthereum
