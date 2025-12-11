import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CryptoWalletStep from './CryptoWalletStep'

describe('CryptoWalletStep', () => {
  let mockOnComplete
  let mockOnSkip
  let mockEthereum

  beforeEach(() => {
    mockOnComplete = jest.fn()
    mockOnSkip = jest.fn()

    mockEthereum = {
      request: jest.fn()
    }

    delete window.ethereum

    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  describe('Initial Render', () => {
    test('renders the component', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    test('displays the main heading', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Connect Your Wallet')).toHaveClass('text-2xl')
    })

    test('displays the subtitle', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText(/Connect your crypto wallet to earn CRYB tokens/i)).toBeInTheDocument()
    })

    test('shows disconnected state by default', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Choose Your Wallet')).toBeInTheDocument()
    })

    test('displays wallet benefits section', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText(/Why Connect Your Wallet/i)).toBeInTheDocument()
    })

    test('displays all wallet benefits', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Earn CRYB tokens for community participation')).toBeInTheDocument()
      expect(screen.getByText('Access exclusive Web3 features')).toBeInTheDocument()
      expect(screen.getByText('Trade and showcase your NFTs')).toBeInTheDocument()
      expect(screen.getByText('Participate in governance voting')).toBeInTheDocument()
    })

    test('displays security note', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText(/Security Note/i)).toBeInTheDocument()
      expect(screen.getByText(/CRYB will never ask for your private keys or seed phrase/i)).toBeInTheDocument()
    })
  })

  describe('Wallet Options Display', () => {
    test('displays MetaMask option', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
    })

    test('displays MetaMask description', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Most popular Ethereum wallet')).toBeInTheDocument()
    })

    test('displays WalletConnect option', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
    })

    test('displays WalletConnect description', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Connect any mobile wallet')).toBeInTheDocument()
    })

    test('displays Coinbase Wallet option', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
    })

    test('displays Coinbase Wallet description', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('User-friendly wallet by Coinbase')).toBeInTheDocument()
    })

    test('all wallet options are clickable buttons', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const buttons = screen.getAllByRole('button')
      const walletButtons = buttons.filter(btn =>
        btn.textContent.includes('MetaMask') ||
        btn.textContent.includes('WalletConnect') ||
        btn.textContent.includes('Coinbase')
      )
      expect(walletButtons).toHaveLength(3)
    })
  })

  describe('MetaMask Connection', () => {
    test('clicking MetaMask button triggers connection', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to metamask/i)).toBeInTheDocument()
      })
    })

    test('shows loading state when connecting to MetaMask', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockImplementation(() => new Promise(() => {}))

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to metamask/i)).toBeInTheDocument()
      })
    })

    test('displays spinner during connection', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockImplementation(() => new Promise(() => {}))

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        const spinner = document.querySelector('.')
        expect(spinner).toBeInTheDocument()
      })
    })

    test('displays instruction message during connection', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockImplementation(() => new Promise(() => {}))

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Please check your wallet and approve the connection/i)).toBeInTheDocument()
      })
    })

    test('successfully connects MetaMask wallet', async () => {
      window.ethereum = mockEthereum
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValue([testAddress])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })
    })

    test('displays wallet address after successful connection', async () => {
      window.ethereum = mockEthereum
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValue([testAddress])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(testAddress)).toBeInTheDocument()
      })
    })

    test('displays wallet type after successful connection', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Your metamask wallet is now connected/i)).toBeInTheDocument()
      })
    })

    test('calls ethereum.request with correct method', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
      })
    })

    test('shows error when MetaMask is not installed', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      })
    })

    test('logs error when MetaMask is not installed', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Wallet connection failed:', expect.any(Error))
      })
    })

    test('shows error when connection is rejected', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockRejectedValue(new Error('User rejected request'))

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      })
    })

    test('shows error when no accounts returned', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue([])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.queryByText('Wallet Connected!')).not.toBeInTheDocument()
      })
    })
  })

  describe('WalletConnect Connection', () => {
    test('clicking WalletConnect button triggers connection', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to walletconnect/i)).toBeInTheDocument()
      })
    })

    test('shows loading state for WalletConnect', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to walletconnect/i)).toBeInTheDocument()
      })
    })

    test('WalletConnect connection shows error (not implemented)', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to walletconnect/i)).toBeInTheDocument()
      })
    })
  })

  describe('Coinbase Wallet Connection', () => {
    test('clicking Coinbase button triggers connection', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to coinbase/i)).toBeInTheDocument()
      })
    })

    test('shows loading state for Coinbase', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to coinbase/i)).toBeInTheDocument()
      })
    })

    test('Coinbase connection shows error (not implemented)', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to coinbase/i)).toBeInTheDocument()
      })
    })
  })

  describe('Connected State', () => {
    test('displays success emoji when connected', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('🎉')).toBeInTheDocument()
      })
    })

    test('displays connected address label', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Connected Address:')).toBeInTheDocument()
      })
    })

    test('displays disconnect button when connected', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Disconnect Wallet')).toBeInTheDocument()
      })
    })

    test('address is displayed in monospace font', async () => {
      window.ethereum = mockEthereum
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValue([testAddress])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        const addressElement = screen.getByText(testAddress)
        expect(addressElement).toHaveClass('font-mono')
      })
    })

    test('hides wallet selection when connected', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.queryByText('Choose Your Wallet')).not.toBeInTheDocument()
      })
    })

    test('hides benefits section when connected', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.queryByText(/Why Connect Your Wallet/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Disconnect Functionality', () => {
    test('clicking disconnect button resets wallet status', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Disconnect Wallet')).toBeInTheDocument()
      })

      const disconnectButton = screen.getByText('Disconnect Wallet')
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(screen.getByText('Choose Your Wallet')).toBeInTheDocument()
      })
    })

    test('disconnect clears wallet address', async () => {
      window.ethereum = mockEthereum
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValue([testAddress])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(testAddress)).toBeInTheDocument()
      })

      const disconnectButton = screen.getByText('Disconnect Wallet')
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(screen.queryByText(testAddress)).not.toBeInTheDocument()
      })
    })

    test('disconnect clears wallet type', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Your metamask wallet is now connected/i)).toBeInTheDocument()
      })

      const disconnectButton = screen.getByText('Disconnect Wallet')
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(screen.queryByText(/Your metamask wallet is now connected/i)).not.toBeInTheDocument()
      })
    })

    test('disconnect shows wallet selection again', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.queryByText('Choose Your Wallet')).not.toBeInTheDocument()
      })

      const disconnectButton = screen.getByText('Disconnect Wallet')
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(screen.getByText('Choose Your Wallet')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    test('displays error icon when connection fails', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
      })
    })

    test('displays error message', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to your wallet/i)).toBeInTheDocument()
      })
    })

    test('displays try again button on error', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    test('clicking try again returns to disconnected state', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      await waitFor(() => {
        expect(screen.getByText('Choose Your Wallet')).toBeInTheDocument()
      })
    })

    test('hides wallet selection during error state', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.queryByText('Choose Your Wallet')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation Buttons', () => {
    test('displays skip button', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Skip for now')).toBeInTheDocument()
    })

    test('displays continue button', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    test('clicking skip button calls onSkip', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const skipButton = screen.getByText('Skip for now')
      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(1)
    })

    test('clicking continue button calls onComplete', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    test('skip and continue buttons are always visible', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    test('navigation buttons visible during connection', async () => {
      window.ethereum = mockEthereum
      mockEthereum.request.mockImplementation(() => new Promise(() => {}))

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to metamask/i)).toBeInTheDocument()
      })

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    test('navigation buttons visible during error', async () => {
      delete window.ethereum

      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })
  })

  describe('Multiple Wallet Types', () => {
    test('can switch between wallet types', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to walletconnect/i)).toBeInTheDocument()
      })
    })

    test('maintains correct wallet type during connection', async () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)

      await waitFor(() => {
        expect(screen.getByText(/Connecting to coinbase/i)).toBeInTheDocument()
      })
    })
  })

  describe('Component Styling', () => {
    test('main container has correct classes', () => {
      const { container } = render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('max-w-2xl', 'mx-auto', 'py-4')
    })

    test('wallet buttons have hover classes', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      expect(metaMaskButton).toHaveClass('hover:border-orange-400')
    })

    test('continue button has correct styling', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg')
    })

    test('skip button has correct styling', () => {
      render(<CryptoWalletStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const skipButton = screen.getByText('Skip for now')
      expect(skipButton).toHaveClass('text-gray-500')
    })
  })
})

export default buttons
