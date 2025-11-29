import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WalletConnectionPreview from './WalletConnectionPreview'

describe('WalletConnectionPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initial State - Wallet Selection', () => {
    it('should render the wallet selection view by default', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    it('should display the heading text correctly', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    it('should display the descriptive text', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Choose a wallet to connect to CRYB and unlock Web3 features')).toBeInTheDocument()
    })

    it('should render the wallet icon in the header', () => {
      render(<WalletConnectionPreview />)
      const walletIcon = document.querySelector('.w-16.h-16.bg-accent-primary\\/20')
      expect(walletIcon).toBeInTheDocument()
    })

    it('should display all wallet options', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
      expect(screen.getByText('Phantom')).toBeInTheDocument()
      expect(screen.getByText('Trust Wallet')).toBeInTheDocument()
      expect(screen.getByText('Ledger')).toBeInTheDocument()
    })

    it('should display wallet descriptions', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Most popular Ethereum wallet')).toBeInTheDocument()
      expect(screen.getByText('Connect with 300+ wallets')).toBeInTheDocument()
      expect(screen.getByText('Self-custody wallet by Coinbase')).toBeInTheDocument()
    })

    it('should display wallet icons', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('🦊')).toBeInTheDocument()
      expect(screen.getByText('📱')).toBeInTheDocument()
      expect(screen.getByText('⚪')).toBeInTheDocument()
      expect(screen.getByText('👻')).toBeInTheDocument()
      expect(screen.getByText('🔷')).toBeInTheDocument()
      expect(screen.getByText('🔐')).toBeInTheDocument()
    })
  })

  describe('Wallet Selection - Popular Badges', () => {
    it('should display "Popular" badge for MetaMask', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      expect(within(metamaskButton).getByText('Popular')).toBeInTheDocument()
    })

    it('should display "Popular" badge for WalletConnect', () => {
      render(<WalletConnectionPreview />)
      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      expect(within(walletConnectButton).getByText('Popular')).toBeInTheDocument()
    })

    it('should display "Popular" badge for Coinbase Wallet', () => {
      render(<WalletConnectionPreview />)
      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      expect(within(coinbaseButton).getByText('Popular')).toBeInTheDocument()
    })

    it('should not display "Popular" badge for Phantom', () => {
      render(<WalletConnectionPreview />)
      const phantomButton = screen.getByText('Phantom').closest('button')
      expect(within(phantomButton).queryByText('Popular')).not.toBeInTheDocument()
    })

    it('should not display "Popular" badge for Trust Wallet', () => {
      render(<WalletConnectionPreview />)
      const trustButton = screen.getByText('Trust Wallet').closest('button')
      expect(within(trustButton).queryByText('Popular')).not.toBeInTheDocument()
    })
  })

  describe('Wallet Selection - Supported vs Unsupported Wallets', () => {
    it('should enable supported wallet buttons', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      expect(metamaskButton).not.toBeDisabled()
    })

    it('should disable unsupported wallet buttons', () => {
      render(<WalletConnectionPreview />)
      const phantomButton = screen.getByText('Phantom').closest('button')
      expect(phantomButton).toBeDisabled()
    })

    it('should show "Coming Soon" for unsupported wallets', () => {
      render(<WalletConnectionPreview />)
      const comingSoonElements = screen.getAllByText('Coming Soon')
      expect(comingSoonElements).toHaveLength(3)
    })

    it('should apply opacity-50 class to unsupported wallets', () => {
      render(<WalletConnectionPreview />)
      const phantomButton = screen.getByText('Phantom').closest('button')
      expect(phantomButton).toHaveClass('opacity-50')
    })

    it('should apply cursor-not-allowed class to unsupported wallets', () => {
      render(<WalletConnectionPreview />)
      const phantomButton = screen.getByText('Phantom').closest('button')
      expect(phantomButton).toHaveClass('cursor-not-allowed')
    })

    it('should apply cursor-pointer class to supported wallets', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      expect(metamaskButton).toHaveClass('cursor-pointer')
    })
  })

  describe('Security Information', () => {
    it('should display security note section', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Secure Connection')).toBeInTheDocument()
    })

    it('should display security note message', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText(/CRYB never stores your private keys/)).toBeInTheDocument()
    })

    it('should render Shield icon in security note', () => {
      render(<WalletConnectionPreview />)
      const securitySection = screen.getByText('Secure Connection').closest('div')
      const shieldIcon = securitySection.querySelector('.text-success')
      expect(shieldIcon).toBeInTheDocument()
    })
  })

  describe('Benefits Preview', () => {
    it('should display benefits heading', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText("What you'll unlock:")).toBeInTheDocument()
    })

    it('should display NFT Profile Pictures benefit', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('NFT Profile Pictures')).toBeInTheDocument()
    })

    it('should display Crypto Payments benefit', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Crypto Payments')).toBeInTheDocument()
    })

    it('should display Token Gating benefit', () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Token Gating')).toBeInTheDocument()
    })
  })

  describe('Connecting State', () => {
    it('should display connecting view when a supported wallet is clicked', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Connecting to MetaMask')).toBeInTheDocument()
    })

    it('should display wallet icon in connecting view', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      const loadingAnimation = document.querySelector('.animate-pulse')
      expect(within(loadingAnimation).getByText('🦊')).toBeInTheDocument()
    })

    it('should display confirmation message', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Please confirm the connection in your wallet')).toBeInTheDocument()
    })

    it('should display connection step: Opening wallet', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Opening MetaMask')).toBeInTheDocument()
    })

    it('should display connection step: Waiting for confirmation', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument()
    })

    it('should display connection step: Connecting to CRYB', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Connecting to CRYB')).toBeInTheDocument()
    })

    it('should display Cancel button in connecting state', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should reset connection when Cancel button is clicked', () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    it('should not trigger connection for unsupported wallets', () => {
      render(<WalletConnectionPreview />)
      const phantomButton = screen.getByText('Phantom').closest('button')
      fireEvent.click(phantomButton)
      expect(screen.queryByText('Connecting to Phantom')).not.toBeInTheDocument()
    })
  })

  describe('Connected State', () => {
    it('should display connected view after connection timeout', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })
    })

    it('should display success message', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText(/MetaMask is now connected to your CRYB account/)).toBeInTheDocument()
      })
    })

    it('should display success icon with check mark', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const successIcon = document.querySelector('.bg-success\\/20')
        expect(successIcon).toBeInTheDocument()
      })
    })

    it('should display wallet icon in connected state', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const walletInfo = screen.getByText('0x742d...4a8C').closest('div').parentElement
        expect(within(walletInfo).getByText('🦊')).toBeInTheDocument()
      })
    })

    it('should display wallet name in connected state', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const walletInfoSection = screen.getByText('0x742d...4a8C').closest('.bg-secondary')
        expect(within(walletInfoSection).getByText('MetaMask')).toBeInTheDocument()
      })
    })

    it('should display formatted wallet address', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('0x742d...4a8C')).toBeInTheDocument()
      })
    })

    it('should display network information', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Network')).toBeInTheDocument()
        expect(screen.getByText('Ethereum')).toBeInTheDocument()
      })
    })

    it('should display balance information', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Balance')).toBeInTheDocument()
        expect(screen.getByText('2.45 ETH')).toBeInTheDocument()
      })
    })

    it('should display "What\'s Next?" section', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText("What's Next?")).toBeInTheDocument()
      })
    })

    it('should display next step: Set NFT as profile picture', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Set NFT as profile picture')).toBeInTheDocument()
      })
    })

    it('should display next step: Access token-gated communities', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Access token-gated communities')).toBeInTheDocument()
      })
    })

    it('should display next step: Send crypto payments', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Send crypto payments')).toBeInTheDocument()
      })
    })

    it('should display Disconnect button', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
      })
    })

    it('should display Explore Features button', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Explore Features')).toBeInTheDocument()
      })
    })

    it('should reset to selection view when Disconnect is clicked', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const disconnectButton = screen.getByText('Disconnect')
        fireEvent.click(disconnectButton)
      })
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })
  })

  describe('Different Wallet Connections', () => {
    it('should connect to WalletConnect', async () => {
      render(<WalletConnectionPreview />)
      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)
      expect(screen.getByText('Connecting to WalletConnect')).toBeInTheDocument()
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText(/WalletConnect is now connected/)).toBeInTheDocument()
      })
    })

    it('should connect to Coinbase Wallet', async () => {
      render(<WalletConnectionPreview />)
      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)
      expect(screen.getByText('Connecting to Coinbase Wallet')).toBeInTheDocument()
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText(/Coinbase Wallet is now connected/)).toBeInTheDocument()
      })
    })

    it('should show WalletConnect icon when connected', async () => {
      render(<WalletConnectionPreview />)
      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const walletInfo = screen.getByText('0x742d...4a8C').closest('div').parentElement
        expect(within(walletInfo).getByText('📱')).toBeInTheDocument()
      })
    })

    it('should show Coinbase Wallet icon when connected', async () => {
      render(<WalletConnectionPreview />)
      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button')
      fireEvent.click(coinbaseButton)
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        const walletInfo = screen.getByText('0x742d...4a8C').closest('div').parentElement
        expect(within(walletInfo).getByText('⚪')).toBeInTheDocument()
      })
    })
  })

  describe('Component State Management', () => {
    it('should maintain state through connection flow', async () => {
      render(<WalletConnectionPreview />)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()

      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      expect(screen.getByText('Connecting to MetaMask')).toBeInTheDocument()

      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })
    })

    it('should reset all state when disconnecting', async () => {
      render(<WalletConnectionPreview />)
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        const disconnectButton = screen.getByText('Disconnect')
        fireEvent.click(disconnectButton)
      })

      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      expect(screen.queryByText('Wallet Connected!')).not.toBeInTheDocument()
    })

    it('should allow reconnecting after disconnection', async () => {
      render(<WalletConnectionPreview />)

      // First connection
      const metamaskButton = screen.getByText('MetaMask').closest('button')
      fireEvent.click(metamaskButton)
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        const disconnectButton = screen.getByText('Disconnect')
        fireEvent.click(disconnectButton)
      })

      // Second connection
      const walletConnectButton = screen.getByText('WalletConnect').closest('button')
      fireEvent.click(walletConnectButton)
      expect(screen.getByText('Connecting to WalletConnect')).toBeInTheDocument()

      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText(/WalletConnect is now connected/)).toBeInTheDocument()
      })
    })
  })
})

export default walletIcon
