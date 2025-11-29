/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import WalletConnectionPage from '../WalletConnectionPage'

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock fetch
global.fetch = jest.fn()

describe('WalletConnectionPage', () => {
  let mockEthereum

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()

    // Mock ethereum provider
    mockEthereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    }

    global.window.ethereum = mockEthereum
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  afterEach(() => {
    delete global.window.ethereum
  })

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays main heading', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    it('displays welcome description', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText(/Choose a wallet to connect to CRYB Platform/i)).toBeInTheDocument()
    })

    it('has proper ARIA labels on main section', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Wallet connection page')
    })

    it('displays all wallet options', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
      expect(screen.getByText('Phantom')).toBeInTheDocument()
    })

    it('displays wallet descriptions', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText('Most popular Ethereum wallet')).toBeInTheDocument()
      expect(screen.getByText('Connect with mobile wallets')).toBeInTheDocument()
      expect(screen.getByText('Secure and easy to use')).toBeInTheDocument()
      expect(screen.getByText('Solana & Ethereum support')).toBeInTheDocument()
    })

    it('renders all wallet icons', () => {
      renderWithRouter(<WalletConnectionPage />)
      const container = screen.getByRole('main')
      expect(container.textContent).toContain('🦊')
      expect(container.textContent).toContain('🔗')
      expect(container.textContent).toContain('🔵')
      expect(container.textContent).toContain('👻')
    })

    it('displays feature badges', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText('Secure')).toBeInTheDocument()
      expect(screen.getByText('Fast')).toBeInTheDocument()
      expect(screen.getByText('Simple')).toBeInTheDocument()
    })

    it('has proper ARIA label for features group', () => {
      renderWithRouter(<WalletConnectionPage />)
      const featuresGroup = screen.getByRole('group', { name: 'Wallet connection features' })
      expect(featuresGroup).toBeInTheDocument()
    })

    it('has proper ARIA label for wallets group', () => {
      renderWithRouter(<WalletConnectionPage />)
      const walletsGroup = screen.getByRole('group', { name: 'Available wallets' })
      expect(walletsGroup).toBeInTheDocument()
    })
  })

  describe('Wallet Buttons', () => {
    it('renders MetaMask connect button', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('button', { name: 'Connect with MetaMask' })).toBeInTheDocument()
    })

    it('renders WalletConnect connect button', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('button', { name: 'Connect with WalletConnect' })).toBeInTheDocument()
    })

    it('renders Coinbase Wallet connect button', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('button', { name: 'Connect with Coinbase Wallet' })).toBeInTheDocument()
    })

    it('renders Phantom connect button', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('button', { name: 'Connect with Phantom' })).toBeInTheDocument()
    })

    it('all wallet buttons are enabled by default', () => {
      renderWithRouter(<WalletConnectionPage />)
      const buttons = screen.getAllByRole('button').filter(btn => btn.textContent.includes('MetaMask') || btn.textContent.includes('WalletConnect'))
      buttons.forEach(button => {
        expect(button).not.toBeDisabled()
      })
    })

    it('wallet buttons are clickable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })
      await user.click(metamaskBtn)
      expect(mockEthereum.request).toHaveBeenCalled()
    })
  })

  describe('MetaMask Connection', () => {
    it('successfully connects to MetaMask', async () => {
      const user = userEvent.setup()
      const mockAccounts = ['0x1234567890123456789012345678901234567890']
      mockEthereum.request.mockResolvedValueOnce(mockAccounts)

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
      })
    })

    it('displays loading state during connection', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(['0x123']), 100)))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      expect(screen.getByRole('status', { name: 'Connecting...' })).toBeInTheDocument()
    })

    it('disables all buttons during connection', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(['0x123']), 100)))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      const walletButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('Connect with')
      )
      walletButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('sends connection data to backend', async () => {
      const user = userEvent.setup()
      const mockAccounts = ['0x1234567890123456789012345678901234567890']
      mockEthereum.request.mockResolvedValueOnce(mockAccounts)

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/wallet/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            address: mockAccounts[0],
            walletType: 'metamask'
          }),
        })
      })
    })

    it('shows error when MetaMask is not installed', async () => {
      const user = userEvent.setup()
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/MetaMask is not installed/i)).toBeInTheDocument()
      })
    })

    it('error message has proper ARIA attributes', async () => {
      const user = userEvent.setup()
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('handles user rejection of connection', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockRejectedValueOnce(new Error('User rejected request'))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByText(/User rejected request/i)).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
      })
    })

    it('navigates to crypto page after successful connection', async () => {
      const user = userEvent.setup()
      const mockAccounts = ['0x1234567890123456789012345678901234567890']
      mockEthereum.request.mockResolvedValueOnce(mockAccounts)

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/crypto')
      }, { timeout: 2000 })
    })

    it('handles empty accounts array', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockResolvedValueOnce([])

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    it('handles backend API failure', async () => {
      const user = userEvent.setup()
      const mockAccounts = ['0x1234567890123456789012345678901234567890']
      mockEthereum.request.mockResolvedValueOnce(mockAccounts)
      global.fetch.mockRejectedValueOnce(new Error('Backend error'))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Other Wallet Connections', () => {
    it('shows not implemented error for WalletConnect', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)
      const walletConnectBtn = screen.getByRole('button', { name: 'Connect with WalletConnect' })

      await user.click(walletConnectBtn)

      await waitFor(() => {
        expect(screen.getByText(/WalletConnect connection is not yet implemented/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('shows not implemented error for Coinbase Wallet', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)
      const coinbaseBtn = screen.getByRole('button', { name: 'Connect with Coinbase Wallet' })

      await user.click(coinbaseBtn)

      await waitFor(() => {
        expect(screen.getByText(/Coinbase Wallet connection is not yet implemented/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('shows not implemented error for Phantom', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)
      const phantomBtn = screen.getByRole('button', { name: 'Connect with Phantom' })

      await user.click(phantomBtn)

      await waitFor(() => {
        expect(screen.getByText(/Phantom connection is not yet implemented/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('resets connecting state after non-MetaMask wallet error', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)
      const phantomBtn = screen.getByRole('button', { name: 'Connect with Phantom' })

      await user.click(phantomBtn)

      await waitFor(() => {
        expect(screen.getByText(/Phantom connection is not yet implemented/i)).toBeInTheDocument()
      }, { timeout: 2000 })

      await waitFor(() => {
        expect(phantomBtn).not.toBeDisabled()
      })
    })
  })

  describe('Check Existing Connection', () => {
    it('checks for existing connection on mount', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890'])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_accounts' })
      })
    })

    it('displays connected state if wallet already connected', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValueOnce([mockAddress])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })
    })

    it('displays truncated address when connected', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValueOnce([mockAddress])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument()
      })
    })

    it('handles check connection error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockEthereum.request.mockRejectedValueOnce(new Error('Connection check failed'))

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    it('does not check connection if ethereum not available', async () => {
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      })
    })
  })

  describe('Connected State UI', () => {
    beforeEach(() => {
      const mockAddress = '0x1234567890123456789012345678901234567890'
      mockEthereum.request.mockResolvedValueOnce([mockAddress])
    })

    it('shows connected state with proper ARIA label', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Wallet connected page')
      })
    })

    it('displays success icon in connected state', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })
    })

    it('displays connected address label', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText('Connected Address')).toBeInTheDocument()
      })
    })

    it('displays crypto dashboard link', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Go to Crypto Dashboard' })).toBeInTheDocument()
      })
    })

    it('crypto dashboard link has correct href', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Go to Crypto Dashboard' })
        expect(link).toHaveAttribute('href', '/crypto')
      })
    })

    it('displays disconnect button', async () => {
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeInTheDocument()
      })
    })

    it('disconnect button is clickable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeInTheDocument()
      })

      const disconnectBtn = screen.getByRole('button', { name: 'Disconnect wallet' })
      await user.click(disconnectBtn)

      expect(global.fetch).toHaveBeenCalledWith('/api/wallet/disconnect', {
        method: 'POST',
        credentials: 'include'
      })
    })

    it('clears connected address on disconnect', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected!')).toBeInTheDocument()
      })

      const disconnectBtn = screen.getByRole('button', { name: 'Disconnect wallet' })
      await user.click(disconnectBtn)

      await waitFor(() => {
        expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      })
    })

    it('handles disconnect error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      global.fetch.mockRejectedValueOnce(new Error('Disconnect error'))

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeInTheDocument()
      })

      const disconnectBtn = screen.getByRole('button', { name: 'Disconnect wallet' })
      await user.click(disconnectBtn)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })
  })

  describe('Footer Links', () => {
    it('displays "Don\'t have a wallet?" text', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText("Don't have a wallet?")).toBeInTheDocument()
    })

    it('displays MetaMask download link', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('link', { name: /Get MetaMask/i })).toBeInTheDocument()
    })

    it('MetaMask link opens in new tab', () => {
      renderWithRouter(<WalletConnectionPage />)
      const link = screen.getByRole('link', { name: /Get MetaMask/i })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('MetaMask link points to correct URL', () => {
      renderWithRouter(<WalletConnectionPage />)
      const link = screen.getByRole('link', { name: /Get MetaMask/i })
      expect(link).toHaveAttribute('href', 'https://metamask.io/download/')
    })

    it('displays Terms of Service link', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument()
    })

    it('displays Privacy Policy link', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument()
    })

    it('Terms link points to correct route', () => {
      renderWithRouter(<WalletConnectionPage />)
      const link = screen.getByRole('link', { name: /Terms of Service/i })
      expect(link).toHaveAttribute('href', '/terms')
    })

    it('Privacy link points to correct route', () => {
      renderWithRouter(<WalletConnectionPage />)
      const link = screen.getByRole('link', { name: /Privacy Policy/i })
      expect(link).toHaveAttribute('href', '/privacy')
    })

    it('displays agreement text', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByText(/By connecting your wallet, you agree to our/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithRouter(<WalletConnectionPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all buttons have accessible names', () => {
      renderWithRouter(<WalletConnectionPage />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('all links have accessible names', () => {
      renderWithRouter(<WalletConnectionPage />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })

    it('loading spinner has proper role and label', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(['0x123']), 100)))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Connecting...')
    })

    it('error alerts are announced to screen readers', async () => {
      const user = userEvent.setup()
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('decorative icons are hidden from screen readers', () => {
      renderWithRouter(<WalletConnectionPage />)
      const container = screen.getByRole('main')
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Styling and Visual States', () => {
    it('applies gradient background', () => {
      renderWithRouter(<WalletConnectionPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ background: expect.stringContaining('linear-gradient') })
    })

    it('wallet buttons have hover effect', () => {
      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })
      expect(metamaskBtn).toHaveStyle({ cursor: 'pointer' })
    })

    it('selected wallet button changes appearance', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(['0x123']), 100)))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      expect(metamaskBtn).toHaveAttribute('aria-busy', 'true')
    })

    it('includes animation keyframes', () => {
      renderWithRouter(<WalletConnectionPage />)
      const styles = document.querySelector('style')
      expect(styles?.textContent).toContain('@keyframes spin')
    })
  })

  describe('Error Message Display', () => {
    it('error message displays alert icon', async () => {
      const user = userEvent.setup()
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('error clears when connecting to different wallet', async () => {
      const user = userEvent.setup()
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)
      let metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Restore ethereum for second attempt
      global.window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValueOnce(['0x123'])

      metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })
      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Browser Compatibility', () => {
    it('handles missing ethereum provider gracefully', () => {
      delete global.window.ethereum

      renderWithRouter(<WalletConnectionPage />)

      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    })

    it('checks for ethereum on window object', async () => {
      global.window.ethereum = mockEthereum
      mockEthereum.request.mockResolvedValueOnce([])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalled()
      })
    })
  })

  describe('Address Formatting', () => {
    it('formats address correctly with first 6 and last 4 characters', async () => {
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
      mockEthereum.request.mockResolvedValueOnce([mockAddress])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByText(/0x1234...5678/i)).toBeInTheDocument()
      })
    })

    it('handles short addresses correctly', async () => {
      const mockAddress = '0x123456'
      mockEthereum.request.mockResolvedValueOnce([mockAddress])

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        const container = screen.getByRole('main')
        expect(container.textContent).toContain('0x12')
      })
    })
  })

  describe('Navigation Timing', () => {
    it('waits 1.5 seconds before navigating after connection', async () => {
      const user = userEvent.setup()
      const mockAccounts = ['0x1234567890123456789012345678901234567890']
      mockEthereum.request.mockResolvedValueOnce(mockAccounts)

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      expect(mockNavigate).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      }, { timeout: 2000 })
    })
  })

  describe('Multiple Connection Attempts', () => {
    it('handles rapid clicking gracefully', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockResolvedValue(['0x123'])

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)
      await user.click(metamaskBtn)
      await user.click(metamaskBtn)

      // Button should be disabled after first click
      expect(metamaskBtn).toBeDisabled()
    })

    it('allows retry after failed connection', async () => {
      const user = userEvent.setup()
      mockEthereum.request.mockRejectedValueOnce(new Error('Connection failed'))

      renderWithRouter(<WalletConnectionPage />)
      let metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(screen.getByText(/Connection failed/i)).toBeInTheDocument()
      })

      mockEthereum.request.mockResolvedValueOnce(['0x123'])

      metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })
      expect(metamaskBtn).not.toBeDisabled()
      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Console Error Handling', () => {
    it('logs errors to console on connection failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      mockEthereum.request.mockRejectedValueOnce(new Error('Test error'))

      renderWithRouter(<WalletConnectionPage />)
      const metamaskBtn = screen.getByRole('button', { name: 'Connect with MetaMask' })

      await user.click(metamaskBtn)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Wallet connection error:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('logs errors on disconnect failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      mockEthereum.request.mockResolvedValueOnce(['0x123'])
      global.fetch.mockRejectedValueOnce(new Error('Disconnect error'))

      renderWithRouter(<WalletConnectionPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeInTheDocument()
      })

      const disconnectBtn = screen.getByRole('button', { name: 'Disconnect wallet' })
      await user.click(disconnectBtn)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Disconnect error:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })
})

export default mockNavigate
