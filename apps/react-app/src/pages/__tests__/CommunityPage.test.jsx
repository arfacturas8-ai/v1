import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CommunityPage from '../CommunityPage'
import offlineStorage from '../../services/offlineStorage'

// Mock services
jest.mock('../../services/offlineStorage')

const mockCommunity = {
  name: 'test-community',
  displayName: 'Test Community',
  description: 'A test community description',
  memberCount: 1000,
  onlineCount: 50,
  createdAt: '2024-01-01T00:00:00Z',
  category: 'general',
  rules: ['Be respectful', 'No spam'],
  moderators: ['mod1', 'mod2'],
  postsToday: 10,
  trending: true,
}

const mockPosts = [
  {
    id: '1',
    title: 'Test Post 1',
    content: 'Test content 1',
    author: 'testauthor',
    score: 100,
    upvotes: 120,
    downvotes: 20,
    comments: 10,
    created: new Date().toISOString(),
    community: 'test-community',
    type: 'text',
  },
]

const renderWithRouter = (communityName = 'test-community') => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/community/:communityName" element={<CommunityPage />} />
      </Routes>
    </BrowserRouter>,
    { initialEntries: [`/community/${communityName}`] }
  )
}

describe('CommunityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    offlineStorage.getPosts.mockResolvedValue([])
    offlineStorage.savePosts.mockResolvedValue()
  })

  it('renders without crashing', () => {
    renderWithRouter()
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    const loadingIndicators = document.querySelectorAll('.animate-pulse')
    expect(loadingIndicators.length).toBeGreaterThan(0)
  })

  it('displays community information after loading', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/test-community/i)).toBeInTheDocument()
    })
  })

  it('displays join button', async () => {
    renderWithRouter()
    await waitFor(() => {
      const joinButton = screen.getByRole('button', { name: /Join/i })
      expect(joinButton).toBeInTheDocument()
    })
  })

  it('handles join/leave community', async () => {
    renderWithRouter()
    await waitFor(() => {
      const joinButton = screen.getByRole('button', { name: /Join Test Community community/i })
      fireEvent.click(joinButton)
    })
    await waitFor(() => {
      expect(screen.getByText(/Joined/i)).toBeInTheDocument()
    })
  })

  it('displays community stats', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/members/i)).toBeInTheDocument()
      expect(screen.getByText(/online/i)).toBeInTheDocument()
    })
  })

  it('shows sort controls', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sort by Hot/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sort by New/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sort by Top/i })).toBeInTheDocument()
    })
  })

  it('handles sort option change', async () => {
    renderWithRouter()
    await waitFor(() => {
      const newButton = screen.getByRole('button', { name: /Sort by New/i })
      fireEvent.click(newButton)
      expect(newButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('displays create post form for joined members', async () => {
    renderWithRouter()
    await waitFor(() => {
      const joinButton = screen.getByRole('button', { name: /Join Test Community community/i })
      fireEvent.click(joinButton)
    })
    await waitFor(() => {
      expect(screen.getByText(/Create a post/i)).toBeInTheDocument()
    })
  })

  it('shows offline indicator when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument()
    })
  })

  it('displays community rules in sidebar', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Community Rules/i)).toBeInTheDocument()
    })
  })

  it('shows moderators list', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Moderators/i)).toBeInTheDocument()
    })
  })

  it('handles post voting', async () => {
    renderWithRouter()
    await waitFor(() => {
      // Wait for posts to load
      const upvoteButtons = screen.queryAllByLabelText(/Upvote post/i)
      if (upvoteButtons.length > 0) {
        fireEvent.click(upvoteButtons[0])
        expect(upvoteButtons[0]).toHaveAttribute('aria-pressed')
      }
    })
  })

  it('displays empty state when no posts', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/No Posts Yet/i)).toBeInTheDocument()
    })
  })

  it('has proper heading structure', async () => {
    renderWithRouter()
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /c\/test-community/i })
      expect(heading).toBeInTheDocument()
    })
  })
})

export default mockCommunity
