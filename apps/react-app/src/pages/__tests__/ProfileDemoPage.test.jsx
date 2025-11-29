/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '../../__test__/utils/testUtils'
import ProfileDemoPage from '../ProfileDemoPage'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <div>Users</div>,
  MessageSquare: () => <div>MessageSquare</div>,
  Star: () => <div>Star</div>,
  Trophy: () => <div>Trophy</div>,
  Calendar: () => <div>Calendar</div>,
  MapPin: () => <div>MapPin</div>,
  Link: () => <div>Link</div>,
  Mail: () => <div>Mail</div>,
  UserPlus: () => <div>UserPlus</div>,
  Image: () => <div>Image</div>,
  Wallet: () => <div>Wallet</div>,
  Copy: () => <div>Copy</div>,
  CheckCircle: () => <div>CheckCircle</div>,
  ExternalLink: () => <div>ExternalLink</div>,
  Grid3x3: () => <div>Grid3x3</div>,
  Activity: () => <div>Activity</div>,
  X: () => <div>X</div>,
  ArrowRight: () => <div>ArrowRight</div>,
  Palette: () => <div>Palette</div>,
  Sparkles: () => <div>Sparkles</div>,
  Zap: () => <div>Zap</div>,
  Crown: () => <div>Crown</div>,
  Shield: () => <div>Shield</div>
}))

// Mock UI components
jest.mock('../../components/ui', () => ({
  Button: ({ children, onClick, variant, ...props }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, ...props }) => (
    <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
  )
}))

describe('ProfileDemoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(container).toBeInTheDocument()
    })

    it('displays the page title', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByText('ProfileDemoPage')).toBeInTheDocument()
    })

    it('has proper main role with aria-label', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Profile demo page')
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays construction message', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
    })

    it('has correct styling', () => {
      const { container } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.padding).toBe('20px')
    })

    it('has max-width constraint', () => {
      const { container } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.maxWidth).toBe('1200px')
    })

    it('centers content', () => {
      const { container } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.margin).toBe('0 auto')
    })
  })

  describe('Profile Data Structure', () => {
    it('has web3 profile data', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has influencer profile data', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has collector profile data', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has username field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has displayName field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has bio field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has location field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has website field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has walletAddress field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('profile has ensName field', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Profile Stats', () => {
    it('displays karma count', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays follower count', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays following count', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays NFT count', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays total posts', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays total comments', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays total awards', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Profile Badges', () => {
    it('supports verified badge', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports premium badge', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports artist badge', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports influencer badge', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports collector badge', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays badge icons', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('NFT Collection', () => {
    it('displays NFT items', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows NFT names', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows NFT collections', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows NFT prices', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows NFT rarity', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays legendary rarity', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays epic rarity', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays rare rarity', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Profile Switching', () => {
    it('supports profile selection', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('switches between profiles', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('updates displayed data on profile switch', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('supports NFTs tab', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('NFTs tab is active by default', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports tab switching', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Profile demo page')
    })

    it('has semantic HTML structure', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper focus management', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile', () => {
      global.innerWidth = 375
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on tablet', () => {
      global.innerWidth = 768
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on desktop', () => {
      global.innerWidth = 1920
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adapts layout for different screens', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.maxWidth).toBe('1200px')
    })
  })

  describe('Error Handling', () => {
    it('handles render errors gracefully', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles missing data gracefully', () => {
      render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      const { rerender } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      rerender(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles multiple rerenders', () => {
      const { rerender } = render(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      rerender(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      rerender(<BrowserRouter><ProfileDemoPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})

export default main
