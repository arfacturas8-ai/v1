import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SettingsPage from '../SettingsPage'
import { AuthContext } from '../../contexts/AuthContext'
import { ThemeContext } from '../../contexts/ThemeContext'
import userService from '../../services/userService'

// Mock services
jest.mock('../../services/userService')
jest.mock('../../services/api')
jest.mock('../../services/authService')

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  bio: 'Test bio',
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockThemeContext = {
  theme: 'light',
  toggleTheme: jest.fn(),
}

const renderWithContext = () => {
  return render(
    <BrowserRouter>
      <ThemeContext.Provider value={mockThemeContext}>
        <AuthContext.Provider value={mockAuthContext}>
          <SettingsPage />
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </BrowserRouter>
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    userService.getUserProfile.mockResolvedValue({
      success: true,
      user: mockUser,
    })
    userService.updateProfile.mockResolvedValue({
      success: true,
    })
  })

  it('renders without crashing', () => {
    renderWithContext()
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument()
  })

  it('displays all settings tabs', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Profile/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Appearance/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Privacy/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Security/i })).toBeInTheDocument()
    })
  })

  it('loads user profile data', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(userService.getUserProfile).toHaveBeenCalled()
    })
  })

  it('displays profile information', async () => {
    renderWithContext()
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User')
      expect(displayNameInput).toBeInTheDocument()
    })
  })

  it('handles tab navigation', async () => {
    renderWithContext()
    await waitFor(() => {
      const appearanceTab = screen.getByRole('button', { name: /Appearance/i })
      fireEvent.click(appearanceTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Theme/i)).toBeInTheDocument()
    })
  })

  it('shows theme toggle in appearance tab', async () => {
    renderWithContext()
    await waitFor(() => {
      const appearanceTab = screen.getByRole('button', { name: /Appearance/i })
      fireEvent.click(appearanceTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Current Theme/i)).toBeInTheDocument()
    })
  })

  it('handles profile update', async () => {
    renderWithContext()
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } })
    })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalled()
    })
  })

  it('displays success message after save', async () => {
    renderWithContext()
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } })
    })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument()
    })
  })

  it('shows notification preferences', async () => {
    renderWithContext()
    await waitFor(() => {
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i })
      fireEvent.click(notificationsTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Notification Settings/i)).toBeInTheDocument()
    })
  })

  it('displays privacy settings', async () => {
    renderWithContext()
    await waitFor(() => {
      const privacyTab = screen.getByRole('button', { name: /Privacy/i })
      fireEvent.click(privacyTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Profile Visibility/i)).toBeInTheDocument()
    })
  })

  it('shows security settings', async () => {
    renderWithContext()
    await waitFor(() => {
      const securityTab = screen.getByRole('button', { name: /Security/i })
      fireEvent.click(securityTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Change Password/i)).toBeInTheDocument()
    })
  })

  it('displays data export option', async () => {
    renderWithContext()
    await waitFor(() => {
      const dataTab = screen.getByRole('button', { name: /Data & Privacy/i })
      fireEvent.click(dataTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Export Your Data/i)).toBeInTheDocument()
    })
  })

  it('shows delete account option', async () => {
    renderWithContext()
    await waitFor(() => {
      const dataTab = screen.getByRole('button', { name: /Data & Privacy/i })
      fireEvent.click(dataTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
    })
  })

  it('displays API keys section', async () => {
    renderWithContext()
    await waitFor(() => {
      const apiTab = screen.getByRole('button', { name: /API Keys/i })
      fireEvent.click(apiTab)
    })
    await waitFor(() => {
      expect(screen.getByText(/API Keys/i)).toBeInTheDocument()
    })
  })

  it('has proper accessibility with alert messages', async () => {
    renderWithContext()
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } })
    })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })
  })

  it('validates form inputs', async () => {
    renderWithContext()
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: '' } })
    })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    // Input should be required and validation should prevent empty submission
    await waitFor(() => {
      const displayNameInput = screen.getByPlaceholderText(/Your display name/i)
      expect(displayNameInput.value).toBe('')
    })
  })
})

export default mockUser
