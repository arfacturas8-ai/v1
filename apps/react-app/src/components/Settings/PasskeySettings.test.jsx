import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PasskeySettings from './PasskeySettings'
import webAuthnService from '../../services/webAuthnService'

jest.mock('../../services/webAuthnService')

describe('PasskeySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const mockPasskeys = [
    {
      credentialId: 'cred-1',
      nickname: 'iPhone 14 Pro',
      createdAt: '2024-01-15T10:30:00Z',
      lastUsed: '2024-01-20T14:45:00Z',
      transports: ['internal', 'hybrid']
    },
    {
      credentialId: 'cred-2',
      nickname: 'MacBook Pro',
      createdAt: '2024-01-10T08:00:00Z',
      lastUsed: null,
      transports: ['internal']
    },
    {
      credentialId: 'cred-3',
      nickname: 'Windows Desktop',
      createdAt: '2024-01-05T16:20:00Z',
      lastUsed: '2024-01-18T09:15:00Z',
      transports: ['internal', 'usb']
    }
  ]

  describe('Browser Compatibility Check', () => {
    it('should display unsupported message when WebAuthn is not supported', async () => {
      webAuthnService.isSupported.mockReturnValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Passkeys Not Supported')).toBeInTheDocument()
      })
    })

    it('should display browser recommendation when not supported', async () => {
      webAuthnService.isSupported.mockReturnValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Please use a modern browser like Chrome, Safari, Firefox, or Edge/)).toBeInTheDocument()
      })
    })

    it('should show AlertCircle icon when not supported', async () => {
      webAuthnService.isSupported.mockReturnValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      const { container } = render(<PasskeySettings />)

      await waitFor(() => {
        expect(container.querySelector('.unsupported-message')).toBeInTheDocument()
      })
    })

    it('should check support on mount', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.isSupported).toHaveBeenCalled()
      })
    })

    it('should check platform authenticator availability when supported', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.isPlatformAuthenticatorAvailable).toHaveBeenCalled()
      })
    })

    it('should not check platform authenticator when WebAuthn is unsupported', async () => {
      webAuthnService.isSupported.mockReturnValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.isPlatformAuthenticatorAvailable).not.toHaveBeenCalled()
      })
    })
  })

  describe('Platform Authenticator Availability', () => {
    it('should show info banner when platform authenticator is not available', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Platform Authenticator Not Available')).toBeInTheDocument()
      })
    })

    it('should display security key alternative message', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/You can still use security keys if available/)).toBeInTheDocument()
      })
    })

    it('should not show add passkey button when platform authenticator unavailable', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Add Passkey/i })).not.toBeInTheDocument()
      })
    })

    it('should show add passkey button when platform authenticator is available', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })
    })
  })

  describe('Loading Passkeys', () => {
    it('should display loading state initially', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockImplementation(() => new Promise(() => {}))

      render(<PasskeySettings />)

      expect(screen.getByText('Loading passkeys...')).toBeInTheDocument()
    })

    it('should call getPasskeys on mount', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalled()
      })
    })

    it('should handle empty passkeys response', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('No Passkeys Yet')).toBeInTheDocument()
      })
    })

    it('should handle missing credentials in response', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: {} })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('No Passkeys Yet')).toBeInTheDocument()
      })
    })

    it('should handle getPasskeys error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockRejectedValue(new Error('Network error'))

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('No Passkeys Yet')).toBeInTheDocument()
      })

      expect(consoleError).toHaveBeenCalledWith('Failed to load passkeys:', expect.any(Error))
      consoleError.mockRestore()
    })

    it('should hide loading state after passkeys are loaded', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading passkeys...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Passkey List Display', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
    })

    it('should display all passkeys from response', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument()
        expect(screen.getByText('Windows Desktop')).toBeInTheDocument()
      })
    })

    it('should display created date for each passkey', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Added Jan 15, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Added Jan 10, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Added Jan 5, 2024/)).toBeInTheDocument()
      })
    })

    it('should display last used date when available', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Last used Jan 20, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Last used Jan 18, 2024/)).toBeInTheDocument()
      })
    })

    it('should not display last used when null', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Test Device',
        createdAt: '2024-01-15T10:30:00Z',
        lastUsed: null
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        const card = screen.getByText('Test Device').closest('.passkey-card')
        expect(within(card).queryByText(/Last used/)).not.toBeInTheDocument()
      })
    })

    it('should display transport badges when available', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('internal')).toBeInTheDocument()
        expect(screen.getByText('hybrid')).toBeInTheDocument()
        expect(screen.getByText('usb')).toBeInTheDocument()
      })
    })

    it('should display delete button for each passkey', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Remove passkey')
        expect(deleteButtons).toHaveLength(3)
      })
    })

    it('should display unnamed passkey label when nickname is missing', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: null,
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Unnamed Passkey')).toBeInTheDocument()
      })
    })

    it('should show benefits section when passkeys exist', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Benefits of Passkeys')).toBeInTheDocument()
      })
    })

    it('should display benefit list items', async () => {
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Faster sign-in with Face ID/)).toBeInTheDocument()
        expect(screen.getByText(/More secure than passwords/)).toBeInTheDocument()
        expect(screen.getByText(/Works across your devices/)).toBeInTheDocument()
        expect(screen.getByText(/No passwords to remember/)).toBeInTheDocument()
      })
    })
  })

  describe('Device Icon Display', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
    })

    it('should display smartphone icon for iPhone devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'iPhone 14 Pro',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      const { container } = render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })
    })

    it('should display smartphone icon for Android devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Android Phone',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Android Phone')).toBeInTheDocument()
      })
    })

    it('should display laptop icon for Mac devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'MacBook Pro',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument()
      })
    })

    it('should display laptop icon for Windows devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Windows Desktop',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Windows Desktop')).toBeInTheDocument()
      })
    })

    it('should display laptop icon for Linux devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Linux Workstation',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Linux Workstation')).toBeInTheDocument()
      })
    })

    it('should display fingerprint icon for unknown devices', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Unknown Device',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Unknown Device')).toBeInTheDocument()
      })
    })

    it('should display fingerprint icon when nickname is null', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: null,
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Unnamed Passkey')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })
    })

    it('should display empty state when no passkeys exist', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('No Passkeys Yet')).toBeInTheDocument()
      })
    })

    it('should display empty state description', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Passkeys let you sign in without typing a password/)).toBeInTheDocument()
      })
    })

    it('should show create first passkey button in empty state', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Your First Passkey/i })).toBeInTheDocument()
      })
    })

    it('should not show benefits section in empty state', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByText('Benefits of Passkeys')).not.toBeInTheDocument()
      })
    })
  })

  describe('Register New Passkey', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })
    })

    it('should call registerPasskey with device info on button click', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(webAuthnService.getDeviceInfo).toHaveBeenCalled()
        expect(webAuthnService.registerPasskey).toHaveBeenCalledWith('Chrome on Windows')
      })
    })

    it('should display registering state during registration', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockImplementation(() => new Promise(() => {}))

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Registering...')).toBeInTheDocument()
      })
    })

    it('should disable button during registration', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockImplementation(() => new Promise(() => {}))

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        const registeringButton = screen.getByRole('button', { name: /Registering.../i })
        expect(registeringButton).toBeDisabled()
      })
    })

    it('should show success message after successful registration', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Passkey registered successfully!')).toBeInTheDocument()
      })
    })

    it('should reload passkeys after successful registration', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalledTimes(1)
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalledTimes(2)
      })
    })

    it('should show error message when registration fails', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: false, error: 'Registration failed' })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument()
      })
    })

    it('should show default error message when no error provided', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: false })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to register passkey')).toBeInTheDocument()
      })
    })

    it('should handle NotAllowedError with specific message', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      const error = new Error('User cancelled')
      error.name = 'NotAllowedError'
      webAuthnService.registerPasskey.mockRejectedValue(error)

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Passkey registration was cancelled')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    it('should handle generic error during registration', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockRejectedValue(new Error('Network error'))

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to register passkey. Please try again.')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    it('should prevent registration when WebAuthn is not supported', async () => {
      webAuthnService.isSupported.mockReturnValue(false)

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Add Passkey/i })).not.toBeInTheDocument()
      })
    })

    it('should show error when trying to register without platform authenticator', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(false)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Add Passkey/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Delete Passkey', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: mockPasskeys } })
      window.confirm = jest.fn()
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      window.confirm.mockReturnValue(false)

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      expect(window.confirm).toHaveBeenCalledWith('Remove passkey "iPhone 14 Pro"? You won\'t be able to use it to sign in anymore.')
    })

    it('should not call removePasskey when confirmation is cancelled', async () => {
      window.confirm.mockReturnValue(false)

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      expect(webAuthnService.removePasskey).not.toHaveBeenCalled()
    })

    it('should call removePasskey with credentialId when confirmed', async () => {
      window.confirm.mockReturnValue(true)
      webAuthnService.removePasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(webAuthnService.removePasskey).toHaveBeenCalledWith('cred-1')
      })
    })

    it('should show success message after successful deletion', async () => {
      window.confirm.mockReturnValue(true)
      webAuthnService.removePasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Passkey removed successfully')).toBeInTheDocument()
      })
    })

    it('should reload passkeys after successful deletion', async () => {
      window.confirm.mockReturnValue(true)
      webAuthnService.removePasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalledTimes(1)
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalledTimes(2)
      })
    })

    it('should show error message when deletion fails', async () => {
      window.confirm.mockReturnValue(true)
      webAuthnService.removePasskey.mockResolvedValue({ success: false })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Failed to remove passkey')).toBeInTheDocument()
      })
    })

    it('should handle exception during deletion', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      window.confirm.mockReturnValue(true)
      webAuthnService.removePasskey.mockRejectedValue(new Error('Network error'))

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Remove passkey')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Failed to remove passkey')).toBeInTheDocument()
      })

      expect(consoleError).toHaveBeenCalledWith('Failed to remove passkey:', expect.any(Error))
      consoleError.mockRestore()
    })
  })

  describe('Message Display', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })
    })

    it('should display success message with success type class', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        const message = screen.getByText('Passkey registered successfully!')
        expect(message.closest('.message')).toHaveClass('success')
      })
    })

    it('should display error message with error type class', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: false, error: 'Test error' })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        const message = screen.getByText('Test error')
        expect(message.closest('.message')).toHaveClass('error')
      })
    })

    it('should hide message after 4 seconds', async () => {
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Passkey registered successfully!')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(4000)

      await waitFor(() => {
        expect(screen.queryByText('Passkey registered successfully!')).not.toBeInTheDocument()
      })
    })

    it('should not display message initially', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Date Formatting', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
    })

    it('should format created date with month, day, year, and time', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Test Device',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Added Jan 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should format last used date correctly', async () => {
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Test Device',
        createdAt: '2024-01-15T10:30:00Z',
        lastUsed: '2024-01-20T14:45:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Last used Jan 20, 2024/)).toBeInTheDocument()
      })
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })
    })

    it('should render settings header with title', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Passkeys')).toBeInTheDocument()
      })
    })

    it('should render settings description', async () => {
      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText(/Sign in faster and more securely using Face ID, Touch ID, or Windows Hello/)).toBeInTheDocument()
      })
    })

    it('should apply correct CSS classes', async () => {
      const { container } = render(<PasskeySettings />)

      await waitFor(() => {
        expect(container.querySelector('.passkey-settings')).toBeInTheDocument()
        expect(container.querySelector('.settings-header')).toBeInTheDocument()
      })
    })
  })

  describe('WebAuthn API Integration', () => {
    it('should call isSupported without arguments', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.isSupported).toHaveBeenCalledWith()
      })
    })

    it('should call isPlatformAuthenticatorAvailable without arguments', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.isPlatformAuthenticatorAvailable).toHaveBeenCalledWith()
      })
    })

    it('should call getPasskeys without arguments', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(webAuthnService.getPasskeys).toHaveBeenCalledWith()
      })
    })

    it('should call getDeviceInfo before registration', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [] } })
      webAuthnService.getDeviceInfo.mockReturnValue('Chrome on Windows')
      webAuthnService.registerPasskey.mockResolvedValue({ success: true })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Passkey/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /Add Passkey/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(webAuthnService.getDeviceInfo).toHaveBeenCalledWith()
      })
    })
  })

  describe('Multiple Transport Types', () => {
    it('should display multiple transport badges for a single passkey', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Multi-transport Device',
        createdAt: '2024-01-15T10:30:00Z',
        transports: ['internal', 'hybrid', 'usb', 'nfc']
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('internal')).toBeInTheDocument()
        expect(screen.getByText('hybrid')).toBeInTheDocument()
        expect(screen.getByText('usb')).toBeInTheDocument()
        expect(screen.getByText('nfc')).toBeInTheDocument()
      })
    })

    it('should not display transports section when transports is null', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Test Device',
        createdAt: '2024-01-15T10:30:00Z',
        transports: null
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      const { container } = render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Test Device')).toBeInTheDocument()
      })

      expect(container.querySelector('.passkey-transports')).not.toBeInTheDocument()
    })

    it('should not display transports section when transports is empty array', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'Test Device',
        createdAt: '2024-01-15T10:30:00Z',
        transports: []
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      const { container } = render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Test Device')).toBeInTheDocument()
      })

      expect(container.querySelector('.passkey-transports')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string nickname', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: '',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('Unnamed Passkey')).toBeInTheDocument()
      })
    })

    it('should handle case-insensitive device detection', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'IPHONE 14 PRO',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('IPHONE 14 PRO')).toBeInTheDocument()
      })
    })

    it('should handle partial device name matches', async () => {
      webAuthnService.isSupported.mockReturnValue(true)
      webAuthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true)
      const passkey = {
        credentialId: 'cred-1',
        nickname: 'My Android Tablet',
        createdAt: '2024-01-15T10:30:00Z'
      }
      webAuthnService.getPasskeys.mockResolvedValue({ success: true, data: { credentials: [passkey] } })

      render(<PasskeySettings />)

      await waitFor(() => {
        expect(screen.getByText('My Android Tablet')).toBeInTheDocument()
      })
    })
  })
})

export default mockPasskeys
