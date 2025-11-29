import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CommunityNavigation from './CommunityNavigation'
import { AuthContext } from '../../contexts/AuthContext.jsx'

// Mock react-router-dom hooks
const mockNavigate = vi.fn()
const mockUseParams = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useLocation: () => mockUseLocation()
  }
})

// Helper to render with router and auth context
const renderWithProviders = (ui, { user = null, route = '/c/technology' } = {}) => {
  const authValue = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={authValue}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CommunityNavigation', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ communityName: 'technology' })
    mockUseLocation.mockReturnValue({ pathname: '/c/technology' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })

    it('should not render when not in a community path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/home' })
      const { container } = renderWithProviders(<CommunityNavigation />)
      expect(container.firstChild).toBeNull()
    })

    it('should render when path starts with /c/', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/new' })
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })

    it('should render community icon with first letter of display name', () => {
      renderWithProviders(<CommunityNavigation />)
      const icon = screen.getByText('T')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('font-bold', 'text-lg')
    })

    it('should render community name with c/ prefix', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })
  })

  describe('Community Info Display', () => {
    it('should display member count correctly', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('125,400 members')).toBeInTheDocument()
    })

    it('should display online count correctly', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('2,340 online')).toBeInTheDocument()
    })

    it('should display "Joined" badge when user has joined community', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('Joined')).toBeInTheDocument()
    })

    it('should format member count with locale string', () => {
      renderWithProviders(<CommunityNavigation />)
      const memberText = screen.getByText('125,400 members')
      expect(memberText).toBeInTheDocument()
    })

    it('should format online count with locale string', () => {
      renderWithProviders(<CommunityNavigation />)
      const onlineText = screen.getByText('2,340 online')
      expect(onlineText).toBeInTheDocument()
    })

    it('should display separator between member and online count', () => {
      renderWithProviders(<CommunityNavigation />)
      const separators = screen.getAllByText('•')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation Tabs', () => {
    it('should render all main navigation tabs', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('Hot')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Rising')).toBeInTheDocument()
    })

    it('should render Hot tab with correct link', () => {
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).toHaveAttribute('href', '/c/technology')
    })

    it('should render New tab with correct link', () => {
      renderWithProviders(<CommunityNavigation />)
      const newTab = screen.getByText('New').closest('a')
      expect(newTab).toHaveAttribute('href', '/c/technology/new')
    })

    it('should render Top tab with correct link', () => {
      renderWithProviders(<CommunityNavigation />)
      const topTab = screen.getByText('Top').closest('a')
      expect(topTab).toHaveAttribute('href', '/c/technology/top')
    })

    it('should render Rising tab with correct link', () => {
      renderWithProviders(<CommunityNavigation />)
      const risingTab = screen.getByText('Rising').closest('a')
      expect(risingTab).toHaveAttribute('href', '/c/technology/rising')
    })

    it('should render tab descriptions as title attributes', () => {
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).toHaveAttribute('title', 'Popular posts right now')
    })

    it('should render icons for each tab', () => {
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      const icon = hotTab.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Active Tab Highlighting', () => {
    it('should highlight Hot tab when on main community path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology' })
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).toHaveClass('border-primary-trust', 'text-primary-trust')
    })

    it('should highlight New tab when on /new path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/new' })
      renderWithProviders(<CommunityNavigation />)
      const newTab = screen.getByText('New').closest('a')
      expect(newTab).toHaveClass('border-primary-trust', 'text-primary-trust')
    })

    it('should highlight Top tab when on /top path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/top' })
      renderWithProviders(<CommunityNavigation />)
      const topTab = screen.getByText('Top').closest('a')
      expect(topTab).toHaveClass('border-primary-trust', 'text-primary-trust')
    })

    it('should highlight Rising tab when on /rising path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/rising' })
      renderWithProviders(<CommunityNavigation />)
      const risingTab = screen.getByText('Rising').closest('a')
      expect(risingTab).toHaveClass('border-primary-trust', 'text-primary-trust')
    })

    it('should not highlight inactive tabs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/new' })
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).not.toHaveClass('border-primary-trust')
      expect(hotTab).toHaveClass('border-transparent')
    })

    it('should default to Hot tab when on unrecognized path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/unknown' })
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).toHaveClass('border-primary-trust', 'text-primary-trust')
    })
  })

  describe('Back Navigation', () => {
    it('should render back button', () => {
      renderWithProviders(<CommunityNavigation />)
      const backButton = screen.getByLabelText('Back to communities')
      expect(backButton).toBeInTheDocument()
    })

    it('should link back button to /communities', () => {
      renderWithProviders(<CommunityNavigation />)
      const backButton = screen.getByLabelText('Back to communities')
      expect(backButton).toHaveAttribute('href', '/communities')
    })

    it('should render ChevronLeft icon in back button', () => {
      renderWithProviders(<CommunityNavigation />)
      const backButton = screen.getByLabelText('Back to communities')
      const icon = backButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Join/Leave Button', () => {
    it('should render join button', () => {
      renderWithProviders(<CommunityNavigation />)
      const joinButton = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Joined' || btn.textContent === 'Join'
      )
      expect(joinButton).toBeInTheDocument()
    })

    it('should show "Joined" when community is joined', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getAllByText('Joined').length).toBeGreaterThan(0)
    })

    it('should apply correct classes when joined', () => {
      renderWithProviders(<CommunityNavigation />)
      const joinButton = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Joined'
      )
      expect(joinButton).toHaveClass('bg-primary-trust', 'text-white')
    })

    it('should be clickable', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommunityNavigation />)
      const joinButton = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Joined'
      )
      await user.click(joinButton)
      // Button should still be in document after click
      expect(joinButton).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render notification bell when community is joined', () => {
      renderWithProviders(<CommunityNavigation />)
      const buttons = screen.getAllByRole('button')
      const bellButton = buttons.find(btn => btn.querySelector('svg'))
      expect(bellButton).toBeInTheDocument()
    })

    it('should render more options button', () => {
      renderWithProviders(<CommunityNavigation />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should render create post button', () => {
      renderWithProviders(<CommunityNavigation />)
      const createButton = screen.getByText('Create Post').closest('a')
      expect(createButton).toBeInTheDocument()
    })

    it('should link create post button to submit page with community param', () => {
      renderWithProviders(<CommunityNavigation />)
      const createButton = screen.getByText('Create Post').closest('a')
      expect(createButton).toHaveAttribute('href', '/submit?community=technology')
    })

    it('should render Plus icon in create post button', () => {
      renderWithProviders(<CommunityNavigation />)
      const createButton = screen.getByText('Create Post').closest('a')
      const icon = createButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Moderator Tabs', () => {
    it('should not render moderator tabs when user is not moderator', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.queryByText('Mod Queue')).not.toBeInTheDocument()
      expect(screen.queryByText('Analytics')).not.toBeInTheDocument()
      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    })

    it('should not render separator when user is not moderator', () => {
      renderWithProviders(<CommunityNavigation />)
      const container = screen.getByText('Hot').closest('div').parentElement
      const separator = container.querySelector('.bg-secondary.w-px')
      expect(separator).not.toBeInTheDocument()
    })
  })

  describe('Mobile Quick Stats Bar', () => {
    it('should render mobile stats bar', () => {
      renderWithProviders(<CommunityNavigation />)
      const mobileBar = document.querySelector('.md\\:hidden')
      expect(mobileBar).toBeInTheDocument()
    })

    it('should display member count in mobile bar', () => {
      renderWithProviders(<CommunityNavigation />)
      const mobileBar = document.querySelector('.md\\:hidden')
      expect(within(mobileBar).getByText('125,400')).toBeInTheDocument()
      expect(within(mobileBar).getByText('members')).toBeInTheDocument()
    })

    it('should display online count in mobile bar', () => {
      renderWithProviders(<CommunityNavigation />)
      const mobileBar = document.querySelector('.md\\:hidden')
      expect(within(mobileBar).getByText('2,340')).toBeInTheDocument()
      expect(within(mobileBar).getByText('online')).toBeInTheDocument()
    })

    it('should display rules count in mobile bar', () => {
      renderWithProviders(<CommunityNavigation />)
      const mobileBar = document.querySelector('.md\\:hidden')
      expect(within(mobileBar).getByText('8')).toBeInTheDocument()
      expect(within(mobileBar).getByText('rules')).toBeInTheDocument()
    })

    it('should display tags in mobile bar', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('#tech')).toBeInTheDocument()
      expect(screen.getByText('#programming')).toBeInTheDocument()
    })

    it('should display only first 2 tags in mobile bar', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('#tech')).toBeInTheDocument()
      expect(screen.getByText('#programming')).toBeInTheDocument()
      expect(screen.queryByText('#innovation')).not.toBeInTheDocument()
    })
  })

  describe('Dynamic Community Name', () => {
    it('should use communityName from params', () => {
      mockUseParams.mockReturnValue({ communityName: 'gaming' })
      mockUseLocation.mockReturnValue({ pathname: '/c/gaming' })
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/gaming')).toBeInTheDocument()
    })

    it('should default to technology when no communityName in params', () => {
      mockUseParams.mockReturnValue({})
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })

    it('should update tab links based on community name', () => {
      mockUseParams.mockReturnValue({ communityName: 'gaming' })
      mockUseLocation.mockReturnValue({ pathname: '/c/gaming' })
      renderWithProviders(<CommunityNavigation />)
      const newTab = screen.getByText('New').closest('a')
      expect(newTab).toHaveAttribute('href', '/c/gaming/new')
    })

    it('should update create post link based on community name', () => {
      mockUseParams.mockReturnValue({ communityName: 'gaming' })
      mockUseLocation.mockReturnValue({ pathname: '/c/gaming' })
      renderWithProviders(<CommunityNavigation />)
      const createButton = screen.getByText('Create Post').closest('a')
      expect(createButton).toHaveAttribute('href', '/submit?community=gaming')
    })
  })

  describe('Styling and Classes', () => {
    it('should apply correct container classes', () => {
      renderWithProviders(<CommunityNavigation />)
      const container = document.querySelector('.bg-primary.border-b.border-secondary')
      expect(container).toBeInTheDocument()
    })

    it('should apply max-width constraint', () => {
      renderWithProviders(<CommunityNavigation />)
      const maxWidthContainer = document.querySelector('.max-w-7xl')
      expect(maxWidthContainer).toBeInTheDocument()
    })

    it('should apply hover styles to back button', () => {
      renderWithProviders(<CommunityNavigation />)
      const backButton = screen.getByLabelText('Back to communities')
      expect(backButton).toHaveClass('hover:bg-hover')
    })

    it('should apply transition classes to tabs', () => {
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab).toHaveClass('transition-all')
    })

    it('should apply gradient background to community icon', () => {
      renderWithProviders(<CommunityNavigation />)
      const icon = screen.getByText('T').closest('div')
      expect(icon).toHaveClass('bg-gradient-primary')
    })

    it('should apply shadow to create post button', () => {
      renderWithProviders(<CommunityNavigation />)
      const createButton = screen.getByText('Create Post').closest('a')
      expect(createButton).toHaveClass('shadow-lg')
    })

    it('should hide create post text on small screens', () => {
      renderWithProviders(<CommunityNavigation />)
      const createText = screen.getByText('Create Post')
      expect(createText).toHaveClass('hidden', 'sm:inline')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on back button', () => {
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByLabelText('Back to communities')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<CommunityNavigation />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('c/technology')
    })

    it('should have descriptive title attributes on tabs', () => {
      renderWithProviders(<CommunityNavigation />)
      const newTab = screen.getByText('New').closest('a')
      expect(newTab).toHaveAttribute('title', 'Latest posts')
    })

    it('should render all links as anchor elements', () => {
      renderWithProviders(<CommunityNavigation />)
      const hotTab = screen.getByText('Hot').closest('a')
      expect(hotTab.tagName).toBe('A')
    })

    it('should render all buttons as button elements', () => {
      renderWithProviders(<CommunityNavigation />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing communityName gracefully', () => {
      mockUseParams.mockReturnValue({})
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })

    it('should handle paths with trailing slashes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/' })
      renderWithProviders(<CommunityNavigation />)
      expect(screen.getByText('c/technology')).toBeInTheDocument()
    })

    it('should handle nested community paths', () => {
      mockUseLocation.mockReturnValue({ pathname: '/c/technology/new/page/2' })
      renderWithProviders(<CommunityNavigation />)
      const newTab = screen.getByText('New').closest('a')
      expect(newTab).toHaveClass('border-primary-trust')
    })

    it('should truncate long community names', () => {
      renderWithProviders(<CommunityNavigation />)
      const communityName = screen.getByText('c/technology')
      expect(communityName).toHaveClass('truncate')
    })
  })
})

export default mockNavigate
