import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import APIKeysSettings from './APIKeysSettings'
import apiKeysService from '../../services/apiKeysService'
import { useConfirmationDialog } from '../ui/modal'

jest.mock('../../services/apiKeysService')
jest.mock('../ui/modal')

describe('APIKeysSettings', () => {
  let mockConfirm
  let mockConfirmationDialog

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockConfirm = jest.fn()
    mockConfirmationDialog = <div data-testid="confirmation-dialog">Confirmation Dialog</div>

    useConfirmationDialog.mockReturnValue({
      confirm: mockConfirm,
      ConfirmationDialog: mockConfirmationDialog
    })

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const mockAPIKeys = [
    {
      id: 'key-1',
      name: 'Production API',
      key: 'cryb_test_1234567890abcdefghijklmnopqrstuvwxyz',
      scopes: ['read', 'write'],
      createdAt: '2024-01-15T10:30:00Z',
      lastUsed: '2024-01-20T14:45:00Z',
      expiresAt: '2024-04-15T10:30:00Z'
    },
    {
      id: 'key-2',
      name: 'Mobile App',
      key: 'cryb_test_abcdefghijklmnopqrstuvwxyz1234567890',
      scopes: ['read'],
      createdAt: '2024-01-10T08:00:00Z',
      lastUsed: null,
      expiresAt: null
    },
    {
      id: 'key-3',
      name: 'Analytics Bot',
      key: 'cryb_test_xyz123abc456def789ghi012jkl345mno678',
      scopes: ['read', 'analytics'],
      createdAt: '2024-01-05T16:20:00Z',
      lastUsed: '2024-01-18T09:15:00Z',
      expiresAt: '2024-07-05T16:20:00Z'
    }
  ]

  const mockAvailableScopes = [
    { id: 'read', name: 'Read', description: 'Read access to your data' },
    { id: 'write', name: 'Write', description: 'Write access to your data' },
    { id: 'analytics', name: 'Analytics', description: 'Access to analytics data' },
    { id: 'admin', name: 'Admin', description: 'Full administrative access' }
  ]

  describe('Initial Loading', () => {
    it('should display loading state initially', async () => {
      apiKeysService.getAPIKeys.mockImplementation(() => new Promise(() => {}))
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      expect(screen.getByText('Loading API keys...')).toBeInTheDocument()
    })

    it('should call getAPIKeys on mount', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(apiKeysService.getAPIKeys).toHaveBeenCalled()
      })
    })

    it('should hide loading state after keys are loaded', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Loading API keys...')).not.toBeInTheDocument()
      })
    })

    it('should handle getAPIKeys error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      apiKeysService.getAPIKeys.mockRejectedValue(new Error('Network error'))
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      expect(consoleError).toHaveBeenCalledWith('Failed to load API keys:', expect.any(Error))
      consoleError.mockRestore()
    })

    it('should handle empty items in response', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })
    })

    it('should handle missing items in response', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: {} })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })
    })
  })

  describe('API Keys List Display', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should display all API keys from response', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
        expect(screen.getByText('Mobile App')).toBeInTheDocument()
        expect(screen.getByText('Analytics Bot')).toBeInTheDocument()
      })
    })

    it('should display masked API key by default', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('cryb_tes...wxyz')).toBeInTheDocument()
      })
    })

    it('should display key ID for each API key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText(/ID: key-1/)).toBeInTheDocument()
        expect(screen.getByText(/ID: key-2/)).toBeInTheDocument()
        expect(screen.getByText(/ID: key-3/)).toBeInTheDocument()
      })
    })

    it('should display last used date when available', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Last used Jan 20, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Last used Jan 18, 2024/)).toBeInTheDocument()
      })
    })

    it('should not display last used when null', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[1]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        const card = screen.getByText('Mobile App').closest('.api-key-card')
        expect(within(card).queryByText(/Last used/)).not.toBeInTheDocument()
      })
    })

    it('should display permissions for each key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('read')).toBeInTheDocument()
        expect(screen.getByText('write')).toBeInTheDocument()
      })
    })

    it('should display expiration date when available', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Expires Apr 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should not display expiration when null', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[1]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        const card = screen.getByText('Mobile App').closest('.api-key-card')
        expect(within(card).queryByText(/Expires/)).not.toBeInTheDocument()
      })
    })

    it('should display revoke button for each key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        const revokeButtons = screen.getAllByTitle('Revoke key')
        expect(revokeButtons).toHaveLength(3)
      })
    })

    it('should display eye icon for each key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        const eyeButtons = screen.getAllByTitle('Show key')
        expect(eyeButtons).toHaveLength(3)
      })
    })

    it('should display copy button for each key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        const copyButtons = screen.getAllByTitle('Copy to clipboard')
        expect(copyButtons).toHaveLength(3)
      })
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should display empty state when no API keys exist', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })
    })

    it('should display empty state description', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Create your first API key to start using the CRYB API')).toBeInTheDocument()
      })
    })

    it('should show create button in empty state', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        const emptyStateButtons = screen.getAllByRole('button', { name: /Create API Key/i })
        expect(emptyStateButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Key Visibility Toggle', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should show full key when eye icon is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('cryb_tes...wxyz')).toBeInTheDocument()
      })

      const eyeButton = screen.getByTitle('Show key')
      fireEvent.click(eyeButton)

      expect(screen.getByText('cryb_test_1234567890abcdefghijklmnopqrstuvwxyz')).toBeInTheDocument()
    })

    it('should hide key when eye-off icon is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('cryb_tes...wxyz')).toBeInTheDocument()
      })

      const showButton = screen.getByTitle('Show key')
      fireEvent.click(showButton)

      expect(screen.getByText('cryb_test_1234567890abcdefghijklmnopqrstuvwxyz')).toBeInTheDocument()

      const hideButton = screen.getByTitle('Hide key')
      fireEvent.click(hideButton)

      expect(screen.getByText('cryb_tes...wxyz')).toBeInTheDocument()
    })

    it('should toggle visibility independently for each key', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const eyeButtons = screen.getAllByTitle('Show key')
      fireEvent.click(eyeButtons[0])

      expect(screen.getByText('cryb_test_1234567890abcdefghijklmnopqrstuvwxyz')).toBeInTheDocument()
      expect(screen.getByText('cryb_tes...7890')).toBeInTheDocument()
    })
  })

  describe('Copy to Clipboard', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
      navigator.clipboard.writeText.mockResolvedValue()
    })

    it('should copy key to clipboard when copy button is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('cryb_test_1234567890abcdefghijklmnopqrstuvwxyz')
      })
    })

    it('should show success message after copying', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
      })
    })

    it('should handle clipboard copy error', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'))

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to copy')).toBeInTheDocument()
      })
    })
  })

  describe('Create API Key Modal', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should open modal when Create API Key button is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      expect(screen.getByText('Create API Key')).toBeInTheDocument()
    })

    it('should close modal when close button is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(screen.queryByText('Create API Key')).not.toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByText('Create API Key')).not.toBeInTheDocument()
    })

    it('should close modal when clicking overlay', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const overlay = document.querySelector('.modal-overlay')
      fireEvent.click(overlay)

      expect(screen.queryByText('Create API Key')).not.toBeInTheDocument()
    })

    it('should not close modal when clicking modal content', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const modalContent = document.querySelector('.modal-content')
      fireEvent.click(modalContent)

      expect(screen.getByText('Create API Key')).toBeInTheDocument()
    })

    it('should display all available scopes', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      expect(screen.getByText('Read')).toBeInTheDocument()
      expect(screen.getByText('Write')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should display scope descriptions', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      expect(screen.getByText('Read access to your data')).toBeInTheDocument()
      expect(screen.getByText('Write access to your data')).toBeInTheDocument()
    })

    it('should display expiration options', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const select = screen.getByDisplayValue('90 days')
      expect(select).toBeInTheDocument()
    })
  })

  describe('Key Name Input', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should update key name when typing', async () => {
      const user = userEvent.setup({ delay: null })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'Test API Key')

      expect(input).toHaveValue('Test API Key')
    })

    it('should display placeholder text', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      expect(screen.getByPlaceholderText(/Production API, Mobile App/i)).toBeInTheDocument()
    })

    it('should show error when name is empty', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a name for the API key')).toBeInTheDocument()
      })
    })

    it('should show error when name is whitespace only', async () => {
      const user = userEvent.setup({ delay: null })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, '   ')

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a name for the API key')).toBeInTheDocument()
      })
    })
  })

  describe('Permissions Selection', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should check scope when checkbox is clicked', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      expect(readCheckbox).toBeChecked()
    })

    it('should uncheck scope when clicked again', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)
      expect(readCheckbox).toBeChecked()

      fireEvent.click(readCheckbox)
      expect(readCheckbox).not.toBeChecked()
    })

    it('should allow selecting multiple scopes', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      const writeCheckbox = screen.getByRole('checkbox', { name: /Write/i })

      fireEvent.click(readCheckbox)
      fireEvent.click(writeCheckbox)

      expect(readCheckbox).toBeChecked()
      expect(writeCheckbox).toBeChecked()
    })

    it('should show error when no scopes selected', async () => {
      const user = userEvent.setup({ delay: null })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'Test Key')

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('Please select at least one permission scope')).toBeInTheDocument()
      })
    })
  })

  describe('Expiration Date Selection', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should default to 90 days', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const select = screen.getByDisplayValue('90 days')
      expect(select).toBeInTheDocument()
    })

    it('should change expiration when option is selected', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const select = screen.getByDisplayValue('90 days')
      fireEvent.change(select, { target: { value: '30' } })

      expect(select).toHaveValue('30')
    })

    it('should support never expire option', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const select = screen.getByDisplayValue('90 days')
      fireEvent.change(select, { target: { value: '' } })

      expect(select).toHaveValue('')
    })

    it('should display all expiration options', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      expect(screen.getByText('30 days')).toBeInTheDocument()
      expect(screen.getByText('90 days')).toBeInTheDocument()
      expect(screen.getByText('180 days')).toBeInTheDocument()
      expect(screen.getByText('1 year')).toBeInTheDocument()
      expect(screen.getByText('Never expire')).toBeInTheDocument()
    })
  })

  describe('Create API Key Submission', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should call createAPIKey with correct parameters', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const select = screen.getByDisplayValue('90 days')
      fireEvent.change(select, { target: { value: '30' } })

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(apiKeysService.createAPIKey).toHaveBeenCalledWith('New API Key', ['read'], 30)
      })
    })

    it('should show success message after creating key', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('API key created successfully!')).toBeInTheDocument()
      })
    })

    it('should display created key', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('cryb_new_key_12345')).toBeInTheDocument()
      })
    })

    it('should reload API keys after creation', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(apiKeysService.getAPIKeys).toHaveBeenCalledTimes(1)
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(apiKeysService.getAPIKeys).toHaveBeenCalledTimes(2)
      })
    })

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('cryb_new_key_12345')).toBeInTheDocument()
      })

      const doneButton = screen.getByRole('button', { name: /Done/i })
      fireEvent.click(doneButton)

      await waitFor(() => {
        expect(screen.queryByText('cryb_new_key_12345')).not.toBeInTheDocument()
      })
    })

    it('should show error message when creation fails', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockRejectedValue(new Error('Failed to create'))

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create API key')).toBeInTheDocument()
      })
    })

    it('should handle never expire option correctly', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const select = screen.getByDisplayValue('90 days')
      fireEvent.change(select, { target: { value: '' } })

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(apiKeysService.createAPIKey).toHaveBeenCalledWith('New API Key', ['read'], null)
      })
    })
  })

  describe('Created Key Display', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should show success modal after key creation', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('API Key Created!')).toBeInTheDocument()
      })
    })

    it('should display warning message about copying key', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText(/Copy your API key now/)).toBeInTheDocument()
      })
    })

    it('should show API documentation link', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('View API Documentation →')).toBeInTheDocument()
      })
    })

    it('should show authorization header example', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText(/Authorization: Bearer cryb_new_key_12345/)).toBeInTheDocument()
      })
    })

    it('should allow copying created key', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })
      navigator.clipboard.writeText.mockResolvedValue()

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('API Key Created!')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /Copy/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('cryb_new_key_12345')
      })
    })

    it('should not close modal when clicking overlay with created key', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('API Key Created!')).toBeInTheDocument()
      })

      const overlay = document.querySelector('.modal-overlay')
      fireEvent.click(overlay)

      expect(screen.getByText('API Key Created!')).toBeInTheDocument()
    })

    it('should close success modal when done button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      apiKeysService.createAPIKey.mockResolvedValue({
        success: true,
        data: { key: 'cryb_new_key_12345' }
      })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const input = screen.getByPlaceholderText(/Production API, Mobile App/i)
      await user.type(input, 'New API Key')

      const readCheckbox = screen.getByRole('checkbox', { name: /Read/i })
      fireEvent.click(readCheckbox)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        expect(screen.getByText('API Key Created!')).toBeInTheDocument()
      })

      const doneButton = screen.getByRole('button', { name: /Done/i })
      fireEvent.click(doneButton)

      expect(screen.queryByText('API Key Created!')).not.toBeInTheDocument()
    })
  })

  describe('Revoke API Key', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should show confirmation dialog when revoke button is clicked', async () => {
      mockConfirm.mockResolvedValue(false)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith({
          type: 'error',
          title: 'Revoke API Key',
          description: 'Are you sure you want to revoke "Production API"? This action cannot be undone and will immediately invalidate the key.',
          confirmText: 'Revoke',
          confirmVariant: 'destructive'
        })
      })
    })

    it('should not revoke when confirmation is cancelled', async () => {
      mockConfirm.mockResolvedValue(false)

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled()
      })

      expect(apiKeysService.revokeAPIKey).not.toHaveBeenCalled()
    })

    it('should call revokeAPIKey when confirmed', async () => {
      mockConfirm.mockResolvedValue(true)
      apiKeysService.revokeAPIKey.mockResolvedValue({ success: true })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(apiKeysService.revokeAPIKey).toHaveBeenCalledWith('key-1')
      })
    })

    it('should show success message after revoking', async () => {
      mockConfirm.mockResolvedValue(true)
      apiKeysService.revokeAPIKey.mockResolvedValue({ success: true })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('API key revoked successfully')).toBeInTheDocument()
      })
    })

    it('should reload API keys after successful revocation', async () => {
      mockConfirm.mockResolvedValue(true)
      apiKeysService.revokeAPIKey.mockResolvedValue({ success: true })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(apiKeysService.getAPIKeys).toHaveBeenCalledTimes(1)
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(apiKeysService.getAPIKeys).toHaveBeenCalledTimes(2)
      })
    })

    it('should show error message when revocation fails', async () => {
      mockConfirm.mockResolvedValue(true)
      apiKeysService.revokeAPIKey.mockRejectedValue(new Error('Revocation failed'))

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const revokeButtons = screen.getAllByTitle('Revoke key')
      fireEvent.click(revokeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Failed to revoke API key')).toBeInTheDocument()
      })
    })
  })

  describe('Message Display', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should display success message with success class', async () => {
      navigator.clipboard.writeText.mockResolvedValue()
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        const message = screen.getByText('Copied to clipboard!')
        expect(message.closest('.message')).toHaveClass('success')
      })
    })

    it('should display error message with error class', async () => {
      const user = userEvent.setup({ delay: null })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('No API Keys')).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /Create API Key/i })[0]
      fireEvent.click(createButton)

      const createKeyButton = screen.getByRole('button', { name: /^Create Key$/i })
      fireEvent.click(createKeyButton)

      await waitFor(() => {
        const message = screen.getByText('Please enter a name for the API key')
        expect(message.closest('.message')).toHaveClass('error')
      })
    })

    it('should hide message after 3 seconds', async () => {
      navigator.clipboard.writeText.mockResolvedValue()
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument()
      })
    })

    it('should not display message initially', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Date Formatting', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should format last used date correctly', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Last used Jan 20, 2024/)).toBeInTheDocument()
      })
    })

    it('should format expiration date correctly', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText(/Expires Apr 15, 2024/)).toBeInTheDocument()
      })
    })
  })

  describe('Key Masking', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should mask key showing first 8 and last 4 characters', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('cryb_tes...wxyz')).toBeInTheDocument()
      })
    })

    it('should handle empty key', async () => {
      const keyWithEmptyValue = { ...mockAPIKeys[0], key: '' }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithEmptyValue] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })
    })

    it('should handle null key', async () => {
      const keyWithNullValue = { ...mockAPIKeys[0], key: null }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithNullValue] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should render settings header with title', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('API Keys')).toBeInTheDocument()
      })
    })

    it('should render settings description', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Manage API keys for programmatic access to your CRYB account')).toBeInTheDocument()
      })
    })

    it('should apply correct CSS classes', async () => {
      const { container } = render(<APIKeysSettings />)

      await waitFor(() => {
        expect(container.querySelector('.api-keys-settings')).toBeInTheDocument()
        expect(container.querySelector('.settings-header')).toBeInTheDocument()
      })
    })

    it('should render confirmation dialog component', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      })
    })

    it('should render create API key button in header', async () => {
      render(<APIKeysSettings />)

      await waitFor(() => {
        const headerButtons = screen.getAllByRole('button', { name: /Create API Key/i })
        expect(headerButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('API Service Integration', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should call getAvailableScopes on render', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(apiKeysService.getAvailableScopes).toHaveBeenCalled()
      })
    })

    it('should handle successful API response', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })
    })

    it('should handle API response without success flag', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ data: { items: mockAPIKeys } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.queryByText('Production API')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should handle missing scopes array', async () => {
      const keyWithoutScopes = { ...mockAPIKeys[0], scopes: null }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithoutScopes] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })
    })

    it('should handle empty scopes array', async () => {
      const keyWithEmptyScopes = { ...mockAPIKeys[0], scopes: [] }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithEmptyScopes] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })
    })

    it('should handle very long key names', async () => {
      const keyWithLongName = { ...mockAPIKeys[0], name: 'A'.repeat(100) }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithLongName] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
      })
    })

    it('should handle special characters in key names', async () => {
      const keyWithSpecialChars = { ...mockAPIKeys[0], name: 'API Key <>&"\'/' }
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [keyWithSpecialChars] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('API Key <>&"\'/')) .toBeInTheDocument()
      })
    })

    it('should handle multiple rapid clicks on visibility toggle', async () => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const eyeButton = screen.getByTitle('Show key')
      fireEvent.click(eyeButton)
      fireEvent.click(screen.getByTitle('Hide key'))
      fireEvent.click(screen.getByTitle('Show key'))

      expect(screen.getByText('cryb_test_1234567890abcdefghijklmnopqrstuvwxyz')).toBeInTheDocument()
    })
  })

  describe('Clipboard Error Handling', () => {
    beforeEach(() => {
      apiKeysService.getAPIKeys.mockResolvedValue({ success: true, data: { items: [mockAPIKeys[0]] } })
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should handle clipboard permission denied', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Permission denied'))

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to copy')).toBeInTheDocument()
      })
    })

    it('should handle missing clipboard API', async () => {
      const originalClipboard = navigator.clipboard
      delete navigator.clipboard

      render(<APIKeysSettings />)

      await waitFor(() => {
        expect(screen.getByText('Production API')).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to copy')).toBeInTheDocument()
      })

      navigator.clipboard = originalClipboard
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      apiKeysService.getAvailableScopes.mockReturnValue(mockAvailableScopes)
    })

    it('should show loading state during initial load', async () => {
      apiKeysService.getAPIKeys.mockImplementation(() => new Promise(() => {}))

      render(<APIKeysSettings />)

      expect(screen.getByText('Loading API keys...')).toBeInTheDocument()
    })

    it('should show loading state with correct class', async () => {
      apiKeysService.getAPIKeys.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<APIKeysSettings />)

      expect(container.querySelector('.loading-state')).toBeInTheDocument()
    })
  })
})

export default mockAPIKeys
