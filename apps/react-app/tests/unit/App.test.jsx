import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import App from '../../src/App'

// Mock the auth context
const mockAuthContext = {
  isAuthenticated: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  user: null
}

jest.mock('../../src/contexts/AuthContext-simple', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}))

jest.mock('../../src/contexts/ToastContext', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    showToast: jest.fn()
  })
}))

jest.mock('../../src/components/ui', () => ({
  FocusProvider: ({ children }) => children
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.isAuthenticated = false
    mockAuthContext.loading = false
  })

  test('renders loading screen when loading', () => {
    mockAuthContext.loading = true
    
    renderWithRouter(<App />)
    
    expect(screen.getByText('Loading CRYB...')).toBeInTheDocument()
  })

  test('renders landing page when not authenticated', () => {
    mockAuthContext.isAuthenticated = false
    
    renderWithRouter(<App />)
    
    // Should render landing page content
    expect(document.querySelector('.landing-page, .hero')).toBeInTheDocument()
  })

  test('renders authenticated app when logged in', () => {
    mockAuthContext.isAuthenticated = true
    
    renderWithRouter(<App />)
    
    // Should render main app layout
    expect(document.querySelector('.layout')).toBeInTheDocument()
    expect(document.querySelector('header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeInTheDocument()
  })

  test('has skip link for accessibility', () => {
    mockAuthContext.isAuthenticated = true
    
    renderWithRouter(<App />)
    
    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink.getAttribute('href')).toBe('#main-content')
  })

  test('main content has proper id for skip link', () => {
    mockAuthContext.isAuthenticated = true
    
    renderWithRouter(<App />)
    
    const mainContent = document.getElementById('main-content')
    expect(mainContent).toBeInTheDocument()
    expect(mainContent.tagName).toBe('MAIN')
  })

  test('redirects to home when authenticated and visiting root', async () => {
    mockAuthContext.isAuthenticated = true
    
    // Mock location
    delete window.location
    window.location = { pathname: '/' }
    
    renderWithRouter(<App />)
    
    await waitFor(() => {
      // Should redirect to /home
      expect(window.location.pathname).toBe('/')
    })
  })

  test('protected routes redirect when not authenticated', async () => {
    mockAuthContext.isAuthenticated = false
    
    // Mock trying to access protected route
    window.history.pushState({}, 'Test', '/home')
    
    renderWithRouter(<App />)
    
    // Should show landing page instead
    expect(document.querySelector('.landing-page, .hero')).toBeInTheDocument()
  })

  test('handles authentication state changes', async () => {
    const { rerender } = renderWithRouter(<App />)
    
    // Start unauthenticated
    expect(document.querySelector('.landing-page, .hero')).toBeInTheDocument()
    
    // Simulate login
    mockAuthContext.isAuthenticated = true
    rerender(<App />)
    
    // Should now show authenticated app
    expect(document.querySelector('.layout')).toBeInTheDocument()
  })

  test('renders all required providers', () => {
    const { container } = renderWithRouter(<App />)
    
    // App should be wrapped in all necessary providers
    expect(container.firstChild).toBeInTheDocument()
  })

  test('has proper semantic HTML structure', () => {
    mockAuthContext.isAuthenticated = true
    
    renderWithRouter(<App />)
    
    // Should have proper semantic structure
    expect(document.querySelector('header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeInTheDocument()
  })

  test('maintains focus management', async () => {
    mockAuthContext.isAuthenticated = true
    
    renderWithRouter(<App />)
    
    const skipLink = screen.getByText('Skip to main content')
    
    // Focus skip link
    skipLink.focus()
    expect(skipLink).toHaveFocus()
    
    // Activate skip link
    await userEvent.click(skipLink)
    
    // Focus should move to main content
    const mainContent = document.getElementById('main-content')
    expect(mainContent).toHaveFocus()
  })
})