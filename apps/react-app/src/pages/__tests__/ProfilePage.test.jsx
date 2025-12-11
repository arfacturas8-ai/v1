import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProfilePage from '../ProfilePage'
import { AuthContext } from '../../contexts/AuthContext'
import userService from '../../services/userService'
import postsService from '../../services/postsService'

// Mock services
jest.mock('../../services/userService')
jest.mock('../../services/postsService')
jest.mock('../../services/nftService')

const mockUser = {
  id: '1',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'Test bio',
  email: 'test@example.com',
  joinedAt: '2024-01-01T00:00:00Z',
  followerCount: 100,
  karma: 500,
  nftCount: 5,
  stats: {
    totalPosts: 10,
    totalComments: 20,
    totalAwards: 3,
  },
  badges: [
    { id: '1', name: 'Early Adopter', icon: 'shield' },
  ],
  achievements: [
    { id: '1', name: 'First Post', description: 'Created your first post', rarity: 'common', icon: '🎉' },
  ],
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const renderWithRouter = (username = 'testuser', authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AuthContext.Provider>
    </BrowserRouter>,
    { initialEntries: [`/profile/${username}`] }
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    userService.getUserByUsername.mockResolvedValue({
      success: true,
      user: mockUser,
    })
    postsService.getPosts.mockResolvedValue({
      success: true,
      posts: [],
    })
  })

  it('renders without crashing', () => {
    renderWithRouter()
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    const loadingIndicator = screen.getByText(/Loading/i) || document.querySelector('.')
    expect(loadingIndicator).toBeInTheDocument()
  })

  it('displays user profile information after loading', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(screen.getByText('Test bio')).toBeInTheDocument()
    })
  })

  it('shows edit profile button for own profile', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit profile/i })).toBeInTheDocument()
    })
  })

  it('shows follow/unfollow button for other profiles', async () => {
    const otherUser = { ...mockUser, username: 'otheruser', id: '2' }
    userService.getUserByUsername.mockResolvedValue({
      success: true,
      user: otherUser,
    })
    renderWithRouter('otheruser')
    await waitFor(() => {
      const followButton = screen.getByRole('button', { name: /Follow/i })
      expect(followButton).toBeInTheDocument()
    })
  })

  it('displays user statistics', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Karma')).toBeInTheDocument()
      expect(screen.getByText('Followers')).toBeInTheDocument()
    })
  })

  it('handles tab navigation', async () => {
    renderWithRouter()
    await waitFor(() => {
      const postsTab = screen.getByRole('tab', { name: /Posts/i })
      fireEvent.click(postsTab)
      expect(postsTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('shows error state when user not found', async () => {
    userService.getUserByUsername.mockResolvedValue({
      success: false,
      user: null,
    })
    renderWithRouter('nonexistent')
    await waitFor(() => {
      expect(screen.getByText(/User not found/i)).toBeInTheDocument()
    })
  })

  it('displays badges and achievements', async () => {
    renderWithRouter()
    await waitFor(() => {
      const achievementsTab = screen.getByRole('tab', { name: /Achievements/i })
      fireEvent.click(achievementsTab)
    })
    await waitFor(() => {
      expect(screen.getByText('Achievements & Badges')).toBeInTheDocument()
    })
  })

  it('handles edit profile modal', async () => {
    renderWithRouter()
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit profile/i })
      fireEvent.click(editButton)
    })
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })
  })

  it('displays wallet address for connected users', async () => {
    const userWithWallet = { ...mockUser, walletAddress: '0x1234567890abcdef' }
    userService.getUserByUsername.mockResolvedValue({
      success: true,
      user: userWithWallet,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/0x1234/i)).toBeInTheDocument()
    })
  })

  it('has proper accessibility labels', async () => {
    renderWithRouter()
    await waitFor(() => {
      const copyButton = screen.getByLabelText(/Copy wallet address/i)
      expect(copyButton).toBeInTheDocument()
    })
  })

  it('handles follow action', async () => {
    const otherUser = { ...mockUser, username: 'otheruser', id: '2', isFollowing: false }
    userService.getUserByUsername.mockResolvedValue({
      success: true,
      user: otherUser,
    })
    renderWithRouter('otheruser')
    await waitFor(() => {
      const followButton = screen.getByRole('button', { name: /Follow otheruser/i })
      fireEvent.click(followButton)
      expect(followButton).toHaveAttribute('aria-pressed')
    })
  })

  it('shows NFT collection', async () => {
    renderWithRouter()
    await waitFor(() => {
      const nftsTab = screen.getByRole('tab', { name: /NFTs/i })
      fireEvent.click(nftsTab)
    })
    await waitFor(() => {
      expect(screen.getByText('NFT Collection')).toBeInTheDocument()
    })
  })
})

export default mockUser
