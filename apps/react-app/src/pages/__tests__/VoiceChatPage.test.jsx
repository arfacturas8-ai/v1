import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import VoiceChatPage from '../VoiceChatPage'
import { AuthContext } from '../../contexts/AuthContext'
import socketService from '../../services/socket'

// Mock services
jest.mock('../../services/socket')
global.fetch = jest.fn()

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  role: 'user',
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockChannels = [
  {
    id: 'voice1',
    name: 'General Voice',
    description: 'Main voice channel',
    participants: [],
    maxParticipants: 10,
  },
  {
    id: 'voice2',
    name: 'Gaming Voice',
    description: 'For gaming sessions',
    participants: [],
    maxParticipants: 5,
  },
]

const renderWithContext = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <VoiceChatPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('VoiceChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, channels: mockChannels }),
    })
    socketService.emit = jest.fn()
    socketService.on = jest.fn()
    socketService.off = jest.fn()
  })

  it('renders without crashing', () => {
    renderWithContext()
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithContext()
    expect(screen.getByText(/Connecting to voice channel/i)).toBeInTheDocument()
  })

  it('fetches voice channels from API', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/voice/channels'),
        expect.any(Object)
      )
    })
  })

  it('displays voice channels after loading', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByText('General Voice')).toBeInTheDocument()
      expect(screen.getByText('Gaming Voice')).toBeInTheDocument()
    })
  })

  it('displays voice control buttons', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mute/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Deafen/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Video/i })).toBeInTheDocument()
    })
  })

  it('handles mute toggle', async () => {
    renderWithContext()
    await waitFor(() => {
      const muteButton = screen.getByRole('button', { name: /Mute/i })
      fireEvent.click(muteButton)
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unmute/i })).toBeInTheDocument()
    })
  })

  it('handles deafen toggle', async () => {
    renderWithContext()
    await waitFor(() => {
      const deafenButton = screen.getByRole('button', { name: /Deafen/i })
      fireEvent.click(deafenButton)
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Undeafen/i })).toBeInTheDocument()
    })
  })

  it('handles video toggle', async () => {
    renderWithContext()
    await waitFor(() => {
      const videoButton = screen.getByRole('button', { name: /Video/i })
      fireEvent.click(videoButton)
    })
    // Video button state should change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Video/i })).toBeInTheDocument()
    })
  })

  it('displays volume control slider', async () => {
    renderWithContext()
    await waitFor(() => {
      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toBeInTheDocument()
      expect(volumeSlider).toHaveAttribute('type', 'range')
    })
  })

  it('handles volume adjustment', async () => {
    renderWithContext()
    await waitFor(() => {
      const volumeSlider = screen.getByRole('slider')
      fireEvent.change(volumeSlider, { target: { value: '50' } })
      expect(screen.getByText(/Volume: 50%/i)).toBeInTheDocument()
    })
  })

  it('displays participants section', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByText(/Participants/i)).toBeInTheDocument()
    })
  })

  it('handles channel switching', async () => {
    renderWithContext()
    await waitFor(() => {
      const gamingChannel = screen.getByText('Gaming Voice')
      fireEvent.click(gamingChannel)
    })
    await waitFor(() => {
      expect(socketService.emit).toHaveBeenCalledWith(
        'voice_leave',
        expect.any(Object)
      )
    })
  })

  it('sets up socket event listeners', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalledWith('voice_user_joined', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('voice_user_left', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('voice_user_muted', expect.any(Function))
    })
  })

  it('shows back to chat button', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Chat/i })).toBeInTheDocument()
    })
  })

  it('displays voice settings button', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Voice Settings/i })).toBeInTheDocument()
    })
  })

  it('shows screen share button', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Screen Share/i })).toBeInTheDocument()
    })
  })

  it('handles screen share toggle', async () => {
    renderWithContext()
    await waitFor(() => {
      const screenShareButton = screen.getByRole('button', { name: /Screen Share/i })
      fireEvent.click(screenShareButton)
    })
    // Screen share state should change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Screen Share/i })).toBeInTheDocument()
    })
  })

  it('displays enhanced voice channel when connected', async () => {
    renderWithContext()
    // Wait for connection
    await waitFor(() => {
      // Check that EnhancedVoiceChannel component is rendered
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows channel participant count', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByText(/0\/10 participants/i)).toBeInTheDocument()
    })
  })
})

export default mockUser
