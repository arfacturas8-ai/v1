/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'
import { mockUser, mockFetch, resetAllMocks } from '../../__test__/utils/testUtils'

describe('Settings Component', () => {
  const defaultProps = {
    user: mockUser({
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio'
    }),
    onClose: jest.fn(),
    onLogout: jest.fn(),
    theme: 'dark',
    setTheme: jest.fn()
  }

  let localStorageMock

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    global.localStorage = localStorageMock
    global.fetch = jest.fn()
  })

  afterEach(() => {
    resetAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('renders settings sidebar with all sections', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByText('Voice & Audio')).toBeInTheDocument()
      expect(screen.getByText('Keybinds')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<Settings {...defaultProps} />)
      const closeButton = screen.getByRole('button', { name: /close/i }) || document.querySelector('.close-settings')
      expect(closeButton).toBeInTheDocument()
    })

    it('renders logout button', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Log Out')).toBeInTheDocument()
    })

    it('renders account section by default', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Account Settings')).toBeInTheDocument()
    })
  })

  describe('Settings Navigation', () => {
    it('switches to notifications section when clicked', async () => {
      render(<Settings {...defaultProps} />)
      const notificationsButton = screen.getByText('Notifications')
      await userEvent.click(notificationsButton)
      expect(screen.getByText('Notification Settings')).toBeInTheDocument()
    })

    it('switches to privacy section when clicked', async () => {
      render(<Settings {...defaultProps} />)
      const privacyButton = screen.getByText('Privacy & Security')
      await userEvent.click(privacyButton)
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument()
    })

    it('switches to appearance section when clicked', async () => {
      render(<Settings {...defaultProps} />)
      const appearanceButton = screen.getByText('Appearance')
      await userEvent.click(appearanceButton)
      expect(screen.getByText('Appearance')).toBeInTheDocument()
    })

    it('switches to audio section when clicked', async () => {
      render(<Settings {...defaultProps} />)
      const audioButton = screen.getByText('Voice & Audio')
      await userEvent.click(audioButton)
      expect(screen.getByText('Voice & Audio')).toBeInTheDocument()
    })

    it('switches to keybinds section when clicked', async () => {
      render(<Settings {...defaultProps} />)
      const keybindsButton = screen.getByText('Keybinds')
      await userEvent.click(keybindsButton)
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    })

    it('highlights active section', async () => {
      render(<Settings {...defaultProps} />)
      const accountButton = screen.getByText('Account').closest('button')
      expect(accountButton).toHaveClass('active')
    })

    it('updates active section on navigation', async () => {
      render(<Settings {...defaultProps} />)
      const notificationsButton = screen.getByText('Notifications').closest('button')
      await userEvent.click(notificationsButton)
      expect(notificationsButton).toHaveClass('active')
    })
  })

  describe('Account Settings', () => {
    it('displays user email', () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      expect(emailInput).toBeInTheDocument()
    })

    it('displays user username', () => {
      render(<Settings {...defaultProps} />)
      const usernameInput = screen.getByDisplayValue('testuser')
      expect(usernameInput).toBeInTheDocument()
    })

    it('displays user display name', () => {
      render(<Settings {...defaultProps} />)
      const displayNameInput = screen.getByDisplayValue('Test User')
      expect(displayNameInput).toBeInTheDocument()
    })

    it('displays user bio', () => {
      render(<Settings {...defaultProps} />)
      const bioInput = screen.getByDisplayValue('Test bio')
      expect(bioInput).toBeInTheDocument()
    })

    it('allows editing email', async () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'newemail@example.com')
      expect(emailInput).toHaveValue('newemail@example.com')
    })

    it('allows editing username', async () => {
      render(<Settings {...defaultProps} />)
      const usernameInput = screen.getByDisplayValue('testuser')
      await userEvent.clear(usernameInput)
      await userEvent.type(usernameInput, 'newusername')
      expect(usernameInput).toHaveValue('newusername')
    })

    it('allows editing display name', async () => {
      render(<Settings {...defaultProps} />)
      const displayNameInput = screen.getByDisplayValue('Test User')
      await userEvent.clear(displayNameInput)
      await userEvent.type(displayNameInput, 'New Name')
      expect(displayNameInput).toHaveValue('New Name')
    })

    it('allows editing bio', async () => {
      render(<Settings {...defaultProps} />)
      const bioInput = screen.getByDisplayValue('Test bio')
      await userEvent.clear(bioInput)
      await userEvent.type(bioInput, 'New bio text')
      expect(bioInput).toHaveValue('New bio text')
    })

    it('shows verified badge when email is verified', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('renders change password button', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Change Password')).toBeInTheDocument()
    })

    it('renders delete account button', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Delete Account')).toBeInTheDocument()
    })

    it('shows two-factor authentication option', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    })
  })

  describe('Notification Settings', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const notificationsButton = screen.getByText('Notifications')
      await userEvent.click(notificationsButton)
    })

    it('displays email notifications toggle', () => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    })

    it('displays push notifications toggle', () => {
      expect(screen.getByText('Push Notifications')).toBeInTheDocument()
    })

    it('displays direct messages toggle', () => {
      expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    })

    it('displays mentions toggle', () => {
      expect(screen.getByText('@mentions')).toBeInTheDocument()
    })

    it('displays replies toggle', () => {
      expect(screen.getByText('Replies to your posts')).toBeInTheDocument()
    })

    it('displays new followers toggle', () => {
      expect(screen.getByText('New followers')).toBeInTheDocument()
    })

    it('toggles email notifications', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /email notifications/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })

    it('toggles push notifications', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /push notifications/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })

    it('toggles direct messages', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /direct messages/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })
  })

  describe('Privacy Settings', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const privacyButton = screen.getByText('Privacy & Security')
      await userEvent.click(privacyButton)
    })

    it('displays profile visibility dropdown', () => {
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
      const select = screen.getByRole('combobox', { name: /profile visibility/i })
      expect(select).toBeInTheDocument()
    })

    it('allows changing profile visibility', async () => {
      const select = screen.getByRole('combobox', { name: /profile visibility/i })
      await userEvent.selectOptions(select, 'private')
      expect(select).toHaveValue('private')
    })

    it('displays show online status toggle', () => {
      expect(screen.getByText('Show Online Status')).toBeInTheDocument()
    })

    it('displays show activity toggle', () => {
      expect(screen.getByText('Show Activity')).toBeInTheDocument()
    })

    it('displays direct message settings', () => {
      expect(screen.getByText('Who can send you direct messages?')).toBeInTheDocument()
    })

    it('allows changing direct message permissions', async () => {
      const select = screen.getByRole('combobox', { name: /who can send you direct messages/i })
      await userEvent.selectOptions(select, 'friends')
      expect(select).toHaveValue('friends')
    })

    it('displays allow indexing toggle', () => {
      expect(screen.getByText('Allow Search Engine Indexing')).toBeInTheDocument()
    })

    it('displays data collection toggle', () => {
      expect(screen.getByText('Analytics & Improvement')).toBeInTheDocument()
    })

    it('toggles show online status', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /show online status/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })
  })

  describe('Appearance Settings', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const appearanceButton = screen.getByText('Appearance')
      await userEvent.click(appearanceButton)
    })

    it('displays theme options', () => {
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('Auto')).toBeInTheDocument()
    })

    it('shows dark theme as selected by default', () => {
      const darkRadio = screen.getByRole('radio', { name: /dark/i })
      expect(darkRadio).toBeChecked()
    })

    it('allows changing theme to light', async () => {
      const lightRadio = screen.getByRole('radio', { name: /light/i })
      await userEvent.click(lightRadio)
      expect(lightRadio).toBeChecked()
    })

    it('allows changing theme to auto', async () => {
      const autoRadio = screen.getByRole('radio', { name: /auto/i })
      await userEvent.click(autoRadio)
      expect(autoRadio).toBeChecked()
    })

    it('displays font size dropdown', () => {
      expect(screen.getByText('Font Size')).toBeInTheDocument()
    })

    it('allows changing font size', async () => {
      const select = screen.getByRole('combobox', { name: /font size/i })
      await userEvent.selectOptions(select, 'large')
      expect(select).toHaveValue('large')
    })

    it('displays compact mode toggle', () => {
      expect(screen.getByText('Compact Mode')).toBeInTheDocument()
    })

    it('displays animations toggle', () => {
      expect(screen.getByText('Animations')).toBeInTheDocument()
    })

    it('displays color blind mode toggle', () => {
      expect(screen.getByText('Color Blind Mode')).toBeInTheDocument()
    })

    it('displays high contrast toggle', () => {
      expect(screen.getByText('High Contrast')).toBeInTheDocument()
    })

    it('toggles compact mode', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /compact mode/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })

    it('toggles animations', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /animations/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })
  })

  describe('Audio Settings', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const audioButton = screen.getByText('Voice & Audio')
      await userEvent.click(audioButton)
    })

    it('displays microphone dropdown', () => {
      expect(screen.getByText('Microphone')).toBeInTheDocument()
    })

    it('displays input volume slider', () => {
      expect(screen.getByText('Input Volume')).toBeInTheDocument()
      const slider = screen.getByRole('slider', { name: /input volume/i })
      expect(slider).toBeInTheDocument()
    })

    it('displays output device dropdown', () => {
      expect(screen.getByText('Speakers/Headphones')).toBeInTheDocument()
    })

    it('displays output volume slider', () => {
      expect(screen.getByText('Output Volume')).toBeInTheDocument()
      const slider = screen.getByRole('slider', { name: /output volume/i })
      expect(slider).toBeInTheDocument()
    })

    it('allows changing input volume', async () => {
      const slider = screen.getByRole('slider', { name: /input volume/i })
      fireEvent.change(slider, { target: { value: '50' } })
      expect(slider).toHaveValue('50')
    })

    it('allows changing output volume', async () => {
      const slider = screen.getByRole('slider', { name: /output volume/i })
      fireEvent.change(slider, { target: { value: '75' } })
      expect(slider).toHaveValue('75')
    })

    it('displays noise suppression toggle', () => {
      expect(screen.getByText('Noise Suppression')).toBeInTheDocument()
    })

    it('displays echo cancellation toggle', () => {
      expect(screen.getByText('Echo Cancellation')).toBeInTheDocument()
    })

    it('displays automatic gain control toggle', () => {
      expect(screen.getByText('Automatic Gain Control')).toBeInTheDocument()
    })

    it('toggles noise suppression', async () => {
      const checkbox = screen.getByRole('checkbox', { name: /noise suppression/i })
      const initialChecked = checkbox.checked
      await userEvent.click(checkbox)
      expect(checkbox.checked).toBe(!initialChecked)
    })

    it('renders test microphone button', () => {
      expect(screen.getByText('Test Microphone')).toBeInTheDocument()
    })
  })

  describe('Keybinds Settings', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const keybindsButton = screen.getByText('Keybinds')
      await userEvent.click(keybindsButton)
    })

    it('displays toggle mute keybind', () => {
      expect(screen.getByText('Toggle Mute')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ctrl+M')).toBeInTheDocument()
    })

    it('displays toggle deafen keybind', () => {
      expect(screen.getByText('Toggle Deafen')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ctrl+D')).toBeInTheDocument()
    })

    it('displays toggle video keybind', () => {
      expect(screen.getByText('Toggle Video')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ctrl+Shift+V')).toBeInTheDocument()
    })

    it('displays quick switcher keybind', () => {
      expect(screen.getByText('Quick Switcher')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ctrl+K')).toBeInTheDocument()
    })

    it('displays open settings keybind', () => {
      expect(screen.getByText('Open Settings')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ctrl+,')).toBeInTheDocument()
    })

    it('renders change buttons for keybinds', () => {
      const changeButtons = screen.getAllByText('Change')
      expect(changeButtons.length).toBeGreaterThan(0)
    })

    it('renders reset to defaults button', () => {
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument()
    })
  })

  describe('Save Changes', () => {
    it('shows unsaved changes bar when settings are modified', async () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
      })
    })

    it('shows save button when there are unsaved changes', async () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })
    })

    it('shows reset button when there are unsaved changes', async () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument()
      })
    })

    it('hides unsaved changes bar on reset', async () => {
      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
      })

      const resetButton = screen.getByText('Reset')
      await userEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('loads settings from API on mount', async () => {
      const mockSettings = {
        data: {
          account: { email: 'api@example.com' }
        }
      }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings
      })

      render(<Settings {...defaultProps} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/settings'),
          expect.objectContaining({
            credentials: 'include'
          })
        )
      })
    })

    it('saves settings to API when save button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/settings'),
          expect.objectContaining({
            method: 'PUT',
            credentials: 'include'
          })
        )
      })
    })

    it('saves to localStorage when API call succeeds', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'userSettings',
          expect.any(String)
        )
      })
    })

    it('saves to localStorage as fallback when API call fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'userSettings',
          expect.any(String)
        )
      })
    })

    it('loads cached settings from localStorage on mount', async () => {
      const cachedSettings = JSON.stringify({
        account: { email: 'cached@example.com' }
      })
      localStorageMock.getItem.mockReturnValue(cachedSettings)

      render(<Settings {...defaultProps} />)

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('userSettings')
      })
    })

    it('applies theme after successful save', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<Settings {...defaultProps} />)

      const appearanceButton = screen.getByText('Appearance')
      await userEvent.click(appearanceButton)

      const lightRadio = screen.getByRole('radio', { name: /light/i })
      await userEvent.click(lightRadio)

      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(defaultProps.setTheme).toHaveBeenCalledWith('light')
      })
    })
  })

  describe('Loading States', () => {
    it('handles API loading state', async () => {
      let resolvePromise
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch.mockReturnValue(promise)

      render(<Settings {...defaultProps} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      resolvePromise({
        ok: true,
        json: async () => ({ data: {} })
      })
    })

    it('continues rendering when API call is pending', async () => {
      global.fetch.mockReturnValue(new Promise(() => {}))

      render(<Settings {...defaultProps} />)

      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Account')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('API Error'))

      render(<Settings {...defaultProps} />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      expect(screen.getByText('Settings')).toBeInTheDocument()
      consoleErrorSpy.mockRestore()
    })

    it('handles failed save gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<Settings {...defaultProps} />)
      const emailInput = screen.getByDisplayValue('test@example.com')
      await userEvent.type(emailInput, 'a')

      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles invalid cached settings', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      localStorageMock.getItem.mockReturnValue('invalid json')

      render(<Settings {...defaultProps} />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      expect(screen.getByText('Settings')).toBeInTheDocument()
      consoleErrorSpy.mockRestore()
    })

    it('handles missing user prop', () => {
      const props = { ...defaultProps, user: null }
      render(<Settings {...props} />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('handles undefined user prop', () => {
      const props = { ...defaultProps, user: undefined }
      render(<Settings {...props} />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('User Actions', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<Settings {...defaultProps} />)
      const closeButton = document.querySelector('.close-settings')
      await userEvent.click(closeButton)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onLogout when logout button is clicked', async () => {
      render(<Settings {...defaultProps} />)
      const logoutButton = screen.getByText('Log Out')
      await userEvent.click(logoutButton)
      expect(defaultProps.onLogout).toHaveBeenCalled()
    })
  })

  describe('Connected Accounts', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const devicesButton = screen.getByText('Devices')
      await userEvent.click(devicesButton)
    })

    it('displays authorized devices section', () => {
      expect(screen.getByText('Authorized Devices')).toBeInTheDocument()
    })

    it('displays current device', () => {
      expect(screen.getByText('Current Device')).toBeInTheDocument()
    })

    it('displays sign out all other devices button', () => {
      expect(screen.getByText('Sign Out All Other Devices')).toBeInTheDocument()
    })
  })

  describe('Security Settings', () => {
    it('displays two-factor authentication in account section', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    })

    it('displays security options', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    it('displays change password button', () => {
      render(<Settings {...defaultProps} />)
      expect(screen.getByText('Change Password')).toBeInTheDocument()
    })
  })

  describe('Billing Section', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const billingButton = screen.getByText('Billing')
      await userEvent.click(billingButton)
    })

    it('displays current plan', () => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByText('Free Plan')).toBeInTheDocument()
    })

    it('displays upgrade to premium button', () => {
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    })
  })

  describe('Data Management Section', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const dataButton = screen.getByText('Data & Storage')
      await userEvent.click(dataButton)
    })

    it('displays data management heading', () => {
      expect(screen.getByText('Data Management')).toBeInTheDocument()
    })

    it('displays request data export button', () => {
      expect(screen.getByText('Request Data Export')).toBeInTheDocument()
    })

    it('displays clear cache button', () => {
      expect(screen.getByText('Clear Cache')).toBeInTheDocument()
    })
  })

  describe('Support Section', () => {
    beforeEach(async () => {
      render(<Settings {...defaultProps} />)
      const supportButton = screen.getByText('Support')
      await userEvent.click(supportButton)
    })

    it('displays help and support heading', () => {
      expect(screen.getByText('Help & Support')).toBeInTheDocument()
    })

    it('displays system information', () => {
      expect(screen.getByText('System Information')).toBeInTheDocument()
      expect(screen.getByText('Version')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with empty user object', () => {
      const props = { ...defaultProps, user: {} }
      render(<Settings {...props} />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('handles missing theme prop', () => {
      const props = { ...defaultProps, theme: undefined }
      render(<Settings {...props} />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('handles missing callbacks', () => {
      const props = { ...defaultProps, onClose: undefined, onLogout: undefined, setTheme: undefined }
      expect(() => render(<Settings {...props} />)).not.toThrow()
    })

    it('renders coming soon for unimplemented sections', async () => {
      render(<Settings {...defaultProps} />)
      const sections = ['Devices', 'Billing', 'Data & Storage', 'Support']

      for (const section of sections) {
        const button = screen.getByText(section)
        await userEvent.click(button)
        await waitFor(() => {
          expect(screen.getByText(/coming soon/i) || document.querySelector('.settings-section')).toBeTruthy()
        })
      }
    })
  })
})

export default defaultProps
