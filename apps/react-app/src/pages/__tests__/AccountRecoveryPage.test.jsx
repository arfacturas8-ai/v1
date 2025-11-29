/**
 * AccountRecoveryPage Test Suite
 * Tests for the Account Recovery page functionality
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountRecoveryPage from '../AccountRecoveryPage'

// Mock fetch
global.fetch = jest.fn()

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

describe('AccountRecoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
  })

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays account recovery heading', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Account Recovery/i) || screen.getByText(/Recovery/i)).toBeInTheDocument()
  })

  it('shows email input field', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    expect(emailInput).toBeInTheDocument()
  })

  it('validates email format', async () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/valid email/i) || screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('sends recovery request with valid email', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Recovery email sent' }),
    })

    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recovery'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('displays backup code input option', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/backup code/i) || screen.getByText(/recovery code/i)).toBeInTheDocument()
  })

  it('handles backup code submission', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const codeInput = screen.getByLabelText(/code/i) || screen.getByPlaceholderText(/code/i)
    const submitButton = screen.getByRole('button', { name: /verify/i })

    fireEvent.change(codeInput, { target: { value: 'ABCD-1234-EFGH-5678' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('shows loading state during submission', async () => {
    global.fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)))

    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/Sending/i) || screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays success message after recovery request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Check your email' }),
    })

    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email sent/i) || screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('has proper ARIA attributes', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('aria-label')
  })

  it('is keyboard accessible', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
    emailInput.focus()
    expect(document.activeElement).toBe(emailInput)
  })

  it('includes back to login link', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    const backLink = screen.getByText(/back/i) || screen.getByText(/login/i)
    expect(backLink).toBeInTheDocument()
  })

  it('displays recovery instructions', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/instructions/i) || screen.getByText(/help/i)).toBeInTheDocument()
  })

  it('supports multiple recovery methods', () => {
    render(
      <MemoryRouter>
        <AccountRecoveryPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/email/i)).toBeInTheDocument()
    expect(screen.getByText(/code/i) || screen.getByText(/backup/i)).toBeInTheDocument()
  })
})

export default mockNavigate
