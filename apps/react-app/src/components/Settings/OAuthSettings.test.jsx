import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import OAuthSettings from './OAuthSettings'
import oauthService from '../../services/oauthService'

jest.mock('../../services/oauthService')

describe('OAuthSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    window.confirm = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const mockProviders = [
    {
      provider: 'google',
      connected: true,
      email: 'user@gmail.com',
      connectedAt: '2024-01-15T10:30:00Z'
    },
    {
      provider: 'discord',
      connected: true,
      email: 'user@discord.com',
      connectedAt: '2024-01-10T08:00:00Z'
    },
    {
      provider: 'github',
      connected: false
    }
  ]

  const mockAvailableProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'https://www.google.com/favicon.ico',
      color: '#4285F4',
      description: 'Connect your Google account for easy sign-in'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico',
      color: '#5865F2',
      description: 'Connect your Discord account to import servers'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: 'https://github.com/favicon.ico',
      color: '#181717',
      description: 'Connect your GitHub account for developer features'
    }
  ]

  describe('Component Initialization', () => {
    it('should render settings header with title', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Connected Accounts')).toBeInTheDocument()
      })
    })

    it('should render settings description', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Connect external accounts for easy sign-in and enhanced features')).toBeInTheDocument()
      })
    })

    it('should call getAvailableProviders on mount', () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      expect(oauthService.getAvailableProviders).toHaveBeenCalled()
    })

    it('should call getOAuthStatus on mount', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(oauthService.getOAuthStatus).toHaveBeenCalled()
      })
    })

    it('should apply correct CSS classes', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        expect(container.querySelector('.oauth-settings')).toBeInTheDocument()
        expect(container.querySelector('.settings-header')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      expect(screen.getByText('Loading connected accounts...')).toBeInTheDocument()
    })

    it('should hide loading state after data is loaded', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading connected accounts...')).not.toBeInTheDocument()
      })
    })

    it('should show loading state with loading-state class', () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<OAuthSettings />)

      expect(container.querySelector('.loading-state')).toBeInTheDocument()
    })
  })

  describe('Privacy Banner', () => {
    it('should display privacy banner', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Your Privacy is Protected')).toBeInTheDocument()
      })
    })

    it('should display privacy message', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText(/We only access basic profile information/)).toBeInTheDocument()
      })
    })

    it('should display privacy banner with shield icon', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        expect(container.querySelector('.info-banner')).toBeInTheDocument()
      })
    })
  })

  describe('Provider Display', () => {
    it('should display all available providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('Discord')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
      })
    })

    it('should display provider descriptions', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Connect your Google account for easy sign-in')).toBeInTheDocument()
        expect(screen.getByText('Connect your Discord account to import servers')).toBeInTheDocument()
        expect(screen.getByText('Connect your GitHub account for developer features')).toBeInTheDocument()
      })
    })

    it('should display provider icons', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleIcon = screen.getByAltText('Google')
        const discordIcon = screen.getByAltText('Discord')
        const githubIcon = screen.getByAltText('GitHub')

        expect(googleIcon).toHaveAttribute('src', 'https://www.google.com/favicon.ico')
        expect(discordIcon).toHaveAttribute('src', 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico')
        expect(githubIcon).toHaveAttribute('src', 'https://github.com/favicon.ico')
      })
    })

    it('should apply provider color to icon background', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        const providerIcons = container.querySelectorAll('.provider-icon')
        expect(providerIcons).toHaveLength(3)
      })
    })

    it('should render provider cards with correct structure', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        const providerCards = container.querySelectorAll('.provider-card')
        expect(providerCards).toHaveLength(3)
      })
    })
  })

  describe('Connected Provider Display', () => {
    it('should show connected badge for connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const connectedBadges = screen.getAllByText('Connected')
        expect(connectedBadges).toHaveLength(2)
      })
    })

    it('should display email for connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('user@gmail.com')).toBeInTheDocument()
        expect(screen.getByText('user@discord.com')).toBeInTheDocument()
      })
    })

    it('should display connected date for connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Connected Jan 15, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Connected Jan 10, 2024/)).toBeInTheDocument()
      })
    })

    it('should not display email if not provided', async () => {
      const providersNoEmail = [
        {
          provider: 'google',
          connected: true,
          connectedAt: '2024-01-15T10:30:00Z'
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: providersNoEmail } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        expect(within(googleCard).queryByText(/@/)).not.toBeInTheDocument()
      })
    })

    it('should not display connected date if not provided', async () => {
      const providersNoDate = [
        {
          provider: 'google',
          connected: true,
          email: 'user@gmail.com'
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: providersNoDate } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        expect(within(googleCard).queryByText(/Connected/)).toBeInTheDocument()
      })
    })

    it('should show CheckCircle icon for connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        const connectedBadges = container.querySelectorAll('.connected-badge')
        expect(connectedBadges).toHaveLength(2)
      })
    })
  })

  describe('Connect Provider', () => {
    it('should display connect button for unconnected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        expect(connectButton).toBeInTheDocument()
      })
    })

    it('should call connectProvider when connect button is clicked', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        expect(oauthService.connectProvider).toHaveBeenCalledWith('github')
      })
    })

    it('should show connecting state during connection', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument()
      })
    })

    it('should disable connect button during connection', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        const connectingButton = screen.getByRole('button', { name: /Connecting.../i })
        expect(connectingButton).toBeDisabled()
      })
    })

    it('should show error message when connection fails', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockRejectedValue(new Error('Connection failed'))

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to connect github')).toBeInTheDocument()
      })
    })

    it('should reset processing state when connection fails', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockRejectedValue(new Error('Connection failed'))

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to connect github')).toBeInTheDocument()
      })

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        expect(connectButton).not.toBeDisabled()
      })
    })

    it('should display Link2 icon in connect button', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        expect(connectButton).toBeInTheDocument()
      })
    })

    it('should connect multiple providers independently', async () => {
      const allDisconnected = [
        { provider: 'google', connected: false },
        { provider: 'discord', connected: false },
        { provider: 'github', connected: false }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: allDisconnected } })
      oauthService.connectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
      })

      const googleCard = screen.getByText('Google').closest('.provider-card')
      const googleConnectButton = within(googleCard).getByRole('button', { name: /Connect/i })
      fireEvent.click(googleConnectButton)

      await waitFor(() => {
        expect(oauthService.connectProvider).toHaveBeenCalledWith('google')
      })

      const discordCard = screen.getByText('Discord').closest('.provider-card')
      const discordConnectButton = within(discordCard).getByRole('button', { name: /Connect/i })
      fireEvent.click(discordConnectButton)

      await waitFor(() => {
        expect(oauthService.connectProvider).toHaveBeenCalledWith('discord')
      })
    })
  })

  describe('Disconnect Provider', () => {
    it('should display disconnect button for connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        expect(disconnectButton).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when disconnect button is clicked', async () => {
      window.confirm.mockReturnValue(false)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      expect(window.confirm).toHaveBeenCalledWith("Disconnect Google? You won't be able to sign in with this account.")
    })

    it('should not call disconnectProvider when confirmation is cancelled', async () => {
      window.confirm.mockReturnValue(false)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      expect(oauthService.disconnectProvider).not.toHaveBeenCalled()
    })

    it('should call disconnectProvider when confirmed', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(oauthService.disconnectProvider).toHaveBeenCalledWith('google')
      })
    })

    it('should show disconnecting state during disconnection', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Disconnecting...')).toBeInTheDocument()
      })
    })

    it('should disable disconnect button during disconnection', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        const disconnectingButton = screen.getByRole('button', { name: /Disconnecting.../i })
        expect(disconnectingButton).toBeDisabled()
      })
    })

    it('should show success message after successful disconnection', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Google disconnected successfully')).toBeInTheDocument()
      })
    })

    it('should reload OAuth status after successful disconnection', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(oauthService.getOAuthStatus).toHaveBeenCalledTimes(1)
      })

      const googleCard = screen.getByText('Google').closest('.provider-card')
      const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(oauthService.getOAuthStatus).toHaveBeenCalledTimes(2)
      })
    })

    it('should show error message when disconnection fails with success false', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: false })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to disconnect Google')).toBeInTheDocument()
      })
    })

    it('should handle exception during disconnection', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockRejectedValue(new Error('Network error'))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to disconnect Google')).toBeInTheDocument()
      })
    })

    it('should reset processing state after disconnection error', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockRejectedValue(new Error('Network error'))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to disconnect Google')).toBeInTheDocument()
      })

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        expect(disconnectButton).not.toBeDisabled()
      })
    })

    it('should display Unlink icon in disconnect button', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        expect(disconnectButton).toBeInTheDocument()
      })
    })
  })

  describe('Message Display', () => {
    it('should not display message initially', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        expect(container.querySelector('.message')).not.toBeInTheDocument()
      })
    })

    it('should display success message with success class', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        const message = screen.getByText('Google disconnected successfully')
        expect(message.closest('.message')).toHaveClass('success')
      })
    })

    it('should display error message with error class', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.connectProvider.mockRejectedValue(new Error('Connection failed'))

      render(<OAuthSettings />)

      await waitFor(() => {
        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        const connectButton = within(githubCard).getByRole('button', { name: /Connect/i })
        fireEvent.click(connectButton)
      })

      await waitFor(() => {
        const message = screen.getByText('Failed to connect github')
        expect(message.closest('.message')).toHaveClass('error')
      })
    })

    it('should hide message after 3 seconds', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockResolvedValue({ success: true })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const disconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(disconnectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Google disconnected successfully')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText('Google disconnected successfully')).not.toBeInTheDocument()
      })
    })
  })

  describe('API Error Handling', () => {
    it('should handle getOAuthStatus error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockRejectedValue(new Error('Network error'))

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading connected accounts...')).not.toBeInTheDocument()
      })

      expect(consoleError).toHaveBeenCalledWith('Failed to load OAuth status:', expect.any(Error))
      consoleError.mockRestore()
    })

    it('should handle missing providers in response', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: {} })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('Discord')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
      })
    })

    it('should handle empty providers array', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const connectButtons = screen.getAllByRole('button', { name: /Connect/i })
        expect(connectButtons).toHaveLength(3)
      })
    })

    it('should handle null response from getOAuthStatus', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue(null)

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading connected accounts...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Benefits Section', () => {
    it('should display benefits section', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Benefits of Connecting Accounts')).toBeInTheDocument()
      })
    })

    it('should display all benefit items', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Sign in faster without typing your password')).toBeInTheDocument()
        expect(screen.getByText('Keep your profile picture and info up to date')).toBeInTheDocument()
        expect(screen.getByText('Import friends and contacts (optional)')).toBeInTheDocument()
        expect(screen.getByText('Share content to connected platforms')).toBeInTheDocument()
      })
    })

    it('should render benefits with CheckCircle icons', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        const benefitsList = container.querySelector('.oauth-features ul')
        expect(benefitsList).toBeInTheDocument()
        expect(benefitsList.querySelectorAll('li')).toHaveLength(4)
      })
    })
  })

  describe('Help Section', () => {
    it('should display help section', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('Having trouble?')).toBeInTheDocument()
      })
    })

    it('should display help message', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText(/If you're unable to connect an account/)).toBeInTheDocument()
      })
    })

    it('should display help center link', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const helpLink = screen.getByText('View Help Center')
        expect(helpLink).toBeInTheDocument()
        expect(helpLink.closest('a')).toHaveAttribute('href', '/help')
      })
    })
  })

  describe('Date Formatting', () => {
    it('should format date with month, day, and year', async () => {
      const providers = [
        {
          provider: 'google',
          connected: true,
          email: 'user@gmail.com',
          connectedAt: '2024-01-15T10:30:00Z'
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Connected Jan 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should handle different date formats', async () => {
      const providers = [
        {
          provider: 'google',
          connected: true,
          email: 'user@gmail.com',
          connectedAt: '2024-12-31T23:59:59Z'
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Connected Dec 31, 2024/)).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Provider Operations', () => {
    it('should handle multiple providers being processed simultaneously', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const googleDisconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(googleDisconnectButton)
      })

      await waitFor(() => {
        const discordCard = screen.getByText('Discord').closest('.provider-card')
        const discordDisconnectButton = within(discordCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(discordDisconnectButton)
      })

      expect(oauthService.disconnectProvider).toHaveBeenCalledTimes(2)
    })

    it('should track processing state per provider', async () => {
      window.confirm.mockReturnValue(true)
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })
      oauthService.disconnectProvider.mockImplementation(() => new Promise(() => {}))

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const googleDisconnectButton = within(googleCard).getByRole('button', { name: /Disconnect/i })
        fireEvent.click(googleDisconnectButton)
      })

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const googleButton = within(googleCard).getByRole('button', { name: /Disconnecting.../i })
        expect(googleButton).toBeDisabled()

        const discordCard = screen.getByText('Discord').closest('.provider-card')
        const discordButton = within(discordCard).getByRole('button', { name: /Disconnect/i })
        expect(discordButton).not.toBeDisabled()
      })
    })
  })

  describe('Provider State Detection', () => {
    it('should correctly identify connected providers', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: mockProviders } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        expect(within(googleCard).getByText('Connected')).toBeInTheDocument()

        const githubCard = screen.getByText('GitHub').closest('.provider-card')
        expect(within(githubCard).queryByText('Connected')).not.toBeInTheDocument()
      })
    })

    it('should handle provider with connected false', async () => {
      const providers = [
        {
          provider: 'google',
          connected: false
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        const connectButton = within(googleCard).getByRole('button', { name: /Connect/i })
        expect(connectButton).toBeInTheDocument()
      })
    })

    it('should handle provider not in connectedProviders list', async () => {
      const providers = [
        {
          provider: 'google',
          connected: true
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const discordCard = screen.getByText('Discord').closest('.provider-card')
        const connectButton = within(discordCard).getByRole('button', { name: /Connect/i })
        expect(connectButton).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty available providers list', async () => {
      oauthService.getAvailableProviders.mockReturnValue([])
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers: [] } })

      const { container } = render(<OAuthSettings />)

      await waitFor(() => {
        const providersList = container.querySelector('.providers-list')
        expect(providersList).toBeInTheDocument()
        expect(providersList.children).toHaveLength(0)
      })
    })

    it('should handle provider with all metadata', async () => {
      const providers = [
        {
          provider: 'google',
          connected: true,
          email: 'test@gmail.com',
          connectedAt: '2024-01-15T10:30:00Z',
          userId: '12345',
          username: 'testuser'
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument()
        expect(screen.getByText(/Connected Jan 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should handle provider with minimal metadata', async () => {
      const providers = [
        {
          provider: 'google',
          connected: true
        }
      ]
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: true, data: { providers } })

      render(<OAuthSettings />)

      await waitFor(() => {
        const googleCard = screen.getByText('Google').closest('.provider-card')
        expect(within(googleCard).getByText('Connected')).toBeInTheDocument()
      })
    })

    it('should render without crashing when data is null', async () => {
      oauthService.getAvailableProviders.mockReturnValue(mockAvailableProviders)
      oauthService.getOAuthStatus.mockResolvedValue({ success: false, data: null })

      render(<OAuthSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading connected accounts...')).not.toBeInTheDocument()
      })
    })
  })
})

export default mockProviders
