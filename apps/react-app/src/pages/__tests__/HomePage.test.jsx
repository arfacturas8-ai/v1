import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import HomePage from '../HomePage'
import { AuthContext } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import postsService from '../../services/postsService'
import apiService from '../../services/api'

// Mock services
jest.mock('../../services/communityService')
jest.mock('../../services/postsService')
jest.mock('../../services/api')
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

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

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API responses
    communityService.getCommunities.mockResolvedValue({
      success: true,
      communities: [
        {
          id: '1',
          name: 'test-community',
          displayName: 'Test Community',
          description: 'A test community',
          memberCount: 1000,
          icon: null,
        },
      ],
    })
    postsService.getPosts.mockResolvedValue({
      success: true,
      posts: [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          author: { username: 'testauthor' },
          createdAt: new Date().toISOString(),
          likes: 10,
          comments: 5,
        },
      ],
    })
    apiService.get.mockResolvedValue({
      success: true,
      data: {
        communities: 10,
        activeUsers: 100,
        onlineUsers: 50,
        totalVolume: 1000000,
        activities: [],
      },
    })
  })

  it('renders without crashing', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithRouter(<HomePage />)
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays welcome message for authenticated user', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
      expect(screen.getByText(/testuser/i)).toBeInTheDocument()
    })
  })

  it('displays generic welcome for unauthenticated user', async () => {
    const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false }
    renderWithRouter(<HomePage />, unauthContext)
    await waitFor(() => {
      expect(screen.getByText(/Discover, Connect/i)).toBeInTheDocument()
    })
  })

  it('fetches and displays featured communities', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText('Test Community')).toBeInTheDocument()
      expect(screen.getByText('A test community')).toBeInTheDocument()
    })
  })

  it('fetches and displays trending posts', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
  })

  it('displays live stats', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Live platform statistics/i)).toBeInTheDocument()
    })
  })

  it('handles navigation to communities page', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      const exploreButton = screen.getAllByRole('button', { name: /Explore communities/i })[0]
      expect(exploreButton).toBeInTheDocument()
    })
  })

  it('shows sign in button for unauthenticated users', async () => {
    const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false }
    renderWithRouter(<HomePage />, unauthContext)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
    })
  })

  it('displays offline indicator when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    communityService.getCommunities.mockRejectedValue(new Error('API Error'))
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load content/i)).toBeInTheDocument()
    })
  })

  it('renders quick actions navigation', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Post/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Browse Communities/i })).toBeInTheDocument()
    })
  })

  it('has proper heading hierarchy', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
    })
  })

  it('displays activity feed', async () => {
    renderWithRouter(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/Live Activity/i)).toBeInTheDocument()
    })
  })
})

export default mockAuthContext
