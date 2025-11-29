import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RegisterPage from '../RegisterPage'
import { AuthContext } from '../../contexts/AuthContext'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  signup: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const renderWithRouter = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{<RegisterPage />}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithRouter()
    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument()
  })

  it('displays all required form fields', () => {
    renderWithRouter()
    expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
  })

  it('displays terms and conditions checkbox', () => {
    renderWithRouter()
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument()
  })

  it('shows password strength indicator', async () => {
    renderWithRouter()
    const passwordInput = screen.getByLabelText(/^Password$/i)

    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument()
    })
  })

  it('validates password strength correctly', async () => {
    renderWithRouter()
    const passwordInput = screen.getByLabelText(/^Password$/i)

    // Strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } })
    await waitFor(() => {
      expect(screen.getByText(/Strong/i)).toBeInTheDocument()
    })
  })

  it('shows password match indicator', async () => {
    renderWithRouter()
    const passwordInput = screen.getByLabelText(/^Password$/i)
    const confirmInput = screen.getByLabelText(/Confirm Password/i)

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
    fireEvent.change(confirmInput, { target: { value: 'Password123!' } })

    await waitFor(() => {
      expect(screen.getByText(/Passwords match/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    renderWithRouter()
    const passwordInput = screen.getByLabelText(/^Password$/i)
    const toggleButtons = screen.getAllByRole('button').filter((btn) =>
      btn.querySelector('svg')
    )

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButtons[0])
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })

  it('handles form submission with valid data', async () => {
    const signupMock = jest.fn().mockResolvedValue({})
    renderWithRouter({ ...mockAuthContext, signup: signupMock })

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the/i))

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith('test@example.com', 'StrongPass123!', 'testuser')
    })
  })

  it('validates username length', async () => {
    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'ab' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the/i))

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'invalid-email' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the/i))

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password match', async () => {
    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the/i))

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('requires terms acceptance', async () => {
    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } })

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/accept the Terms of Service/i)).toBeInTheDocument()
    })
  })

  it('displays error on signup failure', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Email already exists'))
    renderWithRouter({ ...mockAuthContext, signup: signupMock })

    fireEvent.change(screen.getByLabelText(/^Username$/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the/i))

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument()
    })
  })

  it('displays sign in link', () => {
    renderWithRouter()
    expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithRouter()
    expect(screen.getByLabelText(/^Username$/i)).toBeRequired()
    expect(screen.getByLabelText(/^Email$/i)).toBeRequired()
    expect(screen.getByLabelText(/^Password$/i)).toBeRequired()
    expect(screen.getByLabelText(/Confirm Password/i)).toBeRequired()
  })
})

export default mockAuthContext
