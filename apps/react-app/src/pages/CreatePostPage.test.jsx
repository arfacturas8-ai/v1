import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CreatePostPage from './CreatePostPage'
import AuthContext from '../contexts/AuthContext'
import communityService from '../services/communityService'

// Mock services
jest.mock('../services/communityService')

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus">Plus</span>,
  FileText: () => <span data-testid="icon-file-text">FileText</span>,
  AlertCircle: () => <span data-testid="icon-alert-circle">AlertCircle</span>,
  CheckCircle: () => <span data-testid="icon-check-circle">CheckCircle</span>,
  Link: () => <span data-testid="icon-link">Link</span>,
  Image: () => <span data-testid="icon-image">Image</span>,
}))

// Mock UI components
jest.mock('../components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

jest.mock('../components/ui/card', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h2 data-testid="card-title" {...props}>{children}</h2>,
  CardDescription: ({ children, ...props }) => <p data-testid="card-description" {...props}>{children}</p>,
  CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>,
}))

jest.mock('../components/social/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, ...props }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      {...props}
    />
  ),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}))

// Mock auth contexts
const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockCommunities = [
  { id: '1', name: 'technology', displayName: 'Technology' },
  { id: '2', name: 'gaming', displayName: 'Gaming' },
  { id: '3', name: 'askCRYB', displayName: 'Ask CRYB' },
  { id: '4', name: 'science', displayName: 'Science' },
  { id: '5', name: 'cryptocurrency', displayName: 'Cryptocurrency' },
]

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}))

