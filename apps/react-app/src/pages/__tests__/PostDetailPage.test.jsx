import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PostDetailPage from '../PostDetailPage'
import { AuthContext } from '../../contexts/AuthContext'
import offlineStorage from '../../services/offlineStorage'

// Mock services
jest.mock('../../services/offlineStorage')
global.fetch = jest.fn()

const mockPost = {
  id: '1',
  title: 'Test Post Title',
  content: 'This is test post content.',
  user: {
    id: 'user1',
    username: 'testauthor',
    displayName: 'Test Author',
  },
  score: 100,
  createdAt: '2024-01-01T00:00:00Z',
  communityName: 'test-community',
  viewCount: 500,
}

const mockComments = [
  {
    id: 'comment1',
    content: 'Test comment',
    author: { username: 'commenter', displayName: 'Commenter' },
    createdAt: '2024-01-01T01:00:00Z',
    score: 5,
  },
]

const mockAuthContext = {
  user: { id: 'user1', username: 'testuser' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const renderWithRouter = (postId = '1', authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/c/:communityName/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </AuthContext.Provider>
    </BrowserRouter>,
    { initialEntries: [`/post/${postId}`] }
  )
}

describe('PostDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    offlineStorage.getPost.mockResolvedValue(null)
    offlineStorage.savePost.mockResolvedValue()
    global.fetch.mockImplementation((url) => {
      if (url.includes('/posts/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPost }),
        })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockComments }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('renders without crashing', () => {
    renderWithRouter()
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    expect(screen.getByText(/Loading post/i)).toBeInTheDocument()
  })

  it('displays post content after loading', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
      expect(screen.getByText('This is test post content.')).toBeInTheDocument()
    })
  })

  it('displays author information', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/testauthor/i)).toBeInTheDocument()
    })
  })

  it('displays post metadata', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/comments/i)).toBeInTheDocument()
      expect(screen.getByText(/views/i)).toBeInTheDocument()
    })
  })

  it('shows vote buttons', async () => {
    renderWithRouter()
    await waitFor(() => {
      const voteButtons = screen.queryAllByRole('button')
      expect(voteButtons.length).toBeGreaterThan(0)
    })
  })

  it('displays comments section', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Test comment/i)).toBeInTheDocument()
    })
  })

  it('shows share button', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share post/i })).toBeInTheDocument()
    })
  })

  it('shows bookmark button', async () => {
    renderWithRouter()
    await waitFor(() => {
      const bookmarkButton = screen.getByRole('button', { name: /Bookmark post/i })
      expect(bookmarkButton).toBeInTheDocument()
    })
  })

  it('displays community information in sidebar', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/test-community/i)).toBeInTheDocument()
    })
  })

  it('shows error state when post not found', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false }),
      })
    )
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Post/i)).toBeInTheDocument()
    })
  })

  it('displays offline indicator when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument()
    })
  })

  it('has back navigation button', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Go back to previous page/i })).toBeInTheDocument()
    })
  })

  it('shows post stats in sidebar', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Post Stats/i)).toBeInTheDocument()
    })
  })

  it('displays community rules', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Community Rules/i)).toBeInTheDocument()
    })
  })
})

export default mockPost
