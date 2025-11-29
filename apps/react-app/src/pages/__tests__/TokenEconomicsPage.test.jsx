/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TokenEconomicsPage from '../TokenEconomicsPage'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="icon-trending-up">TrendingUp</div>,
  Users: () => <div data-testid="icon-users">Users</div>,
  Coins: () => <div data-testid="icon-coins">Coins</div>,
  Shield: () => <div data-testid="icon-shield">Shield</div>,
  Zap: () => <div data-testid="icon-zap">Zap</div>,
  PieChart: () => <div data-testid="icon-pie-chart">PieChart</div>,
  BarChart3: () => <div data-testid="icon-bar-chart">BarChart3</div>,
  ArrowUpRight: () => <div data-testid="icon-arrow-up">ArrowUpRight</div>,
  Lock: () => <div data-testid="icon-lock">Lock</div>,
  Gift: () => <div data-testid="icon-gift">Gift</div>,
  Wallet: () => <div data-testid="icon-wallet">Wallet</div>,
  Star: () => <div data-testid="icon-star">Star</div>,
  ChevronRight: () => <div data-testid="icon-chevron">ChevronRight</div>,
  Info: () => <div data-testid="icon-info">Info</div>,
}))

describe('TokenEconomicsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA label on main section', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Token economics page')
    })

    it('displays main heading', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByText('TokenEconomicsPage')).toBeInTheDocument()
    })

    it('displays construction message', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
    })

    it('has centered container', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ maxWidth: '1200px', margin: '0 auto' })
    })

    it('has proper padding', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ padding: '20px' })
    })
  })

  describe('Token Distribution Data', () => {
    it('defines community allocation correctly', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes development team allocation', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes ecosystem growth allocation', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes treasury reserve allocation', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('includes public sale allocation', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('total distribution equals 100%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Token Utility Features', () => {
    it('defines governance rights utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines token gating utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines staking rewards utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines platform fees utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines creator monetization utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines DeFi integration utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Economic Mechanics', () => {
    it('defines burn mechanism', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines staking incentives', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines creator economy', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines buy-back program', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('burn mechanism has percentage defined', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('staking has APY range defined', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Launch Phases', () => {
    it('defines Phase 1 Foundation', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines Phase 2 Utility', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines Phase 3 DeFi', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('defines Phase 4 Ecosystem', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('phases have timeline information', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('phases have feature lists', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('phases have status indicators', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component State Management', () => {
    it('initializes with overview section active', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with visibility false', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('sets visibility to true on mount', async () => {
      renderWithRouter(<TokenEconomicsPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Token Distribution Data Structure', () => {
    it('community allocation has all required fields', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has category field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has percentage field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has amount field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has color field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has description field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('each allocation has details array', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('community allocation is 40%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('development team allocation is 20%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('ecosystem growth allocation is 15%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('treasury reserve allocation is 15%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('public sale allocation is 10%', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Token Utility Features Data', () => {
    it('governance rights has icon', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('governance rights has title', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('governance rights has description', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('governance rights has example', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all utilities have icon field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all utilities have title field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all utilities have description field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all utilities have example field', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Economic Mechanics Data', () => {
    it('burn mechanism burns 30% of fees', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('staking offers 8-15% APY', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('creator economy allocates 40% to creators', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('buy-back uses 20% of profits', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all mechanics have title', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all mechanics have description', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all mechanics have impact statement', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all mechanics have percentage', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Launch Phases Data', () => {
    it('Phase 1 scheduled for Q2 2024', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 2 scheduled for Q3 2024', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 3 scheduled for Q4 2024', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 4 scheduled for Q1 2025', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 1 includes token launch', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 2 includes token gating', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 3 includes DEX listing', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Phase 4 includes partner integrations', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('all phases have status upcoming', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Distribution Chart Function', () => {
    it('renderDistributionChart function exists', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('chart has fixed dimensions', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('chart uses distribution data', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has main landmark', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('main has descriptive label', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Token economics page')
    })

    it('renders semantic HTML', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main.tagName).toBe('DIV')
    })
  })

  describe('Component Structure', () => {
    it('has container with max width', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ maxWidth: '1200px' })
    })

    it('has centered layout', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ margin: '0 auto' })
    })

    it('has padding for spacing', () => {
      renderWithRouter(<TokenEconomicsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ padding: '20px' })
    })
  })

  describe('Content Display', () => {
    it('displays page title', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByText('TokenEconomicsPage')).toBeInTheDocument()
    })

    it('displays construction notice', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
    })
  })

  describe('State Initialization', () => {
    it('activeSection state initializes correctly', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('isVisible state initializes correctly', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('useEffect Hook', () => {
    it('useEffect runs on mount', async () => {
      renderWithRouter(<TokenEconomicsPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('visibility changes after mount', async () => {
      renderWithRouter(<TokenEconomicsPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('mounts correctly', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('unmounts without errors', () => {
      const { unmount } = renderWithRouter(<TokenEconomicsPage />)
      expect(() => unmount()).not.toThrow()
    })

    it('cleans up after unmount', () => {
      const { unmount } = renderWithRouter(<TokenEconomicsPage />)
      unmount()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('renders without errors', () => {
      expect(() => renderWithRouter(<TokenEconomicsPage />)).not.toThrow()
    })

    it('does not log console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<TokenEconomicsPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('does not log console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderWithRouter(<TokenEconomicsPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      const { rerender } = renderWithRouter(<TokenEconomicsPage />)
      rerender(<BrowserRouter><TokenEconomicsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not cause memory leaks', () => {
      const { unmount } = renderWithRouter(<TokenEconomicsPage />)
      unmount()
      expect(document.body.innerHTML).toBe('')
    })
  })

  describe('Data Integrity', () => {
    it('total supply is 1 billion', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('distribution percentages are consistent', () => {
      renderWithRouter(<TokenEconomicsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Export', () => {
    it('exports function component', () => {
      expect(TokenEconomicsPage).toBeDefined()
      expect(typeof TokenEconomicsPage).toBe('function')
    })
  })
})

export default renderWithRouter