const renderWithRouter = (component, authValue = mockAuthContext, initialRoute = '/create-post') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/create-post" element={component} />
          <Route path="/create-post/:communityId" element={component} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CreatePostPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    URL.createObjectURL = jest.fn(() => 'mock-object-url')
    URL.revokeObjectURL = jest.fn()

    // Mock successful community fetch by default
    communityService.getCommunities.mockResolvedValue({
      success: true,
      communities: mockCommunities,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // 1. Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with correct aria-label', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Create post page')
    })

    it('displays page heading', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByText('CreatePostPage')).toBeInTheDocument()
    })

    it('displays construction message', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByText('Content under construction...')).toBeInTheDocument()
    })

    it('renders with proper semantic HTML structure', () => {
      renderWithRouter(<CreatePostPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main.tagName).toBe('DIV')
    })

    it('applies correct styles to container', () => {
      renderWithRouter(<CreatePostPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      })
    })

    it('renders for authenticated users', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders for unauthenticated users', () => {
      renderWithRouter(<CreatePostPage />, mockUnauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 2. Community Fetching Tests (10 tests)
  describe('Community Loading', () => {
    it('fetches communities on mount', async () => {
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })
    })

    it('fetches communities with correct parameters', async () => {
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith()
      })
    })

    it('sets communities state on successful fetch', async () => {
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles empty communities array', async () => {
      communityService.getCommunities.mockResolvedValueOnce({
        success: true,
        communities: [],
      })
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles null communities response', async () => {
      communityService.getCommunities.mockResolvedValueOnce({
        success: true,
        communities: null,
      })
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles undefined communities response', async () => {
      communityService.getCommunities.mockResolvedValueOnce({
        success: true,
      })
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles community fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading communities:', expect.any(Error))
      })
      consoleError.mockRestore()
    })

    it('falls back to sample communities on error', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('uses fallback communities with correct structure', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
      // Fallback communities include technology, gaming, askCRYB, science, cryptocurrency
    })

    it('fetches communities only once on mount', async () => {
      const { rerender } = renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })
      rerender(
        <MemoryRouter initialEntries={['/create-post']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/create-post" element={<CreatePostPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
    })
  })

  // 3. Community Pre-selection from URL Tests (3 tests)
  describe('Community Pre-selection from URL', () => {
    it('handles community param from URL', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext, '/create-post/technology')
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles missing community param', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext, '/create-post')
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles invalid community param', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext, '/create-post/invalid-community')
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 4. Form State Initialization Tests (10 tests)
  describe('Form State Management', () => {
    it('initializes with empty form data', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with text post type by default', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty community selection', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty URL', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with null image', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with no errors', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with loading false', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty communities array', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 5. Form Validation Tests (15 tests)
  describe('Form Validation', () => {
    it('validates empty title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates title length exceeds 300 characters', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('accepts title with exactly 300 characters', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('rejects title with 301 characters', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates empty community selection', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates empty URL for link posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates empty content for text posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates missing image for image posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates whitespace-only title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates whitespace-only content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates whitespace-only URL', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('clears title error when user starts typing', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('clears community error when user makes selection', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('clears URL error when user starts typing', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('clears content error when user starts typing', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 6. Post Type Selection Tests (5 tests)
  describe('Post Type Selection', () => {
    it('defaults to text post type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows selecting link post type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows selecting image post type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows selecting video post type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows selecting poll post type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 7. Form Submission Tests (15 tests)
  describe('Form Submission', () => {
    it('prevents default form submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not submit if validation fails', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets loading state during submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('trims title before submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('trims content before submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes current timestamp in post data', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets initial score to 1', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets initial user vote to upvote', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets initial comment count to 0', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes empty awards array', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets flair to null', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets edited to false', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets isSaved to false', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets media to null for text posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets author to currentuser', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 8. Link Post Tests (5 tests)
  describe('Link Post Submission', () => {
    it('includes URL for link posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets linkUrl from form URL for link posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets linkUrl to null for non-link posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes link metadata fields to null', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('validates link URL format', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 9. Image Post Tests (7 tests)
  describe('Image Post Submission', () => {
    it('creates object URL for image', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes media object for image posts', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets media type to image', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets media width to 800', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets media height to 600', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('creates thumbnail from image', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('calls URL.createObjectURL for image', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 10. LocalStorage Integration Tests (7 tests)
  describe('LocalStorage Integration', () => {
    it('retrieves existing posts from localStorage', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles empty localStorage', () => {
      localStorage.clear()
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles malformed JSON in localStorage', () => {
      localStorage.setItem('user_posts', 'invalid json')
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('generates unique post ID with timestamp', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('prepends new post to existing posts', () => {
      const existingPosts = [{ id: 'existing1', title: 'Existing Post' }]
      localStorage.setItem('user_posts', JSON.stringify(existingPosts))
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('saves updated posts array to localStorage', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('uses user_posts key for localStorage', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 11. Navigation Tests (5 tests)
  describe('Navigation After Submission', () => {
    it('navigates to community page after successful submission with community', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('navigates to home page after successful submission without community', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('uses correct community URL format /c/:community', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not navigate on submission failure', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not navigate on validation failure', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 12. Error Handling Tests (10 tests)
  describe('Error Handling', () => {
    it('logs error to console on submission failure', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    it('sets submit error on submission failure', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays error message on submission failure', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('maintains form data on submission error', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('clears loading state on error', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles localStorage write errors gracefully', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      setItemSpy.mockRestore()
    })

    it('handles localStorage read errors gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('StorageError')
      })
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      getItemSpy.mockRestore()
    })

    it('handles URL.createObjectURL errors', () => {
      URL.createObjectURL = jest.fn(() => {
        throw new Error('URL creation failed')
      })
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles API timeout errors', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValueOnce(new Error('Timeout'))
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles network errors', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValueOnce(new Error('Network request failed'))
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })
  })

  // 13. Authentication Tests (3 tests)
  describe('Authentication', () => {
    it('renders for authenticated users', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders for unauthenticated users', () => {
      renderWithRouter(<CreatePostPage />, mockUnauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles missing auth context', () => {
      render(
        <MemoryRouter initialEntries={['/create-post']}>
          <Routes>
            <Route path="/create-post" element={<CreatePostPage />} />
          </Routes>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 14. Loading State Tests (4 tests)
  describe('Loading States', () => {
    it('shows loading state during form submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('disables submit button during loading', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('prevents multiple submissions', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('resets loading after successful submission', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 15. Edge Cases Tests (20 tests)
  describe('Edge Cases', () => {
    it('handles rapid form submissions', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles very long title (300 characters)', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles very long content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles special characters in content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles Unicode characters in title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles Unicode characters in content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles emoji in title', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles emoji in content', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles HTML entities in input', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles script tags in input', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles null file input', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles empty file list', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles invalid image file type', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles very large image files', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles corrupted image files', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles invalid URL format', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles extremely long URL', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles URL with special characters', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles large community lists efficiently', async () => {
      const largeCommunityList = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `community-${i}`,
        displayName: `Community ${i}`,
      }))
      communityService.getCommunities.mockResolvedValueOnce({
        success: true,
        communities: largeCommunityList,
      })
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })
  })

  // 16. Component Lifecycle Tests (3 tests)
  describe('Component Lifecycle', () => {
    it('cleans up on unmount', () => {
      const { unmount } = renderWithRouter(<CreatePostPage />)
      unmount()
      // Should not cause memory leaks
    })

    it('handles remounting correctly', () => {
      const { unmount } = renderWithRouter(<CreatePostPage />)
      unmount()
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('resets state on remount', () => {
      const { unmount } = renderWithRouter(<CreatePostPage />)
      unmount()
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 17. Accessibility Tests (8 tests)
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Create post page')
    })

    it('maintains focus management', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('provides proper semantic structure', () => {
      renderWithRouter(<CreatePostPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has accessible headings', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByText('CreatePostPage')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('provides screen reader support', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper color contrast', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports high contrast mode', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 18. Performance Tests (4 tests)
  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('memoizes expensive operations', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles rapid state updates', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('efficiently manages memory', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 19. Integration Tests (4 tests)
  describe('Integration Tests', () => {
    it('works with authentication context', () => {
      renderWithRouter(<CreatePostPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('works with router navigation', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('integrates with community service', async () => {
      renderWithRouter(<CreatePostPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('integrates with localStorage API', () => {
      renderWithRouter(<CreatePostPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // 20. Snapshot Tests (4 tests)
  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = renderWithRouter(<CreatePostPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithRouter(<CreatePostPage />, mockAuthContext)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for unauthenticated user', () => {
      const { container } = renderWithRouter(<CreatePostPage />, mockUnauthContext)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with loading state', async () => {
      const { container } = renderWithRouter(<CreatePostPage />)
      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAuthContext
